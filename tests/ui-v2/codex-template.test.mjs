/**
 * tests/ui-v2/codex-template.test.mjs — codex template contract.
 * No DOM; assertions are against escaped HTML strings.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { CARD_LIST } from '../../src/engine/v2/cards.js';
import { selectCodex } from '../../src/codex/codex.mjs';
import { renderCodex } from '../../src/ui-v2/codex/templates/codex.mjs';
import { renderMainMenu } from '../../src/ui-v2/menu/templates/main-menu.mjs';

test('默认渲染：标题、搜索框、三组筛选与全部 43 张卡', () => {
  const html = renderCodex(selectCodex());
  assert.match(html, /卡牌图鉴/);
  assert.match(html, /data-codex="search"/);
  assert.equal((html.match(/data-dim="faction"/g) ?? []).length, 4);
  assert.equal((html.match(/data-dim="type"/g) ?? []).length, 8);
  assert.equal((html.match(/data-dim="location"/g) ?? []).length, 4);
  assert.equal((html.match(/class="gh2-codex-card /g) ?? []).length, 43);
  assert.match(html, /显示 43 \/ 共 43 张/);
});

test('当前筛选维度的按钮带 is-selected 与 aria-pressed', () => {
  const html = renderCodex(selectCodex({ faction: 'cult' }));
  const cultTag = html.match(/<button[^>]*data-value="cult"[^>]*>/)?.[0] ?? '';
  assert.match(cultTag, /is-selected/);
  assert.match(cultTag, /aria-pressed="true"/);
  // 其余阵营按钮未选中。
  const socTag = html.match(/<button[^>]*data-value="society"[^>]*>/)?.[0] ?? '';
  assert.match(socTag, /aria-pressed="false"/);
});

test('每张卡：卡面图路径、中文名与标签均输出', () => {
  const card = CARD_LIST[0];
  const html = renderCodex(selectCodex());
  assert.match(html, new RegExp(`src="\\./assets/art/${card.id}\\.jpg"`));
  assert.match(html, new RegExp(`data-card-id="${card.id}"`));
  assert.ok(html.includes(card.nameZh));
});

test('筛选后：只渲染命中卡片并更新计数', () => {
  const html = renderCodex(selectCodex({ faction: 'cult' }));
  assert.equal((html.match(/class="gh2-codex-card /g) ?? []).length, 16);
  assert.match(html, /显示 16 \/ 共 43 张/);
});

test('无命中：渲染空状态与清除筛选按钮', () => {
  const html = renderCodex(selectCodex({ query: '不存在的卡牌名xyz' }));
  assert.match(html, /没有符合条件的卡牌/);
  assert.match(html, /data-codex="reset"/);
  assert.equal((html.match(/class="gh2-codex-card /g) ?? []).length, 0);
});

test('搜索词中的 HTML 特殊字符被转义，避免注入', () => {
  const html = renderCodex(selectCodex({ query: '<script>alert(1)</script>' }));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /&lt;script&gt;/);
});

test('主菜单：包含卡牌图鉴入口', () => {
  const html = renderMainMenu();
  assert.match(html, /data-menu-action="start-codex"/);
  assert.match(html, /卡牌图鉴/);
});
