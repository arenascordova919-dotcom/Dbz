import { ButtonState, InputButton, system, world } from "@minecraft/server";
import { getNumber, selectSkillSlot } from "./playerData.js";
import { castSelectedTechnique } from "./techniques.js";

const lastSneakPress = new Map();
const DOUBLE_TAP_TICKS = 8;

export function useSelectedTechnique(player) {
  return castSelectedTechnique(player);
}

export function setTechniqueSlot(player, slot) {
  selectSkillSlot(player, slot);
}

export function registerTechniqueControls() {
  world.afterEvents.playerButtonInput.subscribe(
    ({ player, button, newButtonState }) => {
      if (button !== InputButton.Sneak || newButtonState !== ButtonState.Pressed) return;
      if (getNumber(player, "characterCreated") < 1) return;

      const now = system.currentTick;
      const previous = lastSneakPress.get(player.id) ?? -9999;
      const delta = now - previous;

      if (delta >= 1 && delta <= DOUBLE_TAP_TICKS) {
        lastSneakPress.set(player.id, -9999);
        system.run(() => {
          try {
            castSelectedTechnique(player);
          } catch (error) {
            console.warn("[Dragon Breakers] Technique input failed: " + error);
          }
        });
        return;
      }

      lastSneakPress.set(player.id, now);
    },
    { buttons: [InputButton.Sneak], state: ButtonState.Pressed }
  );
}
