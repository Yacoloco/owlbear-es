import OBR from "@owlbear-rodeo/sdk";
import {
  KEY, MODAL_ID, STATS, TIPOS, mod, sg, $, esc, md, blankSheet,
  loadLibrary, mergeIntoLibrary, parseImport, sortSheets,
  normName, setLink, removeLink, copyFromLink, isToken, updateLinkTemplate,
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
  const f = data.ficha;
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

    <div class="stats">
      ${STATS.map((k) => `<div class="stat"><b>${k}</b><span class="mod">${sg(mod(f.stats?.[k]))}</span><span class="val">${esc(f.stats?.[k] ?? 10)}</span></div>`).join("")}
    </div>

    ${f.detalles ? `<div class="details">${md(f.detalles)}</div>` : ""}

    ${(f.secciones || []).filter((s) => s.md && s.md.trim()).map((s, i) => `
      <details class="sec" ${CLOSED.includes(s.t) ? "" : "open"}>
        <summary>${esc(s.t)}</summary>
        <div class="md">${md(s.md)}</div>
      </details>`).join("")}

    <details class="sec" open>
      <summary>Notas</summary>
      ${canEdit
        ? `<textarea id="notes" rows="4" placeholder="Anotaciones de la partida…">${esc(f.notas || "")}</textarea>`
        : `<div class="md">${md(f.notas || "") || '<p class="muted">Sin notas.</p>'}</div>`}
    </details>`;

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
  if (canEdit) {
    $("edit").onclick = () => { editing = true; draft = clone(f); render(); };
    const n = () => Math.max(0, Math.floor(Number($("hp-n").value) || 0));
    $("hp-dmg").onclick = () => {
      let dmg = n();
      const nf = clone(f);
      const t = Number(nf.pgTemp) || 0;
      const fromTemp = Math.min(t, dmg);
      nf.pgTemp = t - fromTemp;
      dmg -= fromTemp;
      nf.pgActual = Math.max(0, (Number(nf.pgActual) || 0) - dmg);
      save({ ...data, ficha: nf }).then(render);
    };
    $("hp-heal").onclick = () => {
      const nf = clone(f);
      nf.pgActual = Math.min(Number(nf.pgMax) || 0, (Number(nf.pgActual) || 0) + n());
      save({ ...data, ficha: nf }).then(render);
    };
    $("hp-temp").onclick = () => {
      const nf = clone(f);
      nf.pgTemp = Math.max(Number(nf.pgTemp) || 0, n());
      save({ ...data, ficha: nf }).then(render);
    };
    let t = null;
    $("notes").oninput = (e) => {
      clearTimeout(t);
      const v = e.target.value;
      t = setTimeout(() => save({ ...data, ficha: { ...data.ficha, notas: v } }), 600);
    };
  }
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
  const f = draft;
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
