/**
 * Greyharbor v2.2 — effect registry.
 *
 * Phase 2.2a implemented the eight "pilot" cards.  Phase 2.2b closes the
 * remaining twenty-two cards so that all thirty ids are covered:
 *
 *   leaders : harold-ashby, elias-thorne
 *   society : nora-wells, samuel-pike, edith-barrow, walter-morse,
 *             lucia-vaughn, frank-holt, arthur-pendleton, abjuration,
 *             warding-rite, silver-lantern, old-library
 *   cult    : hooded-acolyte, zealot, sea-priestess, gravedigger, whisperer,
 *             deep-one, bell-claw, seance, tide-ritual, lunar-eclipse,
 *             drowned-altar
 *   neutral : finn-calloway, silas-gold, the-sleeper, thousand-eyes,
 *             stormy-night, unexpected-aid
 *
 * Design rules
 * ------------
 * Card text is plain data.  The interpreter only knows the generic operations
 * below; every number/filter lives here.  Purely engine-level rules (chain,
 * stealth admission, sacrifice replacement, altar echo, Old Library's passive)
 * stay in scoring.js / engine.js because they are keyword or location rules,
 * not card text.  Cards whose behaviour is completely covered by such engine
 * primitives are registered as an explicit `null` **only** when the task
 * allows it (lucia-vaughn / frank-holt / finn-calloway); every such entry is
 * annotated with the reason and is whitelisted by tests/v2/coverage.test.mjs.
 *
 * Generic operations used by more than one card:
 *   addAura        — persistent "this night" scope/modifier record (Warding
 *                    Rite, Tide Ritual, Lunar Eclipse, Stormy Night)
 *   destroy        — generic destroy primitive (Silver Lantern replacement)
 *   removeFromPlay — move any on-board/environment card to the discard pile
 *   removeSeal     — clear a seal (Unexpected Aid)
 *   sealLeader     — seal a leader for one night (Thousand Eyes exception)
 *   moveAbyssToHand / moveDeckToHand / revealDeckTop / shuffleDeck
 *
 * Multi-target choices: a `Choice` may declare `secondary` (subset selection
 * from another selector) and `replacements` (Hooded Acolyte-style sacrifice
 * replacement).  Enumerated entries therefore carry
 * `{ mode, targetUid, secondaryUids, replaceWithUid }`.
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
    sealable: true,
    count: 1,
    required: true,
    ...overrides,
  });

const ownSacrificeSelector = (overrides = {}) =>
  selector({
    side: SIDE.OWN,
    zones: [ZONE.BOARD],
    types: SLOT_TYPES,
    face: 'any',
    count: 1,
    required: true,
    ...overrides,
  });

const abyssUnitSelector = (overrides = {}) =>
  selector({
    side: SIDE.OWN,
    zones: [ZONE.ABYSS],
    types: SLOT_TYPES,
    count: 1,
    required: false,
    ...overrides,
  });

// Every face-up unit occupying a normal slot on one side (group buffs).
const boardUnitsSelector = (side, overrides = {}) =>
  selector({
    side,
    zones: [ZONE.BOARD],
    types: SLOT_TYPES,
    face: 'up',
    count: 'all',
    required: false,
    ...overrides,
  });

const ownBoardUnitsSelector = (overrides = {}) => boardUnitsSelector(SIDE.OWN, overrides);
const enemyBoardUnitsSelector = (overrides = {}) => boardUnitsSelector(SIDE.ENEMY, overrides);

// A single enemy face-up unit that can still receive corruption (Gregor).
const corruptibleEnemySelector = (overrides = {}) =>
  selector({
    side: SIDE.ENEMY,
    zones: [ZONE.BOARD],
    types: SLOT_TYPES,
    face: 'up',
    canReceiveCorruption: true,
    count: 1,
    required: true,
    ...overrides,
  });

export const EFFECT_REGISTRY = Object.freeze({
  // ── leaders / characters ────────────────────────────────────────────
  // Each character bundles a LEADER_ACTIVE skill and, except Elias whose
  // passive is the first-sacrifice echo (engine-gated), one or more
  // NIGHT_START effects. Numbers are plain data; no engine branch per id.
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
    Object.freeze(
      effect(TRIGGER.NIGHT_START, [
        { op: 'sanity', who: 'self', delta: 1, reason: 'societyPassive' },
      ], {
        id: 'harold-night',
        condition: { kind: 'sanityAtMost', side: SIDE.OWN, value: 5 },
      }),
    ),
  ]),
  'enid-halloway': Object.freeze([
    Object.freeze({
      id: 'enid-summon',
      trigger: TRIGGER.LEADER_ACTIVE,
      leader: {
        // No sacrifice: the cost is 1 sanity, the pool is any unit.
        sacrifice: null,
        summon: {
          filter: 'unit',
          faceUp: true,
          paySanityCost: false,
          sanityCost: 1,
        },
        requirePlacement: true,
      },
      operations: [
        { op: 'sanity', who: 'self', delta: -1, reason: 'leaderEnid' },
        { op: 'playFromDeck', cardKey: 'cardUid', placementKey: 'placement', faceUp: true, paySanityCost: false },
      ],
    }),
    Object.freeze(
      effect(TRIGGER.NIGHT_START, [
        { op: 'draw', count: 1 },
      ], { id: 'enid-night' }),
    ),
  ]),
  'augustus-wayne': Object.freeze([
    Object.freeze(
      effect(TRIGGER.LEADER_ACTIVE, [
        { op: 'seal', targetKey: 'targetUid', duration: DURATION.UNTIL_NEXT_NIGHT },
        // The +2 lands automatically on the strongest friendly face-up unit.
        { op: 'buffThisNight', selector: ownBoardUnitsSelector({ highestCurrentPower: true }), amount: 2 },
      ], {
        id: 'augustus-strike',
        targetKey: 'targetUid',
        target: boardCardSelector(),
      }),
    ),
    Object.freeze(
      effect(TRIGGER.NIGHT_START, [
        { op: 'buffThisNight', selector: ownBoardUnitsSelector(), amount: 1 },
      ], { id: 'augustus-night' }),
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
  'vera-crowe': Object.freeze([
    Object.freeze({
      id: 'vera-summon',
      trigger: TRIGGER.LEADER_ACTIVE,
      leader: {
        // No sacrifice and no sanity cost: the summoned aberration is corrupted.
        sacrifice: null,
        summon: {
          filter: 'aberration',
          faceUp: true,
          paySanityCost: false,
          attachCorruption: 1,
        },
        requirePlacement: true,
      },
      operations: [
        { op: 'playFromDeck', cardKey: 'cardUid', placementKey: 'placement', faceUp: true, paySanityCost: false },
      ],
    }),
    Object.freeze(
      effect(TRIGGER.NIGHT_START, [
        { op: 'draw', count: 1 },
      ], {
        id: 'vera-night',
        condition: { kind: 'sanityAtMost', side: SIDE.OWN, value: 3 },
      }),
    ),
  ]),
  'gregor-pestilence': Object.freeze([
    Object.freeze(
      effect(TRIGGER.LEADER_ACTIVE, [
        { op: 'corrupt', targetKey: 'targetUid', amount: 2 },
      ], {
        id: 'gregor-corrupt',
        targetKey: 'targetUid',
        target: corruptibleEnemySelector(),
      }),
    ),
    Object.freeze(
      effect(TRIGGER.NIGHT_START, [
        { op: 'buffThisNight', selector: enemyBoardUnitsSelector(), amount: -1 },
      ], { id: 'gregor-night' }),
    ),
  ]),

  // ── society ─────────────────────────────────────────────────────────
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
          label: '移除 1 个腐化标记',
          labelWithTarget: true,
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
          label: '封印一个当前战力不超过 4 的敌方单位',
          labelWithTarget: true,
          targetKey: 'targetUid',
          target: selector({
            side: SIDE.ENEMY,
            zones: [ZONE.BOARD],
            types: SLOT_TYPES,
            face: 'up',
            maxCurrentPower: 4,
            sealable: true,
            count: 1,
            required: true,
          }),
          operations: [{ op: 'seal', targetKey: 'targetUid', duration: DURATION.UNTIL_NEXT_NIGHT }],
        },
      ],
      operations: [],
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
  // Lucia discovers on reveal (her dream stealth entry is face-down).
  'lucia-vaughn': Object.freeze([
    Object.freeze({
      id: 'lucia-discover',
      trigger: TRIGGER.ON_REVEAL,
      choices: [
        {
          id: 'discover',
          label: '发掘：牌堆顶 3 选 1 入手',
          labelWithTarget: true,
          targetKey: 'targetUid',
          target: selector({
            side: SIDE.OWN,
            zones: [ZONE.DECK],
            topN: 3,
            count: 1,
            required: false,
          }),
          operations: [{ op: 'discover' }],
        },
      ],
      operations: [],
    }),
  ]),
  'frank-holt': null,
  'arthur-pendleton': Object.freeze([
    Object.freeze(
      effect(TRIGGER.ON_REVEAL, [
        // §9.10: Arthur's shown card is public, unlike Nora's private peek.
        { op: 'peekHand', side: SIDE.ENEMY, random: 1, private: false },
      ], {
        id: 'arthur-show',
        condition: { kind: 'handNotEmpty', side: SIDE.ENEMY },
      }),
    ),
  ]),
  abjuration: Object.freeze([
    Object.freeze({
      id: 'abjuration-choice',
      trigger: TRIGGER.ON_PLAY,
      choices: [
        {
          id: 'removeCorruption',
          label: '移除 1 个腐化标记（任意一方）',
          labelWithTarget: true,
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
          id: 'removeEnvironment',
          label: '移除 1 张环境卡，送入弃牌堆',
          labelWithTarget: true,
          targetKey: 'targetUid',
          target: selector({
            side: SIDE.ANY,
            zones: [ZONE.ENVIRONMENT],
            types: ['environment'],
            count: 1,
            required: true,
          }),
          operations: [{ op: 'removeFromPlay', targetKey: 'targetUid', reason: 'abjuration' }],
        },
      ],
      operations: [],
    }),
  ]),
  'warding-rite': Object.freeze([
    Object.freeze({
      id: 'warding-rite',
      trigger: TRIGGER.ON_PLAY,
      choices: [
        {
          id: 'ward',
          label: '守护己方对峙线一夜',
          targetKey: 'locationUid',
          target: selector({
            side: SIDE.OWN,
            zones: [ZONE.LOCATION_ROW],
            location: 'front',
            count: 1,
            required: true,
          }),
          operations: [{
            op: 'addAura',
            targetKey: 'locationUid',
            duration: DURATION.THIS_NIGHT,
            scope: { side: 'own', locationFromTarget: true, types: null, faceUpOnly: false },
            modifiers: { power: 1, sealImmune: true, corruptionImmune: true },
          }],
        },
      ],
      operations: [],
    }),
  ]),
  /**
   * Silver Lantern is pure passive equipment text.  The +2 and the
   * destroy/seal replacement are read from KEYWORD_SPECS.equipment by
   * scoring.js and engine.js, so the registry entry documents the card and
   * keeps coverage explicit.
   */
  'silver-lantern': Object.freeze([
    Object.freeze({
      id: 'silver-lantern-passive',
      trigger: TRIGGER.PASSIVE,
      kind: 'equipment',
      equipment: { power: 2, replaceOnSeal: true, replaceOnDestroy: true },
    }),
  ]),
  /**
   * Old Library's two clauses are engine rules: archive corruption immunity
   * (scoring.isCorruptionImmune) and the once-per-night archive discount
   * (engine._archiveDiscount).  Both check the location card exists and is
   * not sealed, so the registry entry is a passive descriptor.
   */
  'old-library': Object.freeze([
    Object.freeze({
      id: 'old-library-passive',
      trigger: TRIGGER.PASSIVE,
      kind: 'location',
      location: { corruptionImmune: 'front', firstUnitDiscount: 1 },
    }),
  ]),

  // ── cult ────────────────────────────────────────────────────────────
  'hooded-acolyte': Object.freeze([
    Object.freeze({
      id: 'acolyte-replacement',
      trigger: TRIGGER.PASSIVE,
      kind: 'sacrificeReplacement',
    }),
  ]),
  /**
   * Zealot's only text is "madness +3, then lose 1 sanity".  The backlash is
   * the shared keyword primitive; the +3 lives in KEYWORD_SPECS.
   */
  zealot: Object.freeze([
    Object.freeze({
      id: 'zealot-madness',
      trigger: TRIGGER.PASSIVE,
      kind: 'madnessPowerBonus',
      amount: 3,
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
          label: '腐化战力最高的合法敌方单位',
          labelWithTarget: true,
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
  gravedigger: Object.freeze([
    Object.freeze({
      id: 'gravedigger',
      trigger: TRIGGER.ON_PLAY,
      // §11.2: if a sacrifice is possible it is mandatory; otherwise the
      // card simply enters without retrieving anything.
      condition: { kind: 'hasSacrificeTarget', side: SIDE.OWN },
      choices: [
        {
          id: 'grave',
          label: '献祭一个己方单位，再从深渊取回 1 个单位',
          labelWithTarget: true,
          targetKey: 'sacrificeUid',
          target: ownSacrificeSelector({ excludeSelf: true }),
          secondary: {
            key: 'abyssUid',
            selector: abyssUnitSelector({ count: 1 }),
            max: 1,
          },
          replacements: { key: 'replaceWithUid' },
          operations: [
            { op: 'sacrifice', targetKey: 'sacrificeUid', replacementKey: 'replaceWithUid' },
            { op: 'moveAbyssToHand', secondaryKey: 'abyssUid' },
          ],
        },
      ],
      operations: [],
    }),
  ]),
  whisperer: Object.freeze([
    Object.freeze(
      effect(TRIGGER.ON_REVEAL, [
        { op: 'sanity', who: 'opponent', delta: -1, reason: 'whisperer' },
      ], { id: 'whisperer-drain' }),
    ),
  ]),
  /**
   * Deep One: madness +3 (spec) plus the shared backlash keyword and the
   * printed sanity cost 1 from card data.
   */
  'deep-one': Object.freeze([
    Object.freeze({
      id: 'deep-one-madness',
      trigger: TRIGGER.PASSIVE,
      kind: 'madnessPowerBonus',
      amount: 3,
    }),
  ]),
  'bell-claw': Object.freeze([
    Object.freeze({
      id: 'bell-claw-devour',
      trigger: TRIGGER.ON_PLAY,
      choices: [
        {
          id: 'devour',
          label: '吞噬相邻的一个己方单位',
          labelWithTarget: true,
          targetKey: 'targetUid',
          target: ownSacrificeSelector({
            adjacentToSource: true,
            excludeSelf: true,
            face: 'any',
          }),
          operations: [{ op: 'devour', targetKey: 'targetUid' }],
        },
        {
          // Optional ("可选"): declining is always legal while an adjacent
          // unit exists.  When none exists the whole modal collapses to
          // [null] and the card enters normally without a choice.
          id: 'decline',
          label: '不吞噬，直接入场',
          skip: true,
          operations: [],
        },
      ],
      operations: [],
    }),
  ]),
  seance: Object.freeze([
    Object.freeze({
      id: 'seance',
      trigger: TRIGGER.ON_PLAY,
      // §11.2: cannot be played at all without a sacrifice target.
      playCondition: { kind: 'hasSacrificeTarget', side: SIDE.OWN },
      choices: [
        {
          id: 'seance',
          label: '献祭一个己方单位，再从深渊取回至多 2 个单位',
          labelWithTarget: true,
          targetKey: 'sacrificeUid',
          target: ownSacrificeSelector(),
          secondary: {
            key: 'abyssUids',
            selector: abyssUnitSelector({ count: 2 }),
            max: 2,
          },
          replacements: { key: 'replaceWithUid' },
          operations: [
            { op: 'sacrifice', targetKey: 'sacrificeUid', replacementKey: 'replaceWithUid' },
            { op: 'moveAbyssToHand', secondaryKey: 'abyssUids', max: 2 },
          ],
        },
      ],
      operations: [],
    }),
  ]),
  'tide-ritual': Object.freeze([
    Object.freeze(
      effect(TRIGGER.ON_PLAY, [
        {
          op: 'addAura',
          duration: DURATION.THIS_NIGHT,
          // Tide Ritual buffs the own front line (the single stronghold row).
          selector: selector({ side: SIDE.OWN, zones: [ZONE.LOCATION_ROW], location: 'front', count: 1, required: true }),
          scope: { side: 'own', location: 'front', types: SLOT_TYPES, faceUpOnly: true },
          modifiers: { power: 3 },
        },
      ], { id: 'tide-ritual' }),
    ),
  ]),
  'lunar-eclipse': Object.freeze([
    Object.freeze(
      effect(TRIGGER.ON_PLAY, [
        {
          op: 'addAura',
          duration: DURATION.THIS_NIGHT,
          requiresSourceActive: true,
          // The enemy keeps the full face-scoped penalty: reason -1, madness +1.
          selector: selector({ side: SIDE.ENEMY, zones: [ZONE.LOCATION_ROW], location: 'front', count: 1, required: true }),
          scope: { side: 'enemy', location: 'front', types: SLOT_TYPES, faceUpOnly: true },
          modifiers: { facePower: { reason: -1, madness: 1 } },
        },
        {
          op: 'addAura',
          duration: DURATION.THIS_NIGHT,
          requiresSourceActive: true,
          // Own cult units only gain the madness bonus, no reason penalty.
          selector: selector({ side: SIDE.OWN, zones: [ZONE.LOCATION_ROW], location: 'front', count: 1, required: true }),
          scope: { side: 'own', location: 'front', types: SLOT_TYPES, faceUpOnly: true },
          modifiers: { facePower: { reason: 0, madness: 1 } },
        },
      ], { id: 'lunar-eclipse' }),
    ),
  ]),
  /**
   * Drowned Bell Altar is location text read by scoring.hasUnsealedAltar():
   * +3 cult echo and no scene sacrifice backlash.  The registry entry makes
   * that coverage explicit without duplicating the rule in card code.
   */
  'drowned-altar': Object.freeze([
    Object.freeze({
      id: 'drowned-altar-passive',
      trigger: TRIGGER.PASSIVE,
      kind: 'location',
      location: { sacrificeBacklashImmune: true, cultEchoBonus: 3 },
    }),
  ]),

  // ── neutral ─────────────────────────────────────────────────────────
  /** Finn keeps his chain keyword (engine rule) and now discovers on play. */
  'finn-calloway': Object.freeze([
    Object.freeze({
      id: 'finn-discover',
      trigger: TRIGGER.ON_PLAY,
      choices: [
        {
          id: 'discover',
          label: '发掘：牌堆顶 3 选 1 入手',
          labelWithTarget: true,
          targetKey: 'targetUid',
          target: selector({
            side: SIDE.OWN,
            zones: [ZONE.DECK],
            topN: 3,
            count: 1,
            required: false,
          }),
          operations: [{ op: 'discover' }],
        },
      ],
      operations: [],
    }),
  ]),
  'silas-gold': Object.freeze([
    Object.freeze({
      id: 'silas-gold',
      trigger: TRIGGER.ON_REVEAL,
      choices: [
        {
          id: 'discardAndPick',
          label: '弃掉 1 张手牌，再从牌堆顶 3 张中拿取 1 张',
          labelWithTarget: true,
          condition: {
            kind: 'all',
            conditions: [
              { kind: 'handNotEmpty', side: SIDE.OWN },
              { kind: 'deckNotEmpty', side: SIDE.OWN },
            ],
          },
          targetKey: 'discardUid',
          target: selector({
            side: SIDE.OWN,
            zones: [ZONE.HAND],
            types: BOARD_CARD_TYPES,
            count: 1,
            required: true,
          }),
          secondary: {
            key: 'takeUid',
            selector: selector({
              side: SIDE.OWN,
              zones: [ZONE.DECK],
              types: BOARD_CARD_TYPES,
              topN: 3,
              count: 1,
              required: true,
            }),
            max: 1,
          },
          operations: [
            { op: 'discard', targetKey: 'discardUid' },
            { op: 'revealDeckTop', count: 3 },
            { op: 'moveDeckToHand', secondaryKey: 'takeUid', max: 1 },
            { op: 'shuffleDeck' },
          ],
        },
        {
          id: 'discardOnly',
          label: '弃掉 1 张手牌（牌堆已空）',
          labelWithTarget: true,
          condition: {
            kind: 'all',
            conditions: [
              { kind: 'handNotEmpty', side: SIDE.OWN },
              { kind: 'deckEmpty', side: SIDE.OWN },
            ],
          },
          targetKey: 'discardUid',
          target: selector({
            side: SIDE.OWN,
            zones: [ZONE.HAND],
            types: BOARD_CARD_TYPES,
            count: 1,
            required: true,
          }),
          operations: [{ op: 'discard', targetKey: 'discardUid' }],
        },
        {
          id: 'pickOnly',
          label: '从牌堆顶 3 张中拿取 1 张（手牌已空）',
          labelWithTarget: true,
          condition: {
            kind: 'all',
            conditions: [
              { kind: 'handEmpty', side: SIDE.OWN },
              { kind: 'deckNotEmpty', side: SIDE.OWN },
            ],
          },
          secondary: {
            key: 'takeUid',
            selector: selector({
              side: SIDE.OWN,
              zones: [ZONE.DECK],
              types: BOARD_CARD_TYPES,
              topN: 3,
              count: 1,
              required: true,
            }),
            max: 1,
          },
          operations: [
            { op: 'revealDeckTop', count: 3 },
            { op: 'moveDeckToHand', cardKey: 'takeUid' },
            { op: 'shuffleDeck' },
          ],
        },
      ],
      operations: [],
    }),
  ]),
  /**
   * The Sleeper: cannot be sealed (spec) and loses 1 sanity at every night
   * start.  Entry -2 and madness backlash are engine/keyword primitives.
   */
  /**
   * The Sleeper: cannot be sealed (spec).  Units are cleared at every night
   * end, so a cross-night "per night" drain could never fire; the sanity cost is
   * fully front-loaded into the printed sanityCost (3).  Seal immunity lives in
   * KEYWORD_SPECS.sealImmune, so the whole card is covered by engine primitives
   * and is registered null (whitelisted in coverage.test.mjs).
   */
  'the-sleeper': null,
  'thousand-eyes': Object.freeze([
    Object.freeze(
      effect(TRIGGER.ON_PLAY, [
        { op: 'sealLeader', targetKey: 'leaderUid', duration: DURATION.UNTIL_NEXT_NIGHT },
      ], {
        id: 'thousand-eyes-seal',
        targetKey: 'leaderUid',
        // §5.8 / §11.3: the explicit leader-sealing exception.
        target: selector({
          side: SIDE.ENEMY,
          zones: [ZONE.LEADER],
          count: 1,
          required: false,
        }),
      }),
    ),
    Object.freeze({
      id: 'thousand-eyes-static',
      trigger: TRIGGER.PASSIVE,
      kind: 'conditionalPower',
    }),
  ]),
  'stormy-night': Object.freeze([
    Object.freeze(
      effect(TRIGGER.ON_PLAY, [
        {
          op: 'addAura',
          duration: DURATION.THIS_NIGHT,
          requiresSourceActive: true,
          // The enemy bears the full storm: -2.
          selector: selector({ side: SIDE.ENEMY, zones: [ZONE.LOCATION_ROW], location: 'front', count: 1, required: true }),
          scope: { side: 'enemy', location: 'front', types: SLOT_TYPES, faceUpOnly: true },
          modifiers: { power: -2 },
        },
        {
          op: 'addAura',
          duration: DURATION.THIS_NIGHT,
          requiresSourceActive: true,
          // Own units weather the storm better: -1.
          selector: selector({ side: SIDE.OWN, zones: [ZONE.LOCATION_ROW], location: 'front', count: 1, required: true }),
          scope: { side: 'own', location: 'front', types: SLOT_TYPES, faceUpOnly: true },
          modifiers: { power: -1 },
        },
      ], { id: 'stormy-night' }),
    ),
  ]),
  'unexpected-aid': Object.freeze([
    Object.freeze({
      id: 'unexpected-aid',
      trigger: TRIGGER.ON_PLAY,
      choices: [
        {
          id: 'aid',
          label: '指定一个己方正面单位：+3，移除其全部封印与腐化',
          labelWithTarget: true,
          targetKey: 'targetUid',
          target: selector({
            side: SIDE.OWN,
            zones: [ZONE.BOARD],
            types: SLOT_TYPES,
            face: 'up',
            count: 1,
            required: true,
          }),
          operations: [
            { op: 'buffPermanent', targetKey: 'targetUid', amount: 3 },
            { op: 'removeSeal', targetKey: 'targetUid' },
            { op: 'removeCorruption', targetKey: 'targetUid', amount: 'all' },
          ],
        },
      ],
      operations: [],
    }),
  ]),
});

/** Cards whose entire text is a keyword rule already implemented below. */
export const KEYWORD_ONLY_CARDS = Object.freeze({
  'frank-holt': 'chain: adjacent own cards, cap +3 (scoring.chainCount via KEYWORD_SPECS)',
  'the-sleeper': 'seal immunity (KEYWORD_SPECS.sealImmune) + front-loaded sanityCost; cross-night drain removed with nightly cleanup',
});

/**
 * Per-card numbers for the shared keyword / passive primitives.
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
  /** Cards that cannot receive seal effects at all (§11.3). */
  sealImmune: Object.freeze({
    'the-sleeper': true,
  }),
  /** Printed-power bonus that only applies on the madness face. */
  madnessPowerBonus: Object.freeze({
    zealot: 3,
    'deep-one': 3,
  }),
  /** Equipment numbers, read by scoring.equipmentBonus / engine seal+destroy. */
  equipment: Object.freeze({
    'silver-lantern': Object.freeze({
      power: 2,
      replaceOnSeal: true,
      replaceOnDestroy: true,
    }),
  }),
  /**
   * Self power that depends on public board state.  Thousand Eyes gains +1
   * for every face-up, unsealed stealth card its controller's opponent owns.
   */
  conditionalPower: Object.freeze({
    'thousand-eyes': Object.freeze({ kind: 'enemyFaceUpStealth', per: 1 }),
  }),
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

export function madnessPowerBonusFor(cardId) {
  return KEYWORD_SPECS.madnessPowerBonus[cardId] ?? 0;
}

export function equipmentSpecFor(cardId) {
  return KEYWORD_SPECS.equipment[cardId] ?? null;
}

export function isSealImmuneCard(cardId) {
  return !!KEYWORD_SPECS.sealImmune[cardId];
}

export function conditionalPowerSpecFor(cardId) {
  return KEYWORD_SPECS.conditionalPower[cardId] ?? null;
}

/** v1 §8.2 aberration definition. */
export function isAberrationCard(card) {
  if (!card) return false;
  return (
    (card.faction === 'cult' && card.type === 'unit')
    || (card.faction === 'neutral' && card.type === 'oldgod')
  );
}
