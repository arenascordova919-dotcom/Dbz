import { world } from "@minecraft/server";
import { castKamehameha, castKiBlast } from "./techniques.js";

export function registerCombat() {
  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (source.typeId !== "minecraft:player") return;
    if (itemStack?.typeId === "dbz:ki_blast") castKiBlast(source);
    if (itemStack?.typeId === "dbz:kamehameha") castKamehameha(source);
  });
}
