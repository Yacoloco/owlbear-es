import OBR from "@owlbear-rodeo/sdk";
import { ID, STATE_KEY, LIBRARY_KEY, CHANNELS, parseYouTube } from "./shared.js";

/*
 * Estado compartido (metadata de la sala), un objeto por canal:
 * { channels: { musica: {...}, ambiente: {...} } }
 * Cada canal: { kind: "playlist" | "video", id, name, index, track, startedAt, paused, pausedAt, shuffle, gain, rev }
 *  - track: contador que sube cada vez que empieza un tema nuevo (o se reinicia).
 *  - startedAt: Date.now() del momento en que el tema actual habría estado en 0:00.
 *  - gain: volumen del canal que elige el DM (0-100); se multiplica por el volumen local de cada uno.
 * El DM decide qué suena; cada navegador reproduce lo mismo y corrige la posición si se desfasa.
 */

const $ = (id) => document.getElementById(id);
const LOCAL_KEY = `${ID}/local`;
const DRIFT_SECONDS = 4;

let isGM = false;
let library = [];
const local = loadLocal();
const channels = {};

function loadLocal() {
  try {
    return { volume: 60, muted: false, ...JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") };
  } catch {
    return { volume: 60, muted: false };
  }
}
function saveLocal() {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(local)); } catch { /* sin almacenamiento */ }
}

const fmt = (sec) => {
  const t = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const ss = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

/** Pinta la parte "llena" de un slider (variable CSS --p). */
function paintRange(el) {
  const min = Number(el.min) || 0;
  const max = Number(el.max) || 100;
  const p = max > min ? ((Number(el.value) - min) / (max - min)) * 100 : 0;
  el.style.setProperty("--p", `${Math.max(0, Math.min(100, p))}%`);
}
document.addEventListener("input", (e) => {
  if (e.target instanceof HTMLInputElement && e.target.type === "range") paintRange(e.target);
});
setInterval(() => document.querySelectorAll('input[type="range"]').forEach(paintRange), 500);

const elapsed = (s) => (s.paused ? s.pausedAt || 0 : Math.max(0, (Date.now() - s.startedAt) / 1000));
const sourceKey = (s) => (s && s.id ? `${s.kind}:${s.id}:${s.vid || ""}:${s.index || 0}:${s.track || 0}` : "none");

async function writeChannel(chId, patch) {
  const meta = await OBR.room.getMetadata();
  const current = (meta[STATE_KEY] && meta[STATE_KEY].channels) || {};
  const prev = current[chId] || channels[chId].state || {};
  const next = { ...prev, ...patch, rev: (prev.rev || 0) + 1 };
  channels[chId].state = next;
  await OBR.room.setMetadata({ [STATE_KEY]: { channels: { ...current, [chId]: next } } });
  return next;
}

async function writeLibrary(items) {
  library = items;
  renderLibrary();
  await OBR.room.setMetadata({ [LIBRARY_KEY]: items });
}

// ---------------- YouTube ----------------

function loadYouTubeApi() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = () => resolve();
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
}

const YTS = () => window.YT.PlayerState;

class Channel {
  constructor(def) {
    this.id = def.id;
    this.label = def.label;
    this.icon = def.icon;
    this.state = null;
    this.player = null;
    this.ready = false;
    this.applying = false;
    this.appliedKey = null;
    this.buildUi();
  }

