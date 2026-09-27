import { CONFIG } from "./config.js";

const DEFAULTS = Object.freeze({
  race: "Earthling",
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
  stamina: CONFIG.maxStamina
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
