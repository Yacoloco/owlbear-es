import OBR from "@owlbear-rodeo/sdk";

// Búsquedas, rastreo y desafíos de habilidades.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const KEY = "impro-busqueda";
const CHANNEL = "com.yacoloco.impro/mostrar";

const TERRENOS = [
  ["blando", "Barro, nieve o tierra blanda", 10],
  ["tierra", "Tierra o pasto", 15],
  ["roca", "Roca pelada", 20],
];

export const CONSECUENCIAS = {
  exterior: [
    "Pasa el tiempo: cae la noche y el frío aprieta (o empieza a llover).",
    "Un centinela los ve a lo lejos y da aviso: el enemigo ya no puede ser sorprendido.",
    "Se cruzan con un encuentro del camino (usá ⚔️ Encuentro en la pestaña Impro).",
    "Alguien resbala en las rocas: 1d6 contundente.",
    "Pierden el rastro y tienen que volver atrás: una hora perdida.",
    "Hacen ruido y espantan una bandada de pájaros: algo los está mirando.",
    "Encuentran un rastro falso que los lleva en círculos.",
    "Se les acaba el agua o la comida antes de lo previsto.",
  ],
  infiltracion: [
    "Un guardia cambia de ronda justo ahora: hay que esperar o arriesgarse.",
    "Algo se cae y hace ruido: los guardias se ponen alerta.",
    "Una puerta está trabada y hay que buscar otro camino.",
    "Alguien los reconoce y pide algo a cambio de callarse.",
    "Se activa una trampa menor (1d6 de daño o una alarma).",
    "Pierden un objeto que llevaban (y alguien lo va a encontrar).",
  ],
  viaje: [
    "El camino está cortado y hay que rodear: medio día más.",
    "Un caballo o mula se lastima.",
    "Se cruzan con viajeros sospechosos.",
    "Una tormenta los obliga a buscar refugio.",
    "Alguien se enferma o queda agotado (1 nivel de agotamiento).",
    "Se pierden y terminan en un lugar inesperado.",
  ],
};

const TIPOS = [["exterior", "Búsqueda en el exterior"], ["infiltracion", "Infiltración"], ["viaje", "Viaje difícil"]];

function load() {
  try {
    return { terreno: "tierra", dias: 0, evidente: false, nombre: "Encontrar el campamento orco", tipo: "exterior", meta: 3, maxFallos: 3, ok: 0, fail: 0, log: [], ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { terreno: "tierra", dias: 0, evidente: false, nombre: "", tipo: "exterior", meta: 3, maxFallos: 3, ok: 0, fail: 0, log: [] };
  }
}
function store(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* nada */ } }

function cd(s) {
  const base = TERRENOS.find((t) => t[0] === s.terreno)[2];
  return base + 5 * (Number(s.dias) || 0) - (s.evidente ? 5 : 0);
}

const pips = (n, max, cls) => Array.from({ length: max }, (_, i) => `<span class="bpip ${cls} ${i < n ? "full" : ""}"></span>`).join("");

export function renderBusqueda() {
  const s = load();
  const done = s.ok >= s.meta ? "win" : s.fail >= s.maxFallos ? "lose" : null;
  $("app").innerHTML = `
    <section class="box">
      <h4>🐾 Rastrear (Sabiduría · Supervivencia)</h4>
      <div class="opts">
        <select id="b-ter">${TERRENOS.map(([k, l, v]) => `<option value="${k}">${l} (CD ${v})</option>`).join("")}</select>
      </div>
      <div class="opts">
        <label class="lbl">Días desde que pasaron <input id="b-dias" type="number" min="0" max="10" value="${esc(s.dias)}" /></label>
        <label class="lbl"><input id="b-evi" type="checkbox" ${s.evidente ? "checked" : ""}/> Rastro evidente (sangre, fogatas)</label>
      </div>
      <div class="big">CD <b>${cd(s)}</b></div>
      <p class="hint">Si fallan, pierden el rastro: pueden volver a buscarlo, pero les cuesta tiempo (por ejemplo, 1 hora).</p>
    </section>

    <section class="box">
      <h4>🧩 Desafío de búsqueda</h4>
      <input id="c-nom" class="full" value="${esc(s.nombre)}" placeholder="¿Qué están intentando?" />
      <div class="opts">
        <select id="c-tipo">${TIPOS.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
        <label class="lbl">Éxitos <input id="c-meta" type="number" min="2" max="8" value="${esc(s.meta)}" /></label>
        <label class="lbl">Fallos <input id="c-max" type="number" min="1" max="6" value="${esc(s.maxFallos)}" /></label>
      </div>
      <div class="track"><span>Éxitos</span>${pips(s.ok, s.meta, "ok")}</div>
      <div class="track"><span>Fallos</span>${pips(s.fail, s.maxFallos, "bad")}</div>
      ${done === "win" ? `<div class="result win">✅ ¡Lo lograron! Llegan con ventaja: sorpresa, un camino oculto o información sobre el enemigo.</div>` : ""}
      ${done === "lose" ? `<div class="result lose">❌ No les salió: igual llegan, pero tarde, cansados o con el enemigo esperándolos.</div>` : ""}
      <div class="row">
        <button id="c-ok" class="primary" ${done ? "disabled" : ""}>✔ Éxito</button>
        <button id="c-fail" ${done ? "disabled" : ""}>✖ Fallo</button>
        <button id="c-reset">↺ Reiniciar</button>
      </div>
      ${s.log.length ? `<ul class="log">${s.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : `<p class="hint">Cada jugador cuenta cómo ayuda y elige la habilidad (Supervivencia, Percepción, Atletismo, hablar con alguien…). Vos fijás la CD (10 fácil, 15 normal, 20 difícil) y marcás si les salió. Cada fallo trae una consecuencia.</p>`}
      ${s.log.length ? `<div class="row"><button id="c-show">📣 Contar la última a todos</button></div>` : ""}
    </section>`;

  $("b-ter").value = s.terreno;
  $("c-tipo").value = s.tipo;
  const upd = (patch) => { store({ ...load(), ...patch }); renderBusqueda(); };
  $("b-ter").onchange = (e) => upd({ terreno: e.target.value });
  $("b-dias").onchange = (e) => upd({ dias: Math.max(0, Number(e.target.value) || 0) });
  $("b-evi").onchange = (e) => upd({ evidente: e.target.checked });
  $("c-nom").onchange = (e) => upd({ nombre: e.target.value });
  $("c-tipo").onchange = (e) => upd({ tipo: e.target.value });
  $("c-meta").onchange = (e) => upd({ meta: Math.max(2, Math.min(8, Number(e.target.value) || 3)) });
  $("c-max").onchange = (e) => upd({ maxFallos: Math.max(1, Math.min(6, Number(e.target.value) || 3)) });
  $("c-ok").onclick = () => { const x = load(); upd({ ok: x.ok + 1, log: [`✔ Éxito (${x.ok + 1}/${x.meta})`, ...x.log].slice(0, 12) }); };
  $("c-fail").onclick = () => {
    const x = load();
    const c = pick(CONSECUENCIAS[x.tipo] || CONSECUENCIAS.exterior);
    upd({ fail: x.fail + 1, log: [`✖ ${c}`, ...x.log].slice(0, 12) });
  };
  $("c-reset").onclick = () => upd({ ok: 0, fail: 0, log: [] });
  if ($("c-show")) $("c-show").onclick = () => {
    const l = load().log[0] || "";
    OBR.broadcast.sendMessage(CHANNEL, { texto: l.replace(/^✖ /, "").replace(/^✔ /, "") }, { destination: "ALL" });
  };
}
