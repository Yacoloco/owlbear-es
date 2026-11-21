import OBR from "@owlbear-rodeo/sdk";
import {
  KEY, MODAL_ID, STATS, TIPOS, mod, sg, $, esc, md, blankSheet,
  loadLibrary, mergeIntoLibrary, parseImport, sortSheets,
  normName, setLink, removeLink, copyFromLink, isToken, updateLinkTemplate,
  ESTADOS, normalizeSheet, initBonus, parseExpr, exprText, prepareDice, rollSig,
  PENDING_KEY, DICE_ROLL_KEY,
} from "./shared.js";

const itemId = new URLSearchParams(location.search).get("item");

let isGM = false;
let me = null;
let item = null;        // token
let data = null;        // metadata[KEY] del token
let players = [];       // jugadores conectados
let editing = false;
let draft = null;
let pickerFilter = "";
let pickerTipo = "todos";

// Secciones largas que arrancan cerradas.
const CLOSED = ["Historia", "Personalidad", "Equipo", "Idiomas y competencias"];
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---------------- Guardado ----------------

async function save(next) {
  // Cada cambio sube la versión: así la ficha del PJ se copia a sus otros tokens.
  if (next) next = { ...next, rev: ((data && data.rev) || 0) + 1 };
  data = next;
  try {
    await OBR.scene.items.updateItems([itemId], (items) => {
      for (const it of items) {
        if (next) it.metadata[KEY] = next;
        else delete it.metadata[KEY];
      }
    });
  } catch (e) {
    console.error(e);
    OBR.notification.show("No se pudo guardar la ficha. ¿Tenés permiso para editar este token?", "ERROR");
  }
}

function canSee() {
  return isGM || (data && data.owner && data.owner === me);
}

// ---------------- Render principal ----------------

function render() {
  const app = $("app");
  if (!item) {
    app.innerHTML = `<p class="muted">Este token ya no está en la escena.</p>`;
    return;
  }
  if (!data || !data.ficha) {
    if (isGM) return renderPicker();
    app.innerHTML = `<p class="muted">Este token no tiene ficha.</p>`;
    return;
  }
  if (!canSee()) {
    app.innerHTML = `<div class="locked">🔒<p>Esta ficha es solo para el DM.</p></div>`;
    return;
  }
  if (editing) return renderEditor();
  renderSheet();
}

// ---------------- Selector de ficha (DM, token sin ficha) ----------------

function renderPicker() {
  const lib = sortSheets(loadLibrary());
  const q = pickerFilter.trim().toLowerCase();
  const shown = lib.filter((f) =>
    (pickerTipo === "todos" || f.tipo === pickerTipo) &&
    (!q || String(f.nombre).toLowerCase().includes(q)));
  const app = $("app");
  app.innerHTML = `
    <h2>Elegí una ficha para <span class="accent">${esc(item.name || "este token")}</span></h2>
    ${lib.length ? "" : `<p class="hint">Tu biblioteca está vacía. Importá el archivo <b>Fichas Phandelver.json</b> o arrancá una en blanco.</p>`}
    <div class="row">
      <input id="pk-filter" type="search" placeholder="Buscar…" value="${esc(pickerFilter)}" />
      <select id="pk-tipo">
        <option value="todos">Todas</option>
        <option value="pj">PJ</option><option value="pnj">PNJ</option><option value="enemigo">Enemigos</option>
      </select>
    </div>
    <ul class="pick">${shown.map((f) => `
      <li data-id="${esc(f.id)}"><span class="tag ${esc(f.tipo)}">${TIPOS[f.tipo] || "?"}</span>
        <span class="nm">${esc(f.nombre)}</span><span class="muted">CA ${esc(String(f.ca).split(" ")[0])} · PG ${esc(f.pgMax)}</span></li>`).join("")}
    </ul>
    <div class="row">
      <label class="btn">📥 Importar archivo<input id="pk-import" type="file" accept=".json,application/json" hidden /></label>
      <button id="pk-blank">📝 Ficha en blanco</button>
    </div>`;
  $("pk-tipo").value = pickerTipo;
  $("pk-filter").oninput = (e) => { pickerFilter = e.target.value; renderPickerKeepFocus(); };
  $("pk-tipo").onchange = (e) => { pickerTipo = e.target.value; render(); };
  app.querySelectorAll(".pick li").forEach((li) => {
    li.onclick = () => {
      const f = lib.find((x) => x.id === li.dataset.id);
      if (f) assignSheet(clone(f));
    };
  });
  $("pk-blank").onclick = () => { editing = true; draft = blankSheet(); assignSheet(draft, true); };
  $("pk-import").onchange = (e) => importFile(e.target.files[0], render);
}

