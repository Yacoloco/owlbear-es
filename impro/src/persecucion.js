import OBR from "@owlbear-rodeo/sdk";

// Persecuciones: zonas de distancia, carreras gratis, prueba de CON y complicaciones.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const d = (n) => 1 + Math.floor(Math.random() * n);
const KEY = "impro-persecucion";
const CHANNEL = "com.yacoloco.impro/mostrar";
const FICHA_KEY = "com.yacoloco.fichas/ficha";

export const ZONAS = ["¡Lo alcanza!", "Cerca", "Media cuadra", "Lejos", "Fuera de vista"];

// Complicaciones (d20 al final de cada turno; con 1–10 pasa algo).
const COMPLICACIONES = {
  pueblo: [
    "Un puesto del mercado en el medio: DES (Acrobacias) CD 10 o pierde 1 zona.",
    "Una multitud: terreno difícil este turno (la distancia no cambia).",
    "Un perro sale ladrando y se le tira encima: DES CD 12 o queda derribado.",
    "Un carro le cierra el paso: FUE (Atletismo) CD 10 para saltarlo o pierde 1 zona.",
    "Ropa colgada a la altura de la cara: SAB (Percepción) CD 10 o queda cegado hasta su próximo turno.",
    "Un charco de barro: DES CD 10 o cae derribado.",
    "Una ventana abierta: puede meterse en una casa y ganar 1 zona… si los dueños no gritan.",
    "Un guardia del pueblo grita '¡alto!' y se suma a la persecución.",
    "Escaleras empinadas: FUE (Atletismo) CD 10 o pierde 1 zona.",
    "Un callejón sin salida: tiene que trepar (Atletismo CD 12) o dar la vuelta (pierde 1 zona).",
  ],
  bosque: [
    "Raíces escondidas: DES CD 10 o cae derribado.",
    "Una rama baja: DES CD 10 o 1d4 contundente y pierde 1 zona.",
    "Un arroyo: Atletismo CD 10 para cruzarlo rápido; si falla, pierde 1 zona.",
    "Zarzas: terreno difícil y 1d4 perforante.",
    "Un panal de avispas: CON CD 10 o queda envenenado hasta el final de su próximo turno.",
    "Pendiente con piedras sueltas: DES (Acrobacias) CD 12 o se desliza y pierde 1 zona.",
    "Niebla o maleza espesa: el que huye puede intentar esconderse ya.",
    "Un animal asustado (ciervo, jabalí) se cruza: DES CD 10 o queda derribado.",
    "Un tronco caído: Atletismo CD 10 para saltarlo o pierde 1 zona.",
    "Un barranco: hay que saltarlo (Atletismo CD 12) o rodearlo (pierde 2 zonas).",
  ],
};

function load() {
  try {
    return { lugar: "pueblo", turno: 0, ronda: 1, part: [], ultima: "", ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { lugar: "pueblo", turno: 0, ronda: 1, part: [], ultima: "" };
  }
}
function store(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* nada */ } }

const conMod = (v) => Math.floor(((Number(v) || 10) - 10) / 2);

async function fromSelection() {
  const ids = (await OBR.player.getSelection()) || [];
  if (!ids.length) {
    OBR.notification.show("Seleccioná uno o más tokens en el mapa primero.", "WARNING");
    return [];
  }
  const items = await OBR.scene.items.getItems(ids);
  return items.map((it) => {
    const f = it.metadata[FICHA_KEY] && it.metadata[FICHA_KEY].ficha;
    return {
      id: it.id,
      nombre: it.name || (f && f.nombre) || "Sin nombre",
      con: f && f.stats ? conMod(f.stats.CON) : 0,
      pasivaPerc: f ? passivePerception(f) : 10,
    };
  });
}

function passivePerception(f) {
  const m = String(f.detalles || "").match(/Percepci[oó]n pasiva\**\s*(\d+)/i);
  if (m) return Number(m[1]);
  const s = (f.secciones || []).map((x) => x.md).join(" ").match(/Percepci[oó]n pasiva\**\s*(\d+)/i);
  if (s) return Number(s[1]);
  return 10 + Math.floor(((Number(f.stats && f.stats.SAB) || 10) - 10) / 2);
}

function addParticipants(list, rol) {
  const s = load();
  for (const p of list) {
    if (s.part.some((x) => x.id === p.id)) continue;
    s.part.push({ ...p, rol, zona: rol === "huye" ? 0 : 2, dash: 0, agot: 0 });
  }
  store(s);
  renderPersecucion();
}

