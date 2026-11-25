/**
 * Balance patch v1.1 — firstPlayerCompensation hooks.
 *
 * Every mechanism must (a) touch only the night-1 first player, (b) fire the
 * correct number of times, (c) be independently switchable / stackable, and
 * (d) stay deterministic. All defaults stay at 0 (pre-patch behaviour).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, countCards } from '../../src/engine/v2/index.js';

function card(id, overrides = {}) {
  return {
    id,
    name: id,
    faction: 'neutral',
    type: 'unit',
    location: 'scene',
    reasonPower: 1,
    madnessPower: 2,
    keywords: [],
    sanityCost: 0,
    ...overrides,
  };
}

function deckOf(cardId, count = 19) {
  return { leader: null, cards: Array(count).fill(cardId) };
}

function keepHands(engine) {
  for (const p of [0, 1]) {
    const result = engine.apply({ type: 'mulligan', player: p, uids: [] });
    assert.equal(result.ok, true, result.error);
  }
  assert.equal(engine.phase, 'play');
}

function countByPlayer(engine, predicate) {
  return [0, 1].map((p) => engine.getActions(p).filter((a) => predicate(a, p)).length);
}

// ── extraMulligan ──────────────────────────────────────────────────────

test('extraMulligan: +1 only widens the night-1 first player to three cards', () => {
  const engine = createGame({
    seed: 'comp-mulligan',
    firstPlayerCompensation: { extraMulligan: 1 },
  });
  const fp = engine.state.night1FirstPlayer;

  // 37 combinations per player at the v1 default; +28 triples for the coin winner.
  assert.deepEqual(countByPlayer(engine, (a) => a.type === 'mulligan'), [fp === 0 ? 93 : 37, fp === 1 ? 93 : 37]);
  assert.deepEqual(countByPlayer(engine, (a) => a.type === 'mulligan' && a.uids.length === 3),
    [fp === 0 ? 56 : 0, fp === 1 ? 56 : 0]);
  assert.deepEqual(countByPlayer(engine, (a) => a.type === 'mulligan' && a.uids.length > 3), [0, 0]);

  const triple = engine.getActions(fp).find((a) => a.type === 'mulligan' && a.uids.length === 3);
  assert.ok(triple);
  assert.equal(engine.apply({ type: 'mulligan', player: fp, uids: triple.uids }).ok, true);
  assert.equal(engine.state.players[fp].hand.length, 8);
  assert.equal(engine.state.players[fp].deck.length, 11);
  assert.equal(countCards(engine.state, fp), 19);

  const four = engine.state.players[1 - fp].hand.slice(0, 4).map((inst) => inst.uid);
  assert.equal(engine.apply({ type: 'mulligan', player: 1 - fp, uids: four }).ok, false);
  assert.equal(engine.apply({ type: 'mulligan', player: 1 - fp, uids: [] }).ok, true);
  assert.equal(engine.phase, 'play');
  assert.equal(engine.state.firstPlayer, fp, 'the compensation recipient is the night-1 first player');
});

test('extraMulligan: value 0 restores the exact two-card rule', () => {
  const engine = createGame({
    seed: 'comp-mulligan-off',
    firstPlayerCompensation: { extraMulligan: 0 },
  });
  assert.deepEqual(countByPlayer(engine, (a) => a.type === 'mulligan'), [37, 37]);
  assert.deepEqual(countByPlayer(engine, (a) => a.type === 'mulligan' && a.uids.length === 3), [0, 0]);
});

// ── extraStartingCard ──────────────────────────────────────────────────

test('v1.1 default: extraMulligan=2 applies with no options passed', () => {
  const engine = createGame({ seed: 42 });
  const fp = engine.state.night1FirstPlayer;
  // 37 v1 combos + C(8,3)=56 triples + C(8,4)=70 quadruples for the coin winner.
  assert.deepEqual(countByPlayer(engine, (a) => a.type === 'mulligan'),
    [fp === 0 ? 163 : 37, fp === 1 ? 163 : 37]);
  assert.deepEqual(countByPlayer(engine, (a) => a.type === 'mulligan' && a.uids.length === 4),
    [fp === 0 ? 70 : 0, fp === 1 ? 70 : 0]);
  assert.equal(engine.getActions().length, 200);
});

test('extraStartingCard: exactly one extra card for the first player, in the night-start batch', () => {
  const engine = createGame({
    seed: 'comp-start-card',
    firstPlayerCompensation: { extraStartingCard: 1 },
  });
  const fp = engine.state.night1FirstPlayer;
  keepHands(engine);

  assert.equal(engine.state.players[fp].hand.length, 9);
  assert.equal(engine.state.players[1 - fp].hand.length, 8);
  assert.equal(engine.state.players[fp].deck.length, 10);
  assert.equal(engine.state.players[1 - fp].deck.length, 11);
  for (const p of [0, 1]) assert.equal(countCards(engine.state, p), 19);

  const starts = engine.state.events.filter((e) => e.type === 'nightStart');
  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0].draws[fp], 1);
  assert.deepEqual(starts[0].draws[1 - fp], 0);
  assert.equal(engine.state.events.filter((e) => e.type === 'draw' && e.player === fp).length, 1);
  assert.equal(engine.state.events.filter((e) => e.type === 'draw' && e.player === 1 - fp).length, 0);
});

test('extraStartingCard: nights 2/3 keep the ordinary two-card draw and do not repeat the bonus', () => {
  const engine = createGame({
    seed: 'comp-start-card-n2',
    firstPlayerCompensation: { extraStartingCard: 1 },
  });
  const fp = engine.state.night1FirstPlayer;
  keepHands(engine);
  while (engine.phase === 'play' && engine.state.night === 1) {
    engine.apply({ type: 'pass', player: engine.state.current });
  }
  assert.equal(engine.state.night, 2);

  const starts = engine.state.events.filter((e) => e.type === 'nightStart');
  assert.equal(starts.length, 2);
  assert.deepEqual(starts[1].draws, [2, 2], 'night 2 is the untouched §2.4 batch');
  assert.equal(engine.state.players[fp].hand.length, 11);
  assert.equal(engine.state.players[1 - fp].hand.length, 10);
});

test('extraStartingCard: deck exhaustion follows §2.4 and never breaks conservation', () => {
  const engine = createGame({
    seed: 'comp-start-card-empty',
    cardPool: [card('only')],
    decks: [deckOf('only'), deckOf('only')],
    startingHand: 19,
    firstPlayerCompensation: { extraStartingCard: 2 },
  });
  const fp = engine.state.night1FirstPlayer;
  keepHands(engine);

  assert.equal(engine.state.players[fp].deck.length, 0);
  assert.equal(engine.state.players[fp].hand.length, 19);
  const starts = engine.state.events.filter((e) => e.type === 'nightStart');
  assert.deepEqual(starts[0].draws, [0, 0]);
  for (const p of [0, 1]) assert.equal(countCards(engine.state, p), 19);
});

// ── night1Sanity ───────────────────────────────────────────────────────

test('night1Sanity: +1 applies only to the first player and respects SANITY_MAX', () => {
  const engine = createGame({
    seed: 'comp-sanity',
    cardPool: [card('only')],
    decks: [deckOf('only'), deckOf('only')],
    startingSanity: [3, 3],
    firstPlayerCompensation: { night1Sanity: 1 },
  });
  const fp = engine.state.night1FirstPlayer;
  keepHands(engine);

  assert.equal(engine.state.players[fp].sanity, 4);
  assert.equal(engine.state.players[1 - fp].sanity, 3);
  assert.equal(engine.state.players[fp].hand.every((inst) => inst.face === 'reason'), true);
  assert.equal(engine.state.players[1 - fp].hand.every((inst) => inst.face === 'madness'), true);

  const capped = createGame({
    seed: 'comp-sanity-cap',
    startingSanity: [4, 4],
    firstPlayerCompensation: { night1Sanity: 5 },
  });
  const cappedFp = capped.state.night1FirstPlayer;
  assert.equal(capped.state.players[cappedFp].sanity, 6, 'clamped to SANITY_MAX');
  assert.equal(capped.state.players[1 - cappedFp].sanity, 4);
});

test('night1Sanity: default 6/6 is already capped, and night 2 never repeats the bonus', () => {
  // Neutral decks avoid the Society night-start passive, isolating the hook.
  const engine = createGame({
    seed: 'comp-sanity-n2',
    cardPool: [card('only')],
    decks: [deckOf('only'), deckOf('only')],
    firstPlayerCompensation: { night1Sanity: 1 },
  });
  const fp = engine.state.night1FirstPlayer;
  keepHands(engine);
  assert.deepEqual(engine.state.players.map((p) => p.sanity), [6, 6]);

  while (engine.phase === 'play' && engine.state.night === 1) {
    engine.apply({ type: 'pass', player: engine.state.current });
  }
  assert.equal(engine.state.night, 2);
  assert.deepEqual(engine.state.players.map((p) => p.sanity), [5, 5], 'only the §9.6 tie penalty applied');
});

// ── stacking / independence / determinism ──────────────────────────────

test('mechanisms stack, can be switched off independently, and stay deterministic', () => {
  const options = {
    seed: 'comp-stack',
    startingSanity: [4, 4],
    firstPlayerCompensation: {
      extraMulligan: 1,
      extraStartingCard: 1,
      night1Sanity: 1,
    },
  };
  const a = createGame(options);
  const b = createGame(options);
  const fp = a.state.night1FirstPlayer;

  assert.deepEqual(countByPlayer(a, (x) => x.type === 'mulligan' && x.uids.length === 3),
    [fp === 0 ? 56 : 0, fp === 1 ? 56 : 0]);
  assert.equal(a.state.players[fp].sanity, 5);
  assert.equal(a.state.players[1 - fp].sanity, 4);
  keepHands(a);
  keepHands(b);
  assert.deepEqual(a.state, b.state, 'same seed + same compensation is deterministic');
  assert.equal(a.state.players[fp].hand.length, 9);
  assert.equal(a.state.players[1 - fp].hand.length, 8);

  const partial = createGame({
    ...options,
    seed: 'comp-stack-partial',
    firstPlayerCompensation: {
      extraMulligan: 1,
      extraStartingCard: 0,
      night1Sanity: 0,
    },
  });
  const pfp = partial.state.night1FirstPlayer;
  assert.deepEqual(countByPlayer(partial, (x) => x.type === 'mulligan' && x.uids.length === 3),
    [pfp === 0 ? 56 : 0, pfp === 1 ? 56 : 0]);
  assert.deepEqual(partial.state.players.map((p) => p.sanity), [4, 4]);
  keepHands(partial);
  assert.deepEqual(partial.state.players.map((p) => p.hand.length), [8, 8]);

  // Explicit zeros are required to see pre-patch behaviour: v1.1 ships with
  // extraMulligan=2 enabled by default.
  const off = createGame({
    seed: 'comp-stack-off',
    startingSanity: [4, 4],
    firstPlayerCompensation: { extraMulligan: 0, extraStartingCard: 0, night1Sanity: 0 },
  });
  assert.deepEqual(countByPlayer(off, (x) => x.type === 'mulligan' && x.uids.length === 3), [0, 0]);
  keepHands(off);
  // Society's night-start passive (+1 sanity for P0) is unrelated to the patch.
  assert.deepEqual(off.state.players.map((p) => p.sanity), [5, 4]);
  assert.deepEqual(off.state.players.map((p) => p.hand.length), [8, 8]);
});

test('firstPlayerCompensation rejects malformed values without touching the RNG', () => {
  assert.throws(
    () => createGame({ seed: 'bad-comp', firstPlayerCompensation: { extraMulligan: -1 } }),
    /non-negative integer/,
  );
  assert.throws(
    () => createGame({ seed: 'bad-comp', firstPlayerCompensation: { extraStartingCard: 1.5 } }),
    /non-negative integer/,
  );
  assert.throws(
    () => createGame({ seed: 'bad-comp', firstPlayerCompensation: 'extraMulligan' }),
    /must be an object/,
  );
});
