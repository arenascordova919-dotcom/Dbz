import { EquipmentSlot, system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { clampResource, getNumber, getString } from "./playerData.js";

const chargingState = new Map();

function safeParticle(dimension, id, location) {
  try { dimension.spawnParticle(id, location); } catch {}
}

function isHoldingLauncher(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    return equippable?.getEquipment(EquipmentSlot.Mainhand)?.typeId === "dbz:technique_launcher";
  } catch {
    return false;
  }
}

function styleKey(player) {
  const style = getString(player, "auraStyle").toLowerCase();
  return ["blue","gold","violet","green"].includes(style) ? style : "blue";
}

function spawnAura(player, pulse) {
  try {
    const p = player.location;
    const d = player.dimension;
    const style = styleKey(player);
    const flame = `dbz:aura_${style}_flame`;
    const spark = `dbz:aura_${style}_spark`;
    const sway = Math.sin(pulse * 0.32) * 0.07;
    const wave = Math.cos(pulse * 0.24) * 0.05;

    // Layered flames hug the torso instead of making two giant flat walls.
    safeParticle(d, flame, { x: p.x, y: p.y + 0.72, z: p.z - 0.08 });
    safeParticle(d, flame, { x: p.x - 0.24 + sway, y: p.y + 0.68, z: p.z + 0.02 });
    safeParticle(d, flame, { x: p.x + 0.24 - sway, y: p.y + 0.68, z: p.z + 0.02 });

    // Smaller lower-body flames give a continuous silhouette.
    if (pulse % 2 === 0) {
      safeParticle(d, spark, { x: p.x - 0.18, y: p.y + 0.18, z: p.z + 0.04 });
      safeParticle(d, spark, { x: p.x + 0.18, y: p.y + 0.18, z: p.z + 0.04 });
    }

    // Shoulder/head energy sparks rise above the model.
    safeParticle(d, spark, { x: p.x - 0.30 + wave, y: p.y + 1.18, z: p.z });
    safeParticle(d, spark, { x: p.x + 0.30 - wave, y: p.y + 1.18, z: p.z });
    safeParticle(d, spark, { x: p.x, y: p.y + 1.72, z: p.z });

    // Intermittent extra core flame gives the charge a breathing/pulsing feel.
    if (pulse % 8 === 0) {
      safeParticle(d, flame, { x: p.x, y: p.y + 0.88, z: p.z + 0.06 });
    }
    if (pulse % 12 === 0) {
      safeParticle(d, "dbz:aura_ring", { x: p.x, y: p.y + 0.04, z: p.z });
    }
  } catch {}
}

export function startChargingSystem() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const charging =
        getNumber(player, "characterCreated") >= 1 &&
        getNumber(player, "auraEnabled") >= 1 &&
        player.isSneaking &&
        isHoldingLauncher(player);

      if (!charging) {
        chargingState.delete(player.id);
        continue;
      }

      const pulse = (chargingState.get(player.id) ?? 0) + 1;
      chargingState.set(player.id, pulse);

      const ki = getNumber(player, "ki");
      if (ki < CONFIG.maxKi) {
        clampResource(player, "ki", CONFIG.maxKi, ki + CONFIG.chargeKiPerPulse);
      }

      spawnAura(player, pulse);
    }
  }, CONFIG.chargeIntervalTicks);
}
