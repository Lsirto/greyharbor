/**
 * src/economy/economy.mjs — wallet + gacha + card back inventory (pure logic).
 *
 * Persists through the shared storage wrapper (localStorage with silent
 * degradation). All randomness is the seeded mulberry32 PRNG, so draws are
 * reproducible and testable; an injected `random` may override it for tests.
 * Cosmetic only — nothing here changes gameplay balance.
 */

import { hashSeed, nextRandom } from '../engine/rng.js';
import {
  CARD_BACKS,
  DEFAULT_BACK,
  DEFAULT_CARD_BACK,
  RARITIES,
  TOTAL_RARITY_WEIGHT,
  cardBacksByRarity,
  getAllCardBacks,
  getCardBack,
} from './card-backs.mjs';
import {
  CHARACTER_SKINS,
  getAllSkins,
  getSkin,
  resolvePortrait,
  skinsByRarity,
} from './skins.mjs';

export const ECONOMY_KEY = 'greyharbor.economy.v1';
export const GACHA_COST = 100;
export const RARE_PITY = 10; // every 10th pull without rare+ is rare+
export const EPIC_PITY = 50; // every 50th pull is epic
export const SKIN_GACHA_COST = 100;
export const SKIN_TEN_COST = 1000; // ten pulls at full price, guaranteed rare+
export const SKIN_TEN_COUNT = 10;
export const DAILY_COMPLETION_REWARD = 40;
export const DAILY_FIRST_WIN_REWARD = 120;

function defaultState() {
  return {
    coins: 0,
    rngState: hashSeed('greyharbor-economy'),
    pity: 0,
    epicPity: 0,
    pulls: 0,
    owned: [DEFAULT_CARD_BACK],
    equipped: DEFAULT_CARD_BACK,
    granted: {},
    skinPulls: 0,
    skinPity: 0,
    skinEpicPity: 0,
    ownedSkins: [],
    equippedSkins: {},
  };
}

function nonNegInt(value, fallback) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback;
}

export function normalizeEconomy(raw) {
  const base = defaultState();
  const data = raw && typeof raw === 'object' ? raw : {};
  const known = (id) => id === DEFAULT_CARD_BACK || getCardBack(id) !== null;
  const owned = Array.isArray(data.owned)
    ? [...new Set(data.owned.filter((id) => typeof id === 'string' && known(id)))]
    : [];
  if (!owned.includes(DEFAULT_CARD_BACK)) owned.unshift(DEFAULT_CARD_BACK);
  const equipped = typeof data.equipped === 'string' && owned.includes(data.equipped)
    ? data.equipped
    : DEFAULT_CARD_BACK;

  const knownSkin = (id) => getSkin(id) !== null;
  const ownedSkins = Array.isArray(data.ownedSkins)
    ? [...new Set(data.ownedSkins.filter((id) => typeof id === 'string' && knownSkin(id)))]
    : [];
  const rawEquippedSkins = data.equippedSkins && typeof data.equippedSkins === 'object'
    ? data.equippedSkins
    : {};
  const equippedSkins = {};
  for (const [characterId, skinId] of Object.entries(rawEquippedSkins)) {
    const skin = typeof skinId === 'string' ? getSkin(skinId) : null;
    if (skin && skin.characterId === characterId && ownedSkins.includes(skinId)) {
      equippedSkins[characterId] = skinId;
    }
  }

  return {
    coins: nonNegInt(data.coins, base.coins),
    rngState: Number.isFinite(data.rngState) ? data.rngState >>> 0 : base.rngState,
    pity: nonNegInt(data.pity, base.pity),
    epicPity: nonNegInt(data.epicPity, base.epicPity),
    pulls: nonNegInt(data.pulls, base.pulls),
    owned,
    equipped,
    granted: data.granted && typeof data.granted === 'object' ? { ...data.granted } : {},
    skinPulls: nonNegInt(data.skinPulls, base.skinPulls),
    skinPity: nonNegInt(data.skinPity, base.skinPity),
    skinEpicPity: nonNegInt(data.skinEpicPity, base.skinEpicPity),
    ownedSkins,
    equippedSkins,
  };
}

export function readEconomy(storage) {
  return normalizeEconomy(storage.getJson(ECONOMY_KEY));
}

