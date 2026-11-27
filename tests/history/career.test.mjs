/**
 * tests/history/career.test.mjs — cross-module career summary contract.
 * Asserts the composition over match history, economy, achievements and
 * daily check-in. Fixed dates and an injected clock keep it deterministic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createStorage } from '../../src/ui-v2/storage.mjs';
import { recordMatch } from '../../src/history/match-history.mjs';
import { buildCareerSummary } from '../../src/history/career.mjs';
import { ECONOMY_KEY } from '../../src/economy/economy.mjs';
import { DAILY_RECORD_KEY } from '../../src/daily/daily.mjs';
import { getAllCardBacks } from '../../src/economy/card-backs.mjs';
import { getAllSkins } from '../../src/economy/skins.mjs';
import { shiftDateKey } from '../../src/daily/stats.mjs';

function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  return createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  });
}

function makeInfo({ winner, faction = 'society', leader = 'harold-ashby' }) {
  return {
    result: { winner, reason: 'clue' },
    nightHistory: [{}, {}],
    seed: 'seed',
    matchConfig: { humanFaction: faction, humanLeader: leader },
  };
}

const TODAY = '2026-11-26';
const DAY1 = Date.UTC(2026, 10, 24, 2, 0, 0);
const DAY2 = Date.UTC(2026, 10, 25, 2, 0, 0);

test('空存档：汇总全零，收藏总数与成就总数仍给出目录长度', () => {
  const career = buildCareerSummary(memStorage(), { todayKey: TODAY, now: DAY2 });
  assert.equal(career.matches.total, 0);
  assert.equal(career.matches.wins, 0);
  assert.equal(career.matches.bestStreak, 0);
  assert.equal(career.matches.firstMatchAt, null);
  assert.equal(career.matches.playDays, 0);

  assert.equal(career.collection.coins, 0);
  assert.equal(career.collection.backTotal, getAllCardBacks().length);
  assert.equal(career.collection.skinTotal, getAllSkins().length);
  assert.equal(career.collection.backPulls, 0);
  assert.equal(career.collection.skinPulls, 0);

  assert.equal(career.achievements.total, 9);
  assert.equal(career.daily.total, 0);
  assert.equal(career.daily.currentStreak, 0);
  assert.equal(career.daily.bestStreak, 0);
});

test('跨模块聚合：战绩连胜/天数、收藏进度、成就与打卡分别汇总', () => {
  const storage = memStorage({
    [ECONOMY_KEY]: {
      coins: 320,
      pulls: 12,
      skinPulls: 4,
      owned: ['default'],
      ownedSkins: ['harold-ashby-twilight'],
    },
    [DAILY_RECORD_KEY]: {
      [shiftDateKey(TODAY, -1)]: { won: true },
      [TODAY]: { won: false },
    },
  });

  recordMatch(storage, makeInfo({ winner: 0 }), { mode: 'skirmish', now: DAY1 });
  recordMatch(storage, makeInfo({ winner: 1 }), { mode: 'skirmish', now: DAY1 + 1000 });
  recordMatch(storage, makeInfo({ winner: 0, faction: 'cult' }), { mode: 'arena', now: DAY2 });
  recordMatch(storage, makeInfo({ winner: 0, faction: 'cult' }), { mode: 'daily', now: DAY2 + 1000 });

  const career = buildCareerSummary(storage, { todayKey: TODAY, now: DAY2 });

  // 战绩：4 局 3 胜 1 负，最长连胜 2，跨 2 个自然日，最早为 DAY1。
  assert.equal(career.matches.total, 4);
  assert.equal(career.matches.wins, 3);
  assert.equal(career.matches.losses, 1);
  assert.equal(career.matches.currentStreak, 2);
  assert.equal(career.matches.bestStreak, 2);
  assert.equal(career.matches.playDays, 2);
  assert.equal(career.matches.firstMatchAt, DAY1);

  // 收藏：读取钱包与拥有数，总数取目录长度。
  assert.equal(career.collection.coins, 320);
  assert.equal(career.collection.backOwned, 1);
  assert.equal(career.collection.skinOwned, 1);
  assert.equal(career.collection.backPulls, 12);
  assert.equal(career.collection.skinPulls, 4);

  // 每日：连续 2 天打卡，当前连续 2，最佳连续 2。
  assert.equal(career.daily.total, 2);
  assert.equal(career.daily.currentStreak, 2);
  assert.equal(career.daily.bestStreak, 2);

  // 完成过每日挑战，至少解锁「初次涉足」。
  assert.ok(career.achievements.unlockedCount >= 1);
  assert.equal(career.achievements.total, 9);
});
