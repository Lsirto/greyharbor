/**
 * src/daily/stats.mjs — pure aggregation over the Daily Challenge result map.
 *
 * Turns the per-day win/loss map into streaks, totals, win rate and a recent
 * history list. No DOM, no clock: the reference day is injected as a YYYY-MM-DD
 * key, so every assertion is deterministic. Date arithmetic runs on UTC to avoid
 * local time-zone / DST drift.
 */

import { DAILY_RECORD_KEY } from './daily.mjs';

const DAY_MS = 86400000;

function pad2(value) {
  return String(value).padStart(2, '0');
}

/** Add (or subtract) whole days to a YYYY-MM-DD key. */
export function shiftDateKey(dateKey, deltaDays) {
  const [y, m, d] = String(dateKey).split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + deltaDays * DAY_MS;
  const date = new Date(t);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/**
 * Summarize the per-day result map relative to a reference day.
 * @param {Record<string,{won:boolean}>} [recordMap]
 * @param {string} todayKey
 * @param {{recentLimit?: number}} [options]
 */
export function summarizeDailyRecords(recordMap, todayKey, options = {}) {
  const recentLimit = Number.isInteger(options.recentLimit) && options.recentLimit > 0
    ? options.recentLimit
    : 10;

  const entries = Object.keys(recordMap || {})
    .filter((dateKey) => {
      const entry = recordMap[dateKey];
      return entry && typeof entry === 'object' && 'won' in entry;
    })
    .sort()
    .map((dateKey) => ({ dateKey, won: recordMap[dateKey].won === true }));

  const present = new Set(entries.map((entry) => entry.dateKey));
  const total = entries.length;
  const wins = entries.reduce((count, entry) => count + (entry.won ? 1 : 0), 0);
  const losses = total - wins;

  // Longest run of consecutive calendar days (ascending).
  let bestStreak = 0;
  let run = 0;
  let previous = null;
  for (const entry of entries) {
    run = previous !== null && shiftDateKey(previous, 1) === entry.dateKey ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = entry.dateKey;
  }

  // Current streak: count today when done, otherwise start yesterday so an
  // unfinished today does not break the streak; walk backward while present.
  let cursor = present.has(todayKey) ? todayKey : shiftDateKey(todayKey, -1);
  let currentStreak = 0;
  while (present.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  const recent = entries.slice().reverse().slice(0, recentLimit);

  return Object.freeze({
    total,
    wins,
    losses,
    winRate: total === 0 ? null : Math.round((wins / total) * 100) / 100,
    currentStreak,
    bestStreak,
    recent,
  });
}

/** Load the stored result map via the storage wrapper and summarize it. */
export function readDailyStats(storage, todayKey, options) {
  const map = storage?.getJson?.(DAILY_RECORD_KEY, {});
  const safe = map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  return summarizeDailyRecords(safe, todayKey, options);
}