function renderPickerKeepFocus() {
  const pos = $("pk-filter").selectionStart;
  renderPicker();
  const el = $("pk-filter");
  el.focus();
  el.setSelectionRange(pos, pos);
}

function guessOwner(ficha) {
  if (ficha.tipo !== "pj") return null;
  const names = [ficha.jugador, ficha.nombre].filter(Boolean).map((s) => s.toLowerCase());
  return players.find((p) => names.some((n) => p.name && (p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase())))) || null;
}

async function assignSheet(ficha, keepEditing = false) {
  const owner = guessOwner(ficha);
  ficha.pgActual = ficha.pgActual ?? ficha.pgMax;
  const base = { owner: owner ? owner.id : null, ownerName: owner ? owner.name : "", ficha };
  // Desde ahora, todos los tokens que se llamen igual tienen esta ficha (en todas las escenas).
  const link = setLink(item.name, base);
  if (link) {
    const same = (await OBR.scene.items.getItems()).filter((it) => isToken(it) && normName(it.name) === normName(item.name));
    const ids = same.map((it) => it.id);
    if (!ids.includes(itemId)) ids.push(itemId);
    try {
      await OBR.scene.items.updateItems(ids, (list) => {
        for (const it of list) it.metadata[KEY] = copyFromLink(link);
      });
    } catch (e) { console.error(e); }
    data = copyFromLink(link);
    if (ids.length > 1) OBR.notification.show(`📜 Ficha puesta en los ${ids.length} tokens "${item.name}". Los que agregues con ese nombre la van a tener solos.`, "SUCCESS");
  } else {
    await save(base);
  }
  editing = keepEditing;
  if (keepEditing) draft = clone(ficha);
  render();
  if (owner) OBR.notification.show(`📜 Ficha asignada a ${owner.name}.`, "SUCCESS");
}

function importFile(file, after) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const fichas = parseImport(reader.result);
      mergeIntoLibrary(fichas);
      OBR.notification.show(`📥 ${fichas.length} fichas importadas a tu biblioteca.`, "SUCCESS");
    } catch {
      OBR.notification.show("Ese archivo no tiene fichas válidas.", "ERROR");
    }
    after();
  };
  reader.readAsText(file);
}

// ---------------- Ficha ----------------

function hpBar(f) {
  const max = Math.max(1, Number(f.pgMax) || 1);
  const cur = Math.max(0, Number(f.pgActual) || 0);
  const pct = Math.min(100, Math.round((cur / max) * 100));
  const cls = pct <= 25 ? "low" : pct <= 50 ? "mid" : "";
  return `<div class="hpbar ${cls}"><i style="width:${pct}%"></i></div>`;
}

