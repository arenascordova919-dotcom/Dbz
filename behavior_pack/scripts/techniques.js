import { system } from "@minecraft/server";
import { clampResource, getNumber } from "./playerData.js";
import { CONFIG } from "./config.js";

const cooldown = new Map();
const ready = (p, id) => (cooldown.get(p.id + ":" + id) ?? 0) <= system.currentTick;
const setCooldown = (p, id, ticks) => cooldown.set(p.id + ":" + id, system.currentTick + ticks);

function aimedTarget(player, maxDistance = 40, threshold = 0.965) {
  const eye = player.getHeadLocation();
  const dir = player.getViewDirection();
  let best, bestDistance = maxDistance + 1;
  for (const entity of player.dimension.getEntities({ location: eye, maxDistance })) {
    if (entity.id === player.id || entity.typeId === "minecraft:item") continue;
    const dx = entity.location.x - eye.x, dy = entity.location.y + 0.8 - eye.y, dz = entity.location.z - eye.z;
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (distance <= 0.01) continue;
    const dot = (dx*dir.x + dy*dir.y + dz*dir.z) / distance;
    if (dot >= threshold && distance < bestDistance) { best = entity; bestDistance = distance; }
  }
  return best;
}

export function castKamehameha(player) {
  const cost = 35;
  if (!ready(player, "kame")) return;
  const ki = getNumber(player, "ki");
  if (ki < cost) { player.sendMessage("§cNot enough Ki for Kamehameha."); return; }
  clampResource(player, "ki", CONFIG.maxKi, ki - cost);
  setCooldown(player, "kame", 60);
  const target = aimedTarget(player, 48, 0.94);
  const dir = player.getViewDirection(), head = player.getHeadLocation();
  for (let i = 2; i <= 12; i += 2) {
    try { player.dimension.spawnParticle("minecraft:basic_flame_particle", {x:head.x+dir.x*i,y:head.y+dir.y*i,z:head.z+dir.z*i}); } catch {}
  }
  if (target) {
    try {
      target.applyDamage(18, { damagingEntity: player });
      target.applyImpulse({x:dir.x*1.2,y:Math.max(0.18,dir.y*.35),z:dir.z*1.2});
    } catch {}
  }
}

export function castKiBlast(player) {
  const cost = 10;
  if (!ready(player, "blast")) return;
  const ki = getNumber(player, "ki");
  if (ki < cost) { player.sendMessage("§cNot enough Ki."); return; }
  clampResource(player, "ki", CONFIG.maxKi, ki - cost);
  setCooldown(player, "blast", 10);
  const target = aimedTarget(player, 32);
  const dir = player.getViewDirection();
  if (target) {
    try {
      target.applyDamage(8, { damagingEntity: player });
      target.applyImpulse({x:dir.x*.65,y:.15,z:dir.z*.65});
    } catch {}
  }
}

export function castSelectedTechnique(player) {
  const selected = Math.max(1, Math.min(4, Math.floor(getNumber(player, "selectedSlot"))));
  const skill = player.getDynamicProperty(`dbz:skill${selected}`);
  if (skill === "Kamehameha") return castKamehameha(player);
  if (skill === "Ki Blast") return castKiBlast(player);
  if (skill === "Spirit Bomb") {
    player.sendMessage("§6Spirit Bomb is not implemented yet.");
    return;
  }
  player.sendMessage("§7No technique equipped in this slot.");
}
