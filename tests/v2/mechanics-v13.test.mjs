import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGame,
  LOCATIONS,
  currentUnitPower,
  countCards,
} from '../../src/engine/v2/index.js';
import { isSealImmune } from '../../src/engine/v2/scoring.js';
import { ANOMALIES, drawAnomaly } from '../../src/engine/v2/anomalies.js';
import {
  CHAOS_BAG,
  CHAOS_TOKEN_TYPES,
  drawChaosToken,
} from '../../src/engine/v2/chaos-bag.js';

// ── synthetic card helpers ─────────────────────────────────────────────

function makeCard(id, overrides = {}) {
  return {
    id,
    name: id,
    faction: 'neutral',
    type: 'unit',
    location: 'any',
    reasonPower: 3,
    madnessPower: 5,
    keywords: [],
    sanityCost: 0,
    ...overrides,
  };
}

function spec(cardId, n = 19) {
  return { leader: null, cards: Array(n).fill(cardId) };
}

function startGame(seed, options = {}) {
  const engine = createGame({ seed, ...options });
  for (const p of [0, 1]) {
    const r = engine.apply({ type: 'mulligan', player: p, uids: [] });
    assert.equal(r.ok, true, r.error);
  }
  return engine;
}

function syntheticGame(seed, options = {}) {
  const cardPool = [makeCard('unit-a'), makeCard('unit-s', {
    keywords: ['stealth'],
  })];
  return startGame(seed, {
    cardPool,
    decks: [spec('unit-a'), spec('unit-a')],
    ...options,
  });
}

function forceTurn(engine, p) {
  engine.state.current = p;
  engine.state.firstPlayer = p;
  engine.state.passed = [false, false];
  engine.state.turnActionTaken = false;
}

function setAnomaly(engine, anomalyId) {
  const def = ANOMALIES.find((entry) => entry.id === anomalyId);
  assert.ok(def, `anomaly ${anomalyId} exists`);
  engine.state.anomaly = { ...def };
  return engine.state.anomaly;
}

function placeDirect(engine, p, inst, location, slot) {
  inst.zone = 'board';
  inst.location = location;
  inst.slot = slot;
  inst.faceDown = false;
  engine.state.players[p].board[location][slot] = inst;
}

function forceIntoHand(engine, p, cardId) {
  const player = engine.state.players[p];
  let inst = player.hand.find((entry) => entry.cardId === cardId);
  if (inst) return inst;
  const idx = player.deck.findIndex((entry) => entry.cardId === cardId);
  assert.ok(idx >= 0, `${cardId} exists somewhere for P${p}`);
  inst = player.deck.splice(idx, 1)[0];
  inst.zone = 'hand';
  inst.faceDown = false;
  player.hand.push(inst);
  return inst;
}

// ── anomaly: data + night draw ─────────────────────────────────────────

test('anomaly pool has 12 well-formed definitions', () => {
  assert.equal(ANOMALIES.length, 12);
  for (const anomaly of ANOMALIES) {
    assert.equal(typeof anomaly.id, 'string');
    assert.equal(typeof anomaly.nameZh, 'string');
    assert.ok(anomaly.location === null || LOCATIONS.includes(anomaly.location));
  }
});

test('drawAnomaly always returns a valid definition', () => {
  const engine = createGame({ seed: 'anomaly-draw' });
  for (let i = 0; i < 300; i += 1) {
    const drawn = drawAnomaly(engine.state);
    assert.ok(ANOMALIES.some((def) => def.id === drawn.id));
  }
});

test('night 1 start draws and stores a public anomaly', () => {
  const engine = startGame('anomaly-night');
  assert.ok(engine.state.anomaly);
  assert.ok(ANOMALIES.some((def) => def.id === engine.state.anomaly.id));
});

// ── anomaly: power modifier ────────────────────────────────────────────

test('power anomaly adds a location-wide modifier this night', () => {
  const engine = syntheticGame('anomaly-power');
  forceTurn(engine, 0);
  setAnomaly(engine, 'echoes-of-old-harbor'); // scene +1
  const handCard = engine.state.players[0].hand[0];
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === handCard.uid && a.location === 'scene' && !a.faceDown);
  assert.ok(action);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  const inst = engine.state.players[0].board.scene[0];
  const expected = Math.max(0, 3 + 1 + (inst.chaosToken?.modifier ?? 0));
  assert.equal(currentUnitPower(engine.state, 0, inst, 'scene', 0), expected);
});

// ── anomaly: entry corruption ──────────────────────────────────────────

test('entry-corruption anomaly corrupts a unit on face-up entry', () => {
  const engine = syntheticGame('anomaly-corrupt');
  forceTurn(engine, 0);
  setAnomaly(engine, 'corrupt-mire'); // scene entry corruption
  const handCard = engine.state.players[0].hand[0];
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === handCard.uid && a.location === 'scene' && !a.faceDown);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.ok(engine.state.players[0].board.scene[0].corruptionTokens.length >= 1);
});

