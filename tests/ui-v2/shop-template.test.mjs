/**
 * tests/ui-v2/shop-template.test.mjs — gacha shop template contract. No DOM;
 * assertions against escaped HTML built from the real economy state.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createStorage } from '../../src/ui-v2/storage.mjs';
import {
  GACHA_COST,
  getCollection,
  pullGacha,
  readEconomy,
} from '../../src/economy/economy.mjs';
import { renderShop } from '../../src/ui-v2/shop/templates/index.mjs';
import { renderMainMenu } from '../../src/ui-v2/menu/templates/main-menu.mjs';

function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  return createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  });
}

function viewFor(storage, lastResult) {
  const state = readEconomy(storage);
  return {
    coins: state.coins,
    pulls: state.pulls,
    pity: state.pity,
    lastResult,
    collection: getCollection(storage),
  };
}

test('空存档：零余额、抽卡按钮禁用、概率公示与保底说明齐全', () => {
  const storage = memStorage();
  const html = renderShop(viewFor(storage));
  assert.match(html, /神秘商店/);
  assert.match(html, /🪙 0/);
  assert.match(html, /aria-disabled="true"/);
  // probability disclosure: 70% / 22% / 8%
  assert.match(html, /70%/);
  assert.match(html, /22%/);
  assert.match(html, /8%/);
  assert.match(html, /保底/);
  assert.match(html, /data-shop="exit"/);
  assert.match(html, /data-shop="pull"/);
});

test('收藏：默认卡背已拥有并装备，其余未获得', () => {
  const html = renderShop(viewFor(memStorage()));
  assert.match(html, /is-equipped/);
  assert.match(html, /已装备/);
  assert.match(html, /未获得/);
  assert.match(html, /默认卡背/);
});

test('抽卡成功：结果横幅展示新卡背，余额扣减', () => {
  const storage = memStorage();
  storage.setJson('greyharbor.economy.v1', { ...readEconomy(storage), coins: GACHA_COST });
  const result = pullGacha(storage, { random: () => 0 });
  const html = renderShop(viewFor(storage, result));
  assert.equal(result.ok, true);
  assert.match(html, /获得新卡背/);
  assert.match(html, new RegExp(`🪙 ${result.coins}`));
});

test('货币不足：结果横幅提示赚取方式', () => {
  const storage = memStorage();
  const result = pullGacha(storage);
  const html = renderShop(viewFor(storage, result));
  assert.equal(result.ok, false);
  assert.match(html, /理智币不足/);
});

test('主菜单：包含神秘商店入口', () => {
  const html = renderMainMenu();
  assert.match(html, /data-menu-action="start-shop"/);
  assert.match(html, /神秘商店/);
});

test('HTML 转义：卡背名称中的标签不进入结构', () => {
  const storage = memStorage();
  const collection = getCollection(storage).map((item, i) =>
    (i === 0 ? { ...item, name: '<i>x</i>' } : item));
  const html = renderShop({ ...viewFor(storage), collection });
  assert.ok(!html.includes('<i>x</i>'));
  assert.ok(html.includes('&lt;i&gt;x&lt;/i&gt;'));
});
