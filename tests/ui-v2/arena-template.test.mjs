/**
 * tests/ui-v2/arena-template.test.mjs — Arena Draft template contract.
 * No DOM; assertions are against escaped HTML strings.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createDraft, getOffers, pickCard, isComplete } from '../../src/arena/draft.mjs';
import { renderArenaScreen } from '../../src/ui-v2/arena/templates/arena.mjs';
import { renderMainMenu } from '../../src/ui-v2/menu/templates/main-menu.mjs';
import { renderFactionSelect } from '../../src/ui-v2/menu/templates/faction-select.mjs';
import { renderCharacterSelect } from '../../src/ui-v2/menu/templates/character-select.mjs';

test('竞技场屏：渲染 3 个候选按钮，data-arena-pick 与当前 offers 一致', () => {
  const draft = createDraft({ faction: 'society', seed: 'tpl-1' });
  const offers = [...getOffers(draft)];
  const html = renderArenaScreen(draft, { offers, leaderName: '守夜督察 · 哈罗德' });
  assert.equal((html.match(/data-arena-pick=/g) ?? []).length, 3);
  for (const id of offers) {
    assert.match(html, new RegExp(`data-arena-pick="${id}"`));
    assert.match(html, new RegExp(`src="\\./assets/art/${id}\\.jpg"`));
  }
  assert.match(html, /第 1 \/ 19 轮/);
  assert.match(html, /守夜督察 · 哈罗德/);
  assert.match(html, /data-arena-exit/);
});

test('竞技场屏：选牌后进度与已选托盘更新，显示份数', () => {
  const draft = createDraft({ faction: 'cult', seed: 'tpl-2' });
  // Keep preferring an already-owned card until one reaches 2 copies.
  while (!draft.picks.some((id) => draft.picks.filter((x) => x === id).length >= 2)) {
    const offers = [...getOffers(draft)];
    const owned = offers.find((id) => draft.picks.includes(id));
    pickCard(draft, owned ?? offers[0]);
  }
  const html = renderArenaScreen(draft, { offers: [...getOffers(draft)] });
  assert.match(html, new RegExp(`第 ${draft.picks.length + 1} \/ 19 轮`));
  assert.match(html, /已选牌组/);
  assert.match(html, new RegExp(`${draft.picks.length} \/ 19`));
  assert.ok(html.includes('×2'));
});

test('主菜单：包含竞技场选牌入口', () => {
  const html = renderMainMenu();
  assert.match(html, /data-menu-action="start-arena"/);
  assert.match(html, /竞技场选牌/);
});

test('arena 标记：阵营屏隐藏种子切换，角色屏按钮文案改为进入选牌', () => {
  const faction = renderFactionSelect({ selected: 'society', arena: true });
  assert.ok(!faction.includes('data-seed-mode'), '竞技场不显示固定/随机种子切换');
  assert.match(faction, /竞技场：选定阵营与调查员后/);

  const character = renderCharacterSelect({ faction: 'society', arena: true });
  assert.match(character, /进入竞技场选牌/);
  assert.ok(!character.includes('data-seed-mode'));

  // Non-arena keeps the toggle and the original button title.
  const normal = renderFactionSelect({ selected: 'society', seedMode: 'fixed' });
  assert.match(normal, /data-seed-mode="fixed"/);
  assert.match(renderCharacterSelect({ faction: 'society' }), /开始对局/);
});

test('HTML 转义：卡牌 id 与领袖名中的标签不能进入 DOM 结构', () => {
  const draft = createDraft({ faction: 'society', seed: 'tpl-escape' });
  const html = renderArenaScreen(draft, {
    offers: [...getOffers(draft)],
    leaderName: '<b>x</b>',
  });
  assert.ok(!html.includes('<b>x</b>'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
});

test('完整流程：自动选满 19 张后 offers 为空，屏幕不再渲染候选', () => {
  const draft = createDraft({ faction: 'society', seed: 'tpl-full' });
  while (!isComplete(draft)) pickCard(draft, getOffers(draft)[0]);
  const html = renderArenaScreen(draft, { offers: [...getOffers(draft)] });
  assert.equal((html.match(/data-arena-pick=/g) ?? []).length, 0);
  assert.match(html, /19 \/ 19/);
});
