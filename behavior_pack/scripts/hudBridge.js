import { system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { getLoadout, getNumber, getPowerLevel, getString, getXpForNextLevel } from "./playerData.js";

const cache = new Map();

function health(player) {
  try {
    const component = player.getComponent("minecraft:health");
    return { current: Math.max(0, Math.ceil(component.currentValue)), max: Math.ceil(component.effectiveMax) };
  } catch {
    return { current: 20, max: 20 };
  }
}

function bar(value, max, color) {
  const segments = 10;
  const safeMax = Math.max(1, max);
  const count = Math.max(0, Math.min(segments, Math.round((value / safeMax) * segments)));
  return color + "▰".repeat(count) + "§8" + "▱".repeat(segments - count);
}

function writeIfChanged(player, key, value, state) {
  if (state[key] === value) return;
  try {
    player.setDynamicProperty("dbz:" + key, value);
    state[key] = value;
  } catch {}
}

export function startHudBridge() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const state = cache.get(player.id) ?? {};
      const hp = health(player);
      const ki = Math.floor(getNumber(player, "ki"));
      const stamina = Math.floor(getNumber(player, "stamina"));
      const level = Math.floor(getNumber(player, "level"));
      const xp = Math.max(0, Math.floor(getNumber(player, "xp")));
      const xpNext = getXpForNextLevel(level);
      const race = getString(player, "race");
      const loadout = getLoadout(player);
      const selected = loadout.slots[loadout.selectedSlot - 1] ?? "Empty";

      writeIfChanged(player, "hud_hp", hp.current, state);
      writeIfChanged(player, "hud_hp_max", hp.max, state);
      writeIfChanged(player, "hud_ki", ki, state);
      writeIfChanged(player, "hud_stamina", stamina, state);
      writeIfChanged(player, "hud_level", level, state);
      writeIfChanged(player, "hud_xp", xp, state);
      writeIfChanged(player, "hud_selected", selected, state);

      const hudText =
        `§6§lDRAGON BREAKERS §r§7• §fLV §e${level} §7• §fPL §6${getPowerLevel(player)} §7• §f${race}\n` +
        `§cHP §r${bar(hp.current, hp.max, "§c")} §f${hp.current}/${hp.max}\n` +
        `§bKI §r${bar(ki, CONFIG.maxKi, "§b")} §f${ki}/${CONFIG.maxKi}\n` +
        `§eSTM §r${bar(stamina, CONFIG.maxStamina, "§e")} §f${stamina}/${CONFIG.maxStamina}\n` +
        `§aXP §r${bar(xp, xpNext, "§a")} §f${xp}/${xpNext}\n` +
        `§7Active §6[${loadout.selectedSlot}] §f${selected}`;

      try { player.onScreenDisplay.setActionBar(hudText); } catch {}
      cache.set(player.id, state);
    }
  }, Math.max(4, CONFIG.hudIntervalTicks));
}
