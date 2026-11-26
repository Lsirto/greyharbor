import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROTOCOL_VERSION, MESSAGE_TYPES, ERROR_CODES, ProtocolError,
  encodeMessage, decodeMessage, encodeAction, decodeAction,
  hello, welcome, start, actionMessage, resign, ping, pong, errorFrame,
} from '../../src/multiplayer/protocol.mjs';

function roundTrip(frame) {
  return decodeMessage(encodeMessage(frame));
}

test('every message type survives an encode/decode round trip', () => {
  const cases = [
    hello({ clientId: 'c1', room: 'ROOM' }),
    welcome({ room: 'ROOM', seat: 1, peerId: 'c2' }),
    start({ seed: 'seed-1', decks: ['society', 'cult'] }),
    actionMessage(0, { type: 'playCard', player: 0, uid: 'u1', location: 'scene', slot: 2 }),
    resign(1, 'give up'),
    ping('n1'),
    pong('n1'),
    errorFrame(ERROR_CODES.ILLEGAL_ACTION, 'nope'),
  ];
  for (const frame of cases) {
    const decoded = roundTrip(frame);
    assert.equal(decoded.v, PROTOCOL_VERSION);
    assert.equal(decoded.t, frame.t);
  }
});

test('decode rejects malformed JSON, wrong version and unknown type', () => {
  assert.throws(() => decodeMessage('not-json'), (e) => e.code === ERROR_CODES.BAD_FRAME);
  assert.throws(
    () => decodeMessage(JSON.stringify({ v: 999, t: MESSAGE_TYPES.PING })),
    (e) => e.code === ERROR_CODES.VERSION_MISMATCH,
  );
  assert.throws(
    () => decodeMessage(JSON.stringify({ v: PROTOCOL_VERSION, t: 'mystery' })),
    (e) => e.code === ERROR_CODES.UNKNOWN_TYPE,
  );
});

test('encodeAction drops the display label and survives JSON cloning', () => {
  const encoded = encodeAction({ type: 'playCard', player: 0, uid: 'u1', label: '展示用文案' });
  assert.equal(encoded.label, undefined);
  assert.equal(encoded.type, 'playCard');
  // Must be JSON-safe (no undefined / non-cloneable values).
  assert.doesNotThrow(() => JSON.stringify(encoded));
  const decoded = decodeAction(JSON.parse(JSON.stringify(encoded)));
  assert.equal(decoded.uid, 'u1');
});

test('action and resign frames reject an invalid seat', () => {
  assert.throws(() => encodeMessage(actionMessage(2, { type: 'pass', player: 2 })), ProtocolError);
  assert.throws(() => encodeMessage(resign(3)), ProtocolError);
});

test('action frame requires a structurally valid action', () => {
  assert.throws(() => actionMessage(0, { player: 0 }), (e) => e.code === ERROR_CODES.BAD_FRAME);
});
