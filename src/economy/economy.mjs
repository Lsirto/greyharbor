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

export const ECONOMY_KEY = 'greyharbor.economy.v1';
export const GACHA_COST = 100;
export const RARE_PITY = 10; // every 10th pull without rare+ is rare+
export const EPIC_PITY = 50; // every 50th pull is epic
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
  return {
    coins: nonNegInt(data.coins, base.coins),
    rngState: Number.isFinite(data.rngState) ? data.rngState >>> 0 : base.rngState,
    pity: nonNegInt(data.pity, base.pity),
    epicPity: nonNegInt(data.epicPity, base.epicPity),
    pulls: nonNegInt(data.pulls, base.pulls),
    owned,
    equipped,
    granted: data.granted && typeof data.granted === 'object' ? { ...data.granted } : {},
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

export { DEFAULT_BACK, CARD_BACKS, RARITIES };
