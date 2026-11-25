/**
 * src/ui-v2/action-matcher.mjs — pure action matching for human input.
 *
 * Given the *exact* action list from buildView(pov) and a click context, this
 * module finds legal actions by comparing context fields.  It never builds,
 * clones, normalises or fabricates an action: every returned value is one of
 * the very objects supplied in `actions` (reference equality).
 *
 * Matching is strict:
 *   - every context field that is not `undefined` must deep-equal the action
 *     field of the same name;
 *   - `uids` (mulligan / reveal) is compared as an order-insensitive set;
 *   - `choice` compares only the keys present in the context, so a partially
 *     specified choice can still disambiguate an effect;
 *   - if zero OR more than one action matches, `matchAction` returns null —
 *     two identical contexts must never silently resolve to an arbitrary
 *     action.  `findMatchingActions` exposes the whole candidate list so the
 *     controller can show a modal instead of guessing.
 *
 * No DOM, no engine imports, no randomness.
 */

function deepEqual(a, b, seen = new Map()) {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (seen.get(a) === b) return true;
  seen.set(a, b);
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i], seen)) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key], seen)) return false;
  }
  return true;
}

function sortedUids(value) {
  if (!Array.isArray(value)) return null;
  const uids = [];
  for (const entry of value) {
    if (typeof entry !== 'string') return null;
    uids.push(entry);
  }
  return uids.sort();
}

function fieldMatches(action, key, expected) {
  // `undefined` means "the context does not constrain this field".
  if (expected === undefined) return true;

  if (key === 'uids') {
    const wanted = sortedUids(expected);
    if (wanted === null) return false;
    return deepEqual(wanted, sortedUids(action.uids));
  }

  if (key === 'choice') {
    if (expected === null) return action.choice === null || action.choice === undefined;
    if (!expected || typeof expected !== 'object' || Array.isArray(expected)) return false;
    const actual = action.choice;
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false;
    for (const subKey of Object.keys(expected)) {
      if (expected[subKey] === undefined) continue;
      if (!deepEqual(actual[subKey], expected[subKey])) return false;
    }
    return true;
  }

  return action[key] === expected;
}

function contextKeys(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return [];
  return Object.keys(context).filter((key) => context[key] !== undefined);
}

/**
 * All action objects matching the context.  Returned objects are references
 * into the supplied `actions` array; the array itself is a fresh copy.
 */
export function findMatchingActions(actions, context) {
  if (!Array.isArray(actions)) return [];
  const keys = contextKeys(context);
  if (!keys.length) return [];
  const out = [];
  for (const action of actions) {
    if (!action || typeof action !== 'object' || Array.isArray(action)) continue;
    if (keys.every((key) => fieldMatches(action, key, context[key]))) out.push(action);
  }
  return out;
}

/**
 * The one and only legal action matching the context, or null when the
 * context is ambiguous / invalid / matches nothing.
 */
export function matchAction(actions, context) {
  const matches = findMatchingActions(actions, context);
  return matches.length === 1 ? matches[0] : null;
}

export default matchAction;
