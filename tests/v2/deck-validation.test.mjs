/**
 * Phase 2.4 — deck-validation.js acceptance tests.
 *
 * 事实源：docs/GREYHARBOR_RULES_V1.md §2.1 / §2.2 / §10。
 * 覆盖：两套官方预设、全部错误码、多错并存、两种输入形式、纯函数与边界。
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CARDS,
  PRESET_DECKS,
  DEFAULT_DECK_ORDER,
} from '../../src/engine/v2/cards.js';
import {
  validateDeck,
  DECK_ERROR_CODES,
  DECK_ERROR_CODE_LIST,
  DECK_RULES,
} from '../../src/engine/v2/deck-validation.js';

const C = DECK_ERROR_CODES;

function toEntries(ids) {
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, count]) => [id, count]);
}

function baseEntries(faction = 'society') {
  return toEntries([...PRESET_DECKS[faction].cards]);
}

function makeInput({ faction = 'society', leader = 'harold-ashby', entries = baseEntries() } = {}) {
  return { faction, leader, entries };
}

const codesOf = (result) => result.errors.map((error) => error.code);

const EXPECTED_COPIES = {
  society: {
    'nora-wells': 2,
    'samuel-pike': 2,
    'edith-barrow': 1,
    'walter-morse': 1,
    'lucia-vaughn': 1,
    'frank-holt': 1,
    'arthur-pendleton': 1,
    abjuration: 1,
    'warding-rite': 1,
    'silver-lantern': 1,
    'old-library': 1,
    'finn-calloway': 1,
    'silas-gold': 2,
    'thousand-eyes': 1,
    'unexpected-aid': 1,
    'stormy-night': 1,
  },
  cult: {
    'hooded-acolyte': 2,
    zealot: 2,
    'sea-priestess': 1,
    gravedigger: 1,
    whisperer: 1,
    'deep-one': 1,
    'bell-claw': 1,
    seance: 1,
    'tide-ritual': 1,
    'lunar-eclipse': 1,
    'drowned-altar': 1,
    'finn-calloway': 1,
    'silas-gold': 1,
    'the-sleeper': 1,
    'thousand-eyes': 1,
    'stormy-night': 1,
    'unexpected-aid': 1,
  },
};

// ── error code constants ──────────────────────────────────────────────────

test('error code constants are semantic, frozen and complete', () => {
  assert.deepEqual(DECK_ERROR_CODE_LIST, [
    C.MALFORMED_INPUT,
    C.UNKNOWN_CARD,
    C.FACTION_MISMATCH,
    C.LEADER_INVALID,
    C.LEADER_IN_ENTRIES,
    C.NON_LEADER_COUNT,
    C.COPY_LIMIT,
    C.TOTAL_COUNT,
  ]);
  for (const [key, value] of Object.entries(C)) {
    assert.equal(key, value, `constant name should equal its code: ${key}`);
  }
  assert.ok(Object.isFrozen(C));
  assert.deepEqual(
    { total: DECK_RULES.total, nonLeader: DECK_RULES.nonLeaderCount, maxCopies: DECK_RULES.maxCopies },
    { total: 20, nonLeader: 19, maxCopies: 2 },
  );
});

// ── official presets (§10) ────────────────────────────────────────────────

for (const key of DEFAULT_DECK_ORDER) {
  test(`official preset ${key}: ok with §10 summary numbers`, () => {
    const deck = PRESET_DECKS[key];
    const result = validateDeck(
      { faction: deck.faction, leader: deck.leader, entries: toEntries([...deck.cards]) },
      CARDS,
    );
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.deepEqual(result.errors, []);
    assert.equal(result.summary.faction, key);
    assert.equal(result.summary.leader, deck.leader);
    assert.equal(result.summary.leaderCount, 1);
    assert.equal(result.summary.nonLeaderCount, 19);
    assert.equal(result.summary.total, 20);
    assert.equal(result.summary.distinctNonLeaders, Object.keys(EXPECTED_COPIES[key]).length);
    assert.deepEqual(result.summary.copies, EXPECTED_COPIES[key]);
    assert.equal(
      Object.values(result.summary.copies).reduce((sum, count) => sum + count, 0),
      19,
    );
    assert.ok(Object.values(result.summary.copies).every((count) => count >= 1 && count <= 2));
  });
}

// ── one legal deck per error code ─────────────────────────────────────────

test('MALFORMED_INPUT: null input is an error, not an exception', () => {
  const result = validateDeck(null, CARDS);
  assert.equal(result.ok, false);
  assert.ok(codesOf(result).includes(C.MALFORMED_INPUT));
});

test('MALFORMED_INPUT: wrong entry shape is reported', () => {
  const result = validateDeck(
    makeInput({ entries: [['nora-wells'], ['samuel-pike', 2]] }),
    CARDS,
  );
  assert.equal(result.ok, false);
  assert.ok(codesOf(result).includes(C.MALFORMED_INPUT));
});

test('UNKNOWN_CARD: unindexed id is reported with cardId', () => {
  const entries = baseEntries();
  entries[0] = ['ghost-card', entries[0][1]];
  const result = validateDeck(makeInput({ entries }), CARDS);
  assert.equal(result.ok, false);
  const error = result.errors.find((entry) => entry.code === C.UNKNOWN_CARD);
  assert.ok(error);
  assert.equal(error.cardId, 'ghost-card');
});

test('FACTION_MISMATCH: enemy-faction card in a society deck', () => {
  const entries = baseEntries();
  entries[2] = ['zealot', 1]; // cult card, previously edith-barrow x1
  const result = validateDeck(makeInput({ entries }), CARDS);
  assert.equal(result.ok, false);
  const error = result.errors.find((entry) => entry.code === C.FACTION_MISMATCH);
  assert.ok(error);
  assert.equal(error.cardId, 'zealot');
});

test('LEADER_INVALID: missing / non-leader / wrong-faction leader', () => {
  const cases = [
    { faction: 'society', entries: baseEntries() }, // missing leader field
    { faction: 'society', leader: null, entries: baseEntries() },
    makeInput({ leader: 'nora-wells' }), // not a leader card
    makeInput({ leader: 'elias-thorne' }), // wrong faction
  ];
  cases.forEach((input, index) => {
    const result = validateDeck(input, CARDS);
    assert.equal(result.ok, false, `case=${index}`);
    assert.ok(codesOf(result).includes(C.LEADER_INVALID), `case=${index}`);
  });
});

test('LEADER_IN_ENTRIES: leader card smuggled into the 19-card area', () => {
  const entries = baseEntries();
  entries[2] = ['harold-ashby', 1];
  const result = validateDeck(makeInput({ entries }), CARDS);
  assert.equal(result.ok, false);
  const error = result.errors.find((entry) => entry.code === C.LEADER_IN_ENTRIES);
  assert.ok(error);
  assert.equal(error.cardId, 'harold-ashby');
});

test('NON_LEADER_COUNT: 18 non-leaders is rejected', () => {
  const entries = baseEntries();
  entries.pop(); // stormy-night x1
  const result = validateDeck(makeInput({ entries }), CARDS);
  assert.equal(result.ok, false);
  assert.ok(codesOf(result).includes(C.NON_LEADER_COUNT));
  assert.equal(result.summary.nonLeaderCount, 18);
});

test('COPY_LIMIT: three copies of one non-leader is rejected', () => {
  const entries = baseEntries();
  entries[0][1] = 3; // nora-wells
  const result = validateDeck(makeInput({ entries }), CARDS);
  assert.equal(result.ok, false);
  const error = result.errors.find((entry) => entry.code === C.COPY_LIMIT);
  assert.ok(error);
  assert.equal(error.cardId, 'nora-wells');
  assert.match(error.message, /3 copies/);
});

test('TOTAL_COUNT: 21 cards including the leader is rejected', () => {
  const entries = [...baseEntries(), ['edith-barrow', 1]];
  const result = validateDeck(makeInput({ entries }), CARDS);
  assert.equal(result.ok, false);
  assert.ok(codesOf(result).includes(C.TOTAL_COUNT));
  assert.equal(result.summary.total, 21);
});

// ── multiple errors at once ───────────────────────────────────────────────

test('multiple violations are all reported in one pass', () => {
  const result = validateDeck(
    {
      faction: 'society',
      leader: 'nora-wells', // not a leader
      entries: [
        ['zealot', 3],       // wrong faction + over copy limit
        ['ghost-card', 1],   // unknown
        ['harold-ashby', 1], // leader in entries
      ],
    },
    CARDS,
  );
  assert.equal(result.ok, false);
  const present = codesOf(result);
  for (const code of [
    C.UNKNOWN_CARD,
    C.FACTION_MISMATCH,
    C.LEADER_INVALID,
    C.LEADER_IN_ENTRIES,
    C.COPY_LIMIT,
    C.NON_LEADER_COUNT,
    C.TOTAL_COUNT,
  ]) {
    assert.ok(present.includes(code), `expected ${code} in ${present.join(', ')}`);
  }
  assert.ok(!present.includes(C.MALFORMED_INPUT));
  for (const error of result.errors) {
    assert.equal(typeof error.message, 'string');
    assert.ok(error.message.length > 0);
  }
});

// ── both input forms, purity ──────────────────────────────────────────────

test('entries and expanded cards forms give identical results (legal deck)', () => {
  const deck = PRESET_DECKS.society;
  const entries = toEntries([...deck.cards]);
  const cards = [...deck.cards];
  const fromEntries = validateDeck({ faction: deck.faction, leader: deck.leader, entries }, CARDS);
  const fromCards = validateDeck({ faction: deck.faction, leader: deck.leader, cards }, CARDS);
  assert.deepEqual(fromEntries, fromCards);
  assert.equal(fromEntries.ok, true);
});

test('entries and expanded cards forms give identical errors (illegal deck)', () => {
  const entries = [['zealot', 3], ['nora-wells', 1]];
  const cards = ['zealot', 'zealot', 'zealot', 'nora-wells'];
  const fromEntries = validateDeck({ faction: 'society', leader: 'harold-ashby', entries }, CARDS);
  const fromCards = validateDeck({ faction: 'society', leader: 'harold-ashby', cards }, CARDS);
  assert.deepEqual(fromEntries.errors, fromCards.errors);
  assert.deepEqual(fromEntries.summary, fromCards.summary);
  assert.equal(fromEntries.ok, false);
});

test('validateDeck does not mutate either input form', () => {
  const deck = PRESET_DECKS.cult;
  const entries = toEntries([...deck.cards]);
  const cards = [...deck.cards];
  const entriesSnapshot = structuredClone(entries);
  const cardsSnapshot = [...cards];

  validateDeck({ faction: 'cult', leader: deck.leader, entries }, CARDS);
  validateDeck({ faction: 'cult', leader: deck.leader, cards }, CARDS);

  assert.deepEqual(entries, entriesSnapshot);
  assert.deepEqual(cards, cardsSnapshot);
  assert.ok(Object.isFrozen(deck.cards));
  assert.equal(deck.cards.length, 19);
});

test('entries takes precedence when both forms are supplied', () => {
  const input = {
    faction: 'society',
    leader: 'harold-ashby',
    entries: baseEntries(),
    cards: ['only-one-card'],
  };
  const result = validateDeck(input, CARDS);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.summary.nonLeaderCount, 19);
});

test('a caller-supplied card index is used (reusable for a future UI builder)', () => {
  const unitIds = Array.from({ length: 19 }, (_, index) => `custom-unit-${index}`);
  const makeIndex = (leaderFaction, unitFaction) => ({
    'custom-leader': { id: 'custom-leader', faction: leaderFaction, type: 'leader' },
    ...Object.fromEntries(
      unitIds.map((id) => [id, { id, faction: unitFaction, type: 'unit' }]),
    ),
  });
  const entries = unitIds.map((id) => [id, 1]);
  const legal = validateDeck(
    { faction: 'society', leader: 'custom-leader', entries },
    makeIndex('society', 'neutral'),
  );
  assert.equal(legal.ok, true, JSON.stringify(legal.errors));
  const bad = validateDeck(
    { faction: 'cult', leader: 'custom-leader', entries },
    makeIndex('society', 'society'),
  );
  assert.equal(bad.ok, false);
  assert.ok(codesOf(bad).includes(C.LEADER_INVALID));
  assert.ok(codesOf(bad).includes(C.FACTION_MISMATCH));
});

// ── boundaries ────────────────────────────────────────────────────────────

test('boundary: empty entries array', () => {
  const result = validateDeck(
    { faction: 'society', leader: 'harold-ashby', entries: [] },
    CARDS,
  );
  assert.equal(result.ok, false);
  assert.ok(codesOf(result).includes(C.NON_LEADER_COUNT));
  assert.ok(codesOf(result).includes(C.TOTAL_COUNT));
  assert.equal(result.summary.total, 1);
});

test('boundary: empty cards array', () => {
  const result = validateDeck(
    { faction: 'society', leader: 'harold-ashby', cards: [] },
    CARDS,
  );
  assert.equal(result.ok, false);
  assert.equal(result.summary.nonLeaderCount, 0);
  assert.ok(codesOf(result).includes(C.NON_LEADER_COUNT));
});

test('boundary: duplicate leader (leader slot + entry, twice in entries)', () => {
  const entries = baseEntries();
  entries[2] = ['harold-ashby', 3];
  const result = validateDeck(makeInput({ entries }), CARDS);
  assert.equal(result.ok, false);
  assert.equal(codesOf(result).filter((code) => code === C.LEADER_IN_ENTRIES).length, 1);
  assert.ok(codesOf(result).includes(C.COPY_LIMIT));
});

test('boundary: unknown id', () => {
  const entries = baseEntries();
  entries[3] = ['not-a-real-card', 1];
  const result = validateDeck(makeInput({ entries }), CARDS);
  assert.ok(codesOf(result).includes(C.UNKNOWN_CARD));
  assert.equal(result.ok, false);
});

test('boundary: zero and negative counts are MALFORMED_INPUT', () => {
  for (const count of [0, -1]) {
    const result = validateDeck(
      makeInput({ entries: [['nora-wells', count], ...baseEntries().slice(1)] }),
      CARDS,
    );
    assert.equal(result.ok, false);
    const error = result.errors.find((entry) => entry.code === C.MALFORMED_INPUT);
    assert.ok(error, `count=${count}`);
    assert.equal(error.cardId, 'nora-wells');
  }
});

test('boundary: non-string element in cards form', () => {
  const cards = [...PRESET_DECKS.society.cards];
  cards[0] = 42;
  const result = validateDeck(
    { faction: 'society', leader: 'harold-ashby', cards },
    CARDS,
  );
  assert.equal(result.ok, false);
  assert.ok(codesOf(result).includes(C.MALFORMED_INPUT));
});

test('boundary: missing card index is a programmer-level error (throws)', () => {
  assert.throws(() => validateDeck({}, null), TypeError);
  assert.throws(() => validateDeck({}, 123), TypeError);
});