  buildUi() {
    const el = document.createElement("div");
    el.className = `channel ${this.id}`;
    el.innerHTML = `
      <h3>${this.icon} ${this.label}</h3>
      <div class="player-wrap"><div id="yt-${this.id}"></div><div class="tap hidden">👆 Tocá el video una vez<br>para activar el sonido</div></div>
      <div class="title">—</div>
      <div class="sub"></div>
      <div class="seek"><span class="t-cur">0:00</span><input type="range" min="0" max="100" step="1" value="0" disabled><span class="t-dur">0:00</span></div>
      <div class="ctrl gm-only hidden">
        <button data-a="prev" title="Anterior">⏮</button>
        <button data-a="pause" title="Pausa / Reproducir">⏯</button>
        <button data-a="next" title="Siguiente">⏭</button>
        <button data-a="shuffle" class="toggle" title="Aleatorio">🔀</button>
        <button data-a="stop" title="Parar">⏹</button>
      </div>
      <label class="gain gm-only hidden" title="Volumen de este canal para todos">Mezcla <input type="range" min="0" max="100" value="100"></label>`;
    $("channels").appendChild(el);
    this.el = el;
    this.titleEl = el.querySelector(".title");
    this.subEl = el.querySelector(".sub");
    this.gainEl = el.querySelector(".gain input");
    this.tapEl = el.querySelector(".tap");
    this.unlocked = false;
    this.seekEl = el.querySelector(".seek input");
    this.curEl = el.querySelector(".t-cur");
    this.durEl = el.querySelector(".t-dur");
    this.seeking = false;
    this.seekEl.addEventListener("input", () => {
      this.seeking = true;
      this.curEl.textContent = fmt(Number(this.seekEl.value));
    });
    this.seekEl.addEventListener("change", () => {
      this.seeking = false;
      this.gmSeek(Number(this.seekEl.value));
    });
    el.querySelector('[data-a="prev"]').onclick = () => this.gmStep(-1);
    el.querySelector('[data-a="next"]').onclick = () => this.gmStep(1);
    el.querySelector('[data-a="pause"]').onclick = () => this.gmTogglePause();
    el.querySelector('[data-a="shuffle"]').onclick = async () => {
      await writeChannel(this.id, { shuffle: !(this.state && this.state.shuffle) });
      this.render();
    };
    el.querySelector('[data-a="stop"]').onclick = async () => {
      await writeChannel(this.id, { id: null, kind: null, name: "", paused: false });
      this.apply(true);
      renderLibrary();
    };
    let gainTimer = null;
    this.gainEl.addEventListener("input", () => {
      const gain = Number(this.gainEl.value);
      if (this.state) this.state.gain = gain;
      this.applyVolume();
      clearTimeout(gainTimer);
      gainTimer = setTimeout(() => writeChannel(this.id, { gain }), 400);
    });
  }

  createPlayer() {
    return new Promise((resolve) => {
      this.player = new window.YT.Player(`yt-${this.id}`, {
        width: "100%",
        height: "100%",
        playerVars: { playsinline: 1, controls: 1, rel: 0, modestbranding: 1, origin: location.origin },
        events: {
          onReady: () => { this.ready = true; this.applyVolume(); resolve(); },
          onStateChange: (e) => this.onPlayerState(e),
          onError: (e) => this.onPlayerError(e),
        },
      });
    });
  }

  applyVolume() {
    if (!this.ready) return;
    const gain = this.state && typeof this.state.gain === "number" ? this.state.gain : 100;
    this.player.setVolume(Math.round((local.volume * gain) / 100));
    if (local.muted) this.player.mute(); else this.player.unMute();
    if (document.activeElement !== this.gainEl) this.gainEl.value = gain;
  }

  /**
   * Bucle sin cortes: un instante antes de que termine el tema volvemos a 0:00,
   * así YouTube nunca llega a pasar al tema siguiente de la playlist.
   */
  guardLoop() {
    const s = this.state;
    if (!this.ready || !s || !s.id || s.paused) return;
    let ps;
    try { ps = this.player.getPlayerState(); } catch { return; }
    if (ps !== YTS().PLAYING) return;
    const d = this.player.getDuration() || 0;
    const pos = this.player.getCurrentTime() || 0;
    if (d > 3 && pos >= d - 1) {
      this.player.seekTo(0, true);
      this.player.playVideo();
    }
  }

  /** Segundo en el que debería estar el tema (con bucle). */
  target() {
    const s = this.state;
    if (!s) return 0;
    const t = elapsed(s);
    let d = s.duration || 0;
    try { d = this.player.getDuration() || d; } catch { /* nada */ }
    return d > 1 ? t % d : t;
  }

