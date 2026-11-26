/**
 * tests/codex/codex.test.mjs — pure filter/query logic for the card codex.
 * No DOM; operates on the canonical CARDS table.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { CARD_LIST } from '../../src/engine/v2/cards.js';
import {
  DEFAULT_FILTERS,
  filterCards,
  isDefaultFilters,
  selectCodex,
} from '../../src/codex/codex.mjs';

test('默认筛选：返回全部 34 张卡，顺序与 CARD_LIST 一致', () => {
  const result = filterCards(CARD_LIST, DEFAULT_FILTERS);
  assert.equal(result.length, 34);
  assert.deepEqual(result.map((c) => c.id), CARD_LIST.map((c) => c.id));
});

test('阵营筛选：学会 14、教团 14、中立 6', () => {
  assert.equal(filterCards(CARD_LIST, { faction: 'society' }).length, 14);
  assert.equal(filterCards(CARD_LIST, { faction: 'cult' }).length, 14);
  assert.equal(filterCards(CARD_LIST, { faction: 'neutral' }).length, 6);
  assert.ok(filterCards(CARD_LIST, { faction: 'cult' }).every((c) => c.faction === 'cult'));
});

test('类型筛选：unit 桶含单位与旧神共 18，领袖 6、事件 3', () => {
  const units = filterCards(CARD_LIST, { type: 'unit' });
  assert.equal(units.length, 18);
  assert.ok(units.every((c) => c.type === 'unit' || c.type === 'oldgod'));
  assert.equal(filterCards(CARD_LIST, { type: 'leader' }).length, 6);
  assert.equal(filterCards(CARD_LIST, { type: 'event' }).length, 3);
});

test('地点筛选：现场 7、档案 8、梦境 5', () => {
  assert.equal(filterCards(CARD_LIST, { location: 'scene' }).length, 7);
  assert.equal(filterCards(CARD_LIST, { location: 'archive' }).length, 8);
  assert.equal(filterCards(CARD_LIST, { location: 'dream' }).length, 5);
  assert.ok(filterCards(CARD_LIST, { location: 'dream' }).every((c) => c.location === 'dream'));
});

test('文本搜索：按中文名命中、忽略大小写并去除首尾空格', () => {
  const target = CARD_LIST[0];
  const byName = filterCards(CARD_LIST, { query: target.nameZh });
  assert.ok(byName.some((c) => c.id === target.id));
  const byEn = filterCards(CARD_LIST, { query: `  ${target.nameEn.toUpperCase()}  ` });
  assert.ok(byEn.some((c) => c.id === target.id));
});

test('组合筛选：阵营与类型取交集，结果同时满足两个条件', () => {
  const result = filterCards(CARD_LIST, { faction: 'society', type: 'unit' });
  assert.ok(result.length > 0);
  assert.ok(result.every((c) =>
    c.faction === 'society' && (c.type === 'unit' || c.type === 'oldgod')));
});

test('未知筛选值：返回空数组且不抛错', () => {
  assert.deepEqual(filterCards(CARD_LIST, { faction: 'unknown' }), []);
  assert.deepEqual(filterCards(CARD_LIST, { type: 'nope' }), []);
});

test('selectCodex：返回 total/shown 与过滤后的卡片', () => {
  const view = selectCodex({ faction: 'cult' });
  assert.equal(view.total, 34);
  assert.equal(view.shown, 14);
  assert.equal(view.cards.length, 14);
  assert.equal(view.filters.faction, 'cult');
});

test('isDefaultFilters：默认 true，任一维度收窄后 false', () => {
  assert.equal(isDefaultFilters(DEFAULT_FILTERS), true);
  assert.equal(isDefaultFilters({ faction: 'cult' }), false);
  assert.equal(isDefaultFilters({ query: '  ' }), true);
  assert.equal(isDefaultFilters({ query: 'x' }), false);
});
