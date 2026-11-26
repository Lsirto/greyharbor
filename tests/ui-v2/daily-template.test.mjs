/**
 * tests/ui-v2/daily-template.test.mjs — Daily Challenge intro template contract.
 * No DOM; assertions are against escaped HTML strings.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { getDailyConfig } from '../../src/daily/daily.mjs';
import { summarizeDailyRecords } from '../../src/daily/stats.mjs';
import { getCharacterCard } from '../../src/ui-v2/menu/templates/character-select.mjs';
import { renderDailyIntro } from '../../src/ui-v2/daily/templates/index.mjs';
import { renderMainMenu } from '../../src/ui-v2/menu/templates/main-menu.mjs';

function build(date, record, stats) {
  const config = getDailyConfig(date);
  const leader = getCharacterCard(config.leader) ?? { id: config.leader };
  return renderDailyIntro({ config, leader, record, stats });
}

test('介绍屏：日期、阵营、领袖立绘与开始/返回按钮齐全', () => {
  const html = build('2026-11-26', null);
  const config = getDailyConfig('2026-11-26');
  assert.match(html, /每日挑战/);
  assert.match(html, /2026-11-26/);
  assert.match(html, new RegExp(`src="\\./assets/art/${config.leader}\\.jpg"`));
  assert.match(html, /data-daily-start/);
  assert.match(html, /data-daily-exit/);
  assert.match(html, /开始今日挑战/);
  assert.match(html, /今日尚未完成/);
});

test('已完成记录：胜/负显示对应状态，按钮文案变为再次挑战', () => {
  const win = build('2026-11-26', { won: true });
  assert.match(win, /今日已挑战 · 胜利/);
  assert.match(win, /再次挑战今日对局/);

  const loss = build('2026-11-26', { won: false });
  assert.match(loss, /今日已挑战 · 失利/);
});

test('统计面板：无战绩显示空态；有战绩显示连续/胜率与历史胜负', () => {
  const empty = build('2026-11-26', null);
  assert.match(empty, /最近战绩/);
  assert.match(empty, /还没有战绩/);

  const recordMap = {
    '2026-11-25': { won: true },
    '2026-11-26': { won: false },
  };
  const stats = summarizeDailyRecords(recordMap, '2026-11-26');
  const html = build('2026-11-26', { won: false }, stats);
  assert.match(html, /当前连续/);
  assert.match(html, /最长连续/);
  assert.match(html, /累计场次/);
  assert.match(html, /50%/);
  assert.match(html, /2026-11-25/);
  assert.match(html, /is-win/);
});

test('主菜单：包含每日挑战入口', () => {
  const html = renderMainMenu();
  assert.match(html, /data-menu-action="start-daily"/);
  assert.match(html, /每日挑战/);
});

test('HTML 转义：动态文本中的标签不能进入 DOM 结构', () => {
  const config = getDailyConfig('2026-11-26');
  const injected = { id: config.leader, title: '<b>x</b>', nameZh: 'a', icon: '' };
  const html = renderDailyIntro({ config, leader: injected, record: null });
  assert.ok(!html.includes('<b>x</b>'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
});