// ── anomaly: entry sanity ──────────────────────────────────────────────

test('entry-sanity anomaly refunds sanity on archive entry', () => {
  const engine = syntheticGame('anomaly-sanity', { startingSanity: 4 });
  forceTurn(engine, 0);
  setAnomaly(engine, 'sanctum-of-reason'); // archive +1
  const handCard = engine.state.players[0].hand[0];
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === handCard.uid && a.location === 'archive' && !a.faceDown);
  assert.ok(action);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.players[0].sanity, 5);
});

// ── anomaly: seal immunity ─────────────────────────────────────────────

test('seal-immunity anomaly blocks new seals at the location', () => {
  const engine = startGame('anomaly-seal', {
    decks: [
      { leader: 'harold-ashby', cards: ['finn-calloway', 'zealot', 'deep-one'] },
      { leader: 'harold-ashby', cards: ['finn-calloway', 'zealot', 'deep-one'] },
    ],
  });
  setAnomaly(engine, 'shelter-of-lamps'); // archive seal immune
  forceTurn(engine, 1);
  const target = engine.state.players[0].hand[0];
  placeDirect(engine, 0, target, 'archive', 0);
  assert.equal(isSealImmune(engine.state, 0, target, 'archive'), true);
  assert.equal(engine.getActions(1).filter((a) => a.type === 'useLeader').length, 0);
});

// ── anomaly: leader blocked ────────────────────────────────────────────

test('leader-blocked anomaly removes leader actions at the scene', () => {
  const engine = startGame('anomaly-leader', {
    decks: [
      { leader: 'harold-ashby', cards: ['finn-calloway', 'zealot', 'deep-one'] },
      { leader: 'harold-ashby', cards: ['finn-calloway', 'zealot', 'deep-one'] },
    ],
  });
  setAnomaly(engine, 'muted-ground'); // scene leader blocked
  forceTurn(engine, 1);
  const target = engine.state.players[0].hand[0];
  placeDirect(engine, 0, target, 'scene', 0);
  assert.equal(engine.getActions(1).filter((a) => a.type === 'useLeader').length, 0);
});

// ── anomaly: environment blocked ───────────────────────────────────────

test('environment-blocked anomaly removes environment plays', () => {
  const engine = startGame('anomaly-env');
  setAnomaly(engine, 'windless-night');
  forceTurn(engine, 0);
  forceIntoHand(engine, 0, 'stormy-night');
  const envActions = engine.getActions(0).filter((a) =>
    a.type === 'playCard' && engine.cardIndex[a.cardId]?.type === 'environment');
  assert.equal(envActions.length, 0);
});

// ── anomaly: toggle off ────────────────────────────────────────────────

test('mechanics.anomaly=false leaves no anomaly on the state', () => {
  const engine = startGame('anomaly-off', { mechanics: { anomaly: false, chaosBag: true } });
  assert.equal(engine.state.anomaly, null);
});

// ── chaos bag: composition ─────────────────────────────────────────────

test('chaos bag has the fixed 19-token composition', () => {
  assert.equal(CHAOS_BAG.length, 19);
  for (const type of CHAOS_TOKEN_TYPES) {
    assert.equal(CHAOS_BAG.filter((entry) => entry.id === type.id).length, type.count);
  }
});

test('drawChaosToken returns a token from the bag', () => {
  const engine = createGame({ seed: 'chaos-draw' });
  for (let i = 0; i < 200; i += 1) {
    const drawn = drawChaosToken(engine.state);
    assert.ok(CHAOS_TOKEN_TYPES.some((type) => type.id === drawn.id));
  }
});

// ── chaos bag: token on face-up play ───────────────────────────────────

test('a face-up hand-played unit draws a token that modifies its power', () => {
  const engine = syntheticGame('chaos-faceup');
  forceTurn(engine, 0);
  engine.state.anomaly = null;
  const handCard = engine.state.players[0].hand[0];
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === handCard.uid && a.location === 'scene' && !a.faceDown);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  const inst = engine.state.players[0].board.scene[0];
  assert.ok(inst.chaosToken);
  assert.equal(
    currentUnitPower(engine.state, 0, inst, 'scene', 0),
    Math.max(0, 3 + inst.chaosToken.modifier),
  );
});

// ── chaos bag: face-down draws on reveal ───────────────────────────────

test('a face-down unit has no token until it is revealed', () => {
  const cardPool = [makeCard('unit-a'), makeCard('unit-s', { keywords: ['stealth'] })];
  const engine = startGame('chaos-facdown', {
    cardPool,
    decks: [spec('unit-s'), spec('unit-a')],
  });
  forceTurn(engine, 0);
  engine.state.anomaly = null;
  const stealth = engine.state.players[0].hand[0];
  const playDown = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === stealth.uid && a.faceDown === true);
  assert.ok(playDown);
  const pr = engine.apply(playDown);
  assert.equal(pr.ok, true, pr.error);
  let inst;
  let location;
  for (const loc of LOCATIONS) {
    inst = engine.state.players[0].board[loc].find((entry) => entry?.uid === stealth.uid);
    if (inst) { location = loc; break; }
  }
  assert.equal(inst.chaosToken, null);
  forceTurn(engine, 0);
  const reveal = engine.getActions(0).find((a) => a.type === 'reveal' && a.uids.includes(stealth.uid));
  assert.ok(reveal);
  const rr = engine.apply(reveal);
  assert.equal(rr.ok, true, rr.error);
  assert.ok(inst.chaosToken);
  void location;
});

