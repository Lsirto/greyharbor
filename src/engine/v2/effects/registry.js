/**
 * Greyharbor v2.2 — effect registry.
 *
 * Phase 2.2a implements exactly eight cards:
 *   leaders : harold-ashby, elias-thorne
 *   pilots  : nora-wells (stealth), samuel-pike (seal),
 *             sea-priestess (corruption), hooded-acolyte (sacrifice),
 *             edith-barrow (chain), walter-morse (backlash)
 *
 * The other 22 cards are registered as `null`: their card text is inert.
 * Keywords are *engine primitives* (see dsl/keyword specs below), so a card
 * that only carries a keyword still behaves correctly even when its text is
 * not implemented.  The `KEYWORD_SPECS` table supplies the per-card numbers
 * the keyword primitive needs (chain scope/cap, sacrifice replacement, ...).
 */

import {
  BOARD_CARD_TYPES,
  DURATION,
  SIDE,
  SLOT_TYPES,
  TRIGGER,
  ZONE,
  effect,
  selector,
} from './dsl.js';

const boardCardSelector = (overrides = {}) =>
  selector({
    side: SIDE.ENEMY,
    zones: [ZONE.BOARD, ZONE.ATTACHED, ZONE.LOCATION_SLOT, ZONE.ENVIRONMENT],
    types: BOARD_CARD_TYPES,
    face: 'up',
    count: 1,
    required: true,
    ...overrides,
  });

export const EFFECT_REGISTRY = Object.freeze({
  // ── leaders ─────────────────────────────────────────────────────────
  'harold-ashby': Object.freeze([
    Object.freeze(
      effect(TRIGGER.LEADER_ACTIVE, [
        { op: 'seal', targetKey: 'targetUid', duration: DURATION.UNTIL_NEXT_NIGHT },
        { op: 'sanity', who: 'self', delta: 1, reason: 'leaderHarold' },
      ], {
        id: 'harold-seal',
        targetKey: 'targetUid',
        target: boardCardSelector(),
      }),
    ),
  ]),
  'elias-thorne': Object.freeze([
    Object.freeze({
      id: 'elias-summon',
      trigger: TRIGGER.LEADER_ACTIVE,
      leader: {
        sacrifice: {
          side: SIDE.OWN,
          zones: [ZONE.BOARD],
          types: SLOT_TYPES,
          face: 'any',
          count: 1,
          required: true,
        },
        summon: {
          filter: 'aberration',
          faceUp: true,
          paySanityCost: false,
        },
        requirePlacement: true,
      },
      operations: [
        { op: 'sacrifice', targetKey: 'sacrificeUid', replacementKey: 'replaceWithUid' },
        { op: 'playFromDeck', cardKey: 'cardUid', placementKey: 'placement', faceUp: true, paySanityCost: false },
      ],
    }),
  ]),

  // ── pilot cards ─────────────────────────────────────────────────────
  'nora-wells': Object.freeze([
    Object.freeze(
      effect(TRIGGER.ON_REVEAL, [
        { op: 'peekHand', side: SIDE.ENEMY, random: 1, private: true },
      ], {
        id: 'nora-peek',
        condition: { kind: 'handNotEmpty', side: SIDE.ENEMY },
      }),
    ),
  ]),
  'samuel-pike': Object.freeze([
    Object.freeze({
      id: 'pike-choice',
      trigger: TRIGGER.ON_PLAY,
      choices: [
        {
          id: 'removeCorruption',
          label: 'Remove 1 corruption token',
          targetKey: 'targetUid',
          target: selector({
            side: SIDE.ANY,
            zones: [ZONE.BOARD],
            types: SLOT_TYPES,
            face: 'up',
            hasCorruption: true,
            count: 1,
            required: true,
          }),
          operations: [{ op: 'removeCorruption', targetKey: 'targetUid', amount: 1 }],
        },
        {
          id: 'seal',
          label: 'Seal an enemy unit with current power <= 4',
          targetKey: 'targetUid',
          target: selector({
            side: SIDE.ENEMY,
            zones: [ZONE.BOARD],
            types: SLOT_TYPES,
            face: 'up',
            maxCurrentPower: 4,
            count: 1,
            required: true,
          }),
          operations: [{ op: 'seal', targetKey: 'targetUid', duration: DURATION.UNTIL_NEXT_NIGHT }],
        },
      ],
      operations: [],
    }),
  ]),
  'sea-priestess': Object.freeze([
    Object.freeze({
      id: 'priestess-corruption',
      trigger: TRIGGER.ON_PLAY,
      // A modal shell lets the applier pick among tied highest-power targets.
      // With a single unique highest target it collapses to one legal choice;
      // with no legal target the whole effect fizzles.
      choices: [
        {
          id: 'corruptHighest',
          label: 'Corrupt the highest-power legal enemy unit',
          targetKey: 'targetUid',
          target: selector({
            side: SIDE.ENEMY,
            zones: [ZONE.BOARD],
            types: SLOT_TYPES,
            face: 'up',
            highestCurrentPower: true,
            canReceiveCorruption: true,
            count: 1,
            required: true,
          }),
          operations: [{ op: 'corrupt', targetKey: 'targetUid', amount: 1 }],
        },
      ],
      operations: [],
    }),
  ]),
  'hooded-acolyte': Object.freeze([
    Object.freeze({
      id: 'acolyte-replacement',
      trigger: TRIGGER.PASSIVE,
      kind: 'sacrificeReplacement',
    }),
  ]),
  'edith-barrow': Object.freeze([
    Object.freeze({
      id: 'edith-chain',
      trigger: TRIGGER.PASSIVE,
      kind: 'chain',
      chain: { scope: 'archiveOthers', cap: Infinity },
    }),
  ]),
  'walter-morse': Object.freeze([
    Object.freeze({
      id: 'walter-backlash',
      trigger: TRIGGER.PASSIVE,
      kind: 'backlash',
    }),
  ]),

  // ── registered-but-inert (phase 2.2b) ───────────────────────────────
  'lucia-vaughn': null,
  'frank-holt': null,
  'arthur-pendleton': null,
  abjuration: null,
  'warding-rite': null,
  'silver-lantern': null,
  'old-library': null,
  zealot: null,
  gravedigger: null,
  whisperer: null,
  'deep-one': null,
  'bell-claw': null,
  seance: null,
  'tide-ritual': null,
  'lunar-eclipse': null,
  'drowned-altar': null,
  'finn-calloway': null,
  'silas-gold': null,
  'the-sleeper': null,
  'thousand-eyes': null,
  'stormy-night': null,
  'unexpected-aid': null,
});

