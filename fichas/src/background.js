import OBR from "@owlbear-rodeo/sdk";
import { ID, KEY, MODAL_ID, BASE, VERSION } from "./shared.js";

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
});
