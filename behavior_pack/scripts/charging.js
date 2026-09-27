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
    const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
    return held?.typeId === "dbz:technique_launcher";
  } catch {
    return false;
  }
}

function spawnAura(player, pulse) {
  try {
    const base = player.location;
    const dimension = player.dimension;
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const heights = [0.25, 0.85, 1.45];

    for (const y of heights) {
      for (const angle of angles) {
        const radius = y > 1.2 ? 0.42 : 0.55;
        safeParticle(dimension, "dbz:aura_body", {
          x: base.x + Math.cos(angle + pulse * 0.22) * radius,
          y: base.y + y,
          z: base.z + Math.sin(angle + pulse * 0.22) * radius
        });
      }
    }

    // Shoulder / head energy wisps.
    safeParticle(dimension, "dbz:aura_rise", { x: base.x + 0.34, y: base.y + 1.35, z: base.z });
    safeParticle(dimension, "dbz:aura_rise", { x: base.x - 0.34, y: base.y + 1.35, z: base.z });
    safeParticle(dimension, "dbz:aura_rise", { x: base.x, y: base.y + 1.85, z: base.z });

    if (pulse % 6 === 0) {
      safeParticle(dimension, "dbz:aura_burst", { x: base.x, y: base.y + 0.95, z: base.z });
    }
  } catch {}
}

export function startChargingSystem() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const shouldCharge =
        getNumber(player, "characterCreated") >= 1 &&
        getNumber(player, "auraEnabled") >= 1 &&
        player.isSneaking &&
        isHoldingLauncher(player);

      if (!shouldCharge) {
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
