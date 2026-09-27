import { system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { getNumber, getPowerLevel } from "./playerData.js";

function bar(value, max, filled = "§b", empty = "§8") {
  const segments = 10;
  const count = Math.max(0, Math.min(segments, Math.round((value / max) * segments)));
  return filled + "▰".repeat(count) + empty + "▱".repeat(segments - count);
}

export function startHud() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const ki = getNumber(player, "ki");
      const stamina = getNumber(player, "stamina");
      const level = getNumber(player, "level");
      const pl = getPowerLevel(player);
      player.onScreenDisplay.setActionBar(
        `§fLV §e${level} §7| §fPL §6${pl}\n§bKI ${bar(ki, CONFIG.maxKi)} §f${Math.floor(ki)} §7| §aSTM ${bar(stamina, CONFIG.maxStamina, "§a")} §f${Math.floor(stamina)}`
      );
    }
  }, CONFIG.hudIntervalTicks);
}
