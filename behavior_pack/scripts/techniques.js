import { MolangVariableMap, system } from "@minecraft/server";
import { clampResource, getFocusMultiplier, getNumber, getString } from "./playerData.js";
import { CONFIG } from "./config.js";

const cooldown = new Map();
const ready = (p, id) => (cooldown.get(p.id + ":" + id) ?? 0) <= system.currentTick;
const setCooldown = (p, id, ticks) => cooldown.set(p.id + ":" + id, system.currentTick + ticks);

function safeParticle(dimension, id, location, variables) {
  try { dimension.spawnParticle(id, location, variables); } catch {}
}

function directionVariables(direction) {
  const map = new MolangVariableMap();
  map.setVector3("variable.dbz_dir", direction);
  return map;
}

function point(origin, direction, distance) {
  return {
    x: origin.x + direction.x * distance,
    y: origin.y + direction.y * distance,
    z: origin.z + direction.z * distance
  };
}

function isSolidImpact(dimension, location) {
  try {
    const block = dimension.getBlock({
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z)
    });
    if (!block) return false;
    if (block.isAir) return false;
    return block.typeId !== "minecraft:water" && block.typeId !== "minecraft:lava";
  } catch {
    return false;
  }
}

function terrainRadius(player, technique) {
  const mode = getString(player, "terrainMode");
  if (mode === "Off") return 0;

  const low = {
    kiBlast: 1.25,
    kamehameha: 2.25,
    spiritBomb: 4.25
  };
  const full = {
    kiBlast: 2.25,
    kamehameha: 4.0,
    spiritBomb: 7.0
  };

  return (mode === "Full" ? full : low)[technique] ?? 0;
}

function terrainImpact(player, location, technique) {
  const radius = terrainRadius(player, technique);
  if (radius <= 0) return;

  try {
    player.dimension.createExplosion(location, radius, {
      breaksBlocks: true,
      causesFire: false,
      allowUnderwater: true,
      source: player
    });
  } catch (error) {
    console.warn("[Dragon Breakers] Terrain impact failed: " + error);
  }
}

function entitiesNear(player, location, radius) {
  try {
    return player.dimension.getEntities({ location, maxDistance: radius })
      .filter(entity =>
        entity.id !== player.id &&
        entity.typeId !== "minecraft:item" &&
        entity.typeId !== "minecraft:xp_orb"
      );
  } catch {
    return [];
  }
}

function impactBurst(dimension, location, particleId, radius = 0.45) {
  const offsets = [
    [0, 0, 0],
    [radius, 0, 0], [-radius, 0, 0],
    [0, radius, 0], [0, -radius, 0],
    [0, 0, radius], [0, 0, -radius]
  ];
  for (const [x, y, z] of offsets) {
    safeParticle(dimension, particleId, {
      x: location.x + x,
      y: location.y + y,
      z: location.z + z
    });
  }
}

function spiritOrbLayers(dimension, location) {
  safeParticle(dimension, "dbz:spirit_bomb_glow", location);
  safeParticle(dimension, "dbz:spirit_bomb_orb", location);
}

export function castKamehameha(player) {
  const cost = Math.max(1, Math.round(35 * getFocusMultiplier(player, "cost")));
  if (!ready(player, "kame")) return;

  const ki = getNumber(player, "ki");
  if (ki < cost) {
    player.sendMessage("§cNot enough Ki for Kamehameha.");
    return;
  }

  clampResource(player, "ki", CONFIG.maxKi, ki - cost);
  setCooldown(player, "kame", Math.round(75 * getFocusMultiplier(player, "cooldown")));

  // Short hand-charge phase.
  for (let tick = 0; tick < 9; tick++) {
    system.runTimeout(() => {
      try {
        const head = player.getHeadLocation();
        const dir = player.getViewDirection();
        const charge = point(head, dir, 1.1);
        charge.y -= 0.30;
        safeParticle(player.dimension, "dbz:kamehameha_charge", charge);
      } catch {}
    }, tick);
  }

  system.runTimeout(() => {
    try {
      const head = player.getHeadLocation();
      const dir = player.getViewDirection();
      const dimension = player.dimension;
      const damaged = new Set();
      let impact = point(head, dir, 34);

      for (let distance = 1.4; distance <= 34; distance += 1.15) {
        const location = point(head, dir, distance);
        safeParticle(dimension, "dbz:kamehameha_beam", location, directionVariables(dir));

        for (const entity of entitiesNear(player, location, 1.35)) {
          if (damaged.has(entity.id)) continue;
          damaged.add(entity.id);
          try {
            entity.applyDamage(Math.round(CONFIG.kamehamehaDamage * getFocusMultiplier(player, "damage")), { damagingEntity: player });
            entity.applyImpulse({
              x: dir.x * 1.35,
              y: Math.max(0.18, dir.y * 0.45),
              z: dir.z * 1.35
            });
          } catch {}
        }

        if (isSolidImpact(dimension, location)) {
          impact = location;
          break;
        }
      }

      // Reinforce the beam for a few frames so it reads as a beam, not a dotted line.
      for (let pass = 1; pass <= 2; pass++) {
        system.runTimeout(() => {
          try {
            for (let distance = 1.4; distance <= 26; distance += 1.35) {
              safeParticle(dimension, "dbz:kamehameha_beam", point(head, dir, distance), directionVariables(dir));
            }
          } catch {}
        }, pass * 2);
      }

      impactBurst(dimension, impact, "dbz:ki_blast_impact", 0.55);
      terrainImpact(player, impact, "kamehameha");
    } catch (error) {
      console.warn("[Dragon Breakers] Kamehameha failed: " + error);
    }
  }, 9);
}

