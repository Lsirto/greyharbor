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

import {
  chainSpecFor,
  conditionalPowerSpecFor,
  equipmentSpecFor,
  isSealImmuneCard,
  madnessPowerBonusFor,
} from './effects/registry.js';

export const LOCATIONS = Object.freeze(['front']);

export const LOCATION_CAPACITY = Object.freeze({
  front: 6,
});

export const LOCATION_LABELS = Object.freeze({
  front: '对峙线',
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
  const base = face === 'madness'
    ? (card.madnessPower ?? card.reasonPower ?? 0)
    : (card.reasonPower ?? card.madnessPower ?? 0);
  // §11.2 Zealot / Deep One: "疯狂面基础 +3".  The bonus is a printed-power
  // modifier on the madness face, so it also shows correctly in views.
  return base + (face === 'madness' ? madnessPowerBonusFor(card.id) : 0);
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
  const card = state.players[p].locations?.front;
  return !!card && card.cardId === 'drowned-altar' && !card.sealed;
}

/**
 * Corruption immunity.  Three sources:
 *   1. an instance flag (`corruptionImmune`, used by tests/future cards),
 *   2. Old Library while unsealed, for every own card in the archive,
 *   3. a Warding Rite aura with `corruptionImmune` for the chosen location.
 * Existing tokens are never removed by immunity (§6.3).
 */
export function isCorruptionImmune(state, p, inst, location) {
  if (inst?.corruptionImmune) return true;
  const library = state.players[p].locations?.front;
  if (library && library.cardId === 'old-library' && !library.sealed) return true;
  const card = state.cardIndex?.[inst?.cardId];
  for (const aura of state.effects ?? []) {
    if (!aura.modifiers?.corruptionImmune) continue;
    if (!auraApplies(aura, state, p, inst, location, card)) continue;
    return true;
  }
  return false;
}

export function canReceiveCorruption(state, p, inst, location) {
  if (!inst || inst.faceDown) return false;
  if (!isUnitCard(state.cardIndex?.[inst.cardId])) return false;
  if ((inst.corruptionTokens?.length ?? 0) >= 3) return false;
  return !isCorruptionImmune(state, p, inst, location);
}

/** Locate one instance anywhere it can live (board, equipment, locations, env). */
export function findInstanceByUid(state, uid) {
  for (const p of [0, 1]) {
    const player = state.players[p];
    for (const location of LOCATIONS) {
      const row = player.board[location];
      for (const inst of row) {
        if (!inst) continue;
        if (inst.uid === uid) return { inst, player: p, location, slot: inst.slot };
        if (inst.equipment?.uid === uid) {
          return { inst: inst.equipment, player: p, location, slot: inst.slot, host: inst };
        }
      }
      if (player.locations?.[location]?.uid === uid) {
        return { inst: player.locations[location], player: p, location, slot: null };
      }
    }
  }
  for (const inst of state.environments ?? []) {
    if (inst.uid === uid) return { inst, player: inst.owner, location: null, slot: null };
  }
  return null;
}

/** An aura whose source card must still be present and unsealed. */
export function isAuraActive(state, aura) {
  if (!aura.requiresSourceActive) return true;
  const found = aura.sourceUid ? findInstanceByUid(state, aura.sourceUid) : null;
  if (!found) return false;
  return !found.inst.sealed;
}

/** Does one aura cover this card?  Scope is public, data-only. */
export function auraApplies(aura, state, p, inst, location, card) {
  if (!aura || !isAuraActive(state, aura)) return false;
  const scope = aura.scope ?? {};
  if (scope.side === 'own' && p !== aura.sourcePlayer) return false;
  if (scope.location && location !== scope.location) return false;
  if (scope.types && (!card || !scope.types.includes(card.type))) return false;
  if (scope.faceUpOnly !== false && inst?.faceDown) return false;
  return true;
}

/** Sum of this-night aura power modifiers for one board unit. */
export function auraPowerBonus(state, p, inst, location, card) {
  let bonus = 0;
  for (const aura of state.effects ?? []) {
    if (!auraApplies(aura, state, p, inst, location, card)) continue;
    bonus += aura.modifiers?.power ?? 0;
    const facePower = aura.modifiers?.facePower;
    if (facePower && inst?.face) bonus += facePower[inst.face] ?? 0;
  }
  return bonus;
}

/** Active anomaly's location-wide power modifier (0 if none at this location). */
export function anomalyPowerBonus(state, location) {
  const anomaly = state.anomaly;
  if (!anomaly || anomaly.location !== location) return 0;
  return anomaly.power ?? 0;
}

/**
 * Seal immunity.  The Sleeper is immune by card text; Warding Rite grants it
 * to every own card in the chosen location (including the location card).
 * A seal-immunity anomaly blocks new seals for its whole location.
 * Existing seals are not cleared by immunity.
 */
export function isSealImmune(state, p, inst, location) {
  if (!inst) return false;
  if (isSealImmuneCard(inst.cardId)) return true;
  if (state.anomaly?.sealImmune && state.anomaly.location === location) return true;
  const card = state.cardIndex?.[inst.cardId];
  for (const aura of state.effects ?? []) {
    if (!aura.modifiers?.sealImmune) continue;
    if (!auraApplies(aura, state, p, inst, location, card)) continue;
    return true;
  }
  return false;
}

/** Thousand Eyes' public-count static power (§11.3). */
export function conditionalSelfPower(state, p, inst, location) {
  const spec = conditionalPowerSpecFor(inst?.cardId);
  if (!spec || inst.sealed || inst.faceDown) return 0;
  if (spec.kind === 'enemyFaceUpStealth') {
    const enemy = state.players[1 - p];
    let count = 0;
    for (const rowLocation of LOCATIONS) {
      for (const entry of enemy.board[rowLocation]) {
        if (!entry || entry.faceDown || entry.sealed) continue;
        if (isStealth(state.cardIndex?.[entry.cardId])) count += 1;
      }
    }
    return count * (spec.per ?? 1);
  }
  void location;
  return 0;
}

function chainCount(state, p, inst, location, slot) {
  const card = state.cardIndex?.[inst.cardId];
  const spec = chainSpecFor(inst.cardId);
  if (!spec || !hasChain(card)) return 0;
  if (inst.faceDown || inst.sealed) return 0;

  let count = 0;
  if (spec.scope === 'archiveOthers') {
    // Single line: every other friendly unit on the front counts.
    for (const entry of state.players[p].board.front) {
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

/** Equipment bonuses.  Silver Lantern's +2 comes from KEYWORD_SPECS. */
function equipmentBonus(state, inst) {
  const equipment = inst.equipment;
  if (!equipment || equipment.sealed) return 0;
  const card = state.cardIndex?.[equipment.cardId];
  const spec = equipmentSpecFor(equipment.cardId);
  return (equipment.powerBonus ?? 0) + (card?.powerBonus ?? 0) + (spec?.power ?? 0);
}

/** Player-wide "this night" auras; §7.2 cult sacrifice echo currently. */
function thisNightBonus(state, p, inst) {
  const player = state.players[p];
  let bonus = inst.thisNightPower ?? 0;
  if (player.faction === 'cult' && player.flags?.cultSacrificeTriggered) {
    // Balance patch v1.2 (§7.2): the first-sacrifice echo was +2 (altar +3).
    // Measured ablation put ~37pp of the Cult/Society gap on this single
    // passive, so it is reduced to +1 (altar +1). See docs/BALANCE_PATCH_V1.2.md.
    bonus += 1;
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
  power += auraPowerBonus(state, p, inst, location, card);
  power += anomalyPowerBonus(state, location);
  power += inst.chaosToken?.modifier ?? 0;
  power += conditionalSelfPower(state, p, inst, location);
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
  const locations = Object.fromEntries(LOCATIONS.map((location) => [location, 0]));
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
