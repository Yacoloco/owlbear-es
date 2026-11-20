// Cosas que usan el popover, la ficha y el fondo.

export const ID = "com.yacoloco.fichas";
/** Metadata del token: { owner, ownerName, ficha } */
export const KEY = `${ID}/ficha`;
export const MODAL_ID = `${ID}/modal`;
export const BASE = "/owlbear-es/fichas";
export const VERSION = "1.1";

export const STATS = ["FUE", "DES", "CON", "INT", "SAB", "CAR"];
export const TIPOS = { pj: "PJ", pnj: "PNJ", enemigo: "Enemigo" };

export const mod = (v) => Math.floor((Number(v || 10) - 10) / 2);
export const sg = (n) => (n >= 0 ? `+${n}` : `${n}`);
export const $ = (id) => document.getElementById(id);

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, "<i>$1</i>");
}

/** Markdown chiquito: negrita, cursiva, listas con * o - y párrafos. */
export function md(text) {
  const out = [];
  let list = null;
  let para = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`); list = null; } };
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trimEnd();
    const m = line.match(/^\s*[*-]\s+(.*)$/);
    if (m) { flushPara(); (list ||= []).push(m[1]); continue; }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out.join("");
}

export function blankSheet(tipo = "enemigo") {
  return {
    id: `nueva-${Date.now().toString(36)}`,
    nombre: "Nueva ficha",
    tipo,
    sub: "",
    ca: "10",
    pgMax: 10,
    pgActual: 10,
    pgTemp: 0,
    dados: "",
    vel: "30 pies",
    desafio: "",
    stats: { FUE: 10, DES: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 },
    detalles: "",
    secciones: [{ t: "Acciones", md: "" }],
    notas: "",
  };
}

// ---------- Biblioteca del DM (solo en este navegador) ----------

const LIB_KEY = "fichas-biblioteca";

export function loadLibrary() {
  try {
    const v = JSON.parse(localStorage.getItem(LIB_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveLibrary(list) {
  try { localStorage.setItem(LIB_KEY, JSON.stringify(list)); return true; } catch { return false; }
}

/** Suma fichas a la biblioteca (si ya hay una con el mismo id, la reemplaza). */
export function mergeIntoLibrary(fichas) {
  const lib = loadLibrary();
  const byId = new Map(lib.map((f) => [f.id, f]));
  for (const f of fichas) if (f && f.nombre) byId.set(f.id || `f-${Math.random().toString(36).slice(2)}`, f);
  const list = [...byId.values()];
  saveLibrary(list);
  return list;
}

export function parseImport(text) {
  const data = JSON.parse(text);
  const fichas = Array.isArray(data) ? data : data && Array.isArray(data.fichas) ? data.fichas : null;
  if (!fichas) throw new Error("formato");
  return fichas.filter((f) => f && typeof f === "object" && f.nombre);
}

export function sortSheets(list) {
  const order = { pj: 0, pnj: 1, enemigo: 2 };
  return [...list].sort((a, b) => (order[a.tipo] ?? 3) - (order[b.tipo] ?? 3) || String(a.nombre).localeCompare(String(b.nombre), "es"));
}

// ---------- Fichas automáticas por nombre de token (solo en el navegador del DM) ----------
// vínculo: nombre de token → { stamp, tipo, data: { owner, ownerName, ficha }, rev }
// - Enemigos y PNJ: cada token con ese nombre recibe su propia copia (con PG llenos).
// - PJ: todos los tokens con ese nombre comparten la misma ficha y se mantienen al día.

const LINKS_KEY = "fichas-vinculos";
const IGNORED_KEY = "fichas-desvinculados";

/** "Goblin 3" y "goblin" cuentan como el mismo nombre. */
export const normName = (s) => String(s || "").trim().toLowerCase().replace(/\s+\d+$/, "");

export function loadLinks() {
  try { return JSON.parse(localStorage.getItem(LINKS_KEY) || "{}") || {}; } catch { return {}; }
}
export function saveLinks(links) {
  try { localStorage.setItem(LINKS_KEY, JSON.stringify(links)); } catch { /* nada */ }
}
export function loadIgnored() {
  try { return new Set(JSON.parse(localStorage.getItem(IGNORED_KEY) || "[]")); } catch { return new Set(); }
}
export function saveIgnored(set) {
  try { localStorage.setItem(IGNORED_KEY, JSON.stringify([...set])); } catch { /* nada */ }
}

export const newStamp = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Copia lista para poner en un token nuevo. */
export function copyFromLink(link) {
  const d = JSON.parse(JSON.stringify(link.data));
  if (link.tipo !== "pj") {
    d.ficha.pgActual = d.ficha.pgMax;
    d.ficha.pgTemp = 0;
  }
  d.stamp = link.stamp;
  d.rev = link.rev || 0;
  return d;
}

/** Crea (o reemplaza) el vínculo de un nombre con una ficha. */
export function setLink(name, data) {
  const n = normName(name);
  if (!n) return null;
  const links = loadLinks();
  const ignored = loadIgnored();
  ignored.delete(n);
  saveIgnored(ignored);
  const link = { stamp: newStamp(), tipo: data.ficha.tipo, data: { owner: data.owner || null, ownerName: data.ownerName || "", ficha: data.ficha }, rev: 0 };
  links[n] = link;
  saveLinks(links);
  return link;
}

/** Saca el vínculo de un nombre; con ignore=true tampoco se vuelve a crear solo. */
export function removeLink(name, ignore = false) {
  const n = normName(name);
  const links = loadLinks();
  delete links[n];
  saveLinks(links);
  if (ignore) {
    const ignored = loadIgnored();
    ignored.add(n);
    saveIgnored(ignored);
  }
}

const TOKEN_LAYERS = ["CHARACTER", "MOUNT", "PROP"];
export const isToken = (it) => it.type === "IMAGE" && TOKEN_LAYERS.includes(it.layer);

/**
 * Pone al día la escena actual con los vínculos:
 * tokens sin ficha reciben la suya, los PJ quedan con la versión más nueva
 * y las fichas que ya había antes de los vínculos se convierten en vínculo.
 */
export async function syncScene(OBR, KEY) {
  if (!(await OBR.scene.isReady())) return 0;
  const items = (await OBR.scene.items.getItems()).filter(isToken);
  const links = loadLinks();
  const ignored = loadIgnored();
  let linksChanged = false;

  // 1) Fichas ya puestas a mano sin vínculo → vínculo nuevo.
  for (const it of items) {
    const d = it.metadata[KEY];
    const n = normName(it.name);
    if (!n || !d || !d.ficha || links[n] || ignored.has(n)) continue;
    links[n] = { stamp: d.stamp || newStamp(), tipo: d.ficha.tipo, data: { owner: d.owner || null, ownerName: d.ownerName || "", ficha: d.ficha }, rev: d.rev || 0 };
    linksChanged = true;
  }

  // 2) PJ: cada cambio sube el número de versión (rev); la más alta gana.
  for (const [n, link] of Object.entries(links)) {
    if (link.tipo !== "pj") continue;
    for (const it of items) {
      const d = it.metadata[KEY];
      if (normName(it.name) !== n || !d || !d.ficha || d.stamp !== link.stamp) continue;
      if ((d.rev || 0) > (link.rev || 0)) {
        link.data = { owner: d.owner || null, ownerName: d.ownerName || "", ficha: d.ficha };
        link.rev = d.rev;
        linksChanged = true;
      }
    }
  }
  if (linksChanged) saveLinks(links);

  // 3) Qué tokens hay que tocar.
  const updates = new Map();
  for (const it of items) {
    const n = normName(it.name);
    const link = n && links[n];
    if (!link) continue;
    const d = it.metadata[KEY];
    if (!d || !d.ficha) {
      updates.set(it.id, copyFromLink(link));
    } else if (!d.stamp) {
      updates.set(it.id, { ...d, stamp: link.stamp, rev: link.rev || 0 }); // ficha vieja: se queda como está
    } else if (d.stamp !== link.stamp) {
      updates.set(it.id, copyFromLink(link)); // la cambiaste por otra ficha
    } else if (link.tipo === "pj" && (d.rev || 0) < (link.rev || 0)) {
      updates.set(it.id, copyFromLink(link));
    }
  }
  if (updates.size) {
    await OBR.scene.items.updateItems([...updates.keys()], (list) => {
      for (const it of list) it.metadata[KEY] = updates.get(it.id);
    });
  }
  return updates.size;
}

/** Actualiza la ficha "molde" de un vínculo sin tocar los tokens que ya existen. */
export function updateLinkTemplate(name, data) {
  const n = normName(name);
  const links = loadLinks();
  const link = links[n];
  if (!link || link.stamp !== data.stamp) return;
  link.data = { owner: data.owner || null, ownerName: data.ownerName || "", ficha: data.ficha };
  link.tipo = data.ficha.tipo;
  saveLinks(links);
}
