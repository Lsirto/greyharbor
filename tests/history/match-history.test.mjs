/**
 * tests/history/match-history.test.mjs — cross-mode match history contract.
 * The clock is injected per record, so every aggregation is deterministic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HISTORY_KEY,
  MODES,
  MAX_ENTRIES,
  normalizeMatchEntry,
  readHistory,
  recordMatch,
  summarizeHistory,
  readHistorySummary,
} from '../../src/history/match-history.mjs';
import { createStorage } from '../../src/ui-v2/storage.mjs';

function memStorage() {
  const map = new Map();
  return createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  });
}

function buildInfo({ winner, faction = 'society', leader = 'harold-ashby', reason = 'sanity', nights = 2, seed = 'seed-x' }) {
  return {
    result: { winner, reason },
    nightHistory: Array.from({ length: nights }, (_, i) => ({ night: i + 1 })),
    seed,
    matchConfig: { humanFaction: faction, humanLeader: leader },
  };
}

test('空记录：全部归零，winRate 为 null，分组与近期列表为空', () => {
  const s = summarizeHistory([]);
  assert.equal(s.total, 0);
  assert.equal(s.wins, 0);
  assert.equal(s.losses, 0);
  assert.equal(s.draws, 0);
  assert.equal(s.winRate, null);
  assert.equal(s.currentStreak, 0);
  assert.deepEqual(s.byMode, []);
  assert.deepEqual(s.byFaction, []);
  assert.deepEqual(s.byLeader, []);
  assert.deepEqual(s.recent, []);
});

test('胜/负/平分别计数，胜率按胜场计算', () => {
  const storage = memStorage();
  recordMatch(storage, buildInfo({ winner: 0 }), { mode: 'skirmish', now: 1 });
  recordMatch(storage, buildInfo({ winner: 1 }), { mode: 'skirmish', now: 2 });
  recordMatch(storage, buildInfo({ winner: null }), { mode: 'arena', now: 3 });
  const s = summarizeHistory(readHistory(storage));
  assert.equal(s.total, 3);
  assert.equal(s.wins, 1);
  assert.equal(s.losses, 1);
  assert.equal(s.draws, 1);
  assert.equal(s.winRate, Math.round((1 / 3) * 100) / 100);
});

test('按模式、阵营、领袖分组，组内胜负正确', () => {
  const storage = memStorage();
  recordMatch(storage, buildInfo({ winner: 0, faction: 'society', leader: 'harold-ashby' }), { mode: 'skirmish', now: 1 });
  recordMatch(storage, buildInfo({ winner: 1, faction: 'cult', leader: 'elias-thorne' }), { mode: 'arena', now: 2 });
  recordMatch(storage, buildInfo({ winner: 0, faction: 'cult', leader: 'elias-thorne' }), { mode: 'campaign', now: 3 });

  const s = summarizeHistory(readHistory(storage));
  const byMode = Object.fromEntries(s.byMode.map((g) => [g.key, g]));
  assert.equal(byMode.skirmish.total, 1);
  assert.equal(byMode.skirmish.wins, 1);
  assert.equal(byMode.arena.total, 1);
  assert.equal(byMode.arena.losses, 1);

  const byFaction = Object.fromEntries(s.byFaction.map((g) => [g.key, g]));
  assert.equal(byFaction.cult.total, 2);
  assert.equal(byFaction.society.wins, 1);

  const byLeader = Object.fromEntries(s.byLeader.map((g) => [g.key, g]));
  assert.equal(byLeader['elias-thorne'].total, 2);
  assert.equal(byLeader['elias-thorne'].wins, 1);
});

test('近期列表倒序且按上限截断；当前连胜从最近往前连续计胜', () => {
  const storage = memStorage();
  recordMatch(storage, buildInfo({ winner: 1 }), { mode: 'skirmish', now: 1 });
  recordMatch(storage, buildInfo({ winner: 0 }), { mode: 'skirmish', now: 2 });
  recordMatch(storage, buildInfo({ winner: 0 }), { mode: 'skirmish', now: 3 });
  const s = summarizeHistory(readHistory(storage), { recentLimit: 2 });
  assert.equal(s.recent.length, 2);
  assert.equal(s.recent[0].at, 3); // 最新在前
  assert.equal(s.currentStreak, 2);
});

test('写入超过上限时丢弃最旧记录', () => {
  const storage = memStorage();
  for (let i = 0; i < MAX_ENTRIES + 5; i += 1) {
    recordMatch(storage, buildInfo({ winner: i % 2 === 0 }), { mode: 'skirmish', now: i + 1 });
  }
  const list = readHistory(storage);
  assert.equal(list.length, MAX_ENTRIES);
  assert.equal(list[0].at, 6); // 最早的 5 条已被丢弃
  assert.equal(list[MAX_ENTRIES - 1].at, MAX_ENTRIES + 5);
});

test('坏顶层值与坏条目容错，有效条目仍计入', () => {
  const storage = memStorage();
  storage.setJson(HISTORY_KEY, ['nope']);
  assert.equal(readHistorySummary(storage).total, 0);

  const mixed = memStorage();
  mixed.setJson(HISTORY_KEY, [
    { winner: 0, faction: 'society', leader: 'harold-ashby', mode: 'skirmish', at: 1, nights: 2 },
    { winner: 'bad' },
    null,
    { winner: 1, faction: 'cult', mode: 'daily', at: 2, nights: 1 },
  ]);
  const s = readHistorySummary(mixed);
  assert.equal(s.total, 2);
  assert.equal(s.wins, 1);
  assert.equal(s.losses, 1);
});

test('normalizeMatchEntry：平局记为负胜，未知模式回退人机，阵营回退学会', () => {
  const entry = normalizeMatchEntry(buildInfo({ winner: null }), { mode: 'weird', now: 7 });
  assert.equal(entry.mode, 'skirmish');
  assert.equal(entry.faction, 'society');
  assert.equal(entry.won, false);
  assert.equal(entry.winner, null);
  assert.equal(entry.nights, 2);
  assert.equal(entry.at, 7);
  assert.ok(Object.keys(MODES).includes(entry.mode));
});

test('context 可覆盖阵营与领袖：共享牌组路径从 battleOptions 补全', () => {
  // info.matchConfig 是控制器默认值，战绩层用 context 传入人类牌组真实阵营/领袖。
  const entry = normalizeMatchEntry(
    buildInfo({ winner: 0, faction: 'society', leader: 'harold-ashby' }),
    { mode: 'arena', faction: 'cult', leader: 'eliah-thorne', now: 9 },
  );
  assert.equal(entry.faction, 'cult');
  assert.equal(entry.leader, 'eliah-thorne');
});