export function renderPersecucion() {
  const s = load();
  const huyen = s.part.filter((p) => p.rol === "huye");
  const persiguen = s.part.filter((p) => p.rol === "persigue");
  const actual = s.part[s.turno % Math.max(1, s.part.length)];
  const minPasiva = persiguen.length ? Math.max(...persiguen.map((p) => Number(p.pasivaPerc) || 10)) : null;
  const allOut = huyen.length && persiguen.length && persiguen.every((p) => p.zona >= 4);

  const row = (p, i) => {
    const libres = 3 + (Number(p.con) || 0);
    const extra = Math.max(0, p.dash - libres);
    return `<li class="${actual && actual === p ? "cur" : ""}">
      <div class="p-top">
        <span class="tag ${p.rol}">${p.rol === "huye" ? "Huye" : "Persigue"}</span>
        <b class="nm">${esc(p.nombre)}</b>
        <button class="x" data-del="${i}" title="Sacar">✕</button>
      </div>
      ${p.rol === "persigue" ? `
      <div class="p-row">
        <span class="muted">Distancia:</span>
        <button class="mini" data-z="${i}" data-dz="-1" title="Se acerca">◀</button>
        <b class="zona z${p.zona}">${ZONAS[p.zona]}</b>
        <button class="mini" data-z="${i}" data-dz="1" title="Se aleja">▶</button>
      </div>` : ""}
      <div class="p-row">
        <button class="mini" data-dash="${i}">🏃 Correr</button>
        <span class="muted">${p.dash}/${libres} gratis${extra ? ` · <b class="warn">CON CD 10 o +1 agotamiento</b>` : ""}</span>
        ${p.agot ? `<span class="agot">Agotamiento ${p.agot}</span>` : ""}
        ${extra ? `<button class="mini" data-agot="${i}" title="Falló la prueba de CON">+1 agot.</button>` : ""}
      </div>
    </li>`;
  };

  $("app").innerHTML = `
    <section class="box">
      <div class="opts">
        <select id="p-lugar"><option value="pueblo">En el pueblo</option><option value="bosque">Bosque o colinas</option></select>
        <span class="muted ronda">Ronda ${s.ronda}</span>
      </div>
      <div class="row">
        <button id="p-add-h">➕ Huye (seleccionados)</button>
        <button id="p-add-p">➕ Persiguen (seleccionados)</button>
      </div>
      <p class="hint">Seleccioná los tokens en el mapa y agregalos. Si tienen ficha, se toman su CON y su Percepción pasiva.</p>
    </section>

    ${s.part.length ? `<ul class="parts">${s.part.map(row).join("")}</ul>` : ""}

    ${s.part.length ? `
    <section class="box">
      ${actual ? `<p>Turno de <b>${esc(actual.nombre)}</b></p>` : ""}
      <div class="row">
        <button id="p-next" class="primary">⏭ Terminar turno (tira complicación)</button>
        <button id="p-reset">↺ Nueva persecución</button>
      </div>
      ${s.ultima ? `<div class="result">${esc(s.ultima)}</div><div class="row"><button id="p-show">📣 Contar a todos</button></div>` : ""}
      ${huyen.length ? `<p class="hint">${allOut
        ? `<b>Nadie lo ve:</b> el que huye puede esconderse con <b>Sigilo</b> contra Percepción pasiva ${minPasiva}. Si gana, se escapó.`
        : `Si el que huye queda <b>fuera de vista</b> de todos, puede esconderse con Sigilo contra la mejor Percepción pasiva${minPasiva ? ` (${minPasiva})` : ""}. Si uno llega a <b>¡Lo alcanza!</b>, puede agarrarlo o atacarlo.`}</p>` : ""}
    </section>` : `<p class="hint">Cada uno puede Correr gratis 3 + su modificador de CON veces; después, prueba de CON CD 10 o un nivel de agotamiento. Al final de cada turno se tira una complicación. Termina cuando lo atrapan, se escapa o abandonan.</p>`}`;

  $("p-lugar").value = s.lugar;
  $("p-lugar").onchange = (e) => { store({ ...load(), lugar: e.target.value }); renderPersecucion(); };
  $("p-add-h").onclick = async () => addParticipants(await fromSelection(), "huye");
  $("p-add-p").onclick = async () => addParticipants(await fromSelection(), "persigue");
  const mut = (fn) => { const x = load(); fn(x); store(x); renderPersecucion(); };
  document.querySelectorAll("[data-del]").forEach((b) => { b.onclick = () => mut((x) => { x.part.splice(Number(b.dataset.del), 1); x.turno = 0; }); });
  document.querySelectorAll("[data-z]").forEach((b) => {
    b.onclick = () => mut((x) => { const p = x.part[Number(b.dataset.z)]; p.zona = Math.max(0, Math.min(4, p.zona + Number(b.dataset.dz))); });
  });
  document.querySelectorAll("[data-dash]").forEach((b) => { b.onclick = () => mut((x) => { x.part[Number(b.dataset.dash)].dash += 1; }); });
  document.querySelectorAll("[data-agot]").forEach((b) => { b.onclick = () => mut((x) => { const p = x.part[Number(b.dataset.agot)]; p.agot = Math.min(6, (p.agot || 0) + 1); }); });
  if ($("p-next")) $("p-next").onclick = () => mut((x) => {
    const p = x.part[x.turno % x.part.length];
    const r = d(20);
    const comp = r <= 10 ? (COMPLICACIONES[x.lugar] || COMPLICACIONES.pueblo)[r - 1] : null;
    x.ultima = comp ? `🎲 ${p.nombre} (d20 = ${r}): ${comp}` : `🎲 ${p.nombre} (d20 = ${r}): sin complicaciones.`;
    x.turno += 1;
    if (x.turno % x.part.length === 0) x.ronda += 1;
  });
  if ($("p-reset")) $("p-reset").onclick = () => mut((x) => { x.part = []; x.turno = 0; x.ronda = 1; x.ultima = ""; });
  if ($("p-show")) $("p-show").onclick = () => OBR.broadcast.sendMessage(CHANNEL, { texto: load().ultima }, { destination: "ALL" });
}
