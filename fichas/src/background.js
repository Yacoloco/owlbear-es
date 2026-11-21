import OBR from "@owlbear-rodeo/sdk";
import {
  ID, KEY, MODAL_ID, BASE, VERSION, syncScene, INIT_KEY,
  PENDING_KEY, DICE_ROLL_KEY, DICE_VALUES_KEY, rollSig, rollHasType, diceTotal, normalizeSheet,
} from "./shared.js";
import { startBars } from "./bars.js";

function openSheet(itemId) {
  // Al abrir la ficha se deselecciona el token, así no queda el menú del click derecho abierto.
  OBR.player.deselect().catch(() => { /* nada */ });
  OBR.modal.open({
    id: MODAL_ID,
    url: `${BASE}/ficha.html?v=${VERSION}&item=${encodeURIComponent(itemId)}`,
    width: 600,
    height: 820,
  });
}

OBR.onReady(async () => {
  const me = await OBR.player.getId();

  // DM: cualquier token. Abre la ficha (o el selector si todavía no tiene).
  OBR.contextMenu.create({
    id: `${ID}/menu-dm`,
    icons: [
      {
        icon: `${BASE}/icon.svg`,
        label: "Ficha",
        filter: { roles: ["GM"], max: 1, every: [{ key: "type", value: "IMAGE" }] },
      },
    ],
    onClick(context) {
      if (context.items[0]) openSheet(context.items[0].id);
    },
  });

  // Jugadores: solo aparece en los tokens cuya ficha es suya.
  OBR.contextMenu.create({
    id: `${ID}/menu-jugador`,
    icons: [
      {
        icon: `${BASE}/icon.svg`,
        label: "Mi ficha",
        filter: { roles: ["PLAYER"], max: 1, every: [{ key: ["metadata", KEY, "owner"], value: me }] },
      },
    ],
    onClick(context) {
      if (context.items[0]) openSheet(context.items[0].id);
    },
  });

  // Iniciativa y dados de golpe: cuando el jugador tira en Dados, se anota solo.
  async function checkPending(metadata) {
    let pending;
    try { pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch { pending = null; }
    if (!pending || Date.now() - pending.t > 5 * 60_000) return;
    const roll = metadata[DICE_ROLL_KEY];
    const values = metadata[DICE_VALUES_KEY];
    if (!roll || !values) return;
    const sig = rollSig(roll);
    if (!sig || sig === pending.sig0 || !rollHasType(roll, pending.type)) return;
    if (Object.values(values).some((v) => v === null || v === undefined)) return; // todavía rodando
    const total = diceTotal(roll, values);
    if (total === null) return;
    try { localStorage.removeItem(PENDING_KEY); } catch { /* nada */ }
    try {
      await OBR.scene.items.updateItems([pending.itemId], (items) => {
        for (const it of items) {
          if (pending.kind === "init") {
            const prev = it.metadata[INIT_KEY];
            it.metadata[INIT_KEY] = { count: String(total), active: Boolean(prev && prev.active) };
          } else if (pending.kind === "heal" && it.metadata[KEY]) {
            const d = it.metadata[KEY];
            const f = normalizeSheet({ ...d.ficha });
            f.pgActual = Math.min(Number(f.pgMax) || 0, (Number(f.pgActual) || 0) + Math.max(0, total));
            it.metadata[KEY] = { ...d, ficha: f, rev: (d.rev || 0) + 1 };
          }
        }
      });
    } catch (e) {
      console.error("fichas: anotar tirada", e);
    }
  }
  OBR.player.onChange((p) => checkPending(p.metadata || {}));

  // Barras de vida y estados sobre los tokens.
  startBars();

  // Fichas automáticas por nombre: las pone el navegador del DM, en cada escena que abre.
  let timer = null;
  let running = false;
  let again = false;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, 400);
  };
  async function run() {
    if (running) { again = true; return; }
    if ((await OBR.player.getRole()) !== "GM") return;
    running = true;
    try {
      await syncScene(OBR, KEY);
    } catch (e) {
      console.error("fichas: sync", e);
    }
    running = false;
    if (again) { again = false; schedule(); }
  }
  OBR.scene.onReadyChange((ready) => { if (ready) schedule(); });
  OBR.scene.items.onChange(schedule);
  window.addEventListener("storage", schedule);
  schedule();
});
