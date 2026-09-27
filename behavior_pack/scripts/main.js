import { system, world } from "@minecraft/server";
import { initializePlayer } from "./playerData.js";
import { startResourceRegeneration } from "./resources.js";
import { registerCombat } from "./combat.js";
import { openMainMenu } from "./menu.js";
import { startHudBridge } from "./hudBridge.js";

world.afterEvents.playerSpawn.subscribe(({ player }) => initializePlayer(player));

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (source.typeId === "minecraft:player" && itemStack?.typeId === "dbz:menu") openMainMenu(source);
});

system.run(() => {
  for (const player of world.getAllPlayers()) initializePlayer(player);
  startResourceRegeneration();
  startHudBridge();
  registerCombat();
  console.warn("[Dragon Breakers] v0.5.0 loaded.");
});
