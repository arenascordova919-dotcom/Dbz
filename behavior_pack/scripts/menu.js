import { ActionFormData } from "@minecraft/server-ui";
import {
  getLoadout,
  getNumber,
  getPowerLevel,
  getString,
  selectSkillSlot,
  setString
} from "./playerData.js";

const RACES = [
  { id: "Saiyan", text: "§6Saiyan\n§7ATK 4  DEF 2  SPD 3  REGEN 0" },
  { id: "Namekian", text: "§aNamekian\n§7ATK 3  DEF 2  SPD 2  REGEN 2" },
  { id: "Arcosian", text: "§dArcosian\n§7ATK 3  DEF 3  SPD 1  REGEN 0" },
  { id: "Earthling", text: "§bEarthling\n§7ATK 2  DEF 2  SPD 3  REGEN 1" }
];

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

async function chooseRace(player) {
  const form = new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6RACES")
    .label("§7Choose your race. Your selection is saved to this character.");

  for (const race of RACES) form.button(race.text, "textures/items/dbz_menu");
  form.button("§8Back", "textures/items/dbz_menu");

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  if (result.selection === RACES.length) return openMainMenu(player);

  const race = RACES[result.selection];
  setString(player, "race", race.id);
  player.sendMessage(`§aRace selected: §f${race.id}`);
}

async function specials(player) {
  const loadout = getLoadout(player);
  const form = new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6TECHNIQUES")
    .label(`§7Selected slot: §6${loadout.selectedSlot}\n§f1 §b${loadout.slots[0]}\n§f2 §e${loadout.slots[1]}\n§f3 §9${loadout.slots[2]}\n§f4 §8${loadout.slots[3]}`)
    .button("§6Slot 1 • Kamehameha", "textures/items/kamehameha")
    .button("§6Slot 2 • Ki Blast", "textures/items/ki_blast")
    .button("§6Slot 3 • Spirit Bomb", "textures/items/ki_blast")
    .button("§6Slot 4 • Empty", "textures/items/dbz_menu")
    .button("§8Back", "textures/items/dbz_menu");

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  if (result.selection === 4) return openMainMenu(player);
  if (result.selection >= 0 && result.selection <= 3) {
    selectSkillSlot(player, result.selection + 1);
    player.sendMessage(`§6Active technique slot: §f${result.selection + 1}`);
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
  const race = getString(player, "race");
  const level = getNumber(player, "level");
  const pl = getPowerLevel(player);

  const form = new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6MAIN MENU")
    .label(`§fRace: §e${race}   §fLV: §e${level}   §fPL: §6${pl}`)
    .button("§6Player Status", "textures/items/dbz_menu")
    .button("§6Race", "textures/items/dbz_menu")
    .button("§6Transformations", "textures/items/dbz_menu")
    .button("§bTechniques", "textures/items/kamehameha")
    .button("§eQuests", "textures/items/dbz_menu")
    .button("§fSettings", "textures/items/dbz_menu")
    .button("§cClose", "textures/items/dbz_menu");

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;

  if (result.selection === 0) return playerStatus(player);
  if (result.selection === 1) return chooseRace(player);
  if (result.selection === 2) return placeholder(player, "TRANSFORMATIONS", "Transformation selection and visible forms are being connected next.");
  if (result.selection === 3) return specials(player);
  if (result.selection === 4) return placeholder(player, "QUESTS", "Quest progression will be added after the combat/HUD foundation is stable.");
  if (result.selection === 5) return placeholder(player, "SETTINGS", "HUD and control options are being prepared for mobile.");
}
