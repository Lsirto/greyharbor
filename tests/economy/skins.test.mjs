/**
 * tests/economy/skins.test.mjs — character skin catalogue, skin gacha (single +
 * ten-pull guarantee), independent pity, equip and save migration. Injected
 * random sequences keep every draw deterministic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createStorage } from '../../src/ui-v2/storage.mjs';
import {
  ECONOMY_KEY,
  SKIN_GACHA_COST,
  SKIN_TEN_COST,
  SKIN_TEN_COUNT,
  RARE_PITY,
  EPIC_PITY,
  equipSkin,
  unequipSkin,
  getEquippedSkin,
  getEquippedPortrait,
  getSkinCollection,
  normalizeEconomy,
  pullSkin,
  pullSkinTen,
  readEconomy,
} from '../../src/economy/economy.mjs';
import {
  CHARACTER_SKINS,
  SKIN_KIND,
  basePortraitSrc,
  getSkinsForCharacter,
  resolvePortrait,
  skinArtSrc,
} from '../../src/economy/skins.mjs';

const CHARACTER_IDS = [
  'harold-ashby', 'enid-halloway', 'augustus-wayne', 'madeline-hale',
  'elias-thorne', 'vera-crowe', 'gregor-pestilence',
];

function memStorage() {
  const map = new Map();
  return createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  });
}

function seed(storage, patch) {
  storage.setJson(ECONOMY_KEY, { ...readEconomy(storage), ...patch });
}

test('目录：共 14 款，每角色恰好 2 款且 id 唯一', () => {
  assert.equal(CHARACTER_SKINS.length, 14);
  const ids = CHARACTER_SKINS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const characterId of CHARACTER_IDS) {
    const skins = getSkinsForCharacter(characterId);
    assert.equal(skins.length, 2);
  }
});

test('目录：7 普通均为调色、4 稀有+3 史诗均为新立绘', () => {
  const common = CHARACTER_SKINS.filter((s) => s.rarity === 'common');
  const rare = CHARACTER_SKINS.filter((s) => s.rarity === 'rare');
  const epic = CHARACTER_SKINS.filter((s) => s.rarity === 'epic');
  assert.equal(common.length, 7);
  assert.equal(rare.length, 4);
  assert.equal(epic.length, 3);
  assert.ok(common.every((s) => s.kind === SKIN_KIND.PALETTE && typeof s.filter === 'string'));
  assert.ok([...rare, ...epic].every((s) => s.kind === SKIN_KIND.ART && !s.filter));
});

test('resolvePortrait：无皮肤/调色/新立绘/错配分别正确解析', () => {
  assert.deepEqual(resolvePortrait('harold-ashby', null),
    { src: basePortraitSrc('harold-ashby'), filter: null, skinId: null });
  const palette = resolvePortrait('enid-halloway', 'enid-halloway-mist');
  assert.equal(palette.src, basePortraitSrc('enid-halloway'));
  assert.ok(palette.filter);
  const art = resolvePortrait('harold-ashby', 'harold-ashby-voidkeeper');
  assert.equal(art.src, skinArtSrc('harold-ashby-voidkeeper'));
  assert.equal(art.filter, null);
  // skin belonging to another character falls back to base
  assert.equal(resolvePortrait('harold-ashby', 'enid-halloway-mist').skinId, null);
  assert.equal(resolvePortrait('harold-ashby', 'unknown').skinId, null);
});

test('pullSkin：余额不足失败且不扣费', () => {
  const storage = memStorage();
  const result = pullSkin(storage, { random: () => 0 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'insufficient');
  assert.equal(readEconomy(storage).coins, 0);
});

test('pullSkin：扣费 100 并将新皮肤加入库存', () => {
  const storage = memStorage();
  seed(storage, { coins: SKIN_GACHA_COST });
  const result = pullSkin(storage, { random: () => 0 });
  assert.equal(result.ok, true);
  assert.equal(result.cost, SKIN_GACHA_COST);
  assert.equal(result.isNew, true);
  assert.ok(readEconomy(storage).ownedSkins.includes(result.id));
  assert.equal(readEconomy(storage).coins, 0);
});

test('pullSkin：重复皮肤按稀有度返还理智币', () => {
  const storage = memStorage();
  seed(storage, { coins: SKIN_GACHA_COST, ownedSkins: CHARACTER_SKINS.map((s) => s.id) });
  const result = pullSkin(storage, { random: () => 0 });
  assert.equal(result.isNew, false);
  assert.ok(result.duplicateCoins > 0);
  assert.equal(readEconomy(storage).coins, result.duplicateCoins);
});

test('pullSkinTen：余额不足失败且不扣费', () => {
  const storage = memStorage();
  seed(storage, { coins: SKIN_TEN_COST - 1 });
  const result = pullSkinTen(storage, { random: () => 0 });
  assert.equal(result.ok, false);
  assert.equal(readEconomy(storage).coins, SKIN_TEN_COST - 1);
});

test('pullSkinTen：扣费 1000、产出 10 项，全普通时第 10 项强制稀有及以上', () => {
  const storage = memStorage();
  seed(storage, { coins: SKIN_TEN_COST });
  const result = pullSkinTen(storage, { random: () => 0 });
  assert.equal(result.ok, true);
  assert.equal(result.cost, SKIN_TEN_COST);
  assert.equal(result.count, SKIN_TEN_COUNT);
  assert.equal(result.items.length, SKIN_TEN_COUNT);
  assert.equal(result.guaranteed, true);
  assert.notEqual(result.items[9].rarity, 'common');
  assert.ok(result.items.slice(0, 9).every((i) => i.rarity === 'common'));
});

test('pullSkinTen：前 9 抽已自然出稀有则不强制，guaranteed 为 false', () => {
  const storage = memStorage();
  seed(storage, { coins: SKIN_TEN_COST });
  let calls = 0;
  const random = () => { calls += 1; return calls === 1 ? 0.8 : 0; }; // first rarity roll -> rare
  const result = pullSkinTen(storage, { random });
  assert.equal(result.items[0].rarity, 'rare');
  assert.equal(result.guaranteed, false);
});

test('皮肤保底独立于卡背：十连只推进皮肤计数，卡背 pity 不变', () => {
  const storage = memStorage();
  seed(storage, { coins: SKIN_TEN_COST });
  pullSkinTen(storage, { random: () => 0 });
  const after = readEconomy(storage);
  assert.equal(after.skinPulls, SKIN_TEN_COUNT);
  assert.equal(after.pulls, 0);
  assert.equal(after.pity, 0);
});

test('皮肤稀有保底：连续 9 普通后第 10 单抽为稀有及以上并重置 skinPity', () => {
  const storage = memStorage();
  seed(storage, { coins: SKIN_GACHA_COST * RARE_PITY });
  for (let i = 0; i < RARE_PITY - 1; i += 1) {
    assert.equal(pullSkin(storage, { random: () => 0 }).rarity, 'common');
  }
  assert.equal(readEconomy(storage).skinPity, RARE_PITY - 1);
  const tenth = pullSkin(storage, { random: () => 0.5 });
  assert.notEqual(tenth.rarity, 'common');
  assert.equal(readEconomy(storage).skinPity, 0);
});

test('皮肤史诗保底：达到阈值强制史诗并重置 skinEpicPity', () => {
  const storage = memStorage();
  seed(storage, { coins: SKIN_GACHA_COST, skinEpicPity: EPIC_PITY - 1 });
  const result = pullSkin(storage, { random: () => 0 });
  assert.equal(result.rarity, 'epic');
  assert.equal(readEconomy(storage).skinEpicPity, 0);
});

test('equipSkin：未拥有/角色不符均拒绝，拥有后可装备', () => {
  const storage = memStorage();
  assert.equal(equipSkin(storage, 'harold-ashby', 'harold-ashby-voidkeeper').ok, false);
  seed(storage, { ownedSkins: ['harold-ashby-voidkeeper'] });
  // owned but wrong character
  assert.equal(equipSkin(storage, 'enid-halloway', 'harold-ashby-voidkeeper').ok, false);
  const ok = equipSkin(storage, 'harold-ashby', 'harold-ashby-voidkeeper');
  assert.equal(ok.ok, true);
  assert.equal(getEquippedSkin(storage, 'harold-ashby'), 'harold-ashby-voidkeeper');
});

test('unequipSkin：卸下后还原基础形象，未知角色被拒绝', () => {
  const storage = memStorage();
  seed(storage, {
    ownedSkins: ['harold-ashby-voidkeeper'],
    equippedSkins: { 'harold-ashby': 'harold-ashby-voidkeeper' },
  });
  const result = unequipSkin(storage, 'harold-ashby');
  assert.equal(result.ok, true);
  assert.equal(result.equipped, null);
  assert.equal(getEquippedSkin(storage, 'harold-ashby'), null);
  assert.equal(getEquippedPortrait(storage, 'harold-ashby').src, basePortraitSrc('harold-ashby'));
  assert.equal(unequipSkin(storage, 'no-such-character').ok, false);
});

test('getSkinCollection：带拥有/装备标记，getEquippedPortrait 解析当前皮肤', () => {
  const storage = memStorage();
  seed(storage, {
    ownedSkins: ['harold-ashby-voidkeeper'],
    equippedSkins: { 'harold-ashby': 'harold-ashby-voidkeeper' },
  });
  const collection = getSkinCollection(storage);
  assert.equal(collection.length, CHARACTER_SKINS.length);
  const equipped = collection.find((s) => s.id === 'harold-ashby-voidkeeper');
  assert.equal(equipped.owned, true);
  assert.equal(equipped.equipped, true);
  const portrait = getEquippedPortrait(storage, 'harold-ashby');
  assert.equal(portrait.src, skinArtSrc('harold-ashby-voidkeeper'));
});

test('存档迁移：旧存档补默认皮肤字段，非法 equippedSkins 被清理', () => {
  const migrated = normalizeEconomy({ coins: 80, owned: ['default'], equipped: 'default' });
  assert.equal(migrated.skinPulls, 0);
  assert.deepEqual(migrated.ownedSkins, []);
  assert.deepEqual(migrated.equippedSkins, {});
  const cleaned = normalizeEconomy({
    ownedSkins: ['harold-ashby-voidkeeper'],
    equippedSkins: {
      'harold-ashby': 'harold-ashby-voidkeeper', // valid
      'enid-halloway': 'harold-ashby-voidkeeper', // wrong character
    },
  });
  assert.deepEqual(cleaned.equippedSkins, { 'harold-ashby': 'harold-ashby-voidkeeper' });
});
