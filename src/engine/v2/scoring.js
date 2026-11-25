/**
 * Greyharbor v2.2 — pure rules helpers and power calculation.
 *
 * Power follows rules §9.7 exactly:
 *   face/base → permanent → corruption loss → equipment → this-night
 *   modifiers → chain → clamp at 0.
 *
 * Chain is recomputed on demand, so every board change is reflected without
 * stored aura state.  A face-down or sealed card contributes no chain bonus.
 */

import { chainSpecFor } from './effects/registry.js';

export const LOCATIONS = Object.freeze(['scene', 'archive', 'dream']);

export const LOCATION_CAPACITY = Object.freeze({
  scene: 5,
  archive: 5,
  dream: 3,
});

export const LOCATION_LABELS = Object.freeze({
  scene: '现场',
  archive: '档案',
  dream: '梦境',
});

export const SANITY_MIN = 0;
export const SANITY_MAX = 6;
export const SANITY_MADNESS_THRESHOLD = 3;

export const KEYWORDS = Object.freeze({
  STEALTH: 'stealth',
  SEAL: 'seal',
  CHAIN: 'chain',
  BACKLASH: 'backlash',
  CORRUPTION: 'corruption',
  SACRIFICE: 'sacrifice',
});

export function clampSanity(value) {
  return Math.max(SANITY_MIN, Math.min(SANITY_MAX, value));
}

/** Sanity <= 3 forces every card in hand onto its madness face. */
export function faceForSanity(sanity) {
  return sanity <= SANITY_MADNESS_THRESHOLD ? 'madness' : 'reason';
}

export function isUnitCard(card) {
  return !!card && (card.type === 'unit' || card.type === 'oldgod');
}

export function hasKeyword(card, keyword) {
  if (!card || !Array.isArray(card.keywords)) return false;
  return card.keywords.includes(keyword);
}

export function isStealth(card) {
  return hasKeyword(card, KEYWORDS.STEALTH);
}

export function hasBacklash(card) {
  return hasKeyword(card, KEYWORDS.BACKLASH);
}

export function hasChain(card) {
  return hasKeyword(card, KEYWORDS.CHAIN);
}

/** Printed power for the locked face.  Non-units have no power. */
export function printedPower(card, face) {
  if (!isUnitCard(card)) return 0;
  if (face === 'madness') return card.madnessPower ?? card.reasonPower ?? 0;
  return card.reasonPower ?? card.madnessPower ?? 0;
}

export function boardUnits(state, p) {
  const out = [];
  for (const location of LOCATIONS) {
    const row = state.players[p].board[location];
    for (let slot = 0; slot < row.length; slot++) {
      if (row[slot]) out.push({ inst: row[slot], location, slot });
    }
  }
  return out;
}

export function unitAt(state, p, location, slot) {
  return state.players[p].board[location]?.[slot] ?? null;
}

export function findUnit(state, p, uid) {
  for (const entry of boardUnits(state, p)) {
    if (entry.inst.uid === uid) return entry;
  }
  return null;
}

/** The Drowned Bell Altar cross-reference used by §6.4 / §7.2. */
export function hasUnsealedAltar(state, p) {
  const card = state.players[p].locations?.scene;
  return !!card && card.cardId === 'drowned-altar' && !card.sealed;
}

/**
 * Corruption immunity is a flag on the instance.  §6.3 names Old Library as
 * a source; the location card itself is implemented in phase 2.2b, but the
 * keyword primitive still honours its presence for archive cards so the
 * immunity/retarget rule is testable today.
 */
export function isCorruptionImmune(state, p, inst, location) {
  if (inst?.corruptionImmune) return true;
  if (location === 'archive') {
    const library = state.players[p].locations?.archive;
    if (library && library.cardId === 'old-library' && !library.sealed) return true;
  }
  return false;
}

export function canReceiveCorruption(state, p, inst, location) {
  if (!inst || inst.faceDown) return false;
  if (!isUnitCard(state.cardIndex?.[inst.cardId])) return false;
  if ((inst.corruptionTokens?.length ?? 0) >= 3) return false;
  return !isCorruptionImmune(state, p, inst, location);
}

