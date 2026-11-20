import OBR from "@owlbear-rodeo/sdk";
import { ID, STATE_KEY, LIBRARY_KEY, parseYouTube } from "./shared.js";

/*
 * Estado compartido (metadata de la sala):
 * { kind: "playlist" | "video", id, name, index, startedAt, paused, pausedAt, shuffle, rev }
 *  - startedAt: Date.now() del momento en que habría empezado la pista actual en 0:00.
 *  - pausedAt: segundos transcurridos cuando se pausó.
 * El DM es la fuente de verdad: decide qué suena, cuándo pasa a la siguiente y si está en pausa.
 * Cada jugador reproduce lo mismo en su navegador y corrige la posición si se desfasa.
 */

const $ = (id) => document.getElementById(id);
const LOCAL_KEY = `${ID}/local`;
const DRIFT_SECONDS = 4;

let isGM = false;
let state = null;
let library = [];
let player = null;
let playerReady = false;
let applying = false; // estamos cambiando el reproductor por orden del estado
let lastAppliedKey = null;
let unlocked = false;

const local = loadLocal();

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

const elapsed = (s) => (s.paused ? s.pausedAt || 0 : Math.max(0, (Date.now() - s.startedAt) / 1000));
const stateKey = (s) => (s && s.id ? `${s.kind}:${s.id}:${s.index || 0}:${s.rev}` : "none");

