import { HudElement, HudVisibility, ItemStack, system, world } from "@minecraft/server";
import { initializePlayer } from "./playerData.js";
import { startResourceRegeneration } from "./resources.js";
import { registerCombat } from "./combat.js";
import { openMainMenu } from "./menu.js";
import { startHudBridge } from "./hudBridge.js";

function ensureMenuSlot(player) {
  try {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) return;
    const target = 8;
    const targetItem = inventory.getItem(target);
    if (targetItem?.typeId === "dbz:menu") return;

    let existingMenu = -1;
    for (let i = 0; i < inventory.size; i++) {
      if (inventory.getItem(i)?.typeId === "dbz:menu") { existingMenu = i; break; }
    }

    if (existingMenu >= 0) {
      inventory.setItem(existingMenu, targetItem);
      inventory.setItem(target, new ItemStack("dbz:menu", 1));
      return;
    }

    if (!targetItem) {
      inventory.setItem(target, new ItemStack("dbz:menu", 1));
      return;
    }

    let empty = -1;
    for (let i = 9; i < inventory.size; i++) {
      if (!inventory.getItem(i)) { empty = i; break; }
    }
    if (empty < 0) {
      for (let i = 0; i < 8; i++) {
        if (!inventory.getItem(i)) { empty = i; break; }
      }
    }
    if (empty < 0) return;
    inventory.setItem(empty, targetItem);
    inventory.setItem(target, new ItemStack("dbz:menu", 1));
  } catch (error) {
    console.warn("[Dragon Breakers] Menu slot maintenance failed: " + error);
  }
}

function preparePlayer(player) {
  initializePlayer(player);
  ensureMenuSlot(player);
  try {
    player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, [HudElement.Health, HudElement.Hunger]);
  } catch (error) {
    console.warn("[Dragon Breakers] HUD visibility unavailable: " + error);
  }
}

world.afterEvents.playerSpawn.subscribe(({ player }) => system.run(() => preparePlayer(player)));

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (source.typeId === "minecraft:player" && itemStack?.typeId === "dbz:menu") openMainMenu(source);
});

system.run(() => {
  for (const player of world.getAllPlayers()) preparePlayer(player);
  startResourceRegeneration();
  startHudBridge();
  registerCombat();
  system.runInterval(() => { for (const player of world.getAllPlayers()) ensureMenuSlot(player); }, 100);
  console.warn("[Dragon Breakers] v0.5.1 loaded.");
});
