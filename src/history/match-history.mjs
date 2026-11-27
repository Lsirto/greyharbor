/**
 * src/history/match-history.mjs — pure cross-mode match history.
 *
 * Records one normalized entry per completed match (the human is always seat 0),
 * across every mode: skirmish / campaign / arena / daily / custom deck. Pure
 * functions with no DOM; the storage backend and clock are injected so tests
 * stay deterministic. Display labels are derived from the persisted ids in the
 * template layer; this module keeps only stable ids and raw outcome facts.
 */

/** localStorage key holding the newest-last array of match entries. */
export const HISTORY_KEY = 'greyharbor.match-history.v1';

/** Mode ids → Chinese labels. Keys are stable and persisted; labels are UI. */
export const MODES = Object.freeze({
  skirmish: '人机对战',
  campaign: '战役',
  arena: '竞技场',
  daily: '每日挑战',
  deck: '自建牌组',
});

/** Cap stored matches so the record cannot grow unbounded. */
export const MAX_ENTRIES = 200;

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanString(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

/** Local-date key (yyyy-mm-dd) used to count distinct play days. */
function dayKey(at) {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

const VALID_MODES = new Set(Object.keys(MODES));

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : 'skirmish';
}

function normalizeFaction(faction) {
  return faction === 'cult' ? 'cult' : 'society';
}

/**
 * Build a normalized entry from the controller's onGameOver `info` plus a
 * context. `info` carries `result`, `nightHistory`, `seed`, `matchConfig`;
 * `context` carries `mode` and the injected clock `now`.
 *
 * @param {object} info onGameOver payload
 * @param {{mode?: string, now?: number}} [context]
 */
export function normalizeMatchEntry(info, context = {}) {
  const i = asObject(info);
  const c = asObject(context);
  const result = asObject(i.result);
  const matchConfig = asObject(i.matchConfig);
  const winner = typeof result.winner === 'number' ? result.winner : null;
  const leader = cleanString(c.leader) ?? cleanString(matchConfig.humanLeader) ?? cleanString(result.leader);
  const faction = cleanString(c.faction) ?? cleanString(matchConfig.humanFaction);
  const now = Number.isFinite(Number(c.now)) ? Number(c.now) : 0;

  return Object.freeze({
    mode: normalizeMode(cleanString(c.mode)),
    faction: normalizeFaction(faction),
    leader,
    winner, // 0 = human won, 1 = opponent won, null = draw
    won: winner === 0,
    reason: cleanString(result.reason),
    objectiveType: cleanString(result.objectiveType),
    nights: asArray(i.nightHistory).length,
    seed: cleanString(i.seed),
    at: now,
  });
}

/** Validate one persisted entry; returns a normalized copy or null when malformed. */
function normalizeStored(raw) {
  const e = asObject(raw);
  if (e.winner !== 0 && e.winner !== 1 && e.winner !== null) return null;
  const entry = normalizeMatchEntry({
    result: { winner: e.winner, reason: e.reason, objectiveType: e.objectiveType },
    nightHistory: [],
    seed: e.seed,
    matchConfig: { humanFaction: e.faction, humanLeader: e.leader },
  }, { mode: e.mode, now: Number(e.at) || 0 });
  // Persisted entry stores an explicit night count; fall back to recomputed 0.
  const nights = Number.isInteger(e.nights) && e.nights >= 0 ? e.nights : entry.nights;
  return Object.freeze({ ...entry, nights });
}

/** Read, clean and sort the stored history oldest → newest. */
export function readHistory(storage) {
  const raw = storage?.getJson?.(HISTORY_KEY, []);
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map(normalizeStored)
    .filter((entry) => entry !== null)
    .sort((a, b) => a.at - b.at);
}

/**
 * Append one match to the stored record, capping at MAX_ENTRIES (oldest dropped).
 * @returns {boolean} whether the write succeeded
 */
export function recordMatch(storage, info, context = {}) {
  if (!storage || typeof storage.setJson !== 'function') return false;
  const entry = normalizeMatchEntry(info, context);
  const list = readHistory(storage);
  list.push(entry);
  if (list.length > MAX_ENTRIES) list.splice(0, list.length - MAX_ENTRIES);
  return storage.setJson(HISTORY_KEY, list) === true;
}

function summarizeGroup(entries) {
  const total = entries.length;
  const wins = entries.filter((e) => e.winner === 0).length;
  const losses = entries.filter((e) => e.winner === 1).length;
  const draws = total - wins - losses;
  return Object.freeze({
    total,
    wins,
    losses,
    draws,
    winRate: total === 0 ? null : Math.round((wins / total) * 100) / 100,
  });
}

function groupBy(entries, keyOf) {
  const buckets = new Map();
  for (const entry of entries) {
    const key = keyOf(entry);
    if (key === null || key === undefined) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(entry);
  }
  return [...buckets.entries()]
    .map(([key, group]) => Object.freeze({ key, ...summarizeGroup(group) }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Aggregate the cleaned history.
 * @param {object[]} entries oldest → newest, as returned by readHistory
 * @param {{recentLimit?: number}} [options]
 */
export function summarizeHistory(entries, options = {}) {
  const list = Array.isArray(entries) ? entries : [];
  const summary = summarizeGroup(list);

  // Current win streak: walk backwards from the most recent match while wins.
  let currentStreak = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].winner === 0) currentStreak += 1;
    else break;
  }

  // Best win streak: longest consecutive win run across the whole history.
  let bestStreak = 0;
  let run = 0;
  for (const entry of list) {
    if (entry.winner === 0) {
      run += 1;
      if (run > bestStreak) bestStreak = run;
    } else {
      run = 0;
    }
  }

  // Earliest match timestamp and the number of distinct calendar days played.
  const firstMatchAt = list.length > 0 ? list[0].at : null;
  const daySet = new Set();
  for (const entry of list) {
    const key = Number.isFinite(entry.at) && entry.at > 0 ? dayKey(entry.at) : null;
    if (key) daySet.add(key);
  }
  const playDays = daySet.size;

  const recentLimit = Number.isInteger(options.recentLimit) && options.recentLimit > 0
    ? options.recentLimit
    : 10;
  const recent = list.slice().reverse().slice(0, recentLimit);

  return Object.freeze({
    ...summary,
    currentStreak,
    bestStreak,
    firstMatchAt,
    playDays,
    byMode: groupBy(list, (e) => e.mode),
    byFaction: groupBy(list, (e) => e.faction),
    byLeader: groupBy(list, (e) => e.leader),
    recent,
  });
}

/** Read the stored record and aggregate it in one call. */
export function readHistorySummary(storage, options) {
  return summarizeHistory(readHistory(storage), options);
}