function renderSheet() {
  const f = normalizeSheet(data.ficha);
  const canEdit = isGM || data.owner === me;
  const ownerSel = isGM ? `
    <div class="gm-bar">
      <label>Ve esta ficha:
        <select id="owner">
          <option value="">🔒 Solo yo (DM)</option>
          ${players.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}
          ${data.owner && !players.some((p) => p.id === data.owner) ? `<option value="${esc(data.owner)}">${esc(data.ownerName || "Jugador desconectado")}</option>` : ""}
        </select>
      </label>
      <span class="sp"></span>
      <button id="to-lib" title="Guardar una copia en tu biblioteca">💾</button>
      <button id="change" title="Cambiar por otra ficha">🔁</button>
      <button id="remove" title="Quitarle la ficha a todos los tokens con este nombre">🗑</button>
    </div>` : "";

  const modo = rollMode();
  const rollBar = canEdit ? `
    <div class="rollbar">
      <span class="muted" id="rollmsg">${lastMsg || `🎲 Tocá cualquier <span class="roll demo">+5</span> o <span class="roll demo">1d8</span> y quedan listos en <b>Dados</b>.`}</span>
      <span class="sp"></span>
      <span class="seg" id="modo">
        <button data-m="desventaja" class="${modo === "desventaja" ? "on" : ""}" title="Desventaja">⬇️</button>
        <button data-m="normal" class="${modo === "normal" ? "on" : ""}" title="Normal">Normal</button>
        <button data-m="ventaja" class="${modo === "ventaja" ? "on" : ""}" title="Ventaja">⬆️</button>
      </span>
      <button id="init" title="Prepara la tirada de iniciativa en Dados; el resultado se anota solo en Iniciativa">⚔️ Iniciativa ${sg(initBonus(f))}</button>
    </div>` : "";

  const estados = `
    <div class="estados">
      ${ESTADOS.map(([k, l, d]) => `<button class="est ${f.estados.includes(k) ? "on" : ""}" data-est="${k}" title="${esc(d)}" ${canEdit ? "" : "disabled"}>${esc(l)}</button>`).join("")}
      <span class="agot" title="Agotamiento: −2 a las tiradas de d20 por nivel; a 6, muere.">
        Agotamiento
        ${canEdit ? `<button id="ag-" class="mini">−</button>` : ""}<b>${f.agotamiento}</b>${canEdit ? `<button id="ag+" class="mini">+</button>` : ""}
      </span>
    </div>`;

  const recursos = f.recursos.length ? `
    <div class="recursos">
      ${f.recursos.map((r, i) => `
        <div class="rec">
          <span class="rn">${esc(r.n)} <span class="muted">· ${r.rec === "corto" ? "descanso corto" : "descanso largo"}</span></span>
          ${Number(r.max) <= 12
            ? `<span class="pips">${Array.from({ length: Number(r.max) || 0 }, (_, j) => `<button class="pip ${j < (Number(r.max) - (Number(r.usados) || 0)) ? "full" : ""}" data-rec="${i}" data-j="${j}" ${canEdit ? "" : "disabled"}></button>`).join("")}</span>`
            : `<span class="pool">${canEdit ? `<button class="mini" data-pool="${i}" data-d="-1">−</button>` : ""}<b>${Number(r.max) - (Number(r.usados) || 0)}</b> / ${esc(r.max)}${canEdit ? `<button class="mini" data-pool="${i}" data-d="1">+</button>` : ""}</span>`}
          ${r.dado && canEdit ? `<button class="mini" data-hd="${i}" title="Gastar un dado de golpe: cura 1${esc(r.dado)} + CON">🎲 Gastar</button>` : ""}
        </div>`).join("")}
      ${canEdit ? `<div class="row rests"><button id="rest-short">☕ Descanso corto</button><button id="rest-long">🌙 Descanso largo</button></div>` : ""}
    </div>` : (canEdit ? `<div class="row rests"><button id="rest-short">☕ Descanso corto</button><button id="rest-long">🌙 Descanso largo</button></div>` : "");

  $("app").innerHTML = `
    ${ownerSel}
    <header class="sheet-head">
      <div>
        <h1>${esc(f.nombre)}</h1>
        <div class="sub"><span class="tag ${esc(f.tipo)}">${TIPOS[f.tipo] || ""}</span> ${esc(f.sub)}</div>
      </div>
      ${canEdit ? `<button id="edit" class="primary">✏️ Editar</button>` : ""}
    </header>

    <div class="chips">
      <div class="chip"><b>🛡 CA</b><span>${esc(f.ca)}</span></div>
      <div class="chip"><b>👟 Velocidad</b><span>${esc(f.vel)}</span></div>
      ${f.desafio ? `<div class="chip"><b>☠️ Desafío</b><span>${esc(f.desafio)}</span></div>` : ""}
      ${f.dados ? `<div class="chip"><b>🎲 Dados de golpe</b><span>${esc(f.dados)}</span></div>` : ""}
    </div>

    <div class="hp">
      <div class="hp-top">
        <span class="hp-num"><b>❤️ ${esc(f.pgActual)}</b> / ${esc(f.pgMax)} PG${Number(f.pgTemp) > 0 ? ` <span class="temp">+${esc(f.pgTemp)} temp.</span>` : ""}</span>
        ${canEdit ? `
        <span class="hp-ctrl">
          <input id="hp-n" type="number" min="1" value="1" />
          <button id="hp-dmg" title="Restar PG">🗡 Daño</button>
          <button id="hp-heal" title="Sumar PG">💚 Curar</button>
          <button id="hp-temp" title="Poner PG temporales">✨ Temp.</button>
        </span>` : ""}
      </div>
      ${hpBar(f)}
    </div>

    ${rollBar}

    <div class="stats">
      ${STATS.map((k) => `<div class="stat"><b>${k}</b><span class="mod ${canEdit ? "roll" : ""}" data-roll="${sg(mod(f.stats?.[k]))}" data-label="Prueba de ${k}">${sg(mod(f.stats?.[k]))}</span><span class="val">${esc(f.stats?.[k] ?? 10)}</span></div>`).join("")}
    </div>

    <details class="sec" open>
      <summary>Estados</summary>
      ${estados}
    </details>

    ${f.recursos.length || canEdit ? `<details class="sec" open><summary>Recursos y descansos</summary>${recursos}</details>` : ""}

    ${f.detalles ? `<div class="details rollable">${md(f.detalles)}</div>` : ""}

    ${(f.secciones || []).filter((s) => s.md && s.md.trim()).map((s) => `
      <details class="sec" ${CLOSED.includes(s.t) ? "" : "open"}>
        <summary>${esc(s.t)}</summary>
        <div class="md rollable">${md(s.md)}</div>
      </details>`).join("")}

    <details class="sec" open>
      <summary>Notas</summary>
      ${canEdit
        ? `<textarea id="notes" rows="4" placeholder="Anotaciones de la partida…">${esc(f.notas || "")}</textarea>`
        : `<div class="md">${md(f.notas || "") || '<p class="muted">Sin notas.</p>'}</div>`}
    </details>`;

  if (canEdit) rollify();

  const update = (fn) => {
    const nf = clone(normalizeSheet(data.ficha));
    fn(nf);
    return save({ ...data, ficha: nf }).then(render);
  };

  if (isGM) {
    $("owner").value = data.owner || "";
    $("owner").onchange = (e) => {
      const p = players.find((x) => x.id === e.target.value);
      save({ ...data, owner: e.target.value || null, ownerName: p ? p.name : "" });
      OBR.notification.show(p ? `📜 Ahora ${p.name} puede ver esta ficha.` : "🔒 La ficha quedó solo para vos.", "INFO");
    };
    $("to-lib").onclick = () => {
      mergeIntoLibrary([clone(f)]);
      OBR.notification.show(`💾 "${f.nombre}" guardada en tu biblioteca.`, "SUCCESS");
    };
    $("change").onclick = async () => {
      if (!confirmInline("change", "¿Cambiar? Se pierden los cambios")) return;
      removeLink(item.name, true);
      await save(null);
      render();
    };
    $("remove").onclick = async () => {
      if (!confirmInline("remove", "¿Quitar a todos?")) return;
      // Se la saca a todos los tokens con este nombre y deja de ponerla sola.
      removeLink(item.name, true);
      const same = (await OBR.scene.items.getItems()).filter((it) => isToken(it) && normName(it.name) === normName(item.name)).map((it) => it.id);
      if (!same.includes(itemId)) same.push(itemId);
      try {
        await OBR.scene.items.updateItems(same, (list) => { for (const it of list) delete it.metadata[KEY]; });
      } catch (e) { console.error(e); }
      data = null;
      render();
    };
  }
  if (!canEdit) return;

  $("edit").onclick = () => { editing = true; draft = normalizeSheet(clone(f)); render(); };
  const n = () => Math.max(0, Math.floor(Number($("hp-n").value) || 0));
  $("hp-dmg").onclick = () => update((nf) => {
    let dmg = n();
    const t = Number(nf.pgTemp) || 0;
    const fromTemp = Math.min(t, dmg);
    nf.pgTemp = t - fromTemp;
    dmg -= fromTemp;
    nf.pgActual = Math.max(0, (Number(nf.pgActual) || 0) - dmg);
    if (dmg > 0 && nf.estados.includes("concentrado")) {
      OBR.notification.show(`🧠 ${nf.nombre} recibió daño: salvación de CON CD ${Math.max(10, Math.floor(dmg / 2))} para mantener la concentración.`, "WARNING");
    }
  });
  $("hp-heal").onclick = () => update((nf) => { nf.pgActual = Math.min(Number(nf.pgMax) || 0, (Number(nf.pgActual) || 0) + n()); });
  $("hp-temp").onclick = () => update((nf) => { nf.pgTemp = Math.max(Number(nf.pgTemp) || 0, n()); });

  document.querySelectorAll("[data-est]").forEach((b) => {
    b.onclick = () => update((nf) => {
      const k = b.dataset.est;
      nf.estados = nf.estados.includes(k) ? nf.estados.filter((x) => x !== k) : [...nf.estados, k];
    });
  });
  $("ag-").onclick = () => update((nf) => { nf.agotamiento = Math.max(0, nf.agotamiento - 1); });
  $("ag+").onclick = () => update((nf) => { nf.agotamiento = Math.min(6, nf.agotamiento + 1); });

  document.querySelectorAll(".pip").forEach((b) => {
    b.onclick = () => update((nf) => {
      const r = nf.recursos[Number(b.dataset.rec)];
      const left = Number(r.max) - (Number(r.usados) || 0);
      const j = Number(b.dataset.j);
      // Tocar un casillero lleno gasta uno; tocar uno vacío recupera uno.
      const used = Number(r.usados) || 0;
      r.usados = j < left ? Math.min(Number(r.max), used + 1) : Math.max(0, used - 1);
    });
  });
  document.querySelectorAll("[data-pool]").forEach((b) => {
    b.onclick = () => update((nf) => {
      const r = nf.recursos[Number(b.dataset.pool)];
      const left = Math.min(Number(r.max), Math.max(0, Number(r.max) - (Number(r.usados) || 0) + Number(b.dataset.d)));
      r.usados = Number(r.max) - left;
    });
  });
  document.querySelectorAll("[data-hd]").forEach((b) => {
    b.onclick = () => {
      const r = f.recursos[Number(b.dataset.hd)];
      if ((Number(r.usados) || 0) >= Number(r.max)) {
        OBR.notification.show("No te quedan dados de golpe.", "WARNING");
        return;
      }
      const p = parseExpr(`1${r.dado}${sg(mod(f.stats?.CON))}`);
      if (!p) return;
      // Se prepara en Dados; cuando el jugador tira, la curación se suma sola.
      prepare(p, "Dado de golpe", "heal");
      update((nf) => {
        nf.recursos[Number(b.dataset.hd)].usados = (Number(nf.recursos[Number(b.dataset.hd)].usados) || 0) + 1;
      });
    };
  });
  $("rest-short").onclick = () => update((nf) => {
    for (const r of nf.recursos) if (r.rec === "corto") r.usados = 0;
    OBR.notification.show(`☕ ${nf.nombre} hizo un descanso corto. Si quiere curarse, puede gastar dados de golpe.`, "INFO");
  });
  $("rest-long").onclick = () => update((nf) => {
    nf.pgActual = Number(nf.pgMax) || 0;
    nf.pgTemp = 0;
    for (const r of nf.recursos) {
      if (r.dado) r.usados = Math.max(0, (Number(r.usados) || 0) - Math.max(1, Math.floor(Number(r.max) / 2)));
      else r.usados = 0;
    }
    nf.agotamiento = Math.max(0, nf.agotamiento - 1);
    nf.estados = nf.estados.filter((k) => k !== "concentrado");
    OBR.notification.show(`🌙 ${nf.nombre} hizo un descanso largo: PG al máximo y recursos recuperados.`, "SUCCESS");
  });

  document.querySelectorAll("#modo [data-m]").forEach((b) => {
    b.onclick = () => { setRollMode(b.dataset.m); render(); };
  });
  $("init").onclick = () => prepare(parseExpr(sg(initBonus(f))), "Iniciativa", "init");

  let t = null;
  $("notes").oninput = (e) => {
    clearTimeout(t);
    const v = e.target.value;
    t = setTimeout(() => save({ ...data, ficha: { ...data.ficha, notas: v } }), 600);
  };
}

