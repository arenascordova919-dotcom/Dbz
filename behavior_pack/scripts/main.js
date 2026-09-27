import { HudElement, HudVisibility, system, world } from "@minecraft/server";
import { initializePlayer } from "./playerData.js";
import { startResourceRegeneration } from "./resources.js";
import { registerCombat } from "./combat.js";
import { openMainMenu } from "./menu.js";
import { startHudBridge } from "./hudBridge.js";

function preparePlayer(player) {
  initializePlayer(player);
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
  console.warn("[Dragon Breakers] v0.5.0 loaded.");
});
