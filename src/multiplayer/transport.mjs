/**
 * src/multiplayer/transport.mjs — transport contract + in-memory test channel.
 *
 * A transport is the reliable, ordered string channel a network client talks
 * through. It is intentionally minimal so the same client can run on a real
 * WebSocket, a WebRTC DataChannel (reliable mode) or this fake:
 *
 *   send(data: string)
 *   onMessage(handler: (data: string) => void)
 *   onClose(handler: () => void)
 *   close()
 *   isOpen()
 *
 * `createMemoryTransportPair()` returns two endpoints cross-wired like a socket
 * pair: a frame sent on one is scheduled onto the peer's message handler.
 * Delivery is asynchronous (microtask) to mimic a real network and avoid
 * re-entrant lockstep loops; frames are scheduled in send order so delivery
 * stays ordered.
 */

function createMemoryEndpoint(name, scheduler, peerRef) {
  let handler = null;
  let closeHandler = null;
  let open = true;

  const endpoint = {
    name,
    isOpen: () => open,

    send(data) {
      if (!open) throw new Error(`cannot send on a closed transport (${name})`);
      if (typeof data !== 'string') throw new TypeError(`transport frames must be strings (${name})`);
      const peer = peerRef();
      if (!peer.isOpen()) throw new Error(`peer transport is closed (${peer.name})`);

      scheduler(() => {
        // Re-check at delivery time: the peer may have disconnected meanwhile.
        if (peer.isOpen() && typeof peer.deliver === 'function') peer.deliver(data);
      });
    },

    onMessage(fn) {
      if (fn !== null && typeof fn !== 'function') throw new TypeError('onMessage expects a function');
      handler = fn;
    },
    onClose(fn) {
      if (fn !== null && typeof fn !== 'function') throw new TypeError('onClose expects a function');
      closeHandler = fn;
    },

    /** Called by the peer endpoint when a frame is due for this side. */
    deliver(data) {
      if (open && typeof handler === 'function') handler(data);
    },

    close() {
      if (!open) return;
      open = false;
      if (typeof closeHandler === 'function') closeHandler();
      const peer = peerRef();
      if (peer.isOpen()) peer.close();
    },
  };

  return endpoint;
}

/**
 * Build a cross-wired endpoint pair. Closing one endpoint closes the peer too,
 * matching a dropped socket. `scheduler` defaults to queueMicrotask; tests can
 * inject a manual stepper for deterministic runs.
 */
export function createMemoryTransportPair(options = {}) {
  const scheduler = typeof options.scheduler === 'function'
    ? options.scheduler
    : (fn) => queueMicrotask(fn);

  const refs = { a: null, b: null };
  const a = createMemoryEndpoint('a', scheduler, () => refs.b);
  const b = createMemoryEndpoint('b', scheduler, () => refs.a);
  refs.a = a;
  refs.b = b;
  return [a, b];
}

export default { createMemoryTransportPair };
