import { system } from "@minecraft/server";
import { clampResource, getNumber, getString } from "./playerData.js";
import { CONFIG } from "./config.js";

const cooldown = new Map();
const ready = (p, id) => (cooldown.get(p.id + ":" + id) ?? 0) <= system.currentTick;
const setCooldown = (p, id, ticks) => cooldown.set(p.id + ":" + id, system.currentTick + ticks);

function safeParticle(dimension, id, location) {
  try { dimension.spawnParticle(id, location); } catch {}
}

function aimedTarget(player, maxDistance = 40, threshold = 0.965) {
  const eye = player.getHeadLocation();
  const dir = player.getViewDirection();
  let best, bestDistance = maxDistance + 1;

  for (const entity of player.dimension.getEntities({ location: eye, maxDistance })) {
    if (entity.id === player.id || entity.typeId === "minecraft:item") continue;
    const dx = entity.location.x - eye.x;
    const dy = entity.location.y + 0.8 - eye.y;
    const dz = entity.location.z - eye.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance <= 0.01) continue;
    const dot = (dx * dir.x + dy * dir.y + dz * dir.z) / distance;
    if (dot >= threshold && distance < bestDistance) {
      best = entity;
      bestDistance = distance;
    }
  }
  return best;
}

function point(origin, direction, distance) {
  return {
    x: origin.x + direction.x * distance,
    y: origin.y + direction.y * distance,
    z: origin.z + direction.z * distance
  };
}

export function castKamehameha(player) {
  const cost = 35;
  if (!ready(player, "kame")) return;

  const ki = getNumber(player, "ki");
  if (ki < cost) {
    player.sendMessage("§cNot enough Ki for Kamehameha.");
    return;
  }

  clampResource(player, "ki", CONFIG.maxKi, ki - cost);
  setCooldown(player, "kame", 70);

  // Short charge phase at the player's hands.
  for (let tick = 0; tick < 7; tick++) {
    system.runTimeout(() => {
      try {
        const head = player.getHeadLocation();
        const dir = player.getViewDirection();
        const charge = point(head, dir, 1.15);
        charge.y -= 0.28;
        safeParticle(player.dimension, "dbz:kamehameha_charge", charge);
      } catch {}
    }, tick);
  }

  // Beam release.
  system.runTimeout(() => {
    try {
      const head = player.getHeadLocation();
      const dir = player.getViewDirection();
      const target = aimedTarget(player, 48, 0.93);

      for (let pass = 0; pass < 3; pass++) {
        system.runTimeout(() => {
          try {
            for (let distance = 1.5; distance <= 34; distance += 1.6) {
              safeParticle(player.dimension, "dbz:kamehameha_beam", point(head, dir, distance));
            }
          } catch {}
        }, pass * 2);
      }

      if (target) {
        system.runTimeout(() => {
          try {
            target.applyDamage(18, { damagingEntity: player });
            target.applyImpulse({
              x: dir.x * 1.25,
              y: Math.max(0.2, dir.y * 0.4),
              z: dir.z * 1.25
            });
          } catch {}
        }, 3);
      }
    } catch {}
  }, 7);
}

export function castKiBlast(player) {
  const cost = 10;
  if (!ready(player, "blast")) return;

  const ki = getNumber(player, "ki");
  if (ki < cost) {
    player.sendMessage("§cNot enough Ki.");
    return;
  }

  clampResource(player, "ki", CONFIG.maxKi, ki - cost);
  setCooldown(player, "blast", 12);

  let origin;
  let direction;
  let dimension;
  try {
    origin = player.getHeadLocation();
    direction = player.getViewDirection();
    dimension = player.dimension;
  } catch {
    return;
  }

  let finished = false;

  for (let step = 1; step <= 15; step++) {
    system.runTimeout(() => {
      if (finished) return;
      try {
        const location = point(origin, direction, step * 2.0);
        safeParticle(dimension, "dbz:ki_blast_particle", location);

        const hit = dimension.getEntities({ location, maxDistance: 1.25 })
          .find(entity => entity.id !== player.id && entity.typeId !== "minecraft:item");

        if (hit) {
          finished = true;
          hit.applyDamage(8, { damagingEntity: player });
          hit.applyImpulse({
            x: direction.x * 0.7,
            y: 0.14,
            z: direction.z * 0.7
          });
          safeParticle(dimension, "dbz:ki_blast_particle", location);
        }
      } catch {
        finished = true;
      }
    }, step);
  }
}

export function castSelectedTechnique(player) {
  const selected = Math.max(1, Math.min(4, Math.floor(getNumber(player, "selectedSlot"))));
  const skill = getString(player, `skill${selected}`);

  if (skill === "Kamehameha") return castKamehameha(player);
  if (skill === "Ki Blast") return castKiBlast(player);

  if (skill === "Spirit Bomb") {
    player.sendMessage("§6Spirit Bomb is the next technique being upgraded.");
    return;
  }

  player.sendMessage("§7No technique equipped in this slot.");
}
