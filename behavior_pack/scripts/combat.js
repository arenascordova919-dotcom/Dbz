import { system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { clampResource, getNumber } from "./playerData.js";

const cooldowns = new Map();

function findTarget(player, maxDistance = 32) {
  const view = player.getViewDirection();
  const start = player.getHeadLocation();
  let bestTarget;
  let bestDistance = maxDistance + 1;

  for (const entity of player.dimension.getEntities({ location: start, maxDistance })) {
    if (entity.id === player.id || entity.typeId === "minecraft:item") continue;
    const dx = entity.location.x - start.x;
    const dy = entity.location.y + 0.8 - start.y;
    const dz = entity.location.z - start.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance < 0.01) continue;
    const dot = (dx * view.x + dy * view.y + dz * view.z) / distance;
    if (dot > 0.965 && distance < bestDistance) {
      bestTarget = entity;
      bestDistance = distance;
    }
  }
  return bestTarget;
}

function castKiBlast(player) {
  const readyAt = cooldowns.get(player.id) ?? 0;
  if (readyAt > system.currentTick) return;

  const ki = getNumber(player, "ki");
  if (ki < CONFIG.kiBlastCost) {
    player.sendMessage("§cNot enough Ki.");
    return;
  }

  clampResource(player, "ki", CONFIG.maxKi, ki - CONFIG.kiBlastCost);
  cooldowns.set(player.id, system.currentTick + CONFIG.kiBlastCooldownTicks);

  const head = player.getHeadLocation();
  const view = player.getViewDirection();
  const muzzle = {
    x: head.x + view.x * 1.4,
    y: head.y + view.y * 1.4,
    z: head.z + view.z * 1.4
  };

  try { player.dimension.spawnParticle("minecraft:basic_flame_particle", muzzle); } catch {}

  const target = findTarget(player);
  if (!target) return;

  try {
    target.applyDamage(CONFIG.kiBlastDamage, { damagingEntity: player });
    const impulse = { x: view.x * 0.7, y: Math.max(0.15, view.y * 0.25), z: view.z * 0.7 };
    target.applyImpulse(impulse);
    target.dimension.spawnParticle("minecraft:basic_flame_particle", {
      x: target.location.x,
      y: target.location.y + 1,
      z: target.location.z
    });
  } catch {}
}

export function registerCombat() {
  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (source.typeId !== "minecraft:player") return;
    if (itemStack?.typeId === "dbz:ki_blast") castKiBlast(source);
  });
}
