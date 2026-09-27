import { world } from "@minecraft/server";
import { addXp } from "./playerData.js";

function xpForEntity(entity) {
  try {
    const health = entity.getComponent("minecraft:health");
    const maxHealth = health?.effectiveMax ?? health?.defaultValue ?? 20;
    return Math.max(8, Math.min(250, Math.floor(maxHealth * 3.5)));
  } catch {
    return 20;
  }
}

export function registerProgression() {
  world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
    const killer = damageSource?.damagingEntity;
    if (!killer || killer.typeId !== "minecraft:player") return;
    if (!deadEntity || deadEntity.typeId === "minecraft:player") return;

    const amount = xpForEntity(deadEntity);
    addXp(killer, amount, deadEntity.typeId.replace("minecraft:", ""));
  });
}