function writeEconomy(storage, state) {
  storage.setJson(ECONOMY_KEY, state);
  return state;
}

export function getBalance(storage) {
  return readEconomy(storage).coins;
}

/** Non-idempotent earning for a discrete match event (each win pays once). */
export function addCoins(storage, amount) {
  const state = readEconomy(storage);
  const add = Math.max(0, Math.trunc(Number(amount) || 0));
  state.coins += add;
  writeEconomy(storage, state);
  return { amount: add, coins: state.coins };
}

/** Idempotent reward: the same reward key only ever pays once. */
export function grantReward(storage, rewardKey, amount) {
  const state = readEconomy(storage);
  if (typeof rewardKey !== 'string' || !rewardKey || state.granted[rewardKey] === true) {
    return { granted: false, amount: 0, coins: state.coins };
  }
  const add = Math.max(0, Math.trunc(Number(amount) || 0));
  state.coins += add;
  state.granted[rewardKey] = true;
  writeEconomy(storage, state);
  return { granted: true, amount: add, coins: state.coins };
}

function rollRarity(state, random) {
  if (state.epicPity >= EPIC_PITY) return 'epic';
  if (state.pity >= RARE_PITY) {
    const epicShare = RARITIES.epic.weight / (RARITIES.rare.weight + RARITIES.epic.weight);
    return random() < epicShare ? 'epic' : 'rare';
  }
  const roll = random() * TOTAL_RARITY_WEIGHT;
  let acc = 0;
  for (const rarity of ['common', 'rare', 'epic']) {
    acc += RARITIES[rarity].weight;
    if (roll < acc) return rarity;
  }
  return 'common';
}

export function pullGacha(storage, options = {}) {
  const state = readEconomy(storage);
  if (state.coins < GACHA_COST) {
    return { ok: false, reason: 'insufficient', coins: state.coins, cost: GACHA_COST };
  }
  state.coins -= GACHA_COST;
  state.pulls += 1;
  state.pity += 1;
  state.epicPity += 1;

  const random = typeof options.random === 'function'
    ? options.random
    : () => nextRandom(state);

  const rarity = rollRarity(state, random);
  const pool = cardBacksByRarity(rarity);
  const back = pool[Math.floor(random() * pool.length)];

  if (rarity !== 'common') state.pity = 0;
  if (rarity === 'epic') state.epicPity = 0;

  const isNew = !state.owned.includes(back.id);
  let duplicateCoins = 0;
  if (isNew) {
    state.owned.push(back.id);
  } else {
    duplicateCoins = RARITIES[rarity].duplicateCoins;
    state.coins += duplicateCoins;
  }

  writeEconomy(storage, state);
  return {
    ok: true,
    id: back.id,
    name: back.name,
    rarity,
    isNew,
    duplicateCoins,
    coins: state.coins,
    cost: GACHA_COST,
    pulls: state.pulls,
    pity: state.pity,
  };
}

export function equipCardBack(storage, id) {
  const state = readEconomy(storage);
  if (!state.owned.includes(id)) {
    return { ok: false, reason: 'not-owned', equipped: state.equipped };
  }
  state.equipped = id;
  writeEconomy(storage, state);
  return { ok: true, equipped: id };
}

export function getCollection(storage) {
  const state = readEconomy(storage);
  return getAllCardBacks().map((back) => ({
    ...back,
    owned: state.owned.includes(back.id),
    equipped: state.equipped === back.id,
  }));
}

export function getEquippedCardBack(storage) {
  return readEconomy(storage).equipped;
}

function makeRandom(state, injected) {
  return typeof injected === 'function' ? injected : () => nextRandom(state);
}

function rollSkinRarity(state, random) {
  if (state.skinEpicPity >= EPIC_PITY) return 'epic';
  if (state.skinPity >= RARE_PITY) {
    const epicShare = RARITIES.epic.weight / (RARITIES.rare.weight + RARITIES.epic.weight);
    return random() < epicShare ? 'epic' : 'rare';
  }
  const roll = random() * TOTAL_RARITY_WEIGHT;
  let acc = 0;
  for (const rarity of ['common', 'rare', 'epic']) {
    acc += RARITIES[rarity].weight;
    if (roll < acc) return rarity;
  }
  return 'common';
}