// ---------------- Tiradas ----------------

function rollMode() {
  try { return localStorage.getItem("fichas-modo") || "normal"; } catch { return "normal"; }
}
function setRollMode(m) {
  try { localStorage.setItem("fichas-modo", m); } catch { /* nada */ }
}
let lastMsg = "";

/**
 * Carga la tirada en la extensión Dados (no tira).
 * kind "init" o "heal": cuando el jugador tire, Fichas anota el resultado solo.
 */
async function prepare(p, label, kind = null) {
  if (!p) return;
  const isD20 = p.type === "D20" && p.count === 1;
  const adv = prepareDice(p, isD20 ? rollMode() : "normal");
  if (kind) {
    let sig0 = "";
    try { sig0 = rollSig((await OBR.player.getMetadata())[DICE_ROLL_KEY]); } catch { /* nada */ }
    try { localStorage.setItem(PENDING_KEY, JSON.stringify({ kind, itemId, sig0, type: p.type, t: Date.now() })); } catch { /* nada */ }
  }
  lastMsg = `🎲 Listo en Dados: <b>${esc(label || "Tirada")}</b> · ${esc(exprText(p))}${adv ? (adv === "ADVANTAGE" ? " con ventaja" : " con desventaja") : ""}${kind === "init" ? " → se anota en Iniciativa" : kind === "heal" ? " → se suma a los PG" : ""}`;
  const el = $("rollmsg");
  if (el) el.innerHTML = lastMsg;
  // Se cierra la ficha (y el menú del token) y Dados se abre solo con la tirada cargada.
  OBR.player.deselect().catch(() => { /* nada */ });
  setTimeout(() => OBR.modal.close(MODAL_ID), 120);
}

