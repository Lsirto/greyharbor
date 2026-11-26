/**
 * src/multiplayer/seat-drivers.mjs — pluggable per-seat action sources.
 *
 * The lockstep orchestrator does not know how a seat decides its move: it just
 * calls `driver.requestAction({ seat, view })` and awaits an action. Four
 * drivers cover every situation:
 *
 *   deferred  — local human in a real UI; an external submit() resolves the move
 *   scripted  — a pure function of the view (headless determinism / tests)
 *   ai        — wraps the existing evaluate-based chooseAction
 *   remote    — waits for the peer's frame over an injected transport
 *
 * Drivers return promises so synchronous AI and asynchronous network/human
 * input share one code path.
 */

import {
  MESSAGE_TYPES, ERROR_CODES, ProtocolError, decodeMessage, decodeAction,
} from './protocol.mjs';

/** Local human driver: the UI calls submit() when the player commits a move. */
export function createDeferredDriver() {
  let pending = null;
  return {
    kind: 'local',
    isWaiting: () => pending !== null,
    requestAction() {
      if (pending) return Promise.reject(new Error('local driver is already awaiting input'));
      return new Promise((resolve, reject) => {
        pending = { resolve, reject };
      }).finally(() => { pending = null; });
    },
    submit(action) {
      if (!pending) return false;
      pending.resolve(action);
      return true;
    },
    cancel(error) {
      if (!pending) return false;
      pending.reject(error instanceof Error ? error : new Error(error ?? 'cancelled'));
      return true;
    },
  };
}

/** Scripted driver: a deterministic (view, seat) -> action function. */
export function createScriptedDriver(decide) {
  if (typeof decide !== 'function') throw new TypeError('scripted driver needs a decide function');
  return {
    kind: 'scripted',
    requestAction({ seat, view }) {
      return Promise.resolve().then(() => decide(view, seat));
    },
  };
}

/** AI driver: thin async wrapper over the existing chooseAction. */
export function createAiDriver(chooseAction, seedFor) {
  if (typeof chooseAction !== 'function') throw new TypeError('ai driver needs chooseAction');
  return {
    kind: 'ai',
    requestAction({ seat, view }) {
      const options = typeof seedFor === 'function' ? { seed: seedFor(view, seat) } : {};
      return Promise.resolve(chooseAction(view, options));
    },
  };
}

/**
 * Remote driver: consumes the peer's frames in order. Frames can arrive at any
 * time — including just before the orchestrator re-requests a move — so they
 * are buffered in an inbox instead of being dropped. A decoded ACTION resolves
 * to its plain action object; the orchestrator then matches it against the
 * local legal-action list, so a tampered or stale move never reaches the engine.
 */
export function createRemoteDriver({ transport, seat, protocol } = {}) {
  if (!transport || typeof transport.onMessage !== 'function') {
    throw new TypeError('remote driver needs a transport');
  }
  if (seat !== 0 && seat !== 1) throw new TypeError('remote driver seat must be 0 or 1');

  // Producer/consumer buffers: inbox holds decoded results, waiters the pending
  // request promises. A result is either handed to a waiter or queued.
  const inbox = [];
  const waiters = [];
  let closed = false;

  function settle(result) {
    if (waiters.length) {
      const waiter = waiters.shift();
      if (result.ok) waiter.resolve(result.value);
      else waiter.reject(result.error);
    } else {
      inbox.push(result);
    }
  }

  function handle(raw) {
    let frame;
    try {
      frame = decodeMessage(raw);
    } catch (error) {
      settle({ ok: false, error });
      return;
    }

    if (frame.t === MESSAGE_TYPES.RESIGN && frame.s === seat) {
      settle({ ok: false, error: new ProtocolError(ERROR_CODES.PEER_RESIGNED, 'peer resigned') });
    } else if (frame.t === MESSAGE_TYPES.ACTION && frame.s === seat) {
      try {
        settle({ ok: true, value: decodeAction(frame.a) });
      } catch (error) {
        settle({ ok: false, error });
      }
    } else if (frame.t === MESSAGE_TYPES.ERROR) {
      settle({ ok: false, error: new ProtocolError(frame.code, frame.detail ?? 'peer reported an error') });
    }
    // pings / frames for a different seat are neither queued nor consumed.
  }

  function handleClose() {
    if (closed) return;
    closed = true;
    const error = new ProtocolError('transport-closed', 'transport closed while awaiting peer action');
    // Reject every outstanding request; further requests reject immediately.
    while (waiters.length) waiters.shift().reject(error);
    inbox.push({ ok: false, error });
  }

  transport.onMessage(handle);
  transport.onClose(handleClose);

  return {
    kind: 'remote',
    seat,
    requestAction() {
      if (inbox.length) {
        const result = inbox.shift();
        return result.ok ? Promise.resolve(result.value) : Promise.reject(result.error);
      }
      if (closed) {
        return Promise.reject(new ProtocolError('transport-closed', 'transport is closed'));
      }
      return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
    },
  };
}

export default {
  createDeferredDriver,
  createScriptedDriver,
  createAiDriver,
  createRemoteDriver,
};
