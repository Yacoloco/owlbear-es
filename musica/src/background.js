import OBR from "@owlbear-rodeo/sdk";
import { STATE_KEY } from "./shared.js";

// Pone un ♪ en el ícono mientras suena algo y avisa a los jugadores
// que todavía no abrieron el reproductor en esta pestaña.
OBR.onReady(() => {
  let lastKey = null;

  async function check(metadata) {
    const chans = (metadata[STATE_KEY] && metadata[STATE_KEY].channels) || {};
    const active = Object.entries(chans).filter(([, s]) => s && s.id && !s.paused);
    await OBR.action.setBadgeText(active.length ? "♪" : undefined);
    if (!active.length) return;

    const key = active.map(([id, s]) => `${id}:${s.kind}:${s.id}`).join("|");
    if (key === lastKey) return;
    lastKey = key;

    const role = await OBR.player.getRole();
    if (role === "GM") return;
    if (sessionStorage.getItem("musica-abierta") === "1") return;
    OBR.notification.show("🎵 El DM puso música. Abrí \"Música\" (arriba a la izquierda) para escucharla.", "INFO");
  }

  OBR.room.getMetadata().then(check);
  OBR.room.onMetadataChange(check);
});
