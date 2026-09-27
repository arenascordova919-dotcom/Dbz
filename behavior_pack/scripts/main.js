import { world, system } from "@minecraft/server";

const MAX_KI = 100;
const REGEN_PER_TICK = 0.08;
const KI_BLAST_COST = 10;
const KI_BLAST_COOLDOWN = 8;
const cooldowns = new Map();

function getKi(player) {
  const value = player.getDynamicProperty("dbz:ki");
  return typeof value === "number" ? value : MAX_KI;
}

function setKi(player, value) {
  player.setDynamicProperty("dbz:ki", Math.max(0, Math.min(MAX_KI, value)));
}

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  if (player.getDynamicProperty("dbz:ki") === undefined) setKi(player, MAX_KI);
});

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const ki = getKi(player);
    if (ki < MAX_KI) setKi(player, ki + REGEN_PER_TICK);
    player.onScreenDisplay.setActionBar(`§bKi §f${Math.floor(getKi(player))}/${MAX_KI}`);
  }
}, 1);

world.afterEvents.itemUse.subscribe(({ source: player, itemStack }) => {
  if (itemStack.typeId !== "dbz:ki_blast") return;
  const until = cooldowns.get(player.id) ?? 0;
  if (until > system.currentTick) return;

  const ki = getKi(player);
  if (ki < KI_BLAST_COST) {
    player.sendMessage("§cNot enough Ki!");
    return;
  }

  setKi(player, ki - KI_BLAST_COST);
  cooldowns.set(player.id, system.currentTick + KI_BLAST_COOLDOWN);

  const view = player.getViewDirection();
  const start = player.location;
  const dimension = player.dimension;

  const entities = dimension.getEntities({
    location: { x: start.x + view.x * 1.5, y: start.y + 1.5 + view.y * 1.5, z: start.z + view.z * 1.5 },
    maxDistance: 32,
    excludeTypes: ["minecraft:item"]
  });

  let target = null;
  let best = Infinity;
  for (const entity of entities) {
    if (entity.id === player.id) continue;
    const dx = entity.location.x - start.x;
    const dy = entity.location.y + 1 - (start.y + 1);
    const dz = entity.location.z - start.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const dot = (dx * view.x + dy * view.y + dz * view.z) / Math.max(distance, 0.001);
    if (dot > 0.94 && distance < best) {
      target = entity;
      best = distance;
    }
  }

  if (target) {
    try {
      target.applyDamage(8, { damagingEntity: player });
      target.dimension.spawnParticle("minecraft:basic_flame_particle", target.location);
    } catch {}
  }

  dimension.spawnParticle("minecraft:basic_flame_particle", {
    x: start.x + view.x * 2,
    y: start.y + 1.5 + view.y * 2,
    z: start.z + view.z * 2
  });
});
