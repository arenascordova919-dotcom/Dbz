import { world } from "@minecraft/server";
import { castSelectedTechnique } from "./techniques.js";
import { selectSkillSlot } from "./playerData.js";

export function registerTechniqueControls() {
  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (source.typeId !== "minecraft:player") return;
    if (itemStack?.typeId !== "dbz:menu") return;
    // Temporary mobile-safe bridge until the RP HUD buttons are wired.
    castSelectedTechnique(source);
  });
}

export function setTechniqueSlot(player, slot) {
  selectSkillSlot(player, slot);
}
