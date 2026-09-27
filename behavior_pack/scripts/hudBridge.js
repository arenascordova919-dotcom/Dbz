import { system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { getLoadout, getNumber } from "./playerData.js";

const cache = new Map();
function health(player) {
  try {
    const component = player.getComponent("minecraft:health");
    return { current: Math.max(0, Math.ceil(component.currentValue)), max: Math.ceil(component.effectiveMax) };
  } catch { return { current: 20, max: 20 }; }
}
function writeIfChanged(player, key, value, state) {
  if (state[key] === value) return;
  try { player.setDynamicProperty("dbz:" + key, value); state[key] = value; } catch {}
}
export function startHudBridge() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const state = cache.get(player.id) ?? {};
      const hp = health(player), loadout = getLoadout(player);
      writeIfChanged(player, "hud_hp", hp.current, state);
      writeIfChanged(player, "hud_hp_max", hp.max, state);
      writeIfChanged(player, "hud_ki", Math.floor(getNumber(player, "ki")), state);
      writeIfChanged(player, "hud_stamina", Math.floor(getNumber(player, "stamina")), state);
      writeIfChanged(player, "hud_level", Math.floor(getNumber(player, "level")), state);
      writeIfChanged(player, "hud_selected", loadout.slots[loadout.selectedSlot - 1] ?? "Empty", state);
      cache.set(player.id, state);
    }
  }, Math.max(4, CONFIG.hudIntervalTicks));
}
