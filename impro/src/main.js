import OBR from "@owlbear-rodeo/sdk";
import { renderBusqueda } from "./busqueda.js";
import { renderPersecucion } from "./persecucion.js";
import { renderEscenas } from "./escenas.js";
import {
  NOMBRES, ESPECIES, OFICIOS, RASGOS, HABLA, QUIERE, SECRETOS, BOTIN_OBJETOS, BOTIN_MAGICO,
  ENCUENTROS, CLIMA, RUMORES, LUGARES, COMPLICACIONES, REACCION,
} from "./tablas.js";

const CHANNEL = "com.yacoloco.impro/mostrar";
const SAVED_KEY = "impro-guardados";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------------- Azar ----------------

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const d = (n) => 1 + Math.floor(Math.random() * n);
const roll = (n, faces) => Array.from({ length: n }, () => d(faces)).reduce((a, b) => a + b, 0);

function pickWeighted(list) {
  const total = list.reduce((s, x) => s + x[2], 0);
  let r = Math.random() * total;
  for (const x of list) { r -= x[2]; if (r <= 0) return x; }
  return list[0];
}

// Para no repetir lo mismo dos veces seguidas.
const last = {};
function fresh(key, arr) {
  if (arr.length < 2) return arr[0];
  let v;
  do { v = pick(arr); } while (v === last[key]);
  last[key] = v;
  return v;
}

// ---------------- Generadores ----------------
// Cada uno devuelve { titulo, html, texto } (texto = versión corta para mostrar a todos).

const state = { especie: "azar", genero: "azar", botin: "bolsillo", estacion: "otono", lugar: "taberna" };

function nombre(especie = state.especie, genero = state.genero) {
  const esp = especie === "azar" ? pickWeighted(ESPECIES)[0] : especie;
  const g = genero === "azar" ? (Math.random() < 0.5 ? "m" : "f") : genero;
  const t = NOMBRES[esp];
  const full = `${pick(t[g])} ${pick(t.apellidos)}`;
  const label = ESPECIES.find((e) => e[0] === esp)[1];
  return { full, esp: label, g };
}