/** Convierte los "+5" y "1d8+3" de la ficha en botones para tirar. */
function rollify() {
  const RE = /(\b\d*d\d+(?:\s?[+−-]\s?\d+)?\b)|((?<=^|[\s(·:,])[+−-]\d+\b)/g;
  document.querySelectorAll(".rollable").forEach((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const text = node.nodeValue;
      RE.lastIndex = 0;
      if (!RE.test(text)) continue;
      RE.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0;
      let m;
      while ((m = RE.exec(text))) {
        frag.append(text.slice(last, m.index));
        const span = document.createElement("span");
        span.className = "roll";
        span.textContent = m[0];
        span.dataset.roll = m[0];
        frag.append(span);
        last = m.index + m[0].length;
      }
      frag.append(text.slice(last));
      node.replaceWith(frag);
    }
  });
}

/** Busca un nombre para la tirada mirando el texto de antes (ej. "Sigilo", "Espada larga"). */
function labelFor(el) {
  if (el.dataset.label) return el.dataset.label;
  const block = el.closest("li, p, .stat") || el.parentElement;
  let before = "";
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (el.contains(n)) break;
    before += n.nodeValue;
  }
  let seg = before.split(/[·•,;]/).pop().replace(/[\s(.:]+$/g, "").replace(/^[\s.:]+/, "").replace(/\d+\s*$/, "").trim();
  const isDice = /d\d/.test(el.dataset.roll);
  if (!/[a-záéíóúñ]/i.test(seg) || seg.length > 40) {
    const b = block.querySelector("b");
    seg = b ? b.textContent.replace(/[.:]+$/, "") : "";
  }
  if (isDice && seg) seg += " (daño)";
  return seg;
}

