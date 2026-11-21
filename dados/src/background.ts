import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "./plugin/getPluginId";

OBR.onReady(() => {
  OBR.popover.open({
    id: getPluginId("popover"),
    url: new URL("popover.html", window.location.href).href,
    width: 0,
    height: 0,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    disableClickAway: true,
    hidePaper: true,
    marginThreshold: 0,
  });
});

// Cuando la extensión Fichas prepara dados, se abre la bandeja de Dados
// (si esta versión del SDK lo permite) para que el jugador solo tenga que tirar.
window.addEventListener("storage", (event) => {
  if (event.key !== "dados-preparar" || !event.newValue) return;
  const action = (OBR as any).action;
  if (action && typeof action.open === "function") {
    try {
      action.open();
    } catch {
      // nada
    }
  }
});