function chainCount(state, p, inst, location, slot) {
  const card = state.cardIndex?.[inst.cardId];
  const spec = chainSpecFor(inst.cardId);
  if (!spec || !hasChain(card)) return 0;
  if (inst.faceDown || inst.sealed) return 0;

  let count = 0;
  if (spec.scope === 'archiveOthers') {
    if (location !== 'archive') return 0;
    for (const entry of state.players[p].board.archive) {
      if (entry && entry.uid !== inst.uid) count += 1;
    }
  } else if (spec.scope === 'adjacent') {
    const row = state.players[p].board[location];
    for (const neighbourSlot of [slot - 1, slot + 1]) {
      if (neighbourSlot >= 0 && neighbourSlot < row.length && row[neighbourSlot]) count += 1;
    }
  }
  return Number.isFinite(spec.cap) ? Math.min(spec.cap, count) : count;
}

/** Equipment bonuses.  Silver Lantern's +2 is text (2.2b); the primitive is here. */
function equipmentBonus(state, inst) {
  const equipment = inst.equipment;
  if (!equipment || equipment.sealed) return 0;
  const card = state.cardIndex?.[equipment.cardId];
  return (equipment.powerBonus ?? 0) + (card?.powerBonus ?? 0);
}

/** Player-wide "this night" auras; §7.2 cult sacrifice echo currently. */
function thisNightBonus(state, p, inst) {
  const player = state.players[p];
  let bonus = inst.thisNightPower ?? 0;
  if (player.faction === 'cult' && player.flags?.cultSacrificeTriggered) {
    bonus += hasUnsealedAltar(state, p) ? 3 : 2;
  }
  return bonus;
}

/**
 * Current power of one board instance.
 * `state.cardIndex` is normally attached by the engine in createGame().
 */
export function currentUnitPower(state, p, inst, location, slot) {
  if (!inst || inst.faceDown) return 0;
  const card = state.cardIndex?.[inst.cardId];
  if (!isUnitCard(card)) return 0;

  let power = printedPower(card, inst.face);
  power += inst.permanentPower ?? 0;
  power -= inst.corruptionLoss ?? 0;
  power += equipmentBonus(state, inst);
  power += thisNightBonus(state, p, inst);
  power += chainCount(state, p, inst, location, slot);
  return Math.max(0, power);
}

/** Current power by uid, used by selectors that rank targets. */
export function currentPowerOfUid(state, p, uid) {
  const entry = findUnit(state, p, uid);
  if (!entry) return 0;
  return currentUnitPower(state, p, entry.inst, entry.location, entry.slot);
}

/** Legacy helper kept for callers that only have the instance/card. */
export function unitPower(inst, card) {
  if (!inst || inst.faceDown) return 0;
  return printedPower(card, inst.face);
}

/** Per-location and total board score for one player. */
export function scorePlayer(state, p) {
  const player = state.players[p];
  const locations = { scene: 0, archive: 0, dream: 0 };
  let total = 0;
  for (const location of LOCATIONS) {
    const row = player.board[location];
    for (let slot = 0; slot < row.length; slot++) {
      const inst = row[slot];
      if (!inst) continue;
      const power = currentUnitPower(state, p, inst, location, slot);
      locations[location] += power;
      total += power;
    }
  }
  return { total, locations };
}

/** All board instances of one player, in stable location/slot order. */
export function boardInstances(state, p) {
  return boardUnits(state, p);
}

/** Every card owned by a player, across every zone (rules §5.2). */
export function countCards(state, p) {
  const player = state.players[p];
  let count =
    player.hand.length
    + player.deck.length
    + player.discard.length
    + (player.abyss?.length ?? 0);

  for (const location of LOCATIONS) {
    for (const inst of player.board[location]) {
      if (!inst) continue;
      count += 1;
      if (inst.equipment) count += 1;
    }
    if (player.locations?.[location]) count += 1;
  }
  count += (state.environments ?? []).filter((inst) => inst.owner === p).length;
  return count;
}

/** Every uid currently owned by a player, used by tests for uniqueness checks. */
export function ownedUids(state, p) {
  const player = state.players[p];
  const uids = [
    ...player.hand.map((i) => i.uid),
    ...player.deck.map((i) => i.uid),
    ...player.discard.map((i) => i.uid),
    ...(player.abyss?.map((i) => i.uid) ?? []),
  ];
  for (const location of LOCATIONS) {
    for (const inst of player.board[location]) {
      if (!inst) continue;
      uids.push(inst.uid);
      if (inst.equipment) uids.push(inst.equipment.uid);
    }
    if (player.locations?.[location]) uids.push(player.locations[location].uid);
  }
  for (const inst of state.environments ?? []) {
    if (inst.owner === p) uids.push(inst.uid);
  }
  return uids;
}
