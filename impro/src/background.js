import OBR from "@owlbear-rodeo/sdk";

// Lo que el DM "muestra a todos" desde el Kit de impro aparece como aviso.
OBR.onReady(() => {
  OBR.broadcast.onMessage("com.yacoloco.impro/mostrar", (e) => {
    if (e.data && e.data.texto) OBR.notification.show(String(e.data.texto).slice(0, 400), "INFO");
  });
});