  /** Cantidad de temas de la playlist (la lista de ids viaja en el estado). */
  length() { return (this.state && Array.isArray(this.state.ids) && this.state.ids.length) || 0; }

  /** Video que hay que reproducir ahora. */
  videoId() {
    const s = this.state;
    if (!s || !s.id) return null;
    if (s.kind === "video") return s.id;
    return s.vid || (Array.isArray(s.ids) ? s.ids[s.index || 0] : null);
  }

  /** Lleva el reproductor al estado compartido. */
  apply(force = false) {
    if (!this.ready) return;
    this.render();
    this.applyVolume();
    const s = this.state;
    if (!s || !s.id) {
      this.appliedKey = "none";
      try { this.player.stopVideo(); } catch { /* nada */ }
      return;
    }
    const key = sourceKey(s);
    if (force || key !== this.appliedKey) {
      this.appliedKey = key;
      this.applying = true;
      let start = Math.floor(elapsed(s));
      if (s.duration > 0) start = start % Math.floor(s.duration);
      const vid = this.videoId();
      if (vid) {
        this.player.loadVideoById({ videoId: vid, startSeconds: start });
      } else if (isGM && s.kind === "playlist") {
        // Estado de una versión anterior (sin la lista de temas): la completamos.
        getPlaylistIds(s.id).then((ids) => {
          if (!ids.length) return;
          writeChannel(this.id, { ids, vid: ids[s.index || 0] || ids[0] }).then(() => this.apply(true));
        });
      }
      setTimeout(() => { this.applying = false; }, 3000);
    }
    if (s.paused) {
      setTimeout(() => { try { this.player.pauseVideo(); } catch { /* nada */ } }, 400);
    } else {
      setTimeout(() => this.checkBlocked(), 1500);
    }
  }

  checkBlocked() {
    const s = this.state;
    if (!s || !s.id || s.paused || !this.ready) return;
    const ps = this.player.getPlayerState();
    if (ps !== YTS().PLAYING && ps !== YTS().BUFFERING) this.showTap();
  }

  /** Corrección periódica de tema, pausa y posición. */
  tick() {
    const s = this.state;
    if (!this.ready || !s || !s.id || this.applying) return;
    const ps = this.player.getPlayerState();
    if (s.paused) {
      if (ps === YTS().PLAYING) this.player.pauseVideo();
      return;
    }
    let loaded = null;
    try { loaded = this.player.getVideoData().video_id; } catch { /* nada */ }
    if (loaded && this.videoId() && loaded !== this.videoId()) {
      this.apply(true);
      return;
    }
    if (ps === YTS().PLAYING) {
      const duration = this.player.getDuration() || 0;
      const target = duration > 0 ? elapsed(s) % duration : elapsed(s);
      const pos = this.player.getCurrentTime() || 0;
      const nearSeam = duration > 0 && ((target < 3 && pos > duration - 3) || (pos < 3 && target > duration - 3));
      if (duration > 0 && !nearSeam && Math.abs(pos - target) > DRIFT_SECONDS) {
        this.player.seekTo(target, true);
      }
    } else if (ps === YTS().PAUSED || ps === YTS().CUED || ps === -1) {
      if (this.unlocked) this.player.playVideo(); else this.showTap();
    }
  }

  async onPlayerState(e) {
    this.render();
    if (e.data === YTS().PLAYING) {
      this.unlocked = true;
      this.hideTap();
    }
    const s = this.state;
    if (!s || !s.id) return;
    // Bucle: si igual llegó al final, vuelve a empezar el mismo tema (cada uno en su navegador).
    if (e.data === YTS().ENDED) {
      this.player.seekTo(0, true);
      this.player.playVideo();
      return;
    }
    if (isGM && e.data === YTS().PLAYING && !this.applying) {
      const d = Math.floor(this.player.getDuration() || 0);
      if (d > 0 && d !== s.duration) writeChannel(this.id, { duration: d });
    }
  }

