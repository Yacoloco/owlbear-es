import OBR from "@owlbear-rodeo/sdk";

// Notas de escena: se importan desde los archivos de Dashboard Maker (o se arman a mano)
// y quedan guardadas solo en este navegador.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KEY = "caja-escenas";
const SEL_KEY = "caja-escena-actual";
const PRESET_KEY = "dados-preparar"; // extensión Dados (ES)

// { colecciones: [{ id, nombre, tipo: "escena" | "lista", secciones: [{ t, md }], notas }] }
function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{"colecciones":[]}'); } catch { return { colecciones: [] }; }
}
function store(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* nada */ } }

let editing = false;
let filtro = "";

// ---------------- Importar de Dashboard Maker ----------------

const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function cleanDice(s) {
  return String(s || "")
    .replace(/:dice\[DC(\d+)\]\{[^}]*\}/g, "CD $1")
    .replace(/:dice\[([^\]]+)\](\{[^}]*\})?/g, "$1");
}

/** Un dashboard (lista de widgets con markdown) → secciones. */
function fromDashboard(name, db) {
  const widgets = Array.isArray(db.widgets) ? db.widgets : Object.values(db.widgets || {});
  const secciones = [];
  let titulo = name;
  for (const w of widgets) {
    const c = cleanDice(w.content || "").trim();
    if (!c) continue;
    const lines = c.split("\n");
    const first = lines[0].trim();
    if (/^#\s/.test(first) && lines.length === 1) { titulo = first.replace(/^#\s+/, ""); continue; }
    const m = first.match(/^#{1,3}\s+(.*)$/);
    if (m) secciones.push({ t: m[1], md: lines.slice(1).join("\n").trim() });
    else secciones.push({ t: "Notas", md: c });
  }
  return { titulo, secciones };
}

function importText(text, fileName) {
  const data = JSON.parse(text);
  const out = [];
  if (data && data.dashboards && typeof data.dashboards === "object") {
    // Carpeta exportada: cada dashboard es una escena.
    const order = (data.folderStructure && data.folderStructure.dashboards) || Object.keys(data.dashboards);
    for (const name of order) {
      const db = data.dashboards[name];
      if (!db) continue;
      const { titulo, secciones } = fromDashboard(name, db);
      out.push({ id: slug(name), nombre: name, titulo, tipo: "escena", secciones, notas: "" });
    }
  } else if (data && data.widgets) {
    // Un solo dashboard: cada widget es una ficha de una lista (PNJ, aliados, enemigos).
    const name = String(fileName || "Lista").replace(/\.json$/i, "");
    const widgets = Array.isArray(data.widgets) ? data.widgets : Object.values(data.widgets);
    const secciones = [];
    for (const w of widgets) {
      const c = cleanDice(w.content || "").trim();
      if (!c) continue;
      const lines = c.split("\n");
      const m = lines[0].match(/^#{1,3}\s+(.*)$/);
      if (m && lines.length > 1) secciones.push({ t: m[1], md: lines.slice(1).join("\n").trim() });
    }
    out.push({ id: slug(name), nombre: name, titulo: name, tipo: "lista", secciones, notas: "" });
  } else if (data && Array.isArray(data.colecciones)) {
    out.push(...data.colecciones);
  } else {
    throw new Error("formato");
  }
  return out;
}

async function importFiles(files) {
  const d = load();
  let n = 0;
  for (const f of files) {
    try {
      const cols = importText(await f.text(), f.name);
      for (const c of cols) {
        const i = d.colecciones.findIndex((x) => x.id === c.id);
        if (i >= 0) { c.notas = d.colecciones[i].notas || c.notas; d.colecciones[i] = c; } else d.colecciones.push(c);
        n++;
      }
    } catch {
      OBR.notification.show(`"${f.name}" no se pudo leer.`, "ERROR");
    }
  }
  store(d);
  if (n) OBR.notification.show(`📜 ${n} escena${n === 1 ? "" : "s"}/lista${n === 1 ? "" : "s"} importada${n === 1 ? "" : "s"}.`, "SUCCESS");
  renderEscenas();
}

// ---------------- Markdown y tiradas ----------------

function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, "<i>$1</i>")
    .replace(/(\b\d*d\d+(?:\s?[+−-]\s?\d+)?\b)|((?<=^|[\s(·:,])[+−-]\d+\b)/g, (m) => `<span class="roll" data-roll="${m}">${m}</span>`);
}

function md(text) {
  const out = [];
  let list = null;
  let para = [];
  const flushP = () => { if (para.length) { out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; } };
  const flushL = () => { if (list) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`); list = null; } };
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trimEnd();
    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (h) { flushP(); flushL(); out.push(`<h5>${inline(h[1])}</h5>`); continue; }
    const li = line.match(/^\s*[*-]\s+(.*)$/);
    if (li) { flushP(); (list ||= []).push(li[1]); continue; }
    if (!line.trim()) { flushP(); flushL(); continue; }
    flushL();
    para.push(line);
  }
  flushP();
  flushL();
  return out.join("");
}

/** Carga la tirada en Dados (ES), igual que en las fichas. */
function prepareRoll(expr) {
  let e = String(expr).replace(/\s+/g, "").replace("−", "-").toLowerCase();
  if (/^[+-]\d+$/.test(e)) e = `1d20${e}`;
  const m = e.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!m || ![4, 6, 8, 10, 12, 20, 100].includes(Number(m[2]))) return;
  const preset = { dice: { [`D${m[2]}`]: Math.max(1, Math.min(20, Number(m[1] || 1))) }, bonus: Number(m[3] || 0), advantage: null, t: Date.now(), n: Math.random() };
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(preset)); } catch { /* nada */ }
}

// ---------------- Interfaz ----------------

const ORDEN_ABIERTAS = ["sinopsis", "enemigos", "aliados", "como se juega", "soluciones", "recompensa"];

export function renderEscenas() {
  const d = load();
  if (!d.colecciones.length) {
    $("app").innerHTML = `
      <section class="box">
        <h4>📜 Notas de escena</h4>
        <p>Importá los archivos que armamos para Dashboard Maker y quedan acá, con sinopsis, enemigos, aliados, cómo se juega y soluciones de cada escena.</p>
        <p class="hint">Están en tu carpeta <b>DnD/DM</b>: <b>Escenas Phandelver.json</b> y, si querés, también <b>Aliados.json</b>, <b>PNJs Phandelver.json</b> y <b>Enemigos Phandelver.json</b>. Podés elegirlos todos juntos.</p>
        <label class="btn primary">📥 Importar archivos<input id="e-imp" type="file" accept=".json,application/json" multiple hidden /></label>
      </section>`;
    $("e-imp").onchange = (e) => importFiles([...e.target.files]);
    return;
  }
  let sel = localStorage.getItem(SEL_KEY);
  if (!d.colecciones.some((c) => c.id === sel)) sel = d.colecciones[0].id;
  const c = d.colecciones.find((x) => x.id === sel);
  const escenas = d.colecciones.filter((x) => x.tipo === "escena");
  const listas = d.colecciones.filter((x) => x.tipo !== "escena");
  const plain = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const secs = c.tipo === "lista" && filtro ? c.secciones.filter((s) => plain(s.t + " " + s.md).includes(plain(filtro))) : c.secciones;

  $("app").innerHTML = `
    <div class="opts">
      <select id="e-sel">
        ${escenas.length ? `<optgroup label="Escenas">${escenas.map((x) => `<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join("")}</optgroup>` : ""}
        ${listas.length ? `<optgroup label="Listas">${listas.map((x) => `<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join("")}</optgroup>` : ""}
      </select>
      <button id="e-edit" title="Editar el texto">${editing ? "💾 Listo" : "✏️"}</button>
    </div>
    ${c.tipo === "lista" ? `<input id="e-q" class="full" type="search" placeholder="Buscar en ${esc(c.nombre)}…" value="${esc(filtro)}" />` : `<h3 class="sc-title">${esc(c.titulo || c.nombre)}</h3>`}
    <div class="scene">
      ${secs.map((s, i) => editing ? `
        <div class="box"><input class="full" data-st="${i}" value="${esc(s.t)}" /><textarea data-sm="${i}" rows="6">${esc(s.md)}</textarea></div>` : `
        <details class="sec" ${c.tipo === "escena" && ORDEN_ABIERTAS.some((k) => plain(s.t).includes(k)) && !plain(s.t).includes("soluciones") ? "open" : ""}>
          <summary>${esc(s.t)}</summary>
          <div class="md">${md(s.md)}</div>
        </details>`).join("")}
      ${editing ? `<button id="e-add-sec">➕ Agregar sección</button>` : ""}
    </div>
    <section class="box">
      <h4>🖊 Mis notas</h4>
      <textarea id="e-notas" rows="4" placeholder="Qué pasó en esta escena, qué decidieron los jugadores, ideas…">${esc(c.notas || "")}</textarea>
    </section>
    <div class="row">
      <label class="btn">📥 Importar<input id="e-imp" type="file" accept=".json,application/json" multiple hidden /></label>
      <button id="e-exp">📤 Exportar</button>
      <button id="e-del" title="Borrar esta escena o lista">🗑</button>
    </div>
    <p class="hint">Los números en amarillo se cargan en Dados al tocarlos. Las <b>Soluciones</b> arrancan cerradas para que no se te escapen en pantalla.</p>`;

  $("e-sel").value = sel;
  $("e-sel").onchange = (e) => { localStorage.setItem(SEL_KEY, e.target.value); editing = false; filtro = ""; renderEscenas(); };
  if ($("e-q")) {
    $("e-q").oninput = (e) => {
      filtro = e.target.value;
      const pos = e.target.selectionStart;
      renderEscenas();
      const q = $("e-q"); q.focus(); q.setSelectionRange(pos, pos);
    };
  }
  const saveEdits = () => {
    const x = load();
    const cc = x.colecciones.find((y) => y.id === sel);
    document.querySelectorAll("[data-st]").forEach((el) => { cc.secciones[Number(el.dataset.st)].t = el.value; });
    document.querySelectorAll("[data-sm]").forEach((el) => { cc.secciones[Number(el.dataset.sm)].md = el.value; });
    store(x);
  };
  $("e-edit").onclick = () => { if (editing) saveEdits(); editing = !editing; filtro = ""; renderEscenas(); };
  if ($("e-add-sec")) $("e-add-sec").onclick = () => {
    saveEdits();
    const x = load();
    x.colecciones.find((y) => y.id === sel).secciones.push({ t: "Nueva sección", md: "" });
    store(x);
    renderEscenas();
  };
  let t = null;
  $("e-notas").oninput = (e) => {
    clearTimeout(t);
    const v = e.target.value;
    t = setTimeout(() => { const x = load(); x.colecciones.find((y) => y.id === sel).notas = v; store(x); }, 400);
  };
  $("e-imp").onchange = (e) => importFiles([...e.target.files]);
  $("e-exp").onclick = () => {
    const blob = new Blob([JSON.stringify(load(), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Notas de escena (Caja del DM).json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $("e-del").onclick = () => {
    const b = $("e-del");
    if (!b.dataset.armed) {
      b.dataset.armed = "1";
      b.textContent = "¿Borrar?";
      b.classList.add("danger");
      setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "🗑"; b.classList.remove("danger"); } }, 3000);
      return;
    }
    const x = load();
    x.colecciones = x.colecciones.filter((y) => y.id !== sel);
    store(x);
    renderEscenas();
  };
  document.querySelectorAll(".scene .roll").forEach((el) => {
    el.onclick = () => {
      prepareRoll(el.dataset.roll);
      el.classList.add("sent");
      setTimeout(() => el.classList.remove("sent"), 600);
    };
  });
}