export function castKiBlast(player) {
  const cost = Math.max(1, Math.round(CONFIG.kiBlastCost * getFocusMultiplier(player, "cost")));
  if (!ready(player, "blast")) return;

  const ki = getNumber(player, "ki");
  if (ki < cost) {
    player.sendMessage("§cNot enough Ki.");
    return;
  }

  clampResource(player, "ki", CONFIG.maxKi, ki - cost);
  setCooldown(player, "blast", Math.max(2, Math.round(CONFIG.kiBlastCooldownTicks * getFocusMultiplier(player, "cooldown"))));

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

  const muzzle = point(origin, direction, 1.15);
  muzzle.y -= 0.12;
  safeParticle(dimension, "dbz:ki_blast_glow", muzzle);
  safeParticle(dimension, "dbz:ki_blast_core", muzzle);

  let finished = false;

  for (let step = 1; step <= 17; step++) {
    system.runTimeout(() => {
      if (finished) return;

      try {
        const distance = 1.35 + step * 1.8;
        const location = point(origin, direction, distance);

        safeParticle(dimension, "dbz:ki_blast_glow", location);
        safeParticle(dimension, "dbz:ki_blast_core", location);

        if (step > 1) {
          safeParticle(dimension, "dbz:ki_blast_trail", point(origin, direction, distance - 0.7), directionVariables(direction));
          safeParticle(dimension, "dbz:ki_blast_trail", point(origin, direction, distance - 1.25), directionVariables(direction));
        }

        const hit = entitiesNear(player, location, 1.15)[0];
        const hitBlock = isSolidImpact(dimension, location);

        if (hit || hitBlock || step === 17) {
          finished = true;

          if (hit) {
            try {
              hit.applyDamage(Math.round(CONFIG.kiBlastDamage * getFocusMultiplier(player, "damage")), { damagingEntity: player });
              hit.applyImpulse({
                x: direction.x * 0.78,
                y: 0.17,
                z: direction.z * 0.78
              });
            } catch {}
          }

          impactBurst(dimension, location, "dbz:ki_blast_impact", 0.34);
          terrainImpact(player, location, "kiBlast");
        }
      } catch {
        finished = true;
      }
    }, step);
  }
}

export function castSpiritBomb(player) {
  const cost = Math.max(1, Math.round(80 * getFocusMultiplier(player, "cost")));
  if (!ready(player, "spirit")) return;

  const ki = getNumber(player, "ki");
  if (ki < cost) {
    player.sendMessage("§cYou need at least 80 Ki for Spirit Bomb.");
    return;
  }

  clampResource(player, "ki", CONFIG.maxKi, ki - cost);
  setCooldown(player, "spirit", Math.round(220 * getFocusMultiplier(player, "cooldown")));

  // Build a large orb above the player for ~1.5 seconds.
  for (let tick = 0; tick < 30; tick += 2) {
    system.runTimeout(() => {
      try {
        const base = player.location;
        spiritOrbLayers(player.dimension, {
          x: base.x,
          y: base.y + 3.0,
          z: base.z
        });
      } catch {}
    }, tick);
  }

  system.runTimeout(() => {
    let origin;
    let direction;
    let dimension;

    try {
      origin = player.getHeadLocation();
      origin.y += 1.5;
      direction = player.getViewDirection();
      dimension = player.dimension;
    } catch {
      return;
    }

    let finished = false;

    const detonate = (location) => {
      if (finished) return;
      finished = true;

      impactBurst(dimension, location, "dbz:spirit_bomb_impact", 1.2);

      for (const entity of entitiesNear(player, location, 5.5)) {
        try {
          entity.applyDamage(Math.round(CONFIG.spiritBombDamage * getFocusMultiplier(player, "damage")), { damagingEntity: player });
          const dx = entity.location.x - location.x;
          const dz = entity.location.z - location.z;
          const mag = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
          entity.applyImpulse({ x: dx / mag * 1.1, y: 0.55, z: dz / mag * 1.1 });
        } catch {}
      }

      terrainImpact(player, location, "spiritBomb");
    };

    for (let step = 1; step <= 14; step++) {
      system.runTimeout(() => {
        if (finished) return;

        try {
          const location = point(origin, direction, step * 2.15);
          spiritOrbLayers(dimension, location);

          const hitEntity = entitiesNear(player, location, 1.8).length > 0;
          if (hitEntity || isSolidImpact(dimension, location) || step === 14) {
            detonate(location);
          }
        } catch {
          finished = true;
        }
      }, step * 2);
    }
  }, 30);
}

export function castSelectedTechnique(player) {
  const selected = Math.max(1, Math.min(4, Math.floor(getNumber(player, "selectedSlot"))));
  const skill = getString(player, `skill${selected}`);

  if (skill === "Kamehameha") return castKamehameha(player);
  if (skill === "Ki Blast") return castKiBlast(player);
  if (skill === "Spirit Bomb") return castSpiritBomb(player);

  player.sendMessage("§7No technique equipped in this slot.");
}