  onPlayerError(e) {
    const msgs = {
      2: "El link no es válido.",
      5: "YouTube no pudo reproducir este video acá.",
      100: "El video no existe o es privado.",
      101: "El dueño de este video no permite reproducirlo fuera de YouTube.",
      150: "El dueño de este video no permite reproducirlo fuera de YouTube.",
    };
    if (!isGM) return;
    const msg = msgs[e.data] || "YouTube dio un error al reproducir.";
    const canSkip = this.state && this.state.kind === "playlist";
    OBR.notification.show(`${this.icon} ${this.label}: ${msg}${canSkip ? " Paso al siguiente…" : ""}`, "WARNING");
    if (canSkip) setTimeout(() => this.gmStep(1), 1500);
  }

  randomIndex() {
    const n = this.length() || 1;
    let pick = Math.floor(Math.random() * n);
    if (n > 1 && pick === ((this.state && this.state.index) || 0)) pick = (pick + 1) % n;
    return pick;
  }

  render() {
    const s = this.state;
    this.el.querySelector('[data-a="shuffle"]').classList.toggle("on", Boolean(s && s.shuffle));
    if (!s || !s.id) {
      this.titleEl.textContent = "En silencio";
      this.subEl.textContent = "";
      return;
    }
    let title = "";
    try { title = (this.ready && this.player.getVideoData().title) || ""; } catch { /* nada */ }
    this.titleEl.textContent = title || s.name || "Cargando…";
    this.titleEl.title = title;
    const parts = [];
    if (s.name) parts.push(s.name);
    if (s.kind === "playlist") {
      const n = this.length();
      parts.push(n ? `${(s.index || 0) + 1}/${n}` : "lista");
    }
    parts.push("🔁");
    if (s.paused) parts.push("⏸");
    this.subEl.textContent = parts.join(" · ");
  }

  /*
   * El navegador no deja que un video empiece con sonido si nunca hiciste click
   * adentro de ESE video. Por eso, la primera vez de cada sesión mostramos un aviso
   * encima del video: el click atraviesa el aviso y le llega a YouTube.
   */
  showTap() {
    if (this.unlocked) return;
    this.tapEl.classList.remove("hidden");
  }
  hideTap() { this.tapEl.classList.add("hidden"); }

  /** Intenta arrancar; si el navegador lo bloquea, aparece el aviso enseguida. */
  tryPlay() {
    try { this.player.playVideo(); } catch { /* nada */ }
    setTimeout(() => this.checkBlocked(), 1200);
  }

  // ----- Acciones del DM -----

  async gmPlaySource(parsed, name, index = 0) {
    const s = this.state || {};
    let ids = [];
    if (parsed.kind === "playlist") {
      ids = await getPlaylistIds(parsed.id);
      if (!ids.length) {
        OBR.notification.show(`${this.icon} No pude leer esa playlist. ¿Es pública u oculta?`, "ERROR");
        return;
      }
      if (index === 0 && parsed.video && ids.includes(parsed.video)) index = ids.indexOf(parsed.video);
    }
    await writeChannel(this.id, {
      kind: parsed.kind, id: parsed.id, name: name || "", index, track: (s.track || 0) + 1, duration: 0,
      ids: parsed.kind === "playlist" ? ids : null, vid: parsed.kind === "playlist" ? ids[index] : parsed.id,
      startedAt: Date.now(), paused: false, pausedAt: 0,
    });
    this.apply(true);
    renderLibrary();
  }

  async gmPlayIndex(index) {
    const s = this.state || {};
    const vid = Array.isArray(s.ids) ? s.ids[index] : s.vid;
    await writeChannel(this.id, { index, vid, track: (s.track || 0) + 1, duration: 0, startedAt: Date.now(), paused: false, pausedAt: 0 });
    this.apply(true);
    renderTracks();
  }

  async restart() {
    const s = this.state || {};
    await writeChannel(this.id, { track: (s.track || 0) + 1, startedAt: Date.now(), paused: false, pausedAt: 0 });
    this.apply(true);
  }

