/**
 * v2.1 pure rules helpers — no DOM, no hidden state, no abilities.
 *
 * Units are blank: their current power is simply the locked face's printed
 * power.  Face-down cards are worth 0 until revealed at night end.
 */

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
  if (card.keywords.includes(keyword)) return true;
  if (keyword === 'stealth') return card.keywords.includes('隐秘');
  return false;
}

export function isStealth(card) {
  return hasKeyword(card, 'stealth');
}

/** Printed power for the locked face.  Non-units have no power. */
export function printedPower(card, face) {
  if (!isUnitCard(card)) return 0;
  if (face === 'madness') return card.madnessPower ?? card.reasonPower ?? 0;
  return card.reasonPower ?? card.madnessPower ?? 0;
}

/** Current power of a board instance.  Face-down = 0. */
export function unitPower(inst, card) {
  if (!inst || inst.faceDown) return 0;
  return printedPower(card, inst.face);
}

/** Per-location and total board score for one player. */
export function scorePlayer(state, p, cardIndex) {
  const player = state.players[p];
  const locations = { scene: 0, archive: 0, dream: 0 };
  let total = 0;
  for (const location of LOCATIONS) {
    for (const inst of player.board[location]) {
      if (!inst) continue;
      const card = cardIndex[inst.cardId];
      const power = unitPower(inst, card);
      locations[location] += power;
      total += power;
    }
  }
  return { total, locations };
}

/** All board instances of one player, in stable location/slot order. */
export function boardInstances(state, p) {
  const out = [];
  for (const location of LOCATIONS) {
    const row = state.players[p].board[location];
    for (let slot = 0; slot < row.length; slot++) {
      if (row[slot]) out.push({ inst: row[slot], location, slot });
    }
  }
  return out;
}

/**
 * Card conservation: hand + deck + discard + board.
 * The v2.1 skeleton has no abyss / environment zone, so this is complete.
 */
export function countCards(state, p) {
  const player = state.players[p];
  let count = player.hand.length + player.deck.length + player.discard.length;
  for (const location of LOCATIONS) {
    for (const inst of player.board[location]) if (inst) count += 1;
  }
  return count;
}

/** Every uid currently owned by a player, used by tests for uniqueness checks. */
export function ownedUids(state, p) {
  const player = state.players[p];
  const uids = [
    ...player.hand.map((i) => i.uid),
    ...player.deck.map((i) => i.uid),
    ...player.discard.map((i) => i.uid),
  ];
  for (const location of LOCATIONS) {
    for (const inst of player.board[location]) if (inst) uids.push(inst.uid);
  }
  return uids;
}