/** Pide un segundo click para acciones que borran (sin diálogos del navegador). */
const armed = {};
function confirmInline(id, text) {
  const btn = $(id);
  if (armed[id]) { delete armed[id]; return true; }
  armed[id] = true;
  const old = btn.textContent;
  btn.textContent = text;
  btn.classList.add("danger");
  setTimeout(() => { delete armed[id]; if (btn.isConnected) { btn.textContent = old; btn.classList.remove("danger"); } }, 3000);
  return false;
}

// ---------------- Editor ----------------

function renderEditor() {
  const f = normalizeSheet(draft);
  const field = (k, label, type = "text") =>
    `<label class="fld"><span>${label}</span><input data-k="${k}" type="${type}" value="${esc(f[k] ?? "")}" /></label>`;
  $("app").innerHTML = `
    <header class="sheet-head"><h1>✏️ Editando</h1>
      <span class="sp"></span>
      <button id="cancel">Cancelar</button>
      <button id="ok" class="primary">💾 Guardar</button>
    </header>
    <div class="grid2">
      ${field("nombre", "Nombre")}
      <label class="fld"><span>Tipo</span><select data-k="tipo">
        ${Object.entries(TIPOS).map(([v, l]) => `<option value="${v}" ${f.tipo === v ? "selected" : ""}>${l}</option>`).join("")}
      </select></label>
    </div>
    ${field("sub", "Descripción (clase, raza, tipo…)")}
    <div class="grid4">
      ${field("ca", "CA")}
      ${field("pgActual", "PG actuales", "number")}
      ${field("pgMax", "PG máximos", "number")}
      ${field("pgTemp", "PG temp.", "number")}
    </div>
    <div class="grid3">
      ${field("vel", "Velocidad")}
      ${field("dados", "Dados de golpe")}
      ${field("desafio", "Desafío")}
    </div>
    <div class="stats edit">
      ${STATS.map((k) => `<label class="stat"><b>${k}</b><input data-stat="${k}" type="number" value="${esc(f.stats?.[k] ?? 10)}" /></label>`).join("")}
    </div>
    <label class="fld"><span>Detalles (salvaciones, sentidos, idiomas…)</span><textarea data-k="detalles" rows="3">${esc(f.detalles || "")}</textarea></label>
    <div id="secs">
      ${(f.secciones || []).map((s, i) => `
        <div class="sec-edit">
          <div class="row"><input data-sec="${i}" data-f="t" value="${esc(s.t)}" placeholder="Título" />
            <button data-up="${i}" title="Subir">↑</button><button data-del="${i}" title="Borrar sección">✕</button></div>
          <textarea data-sec="${i}" data-f="md" rows="5">${esc(s.md)}</textarea>
        </div>`).join("")}
    </div>
    <button id="add-sec">➕ Agregar sección</button>
    <h3 class="sub-h">Recursos (espacios de conjuro, usos por descanso)</h3>
    <div id="recs">
      ${(f.recursos || []).map((r, i) => `
        <div class="row rec-edit">
          <input data-rc="${i}" data-f="n" value="${esc(r.n)}" placeholder="Nombre" />
          <input data-rc="${i}" data-f="max" type="number" min="0" value="${esc(r.max)}" title="Máximo" />
          <select data-rc="${i}" data-f="rec" title="Se recupera con">
            <option value="largo" ${r.rec !== "corto" ? "selected" : ""}>Desc. largo</option>
            <option value="corto" ${r.rec === "corto" ? "selected" : ""}>Desc. corto</option>
          </select>
          <input data-rc="${i}" data-f="dado" value="${esc(r.dado || "")}" placeholder="dado (d10)" title="Solo para dados de golpe" />
          <button data-rdel="${i}" title="Borrar">✕</button>
        </div>`).join("")}
    </div>
    <button id="add-rec">➕ Agregar recurso</button>
    <label class="fld"><span>Notas</span><textarea data-k="notas" rows="3">${esc(f.notas || "")}</textarea></label>
    <p class="hint">Formato: <b>**negrita**</b>, <i>*cursiva*</i> y listas empezando la línea con <b>* </b>.</p>`;

  const sync = () => {
    document.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.dataset.k;
      draft[k] = el.type === "number" ? Number(el.value) || 0 : el.value;
    });
    draft.stats ||= {};
    document.querySelectorAll("[data-stat]").forEach((el) => { draft.stats[el.dataset.stat] = Number(el.value) || 0; });
    document.querySelectorAll("[data-sec]").forEach((el) => { draft.secciones[Number(el.dataset.sec)][el.dataset.f] = el.value; });
    document.querySelectorAll("[data-rc]").forEach((el) => {
      const r = draft.recursos[Number(el.dataset.rc)];
      if (el.dataset.f === "max") r.max = Math.max(0, Number(el.value) || 0);
      else if (el.dataset.f === "dado") { if (el.value.trim()) r.dado = el.value.trim().toLowerCase().replace(/^1/, ""); else delete r.dado; }
      else r[el.dataset.f] = el.value;
      r.usados = Math.min(Number(r.usados) || 0, r.max);
    });
  };
  $("cancel").onclick = () => { editing = false; draft = null; render(); };
  $("ok").onclick = async () => {
    sync();
    draft.pgActual = Math.min(Number(draft.pgActual) || 0, Number(draft.pgMax) || 0);
    await save({ ...data, ficha: draft });
    // Si el DM corrige un enemigo, los próximos tokens con ese nombre salen con la corrección.
    if (isGM && draft.tipo !== "pj") updateLinkTemplate(item.name, data);
    editing = false;
    draft = null;
    render();
  };
  $("add-sec").onclick = () => { sync(); draft.secciones.push({ t: "Nueva sección", md: "" }); renderEditor(); };
  $("add-rec").onclick = () => { sync(); draft.recursos.push({ n: "Nuevo recurso", max: 1, usados: 0, rec: "largo" }); renderEditor(); };
  document.querySelectorAll("[data-rdel]").forEach((b) => {
    b.onclick = () => { sync(); draft.recursos.splice(Number(b.dataset.rdel), 1); renderEditor(); };
  });
  document.querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = () => { sync(); draft.secciones.splice(Number(b.dataset.del), 1); renderEditor(); };
  });
  document.querySelectorAll("[data-up]").forEach((b) => {
    b.onclick = () => {
      sync();
      const i = Number(b.dataset.up);
      if (i > 0) [draft.secciones[i - 1], draft.secciones[i]] = [draft.secciones[i], draft.secciones[i - 1]];
      renderEditor();
    };
  });
}

