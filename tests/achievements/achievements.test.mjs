/**
 * tests/achievements/achievements.test.mjs — data-driven achievement engine
 * contract. Crafted daily maps and injected clock keep it deterministic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACHIEVEMENT_UNLOCK_KEY,
  ACHIEVEMENTS,
  buildAchievementWall,
  buildProfile,
  evaluateAchievements,
  syncAchievements,
} from '../../src/achievements/achievements.mjs';
import { getDailyConfig } from '../../src/daily/daily.mjs';
import { shiftDateKey } from '../../src/daily/stats.mjs';
import { createStorage } from '../../src/ui-v2/storage.mjs';

function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  let writes = 0;
  const storage = createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); writes += 1; },
    removeItem: (k) => { map.delete(k); },
  });
  return { storage, writes: () => writes };
}

const TODAY = '2026-11-26';

/** Build a consecutive-day map; wonPredicate decides each entry's result. */
function consecutiveMap(days, wonPredicate) {
  const out = {};
  for (let i = 0; i < days; i += 1) {
    const key = shiftDateKey(TODAY, i);
    out[key] = { won: wonPredicate(i, getDailyConfig(key).faction) };
  }
  return out;
}

function byId(evaluation, id) {
  return evaluation.find((item) => item.id === id);
}

test('空存档：profile 全零，所有成就未满足', () => {
  const { storage } = memStorage();
  const profile = buildProfile(storage, TODAY);
  assert.equal(profile.total, 0);
  assert.equal(profile.wins, 0);
  assert.equal(profile.winRate, null);
  assert.ok(evaluateAchievements(profile).every((item) => item.satisfied === false));
});

test('buildProfile：总数与按阵营胜场与每日配置一致', () => {
  // Win every day across 12 consecutive days.
  const map = consecutiveMap(12, () => true);
  const { storage } = memStorage({ 'greyharbor.daily.challenge.v1': map });
  const profile = buildProfile(storage, TODAY);

  let expectedSociety = 0;
  let expectedCult = 0;
  for (let i = 0; i < 12; i += 1) {
    if (getDailyConfig(shiftDateKey(TODAY, i)).faction === 'society') expectedSociety += 1;
    else expectedCult += 1;
  }
  assert.equal(profile.total, 12);
  assert.equal(profile.wins, 12);
  assert.equal(profile.societyWins, expectedSociety);
  assert.equal(profile.cultWins, expectedCult);
  assert.equal(profile.bestStreak, 12);
});

test('evaluate：基础成就按指标达成，未达成项保留进度', () => {
  // Only 1 day, a loss.
  const lossMap = consecutiveMap(1, () => false);
  const { storage: s1 } = memStorage({ 'greyharbor.daily.challenge.v1': lossMap });
  const lossEval = evaluateAchievements(buildProfile(s1, TODAY));
  assert.equal(byId(lossEval, 'first-step').satisfied, true); // played a game
  assert.equal(byId(lossEval, 'first-win').satisfied, false);
  assert.equal(byId(lossEval, 'first-win').current, 0);

  // 3 consecutive wins → first-win / three-wins / streak-3.
  const winMap = consecutiveMap(3, () => true);
  const { storage: s2 } = memStorage({ 'greyharbor.daily.challenge.v1': winMap });
  const winEval = evaluateAchievements(buildProfile(s2, TODAY));
  for (const id of ['first-win', 'three-wins', 'streak-3']) {
    assert.equal(byId(winEval, id).satisfied, true);
  }
  assert.equal(byId(winEval, 'streak-7').satisfied, false);
});

test('gate：不足 5 局时常胜调查员不解锁；满足前置且胜率达标才解锁', () => {
  const small = consecutiveMap(4, () => true);
  const { storage: s1 } = memStorage({ 'greyharbor.daily.challenge.v1': small });
  const smallEval = evaluateAchievements(buildProfile(s1, TODAY));
  assert.equal(byId(smallEval, 'winrate-60').gatePassed, false);
  assert.equal(byId(smallEval, 'winrate-60').satisfied, false);

  // 6 games, 5 wins (83%) → gate passes, win rate ≥ 60.
  const map = consecutiveMap(6, (i) => i !== 0);
  const { storage: s2 } = memStorage({ 'greyharbor.daily.challenge.v1': map });
  const eval2 = evaluateAchievements(buildProfile(s2, TODAY));
  assert.equal(byId(eval2, 'winrate-60').gatePassed, true);
  assert.equal(byId(eval2, 'winrate-60').satisfied, true);
});

test('sync：首次为满足项写入时间戳；再次同步不覆盖、无新增不写盘', () => {
  const map = consecutiveMap(3, () => true);
  const { storage, writes } = memStorage({ 'greyharbor.daily.challenge.v1': map });
  const t1 = 1700000000000;

  const first = syncAchievements(storage, TODAY, t1);
  const unlockedNow = first.evaluation.filter((e) => e.satisfied).map((e) => e.id);
  assert.ok(unlockedNow.length >= 3);
  assert.equal(writes(), 1);
  for (const id of unlockedNow) {
    assert.equal(first.unlocks[id].unlockedAt, t1);
  }

  // Re-sync later: timestamps stay at t1 and no extra write occurs.
  const second = syncAchievements(storage, TODAY, t1 + 999999);
  assert.equal(writes(), 1);
  for (const id of unlockedNow) {
    assert.equal(second.unlocks[id].unlockedAt, t1);
  }
});

test('buildAchievementWall：汇总解锁数并带上每个解锁时间', () => {
  const map = consecutiveMap(1, () => true);
  const { storage } = memStorage({ 'greyharbor.daily.challenge.v1': map });
  const wall = buildAchievementWall(storage, TODAY, 1700000000000);
  assert.equal(wall.total, ACHIEVEMENTS.length);
  assert.ok(wall.unlockedCount >= 1);
  const unlockedItem = wall.items.find((item) => item.satisfied);
  assert.equal(unlockedItem.unlockedAt, 1700000000000);
  assert.ok(wall.items.some((item) => item.unlockedAt === null));
});

test('坏存档容错：污染的解锁 map 不影响重新计算', () => {
  const { storage } = memStorage({ [ACHIEVEMENT_UNLOCK_KEY]: ['bad'] });
  const wall = buildAchievementWall(storage, TODAY, 1);
  assert.equal(wall.unlockedCount, 0);
});
