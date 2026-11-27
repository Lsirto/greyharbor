/**
 * tests/report/report.test.mjs — match-report view model contract.
 * Pure functions; clock and summary are injected so assertions are deterministic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReport } from '../../src/report/report.mjs';

function makeInfo({ winner = 0, reason = 'sanity', objectiveType = null, faction = 'society', leader = 'harold-ashby', nights = 2, seed = 'seed-1', scores = [[5, 4], [6, 5]] }) {
  return {
    result: { winner, reason, objectiveType },
    nightHistory: scores.map(([a, b], i) => ({ night: i + 1, scores: [{ total: a }, { total: b }], winner: a >= b ? 0 : 1 })),
    seed,
    matchConfig: { humanFaction: faction, humanLeader: leader, seedMode: 'fixed' },
  };
}

test('人机胜利：胜负、原因、模式、阵营、领袖、夜数与末夜比分正确解析', () => {
  const vm = buildReport(makeInfo({ winner: 0 }), { mode: 'skirmish', now: 1700000000000 });
  assert.equal(vm.outcome.tone, 'win');
  assert.equal(vm.outcome.label, '你获胜');
  assert.equal(vm.reason, '理智归零');
  assert.equal(vm.modeLabel, '人机对战');
  assert.equal(vm.factionLabel, '学会');
  assert.equal(vm.leaderLabel, '哈罗德·阿什比');
  assert.equal(vm.nights, 2);
  assert.equal(vm.nightScore, '6 : 5');
  assert.equal(vm.seedModeLabel, '固定牌局');
  assert.equal(vm.dateLabel, '2023-11-15 06:13');
  assert.equal(vm.record, null);
});

test('对手获胜与平局：语气与文案分别对应', () => {
  const loss = buildReport(makeInfo({ winner: 1 }), { mode: 'arena', now: 1 });
  assert.equal(loss.outcome.tone, 'loss');
  assert.equal(loss.outcome.label, '对手获胜');

  const draw = buildReport(makeInfo({ winner: null }), { mode: 'daily', now: 1 });
  assert.equal(draw.outcome.tone, 'draw');
  assert.equal(draw.outcome.label, '平局');
});

test('目标胜利按 objectiveType 翻译为旧神降临', () => {
  const vm = buildReport(makeInfo({ winner: 1, reason: 'objective', objectiveType: 'doom', faction: 'cult' }), { mode: 'campaign', now: 1 });
  assert.equal(vm.reason, '旧神降临');
  assert.equal(vm.factionLabel, '教团');
});

test('带战绩汇总时带出总场次、胜率与连胜；无汇总则 record 为 null', () => {
  const summary = { total: 10, wins: 6, losses: 3, draws: 1, winRate: 0.6, currentStreak: 3 };
  const vm = buildReport(makeInfo({}), { mode: 'deck', now: 1, summary });
  assert.deepEqual(vm.record, { total: 10, winRateLabel: '60%', currentStreak: 3 });

  const empty = buildReport(makeInfo({}), { mode: 'deck', now: 1, summary: { total: 0, winRate: null, currentStreak: 0 } });
  assert.equal(empty.record, null);
});

test('空 info 容错：不抛错，标签回退中文占位', () => {
  const vm = buildReport({}, { mode: 'weird', now: 0 });
  assert.equal(vm.outcome.tone, 'draw');
  assert.equal(vm.modeLabel, '人机对战');
  assert.equal(vm.factionLabel, '未知阵营');
  assert.equal(vm.leaderLabel, '未选择');
  assert.equal(vm.nights, 0);
  assert.equal(vm.nightScore, '—');
  assert.equal(vm.dateLabel, '—');
  assert.equal(vm.seed, '—');
});