// ---------------- Arranque ----------------

async function refreshItem() {
  const items = await OBR.scene.items.getItems([itemId]);
  item = items[0] || null;
  data = item ? item.metadata[KEY] || null : null;
}

OBR.onReady(async () => {
  $("close").onclick = () => OBR.modal.close(MODAL_ID);
  $("app").addEventListener("click", (e) => {
    const el = e.target.closest(".roll[data-roll]");
    if (el && !el.classList.contains("demo")) prepare(parseExpr(el.dataset.roll), labelFor(el));
  });
  me = await OBR.player.getId();
  isGM = (await OBR.player.getRole()) === "GM";
  try { players = (await OBR.party.getPlayers()).filter((p) => p.role !== "GM"); } catch { players = []; }
  OBR.party.onChange((ps) => {
    players = ps.filter((p) => p.role !== "GM");
    if (isGM && !editing) render();
  });
  await refreshItem();
  render();

  OBR.scene.items.onChange((items) => {
    const it = items.find((x) => x.id === itemId);
    const next = it ? it.metadata[KEY] || null : null;
    if (JSON.stringify(next) === JSON.stringify(data) && Boolean(it) === Boolean(item)) return;
    const focused = document.activeElement && document.activeElement.id === "notes";
    item = it || null;
    data = next;
    if (!editing && !focused) render();
  });
});