const GEN = {
  pnj() {
    const n = nombre();
    const lines = [
      ["Quién es", `${n.esp}${n.g === "f" ? " (mujer)" : " (hombre)"}`],
      ["A qué se dedica", fresh("oficio", OFICIOS)],
      ["Se nota", fresh("rasgo", RASGOS)],
      ["Cómo habla", fresh("habla", HABLA)],
      ["Quiere", fresh("quiere", QUIERE)],
      ["Secreto", fresh("secreto", SECRETOS)],
    ];
    return {
      titulo: `🧑 ${n.full}`,
      html: `<dl>${lines.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`,
      texto: `${n.full}: ${lines[0][1].toLowerCase()}, ${lines[1][1]}. ${lines[2][1][0].toUpperCase() + lines[2][1].slice(1)}.`,
    };
  },
  nombre() {
    const list = Array.from({ length: 5 }, () => nombre());
    return {
      titulo: "📛 Nombres",
      html: `<ul>${list.map((n) => `<li><b>${esc(n.full)}</b> <span class="muted">${esc(n.esp)}</span></li>`).join("")}</ul>`,
      texto: list.map((n) => n.full).join(", "),
    };
  },
  botin() {
    const items = [];
    let titulo = "";
    if (state.botin === "bolsillo") {
      titulo = "💰 En los bolsillos";
      items.push(`${roll(1, 6)} pc y ${roll(1, 4)} pp`);
      if (Math.random() < 0.3) items.push(fresh("obj", BOTIN_OBJETOS));
    } else if (state.botin === "cofre") {
      titulo = "💰 Cofre pequeño";
      items.push(`${roll(2, 10)} pp y ${roll(1, 6)} po`);
      items.push(fresh("obj", BOTIN_OBJETOS));
      if (Math.random() < 0.25) items.push(`✨ ${fresh("mag", BOTIN_MAGICO)}`);
    } else {
      titulo = "💰 Tesoro de jefe";
      items.push(`${roll(4, 10)} po y ${roll(3, 10)} pp`);
      if (Math.random() < 0.5) items.push(`Una gema que vale ${pick([10, 25, 50])} po`);
      items.push(fresh("obj", BOTIN_OBJETOS));
      items.push(fresh("obj", BOTIN_OBJETOS));
      items.push(`✨ ${fresh("mag", BOTIN_MAGICO)}`);
    }
    return { titulo, html: `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`, texto: `${titulo.slice(2)}: ${items.join(", ")}` };
  },
  encuentro() {
    const [t, desc, ficha] = fresh("enc", ENCUENTROS);
    return {
      titulo: `⚔️ ${t}`,
      html: `<p>${esc(desc)}</p>${ficha ? `<p class="muted">Ficha: <b>${esc(ficha)}</b> (está en tu biblioteca de Fichas).</p>` : ""}`,
      texto: t,
    };
  },
  clima() {
    const v = fresh(`clima-${state.estacion}`, CLIMA[state.estacion]);
    return { titulo: "🌦 Clima", html: `<p>${esc(v)}</p>`, texto: `🌦 ${v}` };
  },
  rumor() {
    const v = fresh("rumor", RUMORES);
    return { titulo: "🍺 Rumor de taberna", html: `<p>“${esc(v)}”</p>`, texto: `🍺 “${v}”` };
  },
  lugar() {
    const nom = fresh(`lugar-${state.lugar}`, LUGARES[state.lugar]);
    const a = fresh("desc1", LUGARES.descripcion);
    let b = fresh("desc2", LUGARES.descripcion);
    if (b === a) b = pick(LUGARES.descripcion);
    const dueno = nombre();
    return {
      titulo: `🏠 ${nom}`,
      html: `<p>${esc(a)} ${esc(b)}</p><p class="muted">Lo atiende <b>${esc(dueno.full)}</b> (${esc(dueno.esp.toLowerCase())}).</p>`,
      texto: `🏠 ${nom}. ${a}`,
    };
  },
  complicacion() {
    const v = fresh("comp", COMPLICACIONES);
    return { titulo: "🎲 Complicación", html: `<p>${esc(v)}</p>`, texto: `🎲 ${v}` };
  },
  reaccion() {
    const a = d(6), b = d(6), t = a + b;
    const r = REACCION.find(([lo, hi]) => t >= lo && t <= hi);
    return {
      titulo: `🙂 Reacción: ${r[2]}`,
      html: `<p><b>2d6 = ${t}</b> <span class="muted">(${a} + ${b})</span></p><p>${esc(r[3])}</p><p class="hint">Sumá o restá según cómo lo traten (por ejemplo, +2 si le pagan o lo halagan bien, −2 si lo amenazan).</p>`,
      texto: `Reacción: ${r[2]}`,
    };
  },
};

const BOTONES = [
  ["pnj", "🧑", "PNJ al vuelo"], ["nombre", "📛", "Nombres"], ["botin", "💰", "Botín"],
  ["encuentro", "⚔️", "Encuentro"], ["clima", "🌦", "Clima"], ["rumor", "🍺", "Rumor"],
  ["lugar", "🏠", "Lugar"], ["complicacion", "🎲", "Complicación"], ["reaccion", "🙂", "Reacción"],
];

// ---------------- Guardados ----------------

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}
function saveSaved(list) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 40))); } catch { /* nada */ }
}

// ---------------- Interfaz ----------------

let current = null;
let currentKind = "pnj";

function options(kind) {
  if (kind === "pnj" || kind === "nombre") {
    return `<div class="opts">
      <select id="o-esp"><option value="azar">Especie al azar</option>${ESPECIES.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
      <select id="o-gen"><option value="azar">Cualquiera</option><option value="m">Hombre</option><option value="f">Mujer</option></select>
    </div>`;
  }
  if (kind === "botin") {
    return `<div class="opts"><select id="o-botin"><option value="bolsillo">Bolsillos de un enemigo</option><option value="cofre">Cofre pequeño</option><option value="jefe">Tesoro de jefe</option></select></div>`;
  }
  if (kind === "clima") {
    return `<div class="opts"><select id="o-est"><option value="primavera">Primavera</option><option value="verano">Verano</option><option value="otono">Otoño</option><option value="invierno">Invierno</option></select></div>`;
  }
  if (kind === "lugar") {
    return `<div class="opts"><select id="o-lugar"><option value="taberna">Taberna o posada</option><option value="tienda">Tienda</option></select></div>`;
  }
  return "";
}

