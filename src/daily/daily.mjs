/**
 * src/daily/daily.mjs — pure Daily Challenge logic.
 *
 * The calendar date is the only input. Every player on the same calendar day
 * gets the identical deterministic match: a fixed seed, a fixed faction and a
 * fixed leader (all derived from the date hash), played with the preset decks.
 * No DOM, no global clock, no per-id branches; tests pass fixed dates.
 *
 * Completion is recorded through the generic storage wrapper (injected), which
 * degrades to a no-op when persistence is unavailable.
 */

import { CARD_LIST, PRESET_DECKS } from '../engine/v2/cards.js';

/** localStorage key holding the per-day result map. */
export const DAILY_RECORD_KEY = 'greyharbor.daily.challenge.v1';

const FACTION_IDS = Object.freeze(['society', 'cult']);

/** FNV-1a string hash (same construction as the arena draft). */
function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

/** Format a Date (or parseable value) into a local-time YYYY-MM-DD key. */
export function formatDate(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(date.getTime())) throw new Error('daily challenge needs a valid date');
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Leader card ids for a faction, in the stable CARD_LIST order. */
export function leadersForFaction(faction) {
  return CARD_LIST
    .filter((card) => card.type === 'leader' && card.faction === faction)
    .map((card) => card.id);
}

/**
 * Deterministic daily configuration for a date.
 * @returns {{dateKey: string, faction: string, leader: string, seed: string}}
 */
export function getDailyConfig(dateLike) {
  const dateKey = formatDate(dateLike);
  const hash = hashString(dateKey);
  const faction = FACTION_IDS[hash % FACTION_IDS.length];
  const leaders = leadersForFaction(faction);
  const leader = leaders[Math.floor(hash / FACTION_IDS.length) % leaders.length];
  return Object.freeze({
    dateKey,
    faction,
    leader,
    seed: `greyharbor-daily-${dateKey}`,
  });
}

/**
 * Build createGame battleOptions for the fixed daily match. Seat 0 is the human
 * (derived faction + leader), seat 1 is the opposing faction preset.
 */
export function buildDailyBattleOptions(config) {
  const opponentFaction = config.faction === 'society' ? 'cult' : 'society';
  const order = config.faction === 'society' ? ['society', 'cult'] : ['cult', 'society'];
  const decks = order.map((faction, seat) => {
    const preset = PRESET_DECKS[faction];
    const leader = seat === 0 ? config.leader : preset.leader;
    return { faction, leader, cards: preset.cards.slice() };
  });
  return {
    seed: config.seed,
    names: ['你 · 每日挑战', 'AI · 对手'],
    decks,
  };
}

/** Read the recorded result for one day; null when absent / unparseable. */
export function readDailyResult(storage, dateKey) {
  const map = storage?.getJson?.(DAILY_RECORD_KEY, {});
  if (!map || typeof map !== 'object' || Array.isArray(map)) return null;
  const entry = map[dateKey];
  return entry && typeof entry === 'object' ? entry : null;
}

/** Persist the win/loss for one day; returns whether the write succeeded. */
export function writeDailyResult(storage, dateKey, won) {
  const existing = storage?.getJson?.(DAILY_RECORD_KEY, {});
  const map = existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {};
  map[dateKey] = { won: won === true };
  return storage?.setJson?.(DAILY_RECORD_KEY, map) === true;
}
