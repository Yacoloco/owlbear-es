import OBR from "@owlbear-rodeo/sdk";
import { STATE_KEY } from "./shared.js";

// Pone un ♪ en el ícono mientras suena música y avisa a los jugadores
// que todavía no abrieron el reproductor en esta pestaña.
OBR.onReady(() => {
  let lastKey = null;

  async function check(metadata) {
    const state = metadata[STATE_KEY];
    const playing = Boolean(state && state.id && !state.paused);
    await OBR.action.setBadgeText(playing ? "♪" : undefined);
    if (!playing) return;

    const key = `${state.kind}:${state.id}:${state.rev}`;
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
