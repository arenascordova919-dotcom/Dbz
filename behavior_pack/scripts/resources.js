import { system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { clampResource, getNumber } from "./playerData.js";

export function startResourceRegeneration() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const ki = getNumber(player, "ki");
      const stamina = getNumber(player, "stamina");
      if (ki < CONFIG.maxKi) clampResource(player, "ki", CONFIG.maxKi, ki + CONFIG.kiRegenPerTick);
      if (stamina < CONFIG.maxStamina) clampResource(player, "stamina", CONFIG.maxStamina, stamina + CONFIG.staminaRegenPerTick);
    }
  }, 1);
}