/**
 * Per-card numbers for the shared keyword primitives.
 * `chain` is the only keyword whose parameters are genuinely card-specific.
 * Backlash/stealth/seal/corruption/sacrifice are read from card data.
 */
export const KEYWORD_SPECS = Object.freeze({
  chain: Object.freeze({
    'edith-barrow': Object.freeze({ scope: 'archiveOthers', cap: Infinity }),
    'frank-holt': Object.freeze({ scope: 'adjacent', cap: 3 }),
    'finn-calloway': Object.freeze({ scope: 'adjacent', cap: 2 }),
  }),
  sacrificeReplacement: Object.freeze({
    'hooded-acolyte': true,
  }),
  /** Cards that cannot receive seal effects at all (currently none in v1). */
  sealImmune: Object.freeze({}),
});

export function effectsFor(cardId) {
  return EFFECT_REGISTRY[cardId] ?? null;
}

export function isRegistered(cardId) {
  return Array.isArray(EFFECT_REGISTRY[cardId]) && EFFECT_REGISTRY[cardId].length > 0;
}

export function chainSpecFor(cardId) {
  return KEYWORD_SPECS.chain[cardId] ?? null;
}

export function hasSacrificeReplacement(cardId) {
  return !!KEYWORD_SPECS.sacrificeReplacement[cardId];
}

/** v1 §8.2 aberration definition. */
export function isAberrationCard(card) {
  if (!card) return false;
  return (
    (card.faction === 'cult' && card.type === 'unit')
    || (card.faction === 'neutral' && card.type === 'oldgod')
  );
}
