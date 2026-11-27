import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, buildView, countCards } from '../../src/engine/v2/index.js';
import {
  OBJECTIVE_THRESHOLD,
  OBJECTIVE_THRESHOLDS,
  thresholdForFaction,
  objectiveMetaForFaction,
  objectiveTypeForFaction,
} from '../../src/engine/v2/objectives.js';

// ── deterministic scenario helpers ─────────────────────────────────────

function setup(p0, p1, { sanity = 6, mechanics = null } = {}) {
  const engine = createGame({
    seed: 'objectives-seed',
    decks: [p0, p1],
    startingSanity: sanity,
    startingHand: Math.max((p0.cards ?? []).length, (p1.cards ?? []).length, 1),
    ...(mechanics ? { mechanics } : {}),
  });
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

function forceTurn(engine, p) {
  engine.state.current = p;
  engine.state.firstPlayer = p;
  engine.state.passed = [false, false];
  engine.state.turnActionTaken = false;
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

function passBoth(engine) {
  for (const p of [0, 1]) {
    void p;
    const r = engine.apply({ type: 'pass' });
    assert.equal(r.ok, true, r.error);
  }
}

// ── pure module ────────────────────────────────────────────────────────

test('objectiveTypeForFaction maps factions and rejects others', () => {
  assert.equal(objectiveTypeForFaction('society'), 'clue');
  assert.equal(objectiveTypeForFaction('cult'), 'doom');
  assert.equal(objectiveTypeForFaction('neutral'), null);
  assert.equal(objectiveTypeForFaction('unknown'), null);
});

test('threshold is 7 and metadata carries bilingual labels', () => {
  assert.equal(OBJECTIVE_THRESHOLD, 7);
  assert.equal(OBJECTIVE_THRESHOLDS.cult, 7);
  assert.equal(thresholdForFaction('cult'), 7);
  assert.equal(thresholdForFaction('society'), OBJECTIVE_THRESHOLDS.society);
  assert.equal(thresholdForFaction('neutral'), 7);
  assert.equal(objectiveMetaForFaction('society').nameZh, '线索');
  assert.equal(objectiveMetaForFaction('society').winZh, '真相大白');
  assert.equal(objectiveMetaForFaction('cult').nameZh, '末日');
  assert.equal(objectiveMetaForFaction('cult').winZh, '旧神降临');
  assert.equal(objectiveMetaForFaction('neutral'), null);
});

// ── initial state + view ──────────────────────────────────────────────

test('players start at 0 and the view exposes objective fields', () => {
  const engine = setup(
    { leader: 'harold-ashby', cards: ['walter-morse'] },
    { leader: 'elias-thorne', cards: ['zealot'] },
  );
  for (const p of [0, 1]) {
    assert.equal(engine.state.players[p].objective, 0);
    const view = buildView(engine, p);
    assert.equal(view.players[p].objective, 0);
  }
  const openView = buildView(engine, 0);
  assert.equal(openView.players[0].objectiveThreshold, OBJECTIVE_THRESHOLDS.society);
  assert.equal(openView.players[1].objectiveThreshold, OBJECTIVE_THRESHOLDS.cult);
  assert.equal(buildView(engine, 0).players[0].objectiveType, 'clue');
  assert.equal(buildView(engine, 0).players[1].objectiveType, 'doom');
});

// ── society: face-up front entry clue ──────────────────────────────────

test('a Society unit deployed face-up to the front gathers 1 clue', () => {
  const engine = setup(
    { leader: 'harold-ashby', cards: ['walter-morse'] },
    { leader: 'elias-thorne', cards: ['zealot'] },
  );
  forceTurn(engine, 0);
  const walter = engine.state.players[0].hand.find((i) => i.cardId === 'walter-morse');
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === walter.uid && a.location === 'front' && !a.faceDown);
  assert.ok(action);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.players[0].objective, 1);
  const gain = r.events.find((e) => e.type === 'objectiveGain');
  assert.ok(gain);
  assert.equal(gain.objectiveType, 'clue');
  assert.equal(gain.source, 'frontEntry');
  assert.equal(gain.total, 1);
  assert.equal(countCards(engine.state, 0), 1);
});

test('a Society stealth unit deployed face-down to the front gathers no clue', () => {
  const engine = setup(
    { leader: 'harold-ashby', cards: ['nora-wells'] },
    { leader: 'elias-thorne', cards: ['zealot'] },
  );
  forceTurn(engine, 0);
  const nora = engine.state.players[0].hand.find((i) => i.cardId === 'nora-wells');
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === nora.uid && a.location === 'front' && a.faceDown === true);
  assert.ok(action);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.players[0].objective, 0);
  assert.equal(r.events.some((e) => e.type === 'objectiveGain'), false);
});

// ── cult: sacrifice / ritual doom ─────────────────────────────────────

test('a Cult devour (sacrifice) adds 1 doom', () => {
  const engine = setup(
    { leader: 'elias-thorne', cards: ['bell-claw', 'zealot'] },
    { leader: 'harold-ashby', cards: ['nora-wells'] },
  );
  forceTurn(engine, 0);
  const victim = putUnit(engine, 0, 'zealot', 'front', 0);
  const bell = engine.state.players[0].hand.find((i) => i.cardId === 'bell-claw');
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === bell.uid && a.location === 'front'
    && a.choice?.mode === 'devour' && a.choice.targetUid === victim.uid);
  assert.ok(action);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.players[0].objective, 1);
  const gain = r.events.find((e) => e.type === 'objectiveGain');
  assert.ok(gain);
  assert.equal(gain.objectiveType, 'doom');
  assert.equal(gain.source, 'sacrifice');
});

