import { EquipmentSlot, ItemStack } from "@minecraft/server";
import { getNumber, getString } from "./playerData.js";

const RACE_ITEMS = Object.freeze({
  Saiyan: "dbz:race_appearance_saiyan",
  Namekian: "dbz:race_appearance_namekian",
  Arcosian: "dbz:race_appearance_arcosian",
  Earthling: "dbz:race_appearance_earthling"
});

const PREFIX = "dbz:race_appearance_";

function firstEmptyInventorySlot(player) {
  try {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) return -1;
    for (let i = 0; i < inventory.size; i++) {
      if (!inventory.getItem(i)) return i;
    }
  } catch {}
  return -1;
}

export function applyRaceAppearance(player) {
  if (!player || getNumber(player, "characterCreated") < 1) return false;

  const race = getString(player, "race");
  const desired = RACE_ITEMS[race];
  if (!desired) return false;

  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return false;

    const current = equippable.getEquipment(EquipmentSlot.Head);
    if (current?.typeId === desired) return true;

    if (current && !current.typeId.startsWith(PREFIX)) {
      const inventory = player.getComponent("minecraft:inventory")?.container;
      const empty = firstEmptyInventorySlot(player);
      if (!inventory || empty < 0) {
        return false;
      }
      inventory.setItem(empty, current);
    }

    equippable.setEquipment(EquipmentSlot.Head, new ItemStack(desired, 1));
    return true;
  } catch (error) {
    console.warn("[Dragon Breakers] Race appearance failed: " + error);
    return false;
  }
}
