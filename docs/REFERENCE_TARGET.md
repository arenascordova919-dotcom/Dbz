# Reference Target — HUD, Character & Combat

The supplied gameplay screenshots are the visual/UX target. Implement original Bedrock-compatible assets and code inspired by the layout rather than copying source assets.

## HUD
- Top-left player portrait.
- Player name next to portrait.
- HP and Ki bars horizontally beside portrait.
- Level and stamina below.
- Compact mobile-safe sizing; no vanilla hearts/hunger in final custom HUD.
- Left-side four-slot technique selector with active technique name/icon.

## Techniques
- Four equip slots.
- Loadout screen for selecting attacks.
- Kamehameha: charge pose, energy sphere at hands, beam/projectile phase, impact, Ki cost, cooldown.
- Ki Blast: fast projectile with visible travel and impact.
- Genki Dama / Spirit Bomb: long charge state and large energy attack.
- Techniques are systems, not ordinary visible held items.

## Character / Races
- Visual race-selection panel with live character preview.
- Initial races: Saiyan, Namekian, Arcosian/Frost Demon, Earthling.
- Race panel shows HP, regeneration, attack, defense and speed modifiers.
- Selecting a race must visibly alter the character.
- Customization panel: body type, skin tone, hairstyle, hair color.
- Transformations visibly alter hair/body/aura, not text-only state.

## Movement & VFX
- Functional flight with hover/forward/vertical states and animation hooks.
- Charging aura aligned around the body.
- Transformation aura and charge meter.
- Third-person presentation must remain readable.

## Dragon Balls
- Dragon Balls can exist as world objects/placeable entities rather than only inventory icons.
- Distinct star counts.
- Collection tracking and future summon flow.

## UI direction
- Dark near-black panels, sharp borders, white text, cyan energy accents and gold selection accents.
- Large touch targets for iPhone/mobile.
- No grey vanilla-form look for final primary screens.
- Avoid UI overlap with the player model and safe-zone edges.

## Engineering rules
- Keep Behavior Pack and Resource Pack versions synchronized.
- One authoritative implementation per system; remove obsolete duplicates before release.
- Do not use unsupported Molang queries or invalid Bedrock UI properties.
- Build incrementally and validate manifests/JSON before merging.
