// Cosas que usan el popover, la ficha y el fondo.

export const ID = "com.yacoloco.fichas";
/** Metadata del token: { owner, ownerName, ficha } */
export const KEY = `${ID}/ficha`;
export const MODAL_ID = `${ID}/modal`;
export const BASE = "/owlbear-es/fichas";
export const VERSION = "1.0";

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
