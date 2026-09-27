import { system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { applyRaceAppearance } from "./appearance.js";
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
  {
    id: "Saiyan",
    icon: "textures/items/race_saiyan_icon",
    color: "§6",
    description: "Warrior race with explosive growth and strong melee potential.",
    atk: 4, def: 2, spd: 3, regen: 0,
    stats: { str: 7, dex: 6, con: 6, wil: 5, mnd: 4, spi: 5 }
  },
  {
    id: "Namekian",
    icon: "textures/items/race_namekian_icon",
    color: "§a",
    description: "Durable fighter with natural regeneration and balanced Ki control.",
    atk: 3, def: 2, spd: 2, regen: 2,
    stats: { str: 6, dex: 5, con: 7, wil: 5, mnd: 5, spi: 6 }
  },
  {
    id: "Arcosian",
    icon: "textures/items/race_arcosian_icon",
    color: "§d",
    description: "Powerful alien race with high defense and exceptional Ki potential.",
    atk: 3, def: 3, spd: 1, regen: 0,
    stats: { str: 6, dex: 4, con: 7, wil: 6, mnd: 5, spi: 7 }
  },
  {
    id: "Earthling",
    icon: "textures/items/race_earthling_icon",
    color: "§b",
    description: "Adaptable human fighter with balanced speed, technique and growth.",
    atk: 2, def: 2, spd: 3, regen: 1,
    stats: { str: 5, dex: 6, con: 5, wil: 5, mnd: 6, spi: 6 }
  }
];

function applyRaceStats(player, race) {
  for (const [stat, value] of Object.entries(race.stats)) setNumber(player, stat, value);
}

export async function ensureCharacterCreation(player) {
  if (!player) return;
  if (getNumber(player, "characterCreated") >= 1 && getNumber(player, "creationRevision") >= 1) return;
  if (creationOpen.has(player.id)) return;

  creationOpen.add(player.id);
  let retry = false;
  let index = Math.max(0, RACES.findIndex(r => r.id === getString(player, "race")));
  if (index < 0) index = 0;

  try {
    while (getNumber(player, "creationRevision") < 1) {
      const race = RACES[index];
      const form = new ActionFormData()
        .title("§lDRAGON BREAKERS")
        .header("§6CHARACTER CREATION")
        .label(
          "§fSELECT YOUR RACE\n\n" +
          `§fRACE: ${race.color}§l${race.id}§r\n` +
          `§7${race.description}\n\n` +
          `§fATK: §6${race.atk}   §fDEF: §e${race.def}   §fSPD: §b${race.spd}   §fREGEN: §a${race.regen}\n\n` +
          "§7Use Previous / Next to preview a race, then confirm."
        )
        .button("§6◀  PREVIOUS", race.icon)
        .button(`§a✔  SELECT ${race.id.toUpperCase()}`, race.icon)
        .button("§6NEXT  ▶", race.icon);

      const result = await form.show(player);
      if (result.canceled || result.selection === undefined) {
        retry = true;
        break;
      }

      if (result.selection === 0) {
        index = (index - 1 + RACES.length) % RACES.length;
        continue;
      }

      if (result.selection === 2) {
        index = (index + 1) % RACES.length;
        continue;
      }

      if (result.selection === 1) {
        setString(player, "race", race.id);
        applyRaceStats(player, race);
        setNumber(player, "characterCreated", 1);
        setNumber(player, "creationRevision", 1);
        system.run(() => applyRaceAppearance(player));
        player.sendMessage(`§aCharacter created! Race: §f${race.id}`);
        break;
      }
    }
  } catch (error) {
    console.warn("[Dragon Breakers] Character creation form failed: " + error);
    retry = true;
  } finally {
    creationOpen.delete(player.id);
  }

  if (retry && getNumber(player, "creationRevision") < 1) {
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
    `§6Race: §f${race}\n§6Level: §f${level}\n§6Form: §f${formName}\n` +
    `§6Power Level: §f${pl}\n§6TP: §f${tp}\n§6Mastery: §f${mastery}\n\n` +
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
      "§6Mobile controls:\n§fHold Crouch = Charge Ki + Aura\n§fTap Use = Fire active technique\n§fCrouch + Use = Cycle techniques"
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
  }
}

async function settingsMenu(player) {
  const modes = ["Off", "Low", "Full"];
  const current = getString(player, "terrainMode");
  const aura = getNumber(player, "auraEnabled") >= 1;

  const result = await new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6SETTINGS")
    .label(
      `§fTerrain Destruction: §e${current}\n` +
      `§fCharging Aura: ${aura ? "§aON" : "§cOFF"}\n\n` +
      "§7Low is recommended for mobile. Full creates larger craters and may cost more performance."
    )
    .button(`§6Terrain Destruction • ${current}`, "textures/items/ki_blast")
    .button(`§bCharging Aura • ${aura ? "ON" : "OFF"}`, "textures/items/kamehameha")
    .button("§8Back", "textures/items/dbz_menu")
    .show(player);

  if (result.canceled || result.selection === undefined) return;

  if (result.selection === 0) {
    const index = Math.max(0, modes.indexOf(current));
    setString(player, "terrainMode", modes[(index + 1) % modes.length]);
    return settingsMenu(player);
  }

  if (result.selection === 1) {
    setNumber(player, "auraEnabled", aura ? 0 : 1);
    return settingsMenu(player);
  }

  if (result.selection === 2) return openMainMenu(player);
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
  if (getNumber(player, "creationRevision") < 1) return ensureCharacterCreation(player);

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
  if (result.selection === 4) return settingsMenu(player);
}