test('casting a Cult ritual adds 1 doom', () => {
  const engine = setup(
    { leader: 'elias-thorne', cards: ['tide-ritual'] },
    { leader: 'harold-ashby', cards: ['nora-wells'] },
  );
  forceTurn(engine, 0);
  const ritual = engine.state.players[0].hand.find((i) => i.cardId === 'tide-ritual');
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === ritual.uid);
  assert.ok(action);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.players[0].objective, 1);
  const gain = r.events.find((e) => e.type === 'objectiveGain');
  assert.ok(gain);
  assert.equal(gain.objectiveType, 'doom');
  assert.equal(gain.source, 'ritual');
});

// ── society: clue accumulation and faction gating ─────────────────────

test('a second face-up front entry stacks a second clue', () => {
  const engine = setup(
    { leader: 'harold-ashby', cards: ['walter-morse', 'nora-wells'] },
    { leader: 'elias-thorne', cards: ['zealot'] },
  );
  forceTurn(engine, 0);
  const walter = engine.state.players[0].hand.find((i) => i.cardId === 'walter-morse');
  const first = engine.apply({
    type: 'playCard', player: 0, uid: walter.uid, location: 'front', slot: 0, faceDown: false,
  });
  assert.equal(first.ok, true, first.error);
  forceTurn(engine, 0);
  const nora = engine.state.players[0].hand.find((i) => i.cardId === 'nora-wells');
  const second = engine.apply({
    type: 'playCard', player: 0, uid: nora.uid, location: 'front', slot: 1, faceDown: false,
  });
  assert.equal(second.ok, true, second.error);
  assert.equal(engine.state.players[0].objective, 2);
  assert.equal(
    engine.state.events.filter((e) => e.type === 'objectiveGain' && e.source === 'frontEntry').length,
    2,
  );
});

test('a cult face-up front entry gathers no clue', () => {
  const engine = setup(
    { leader: 'elias-thorne', cards: ['zealot'] },
    { leader: 'harold-ashby', cards: ['walter-morse'] },
  );
  forceTurn(engine, 0);
  const zealot = engine.state.players[0].hand.find((i) => i.cardId === 'zealot');
  const r = engine.apply({
    type: 'playCard', player: 0, uid: zealot.uid, location: 'front', slot: 0, faceDown: false,
  });
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.players[0].objective, 0);
  assert.equal(r.events.some((e) => e.type === 'objectiveGain'), false);
});

// ── threshold win + sanity precedence ─────────────────────────────────

test('reaching the threshold ends the game immediately with objective reason', () => {
  const engine = setup(
    {
      leader: 'harold-ashby',
      cards: ['walter-morse', 'nora-wells', 'edith-barrow', 'arthur-pendleton', 'samuel-pike'],
    },
    { leader: 'elias-thorne', cards: ['zealot'] },
  );
  engine.state.players[0].objective = OBJECTIVE_THRESHOLDS.society - 1;
  forceTurn(engine, 0);
  const walter = engine.state.players[0].hand.find((i) => i.cardId === 'walter-morse');
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === walter.uid && a.location === 'front');
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.phase, 'gameOver');
  assert.equal(engine.state.result.winner, 0);
  assert.equal(engine.state.result.reason, 'objective');
  assert.equal(engine.state.result.objectiveType, 'clue');
});

test('sanity-zero takes precedence over an objective win', () => {
  const engine = setup(
    { leader: 'harold-ashby', cards: ['walter-morse'] },
    { leader: 'elias-thorne', cards: ['zealot'] },
    { sanity: 1 },
  );
  engine.state.players[0].objective = 6;
  engine.state.players[0].sanity = 0;
  forceTurn(engine, 0);
  const ended = engine._gainObjective(0, 1, 'test');
  assert.equal(ended, false);
  assert.equal(engine.state.players[0].objective, 7);
  engine._checkSanityZero();
  assert.equal(engine.state.phase, 'gameOver');
  assert.equal(engine.state.result.reason, 'sanity');
});

// ── toggle off + conservation ─────────────────────────────────────────

test('mechanics.objectives=false records no objective progress or events', () => {
  const engine = setup(
    { leader: 'harold-ashby', cards: ['walter-morse'] },
    { leader: 'elias-thorne', cards: ['zealot'] },
    { mechanics: { objectives: false } },
  );
  forceTurn(engine, 0);
  const walter = engine.state.players[0].hand.find((i) => i.cardId === 'walter-morse');
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === walter.uid && a.location === 'front');
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.players[0].objective, 0);
  assert.equal(r.events.some((e) => e.type === 'objectiveGain'), false);
});

test('objective gains do not change card counts', () => {
  const engine = setup(
    { leader: 'harold-ashby', cards: ['walter-morse', 'nora-wells'] },
    { leader: 'elias-thorne', cards: ['zealot'] },
  );
  const before = countCards(engine.state, 0);
  forceTurn(engine, 0);
  const walter = engine.state.players[0].hand.find((i) => i.cardId === 'walter-morse');
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === walter.uid && a.location === 'front');
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(countCards(engine.state, 0), before);
});
