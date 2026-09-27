import { world } from "@minecraft/server";
import { initializePlayer } from "./playerData.js";
import { startHud } from "./hud.js";
import { startResourceRegeneration } from "./resources.js";
import { registerCombat } from "./combat.js";
import { openMainMenu } from "./menu.js";

world.afterEvents.playerSpawn.subscribe(({ player }) => initializePlayer(player));
for (const player of world.getAllPlayers()) initializePlayer(player);

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (source.typeId === "minecraft:player" && itemStack?.typeId === "dbz:menu") openMainMenu(source);
});

startResourceRegeneration();
startHud();
registerCombat();
console.warn("[Dragon Ball Bedrock] Core v0.3.0 loaded.");
