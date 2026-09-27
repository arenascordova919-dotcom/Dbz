import { selectSkillSlot } from "./playerData.js";
import { castSelectedTechnique } from "./techniques.js";

// HUD/button adapters call these functions; they do not require a held technique item.
export function useSelectedTechnique(player) {
  return castSelectedTechnique(player);
}

export function setTechniqueSlot(player, slot) {
  selectSkillSlot(player, slot);
}
