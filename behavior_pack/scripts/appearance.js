import { EquipmentSlot } from "@minecraft/server";

const LEGACY_PREFIX = "dbz:race_appearance_";

export function cleanupLegacyRaceAppearance(player) {
  if (!player) return;

  try {
    const equippable = player.getComponent("minecraft:equippable");
    const head = equippable?.getEquipment(EquipmentSlot.Head);
    if (head?.typeId?.startsWith(LEGACY_PREFIX)) {
      equippable.setEquipment(EquipmentSlot.Head, undefined);
    }
  } catch (error) {
    console.warn("[Dragon Breakers] Legacy race head cleanup failed: " + error);
  }

  try {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) return;
    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i);
      if (item?.typeId?.startsWith(LEGACY_PREFIX)) inventory.setItem(i, undefined);
    }
  } catch (error) {
    console.warn("[Dragon Breakers] Legacy race inventory cleanup failed: " + error);
  }
}
