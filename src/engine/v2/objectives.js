/**
 * Objectives (v1.4) — faction-bound objective tracks.
 *
 * Society investigators gather Clues to solve the mystery; the Cult accumulates
 * Doom to summon the old god.  Reaching OBJECTIVE_THRESHOLD wins immediately.
 * This module is pure data + pure functions (no randomness, no DOM).
 * See docs/EXPANSION_V2_OBJECTIVES_DESIGN.md.
 */

/**
 * Shipped threshold.  A v1.4 data sweep (scripts/balance-objectives-sweep.mjs)
 * showed a sharp cliff: 6 → 62% objective endings (too dominant), 7 → ~31% with
 * all three ending types balanced, 8 → ~5% (mechanism nearly dead). Finalised at 7.
 */
export const OBJECTIVE_THRESHOLD = 7;

export const OBJECTIVE_TYPES = Object.freeze({
  CLUE: 'clue',
  DOOM: 'doom',
});

/**
 * Per-type display metadata.  faction is the only player faction that earns it.
 */
export const OBJECTIVE_META = Object.freeze({
  clue: Object.freeze({
    type: 'clue',
    nameZh: '线索',
    nameEn: 'Clue',
    faction: 'society',
    winZh: '真相大白',
    winEn: 'The Truth Revealed',
  }),
  doom: Object.freeze({
    type: 'doom',
    nameZh: '末日',
    nameEn: 'Doom',
    faction: 'cult',
    winZh: '旧神降临',
    winEn: 'The Old God Descends',
  }),
});

const FACTION_TO_OBJECTIVE = Object.freeze({
  society: OBJECTIVE_TYPES.CLUE,
  cult: OBJECTIVE_TYPES.DOOM,
});

/** Objective type for a player faction, or null for an unknown/neutral faction. */
export function objectiveTypeForFaction(faction) {
  return FACTION_TO_OBJECTIVE[faction] ?? null;
}

/** Display metadata for a player faction (null when it has no objective). */
export function objectiveMetaForFaction(faction) {
  const type = objectiveTypeForFaction(faction);
  return type ? OBJECTIVE_META[type] : null;
}
