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
const customizationOpen = new Set();
const appearanceOpen = new Set();
const FOCUSES = ["Balanced", "Power", "Speed", "Ki"];
const AURA_STYLES = ["Blue", "Gold", "Violet", "Green"];
const BODY_TYPES = ["Normal", "Muscular", "Slim"];
const SKIN_TONES = ["Default", "Light", "Medium", "Dark"];
const HAIR_STYLES = ["Style 1", "Style 2", "Style 3", "Style 4"];
const HAIR_COLORS = ["Black", "Brown", "Gold", "Blue", "White"];
const EYE_STYLES = ["Eyes 1", "Eyes 2", "Eyes 3"];

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
  if (getNumber(player, "characterCreated") >= 1 && getNumber(player, "creationRevision") >= 2) return ensureAppearanceSetup(player);
  if (creationOpen.has(player.id)) return;

  creationOpen.add(player.id);
  let retry = false;
  let confirmed = false;
  const originalRace = getString(player, "race");
  let index = Math.max(0, RACES.findIndex(r => r.id === originalRace));
  if (index < 0) index = 0;

  try {
    while (getNumber(player, "creationRevision") < 2) {
      const race = RACES[index];

      // Preview the race live in the custom player renderer without applying stats yet.
      setString(player, "race", race.id);

      const form = new ActionFormData()
        .title("dbz_race_select")
        .label(
          `§6§l${race.id.toUpperCase()}§r\n\n` +
          `§7${race.description}\n\n` +
          `§fATK §6${race.atk}   §fDEF §e${race.def}   §fSPD §b${race.spd}   §fREG §a${race.regen}`
        )
        .button("§6◀")
        .button(`§aSELECT ${race.id.toUpperCase()}`, race.icon)
        .button("§6▶");

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
        setNumber(player, "creationRevision", 2);
        confirmed = true;
        system.runTimeout(() => ensureAppearanceSetup(player), 2);
        break;
      }
    }
  } catch (error) {
    console.warn("[Dragon Breakers] Character creation form failed: " + error);
    retry = true;
  } finally {
    if (!confirmed && getNumber(player, "creationRevision") < 2) setString(player, "race", originalRace);
    creationOpen.delete(player.id);
  }

  if (retry && getNumber(player, "creationRevision") < 2) {
    system.runTimeout(() => ensureCharacterCreation(player), 30);
  }
}

