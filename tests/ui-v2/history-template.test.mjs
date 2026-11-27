/**
 * tests/ui-v2/history-template.test.mjs — career page template contract.
 * No DOM; assertions against escaped HTML strings built from the aggregated
 * career view model produced by the pure history layer.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createStorage } from '../../src/ui-v2/storage.mjs';
import { recordMatch } from '../../src/history/match-history.mjs';
import { buildCareerSummary } from '../../src/history/career.mjs';
import { renderHistory } from '../../src/ui-v2/history/templates/history.mjs';
import { renderMainMenu } from '../../src/ui-v2/menu/templates/main-menu.mjs';

const TODAY = '2026-11-26';

function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  return createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  });
}

function makeInfo({ winner, faction = 'society', leader = null, nights = 2, seed = 'seed-1' }) {
  return {
    result: { winner, reason: 'clue', objectiveType: 'clue' },
    nightHistory: Array.from({ length: nights }, () => ({})),
    seed,
    matchConfig: { humanFaction: faction, humanLeader: leader },
  };
}

function careerOf(storage) {
  return buildCareerSummary(storage, { todayKey: TODAY, now: 1700000200000 });
}

test('空记录：显示空提示与返回按钮，不渲染分组与近期对局', () => {
  const html = renderHistory({ career: careerOf(memStorage()) });
  assert.match(html, /调查员生涯/);
  assert.match(html, /data-history-exit/);
  assert.match(html, /还没有对局记录/);
  assert.ok(!html.includes('gh2-career__row'));
  assert.ok(!html.includes('gh2-history__match '));
});

test('有对局：模式/阵营分组与近期胜负标记正确，胜率按胜场计算', () => {
  const storage = memStorage();
  recordMatch(storage, makeInfo({ winner: 0, faction: 'society', nights: 2 }), { mode: 'skirmish', now: 1700000000000 });
  recordMatch(storage, makeInfo({ winner: 0, faction: 'cult', nights: 3 }), { mode: 'arena', now: 1700000100000 });
  recordMatch(storage, makeInfo({ winner: 1, faction: 'society', nights: 2 }), { mode: 'daily', now: 1700000200000 });

  const html = renderHistory({ career: careerOf(storage) });
  // 总览：3 局，2 胜 1 负，胜率 67%
  assert.match(html, /总场次/);
  assert.match(html, />2<\/b><small>胜/);
  assert.match(html, />1<\/b><small>负/);
  assert.match(html, /67%/);
  // 按模式分组：人机对战 / 竞技场 / 每日挑战
  assert.match(html, /人机对战/);
  assert.match(html, /竞技场/);
  assert.match(html, /每日挑战/);
  // 按阵营分组：学会 / 教团
  assert.match(html, /学会/);
  assert.match(html, /教团/);
  // 近期对局胜负标记
  assert.ok(html.includes('is-win'));
  assert.ok(html.includes('is-loss'));
});

test('生涯板块：收藏资产、成就打卡与三个跳转入口齐全', () => {
  const html = renderHistory({ career: careerOf(memStorage()) });
  assert.match(html, /收藏与资产/);
  assert.match(html, /成就与打卡/);
  assert.match(html, /data-career-nav="achievements"/);
  assert.match(html, /data-career-nav="shop"/);
  assert.match(html, /data-career-nav="daily"/);
});

test('主菜单：包含调查员生涯入口', () => {
  const html = renderMainMenu();
  assert.match(html, /data-menu-action="start-history"/);
  assert.match(html, /调查员生涯/);
});

test('HTML 转义：动态文本中的标签不进入结构', () => {
  const storage = memStorage();
  recordMatch(storage, {
    result: { winner: 0, reason: '<b>r</b>', objectiveType: 'clue' },
    nightHistory: [{}],
    seed: 'seed-x',
    matchConfig: { humanFaction: 'society', humanLeader: null },
  }, { mode: 'skirmish', now: 1700000000000 });
  const html = renderHistory({ career: careerOf(storage) });
  assert.ok(!html.includes('<b>r</b>'));
  assert.ok(html.includes('&lt;b&gt;r&lt;/b&gt;'));
});

test('目标胜利：按 objectiveType 翻译为真相大白 / 旧神降临', () => {
  const storage = memStorage();
  recordMatch(storage, {
    result: { winner: 0, reason: 'objective', objectiveType: 'clue' },
    nightHistory: [{}, {}],
    seed: 's-clue',
    matchConfig: { humanFaction: 'society', humanLeader: null },
  }, { mode: 'skirmish', now: 1700000000000 });
  recordMatch(storage, {
    result: { winner: 1, reason: 'objective', objectiveType: 'doom' },
    nightHistory: [{}],
    seed: 's-doom',
    matchConfig: { humanFaction: 'cult', humanLeader: null },
  }, { mode: 'campaign', now: 1700000100000 });
  const html = renderHistory({ career: careerOf(storage) });
  assert.match(html, /真相大白/);
  assert.match(html, /旧神降临/);
});
