import { ActionFormData } from "@minecraft/server-ui";
import { getNumber, getString, setString } from "./playerData.js";

const RACES = [
  { id: "Saiyan", text: "§6Saiyan\n§7ATK 4  DEF 2  SPD 3  REGEN 0" },
  { id: "Namekian", text: "§aNamekian\n§7ATK 3  DEF 2  SPD 2  REGEN 2" },
  { id: "Arcosian", text: "§dArcosian\n§7ATK 3  DEF 3  SPD 1  REGEN 0" },
  { id: "Earthling", text: "§bEarthling\n§7ATK 2  DEF 2  SPD 3  REGEN 1" }
];

async function chooseRace(player) {
  const form = new ActionFormData().title("§lRACES").body("Choose your race. This is saved to your character.");
  for (const race of RACES) form.button(race.text);
  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  const race = RACES[result.selection];
  setString(player, "race", race.id);
  player.sendMessage(`§aRace selected: §f${race.id}`);
}

async function specials(player) {
  const form = new ActionFormData()
    .title("§lSPECIALS")
    .body("Technique loadout\n\n§7Slot 1  Kamehameha\nSlot 2  Ki Blast\nSlot 3  Spirit Bomb\nSlot 4  Empty")
    .button("§bKamehameha")
    .button("§eKi Blast")
    .button("§5Spirit Bomb")
    .button("§8Back");
  await form.show(player);
}

export async function openMainMenu(player) {
  const race = getString(player, "race");
  const level = getNumber(player, "level");
  const form = new ActionFormData()
    .title("§lDRAGON BALL")
    .body(`§fRace: §e${race}\n§fLevel: §e${level}\n\n§7Character / techniques foundation v0.3`)
    .button("§6Races")
    .button("§bSpecials")
    .button("§fCharacter")
    .button("§cClose");
  const result = await form.show(player);
  if (result.canceled) return;
  if (result.selection === 0) return chooseRace(player);
  if (result.selection === 1) return specials(player);
  if (result.selection === 2) player.sendMessage("§7Character customization is being connected to visual models next.");
}
