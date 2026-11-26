import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../../src/engine/v2/index.js';
import { chooseAction } from '../../src/ai/v2/ai.mjs';
import { createMemoryTransportPair } from '../../src/multiplayer/transport.mjs';
import { createAiDriver, createRemoteDriver } from '../../src/multiplayer/seat-drivers.mjs';
import {
  createLockstepMatch, createNetworkClient, resolveLegalAction,
} from '../../src/multiplayer/lockstep.mjs';
import {
  MESSAGE_TYPES, ERROR_CODES, ProtocolError,
  encodeMessage, actionMessage, resign as resignFrame,
} from '../../src/multiplayer/protocol.mjs';

const SEED = 'mp-lockstep-test';

function newEngine() {
  return createGame({ seed: SEED, decks: ['society', 'cult'] });
}

function aiDriver(seatSuffix) {
  return createAiDriver(chooseAction, () => `${SEED}:${seatSuffix}`);
}

test('resolveLegalAction passes references through and rejects non-matching objects', () => {
  const legal = [
    { type: 'pass', player: 0 },
    { type: 'playCard', player: 0, uid: 'u1', location: 'scene', slot: 0 },
  ];
  assert.equal(resolveLegalAction(legal, legal[0]), legal[0]);
  // A plain object that structurally matches one legal action resolves to it.
  assert.equal(resolveLegalAction(legal, { type: 'pass', player: 0 }), legal[0]);
  assert.throws(
    () => resolveLegalAction(legal, { type: 'playCard', player: 0, uid: 'ghost', location: 'scene', slot: 9 }),
    (e) => e.code === ERROR_CODES.ILLEGAL_ACTION,
  );
});

test('a single lockstep match with two AI drivers plays to gameOver', async () => {
  const engine = newEngine();
  const match = createLockstepMatch({
    engine,
    drivers: [aiDriver('s0'), aiDriver('s1')],
  });
  const summary = await match.run();
  assert.equal(engine.viewFor(0).phase, 'gameOver');
  assert.ok(summary.steps > 0);
  assert.ok(summary.result);
});

test('two network clients over memory transports finish with identical results', async () => {
  const [transportA, transportB] = createMemoryTransportPair();

  const clientA = createNetworkClient({
    engine: newEngine(),
    localSeat: 0,
    localDriver: aiDriver('s0'),
    transport: transportA,
  });
  const clientB = createNetworkClient({
    engine: newEngine(),
    localSeat: 1,
    localDriver: aiDriver('s1'),
    transport: transportB,
  });

  const [sumA, sumB] = await Promise.all([clientA.run(), clientB.run()]);

  assert.equal(clientA.getView(0).phase, 'gameOver');
  assert.equal(clientB.getView(0).phase, 'gameOver');
  // Both engines applied the same number of moves and agree on the outcome.
  assert.equal(sumA.steps, sumB.steps);
  assert.equal(sumA.result.winner, sumB.result.winner);
  assert.equal(sumA.result.reason, sumB.result.reason);
  assert.deepEqual(JSON.parse(JSON.stringify(sumA.result)), JSON.parse(JSON.stringify(sumB.result)));
});

test('a malformed frame makes the remote driver reject before any action is applied', async () => {
  const [t1, t2] = createMemoryTransportPair();
  const remote = createRemoteDriver({ transport: t2, seat: 0 });
  const pending = remote.requestAction();
  t1.send('this is not json');
  await assert.rejects(pending, (e) => e.code === ERROR_CODES.BAD_FRAME);
});

test('an injected action that is not legal cannot be resolved onto the engine', async () => {
  const [t1, t2] = createMemoryTransportPair();
  const remote = createRemoteDriver({ transport: t2, seat: 0 });
  const pending = remote.requestAction();
  // A structurally valid frame, but the action claims a slot the engine does not offer.
  t1.send(encodeMessage(actionMessage(0, {
    type: 'playCard', player: 0, uid: 'intruder', location: 'scene', slot: 99,
  })));
  const decoded = await pending;

  const engine = newEngine();
  const legal = engine.viewFor(0).actions;
  assert.throws(() => resolveLegalAction(legal, decoded), ProtocolError);
});

test('a peer resign frame rejects the awaiting remote driver', async () => {
  const [t1, t2] = createMemoryTransportPair();
  const remote = createRemoteDriver({ transport: t2, seat: 1 });
  const pending = remote.requestAction();
  t1.send(encodeMessage(resignFrame(1, 'concede')));
  await assert.rejects(pending, (e) => e.code === ERROR_CODES.PEER_RESIGNED);
});
