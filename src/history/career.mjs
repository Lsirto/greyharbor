/**
 * src/history/career.mjs — cross-module career summary.
 *
 * Aggregates the long-running player record into one career view: match
 * history, cosmetic collection, achievement progress and daily check-in
 * streak. Pure read-only composition over the existing persisted modules;
 * no game logic lives here. The storage wrapper and reference day are
 * injected so the summary stays deterministic and testable.
 */

import { readHistorySummary } from './match-history.mjs';
import { readEconomy } from '../economy/economy.mjs';
import { getAllCardBacks } from '../economy/card-backs.mjs';
import { getAllSkins } from '../economy/skins.mjs';
import { buildAchievementWall } from '../achievements/achievements.mjs';
import { readDailyStats } from '../daily/stats.mjs';

/**
 * Build the career summary from every persisted module.
 *
 * @param {object} storage storage wrapper
 * @param {{todayKey?: string, now?: number, recentLimit?: number}} [options]
 * @returns {object} frozen career view model
 */
export function buildCareerSummary(storage, options = {}) {
  const opts = options && typeof options === 'object' ? options : {};
  const todayKey = typeof opts.todayKey === 'string' && opts.todayKey.length > 0
    ? opts.todayKey
    : null;

  const matches = readHistorySummary(storage, opts);

  const economy = readEconomy(storage);
  const collection = Object.freeze({
    coins: economy.coins,
    backOwned: economy.owned.length,
    backTotal: getAllCardBacks().length,
    skinOwned: economy.ownedSkins.length,
    skinTotal: getAllSkins().length,
    backPulls: economy.pulls,
    skinPulls: economy.skinPulls,
  });

  const wall = todayKey
    ? buildAchievementWall(storage, todayKey, opts.now)
    : { items: [], total: 0, unlockedCount: 0 };
  const achievements = Object.freeze({
    unlockedCount: wall.unlockedCount,
    total: wall.total,
  });

  const daily = todayKey
    ? readDailyStats(storage, todayKey, opts)
    : Object.freeze({ total: 0, currentStreak: 0, bestStreak: 0 });

  return Object.freeze({
    matches,
    collection,
    achievements,
    daily: Object.freeze({
      total: daily.total,
      currentStreak: daily.currentStreak,
      bestStreak: daily.bestStreak,
    }),
  });
}

export default buildCareerSummary;
