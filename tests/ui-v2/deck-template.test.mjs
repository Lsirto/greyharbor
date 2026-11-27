/**
 * tests/ui-v2/deck-template.test.mjs — deck editor template contract.
 * No DOM; assertions are against escaped HTML strings.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addCard,
  createEditor,
  poolFor,
  setFaction,
  totalCount,
} from '../../src/deck/editor.mjs';
import { renderDeckEditor } from '../../src/ui-v2/deck/templates/deck.mjs';
import { renderMainMenu } from '../../src/ui-v2/menu/templates/main-menu.mjs';

function fillEditor(editor) {
  for (const card of poolFor(editor.faction)) {
    if (totalCount(editor) >= 19) break;
    addCard(editor, card.id);
    if (totalCount(editor) < 19) addCard(editor, card.id);
  }
  return editor;
}

test('空编辑器：2 阵营、3 领袖、18 个加卡按钮，出战禁用且提示未完成', () => {
  const html = renderDeckEditor(createEditor());
  assert.equal((html.match(/data-deck="faction"/g) ?? []).length, 2);
  assert.equal((html.match(/data-deck="leader"/g) ?? []).length, 3);
  assert.equal((html.match(/data-deck="add"/g) ?? []).length, 18);
  assert.match(html, /data-deck="exit"/);
  assert.match(html, /data-deck="save"/);
  assert.match(html, /牌组尚未完成/);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /0\/19/);
});

test('加卡后：当前牌组出现该卡与减卡按钮，计数更新', () => {
  const editor = createEditor();
  const id = poolFor('society')[0].id;
  addCard(editor, id);
  const html = renderDeckEditor(editor);
  assert.match(html, new RegExp(`data-deck="remove" data-card="${id}"`));
  assert.match(html, /1\/19/);
  assert.match(html, /×1/);
});

test('满 19 张：显示合法状态，出战按钮可用', () => {
  const html = renderDeckEditor(fillEditor(createEditor()));
  assert.match(html, /牌组合法/);
  assert.match(html, /19\/19/);
  const start = html.match(/data-deck="start"[^>]*/)[0];
  assert.ok(!start.includes('disabled'));
  // 所有加卡按钮在满牌时禁用。
  assert.equal((html.match(/data-deck="add"[^>]*disabled/g) ?? []).length, 18);
});

test('切换阵营：领袖与卡池随之更换，选择被清空', () => {
  const editor = createEditor({ faction: 'society' });
  addCard(editor, poolFor('society')[0].id);
  setFaction(editor, 'cult');
  const html = renderDeckEditor(editor);
  assert.match(html, /elias-thorne/);
  assert.match(html, /0\/19/);
  assert.ok(!html.includes('data-deck="remove"'));
});

test('saved 标记：保存后按钮文案变为已保存', () => {
  assert.match(renderDeckEditor(createEditor(), { saved: true }), /已保存 ✓/);
  assert.match(renderDeckEditor(createEditor()), /保存牌组/);
});

test('主菜单：包含卡组编辑器入口', () => {
  const html = renderMainMenu();
  assert.match(html, /data-menu-action="start-deck"/);
  assert.match(html, /卡组编辑器/);
});

test('推荐套：渲染一键载入区，含本阵营 2 个载入按钮', () => {
  const society = renderDeckEditor(createEditor({ faction: 'society' }));
  assert.match(society, /一键载入推荐套/);
  assert.match(society, /data-deck="load-preset" data-preset="society"/);
  assert.match(society, /data-deck="load-preset" data-preset="society-aggro"/);
  const cult = renderDeckEditor(createEditor({ faction: 'cult' }));
  assert.match(cult, /data-deck="load-preset" data-preset="cult-madness"/);
});
