import { world } from "@minecraft/server";
import { initializePlayer } from "./playerData.js";
import { startHud } from "./hud.js";
import { startResourceRegeneration } from "./resources.js";
import { registerCombat } from "./combat.js";

world.afterEvents.playerSpawn.subscribe(({ player }) => initializePlayer(player));

for (const player of world.getAllPlayers()) initializePlayer(player);

startResourceRegeneration();
startHud();
registerCombat();

console.warn("[Dragon Ball Bedrock] Core v0.2.0 loaded.");
