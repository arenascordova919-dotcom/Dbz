import { EquipmentSlot, system, world } from "@minecraft/server";
import { getNumber, getString } from "./playerData.js";

const RACE = Object.freeze({
  Earthling: "earthling",
  Saiyan: "saiyan",
  Namekian: "namekian",
  Arcosian: "arcosian",
  Unselected: "earthling"
});
const BODY = Object.freeze({ "Type 1": 0, "Type 2": 1, "Type 3": 2, Normal: 0, Muscular: 1, Slim: 2 });
const SKIN = Object.freeze({ Default: 0, Light: 1, Medium: 2, Dark: 3 });
const HAIR = Object.freeze({ "Style 1": 0, "Style 2": 1, "Style 3": 2, "Style 4": 3 });
const HAIR_COLOR = Object.freeze({ Black: 0, Brown: 1, Gold: 2, Blue: 3, White: 4 });
const EYES = Object.freeze({ "Eyes 1": 0, "Eyes 2": 1, "Eyes 3": 2 });
const AURA = Object.freeze({ Blue: "blue", Gold: "gold", Violet: "violet", Green: "green" });

const last = new Map();

function launcherHeld(player) {
  try {
    return player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId === "dbz:technique_launcher";
  } catch {
    return false;
  }
}

function write(player, property, value, state) {
  if (state[property] === value) return;
  try {
    player.setProperty(property, value);
    state[property] = value;
  } catch (error) {
    // One concise warning per player/property prevents log spam if a client is still using an old cached BP.
    const key = player.id + ":" + property;
    if (!last.has("warn:" + key)) {
      last.set("warn:" + key, true);
      console.warn("[Dragon Breakers] Player render property unavailable " + property + ": " + error);
    }
  }
}

export function syncPlayerRenderer(player) {
  if (!player) return;
  const state = last.get(player.id) ?? {};

  const race = RACE[getString(player, "race")] ?? "earthling";
  const body = BODY[getString(player, "bodyType")] ?? 0;
  const skin = SKIN[getString(player, "skinTone")] ?? 0;
  const hair = HAIR[getString(player, "hairStyle")] ?? 0;
  const hairColor = HAIR_COLOR[getString(player, "hairColor")] ?? 0;
  const eyes = EYES[getString(player, "eyeStyle")] ?? 0;
  const aura = AURA[getString(player, "auraStyle")] ?? "blue";
  const charging = !!(player.isSneaking && launcherHeld(player));

  write(player, "dbz:race", race, state);
  write(player, "dbz:body_type", body, state);
  write(player, "dbz:skin_tone", skin, state);
  write(player, "dbz:hair_style", hair, state);
  write(player, "dbz:hair_color", hairColor, state);
  write(player, "dbz:eye_style", eyes, state);
  write(player, "dbz:has_tail", race === "saiyan", state);
  write(player, "dbz:aura_style", aura, state);
  write(player, "dbz:charging", charging, state);
  write(player, "dbz:transformation", 0, state);

  last.set(player.id, state);
}

export function startPlayerRendererSync() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) syncPlayerRenderer(player);
  }, 5);
}
