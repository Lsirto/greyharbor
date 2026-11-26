/**
 * tests/v2/characters.test.mjs — six playable characters (leaders).
 *
 * Each character bundles a data-driven LEADER_ACTIVE skill and, except Elias
 * whose passive is the engine-gated sacrifice echo, a NIGHT_START skill. These
 * tests drive the real engine with the canonical card table.
 *
 * Flow note: createGame starts in the mulligan phase; once BOTH players confirm
 * a mulligan the engine calls _startNight(1), so after that batch we are already
 * in night 1 and every NIGHT_START passive has already fired. Passive tests that
 * need a unit on the board therefore place it before the second mulligan.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGame,
  currentUnitPower,
  effectsFor,
} from '../../src/engine/v2/index.js';
import { TRIGGER } from '../../src/engine/v2/effects/dsl.js';

const SOCIETY_FILLER = ['finn-calloway', 'finn-calloway', 'finn-calloway'];
// Several cult units guarantee an aberration remains in the deck after the deal.
const CULT_DECK = ['deep-one', 'zealot', 'bell-claw', 'finn-calloway', 'finn-calloway'];

// ── deterministic scenario helpers ───────────────────────────────────────

function create({
  leader,
  cards = SOCIETY_FILLER,
  foeLeader = 'elias-thorne',
  foeCards = SOCIETY_FILLER,
  sanity = 6,
  startingHand = 3,
}) {
  return createGame({
    seed: 71,
    decks: [
      { leader, cards: cards.slice() },
      { leader: foeLeader, cards: foeCards.slice() },
    ],
    startingSanity: sanity,
    startingHand,
  });
}

/** Confirm both mulligans; this advances straight into night 1. */
function confirmMulligans(engine) {
  for (const p of [0, 1]) {
    const result = engine.apply({ type: 'mulligan', player: p, uids: [] });
    assert.equal(result.ok, true, result.error);
  }
  engine.state.current = 0;
  engine.state.firstPlayer = 0;
  engine.state.passed = [false, false];
  engine.state.turnActionTaken = false;
  return engine;
}

function setup(options = {}) {
  return confirmMulligans(create(options));
}

/**
 * Create a game, place the requested units, then confirm both mulligans so the
 * night-1 start sees the units already on the board.
 */
function setupWithBoard({ own = [], enemy = [], ...options } = {}) {
  const engine = create(options);
  for (const u of own) putUnit(engine, 0, u.cardId, u.location, u.slot);
  for (const u of enemy) putUnit(engine, 1, u.cardId, u.location, u.slot);
  return confirmMulligans(engine);
}

function takeFromHandOrDeck(engine, p, cardId) {
  const player = engine.state.players[p];
  let index = player.hand.findIndex((entry) => entry.cardId === cardId);
  if (index >= 0) return player.hand.splice(index, 1)[0];
  index = player.deck.findIndex((entry) => entry.cardId === cardId);
  if (index >= 0) return player.deck.splice(index, 1)[0];
  throw new Error(`P${p} has no ${cardId} in hand or deck`);
}

function putUnit(engine, p, cardId, location, slot) {
  const inst = takeFromHandOrDeck(engine, p, cardId);
  inst.face = 'reason';
  inst.faceDown = false;
  inst.location = location;
  inst.slot = slot;
  inst.zone = 'board';
  inst.sealed = false;
  inst.corruptionTokens = [];
  inst.corruptionLoss = 0;
  engine.state.players[p].board[location][slot] = inst;
  return inst;
}

function boardUnits(engine, p) {
  const out = [];
  for (const inst of engine.state.players[p].board.front) if (inst) out.push(inst);
  return out;
}

// ── Harold Ashby (society) ────────────────────────────────────────────────

test('哈罗德主动：封印敌方明牌卡至下一夜，并回复 1 点理智', () => {
  const engine = setup({
    leader: 'harold-ashby',
    sanity: 4,
  });
  const foe = putUnit(engine, 1, 'finn-calloway', 'front', 0);
  const sanityBefore = engine.state.players[0].sanity;
  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader' && entry.targetUid === foe.uid,
  );
  assert.ok(action);
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  assert.equal(foe.sealed, true);
  assert.equal(engine.state.players[0].sanity, sanityBefore + 1);
  assert.equal(engine.state.players[0].leaderUsedThisNight, true);
});

test('哈罗德被动：夜开始理智不高于 5 时回 1，高于 5 不触发', () => {
  const low = setup({ leader: 'harold-ashby', sanity: 4 });
  assert.equal(low.state.players[0].sanity, 5);

  const high = setup({ leader: 'harold-ashby', sanity: 6 });
  assert.equal(high.state.players[0].sanity, 6);
});

// ── Enid Halloway (society, summoner) ─────────────────────────────────────

test('伊妮德主动：无献祭，付 1 理智从牌堆明放任意单位', () => {
  const engine = setup({
    leader: 'enid-halloway',
    cards: ['frank-holt', 'finn-calloway', 'finn-calloway', 'finn-calloway'],
    sanity: 6,
    startingHand: 1,
  });
  const before = boardUnits(engine, 0).length;
  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader' && entry.sacrificeUid === null,
  );
  assert.ok(action);
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  assert.equal(engine.state.players[0].sanity, 5);
  assert.equal(boardUnits(engine, 0).length, before + 1);
  const summoned = boardUnits(engine, 0).find((inst) => inst.uid === action.cardUid);
  assert.ok(summoned, 'summoned card must occupy a board slot');
  assert.equal(summoned.faceDown, false);
});

