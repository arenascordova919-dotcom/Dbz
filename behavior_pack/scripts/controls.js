import { getLoadout, selectSkillSlot } from "./playerData.js";
import { castSelectedTechnique } from "./techniques.js";

export function useSelectedTechnique(player) {
  return castSelectedTechnique(player);
}

export function setTechniqueSlot(player, slot) {
  selectSkillSlot(player, slot);
}

export function cycleTechniqueSlot(player) {
  const loadout = getLoadout(player);
  let next = loadout.selectedSlot;
  for (let i = 0; i < 4; i++) {
    next = (next % 4) + 1;
    const name = loadout.slots[next - 1];
    if (name && name !== "Empty") {
      selectSkillSlot(player, next);
      return { slot: next, name };
    }
  }
  return { slot: loadout.selectedSlot, name: loadout.slots[loadout.selectedSlot - 1] ?? "Empty" };
}
