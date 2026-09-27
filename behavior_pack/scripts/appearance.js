import { EquipmentSlot, ItemStack } from "@minecraft/server";
import { getNumber, getString } from "./playerData.js";

const RACE_ITEMS = Object.freeze({
  Saiyan: "dbz:race_appearance_saiyan",
  Namekian: "dbz:race_appearance_namekian",
  Arcosian: "dbz:race_appearance_arcosian",
  Earthling: "dbz:race_appearance_earthling"
});

const PREFIX = "dbz:race_appearance_";

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

    // Never steal or move a real helmet. Normal armor always wins.
    if (current && !current.typeId.startsWith(PREFIX)) return false;

    equippable.setEquipment(EquipmentSlot.Head, new ItemStack(desired, 1));
    return true;
  } catch (error) {
    console.warn("[Dragon Breakers] Race appearance failed: " + error);
    return false;
  }
}