test('伊妮德被动：夜开始抽 1 张牌', () => {
  const engine = setup({
    leader: 'enid-halloway',
    cards: ['finn-calloway', 'finn-calloway', 'finn-calloway', 'finn-calloway', 'finn-calloway'],
    startingHand: 1,
  });
  assert.equal(engine.state.players[0].hand.length, 2);
});

// ── Augustus Wayne (society) ──────────────────────────────────────────────

test('奥古斯都主动：封印敌方卡，并使己方最高战力明牌单位本夜 +2', () => {
  const engine = setup({ leader: 'augustus-wayne' });
  const own = putUnit(engine, 0, 'finn-calloway', 'front', 0);
  const foe = putUnit(engine, 1, 'finn-calloway', 'front', 0);
  const powerBefore = currentUnitPower(engine.state, 0, own, 'front', 0);
  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader' && entry.targetUid === foe.uid,
  );
  assert.ok(action);
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  assert.equal(foe.sealed, true);
  assert.equal(
    currentUnitPower(engine.state, 0, own, 'front', 0),
    powerBefore + 2,
  );
});

test('奥古斯都被动：夜开始己方全体明牌单位本夜 +1', () => {
  const engine = setupWithBoard({
    leader: 'augustus-wayne',
    own: [{ cardId: 'finn-calloway', location: 'front', slot: 0 }],
  });
  const own = engine.state.players[0].board.front[0];
  assert.equal(own.thisNightPower, 1);
});

// ── Elias Thorne (cult) ───────────────────────────────────────────────────

test('伊莱亚斯主动：献祭己方卡，从牌堆打出异怪', () => {
  const engine = setup({
    leader: 'elias-thorne',
    cards: CULT_DECK,
    startingHand: 1,
  });
  const sacrifice = putUnit(engine, 0, 'finn-calloway', 'front', 0);
  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader' && entry.sacrificeUid === sacrifice.uid,
  );
  assert.ok(action);
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  assert.ok(!boardUnits(engine, 0).some((inst) => inst.uid === sacrifice.uid),
    'sacrificed unit must leave the board');
  assert.ok(boardUnits(engine, 0).some((inst) => inst.uid === action.cardUid),
    'the aberration must enter the board');
  assert.equal(engine.state.players[0].leaderUsedThisNight, true);
});

test('伊莱亚斯被动：献祭回响不在 NIGHT_START 注册表，由引擎按 leaderId 限定', () => {
  const entries = effectsFor('elias-thorne');
  assert.ok(!entries.some((entry) => entry.trigger === TRIGGER.NIGHT_START));
  for (const id of ['harold-ashby', 'enid-halloway', 'augustus-wayne', 'vera-crowe', 'gregor-pestilence']) {
    assert.ok(effectsFor(id).some((entry) => entry.trigger === TRIGGER.NIGHT_START), id);
  }
});

// ── Vera Crowe (cult, summoner) ───────────────────────────────────────────

test('薇拉主动：无献祭无理智消耗，从牌堆召唤异怪但附 1 点腐化', () => {
  const engine = setup({
    leader: 'vera-crowe',
    cards: CULT_DECK,
    startingHand: 1,
  });
  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader' && entry.sacrificeUid === null,
  );
  assert.ok(action);
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  assert.equal(engine.state.players[0].sanity, 6);
  const summoned = boardUnits(engine, 0).find((inst) => inst.uid === action.cardUid);
  assert.ok(summoned);
  assert.equal(summoned.corruptionTokens.length, 1);
});

test('薇拉被动：夜开始理智不高于 3 时抽 1，否则不抽', () => {
  const low = setup({
    leader: 'vera-crowe',
    cards: CULT_DECK,
    sanity: 3,
    startingHand: 1,
  });
  assert.equal(low.state.players[0].hand.length, 2);

  const high = setup({
    leader: 'vera-crowe',
    cards: CULT_DECK,
    sanity: 6,
    startingHand: 1,
  });
  assert.equal(high.state.players[0].hand.length, 1);
});

// ── Gregor Pestilence (cult) ──────────────────────────────────────────────

test('格里高尔主动：敌方明牌单位获得 2 点腐化', () => {
  const engine = setup({ leader: 'gregor-pestilence' });
  const foe = putUnit(engine, 1, 'finn-calloway', 'front', 0);
  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader' && entry.targetUid === foe.uid,
  );
  assert.ok(action);
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  assert.equal(foe.corruptionTokens.length, 2);
  assert.equal(engine.state.players[0].leaderUsedThisNight, true);
});

test('格里高尔被动：夜开始敌方全体明牌单位本夜 -1', () => {
  const engine = setupWithBoard({
    leader: 'gregor-pestilence',
    enemy: [{ cardId: 'finn-calloway', location: 'front', slot: 0 }],
  });
  const foe = engine.state.players[1].board.front[0];
  assert.equal(foe.thisNightPower, -1);
});
