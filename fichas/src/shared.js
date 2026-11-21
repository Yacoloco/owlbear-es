// Cosas que usan el popover, la ficha y el fondo.

export const ID = "com.yacoloco.fichas";
/** Metadata del token: { owner, ownerName, ficha } */
export const KEY = `${ID}/ficha`;
export const MODAL_ID = `${ID}/modal`;
export const BASE = "/owlbear-es/fichas";
export const VERSION = "1.4";

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

// ---------- Estados ----------

export const ESTADOS = [
  ["cegado", "Cegado", "No ve. Falla pruebas que requieran vista. Sus ataques tienen desventaja; los ataques contra él, ventaja."],
  ["hechizado", "Hechizado", "No puede atacar a quien lo hechizó. Ese tiene ventaja en pruebas sociales contra él."],
  ["ensordecido", "Sordo", "No oye. Falla pruebas que requieran oído."],
  ["asustado", "Asustado", "Desventaja en pruebas y ataques mientras vea la fuente del miedo. No puede acercarse a ella."],
  ["agarrado", "Agarrado", "Velocidad 0. Desventaja en ataques contra todo lo que no sea quien lo agarra."],
  ["incapacitado", "Incapacitado", "No puede hacer acciones, acciones adicionales ni reacciones. Pierde la concentración."],
  ["invisible", "Invisible", "No se lo puede ver. Ventaja en sus ataques; desventaja en los ataques contra él."],
  ["paralizado", "Paralizado", "Incapacitado y velocidad 0. Falla salvaciones de FUE y DES. Ataques contra él con ventaja; crítico si es a 5 pies."],
  ["petrificado", "Petrificado", "Convertido en piedra: incapacitado, resistencia a todo el daño, falla salvaciones de FUE y DES."],
  ["envenenado", "Envenenado", "Desventaja en tiradas de ataque y pruebas de característica."],
  ["derribado", "Derribado", "Solo se arrastra. Desventaja en ataques. Ataques a 5 pies contra él con ventaja; a distancia, con desventaja."],
  ["apresado", "Apresado", "Velocidad 0. Desventaja en ataques y salvaciones de DES. Ataques contra él con ventaja."],
  ["aturdido", "Aturdido", "Incapacitado. Falla salvaciones de FUE y DES. Ataques contra él con ventaja."],
  ["inconsciente", "Inconsciente", "Incapacitado, derribado y sin percibir nada. Ataques contra él con ventaja; crítico si es a 5 pies."],
  ["concentrado", "Concentrado", "Mantiene un conjuro de concentración. Si recibe daño: salvación de CON CD 10 o la mitad del daño."],
];
export const ESTADO_LABEL = Object.fromEntries(ESTADOS.map(([k, l]) => [k, l]));

// ---------- Recursos (espacios de conjuro, usos por descanso) ----------
// { n: nombre, max, usados, rec: "corto" | "largo", dado?: "d10" (dados de golpe) }

const PRESETS = {
  "shak-ko": [["Espacios de conjuro nv. 1", 2, "largo"], ["Marca del cazador gratis", 2, "largo"], ["Dados de golpe", 2, "largo", "d10"]],
  copelo: [["Espacios de conjuro nv. 1", 2, "largo"], ["Imposición de manos (PG)", 10, "largo"], ["Aliento de fuego", 2, "largo"], ["Castigo divino gratis", 1, "largo"], ["Vuelo dracónico", 1, "largo"], ["Dados de golpe", 2, "largo", "d10"]],
  nicho: [["Furia", 2, "largo"], ["Salto de las nubes", 2, "largo"], ["Forma grande", 1, "largo"], ["Dados de golpe", 2, "largo", "d12"]],
  tachiana: [["Espacios de conjuro nv. 1", 3, "largo"], ["Puntos de hechicería", 2, "largo"], ["Dados de golpe", 2, "largo", "d6"]],
  barundin: [["Espacios de conjuro nv. 1", 2, "largo"], ["Orden imperiosa gratis", 1, "largo"], ["Dados de golpe", 1, "largo", "d8"]],
};

/** Completa campos nuevos en fichas viejas (estados, recursos…). Devuelve la misma ficha. */
export function normalizeSheet(f) {
  if (!f) return f;
  if (!Array.isArray(f.estados)) f.estados = [];
  if (typeof f.agotamiento !== "number") f.agotamiento = 0;
  if (!Array.isArray(f.recursos)) {
    const p = PRESETS[f.id] || PRESETS[String(f.nombre || "").toLowerCase().replace(/[^a-z]/g, "")] || null;
    f.recursos = p ? p.map(([n, max, rec, dado]) => ({ n, max, usados: 0, rec, ...(dado ? { dado } : {}) })) : [];
  }
  return f;
}

/** Bonificador de iniciativa: el de la ficha o, si no figura, el de Destreza. */
export function initBonus(f) {
  const m = String(f.detalles || "").match(/Iniciativa\**\s*([+-−]\d+)/);
  return m ? Number(m[1].replace("−", "-")) : mod(f.stats && f.stats.DES);
}

/** Texto corto de los estados para mostrar arriba del token. */
export function estadosText(f) {
  const parts = (f.estados || []).map((k) => ESTADO_LABEL[k]).filter(Boolean);
  if (f.agotamiento > 0) parts.push(`Agotamiento ${f.agotamiento}`);
  return parts.join(" · ");
}

// ---------- Tiradas ----------

export const ROLL_CHANNEL = `${ID}/tirada`;
export const INIT_KEY = "rodeo.owlbear.initiative-tracker/metadata";

const d = (n) => 1 + Math.floor(Math.random() * n);