  async gmStep(step) {
    const s = this.state;
    if (!s || !s.id) return;
    if (s.kind === "video") return this.restart();
    const n = this.length() || 1;
    const idx = s.shuffle && step > 0 ? this.randomIndex() : ((s.index || 0) + step + n) % n;
    await this.gmPlayIndex(idx);
  }

  async gmSeek(seconds) {
    const s = this.state;
    if (!s || !s.id) return;
    const t = Math.max(0, seconds);
    if (s.paused) {
      await writeChannel(this.id, { pausedAt: t });
    } else {
      await writeChannel(this.id, { startedAt: Date.now() - t * 1000 });
    }
    try { this.player.seekTo(t, true); } catch { /* nada */ }
    this.updateSeek();
  }

  updateSeek() {
    const s = this.state;
    const active = Boolean(s && s.id && this.ready);
    this.seekEl.disabled = !active || !isGM;
    if (!active) {
      this.seekEl.value = 0;
      this.curEl.textContent = "0:00";
      this.durEl.textContent = "0:00";
      return;
    }
    let d = 0;
    let pos = 0;
    try { d = this.player.getDuration() || 0; pos = this.player.getCurrentTime() || 0; } catch { /* nada */ }
    this.seekEl.max = Math.max(1, Math.floor(d));
    this.durEl.textContent = fmt(d);
    if (!this.seeking) {
      this.seekEl.value = Math.floor(pos);
      this.curEl.textContent = fmt(pos);
    }
  }

  async gmTogglePause() {
    const s = this.state;
    if (!s || !s.id) return;
    if (s.paused) {
      await writeChannel(this.id, { paused: false, startedAt: Date.now() - (s.pausedAt || 0) * 1000 });
      this.tryPlay();
    } else {
      await writeChannel(this.id, { paused: true, pausedAt: elapsed(s) });
      this.player.pauseVideo();
    }
    this.render();
  }

  /** Llega un estado nuevo desde la sala. */
  receive(incoming) {
    const prev = this.state;
    if (incoming && prev && incoming.rev === prev.rev) return; // es nuestro propio cambio
    this.state = incoming || null;
    if (!this.ready) return;
    const s = this.state;
    if (s && s.id && sourceKey(s) === this.appliedKey) {
      // Mismo tema: solo cambió la pausa, la mezcla o el aleatorio.
      if (s.paused && !(prev && prev.paused)) this.player.pauseVideo();
      if (!s.paused && prev && prev.paused) { this.player.seekTo(this.target(), true); this.player.playVideo(); }
      if (s.paused && prev && prev.paused && s.pausedAt !== prev.pausedAt) this.player.seekTo(s.pausedAt || 0, true);
      if (!s.paused && prev && !prev.paused && s.startedAt !== prev.startedAt) this.player.seekTo(this.target(), true);
      this.applyVolume();
      this.render();
    } else {
      this.apply();
    }
  }
}

// ---------------- Explorador de playlists ----------------

let explorerReady = null;
let browsing = null; // { item, parsed, ids }
const titleCache = new Map();

function getExplorer() {
  if (explorerReady) return explorerReady;
  explorerReady = new Promise((resolve) => {
    const ex = new window.YT.Player("explorer", {
      width: "200", height: "113",
      playerVars: { playsinline: 1, origin: location.origin },
      events: { onReady: () => resolve(ex) },
    });
  });
  return explorerReady;
}

function fetchTitle(videoId) {
  if (titleCache.has(videoId)) return titleCache.get(videoId);
  const watch = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
  const p = fetch(`https://www.youtube.com/oembed?format=json&url=${watch}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => (j && j.title) || null)
    .catch(() => null)
    .then((t) => t || fetch(`https://noembed.com/embed?url=${watch}`)
      .then((r) => r.json()).then((j) => j.title || null).catch(() => null));
  titleCache.set(videoId, p);
  return p;
}

