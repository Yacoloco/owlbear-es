import { useEffect } from "react";
import { Advantage, useDiceControlsStore } from "../controls/store";
import { DiceType } from "../types/DiceType";

/**
 * Recibe "preparar dados" de la extensión Fichas (mismo sitio, vía localStorage):
 * carga los dados, el bonus y la ventaja en la bandeja, sin tirar.
 */
export const PRESET_KEY = "dados-preparar";
const MAX_AGE = 60_000;

interface Preset {
  dice: Partial<Record<DiceType, number>>;
  bonus?: number;
  advantage?: Advantage;
  t: number;
}

function isPreset(value: any): value is Preset {
  return value && typeof value === "object" && typeof value.t === "number" && value.dice && typeof value.dice === "object";
}

function applyPreset(preset: Preset) {
  const store = useDiceControlsStore.getState();
  store.resetDiceCounts();
  const used = new Set<DiceType>();
  for (const die of useDiceControlsStore.getState().diceSet.dice) {
    const count = preset.dice[die.type];
    if (count && !used.has(die.type)) {
      used.add(die.type);
      useDiceControlsStore.getState().changeDieCount(die.id, Math.max(0, Math.min(20, Math.floor(count))));
    }
  }
  useDiceControlsStore.getState().setDiceBonus(Math.floor(preset.bonus || 0));
  useDiceControlsStore.getState().setDiceAdvantage(preset.advantage || null);
}

function readPending(raw: string | null) {
  if (!raw) return;
  try {
    const preset = JSON.parse(raw);
    if (isPreset(preset) && Date.now() - preset.t < MAX_AGE) {
      applyPreset(preset);
    }
  } catch {
    // nada
  }
  try {
    localStorage.removeItem(PRESET_KEY);
  } catch {
    // nada
  }
}

export function PresetListener() {
  useEffect(() => {
    try {
      readPending(localStorage.getItem(PRESET_KEY));
    } catch {
      // nada
    }
    function handleStorage(event: StorageEvent) {
      if (event.key === PRESET_KEY && event.newValue) {
        readPending(event.newValue);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  return null;
}
