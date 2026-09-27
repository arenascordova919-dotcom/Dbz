import { system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { getLoadout, getNumber } from "./playerData.js";

function health(player) {
  try {
    const component = player.getComponent("minecraft:health");
    return { current: Math.max(0, Math.ceil(component.currentValue)), max: Math.ceil(component.effectiveMax) };
  } catch {
    return { current: 20, max: 20 };
  }
}

export function startHudBridge() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const hp = health(player);
      const loadout = getLoadout(player);
      const selected = loadout.slots[loadout.selectedSlot - 1] ?? "Empty";
      player.setDynamicProperty("dbz:hud_hp", hp.current);
      player.setDynamicProperty("dbz:hud_hp_max", hp.max);
      player.setDynamicProperty("dbz:hud_ki", Math.floor(getNumber(player, "ki")));
      player.setDynamicProperty("dbz:hud_stamina", Math.floor(getNumber(player, "stamina")));
      player.setDynamicProperty("dbz:hud_level", Math.floor(getNumber(player, "level")));
      player.setDynamicProperty("dbz:hud_selected", selected);
    }
  }, Math.max(4, CONFIG.hudIntervalTicks));
}
