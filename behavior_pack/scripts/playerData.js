import { CONFIG } from "./config.js";

const DEFAULTS = Object.freeze({
  race: "Unselected",
  level: 1,
  xp: 0,
  tp: 0,
  form: "Base",
  mastery: 0,
  str: 5,
  dex: 5,
  con: 5,
  wil: 5,
  mnd: 5,
  spi: 5,
  ki: CONFIG.maxKi,
  stamina: CONFIG.maxStamina,
  selectedSlot: 1,
  skill1: "Kamehameha",
  skill2: "Ki Blast",
  skill3: "Spirit Bomb",
  skill4: "Empty",
  characterCreated: 0,
  creationRevision: 0,
  terrainMode: "Low",
  auraEnabled: 1,
  focus: "Balanced",
  auraStyle: "Blue",
  appearanceRevision: 0,
  bodyType: "Normal",
  skinTone: "Default",
  hairStyle: "Style 1",
  hairColor: "Black",
  eyeStyle: "Eyes 1"
});

const key = (name) => `dbz:${name}`;

export function getNumber(player, name) {
  const value = player.getDynamicProperty(key(name));
  return typeof value === "number" ? value : DEFAULTS[name];
}

export function setNumber(player, name, value) {
  player.setDynamicProperty(key(name), value);
}

export function getString(player, name) {
  const value = player.getDynamicProperty(key(name));
  return typeof value === "string" ? value : DEFAULTS[name];
}

export function setString(player, name, value) {
  player.setDynamicProperty(key(name), value);
}

export function initializePlayer(player) {
  for (const [name, value] of Object.entries(DEFAULTS)) {
    if (player.getDynamicProperty(key(name)) !== undefined) continue;
    if (typeof value === "number") setNumber(player, name, value);
    else setString(player, name, value);
  }
}

export function getPowerLevel(player) {
  const stats = ["str", "dex", "con", "wil", "mnd", "spi"]
    .reduce((sum, stat) => sum + getNumber(player, stat), 0);
  return Math.max(1, Math.floor(stats * 12 + getNumber(player, "level") * 25));
}

export function clampResource(player, name, max, value) {
  setNumber(player, name, Math.max(0, Math.min(max, value)));
}

export function getLoadout(player) {
  return {
    selectedSlot: Math.max(1, Math.min(4, Math.floor(getNumber(player, "selectedSlot")))),
    slots: [1, 2, 3, 4].map((slot) => getString(player, `skill${slot}`))
  };
}

export function selectSkillSlot(player, slot) {
  setNumber(player, "selectedSlot", Math.max(1, Math.min(4, Math.floor(slot))));
}


export function getXpForNextLevel(levelOrPlayer) {
  const level = typeof levelOrPlayer === "number"
    ? Math.max(1, Math.floor(levelOrPlayer))
    : Math.max(1, Math.floor(getNumber(levelOrPlayer, "level")));
  return Math.floor(100 + 55 * Math.pow(level - 1, 1.22));
}

export function addXp(player, amount, reason = "") {
  if (!player || !Number.isFinite(amount) || amount <= 0) return { leveled: false, levels: 0 };

  let level = Math.max(1, Math.floor(getNumber(player, "level")));
  let xp = Math.max(0, Math.floor(getNumber(player, "xp"))) + Math.floor(amount);
  let levels = 0;

  while (xp >= getXpForNextLevel(level)) {
    xp -= getXpForNextLevel(level);
    level++;
    levels++;
    setNumber(player, "tp", getNumber(player, "tp") + 3);
  }

  setNumber(player, "xp", xp);
  setNumber(player, "level", level);

  if (levels > 0) {
    try {
      player.sendMessage(`§6§lLEVEL UP! §r§fLevel ${level} §7• §e+${levels * 3} TP`);
    } catch {}
  }

  return { leveled: levels > 0, levels, level, xp };
}

export function getFocusMultiplier(player, kind) {
  const focus = getString(player, "focus");
  if (kind === "damage") {
    if (focus === "Power") return 1.18;
    if (focus === "Ki") return 1.08;
    return 1.0;
  }
  if (kind === "cost") {
    if (focus === "Ki") return 0.82;
    return 1.0;
  }
  if (kind === "cooldown") {
    if (focus === "Speed") return 0.82;
    return 1.0;
  }
  return 1.0;
}
