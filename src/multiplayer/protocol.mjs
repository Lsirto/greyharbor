/**
 * src/multiplayer/protocol.mjs — transport-agnostic wire protocol.
 *
 * The multiplayer layer exchanges small JSON frames. Every frame is an envelope
 * `{ v, t, ... }` where `v` is the protocol version and `t` the message type.
 * This module is pure (no DOM, no engine, no sockets): it only builds, encodes,
 * decodes and validates frames, so it is fully headless-testable and the same
 * code works over WebSocket, WebRTC DataChannel or a fake in-memory transport.
 *
 * Design note: the engine is deterministic, so peers only need to exchange the
 * match config (seed/decks) and the action intents — never the whole state.
 */

export const PROTOCOL_VERSION = 1;

export const MESSAGE_TYPES = Object.freeze({
  HELLO: 'hello',
  WELCOME: 'welcome',
  START: 'start',
  ACTION: 'action',
  RESIGN: 'resign',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
});

/** Machine-readable error codes carried by an ERROR frame. */
export const ERROR_CODES = Object.freeze({
  BAD_FRAME: 'bad-frame',
  VERSION_MISMATCH: 'version-mismatch',
  UNKNOWN_TYPE: 'unknown-type',
  ILLEGAL_ACTION: 'illegal-action',
  WRONG_SEAT: 'wrong-seat',
  PEER_RESIGNED: 'peer-resigned',
});

/** Display-only keys are never needed to reconstruct a rule action. */
const NON_RULE_KEYS = new Set(['label']);

export class ProtocolError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProtocolError';
    this.code = code;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asSeat(value) {
  if (value !== 0 && value !== 1) {
    throw new ProtocolError(ERROR_CODES.WRONG_SEAT, `seat must be 0 or 1, got ${String(value)}`);
  }
  return value;
}

/**
 * JSON-safe copy of an action with display-only keys removed. The returned
 * object contains only the rule fields the engine needs to recognise it.
 */
export function encodeAction(action) {
  if (!isPlainObject(action) || typeof action.type !== 'string' || action.type.length === 0) {
    throw new ProtocolError(ERROR_CODES.BAD_FRAME, 'action must be an object with a string type');
  }
  const out = {};
  for (const [key, value] of Object.entries(action)) {
    if (NON_RULE_KEYS.has(key)) continue;
    if (value === undefined) continue;
    out[key] = structuredClone(value);
  }
  return out;
}

/** Validate a decoded action payload; returns the same plain object. */
export function decodeAction(plain) {
  if (!isPlainObject(plain) || typeof plain.type !== 'string' || plain.type.length === 0) {
    throw new ProtocolError(ERROR_CODES.BAD_FRAME, 'decoded action must be an object with a string type');
  }
  return plain;
}

/** Stamp the version and serialise a frame to a string for the transport. */
export function encodeMessage(frame) {
  if (!isPlainObject(frame) || typeof frame.t !== 'string' || frame.t.length === 0) {
    throw new ProtocolError(ERROR_CODES.BAD_FRAME, 'frame must be an object with a string type');
  }
  if (!Object.values(MESSAGE_TYPES).includes(frame.t)) {
    throw new ProtocolError(ERROR_CODES.UNKNOWN_TYPE, `unknown message type: ${frame.t}`);
  }
  return JSON.stringify({ v: PROTOCOL_VERSION, ...frame });
}

/** Parse a transport string and validate its envelope. Throws ProtocolError. */
export function decodeMessage(raw) {
  let frame;
  try {
    frame = JSON.parse(raw);
  } catch (error) {
    throw new ProtocolError(ERROR_CODES.BAD_FRAME, `frame is not valid JSON: ${error.message}`);
  }
  if (!isPlainObject(frame)) {
    throw new ProtocolError(ERROR_CODES.BAD_FRAME, 'frame must be a JSON object');
  }
  if (frame.v !== PROTOCOL_VERSION) {
    throw new ProtocolError(
      ERROR_CODES.VERSION_MISMATCH,
      `protocol version ${String(frame.v)} is not supported (expected ${PROTOCOL_VERSION})`,
    );
  }
  if (typeof frame.t !== 'string' || !Object.values(MESSAGE_TYPES).includes(frame.t)) {
    throw new ProtocolError(ERROR_CODES.UNKNOWN_TYPE, `unknown message type: ${String(frame.t)}`);
  }
  if (frame.t === MESSAGE_TYPES.ACTION) {
    asSeat(frame.s);
    decodeAction(frame.a);
  }
  if (frame.t === MESSAGE_TYPES.RESIGN) asSeat(frame.s);
  return frame;
}

// ── frame factories ─────────────────────────────────────────────────────

export function hello({ clientId, room = null } = {}) {
  if (typeof clientId !== 'string' || clientId.length === 0) {
    throw new ProtocolError(ERROR_CODES.BAD_FRAME, 'hello needs a clientId');
  }
  return { t: MESSAGE_TYPES.HELLO, clientId, room };
}

export function welcome({ room, seat, peerId = null } = {}) {
  return { t: MESSAGE_TYPES.WELCOME, room, seat: asSeat(seat), peerId };
}

export function start(config) {
  if (!isPlainObject(config) || typeof config.seed !== 'string' || config.seed.length === 0) {
    throw new ProtocolError(ERROR_CODES.BAD_FRAME, 'start needs a config with a string seed');
  }
  return { t: MESSAGE_TYPES.START, config: structuredClone(config) };
}

export function actionMessage(seat, action) {
  return { t: MESSAGE_TYPES.ACTION, s: asSeat(seat), a: encodeAction(action) };
}

export function resign(seat, reason = null) {
  return { t: MESSAGE_TYPES.RESIGN, s: asSeat(seat), reason };
}

export function ping(nonce) {
  return { t: MESSAGE_TYPES.PING, nonce };
}

export function pong(nonce) {
  return { t: MESSAGE_TYPES.PONG, nonce };
}

export function errorFrame(code, detail = null) {
  return { t: MESSAGE_TYPES.ERROR, code, detail };
}

export default {
  PROTOCOL_VERSION,
  MESSAGE_TYPES,
  ERROR_CODES,
  ProtocolError,
  encodeMessage,
  decodeMessage,
  encodeAction,
  decodeAction,
  hello,
  welcome,
  start,
  actionMessage,
  resign,
  ping,
  pong,
  errorFrame,
};
