/**
 * tests/daily/stats.test.mjs — Daily Challenge aggregation contract.
 * Fixed reference day (2026-11-26) keeps every assertion deterministic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  readDailyStats,
  shiftDateKey,
  summarizeDailyRecords,
} from '../../src/daily/stats.mjs';
import { DAILY_RECORD_KEY } from '../../src/daily/daily.mjs';
import { createStorage } from '../../src/ui-v2/storage.mjs';

function memStorage() {
  const map = new Map();
  return createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  });
}

function buildMap(spec) {
  // spec: [ [dateKey, won], ... ]
  const out = {};
  for (const [dateKey, won] of spec) out[dateKey] = { won };
  return out;
}

test('shiftDateKey：跨天/跨月/跨年/月末，UTC 无 DST 漂移', () => {
  assert.equal(shiftDateKey('2026-11-26', 1), '2026-11-27');
  assert.equal(shiftDateKey('2026-11-30', 1), '2026-12-01');
  assert.equal(shiftDateKey('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftDateKey('2026-02-28', 1), '2026-03-01'); // 2026 非闰年
  assert.equal(shiftDateKey('2026-11-26', -7), '2026-11-19');
});

test('空记录：全部归零，winRate 为 null，recent 为空', () => {
  const s = summarizeDailyRecords({}, '2026-11-26');
  assert.deepEqual({ ...s }, {
    total: 0, wins: 0, losses: 0, winRate: null,
    currentStreak: 0, bestStreak: 0, recent: [],
  });
});

test('累计场次/胜负/胜率正确', () => {
  const s = summarizeDailyRecords(buildMap([
    ['2026-11-23', true],
    ['2026-11-24', true],
    ['2026-11-25', false],
    ['2026-11-26', true],
  ]), '2026-11-26');
  assert.equal(s.total, 4);
  assert.equal(s.wins, 3);
  assert.equal(s.losses, 1);
  assert.equal(s.winRate, 0.75);
});

test('当前连续：含今天连续计数；今天未打从昨天起算不断；缺一天即断', () => {
  // 24,25,26 consecutive → 3
  assert.equal(summarizeDailyRecords(buildMap([
    ['2026-11-24', true], ['2026-11-25', true], ['2026-11-26', false],
  ]), '2026-11-26').currentStreak, 3);

  // today (26) not played, 25 present → streak 1, not broken
  assert.equal(summarizeDailyRecords(buildMap([
    ['2026-11-25', true],
  ]), '2026-11-26').currentStreak, 1);

  // 23,24 present, 25 missing, 26 present → current only 1
  assert.equal(summarizeDailyRecords(buildMap([
    ['2026-11-23', true], ['2026-11-24', true], ['2026-11-26', true],
  ]), '2026-11-26').currentStreak, 1);
});

test('最长连续：多段运行取最大，且不与当前连续混淆', () => {
  const s = summarizeDailyRecords(buildMap([
    ['2026-11-20', true], ['2026-11-21', true], ['2026-11-22', true], // run 3
    ['2026-11-24', false], ['2026-11-25', false], // run 2
  ]), '2026-11-26');
  assert.equal(s.bestStreak, 3);
  assert.equal(s.currentStreak, 2); // 24,25; today 26 not done
});

test('recent：日期倒序且按上限截断', () => {
  const spec = [];
  for (let i = 0; i < 12; i += 1) {
    spec.push([shiftDateKey('2026-11-15', i), i % 2 === 0]);
  }
  const s = summarizeDailyRecords(buildMap(spec), '2026-11-26', { recentLimit: 5 });
  assert.equal(s.recent.length, 5);
  assert.equal(s.recent[0].dateKey, '2026-11-26');
  assert.equal(s.recent[4].dateKey, '2026-11-22');
  // 2026-11-26 corresponds to i=11 (odd), won = i%2===0 → false
  assert.equal(s.recent[0].won, false);
});

test('readDailyStats：经存档读取并汇总；坏 map/坏条目容错', () => {
  const storage = memStorage();
  storage.setJson(DAILY_RECORD_KEY, buildMap([
    ['2026-11-25', true], ['2026-11-26', false],
  ]));
  const s = readDailyStats(storage, '2026-11-26');
  assert.equal(s.total, 2);
  assert.equal(s.currentStreak, 2);

  // malformed top-level value → treated as empty
  const broken = memStorage();
  broken.setJson(DAILY_RECORD_KEY, ['nope']);
  assert.equal(readDailyStats(broken, '2026-11-26').total, 0);

  // malformed entries are filtered, valid ones still counted
  const mixed = summarizeDailyRecords({
    '2026-11-25': { won: true },
    '2026-11-24': ['bad'],
    '2026-11-23': { other: 1 },
  }, '2026-11-26');
  assert.equal(mixed.total, 1);
  assert.equal(mixed.currentStreak, 1);
});
