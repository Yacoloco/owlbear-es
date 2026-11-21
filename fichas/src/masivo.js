import OBR from "@owlbear-rodeo/sdk";
import { KEY, TIPOS, $, esc, normalizeSheet, applyDamage, applyHeal } from "./shared.js";

// Daño o curación a varios tokens a la vez (solo DM).
export const MASS_ID = "com.yacoloco.fichas/masivo";

const ids = (new URLSearchParams(location.search).get("ids") || "").split(",").filter(Boolean);
let tokens = [];
const half = new Set();
let amount = "";

function row(it) {
  const f = it.metadata[KEY].ficha;
  const max = Math.max(1, Number(f.pgMax) || 1);
  const cur = Math.max(0, Number(f.pgActual) || 0);
  const pct = Math.round((cur / max) * 100);
  return `<li>
    <span class="tag ${esc(f.tipo)}">${TIPOS[f.tipo] || ""}</span>
    <span class="nm">${esc(it.name || f.nombre)}</span>
    <span class="muted">${cur}/${max}${Number(f.pgTemp) > 0 ? ` +${esc(f.pgTemp)}` : ""}</span>
    <span class="hpmini"><i style="width:${pct}%"></i></span>
    <label class="half" title="Pasó la salvación: recibe la mitad"><input type="checkbox" data-half="${esc(it.id)}" ${half.has(it.id) ? "checked" : ""}/> mitad</label>
  </li>`;
}

function render() {
  const sinFicha = ids.length - tokens.length;
  $("app").innerHTML = `
    <h2>🗡 Daño o curación a varios</h2>
    ${tokens.length ? `
    <ul class="tokens mass">${tokens.map(row).join("")}</ul>
    ${sinFicha > 0 ? `<p class="hint">${sinFicha} token${sinFicha > 1 ? "s" : ""} seleccionado${sinFicha > 1 ? "s" : ""} sin ficha (no se tocan).</p>` : ""}
    <div class="row mass-ctrl">
      <input id="amount" type="number" min="0" placeholder="Cantidad" value="${esc(amount)}" />
      <button id="dmg" class="primary">🗡 Daño</button>
      <button id="heal">💚 Curar</button>
      <button id="temp">✨ PG temp.</button>
    </div>
    <p class="hint">Tildá "mitad" en los que pasaron la salvación (por ejemplo, contra una bola de fuego): reciben la mitad redondeada hacia abajo.</p>`
    : `<p class="muted">Ninguno de los tokens seleccionados tiene ficha.</p>`}`;
  if (!tokens.length) return;
  const input = $("amount");
  input.focus();
  input.oninput = (e) => { amount = e.target.value; };
  input.onkeydown = (e) => { if (e.key === "Enter") apply("dmg"); };
  document.querySelectorAll("[data-half]").forEach((c) => {
    c.onchange = () => { if (c.checked) half.add(c.dataset.half); else half.delete(c.dataset.half); };
  });
  $("dmg").onclick = () => apply("dmg");
  $("heal").onclick = () => apply("heal");
  $("temp").onclick = () => apply("temp");
}

async function apply(kind) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) { OBR.notification.show("Poné una cantidad.", "WARNING"); return; }
  const notes = [];
  await OBR.scene.items.updateItems(tokens.map((t) => t.id), (items) => {
    for (const it of items) {
      const d = it.metadata[KEY];
      if (!d || !d.ficha) continue;
      const f = normalizeSheet(JSON.parse(JSON.stringify(d.ficha)));
      const value = half.has(it.id) ? Math.floor(n / 2) : n;
      if (kind === "dmg") notes.push(...applyDamage(f, value));
      else if (kind === "heal") applyHeal(f, value);
      else f.pgTemp = Math.max(Number(f.pgTemp) || 0, value);
      it.metadata[KEY] = { ...d, ficha: f, rev: (d.rev || 0) + 1 };
    }
  });
  for (const note of notes.slice(0, 6)) OBR.notification.show(note, "WARNING");
  OBR.modal.close(MASS_ID);
}

OBR.onReady(async () => {
  $("close").onclick = () => OBR.modal.close(MASS_ID);
  const items = ids.length ? await OBR.scene.items.getItems(ids) : [];
  tokens = items.filter((it) => it.metadata[KEY] && it.metadata[KEY].ficha);
  render();
});
