import OBR from "@owlbear-rodeo/sdk";
import {
  ID, KEY, MODAL_ID, BASE, VERSION, syncScene, INIT_KEY, BB_KEY,
  PENDING_KEY, DICE_ROLL_KEY, DICE_VALUES_KEY, rollSig, rollHasType, diceTotal, normalizeSheet,
  applyHeal, applyDeathSave, firstD20,
} from "./shared.js";
import { startBars } from "./bars.js";

function openSheet(itemId, turno = false) {
  // Al abrir la ficha se deselecciona el token, así no queda el menú del click derecho abierto.
  OBR.player.deselect().catch(() => { /* nada */ });
  OBR.modal.open({
    id: MODAL_ID,
    url: `${BASE}/ficha.html?v=${VERSION}&item=${encodeURIComponent(itemId)}${turno ? "&turno=1" : ""}`,
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

  // DM: daño o curación a todos los tokens seleccionados de una.
  OBR.contextMenu.create({
    id: `${ID}/menu-masivo`,
    icons: [
      {
        icon: `${BASE}/icon-dmg.svg`,
        label: "Daño/curación",
        filter: { roles: ["GM"], every: [{ key: "type", value: "IMAGE" }] },
      },
    ],
    onClick(context) {
      const ids = context.items.map((it) => it.id).join(",");
      OBR.player.deselect().catch(() => { /* nada */ });
      OBR.modal.open({
        id: "com.yacoloco.fichas/masivo",
        url: `${BASE}/masivo.html?v=${VERSION}&ids=${encodeURIComponent(ids)}`,
        width: 460,
        height: 520,
      });
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
    let note = "";
    try {
      await OBR.scene.items.updateItems([pending.itemId], (items) => {
        for (const it of items) {
          if (pending.kind === "init") {
            const prev = it.metadata[INIT_KEY];
            it.metadata[INIT_KEY] = { count: String(total), active: Boolean(prev && prev.active) };
          } else if (pending.kind === "heal" && it.metadata[KEY]) {
            const d = it.metadata[KEY];
            const f = normalizeSheet(JSON.parse(JSON.stringify(d.ficha)));
            applyHeal(f, Math.max(0, total));
            it.metadata[KEY] = { ...d, ficha: f, rev: (d.rev || 0) + 1 };
          } else if (pending.kind === "death" && it.metadata[KEY]) {
            const d = it.metadata[KEY];
            const f = normalizeSheet(JSON.parse(JSON.stringify(d.ficha)));
            const nat = firstD20(roll, values);
            note = applyDeathSave(f, nat === null ? total : nat);
            it.metadata[KEY] = { ...d, ficha: f, rev: (d.rev || 0) + 1 };
          }
        }
      });
      if (note) OBR.notification.show(note, "INFO");
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

  // "Es tu turno": cuando Battle Board le da el turno a un token con ficha propia, se abre la ficha.
  let prevActive = null;
  async function checkTurn() {
    try {
      if (!(await OBR.scene.isReady())) { prevActive = null; return; }
      const gm = (await OBR.player.getRole()) === "GM";
      const items = await OBR.scene.items.getItems((it) => Boolean(it.metadata[BB_KEY] && it.metadata[BB_KEY].active === true));
      const now = new Set(items.map((it) => it.id));
      if (prevActive) {
        let dmAuto = false;
        try { dmAuto = localStorage.getItem("fichas-turno-dm") === "1"; } catch { /* nada */ }
        for (const it of items) {
          if (prevActive.has(it.id)) continue;
          const d = it.metadata[KEY];
          if (!d || !d.ficha) continue;
          const mine = !gm && d.owner === me;
          const dmToken = gm && dmAuto && d.ficha.tipo !== "pj";
          if (mine || dmToken) { openSheet(it.id, true); break; }
        }
      }
      prevActive = now;
    } catch (e) {
      console.error("fichas: turno", e);
    }
  }
  OBR.scene.items.onChange(() => checkTurn());
  OBR.scene.onReadyChange(() => { prevActive = null; checkTurn(); });
  checkTurn();
  window.addEventListener("storage", schedule);
  schedule();
});
