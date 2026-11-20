import OBR from "@owlbear-rodeo/sdk";
import {
  KEY, MODAL_ID, BASE, VERSION, TIPOS, $, esc,
  loadLibrary, saveLibrary, mergeIntoLibrary, parseImport, sortSheets,
} from "./shared.js";

let isGM = false;
let me = null;
let tokens = []; // tokens de la escena con ficha
let libFilter = "";

function openSheet(itemId) {
  OBR.modal.open({
    id: MODAL_ID,
    url: `${BASE}/ficha.html?v=${VERSION}&item=${encodeURIComponent(itemId)}`,
    width: 600,
    height: 820,
  });
}

function tokenRow(it, showOwner) {
  const d = it.metadata[KEY];
  const f = d.ficha;
  const pct = Math.max(0, Math.min(100, Math.round(((Number(f.pgActual) || 0) / Math.max(1, Number(f.pgMax) || 1)) * 100)));
  return `<li data-id="${esc(it.id)}">
    <span class="tag ${esc(f.tipo)}">${TIPOS[f.tipo] || ""}</span>
    <span class="nm">${esc(f.nombre)}${it.name && it.name !== f.nombre ? ` <span class="muted">(${esc(it.name)})</span>` : ""}</span>
    ${showOwner ? `<span class="muted owner">${d.owner ? "👤 " + esc(d.ownerName || "jugador") : "🔒"}</span>` : ""}
    <span class="hpmini" title="${esc(f.pgActual)}/${esc(f.pgMax)} PG"><i style="width:${pct}%"></i></span>
  </li>`;
}

function render() {
  const mine = tokens.filter((it) => it.metadata[KEY].owner === me);
  $("mine").classList.toggle("hidden", isGM && !mine.length);
  $("mine-list").innerHTML = mine.length
    ? mine.map((it) => tokenRow(it, false)).join("")
    : `<li class="empty muted">El DM todavía no te asignó una ficha en esta escena.</li>`;

  document.querySelectorAll(".gm-only").forEach((el) => el.classList.toggle("hidden", !isGM));
  if (isGM) {
    $("scene-list").innerHTML = tokens.length
      ? tokens.map((it) => tokenRow(it, true)).join("")
      : `<li class="empty muted">Ningún token de esta escena tiene ficha todavía.</li>`;
    renderLibrary();
  }
  document.querySelectorAll(".tokens li[data-id]").forEach((li) => { li.onclick = () => openSheet(li.dataset.id); });
}

function renderLibrary() {
  const lib = sortSheets(loadLibrary());
  const q = libFilter.trim().toLowerCase();
  $("lib-count").textContent = `(${lib.length})`;
  $("lib-list").innerHTML = lib.length
    ? lib.filter((f) => !q || String(f.nombre).toLowerCase().includes(q)).map((f) => `
      <li><span class="tag ${esc(f.tipo)}">${TIPOS[f.tipo] || ""}</span><span class="nm">${esc(f.nombre)}</span>
        <button data-del="${esc(f.id)}" title="Borrar de la biblioteca">✕</button></li>`).join("")
    : `<li class="empty muted">Vacía. Importá el archivo <b>Fichas Phandelver.json</b> de tu carpeta DnD/DM.</li>`;
  document.querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = () => {
      if (b.dataset.armed) {
        saveLibrary(loadLibrary().filter((f) => f.id !== b.dataset.del));
        renderLibrary();
      } else {
        b.dataset.armed = "1";
        b.textContent = "¿Borrar?";
        b.classList.add("danger");
        setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "✕"; b.classList.remove("danger"); } }, 3000);
      }
    };
  });
}

async function loadTokens() {
  try {
    const ready = await OBR.scene.isReady();
    tokens = ready ? await OBR.scene.items.getItems((it) => Boolean(it.metadata[KEY] && it.metadata[KEY].ficha)) : [];
  } catch {
    tokens = [];
  }
  tokens.sort((a, b) => String(a.metadata[KEY].ficha.nombre).localeCompare(String(b.metadata[KEY].ficha.nombre), "es"));
  render();
}

OBR.onReady(async () => {
  me = await OBR.player.getId();
  isGM = (await OBR.player.getRole()) === "GM";
  OBR.player.onChange((p) => {
    const gm = p.role === "GM";
    if (gm !== isGM) { isGM = gm; render(); }
  });

  $("import").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const fichas = parseImport(reader.result);
        mergeIntoLibrary(fichas);
        OBR.notification.show(`📥 ${fichas.length} fichas importadas a tu biblioteca.`, "SUCCESS");
      } catch {
        OBR.notification.show("Ese archivo no tiene fichas válidas.", "ERROR");
      }
      e.target.value = "";
      renderLibrary();
    };
    reader.readAsText(file);
  };
  $("export").onclick = () => {
    const blob = new Blob([JSON.stringify({ formato: "fichas-owlbear", version: 1, fichas: loadLibrary() }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Fichas (biblioteca).json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $("lib-filter").oninput = (e) => { libFilter = e.target.value; renderLibrary(); };
  window.addEventListener("storage", () => isGM && renderLibrary());

  await loadTokens();
  OBR.scene.items.onChange(loadTokens);
  OBR.scene.onReadyChange(loadTokens);
});
