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
  if (["blue","gold","violet","green"].includes(style)) return style;
  return "blue";
}

function spawnAura(player, pulse) {
  try {
    const p = player.location;
    const d = player.dimension;
    const style = styleKey(player);
    const flame = `dbz:aura_${style}_flame`;
    const spark = `dbz:aura_${style}_spark`;
    const sway = Math.sin(pulse * 0.38) * 0.10;

    // Two tall flame sheets hug the player instead of surrounding them with balls.
    safeParticle(d, flame, { x: p.x - 0.23 + sway, y: p.y + 0.88, z: p.z });
    safeParticle(d, flame, { x: p.x + 0.23 - sway, y: p.y + 0.88, z: p.z });

    // Rising shoulder/head streaks.
    safeParticle(d, spark, { x: p.x - 0.34, y: p.y + 1.20, z: p.z });
    safeParticle(d, spark, { x: p.x + 0.34, y: p.y + 1.20, z: p.z });
    if (pulse % 2 === 0) safeParticle(d, spark, { x: p.x, y: p.y + 1.72, z: p.z });

    // Short extra flare while charging for a stronger DBC-like pulse.
    if (pulse % 10 === 0) {
      safeParticle(d, flame, { x: p.x, y: p.y + 0.90, z: p.z + 0.08 });
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
