import { system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  getLoadout,
  getNumber,
  getPowerLevel,
  getString,
  selectSkillSlot,
  setNumber,
  setString
} from "./playerData.js";

const creationOpen = new Set();

const RACES = [
  { id: "Saiyan", text: "§6Saiyan\n§7ATK 4  DEF 2  SPD 3  REGEN 0" },
  { id: "Namekian", text: "§aNamekian\n§7ATK 3  DEF 2  SPD 2  REGEN 2" },
  { id: "Arcosian", text: "§dArcosian\n§7ATK 3  DEF 3  SPD 1  REGEN 0" },
  { id: "Earthling", text: "§bEarthling\n§7ATK 2  DEF 2  SPD 3  REGEN 1" }
];

export async function ensureCharacterCreation(player) {
  if (!player || getNumber(player, "characterCreated") >= 1) return;
  if (creationOpen.has(player.id)) return;

  creationOpen.add(player.id);
  let retry = false;

  try {
    const form = new ActionFormData()
      .title("§lDRAGON BREAKERS")
      .header("§6CHARACTER CREATION")
      .label("§fSELECT YOUR RACE\n§7This choice is saved to your character. Race changes will require a special in-game method later.");

    for (const race of RACES) {
      form.button(race.text, "textures/items/dbz_menu");
    }

    const result = await form.show(player);
    if (result.canceled || result.selection === undefined) {
      retry = true;
    } else {
      const race = RACES[result.selection];
      if (!race) {
        retry = true;
      } else {
        setString(player, "race", race.id);
        setNumber(player, "characterCreated", 1);
        player.sendMessage(`§aCharacter created! Race: §f${race.id}`);
      }
    }
  } catch (error) {
    console.warn("[Dragon Breakers] Character creation form failed: " + error);
    retry = true;
  } finally {
    creationOpen.delete(player.id);
  }

  if (retry && getNumber(player, "characterCreated") < 1) {
    system.runTimeout(() => ensureCharacterCreation(player), 30);
  }
}

async function playerStatus(player) {
  const race = getString(player, "race");
  const level = getNumber(player, "level");
  const formName = getString(player, "form");
  const mastery = getNumber(player, "mastery");
  const tp = getNumber(player, "tp");
  const pl = getPowerLevel(player);

  const body =
    `§6Race: §f${race}\n` +
    `§6Level: §f${level}\n` +
    `§6Form: §f${formName}\n` +
    `§6Power Level: §f${pl}\n` +
    `§6TP: §f${tp}\n` +
    `§6Mastery: §f${mastery}\n\n` +
    `§cSTR §f${getNumber(player, "str")}   §bDEX §f${getNumber(player, "dex")}\n` +
    `§aCON §f${getNumber(player, "con")}   §dWIL §f${getNumber(player, "wil")}\n` +
    `§eMND §f${getNumber(player, "mnd")}   §9SPI §f${getNumber(player, "spi")}`;

  const result = await new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6PLAYER STATUS")
    .label(body)
    .button("§8Back", "textures/items/dbz_menu")
    .show(player);

  if (!result.canceled) return openMainMenu(player);
}

async function specials(player) {
  const loadout = getLoadout(player);
  const form = new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6TECHNIQUES")
    .label(
      `§7Selected slot: §6${loadout.selectedSlot}\n` +
      `§f1 §b${loadout.slots[0]}\n§f2 §e${loadout.slots[1]}\n§f3 §9${loadout.slots[2]}\n§f4 §8${loadout.slots[3]}\n\n` +
      "§6Mobile control: §fDouble-tap Sneak/Crouch to fire the selected technique."
    )
    .button("§6Slot 1 • Kamehameha", "textures/items/kamehameha")
    .button("§6Slot 2 • Ki Blast", "textures/items/ki_blast")
    .button("§6Slot 3 • Spirit Bomb", "textures/items/spirit_bomb")
    .button("§6Slot 4 • Empty", "textures/items/dbz_menu")
    .button("§8Back", "textures/items/dbz_menu");

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  if (result.selection === 4) return openMainMenu(player);
  if (result.selection >= 0 && result.selection <= 3) {
    selectSkillSlot(player, result.selection + 1);
    player.sendMessage(`§6Active technique: §f[${result.selection + 1}] ${getLoadout(player).slots[result.selection]} §7• Double-tap Sneak to fire`);
  }
}

async function placeholder(player, title, text) {
  const result = await new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header(`§6${title}`)
    .label(`§7${text}`)
    .button("§8Back", "textures/items/dbz_menu")
    .show(player);
  if (!result.canceled) return openMainMenu(player);
}

export async function openMainMenu(player) {
  if (getNumber(player, "characterCreated") < 1) {
    return ensureCharacterCreation(player);
  }

  const race = getString(player, "race");
  const level = getNumber(player, "level");
  const pl = getPowerLevel(player);

  const form = new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6MAIN MENU")
    .label(`§fRace: §e${race}   §fLV: §e${level}   §fPL: §6${pl}`)
    .button("§6Player Status", "textures/items/dbz_menu")
    .button("§6Transformations", "textures/items/dbz_menu")
    .button("§bTechniques", "textures/items/kamehameha")
    .button("§eQuests", "textures/items/dbz_menu")
    .button("§fSettings", "textures/items/dbz_menu")
    .button("§cClose", "textures/items/dbz_menu");

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;

  if (result.selection === 0) return playerStatus(player);
  if (result.selection === 1) return placeholder(player, "TRANSFORMATIONS", "Transformation selection and visible forms are being connected next.");
  if (result.selection === 2) return specials(player);
  if (result.selection === 3) return placeholder(player, "QUESTS", "Quest progression will be added after the combat/HUD foundation is stable.");
  if (result.selection === 4) return placeholder(player, "SETTINGS", "HUD and control options are being prepared for mobile.");
}
