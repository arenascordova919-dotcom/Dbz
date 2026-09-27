import { EquipmentSlot, system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { clampResource, getNumber } from "./playerData.js";

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

function spawnAura(player, pulse) {
  try {
    const p = player.location;
    const d = player.dimension;
    const sway = Math.sin(pulse * 0.45) * 0.08;

    // Slim vertical energy streaks around the silhouette.
    const streaks = [
      [-0.48, 0.35, 0.00], [0.48, 0.35, 0.00],
      [-0.42, 0.95, 0.05], [0.42, 0.95, -0.05],
      [-0.30, 1.48, 0.00], [0.30, 1.48, 0.00],
      [0.00, 1.90, 0.00]
    ];

    for (let i = 0; i < streaks.length; i++) {
      const [x, y, z] = streaks[i];
      safeParticle(d, i < 4 ? "dbz:aura_body" : "dbz:aura_rise", {
        x: p.x + x + (i % 2 === 0 ? sway : -sway),
        y: p.y + y,
        z: p.z + z
      });
    }

    // A short pulse around the whole body, not a stack of orbs.
    if (pulse % 10 === 0) {
      safeParticle(d, "dbz:aura_burst", { x: p.x, y: p.y + 0.92, z: p.z });
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
