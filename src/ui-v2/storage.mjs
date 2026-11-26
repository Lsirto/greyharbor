/**
 * src/ui-v2/storage.mjs — zero-dependency persistence wrapper.
 *
 * A tiny, safe wrapper over localStorage. It accepts an injected backend so it
 * is fully testable in Node (a plain in-memory object with getItem / setItem /
 * removeItem), and silently degrades to a no-op when storage is unavailable
 * (private mode, storage disabled, or outside a browser). Every read tolerates
 * malformed JSON and every write tolerates quota / security errors.
 *
 * Higher-level features (daily challenge, later achievements / economy) build
 * their own record shapes on top of the generic getJson / setJson methods.
 */

/** Resolve the backend: explicit injection, global localStorage, or null. */
function resolveBackend(provided) {
  if (provided !== undefined) return provided ?? null;
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch (_) {
    return null;
  }
}

/**
 * @param {object|null} [provided] injected storage backend
 * @returns {{available: boolean, getRaw: Function, setRaw: Function,
 *            getJson: Function, setJson: Function, remove: Function}}
 */
export function createStorage(provided) {
  const backend = resolveBackend(provided);
  const available = !!backend
    && typeof backend.getItem === 'function'
    && typeof backend.setItem === 'function';
  const store = available ? backend : null;

  function getRaw(key) {
    try {
      return store.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function setRaw(key, value) {
    try {
      store.setItem(key, String(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function remove(key) {
    try {
      store?.removeItem?.(key);
    } catch (_) { /* no-op */ }
  }

  function getJson(key, fallback = null) {
    const raw = getRaw(key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function setJson(key, value) {
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (_) {
      return false;
    }
    return setRaw(key, serialized);
  }

  return {
    available,
    getRaw,
    setRaw,
    getJson,
    setJson,
    remove,
  };
}

export default createStorage;
