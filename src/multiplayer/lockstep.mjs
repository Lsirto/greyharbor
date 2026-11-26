/**
 * src/multiplayer/lockstep.mjs — deterministic match orchestration.
 *
 * `createLockstepMatch` drives a createGame() engine purely through pluggable
 * seat drivers. It never invents moves: every driver result is resolved to one
 * of the exact objects in buildView(seat).actions before it is applied, so an
 * illegal or ambiguous move is rejected rather than corrupting the engine.
 *
 * `createNetworkClient` is the two-peer wiring: the local seat uses a local
 * driver and broadcasts each committed action, while the opponent seat uses a
 * remote driver that applies only validated incoming frames. Because both
 * engines share one seed and apply actions in the same order, they stay in
 * deterministic lockstep with no full-state synchronisation.
 */

import { matchAction } from '../ui-v2/action-matcher.mjs';
import { createRemoteDriver } from './seat-drivers.mjs';
import {
  MESSAGE_TYPES, ERROR_CODES, ProtocolError,
  actionMessage, encodeMessage, resign as resignFrame,
} from './protocol.mjs';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Resolve a driver result (reference or decoded plain object) to the unique
 * legal action. Throws ProtocolError when it matches nothing or is ambiguous.
 */
export function resolveLegalAction(legalActions, returned) {
  if (legalActions.includes(returned)) return returned;
  if (isPlainObject(returned)) {
    const match = matchAction(legalActions, returned);
    if (match) return match;
  }
  throw new ProtocolError(
    ERROR_CODES.ILLEGAL_ACTION,
    `action is not a legal move: ${JSON.stringify(returned)?.slice(0, 120)}`,
  );
}

/**
 * Run a full match through the supplied drivers. Returns once the engine
 * reports gameOver. `onEvents` fires after every successful apply (used by the
 * network client to broadcast local moves).
 */
export function createLockstepMatch({
  engine,
  drivers,
  onEvents = null,
  maxSteps = 10000,
} = {}) {
  if (!engine || typeof engine.viewFor !== 'function') {
    throw new TypeError('lockstep match needs an engine');
  }
  if (!Array.isArray(drivers) || drivers.length !== 2) {
    throw new TypeError('lockstep match needs exactly two drivers');
  }

  let steps = 0;
  let stopped = false;

  async function applyForSeat(seat) {
    const view = engine.viewFor(seat);
    const returned = await drivers[seat].requestAction({ seat, view, actions: view.actions });
    const action = resolveLegalAction(view.actions, returned);

    const outcome = engine.apply(action);
    if (!outcome.ok) {
      throw new ProtocolError(ERROR_CODES.ILLEGAL_ACTION, outcome.error);
    }
    steps += 1;
    if (steps > maxSteps) {
      throw new Error(`lockstep exceeded ${maxSteps} steps; aborting to avoid an infinite loop`);
    }
    if (typeof onEvents === 'function') {
      await onEvents({ seat, action, events: outcome.events });
    }
  }

  async function run() {
    while (!stopped) {
      const view = engine.viewFor(0);
      if (view.phase === 'gameOver') {
        return { view, result: view.result, steps };
      }
      if (view.phase === 'mulligan') {
        for (const seat of [0, 1]) {
          const seatView = engine.viewFor(seat);
          if (seatView.mulliganDone[seat] !== true) await applyForSeat(seat);
        }
      } else if (view.phase === 'play') {
        await applyForSeat(view.current);
      } else {
        throw new ProtocolError(ERROR_CODES.BAD_FRAME, `unexpected engine phase: ${String(view.phase)}`);
      }
    }
    return { view: engine.viewFor(0), result: engine.viewFor(0).result, steps };
  }

  return {
    run,
    stop: () => { stopped = true; },
    getView: (seat = 0) => engine.viewFor(seat),
    getSteps: () => steps,
  };
}

/**
 * One side of a two-peer game. The local seat is driven by `localDriver` and
 * every move it commits is sent over the transport; the opponent seat is driven
 * by a remote driver that only applies validated frames. Both peers must be
 * constructed with engines sharing the same seed/decks.
 */
export function createNetworkClient({
  engine,
  localSeat,
  localDriver,
  transport,
  protocol,
} = {}) {
  if (localSeat !== 0 && localSeat !== 1) throw new TypeError('localSeat must be 0 or 1');
  if (!localDriver || typeof localDriver.requestAction !== 'function') {
    throw new TypeError('network client needs a local driver');
  }
  if (!transport || typeof transport.send !== 'function') {
    throw new TypeError('network client needs a transport');
  }

  const remoteSeat = localSeat === 0 ? 1 : 0;
  const remoteDriver = createRemoteDriver({ transport, seat: remoteSeat, protocol });
  const drivers = localSeat === 0 ? [localDriver, remoteDriver] : [remoteDriver, localDriver];

  function broadcast(frame) {
    if (!transport.isOpen()) {
      throw new ProtocolError('transport-closed', 'cannot broadcast: transport is closed');
    }
    transport.send(encodeMessage(frame));
  }

  const match = createLockstepMatch({
    engine,
    drivers,
    onEvents: async ({ seat, action }) => {
      if (seat === localSeat) broadcast(actionMessage(localSeat, action));
    },
  });

  return {
    run: match.run,
    getView: match.getView,
    getSteps: match.getSteps,
    localSeat,
    /** Concede: notify the peer (best effort) then stop the local loop. */
    resign(reason = null) {
      try {
        if (transport.isOpen()) broadcast(resignFrame(localSeat, reason));
      } catch (_) { /* peer may already be gone; still stop locally */ }
      match.stop();
    },
  };
}

export default { createLockstepMatch, createNetworkClient, resolveLegalAction };