/**
 * Tira una expresión tipo "1d8+3", "2d6", "d20+5" o "+5" (que es d20+5).
 * modo: "normal" | "ventaja" | "desventaja" (solo afecta al d20).
 */
export function roll(expr, modo = "normal") {
  let e = String(expr).replace(/\s+/g, "").replace("−", "-").toLowerCase();
  if (/^[+-]\d+$/.test(e)) e = `1d20${e}`;
  const m = e.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!m) return null;
  const n = Math.min(50, Number(m[1] || 1));
  const faces = Number(m[2]);
  const bonus = Number(m[3] || 0);
  let dice = [];
  let note = "";
  let nat = null;
  if (faces === 20 && n === 1 && modo !== "normal") {
    const a = d(20), b = d(20);
    const pick = modo === "ventaja" ? Math.max(a, b) : Math.min(a, b);
    dice = [pick];
    note = `${modo === "ventaja" ? "ventaja" : "desventaja"}: ${a} y ${b}`;
    nat = pick;
  } else {
    for (let i = 0; i < n; i++) dice.push(d(faces));
    if (faces === 20 && n === 1) nat = dice[0];
  }
  const sum = dice.reduce((s, x) => s + x, 0);
  const total = sum + bonus;
  const detalle = note || (dice.length > 1 ? `[${dice.join(", ")}]` : `${dice[0]}`);
  return {
    expr: `${n > 1 || faces !== 20 ? n : 1}d${faces}${bonus ? (bonus > 0 ? `+${bonus}` : bonus) : ""}`,
    total,
    detalle: `${detalle}${bonus ? ` ${bonus > 0 ? "+" : "−"} ${Math.abs(bonus)}` : ""}`,
    nat,
  };
}

export function rollMessage(r, quien, que) {
  const crit = r.nat === 20 ? " ✨¡20 natural!" : r.nat === 1 ? " 💀 1 natural" : "";
  return `🎲 ${quien}${que ? ` · ${que}` : ""}: ${r.total}  (${r.detalle})${crit}`;
}

// ---------- Conexión con la extensión Dados (ES) ----------
// Fichas no tira: carga los dados en la bandeja de Dados y el jugador tira desde ahí.
// Las dos extensiones viven en el mismo sitio, así que se hablan por localStorage.

export const PRESET_KEY = "dados-preparar";
export const PENDING_KEY = "fichas-pendiente";
export const DICE_ROLL_KEY = "rodeo.owlbear.dice/roll";
export const DICE_VALUES_KEY = "rodeo.owlbear.dice/rollValues";

/** "1d8+3" → { type: "D8", count: 1, bonus: 3 }; "+5" → 1d20+5. */
export function parseExpr(expr) {
  let e = String(expr).replace(/\s+/g, "").replace("−", "-").toLowerCase();
  if (/^[+-]\d+$/.test(e)) e = `1d20${e}`;
  const m = e.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!m) return null;
  const faces = Number(m[2]);
  if (![4, 6, 8, 10, 12, 20, 100].includes(faces)) return null;
  return { type: `D${faces}`, count: Math.max(1, Math.min(20, Number(m[1] || 1))), bonus: Number(m[3] || 0) };
}

export function exprText(p) {
  return `${p.count}d${p.type.slice(1)}${p.bonus ? (p.bonus > 0 ? `+${p.bonus}` : p.bonus) : ""}`;
}

/** Deja los dados listos en la bandeja de Dados (no tira). */
export function prepareDice(p, modo = "normal") {
  const advantage = p.type === "D20" && p.count === 1 && modo !== "normal" ? (modo === "ventaja" ? "ADVANTAGE" : "DISADVANTAGE") : null;
  const preset = { dice: { [p.type]: p.count }, bonus: p.bonus, advantage, t: Date.now(), n: Math.random() };
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(preset)); } catch { /* nada */ }
  return advantage;
}

/** Ids de los dados de una tirada (para saber si es una tirada nueva). */
export function rollSig(roll) {
  const ids = [];
  const walk = (d) => { for (const x of (d && d.dice) || []) { if (x && typeof x.id === "string") ids.push(x.id); else walk(x); } };
  walk(roll);
  return ids.join(",");
}

export function rollHasType(roll, type) {
  let found = false;
  const walk = (d) => { for (const x of (d && d.dice) || []) { if (x && x.type === type) found = true; else if (x && x.dice) walk(x); } };
  walk(roll);
  return found;
}

/** Resultado final de una tirada de Dados (misma cuenta que hace la extensión). */
export function diceTotal(dice, values) {
  if (!dice || !Array.isArray(dice.dice)) return null;
  const bonus = dice.bonus || 0;
  if (dice.dice.length === 2 && (!dice.combination || dice.combination === "SUM")) {
    const [a, b] = dice.dice;
    if (a && b && a.type === "D100" && b.type === "D10" && values[a.id] !== undefined && values[b.id] !== undefined) {
      return values[a.id] === 0 && values[b.id] === 0 ? 100 + bonus : values[a.id] + values[b.id] + bonus;
    }
  }
  const vals = [];
  for (const x of dice.dice) {
    if (x && typeof x.id === "string") {
      const v = values[x.id];
      if (v !== undefined && v !== null) vals.push(v === 0 && x.type === "D10" ? 10 : v);
    } else if (x && Array.isArray(x.dice)) {
      const v = diceTotal(x, values);
      if (v !== null) vals.push(v);
    }
  }
  if (!vals.length || dice.combination === "NONE") return dice.bonus === undefined ? null : dice.bonus;
  if (dice.combination === "HIGHEST") return Math.max(...vals) + bonus;
  if (dice.combination === "LOWEST") return Math.min(...vals) + bonus;
  return vals.reduce((s, v) => s + v, 0) + bonus;
}