async function writeState(patch) {
  const next = { ...(state || {}), ...patch, rev: ((state && state.rev) || 0) + 1 };
  state = next;
  await OBR.room.setMetadata({ [STATE_KEY]: next });
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

function createPlayer() {
  return new Promise((resolve) => {
    player = new window.YT.Player("yt", {
      width: "100%",
      height: "100%",
      playerVars: { playsinline: 1, controls: 1, rel: 0, modestbranding: 1, origin: location.origin },
      events: {
        onReady: () => { playerReady = true; applyVolume(); resolve(); },
        onStateChange: onPlayerState,
        onError: onPlayerError,
      },
    });
  });
}

function applyVolume() {
  if (!playerReady) return;
  player.setVolume(local.volume);
  if (local.muted) player.mute(); else player.unMute();
  $("mute").textContent = local.muted || local.volume === 0 ? "🔇" : "🔈";
  $("vol").value = local.volume;
}

function currentIndex() {
  try { return player.getPlaylistIndex(); } catch { return -1; }
}

function playlistLength() {
  try { return (player.getPlaylist() || []).length; } catch { return 0; }
}

/** Lleva el reproductor local al estado compartido. */
function applyState(force = false) {
  if (!playerReady) return;
  updateNowPlaying();
  if (!state || !state.id) {
    lastAppliedKey = "none";
    try { player.stopVideo(); } catch { /* nada */ }
    hideUnlock();
    return;
  }
  const key = stateKey(state);
  const start = Math.floor(elapsed(state));
  if (force || key !== lastAppliedKey) {
    lastAppliedKey = key;
    applying = true;
    if (state.kind === "playlist") {
      player.loadPlaylist({ list: state.id, listType: "playlist", index: state.index || 0, startSeconds: start });
    } else {
      player.loadVideoById({ videoId: state.id, startSeconds: start });
    }
    setTimeout(() => { applying = false; }, 2500);
  }
  if (state.paused) {
    setTimeout(() => { try { player.pauseVideo(); } catch { /* nada */ } }, 300);
  } else {
    checkAutoplaySoon();
  }
}

function checkAutoplaySoon() {
  setTimeout(() => {
    if (!state || !state.id || state.paused || !playerReady) return;
    const s = player.getPlayerState();
    const YTS = window.YT.PlayerState;
    if (s !== YTS.PLAYING && s !== YTS.BUFFERING) showUnlock();
  }, 3000);
}

function showUnlock() { if (!unlocked) $("unlock").classList.remove("hidden"); }
function hideUnlock() { $("unlock").classList.add("hidden"); }

/** Corrección periódica: posición, pista y pausa. */
function syncTick() {
  if (!playerReady || !state || !state.id) return;
  const YTS = window.YT.PlayerState;
  const ps = player.getPlayerState();

  if (state.paused) {
    if (ps === YTS.PLAYING) player.pauseVideo();
    return;
  }
  if (state.kind === "playlist" && !isGM) {
    const idx = currentIndex();
    const age = (Date.now() - state.startedAt) / 1000;
    if (idx >= 0 && idx !== (state.index || 0) && age > 5) {
      applying = true;
      player.playVideoAt(state.index || 0);
      setTimeout(() => { applying = false; }, 2500);
      return;
    }
  }
  if (ps === YTS.PLAYING) {
    const target = elapsed(state);
    const duration = player.getDuration() || 0;
    const pos = player.getCurrentTime() || 0;
    if (duration > 0 && target < duration - 2 && Math.abs(pos - target) > DRIFT_SECONDS) {
      player.seekTo(target, true);
    }
  } else if (ps === YTS.PAUSED || ps === YTS.CUED) {
    if (unlocked) player.playVideo(); else showUnlock();
  }
}

async function onPlayerState(e) {
  const YTS = window.YT.PlayerState;
  updateNowPlaying();
  if (e.data === YTS.PLAYING) {
    hideUnlock();
    unlocked = true;
  }
  if (!isGM || !state || !state.id) return;

  // El DM marca el ritmo: cuando YouTube cambia de pista, se lo cuenta a todos.
  if (e.data === YTS.PLAYING && state.kind === "playlist" && !applying) {
    const idx = currentIndex();
    if (idx >= 0 && idx !== (state.index || 0)) {
      if (state.shuffle) {
        const n = playlistLength();
        let pick = Math.floor(Math.random() * n);
        if (n > 1 && pick === (state.index || 0)) pick = (pick + 1) % n;
        await writeState({ index: pick, startedAt: Date.now(), paused: false });
        applyState(true);
      } else {
        await writeState({ index: idx, startedAt: Date.now(), paused: false });
        lastAppliedKey = stateKey(state);
      }
    }
  }
  if (e.data === YTS.ENDED) {
    if (state.kind === "video") {
      // Los videos sueltos se repiten (ideal para ambientes).
      await writeState({ startedAt: Date.now(), paused: false });
      applyState(true);
    } else {
      const n = playlistLength();
      if (n > 0 && (state.index || 0) >= n - 1 && !state.shuffle) {
        await writeState({ index: 0, startedAt: Date.now(), paused: false });
        applyState(true);
      }
    }
  }
}

function onPlayerError(e) {
  const msgs = {
    2: "El link no es válido.",
    5: "YouTube no pudo reproducir este video acá.",
    100: "El video no existe o es privado.",
    101: "El dueño de este video no permite reproducirlo fuera de YouTube.",
    150: "El dueño de este video no permite reproducirlo fuera de YouTube.",
  };
  const msg = msgs[e.data] || "YouTube dio un error al reproducir.";
  if (isGM) {
    OBR.notification.show(`🎵 ${msg} Saltando a la siguiente…`, "WARNING");
    if (state && state.kind === "playlist") setTimeout(() => gmNext(), 1500);
  }
}

// ---------------- Interfaz ----------------

function updateNowPlaying() {
  if (!state || !state.id) {
    $("now-title").textContent = "Nada por ahora";
    $("now-sub").textContent = isGM ? "Elegí una playlist de abajo." : "Cuando el DM ponga música, la vas a escuchar acá.";
    return;
  }
  let title = "";
  try { title = (player && playerReady && player.getVideoData().title) || ""; } catch { /* nada */ }
  $("now-title").textContent = title || state.name || "Cargando…";
  const parts = [];
  if (state.name && title) parts.push(state.name);
  if (state.kind === "playlist") {
    const n = playerReady ? playlistLength() : 0;
    parts.push(n ? `Tema ${(state.index || 0) + 1} de ${n}` : "Playlist");
  } else {
    parts.push("Video en bucle");
  }
  if (state.paused) parts.push("⏸ En pausa");
  if (state.shuffle) parts.push("🔀 Aleatorio");
  $("now-sub").textContent = parts.join(" · ");
  $("shuffle").classList.toggle("on", Boolean(state.shuffle));
  renderLibrary();
}

function renderLibrary() {
  const ul = $("list");
  ul.innerHTML = "";
  library.forEach((item, i) => {
    const li = document.createElement("li");
    const parsed = parseYouTube(item.url);
    if (state && parsed && state.id === parsed.id) li.classList.add("current");
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = item.name;
    name.title = item.url;
    const kind = document.createElement("span");
    kind.className = "kind";
    kind.textContent = parsed && parsed.kind === "playlist" ? "lista" : "video";
    const play = document.createElement("button");
    play.textContent = "▶";
    play.title = "Poner para todos";
    play.onclick = () => gmPlay(item.url, item.name);
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
    del.title = "Borrar de la lista";
    del.onclick = () => writeLibrary(library.filter((_, j) => j !== i));
    li.append(name, kind, play, up, del);
    ul.appendChild(li);
  });
}

async function gmPlay(url, name) {
  const parsed = parseYouTube(url);
  if (!parsed) {
    OBR.notification.show("🎵 Ese link no parece de YouTube.", "ERROR");
    return;
  }
  unlocked = true;
  await writeState({
    kind: parsed.kind, id: parsed.id, name: name || "", index: 0,
    startedAt: Date.now(), paused: false, pausedAt: 0, shuffle: state ? Boolean(state.shuffle) : false,
  });
  applyState(true);
  if (parsed.kind === "playlist" && parsed.video) {
    // Si el link apuntaba a un tema dentro de la lista, empezamos por ese.
    setTimeout(async () => {
      const list = playlistLength() ? player.getPlaylist() : [];
      const idx = list.indexOf(parsed.video);
      if (idx > 0) {
        await writeState({ index: idx, startedAt: Date.now() });
        applyState(true);
      }
    }, 2500);
  }
}

async function gmNext(step = 1) {
  if (!state || !state.id) return;
  if (state.kind === "video") {
    await writeState({ startedAt: Date.now(), paused: false });
    applyState(true);
    return;
  }
  const n = playlistLength() || 1;
  let idx;
  if (state.shuffle && step > 0) {
    idx = Math.floor(Math.random() * n);
    if (n > 1 && idx === (state.index || 0)) idx = (idx + 1) % n;
  } else {
    idx = ((state.index || 0) + step + n) % n;
  }
  await writeState({ index: idx, startedAt: Date.now(), paused: false, pausedAt: 0 });
  applyState(true);
}

async function gmTogglePause() {
  if (!state || !state.id) return;
  if (state.paused) {
    await writeState({ paused: false, startedAt: Date.now() - (state.pausedAt || 0) * 1000 });
    player.playVideo();
  } else {
    await writeState({ paused: true, pausedAt: elapsed(state) });
    player.pauseVideo();
  }
  updateNowPlaying();
}

function bindUi() {
  $("vol").addEventListener("input", (e) => {
    local.volume = Number(e.target.value);
    if (local.volume > 0) local.muted = false;
    saveLocal();
    applyVolume();
  });
  $("mute").onclick = () => { local.muted = !local.muted; saveLocal(); applyVolume(); };
  $("unlock").onclick = () => {
    unlocked = true;
    try { player.playVideo(); } catch { /* nada */ }
    setTimeout(() => {
      const YTS = window.YT.PlayerState;
      const ps = player.getPlayerState();
      if (ps === YTS.PLAYING || ps === YTS.BUFFERING) {
        hideUnlock();
        syncTick();
      } else {
        $("unlock").textContent = "👆 Tocá el ▶ del video";
      }
    }, 1500);
  };

  $("playpause").onclick = gmTogglePause;
  $("next").onclick = () => gmNext(1);
  $("prev").onclick = () => gmNext(-1);
  $("shuffle").onclick = async () => { await writeState({ shuffle: !(state && state.shuffle) }); updateNowPlaying(); };
  $("stop").onclick = async () => { await writeState({ id: null, kind: null, name: "", paused: false }); applyState(true); };

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
  $("play-now").onclick = () => {
    const url = $("add-url").value.trim();
    if (url) gmPlay(url, $("add-name").value.trim());
  };
}

function applyRole() {
  for (const id of ["gm-controls", "gm-library"]) $(id).classList.toggle("hidden", !isGM);
  $("player-note").classList.toggle("hidden", isGM);
  updateNowPlaying();
}

OBR.onReady(async () => {
  try { sessionStorage.setItem("musica-abierta", "1"); } catch { /* nada */ }
  bindUi();
  isGM = (await OBR.player.getRole()) === "GM";
  const meta = await OBR.room.getMetadata();
  state = meta[STATE_KEY] || null;
  library = Array.isArray(meta[LIBRARY_KEY]) ? meta[LIBRARY_KEY] : [];
  applyRole();
  renderLibrary();

  OBR.player.onChange(async (p) => {
    const gm = p.role === "GM";
    if (gm !== isGM) { isGM = gm; applyRole(); }
  });

  OBR.room.onMetadataChange((m) => {
    const incoming = m[STATE_KEY] || null;
    library = Array.isArray(m[LIBRARY_KEY]) ? m[LIBRARY_KEY] : [];
    renderLibrary();
    if (incoming && state && incoming.rev === state.rev) return; // es nuestro propio cambio
    const wasPaused = state && state.paused;
    state = incoming;
    if (playerReady && state && state.id && stateKey(state) === lastAppliedKey) {
      if (state.paused && !wasPaused) player.pauseVideo();
      if (!state.paused && wasPaused) { player.seekTo(elapsed(state), true); player.playVideo(); }
      updateNowPlaying();
    } else {
      applyState();
    }
  });

  await loadYouTubeApi();
  await createPlayer();
  applyState(true);
  setInterval(syncTick, 3000);
  setInterval(updateNowPlaying, 4000);
});
