/**
 * src/achievements/achievements.mjs — data-driven achievement engine.
 *
 * Achievements are pure data: each one exposes a numeric metric selector over a
 * normalized player profile and a numeric target, plus an optional gate. There
 * are no per-id branches and no engine changes. The profile is assembled from
 * the persisted Daily Challenge record (the only gameplay history on disk),
 * including faction-specific wins derived from the date configs.
 *
 * Unlock timestamps live in a separate storage key; evaluation is a pure
 * function so the same profile always yields the same achievement state.
 */

import { DAILY_RECORD_KEY } from '../daily/daily.mjs';
import { getDailyConfig } from '../daily/daily.mjs';
import { summarizeDailyRecords } from '../daily/stats.mjs';

/** Storage key holding the id → { unlockedAt } map. */
export const ACHIEVEMENT_UNLOCK_KEY = 'greyharbor.achievements.v1';

/** Read & normalize the persisted daily result map. */
function readDailyMap(storage) {
  const map = storage?.getJson?.(DAILY_RECORD_KEY, {});
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
}

/**
 * Build the normalized player profile used by every achievement metric.
 * @param {object} storage storage wrapper
 * @param {string} todayKey reference day YYYY-MM-DD
 */
export function buildProfile(storage, todayKey) {
  const dailyMap = readDailyMap(storage);
  const stats = summarizeDailyRecords(dailyMap, todayKey);

  let societyWins = 0;
  let cultWins = 0;
  for (const dateKey of Object.keys(dailyMap)) {
    const entry = dailyMap[dateKey];
    if (entry && typeof entry === 'object' && entry.won === true) {
      const faction = getDailyConfig(dateKey).faction;
      if (faction === 'society') societyWins += 1;
      else if (faction === 'cult') cultWins += 1;
    }
  }

  return Object.freeze({
    total: stats.total,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.winRate,
    currentStreak: stats.currentStreak,
    bestStreak: stats.bestStreak,
    societyWins,
    cultWins,
  });
}

/**
 * Achievement catalogue. `metric` extracts a number from the profile; an entry
 * is satisfied when `metric(profile) >= target` (and the optional gate passes).
 */
export const ACHIEVEMENTS = Object.freeze([
  { id: 'first-step', icon: '🗝', name: '初次涉足', description: '完成 1 局每日挑战', target: 1, metric: (p) => p.total },
  { id: 'first-win', icon: '⚔', name: '首战告捷', description: '赢得 1 局每日挑战', target: 1, metric: (p) => p.wins },
  { id: 'three-wins', icon: '📜', name: '小有所成', description: '累计赢得 3 局每日挑战', target: 3, metric: (p) => p.wins },
  { id: 'streak-3', icon: '🔥', name: '锲而不舍', description: '连续打卡 3 天', target: 3, metric: (p) => p.bestStreak },
  { id: 'streak-7', icon: '🕯', name: '坚守一周', description: '连续打卡 7 天', target: 7, metric: (p) => p.bestStreak },
  { id: 'society-win', icon: '🛡', name: '秩序守护者', description: '以守夜人阵营赢得 1 局', target: 1, metric: (p) => p.societyWins },
  { id: 'cult-win', icon: '🐙', name: '深渊低语者', description: '以教团阵营赢得 1 局', target: 1, metric: (p) => p.cultWins },
  { id: 'veteran-10', icon: '⚓', name: '身经百战', description: '累计完成 10 局每日挑战', target: 10, metric: (p) => p.total },
  {
    id: 'winrate-60', icon: '🏆', name: '常胜调查员',
    description: '完成至少 5 局且胜率达到 60%',
    target: 60,
    gate: (p) => p.total >= 5,
    metric: (p) => Math.round((p.winRate ?? 0) * 100),
  },
]);

/** Evaluate every achievement against a profile. Pure & deterministic. */
export function evaluateAchievements(profile) {
  return ACHIEVEMENTS.map((def) => {
    const gatePassed = def.gate ? def.gate(profile) === true : true;
    const current = Number(def.metric(profile)) || 0;
    const satisfied = gatePassed && current >= def.target;
    return Object.freeze({
      id: def.id,
      def,
      current,
      target: def.target,
      gatePassed,
      satisfied,
    });
  });
}

function readUnlockMap(storage) {
  const map = storage?.getJson?.(ACHIEVEMENT_UNLOCK_KEY, {});
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
}

/**
 * Evaluate the profile and persist unlock timestamps for any newly satisfied
 * achievements. Existing unlocks keep their original timestamp.
 * @returns {{profile: object, evaluation: object[], unlocks: object}}
 */
export function syncAchievements(storage, todayKey, now) {
  const profile = buildProfile(storage, todayKey);
  const evaluation = evaluateAchievements(profile);
  const unlocks = readUnlockMap(storage);
  const clock = Number.isFinite(now) ? now : Date.now();
  let changed = false;
  for (const item of evaluation) {
    if (item.satisfied && !unlocks[item.id]) {
      unlocks[item.id] = { unlockedAt: clock };
      changed = true;
    }
  }
  if (changed) storage?.setJson?.(ACHIEVEMENT_UNLOCK_KEY, unlocks);
  return { profile, evaluation, unlocks };
}

/**
 * Assemble the full achievement wall: each definition with its live progress
 * and any stored unlock timestamp.
 */
export function buildAchievementWall(storage, todayKey, now) {
  const { evaluation, unlocks } = syncAchievements(storage, todayKey, now);
  const items = evaluation.map((item) => Object.freeze({
    ...item,
    unlockedAt: unlocks[item.id]?.unlockedAt ?? null,
  }));
  return Object.freeze({
    items,
    total: items.length,
    unlockedCount: items.filter((item) => item.satisfied).length,
  });
}