/** One skin draw operating on the in-memory state; caller handles cost + save. */
function drawSkinOnce(state, random, forceRarity = null) {
  state.skinPulls += 1;
  state.skinPity += 1;
  state.skinEpicPity += 1;

  let rarity;
  if (forceRarity === 'rareplus') {
    const epicShare = RARITIES.epic.weight / (RARITIES.rare.weight + RARITIES.epic.weight);
    rarity = random() < epicShare ? 'epic' : 'rare';
  } else {
    rarity = rollSkinRarity(state, random);
  }

  const pool = skinsByRarity(rarity);
  const skin = pool[Math.floor(random() * pool.length)];

  if (rarity !== 'common') state.skinPity = 0;
  if (rarity === 'epic') state.skinEpicPity = 0;

  const isNew = !state.ownedSkins.includes(skin.id);
  let duplicateCoins = 0;
  if (isNew) {
    state.ownedSkins.push(skin.id);
  } else {
    duplicateCoins = RARITIES[rarity].duplicateCoins;
    state.coins += duplicateCoins;
  }

  return {
    id: skin.id,
    characterId: skin.characterId,
    name: skin.name,
    rarity,
    kind: skin.kind,
    icon: skin.icon,
    isNew,
    duplicateCoins,
  };
}

export function pullSkin(storage, options = {}) {
  const state = readEconomy(storage);
  if (state.coins < SKIN_GACHA_COST) {
    return { ok: false, reason: 'insufficient', coins: state.coins, cost: SKIN_GACHA_COST };
  }
  state.coins -= SKIN_GACHA_COST;
  const random = makeRandom(state, options.random);
  const item = drawSkinOnce(state, random, null);
  writeEconomy(storage, state);
  return {
    ok: true,
    ...item,
    coins: state.coins,
    cost: SKIN_GACHA_COST,
    pulls: state.skinPulls,
    pity: state.skinPity,
  };
}

export function pullSkinTen(storage, options = {}) {
  const state = readEconomy(storage);
  if (state.coins < SKIN_TEN_COST) {
    return { ok: false, reason: 'insufficient', coins: state.coins, cost: SKIN_TEN_COST };
  }
  state.coins -= SKIN_TEN_COST;
  const random = makeRandom(state, options.random);

  const items = [];
  for (let i = 0; i < SKIN_TEN_COUNT - 1; i += 1) {
    items.push(drawSkinOnce(state, random, null));
  }
  const hasRare = items.some((item) => item.rarity !== 'common');
  // The final draw is forced to rare+ only when the first nine had none.
  items.push(drawSkinOnce(state, random, hasRare ? null : 'rareplus'));

  writeEconomy(storage, state);
  return {
    ok: true,
    items,
    count: items.length,
    newCount: items.filter((item) => item.isNew).length,
    duplicateCoins: items.reduce((sum, item) => sum + item.duplicateCoins, 0),
    guaranteed: !hasRare,
    coins: state.coins,
    cost: SKIN_TEN_COST,
    pulls: state.skinPulls,
    pity: state.skinPity,
  };
}

export function equipSkin(storage, characterId, skinId) {
  const state = readEconomy(storage);
  const skin = getSkin(skinId);
  if (!skin || skin.characterId !== characterId || !state.ownedSkins.includes(skinId)) {
    return {
      ok: false,
      reason: 'not-owned',
      equipped: state.equippedSkins[characterId] ?? null,
    };
  }
  state.equippedSkins[characterId] = skinId;
  writeEconomy(storage, state);
  return { ok: true, characterId, equipped: skinId };
}

export function getSkinCollection(storage) {
  const state = readEconomy(storage);
  return getAllSkins().map((skin) => ({
    ...skin,
    owned: state.ownedSkins.includes(skin.id),
    equipped: state.equippedSkins[skin.characterId] === skin.id,
  }));
}

export function getEquippedSkin(storage, characterId) {
  return readEconomy(storage).equippedSkins[characterId] ?? null;
}

export function getEquippedPortrait(storage, characterId) {
  return resolvePortrait(characterId, getEquippedSkin(storage, characterId));
}

export {
  DEFAULT_BACK,
  CARD_BACKS,
  RARITIES,
  CHARACTER_SKINS,
  getSkin,
  resolvePortrait,
};
