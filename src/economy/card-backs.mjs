/**
 * src/economy/card-backs.mjs — card back catalogue (pure data).
 *
 * Card backs are cosmetic and rendered entirely with CSS (no image assets): the
 * matching `.gh2-card--back-<id>` rules style the face-down frame. Rarity drives
 * gacha weights and duplicate compensation. The default back is owned by
 * everyone and never appears in the gacha pool.
 */

export const DEFAULT_CARD_BACK = 'default';

export const RARITIES = Object.freeze({
  common: { id: 'common', weight: 70, duplicateCoins: 10, label: '普通' },
  rare: { id: 'rare', weight: 22, duplicateCoins: 30, label: '稀有' },
  epic: { id: 'epic', weight: 8, duplicateCoins: 60, label: '史诗' },
});

/** Gacha pool only (default excluded). */
export const CARD_BACKS = Object.freeze([
  { id: 'tide', name: '潮汐纹', rarity: 'common', icon: '🌊', description: '灰港潮水的朴素纹样' },
  { id: 'ember', name: '余烬纹', rarity: 'common', icon: '🔥', description: '壁炉余烬，温暖而普通' },
  { id: 'mist', name: '迷雾纹', rarity: 'common', icon: '🌫', description: '港口晨雾，模糊难辨' },
  { id: 'sigil', name: '守夜印记', rarity: 'rare', icon: '🕯', description: '守夜人留下的蜡封印记' },
  { id: 'lantern', name: '提灯纹', rarity: 'rare', icon: '🏮', description: '灯塔指引，稀有纹样' },
  { id: 'abyss', name: '深渊纹', rarity: 'rare', icon: '🌀', description: '凝视深渊的回旋纹路' },
  { id: 'voidcrown', name: '虚空冠冕', rarity: 'epic', icon: '👑', description: '传闻中虚空王者的冠冕' },
  { id: 'oldgod', name: '旧神之眼', rarity: 'epic', icon: '🦑', description: '旧神注视，极其罕见' },
]);

export const DEFAULT_BACK = Object.freeze({
  id: DEFAULT_CARD_BACK,
  name: '默认卡背',
  rarity: 'common',
  icon: '🌙',
  description: '灰港标准卡背，人人拥有',
});

const BY_ID = Object.freeze(
  Object.fromEntries([DEFAULT_BACK, ...CARD_BACKS].map((back) => [back.id, back])),
);

export function getAllCardBacks() {
  return [DEFAULT_BACK, ...CARD_BACKS];
}

export function getCardBack(id) {
  return BY_ID[id] ?? null;
}

export function cardBacksByRarity(rarity) {
  return CARD_BACKS.filter((back) => back.rarity === rarity);
}

/** Sum of rarity weights (used to normalize the rarity roll). */
export const TOTAL_RARITY_WEIGHT = Object.values(RARITIES)
  .reduce((sum, rarity) => sum + rarity.weight, 0);