// ── chaos bag: long-run distribution ───────────────────────────────────

test('large-sample token frequencies approach the fixed probabilities', () => {
  const engine = createGame({ seed: 'chaos-distribution' });
  const draws = 20000;
  const counts = Object.fromEntries(CHAOS_TOKEN_TYPES.map((type) => [type.id, 0]));
  for (let i = 0; i < draws; i += 1) counts[drawChaosToken(engine.state).id] += 1;
  for (const type of CHAOS_TOKEN_TYPES) {
    const observed = counts[type.id] / draws;
    const expected = type.count / CHAOS_BAG.length;
    assert.ok(Math.abs(observed - expected) < 0.02,
      `${type.id}: ${observed.toFixed(3)} vs ${expected.toFixed(3)}`);
  }
});

// ── chaos bag: toggle off ──────────────────────────────────────────────

test('mechanics.chaosBag=false leaves instances without a token', () => {
  const engine = syntheticGame('chaos-off', {
    mechanics: { anomaly: true, chaosBag: false },
  });
  forceTurn(engine, 0);
  const handCard = engine.state.players[0].hand[0];
  const action = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === handCard.uid && a.location === 'scene' && !a.faceDown);
  const r = engine.apply(action);
  assert.equal(r.ok, true, r.error);
  assert.equal(engine.state.players[0].board.scene[0].chaosToken, null);
});

// ── discover: Finn on play ────────────────────────────────────────────

test('Finn discovers one of the top 3 deck cards into hand', () => {
  const engine = startGame('discover-finn');
  engine.state.anomaly = null;
  forceTurn(engine, 0);
  const finn = forceIntoHand(engine, 0, 'finn-calloway');
  assert.ok(engine.state.players[0].deck.length >= 3, 'the deck holds at least three cards');
  const topThree = engine.state.players[0].deck.slice(0, 3);
  const allDiscover = engine.getActions(0).filter((a) =>
    a.type === 'playCard' && a.uid === finn.uid && a.choice?.mode === 'discover');
  const { location, slot } = allDiscover[0];
  const discoverActions = allDiscover.filter((a) => a.location === location && a.slot === slot);
  assert.equal(discoverActions.length, 3, 'one choice per top-3 card at a single slot');
  const chosen = discoverActions[0];
  assert.ok(topThree.some((entry) => entry.uid === chosen.choice.targetUid));
  const r = engine.apply(chosen);
  assert.equal(r.ok, true, r.error);
  assert.ok(engine.state.players[0].hand.some((entry) => entry.uid === chosen.choice.targetUid));
  for (const entry of topThree.filter((e) => e.uid !== chosen.choice.targetUid)) {
    assert.ok(engine.state.players[0].deck.some((deck) => deck.uid === entry.uid));
  }
  assert.equal(countCards(engine.state, 0), 19);
});

// ── discover: empty deck no-op ────────────────────────────────────────

test('discover with an empty deck resolves without crashing', () => {
  const engine = startGame('discover-empty');
  engine.state.anomaly = null;
  forceTurn(engine, 0);
  const finn = forceIntoHand(engine, 0, 'finn-calloway');
  engine.state.players[0].deck.length = 0;
  const fallback = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === finn.uid
    && a.choice?.mode === 'discover' && a.choice.targetUid === null);
  assert.ok(fallback);
  const r = engine.apply(fallback);
  assert.equal(r.ok, true, r.error);
});

// ── discover: Lucia on reveal ─────────────────────────────────────────

test('Lucia discovers on reveal in the dream', () => {
  const engine = startGame('discover-lucia');
  forceTurn(engine, 0);
  const lucia = forceIntoHand(engine, 0, 'lucia-vaughn');
  const dreamPlay = engine.getActions(0).find((a) =>
    a.type === 'playCard' && a.uid === lucia.uid && a.location === 'dream' && a.faceDown);
  assert.ok(dreamPlay);
  const pr = engine.apply(dreamPlay);
  assert.equal(pr.ok, true, pr.error);
  forceTurn(engine, 0);
  const reveal = engine.getActions(0).find((a) => a.type === 'reveal' && a.uids.includes(lucia.uid));
  assert.ok(reveal);
  const before = engine.state.players[0].hand.length;
  const rr = engine.apply(reveal);
  assert.equal(rr.ok, true, rr.error);
  assert.equal(engine.state.players[0].hand.length, before + 1);
  assert.equal(countCards(engine.state, 0), 19);
});
