/**
 * tests/economy/economy.test.mjs — wallet, gacha, pity and card back inventory
 * contract. Injected random sequences keep every draw deterministic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createStorage } from '../../src/ui-v2/storage.mjs';
import {
  DAILY_COMPLETION_REWARD,
  DAILY_FIRST_WIN_REWARD,
  ECONOMY_KEY,
  EPIC_PITY,
  GACHA_COST,
  RARE_PITY,
  equipCardBack,
  getBalance,
  getCollection,
  getEquippedCardBack,
  grantReward,
  normalizeEconomy,
  pullGacha,
  readEconomy,
} from '../../src/economy/economy.mjs';
import { CARD_BACKS, DEFAULT_CARD_BACK, RARITIES } from '../../src/economy/card-backs.mjs';

function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  const storage = createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  });
  return storage;
}

function seedEconomy(storage, patch) {
  storage.setJson(ECONOMY_KEY, { ...readEconomy(storage), ...patch });
}

function seqRandom(values) {
  const queue = values.slice();
  return () => {
    if (!queue.length) throw new Error('random sequence exhausted');
    return queue.shift();
  };
}

test('默认存档：零货币、仅拥有并装备默认卡背', () => {
  const storage = memStorage();
  assert.equal(getBalance(storage), 0);
  assert.deepEqual(readEconomy(storage).owned, [DEFAULT_CARD_BACK]);
  assert.equal(getEquippedCardBack(storage), DEFAULT_CARD_BACK);
});

test('grantReward：发放且同一 key 幂等不重复', () => {
  const storage = memStorage();
  const first = grantReward(storage, 'daily:2026-11-26:completion', DAILY_COMPLETION_REWARD);
  assert.equal(first.granted, true);
  assert.equal(first.amount, DAILY_COMPLETION_REWARD);
  assert.equal(getBalance(storage), DAILY_COMPLETION_REWARD);
  const again = grantReward(storage, 'daily:2026-11-26:completion', DAILY_COMPLETION_REWARD);
  assert.equal(again.granted, false);
  assert.equal(getBalance(storage), DAILY_COMPLETION_REWARD);
});

test('货币不足：抽卡失败且不扣费', () => {
  const storage = memStorage();
  const result = pullGacha(storage, { random: seqRandom([0, 0]) });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'insufficient');
  assert.equal(getBalance(storage), 0);
});

test('抽卡：注入随机命中普通并新增到库存', () => {
  const storage = memStorage();
  seedEconomy(storage, { coins: GACHA_COST });
  // 0 -> common (roll 0 < 0.7); 0 -> first common back (tide)
  const result = pullGacha(storage, { random: seqRandom([0, 0]) });
  assert.equal(result.ok, true);
  assert.equal(result.rarity, 'common');
  assert.equal(result.id, 'tide');
  assert.equal(result.isNew, true);
  assert.equal(result.coins, 0);
  assert.ok(readEconomy(storage).owned.includes('tide'));
});

test('重复卡背：不重复入库，按稀有度返还货币', () => {
  const storage = memStorage();
  // Own everything so the pulled common back is a duplicate.
  seedEconomy(storage, { coins: GACHA_COST, owned: [DEFAULT_CARD_BACK, ...CARD_BACKS.map((b) => b.id)] });
  const result = pullGacha(storage, { random: seqRandom([0, 0]) });
  assert.equal(result.isNew, false);
  assert.equal(result.duplicateCoins, RARITIES.common.duplicateCoins);
  assert.equal(result.coins, RARITIES.common.duplicateCoins);
});

test('稀有保底：连续未出稀有后，第 10 抽必为稀有及以上', () => {
  const storage = memStorage();
  seedEconomy(storage, { coins: GACHA_COST * 20 });
  // First 9 pulls all common: rarity roll 0 (common), then pick index 0.
  for (let i = 0; i < RARE_PITY - 1; i += 1) {
    const r = pullGacha(storage, { random: seqRandom([0, 0]) });
    assert.equal(r.rarity, 'common');
  }
  assert.equal(readEconomy(storage).pity, RARE_PITY - 1);
  // 10th: pity branch; 0.5 > epicShare -> rare; second value picks rare index.
  const guaranteed = pullGacha(storage, { random: seqRandom([0.5, 0]) });
  assert.notEqual(guaranteed.rarity, 'common');
  assert.equal(readEconomy(storage).pity, 0);
});

test('史诗保底：达到史诗阈值强制史诗', () => {
  const storage = memStorage();
  seedEconomy(storage, { coins: GACHA_COST, epicPity: EPIC_PITY - 1 });
  const result = pullGacha(storage, { random: seqRandom([0, 0]) });
  assert.equal(result.rarity, 'epic');
  assert.equal(readEconomy(storage).epicPity, 0);
});

test('装备：仅可装备已拥有的卡背', () => {
  const storage = memStorage();
  const blocked = equipCardBack(storage, 'oldgod');
  assert.equal(blocked.ok, false);
  assert.equal(getEquippedCardBack(storage), DEFAULT_CARD_BACK);
  seedEconomy(storage, { owned: [DEFAULT_CARD_BACK, 'oldgod'] });
  const ok = equipCardBack(storage, 'oldgod');
  assert.equal(ok.ok, true);
  assert.equal(getEquippedCardBack(storage), 'oldgod');
});

test('getCollection：默认与池内卡背带拥有/装备标记', () => {
  const storage = memStorage();
  const collection = getCollection(storage);
  assert.equal(collection.length, CARD_BACKS.length + 1);
  const defaultItem = collection.find((b) => b.id === DEFAULT_CARD_BACK);
  assert.equal(defaultItem.owned, true);
  assert.equal(defaultItem.equipped, true);
  assert.ok(collection.filter((b) => b.id !== DEFAULT_CARD_BACK).every((b) => b.owned === false));
});

test('默认 PRNG：相同初始存档产出相同抽卡序列并推进 rngState', () => {
  const a = memStorage();
  const b = memStorage();
  seedEconomy(a, { coins: GACHA_COST * 5 });
  seedEconomy(b, { coins: GACHA_COST * 5 });
  const initialRng = readEconomy(a).rngState;
  const seqA = Array.from({ length: 5 }, () => pullGacha(a).id);
  const seqB = Array.from({ length: 5 }, () => pullGacha(b).id);
  assert.deepEqual(seqA, seqB);
  assert.notEqual(readEconomy(a).rngState, initialRng);
});

test('normalizeEconomy：坏 JSON 与非法 id 容错，装备回退默认', () => {
  const cleaned = normalizeEconomy({
    coins: -50,
    owned: ['nope', 'tide', 'tide'],
    equipped: 'ghost',
    granted: null,
  });
  assert.equal(cleaned.coins, 0);
  assert.deepEqual(cleaned.owned, [DEFAULT_CARD_BACK, 'tide']);
  assert.equal(cleaned.equipped, DEFAULT_CARD_BACK);
  assert.deepEqual(cleaned.granted, {});
  assert.deepEqual(normalizeEconomy('broken').owned, [DEFAULT_CARD_BACK]);
});