export async function ensureAppearanceSetup(player) {
  if (!player || getNumber(player, "appearanceRevision") >= 2) return ensureRaceCustomization(player);
  if (appearanceOpen.has(player.id)) return;

  appearanceOpen.add(player.id);

  const original = {
    bodyType: getString(player, "bodyType"),
    skinTone: getString(player, "skinTone"),
    hairStyle: getString(player, "hairStyle"),
    hairColor: getString(player, "hairColor"),
    eyeStyle: getString(player, "eyeStyle")
  };

  let bodyType = original.bodyType;
  let skinTone = original.skinTone;
  let hairStyle = original.hairStyle;
  let hairColor = original.hairColor;
  let eyeStyle = original.eyeStyle;
  let confirmed = false;

  if (!BODY_TYPES.includes(bodyType)) bodyType = bodyType === "Type 2" ? "Muscular" : bodyType === "Type 3" ? "Slim" : "Normal";
  if (!SKIN_TONES.includes(skinTone)) skinTone = "Default";
  if (!HAIR_STYLES.includes(hairStyle)) hairStyle = "Style 1";
  if (!HAIR_COLORS.includes(hairColor)) hairColor = "Black";
  if (!EYE_STYLES.includes(eyeStyle)) eyeStyle = "Eyes 1";

  const cycle = (array, value, direction) => {
    const i = Math.max(0, array.indexOf(value));
    return array[(i + direction + array.length) % array.length];
  };

  try {
    while (getNumber(player, "appearanceRevision") < 2) {
      // These preview values are intentionally written before the form opens so live_player_renderer updates immediately.
      setString(player, "bodyType", bodyType);
      setString(player, "skinTone", skinTone);
      setString(player, "hairStyle", hairStyle);
      setString(player, "hairColor", hairColor);
      setString(player, "eyeStyle", eyeStyle);

      const race = getString(player, "race");
      const hairAllowed = race === "Saiyan" || race === "Earthling";

      const form = new ActionFormData()
        .title("dbz_appearance")
        .label(
          `§6§l${race.toUpperCase()} APPEARANCE§r\n\n` +
          `§fBody   §6${bodyType}\n` +
          `§fSkin   §6${skinTone}\n` +
          `§fHair   §6${hairAllowed ? hairStyle + " / " + hairColor : "Race Specific"}\n` +
          `§fEyes   §6${eyeStyle}\n\n` +
          "§7Use the arrows to preview your fighter, then confirm."
        )
        .button(`§6◀ ${bodyType}`)
        .button(`§6${bodyType} ▶`)
        .button(`§6◀ ${skinTone}`)
        .button(`§6${skinTone} ▶`)
        .button(`§6◀ ${hairAllowed ? hairStyle : "N/A"}`)
        .button(`§6${hairAllowed ? hairStyle : "N/A"} ▶`)
        .button(`§6◀ ${hairAllowed ? hairColor : "N/A"}`)
        .button(`§6${hairAllowed ? hairColor : "N/A"} ▶`)
        .button(`§6◀ ${eyeStyle}`)
        .button(`§6${eyeStyle} ▶`)
        .button("§a✔  ACCEPT");

      const result = await form.show(player);
      if (result.canceled || result.selection === undefined) break;

      if (result.selection === 0) bodyType = cycle(BODY_TYPES, bodyType, -1);
      else if (result.selection === 1) bodyType = cycle(BODY_TYPES, bodyType, 1);
      else if (result.selection === 2) skinTone = cycle(SKIN_TONES, skinTone, -1);
      else if (result.selection === 3) skinTone = cycle(SKIN_TONES, skinTone, 1);
      else if (result.selection === 4 && hairAllowed) hairStyle = cycle(HAIR_STYLES, hairStyle, -1);
      else if (result.selection === 5 && hairAllowed) hairStyle = cycle(HAIR_STYLES, hairStyle, 1);
      else if (result.selection === 6 && hairAllowed) hairColor = cycle(HAIR_COLORS, hairColor, -1);
      else if (result.selection === 7 && hairAllowed) hairColor = cycle(HAIR_COLORS, hairColor, 1);
      else if (result.selection === 8) eyeStyle = cycle(EYE_STYLES, eyeStyle, -1);
      else if (result.selection === 9) eyeStyle = cycle(EYE_STYLES, eyeStyle, 1);
      else if (result.selection === 10) {
        setNumber(player, "appearanceRevision", 2);
        confirmed = true;
        break;
      }
    }
  } catch (error) {
    console.warn("[Dragon Breakers] Appearance setup failed: " + error);
  } finally {
    if (!confirmed && getNumber(player, "appearanceRevision") < 2) {
      setString(player, "bodyType", original.bodyType);
      setString(player, "skinTone", original.skinTone);
      setString(player, "hairStyle", original.hairStyle);
      setString(player, "hairColor", original.hairColor);
      setString(player, "eyeStyle", original.eyeStyle);
    }
    appearanceOpen.delete(player.id);
  }

  if (getNumber(player, "appearanceRevision") >= 2) {
    system.runTimeout(() => ensureRaceCustomization(player), 2);
  }
}

export async function ensureRaceCustomization(player) {
  if (!player || getNumber(player, "creationRevision") >= 3) return;
  if (customizationOpen.has(player.id)) return;

  customizationOpen.add(player.id);
  let focus = getString(player, "focus");
  let aura = getString(player, "auraStyle");

  if (!FOCUSES.includes(focus)) focus = "Balanced";
  if (!AURA_STYLES.includes(aura)) aura = "Blue";

  try {
    while (getNumber(player, "creationRevision") < 3) {
      const race = getString(player, "race");
      const form = new ActionFormData()
        .title("§lDRAGON BREAKERS")
        .header("§6RACE SETUP")
        .label(
          `§fRace: §e${race}\n` +
          `§fCombat Focus: §6${focus}\n` +
          `§fAura Style: §b${aura}\n\n` +
          "§7Power = stronger techniques • Speed = shorter cooldowns • Ki = lower Ki costs • Balanced = neutral."
        )
        .button(`§6Combat Focus • ${focus}`, "textures/items/ki_blast")
        .button(`§bAura Style • ${aura}`, "textures/items/kamehameha")
        .button("§a✔  FINISH SETUP", "textures/items/race_saiyan_icon");

      const result = await form.show(player);
      if (result.canceled || result.selection === undefined) break;

      if (result.selection === 0) {
        focus = FOCUSES[(FOCUSES.indexOf(focus) + 1) % FOCUSES.length];
        continue;
      }
      if (result.selection === 1) {
        aura = AURA_STYLES[(AURA_STYLES.indexOf(aura) + 1) % AURA_STYLES.length];
        continue;
      }
      if (result.selection === 2) {
        setString(player, "focus", focus);
        setString(player, "auraStyle", aura);
        setNumber(player, "creationRevision", 3);
        break;
      }
    }
  } catch (error) {
    console.warn("[Dragon Breakers] Race customization failed: " + error);
  } finally {
    customizationOpen.delete(player.id);
  }
}

