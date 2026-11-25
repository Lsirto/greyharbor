/**
 * src/ui-v2/selection.mjs — pure selection / mulligan-marking state machine.
 *
 * DOM-free and deterministic.  All mutating methods validate their input and
 * report `{ ok, changed, reason? }` instead of throwing.  The selected card
 * (`selectedUid`) and the mulligan mark set (`markedUids`) are independent:
 * clicking a hand card in the play phase selects it, while clicking a hand
 * card during the mulligan phase toggles its mark.
 *
 *   const state = createSelection({ limit: 4, allowedUids: handUids });
 *   state.toggleMark(uid);
 *   state.markedUids;      // copy, safe to hand to the action matcher
 *   state.select(uid);     // clicking the same card again cancels selection
 */

function isUid(value) {
  return typeof value === 'string' && value.length > 0;
}

function normalizeLimit(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function normalizeAllowed(value) {
  if (!Array.isArray(value)) return null;
  const seen = new Set();
  for (const uid of value) {
    if (isUid(uid)) seen.add(uid);
  }
  return seen;
}

export class Selection {
  constructor(options = {}) {
    const opts = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
    this.reset(opts);
  }

  /** Reinitialise in place; keeps the object identity used by the controller. */
  reset(options = {}) {
    const opts = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
    this._limit = normalizeLimit(opts.limit ?? 0);
    this._allowedUids = normalizeAllowed(opts.allowedUids);
    this._selectedUid = isUid(opts.selectedUid) ? opts.selectedUid : null;
    this._marked = [];
    const incoming = Array.isArray(opts.marked) ? opts.marked : Array.isArray(opts.markedUids) ? opts.markedUids : [];
    for (const uid of incoming) {
      const result = this.mark(uid);
      if (!result.ok) break;
    }
    return this.snapshot();
  }

  get limit() {
    return this._limit;
  }

  get selectedUid() {
    return this._selectedUid;
  }

  get markedUids() {
    return this._marked.slice();
  }

  get size() {
    return this._marked.length;
  }

  isMarked(uid) {
    return isUid(uid) && this._marked.includes(uid);
  }

  /** Click a hand card: same uid again cancels, invalid uid also cancels. */
  select(uid) {
    const next = isUid(uid) ? uid : null;
    if (next === this._selectedUid) return { ok: true, changed: false };
    this._selectedUid = next;
    return { ok: true, changed: true };
  }

  clearSelection() {
    if (this._selectedUid === null) return false;
    this._selectedUid = null;
    return true;
  }

  canMark(uid) {
    if (!isUid(uid)) return 'invalid-uid';
    if (this._allowedUids && !this._allowedUids.has(uid)) return 'not-allowed';
    if (this._marked.includes(uid)) return 'already-marked';
    if (this._marked.length >= this._limit) return 'limit';
    return null;
  }

  mark(uid) {
    const reason = this.canMark(uid);
    if (reason === 'already-marked') return { ok: true, changed: false };
    if (reason) return { ok: false, changed: false, reason };
    this._marked.push(uid);
    return { ok: true, changed: true };
  }

  unmark(uid) {
    if (!isUid(uid)) return { ok: true, changed: false };
    const index = this._marked.indexOf(uid);
    if (index < 0) return { ok: true, changed: false };
    this._marked.splice(index, 1);
    return { ok: true, changed: true };
  }

  toggleMark(uid) {
    if (this.isMarked(uid)) {
      const result = this.unmark(uid);
      return { ...result, marked: false };
    }
    const result = this.mark(uid);
    return { ...result, marked: result.ok };
  }

  /** Atomic replacement: on validation failure nothing is mutated. */
  setMarked(uids) {
    if (!Array.isArray(uids)) return { ok: false, changed: false, reason: 'invalid-list' };
    const seen = new Set();
    for (const uid of uids) {
      if (!isUid(uid)) return { ok: false, changed: false, reason: 'invalid-uid' };
      if (seen.has(uid)) return { ok: false, changed: false, reason: 'duplicate' };
      if (this._allowedUids && !this._allowedUids.has(uid)) return { ok: false, changed: false, reason: 'not-allowed' };
      seen.add(uid);
    }
    if (seen.size > this._limit) return { ok: false, changed: false, reason: 'limit' };
    const changed = seen.size !== this._marked.length || this._marked.some((uid) => !seen.has(uid));
    this._marked = Array.from(seen);
    return { ok: true, changed };
  }

  clearMarks() {
    if (!this._marked.length) return false;
    this._marked = [];
    return true;
  }

  setLimit(limit) {
    const next = normalizeLimit(limit);
    if (next < this._marked.length) return { ok: false, changed: false, reason: 'limit' };
    const changed = next !== this._limit;
    this._limit = next;
    return { ok: true, changed };
  }

  setAllowedUids(uids) {
    const next = normalizeAllowed(uids);
    if (next) {
      for (const uid of this._marked) {
        if (!next.has(uid)) return { ok: false, changed: false, reason: 'not-allowed' };
      }
    }
    const changed = setsDiffer(next, this._allowedUids);
    this._allowedUids = next;
    return { ok: true, changed };
  }

  snapshot() {
    return {
      selectedUid: this._selectedUid,
      markedUids: this._marked.slice(),
      limit: this._limit,
      allowedUids: this._allowedUids ? Array.from(this._allowedUids) : null,
    };
  }
}

function setsDiffer(a, b) {
  if (a === b) return false;
  if (!a || !b || a.size !== b.size) return true;
  for (const uid of a) {
    if (!b.has(uid)) return true;
  }
  return false;
}

export function createSelection(options = {}) {
  return new Selection(options);
}

export default createSelection;