function generate(kind = currentKind) {
  currentKind = kind;
  current = GEN[kind]();
  renderImpro();
}

function renderImpro() {
  const saved = loadSaved();
  $("app").innerHTML = `
    <div class="grid">
      ${BOTONES.map(([k, i, l]) => `<button class="gen ${k === currentKind ? "on" : ""}" data-k="${k}"><span>${i}</span>${l}</button>`).join("")}
    </div>
    ${options(currentKind)}
    ${current ? `
    <div class="card">
      <h3>${esc(current.titulo)}</h3>
      ${current.html}
      <div class="row">
        <button id="again" class="primary">🔁 Otra</button>
        <button id="pin">📌 Guardar</button>
        <button id="show" title="Les aparece un aviso a todos los jugadores">📣 Mostrar a todos</button>
      </div>
    </div>` : ""}
    <section class="saved">
      <h4>📌 Guardados <span class="muted">(${saved.length})</span></h4>
      ${saved.length ? `<ul>${saved.map((s, i) => `
        <li><details><summary>${esc(s.titulo)}</summary>${s.html}</details><button class="x" data-del="${i}" title="Borrar">✕</button></li>`).join("")}</ul>`
        : `<p class="hint">Lo que guardes (un PNJ que inventaste, un rumor que ya contaste) queda acá para la próxima.</p>`}
    </section>`;

  document.querySelectorAll(".gen").forEach((b) => { b.onclick = () => generate(b.dataset.k); });
  const bind = (id, key) => { const el = $(id); if (el) { el.value = state[key]; el.onchange = (e) => { state[key] = e.target.value; generate(); }; } };
  bind("o-esp", "especie");
  bind("o-gen", "genero");
  bind("o-botin", "botin");
  bind("o-est", "estacion");
  bind("o-lugar", "lugar");
  if (current) {
    $("again").onclick = () => generate();
    $("pin").onclick = () => {
      const list = loadSaved();
      list.unshift({ titulo: current.titulo, html: current.html, t: Date.now() });
      saveSaved(list);
      renderImpro();
      OBR.notification.show("📌 Guardado en el Kit de impro.", "SUCCESS");
    };
    $("show").onclick = () => {
      OBR.broadcast.sendMessage(CHANNEL, { texto: current.texto }, { destination: "ALL" });
    };
  }
  document.querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = () => {
      if (!b.dataset.armed) {
        b.dataset.armed = "1";
        b.textContent = "¿Borrar?";
        b.classList.add("danger");
        setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "✕"; b.classList.remove("danger"); } }, 3000);
        return;
      }
      const list = loadSaved();
      list.splice(Number(b.dataset.del), 1);
      saveSaved(list);
      renderImpro();
    };
  });
}

// ---------------- Pestañas ----------------

const TABS = [["escenas", "📜 Escenas"], ["impro", "🎲 Impro"], ["busqueda", "🔎 Búsqueda"], ["persecucion", "🏃 Persecución"]];
let tab = "impro";
try { tab = localStorage.getItem("impro-pestana") || "impro"; } catch { /* nada */ }

function showTab(t) {
  tab = t;
  try { localStorage.setItem("impro-pestana", t); } catch { /* nada */ }
  $("tabs").innerHTML = TABS.map(([k, l]) => `<button class="tab ${k === tab ? "on" : ""}" data-tab="${k}">${l}</button>`).join("");
  document.querySelectorAll("[data-tab]").forEach((b) => { b.onclick = () => showTab(b.dataset.tab); });
  if (t === "escenas") renderEscenas();
  else if (t === "busqueda") renderBusqueda();
  else if (t === "persecucion") renderPersecucion();
  else if (current) renderImpro();
  else generate("pnj");
}

OBR.onReady(async () => {
  const role = await OBR.player.getRole();
  if (role !== "GM") {
    $("app").innerHTML = `<div class="locked">🎲<p>La Caja del DM es una herramienta del DM.</p></div>`;
    return;
  }
  showTab(tab);
});
