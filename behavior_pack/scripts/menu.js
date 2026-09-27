import { ActionFormData } from "@minecraft/server-ui";
import { getLoadout, getNumber, getString, selectSkillSlot, setString } from "./playerData.js";

const RACES = [
  { id: "Saiyan", text: "§6Saiyan\n§7ATK 4  DEF 2  SPD 3  REGEN 0" },
  { id: "Namekian", text: "§aNamekian\n§7ATK 3  DEF 2  SPD 2  REGEN 2" },
  { id: "Arcosian", text: "§dArcosian\n§7ATK 3  DEF 3  SPD 1  REGEN 0" },
  { id: "Earthling", text: "§bEarthling\n§7ATK 2  DEF 2  SPD 3  REGEN 1" }
];

async function chooseRace(player) {
  const form = new ActionFormData().title("§lDRAGON BREAKERS • RACES").body("Choose your race. This is saved to your character.");
  for (const race of RACES) form.button(race.text);
  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  const race = RACES[result.selection];
  setString(player, "race", race.id);
  player.sendMessage(`§aRace selected: §f${race.id}`);
}

async function specials(player) {
  const loadout = getLoadout(player);
  const form = new ActionFormData()
    .title("§lDRAGON BREAKERS • SPECIALS")
    .body(`§7Select the active technique slot.\n§fCurrent: §6Slot ${loadout.selectedSlot}\n\n§71  §b${loadout.slots[0]}\n§72  §e${loadout.slots[1]}\n§73  §5${loadout.slots[2]}\n§74  §8${loadout.slots[3]}`)
    .button("§6Slot 1 • Kamehameha")
    .button("§6Slot 2 • Ki Blast")
    .button("§6Slot 3 • Spirit Bomb")
    .button("§6Slot 4 • Empty")
    .button("§8Back");
  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  if (result.selection >= 0 && result.selection <= 3) {
    selectSkillSlot(player, result.selection + 1);
    player.sendMessage(`§6Active technique slot: §f${result.selection + 1}`);
  }
}

export async function openMainMenu(player) {
  const race = getString(player, "race");
  const level = getNumber(player, "level");
  const form = new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .body(`§fRace: §e${race}\n§fLevel: §e${level}\n\n§7Dragon Breakers v0.5 • Character & Techniques`)
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
