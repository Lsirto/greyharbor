/**
 * src/arena/draft.mjs — pure Arena Draft logic.
 *
 * Data-driven, no DOM, no per-card-id branches. A seeded draft exposes three
 * candidate cards each round; the player picks one until a legal 19-card
 * non-leader deck is assembled, then it is translated into createGame()
 * battleOptions and run by the unchanged human-vs-AI controller.
 *
 * Eligibility / copy rules mirror deck-validation DECK_RULES:
 *   - pool = the faction's non-leaders + neutral non-leaders
 *   - each card is capped at 2 copies; full cards leave the offer pool
 *   - exactly 19 non-leader cards; a leader never enters the drafted deck
 *
 * A fresh RNG is derived per round (seed + round index), so rendering a screen
 * never advances hidden draft RNG state: the same seed and the same prior picks
 * always produce the same three offers, regardless of how often getOffers() is
 * called.
 */

import { CARDS, CARD_LIST } from '../engine/v2/cards.js';
import { DECK_RULES, validateDeck } from '../engine/v2/deck-validation.js';

export const ARENA_RULES = Object.freeze({
  deckSize: DECK_RULES.nonLeaderCount, // 19 non-leader cards
  choicesPerRound: 3,
  maxCopies: DECK_RULES.maxCopies, // 2 copies per card
});

const FACTIONS = Object.freeze(['society', 'cult']);

/** Standalone mulberry32: returns a function producing floats in [0, 1). */
function mulberry32(seedUint) {
  let a = seedUint >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash, kept local so this module stays self-contained. */
function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic per-round RNG, independent of render timing. */
function roundRng(seed, round) {
  return mulberry32(hashString(`${seed}#arena-round-${round}`));
}

/** Eligible distinct card ids for a faction (faction + neutral, non-leader). */
export function draftPoolFor(faction) {
  return Object.freeze(
    CARD_LIST
      .filter((card) => card.type !== 'leader'
        && (card.faction === faction || card.faction === DECK_RULES.neutralFaction))
      .map((card) => card.id),
  );
}

/**
 * @param {{faction?: string, seed?: string}} options
 * @returns {{faction: string, seed: string, pool: readonly string[],
 *            picks: string[], offers: Array<readonly string[]|undefined>}}
 */
export function createDraft(options = {}) {
  const input = options && typeof options === 'object' ? options : {};
  if (!FACTIONS.includes(input.faction)) {
    throw new Error('arena draft needs a valid faction (society | cult)');
  }
  const seed = typeof input.seed === 'string' && input.seed.length
    ? input.seed
    : 'greyharbor-arena';
  return {
    faction: input.faction,
    seed,
    pool: draftPoolFor(input.faction),
    picks: [], // card ids in pick order
    offers: [], // memoized per-round offer tuples
  };
}

/** Current round index (0-based); equals the number of cards picked so far. */
export function roundIndex(draft) {
  return draft.picks.length;
}

export function isComplete(draft) {
  return draft.picks.length >= ARENA_RULES.deckSize;
}

/** Currently owned copies of a card id. */
export function copiesOf(draft, cardId) {
  return draft.picks.reduce((total, id) => (id === cardId ? total + 1 : total), 0);
}

/** Cards still allowed to be offered (below the copy cap). */
function availablePool(draft) {
  return draft.pool.filter((id) => copiesOf(draft, id) < ARENA_RULES.maxCopies);
}

/** Choose up to n distinct ids from source via rng (sampling without replacement). */
function sampleDistinct(rng, source, n) {
  const bag = source.slice();
  const out = [];
  while (out.length < n && bag.length) {
    const i = Math.floor(rng() * bag.length);
    out.push(bag.splice(i, 1)[0]);
  }
  return out;
}

/**
 * The three candidate card ids for the current round. Deterministic for a given
 * seed + prior picks, and memoized per round. Returns an empty list once the
 * draft is complete.
 */
export function getOffers(draft) {
  if (isComplete(draft)) return Object.freeze([]);
  const round = roundIndex(draft);
  if (!draft.offers[round]) {
    const eligible = availablePool(draft);
    const offers = sampleDistinct(
      roundRng(draft.seed, round),
      eligible,
      ARENA_RULES.choicesPerRound,
    );
    draft.offers[round] = Object.freeze(offers);
  }
  return draft.offers[round];
}

/** Pick one of the currently offered cards; advances the draft by one round. */
export function pickCard(draft, cardId) {
  if (isComplete(draft)) throw new Error('draft already complete');
  const offers = getOffers(draft);
  if (!offers.includes(cardId)) {
    throw new Error(`card ${cardId} is not among the current offers`);
  }
  if (copiesOf(draft, cardId) >= ARENA_RULES.maxCopies) {
    throw new Error(`card ${cardId} is already at the copy cap`);
  }
  draft.picks.push(cardId);
  return draft;
}

/** Build the createGame deck spec: faction + chosen leader + 19 drafted cards. */
export function buildDeckSpec(draft, leaderId) {
  const leader = CARDS[leaderId];
  if (!leader || leader.type !== 'leader' || leader.faction !== draft.faction) {
    throw new Error(`invalid arena leader ${leaderId} for faction ${draft.faction}`);
  }
  return {
    faction: draft.faction,
    leader: leaderId,
    cards: draft.picks.slice(),
  };
}

/**
 * Full createGame battleOptions: the human drafted deck (validated) against the
 * opposing faction's preset. The game-controller passes this straight to
 * createGame via its battleOptions path.
 */
export function buildArenaBattleOptions(draft, leaderId) {
  if (!isComplete(draft)) {
    throw new Error('cannot start an arena battle before the draft is complete');
  }
  const deckSpec = buildDeckSpec(draft, leaderId);
  const validation = validateDeck(deckSpec, CARDS);
  if (!validation.ok) {
    throw new Error(`arena deck failed validation: ${validation.errors[0]?.message ?? 'unknown'}`);
  }
  const opponentFaction = draft.faction === 'society' ? 'cult' : 'society';
  return {
    seed: `${draft.seed}#arena-battle`,
    names: ['你 · 竞技场', 'AI · 对手'],
    decks: [deckSpec, opponentFaction],
  };
}