const idsCache = new Map();
async function getPlaylistIds(listId) {
  if (idsCache.has(listId)) return idsCache.get(listId);
  const ex = await getExplorer();
  const ids = await new Promise((resolve) => {
    let tries = 0;
    ex.cuePlaylist({ list: listId, listType: "playlist" });
    const t = setInterval(() => {
      tries++;
      let list = null;
      try { list = ex.getPlaylist(); } catch { /* todavía no */ }
      if (list && list.length) { clearInterval(t); resolve(list); }
      else if (tries > 30) { clearInterval(t); resolve([]); }
    }, 300);
  });
  if (ids.length) idsCache.set(listId, ids);
  return ids;
}

async function openBrowser(item) {
  const parsed = parseYouTube(item.url);
  if (!parsed || parsed.kind !== "playlist") return;
  $("gm-library").classList.add("hidden");
  $("browser").classList.remove("hidden");
  $("browser-title").textContent = item.name;
  $("browser-filter").value = "";
  $("tracks").innerHTML = "";
  $("browser-status").textContent = "Cargando temas…";
  browsing = { item, parsed, ids: [] };

  const ids = await getPlaylistIds(parsed.id);
  if (!browsing || browsing.parsed.id !== parsed.id) return;
  browsing.ids = ids;
  $("browser-status").textContent = ids.length
    ? `${ids.length} temas. 🎵 = Música · 🌧️ = Ambiente.`
    : "No pude leer los temas. ¿La playlist es pública u oculta?";
  renderTracks();
}

