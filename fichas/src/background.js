import OBR from "@owlbear-rodeo/sdk";
import { ID, KEY, MODAL_ID, BASE, VERSION, syncScene, ROLL_CHANNEL } from "./shared.js";
import { startBars } from "./bars.js";

function openSheet(itemId) {
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

  // Tiradas de los demás (y las propias públicas).
  OBR.broadcast.onMessage(ROLL_CHANNEL, (e) => {
    if (e.data && e.data.msg) OBR.notification.show(String(e.data.msg).slice(0, 300), "DEFAULT");
  });

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