export async function ensureCharacterSetup(player) {
  const revision = getNumber(player, "creationRevision");
  if (revision < 2) return ensureCharacterCreation(player);
  if (getNumber(player, "appearanceRevision") < 2) return ensureAppearanceSetup(player);
  if (revision < 3) return ensureRaceCustomization(player);
}

async function playerStatus(player) {
  const race = getString(player, "race");
  const level = getNumber(player, "level");
  const formName = getString(player, "form");
  const mastery = getNumber(player, "mastery");
  const tp = getNumber(player, "tp");
  const pl = getPowerLevel(player);
  const xp = getNumber(player, "xp");
  const focus = getString(player, "focus");
  const auraStyle = getString(player, "auraStyle");
  const bodyType = getString(player, "bodyType");
  const skinTone = getString(player, "skinTone");
  const hairStyle = getString(player, "hairStyle");
  const hairColor = getString(player, "hairColor");
  const eyeStyle = getString(player, "eyeStyle");

  const body =
    `§6Race: §f${race}\n§6Level: §f${level}\n§6Form: §f${formName}\n` +
    `§6Power Level: §f${pl}\n§6XP: §f${Math.floor(xp)}\n§6TP: §f${tp}\n§6Mastery: §f${mastery}\n` +
    `§6Focus: §f${focus}   §6Aura: §f${auraStyle}\n` +
    `§6Body: §f${bodyType}   §6Skin: §f${skinTone}\n` +
    `§6Hair: §f${hairStyle}/${hairColor}   §6Eyes: §f${eyeStyle}\n\n` +
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
      `§fACTIVE §6[${loadout.selectedSlot}] §f${loadout.slots[loadout.selectedSlot - 1]}\n` +
      "§7Slot 8 Launcher: §fUse = Fire  §7•  Crouch+Use = Cycle\n§7Hold Crouch = Charge Ki"
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
  const auraStyle = getString(player, "auraStyle");

  const result = await new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6SETTINGS")
    .label(
      `§fTerrain Destruction: §e${current}\n` +
      `§fCharging Aura: ${aura ? "§aON" : "§cOFF"}\n` +
      `§fAura Style: §b${auraStyle}\n\n` +
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

  if (result.selection === 2) {
    const currentIndex = Math.max(0, AURA_STYLES.indexOf(auraStyle));
    setString(player, "auraStyle", AURA_STYLES[(currentIndex + 1) % AURA_STYLES.length]);
    return settingsMenu(player);
  }

  if (result.selection === 3) return openMainMenu(player);
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
  if (getNumber(player, "creationRevision") < 3 || getNumber(player, "appearanceRevision") < 2) return ensureCharacterSetup(player);

  const race = getString(player, "race");
  const level = getNumber(player, "level");
  const pl = getPowerLevel(player);

  const form = new ActionFormData()
    .title("§lDRAGON BREAKERS")
    .header("§6MAIN MENU")
    .label(`§fRace: §e${race}   §fLV: §e${level}   §fPL: §6${pl}`)
    .button("§6Player Status", "textures/items/race_saiyan_icon")
    .button("§6Transformations", "textures/items/spirit_bomb")
    .button("§bTechniques", "textures/items/kamehameha")
    .button("§eQuests", "textures/items/ki_blast")
    .button("§fSettings", "textures/items/technique_launcher")
    .button("§cClose");

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  if (result.selection === 0) return playerStatus(player);
  if (result.selection === 1) return placeholder(player, "TRANSFORMATIONS", "Transformation progression is the next major system.");
  if (result.selection === 2) return specials(player);
  if (result.selection === 3) return placeholder(player, "QUESTS", "Quest progression will be added after combat stabilization.");
  if (result.selection === 4) return settingsMenu(player);
}
