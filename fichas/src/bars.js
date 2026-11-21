import OBR, { buildShape, buildText } from "@owlbear-rodeo/sdk";
import { ID, KEY, isToken, estadosText, normalizeSheet, canSeeHp } from "./shared.js";

// Barras de vida y estados dibujados arriba/abajo de cada token.
// Son ítems "locales": cada navegador dibuja solo lo que esa persona puede ver.
//  - DM: todo.
//  - Jugadores: solo la vida de su propio personaje (o la de otros si el DM lo permite); de los demás, solo los estados.

const MARK = `${ID}/overlay`;
const COLORS = { ok: "#5fc9a8", mid: "#f2c66d", low: "#ff6b7d", bg: "#1b1d2b", temp: "#7fb8ff" };

function colorFor(pct) {
  return pct <= 0.25 ? COLORS.low : pct <= 0.5 ? COLORS.mid : COLORS.ok;
}

export function startBars() {
  let isGM = false;
  let me = null;
  let timer = null;
  let running = false;
  let again = false;

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, 150);
  };

  async function run() {
    if (running) { again = true; return; }
    running = true;
    try {
      await draw();
    } catch (e) {
      console.error("fichas: barras", e);
    }
    running = false;
    if (again) { again = false; schedule(); }
  }

  async function draw() {
    if (!(await OBR.scene.isReady())) return;
    const dpi = await OBR.scene.grid.getDpi();
    const tokens = (await OBR.scene.items.getItems()).filter((it) => isToken(it) && it.metadata[KEY] && it.metadata[KEY].ficha);
    const want = new Map();

    const boundsList = tokens.length ? await Promise.all(tokens.map((t) => OBR.scene.items.getItemBounds([t.id]))) : [];
    tokens.forEach((t, i) => {
      const d = t.metadata[KEY];
      const f = normalizeSheet({ ...d.ficha });
      if (!isGM && !t.visible) return;
      const b = boundsList[i];
      const showHp = canSeeHp(d, me, isGM);
      const w = Math.max(dpi * 0.6, b.width * 0.9);
      const h = Math.max(8, dpi * 0.13);
      const x = b.center.x - w / 2;
      const y = b.max.y + dpi * 0.04;
      if (showHp) {
        const max = Math.max(1, Number(f.pgMax) || 1);
        const cur = Math.max(0, Math.min(max, Number(f.pgActual) || 0));
        const pct = cur / max;
        const temp = Number(f.pgTemp) || 0;
        want.set(`${t.id}-hpbg`, { kind: "rect", parent: t.id, x: x - 1.5, y: y - 1.5, w: w + 3, h: h + 3, color: COLORS.bg, z: 1 });
        want.set(`${t.id}-hpfill`, { kind: "rect", parent: t.id, x, y, w: Math.max(0.01, w * pct), h, color: colorFor(pct), z: 2 });
        want.set(`${t.id}-hptxt`, {
          kind: "text", parent: t.id, x, y: y + h + 1, w, h: h * 1.6,
          text: `${cur}/${max}${temp > 0 ? ` +${temp}` : ""}`, size: h * 1.25, color: "#ffffff", z: 3,
        });
      }
      const est = estadosText(f);
      if (est) {
        want.set(`${t.id}-est`, {
          kind: "text", parent: t.id, x: b.center.x - b.width * 0.75, y: b.min.y - h * 2.4, w: b.width * 1.5, h: h * 2.2,
          text: est, size: h * 1.2, color: "#ffd86b", z: 3,
        });
      }
    });

    const existing = await OBR.scene.local.getItems((it) => it.metadata && it.metadata[MARK]);
    const have = new Map(existing.map((it) => [it.id, it]));

    const toDelete = existing.filter((it) => !want.has(it.id)).map((it) => it.id);
    if (toDelete.length) await OBR.scene.local.deleteItems(toDelete);

    const toAdd = [];
    const toUpdate = [];
    for (const [id, s] of want) {
      // La posición no entra en la firma: si el ítem está pegado al token, ya se movió con él.
      const { x, y, ...rest } = s;
      const sig = JSON.stringify({ ...rest, w: Math.round(s.w * 10), h: Math.round(s.h * 10) });
      const cur = have.get(id);
      const moved = cur && (Math.abs(cur.position.x - x) > 1 || Math.abs(cur.position.y - y) > 1);
      if (cur && cur.metadata[MARK] === sig && !moved) continue;
      if (cur) toUpdate.push([id, s, sig]);
      else toAdd.push(build(id, s, sig));
    }
    if (toUpdate.length) await OBR.scene.local.deleteItems(toUpdate.map(([id]) => id));
    for (const [id, s, sig] of toUpdate) toAdd.push(build(id, s, sig));
    if (toAdd.length) await OBR.scene.local.addItems(toAdd);
  }

  function build(id, s, sig) {
    if (s.kind === "rect") {
      return buildShape()
        .id(id)
        .shapeType("RECTANGLE")
        .width(s.w)
        .height(s.h)
        .position({ x: s.x, y: s.y })
        .fillColor(s.color)
        .fillOpacity(1)
        .strokeWidth(0)
        .strokeOpacity(0)
        .attachedTo(s.parent)
        .disableAttachmentBehavior(["ROTATION", "SCALE", "LOCKED", "COPY"])
        .layer("ATTACHMENT")
        .zIndex(s.z)
        .locked(true)
        .disableHit(true)
        .metadata({ [MARK]: sig })
        .build();
    }
    return buildText()
      .id(id)
      .textType("PLAIN")
      .plainText(s.text)
      .width(s.w)
      .height(s.h)
      .position({ x: s.x, y: s.y })
      .fontSize(s.size)
      .fontWeight(700)
      .textAlign("CENTER")
      .textAlignVertical("MIDDLE")
      .fillColor(s.color)
      .strokeColor("#000000")
      .strokeWidth(Math.max(1, s.size * 0.12))
      .padding(0)
      .attachedTo(s.parent)
      .disableAttachmentBehavior(["ROTATION", "SCALE", "LOCKED", "COPY"])
      .layer("ATTACHMENT")
      .zIndex(s.z)
      .locked(true)
      .disableHit(true)
      .metadata({ [MARK]: sig })
      .build();
  }

  (async () => {
    me = await OBR.player.getId();
    isGM = (await OBR.player.getRole()) === "GM";
    OBR.player.onChange((p) => {
      const gm = p.role === "GM";
      if (gm !== isGM) { isGM = gm; schedule(); }
    });
    OBR.scene.items.onChange(schedule);
    OBR.scene.onReadyChange((ready) => { if (ready) schedule(); });
    OBR.scene.grid.onChange(schedule);
    schedule();
  })();
}