function renderTracks() {
  if (!browsing || !browsing.ids.length) return;
  const ul = $("tracks");
  const filter = $("browser-filter").value.trim().toLowerCase();
  ul.innerHTML = "";
  browsing.ids.forEach((vid, i) => {
    const li = document.createElement("li");
    for (const ch of Object.values(channels)) {
      const s = ch.state;
      if (s && s.kind === "playlist" && s.id === browsing.parsed.id && (s.index || 0) === i) li.classList.add("current");
    }
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = i + 1;
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`;
    img.alt = "";
    const name = document.createElement("span");
    name.className = "tname";
    name.textContent = "…";
    fetchTitle(vid).then((t) => {
      name.textContent = t || `Tema ${i + 1}`;
      name.title = name.textContent;
      li.classList.toggle("hidden", Boolean(filter) && !name.textContent.toLowerCase().includes(filter));
    });
    li.append(num, img, name);
    for (const ch of Object.values(channels)) {
      const b = document.createElement("button");
      b.textContent = ch.icon;
      b.title = `Poner en ${ch.label}`;
      b.onclick = () => ch.gmPlaySource(browsing.parsed, browsing.item.name, i).then(renderTracks);
      li.appendChild(b);
    }
    ul.appendChild(li);
  });
}

// ---------------- Biblioteca ----------------

function renderLibrary() {
  const ul = $("list");
  ul.innerHTML = "";
  library.forEach((item, i) => {
    const parsed = parseYouTube(item.url);
    const li = document.createElement("li");
    if (parsed && Object.values(channels).some((c) => c.state && c.state.id === parsed.id)) li.classList.add("current");
    const name = document.createElement("span");
    name.className = "name";
    const isList = parsed && parsed.kind === "playlist";
    name.textContent = isList ? `📂 ${item.name}` : item.name;
    name.title = isList ? "Ver los temas" : item.url;
    if (isList) name.onclick = () => openBrowser(item);
    const kind = document.createElement("span");
    kind.className = "kind";
    kind.textContent = isList ? "lista" : "video";
    li.append(name, kind);
    for (const ch of Object.values(channels)) {
      const b = document.createElement("button");
      b.textContent = ch.icon;
      b.title = isList ? `Poner la lista entera en ${ch.label}` : `Poner en ${ch.label}`;
      b.onclick = () => {
        if (!parsed) return OBR.notification.show("🎵 Ese link no parece de YouTube.", "ERROR");
        ch.gmPlaySource(parsed, item.name, 0);
      };
      li.appendChild(b);
    }
    const up = document.createElement("button");
    up.textContent = "↑";
    up.title = "Subir";
    up.onclick = () => {
      if (i === 0) return;
      const copy = [...library];
      [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
      writeLibrary(copy);
    };
    const del = document.createElement("button");
    del.textContent = "✕";
    del.title = "Borrar";
    del.onclick = () => writeLibrary(library.filter((_, j) => j !== i));
    li.append(up, del);
    ul.appendChild(li);
  });
}

// ---------------- General ----------------


function applyLocalVolume() {
  $("mute").textContent = local.muted || local.volume === 0 ? "🔇" : "🔈";
  $("vol").value = local.volume;
  for (const ch of Object.values(channels)) ch.applyVolume();
}

function bindUi() {
  $("vol").addEventListener("input", (e) => {
    local.volume = Number(e.target.value);
    if (local.volume > 0) local.muted = false;
    saveLocal();
    applyLocalVolume();
  });
  $("mute").onclick = () => { local.muted = !local.muted; saveLocal(); applyLocalVolume(); };
  $("add-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = $("add-url").value.trim();
    const parsed = parseYouTube(url);
    if (!parsed) {
      OBR.notification.show("🎵 Ese link no parece de YouTube.", "ERROR");
      return;
    }
    const name = $("add-name").value.trim() || (parsed.kind === "playlist" ? "Playlist" : "Video");
    await writeLibrary([...library, { name, url }]);
    $("add-url").value = "";
    $("add-name").value = "";
  });

  $("browser-back").onclick = () => {
    browsing = null;
    $("browser").classList.add("hidden");
    $("gm-library").classList.remove("hidden");
  };
  $("browser-filter").addEventListener("input", renderTracks);
}

function applyRole() {
  document.querySelectorAll(".gm-only").forEach((el) => el.classList.toggle("hidden", !isGM));
  if (!isGM) {
    $("gm-library").classList.add("hidden");
    $("browser").classList.add("hidden");
  } else if ($("browser").classList.contains("hidden")) {
    $("gm-library").classList.remove("hidden");
  }
  $("player-note").classList.toggle("hidden", isGM);
  Object.values(channels).forEach((c) => c.updateSeek && c.updateSeek());
}

OBR.onReady(async () => {
  try { sessionStorage.setItem("musica-abierta", "1"); } catch { /* nada */ }
  for (const def of CHANNELS) channels[def.id] = new Channel(def);
  bindUi();
  applyLocalVolume();

  isGM = (await OBR.player.getRole()) === "GM";
  const meta = await OBR.room.getMetadata();
  const st = meta[STATE_KEY] && meta[STATE_KEY].channels ? meta[STATE_KEY].channels : {};
  for (const ch of Object.values(channels)) ch.state = st[ch.id] || null;
  library = Array.isArray(meta[LIBRARY_KEY]) ? meta[LIBRARY_KEY] : [];
  applyRole();
  renderLibrary();

  OBR.player.onChange((p) => {
    const gm = p.role === "GM";
    if (gm !== isGM) { isGM = gm; applyRole(); }
  });

  OBR.room.onMetadataChange((m) => {
    library = Array.isArray(m[LIBRARY_KEY]) ? m[LIBRARY_KEY] : [];
    const incoming = m[STATE_KEY] && m[STATE_KEY].channels ? m[STATE_KEY].channels : {};
    for (const ch of Object.values(channels)) ch.receive(incoming[ch.id] || null);
    renderLibrary();
  });

  await loadYouTubeApi();
  for (const ch of Object.values(channels)) await ch.createPlayer();
  for (const ch of Object.values(channels)) ch.apply(true);
  setInterval(() => Object.values(channels).forEach((c) => c.tick()), 3000);
  setInterval(() => Object.values(channels).forEach((c) => c.render()), 4000);
  setInterval(() => Object.values(channels).forEach((c) => c.updateSeek()), 1000);
  setInterval(() => Object.values(channels).forEach((c) => c.guardLoop()), 200);
});
