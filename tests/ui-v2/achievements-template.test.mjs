/**
 * tests/ui-v2/achievements-template.test.mjs — achievement wall template
 * contract. No DOM; assertions against escaped HTML strings.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAchievementWall } from '../../src/achievements/achievements.mjs';
import { shiftDateKey } from '../../src/daily/stats.mjs';
import { createStorage } from '../../src/ui-v2/storage.mjs';
import { renderAchievements } from '../../src/ui-v2/achievements/templates/index.mjs';
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

test('空战绩：全部锁定，显示 0 / N，含返回按钮', () => {
  const wall = buildAchievementWall(memStorage(), TODAY, 1700000000000);
  const html = renderAchievements({ wall });
  assert.match(html, /成就墙/);
  assert.match(html, new RegExp(`已解锁 0 / ${wall.total}`));
  assert.match(html, /data-ach-exit/);
  assert.ok(html.includes('is-locked'));
  assert.ok(!html.includes('is-unlocked'));
});

test('有战绩：解锁项高亮并显示解锁日期，未解锁显示进度', () => {
  const dailyMap = {};
  dailyMap[TODAY] = { won: true };
  const storage = memStorage({ 'greyharbor.daily.challenge.v1': dailyMap });
  const wall = buildAchievementWall(storage, TODAY, 1700000000000);
  const html = renderAchievements({ wall });

  assert.match(html, new RegExp(`已解锁 ${wall.unlockedCount} / ${wall.total}`));
  assert.ok(html.includes('is-unlocked'));
  // unlocked caption uses the injected timestamp in local time (UTC+8 → 2023-11-15)
  assert.match(html, /已解锁 · 2023-11-15/);
  // a locked item still shows numeric progress
  assert.match(html, /gh2-ach__progress/);
});

test('前置未满足的成就显示前置提示', () => {
  const dailyMap = { [TODAY]: { won: true } };
  const storage = memStorage({ 'greyharbor.daily.challenge.v1': dailyMap });
  const wall = buildAchievementWall(storage, TODAY, 1700000000000);
  const html = renderAchievements({ wall });
  assert.match(html, /需先满足前置条件/);
});

test('主菜单：包含成就墙入口', () => {
  const html = renderMainMenu();
  assert.match(html, /data-menu-action="start-achievements"/);
  assert.match(html, /成就墙/);
});

test('HTML 转义：动态文本中的标签不进入结构', () => {
  const storage = memStorage();
  const wall = buildAchievementWall(storage, TODAY, 1);
  // tamper one definition's rendered text via a wrapped wall item
  const tampered = {
    ...wall,
    items: wall.items.map((item, i) => (i === 0
      ? { ...item, def: { ...item.def, name: '<b>x</b>' } }
      : item)),
  };
  const html = renderAchievements({ wall: tampered });
  assert.ok(!html.includes('<b>x</b>'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
});
