import { HudElement, HudVisibility, ItemStack, system, world } from "@minecraft/server";
import { initializePlayer, getNumber } from "./playerData.js";
import { startResourceRegeneration } from "./resources.js";
import { registerCombat } from "./combat.js";
import { ensureCharacterSetup, openMainMenu } from "./menu.js";
import { cycleTechniqueSlot, useSelectedTechnique } from "./controls.js";
import { startHudBridge } from "./hudBridge.js";
import { cleanupLegacyRaceAppearance } from "./appearance.js";
import { startChargingSystem } from "./charging.js";
import { registerProgression } from "./progression.js";

function findEmptyInventorySlot(inventory, avoid = new Set()) {
  for (let i = 0; i < inventory.size; i++) {
    if (avoid.has(i)) continue;
    if (!inventory.getItem(i)) return i;
  }
  return -1;
}

function ensureSystemItemSlot(player, typeId, target) {
  try {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) return false;

    const targetItem = inventory.getItem(target);
    if (targetItem?.typeId === typeId) return true;

    let existing = -1;
    for (let i = 0; i < inventory.size; i++) {
      if (inventory.getItem(i)?.typeId === typeId) {
        existing = i;
        break;
      }
    }

    if (existing >= 0) {
      inventory.setItem(existing, targetItem);
      inventory.setItem(target, new ItemStack(typeId, 1));
      return true;
    }

    if (!targetItem) {
      inventory.setItem(target, new ItemStack(typeId, 1));
      return true;
    }

    const empty = findEmptyInventorySlot(inventory, new Set([7, 8]));
    if (empty < 0) return false;

    inventory.setItem(empty, targetItem);
    inventory.setItem(target, new ItemStack(typeId, 1));
    return true;
  } catch (error) {
    console.warn("[Dragon Breakers] System slot maintenance failed for " + typeId + ": " + error);
    return false;
  }
}

function ensureSystemSlots(player) {
  // Slot 8: technique launcher. Slot 9: Dragon Breakers menu.
  ensureSystemItemSlot(player, "dbz:technique_launcher", 7);
  ensureSystemItemSlot(player, "dbz:menu", 8);
}

function selectedSystemItem(player) {
  try {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) return undefined;
    return inventory.getItem(player.selectedSlotIndex)?.typeId;
  } catch {
    return undefined;
  }
}


function registerMobileControls() {
  // Selecting slot 9 opens the menu immediately, so mobile players do not
  // depend on custom-item use behavior.
  try {
    world.afterEvents.playerHotbarSelectedSlotChange?.subscribe((event) => {
      const player = event.player;
      const typeId = event.itemStack?.typeId;

      if (typeId === "dbz:menu") {
        system.run(() => openMainMenu(player));
        return;
      }

      if (typeId === "dbz:technique_launcher") {
        try {
          player.onScreenDisplay.setActionBar("§bLauncher §7• §fJump = Fire §7• §fSneak = Charge §7• §fSneak+Jump = Cycle");
        } catch {}
      }
    });
  } catch (error) {
    console.warn("[Dragon Breakers] Hotbar control registration unavailable: " + error);
  }

  // Jump is a reliable button on touch/controller/keyboard. With the
  // launcher selected it becomes a fallback fire control.
  try {
    world.afterEvents.playerButtonInput?.subscribe((event) => {
      if (event.button !== "Jump" || event.newButtonState !== "Pressed") return;

      const player = event.player;
      if (selectedSystemItem(player) !== "dbz:technique_launcher") return;
      if (getNumber(player, "characterCreated") < 1) {
        system.run(() => ensureCharacterSetup(player));
        return;
      }

      system.run(() => {
        try {
          if (player.isSneaking) {
            const result = cycleTechniqueSlot(player);
            player.onScreenDisplay.setActionBar(`§6[${result.slot}] §f${result.name} §7selected`);
          } else {
            useSelectedTechnique(player);
          }
        } catch (error) {
          console.warn("[Dragon Breakers] Mobile launcher control failed: " + error);
        }
      });
    });
  } catch (error) {
    console.warn("[Dragon Breakers] Button input control registration unavailable: " + error);
  }
}

function preparePlayer(player) {
  initializePlayer(player);
  ensureSystemSlots(player);
  system.run(() => cleanupLegacyRaceAppearance(player));
  system.runTimeout(() => ensureCharacterSetup(player), 12);

  try {
    player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, [HudElement.Health, HudElement.Hunger]);
  } catch (error) {
    console.warn("[Dragon Breakers] HUD visibility unavailable: " + error);
  }
}

world.afterEvents.playerSpawn.subscribe(({ player }) => system.run(() => preparePlayer(player)));

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (source.typeId !== "minecraft:player") return;

  if (itemStack?.typeId === "dbz:menu") {
    openMainMenu(source);
    return;
  }

  if (itemStack?.typeId === "dbz:technique_launcher") {
    if (getNumber(source, "characterCreated") < 1) {
      ensureCharacterSetup(source);
      return;
    }

    try {
      if (source.isSneaking) {
        cycleTechniqueSlot(source);
      } else {
        useSelectedTechnique(source);
      }
    } catch (error) {
      console.warn("[Dragon Breakers] Technique Launcher failed: " + error);
    }
  }
});

system.run(() => {
  for (const player of world.getAllPlayers()) preparePlayer(player);
  startResourceRegeneration();
  startHudBridge();
  startChargingSystem();
  registerCombat();
  registerProgression();
  registerMobileControls();

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      ensureSystemSlots(player);
    }
  }, 100);

  console.warn("[Dragon Breakers] v0.7.3 Stability + Controls Fix loaded.");
});
