/**
 * src/economy/skins.mjs — character skin catalogue (pure data).
 *
 * Each of the six leaders has two skins: a `palette` skin (common) that re-tints
 * the existing portrait through a CSS filter with no new artwork, and an `art`
 * skin (rare/epic) backed by a newly generated painting in assets/skins.
 * Rarity drives gacha weights and duplicate compensation.
 */

export const SKIN_KIND = Object.freeze({ PALETTE: 'palette', ART: 'art' });

/**
 * Two skins per character. The palette entry is always common; the art entry is
 * rare for four characters and epic for the two flagship leaders.
 */
export const CHARACTER_SKINS = Object.freeze([
  {
    id: 'harold-ashby-twilight', characterId: 'harold-ashby', name: '暮光督察',
    rarity: 'common', kind: 'palette', icon: '🌇', theme: '暮光',
    filter: 'sepia(0.35) saturate(1.2) hue-rotate(-15deg) brightness(1.05)',
    description: '壁炉暮光染过的旧斗篷，沉稳而温暖',
  },
  {
    id: 'harold-ashby-voidkeeper', characterId: 'harold-ashby', name: '虚空守夜人',
    rarity: 'epic', kind: 'art', icon: '🌌', theme: '虚空',
    description: '巡夜至虚空边界的督察，银徽已凝成星图',
  },
  {
    id: 'enid-halloway-mist', characterId: 'enid-halloway', name: '雾隐档案师',
    rarity: 'common', kind: 'palette', icon: '🌫', theme: '晨雾',
    filter: 'saturate(0.7) brightness(1.1) contrast(0.95) hue-rotate(10deg)',
    description: '港口晨雾里淡去轮廓的档案师',
  },
  {
    id: 'enid-halloway-oracle', characterId: 'enid-halloway', name: '神谕召唤师',
    rarity: 'rare', kind: 'art', icon: '🔮', theme: '神谕',
    description: '书页映出未来的召唤师，卷轴自行盘旋',
  },
  {
    id: 'augustus-wayne-ash', characterId: 'augustus-wayne', name: '灰烬审判官',
    rarity: 'common', kind: 'palette', icon: '🔥', theme: '余烬',
    filter: 'sepia(0.5) saturate(1.4) hue-rotate(-25deg) contrast(1.1)',
    description: '从火刑场余烬中走出的审判官',
  },
  {
    id: 'augustus-wayne-dawn', characterId: 'augustus-wayne', name: '黎明审判官',
    rarity: 'rare', kind: 'art', icon: '🌅', theme: '黎明',
    description: '剑锋迎来第一缕黎明的审判官',
  },
  {
    id: 'elias-thorne-deep', characterId: 'elias-thorne', name: '暗潮祭司',
    rarity: 'common', kind: 'palette', icon: '🌊', theme: '暗潮',
    filter: 'hue-rotate(35deg) saturate(1.3) brightness(0.9)',
    description: '随深海暗潮下沉的祭司，袍角泛着幽蓝',
  },
  {
    id: 'elias-thorne-harbinger', characterId: 'elias-thorne', name: '深渊先兆者',
    rarity: 'epic', kind: 'art', icon: '🐙', theme: '深渊',
    description: '旧神降临前的先兆，面具后已是深渊',
  },
  {
    id: 'vera-crowe-blood', characterId: 'vera-crowe', name: '血色唤灵者',
    rarity: 'common', kind: 'palette', icon: '🩸', theme: '血色',
    filter: 'sepia(0.4) saturate(1.6) hue-rotate(-30deg)',
    description: '门后渗出的血色浸透了黑纱',
  },
  {
    id: 'vera-crowe-veil', characterId: 'vera-crowe', name: '幽纱唤灵者',
    rarity: 'rare', kind: 'art', icon: '🕸', theme: '幽纱',
    description: '换上幽纱长裙的唤灵者，步履无声',
  },
  {
    id: 'gregor-pestilence-blight', characterId: 'gregor-pestilence', name: '腐绿使徒',
    rarity: 'common', kind: 'palette', icon: '☣', theme: '腐绿',
    filter: 'hue-rotate(55deg) saturate(1.3) brightness(1.05)',
    description: '瘟疫孢子染出的腐绿法袍',
  },
  {
    id: 'gregor-pestilence-reaper', characterId: 'gregor-pestilence', name: '敲钟收割者',
    rarity: 'rare', kind: 'art', icon: '💀', theme: '收割',
    description: '钟声一响便开始收割的腐烂使徒',
  },
]);

const BY_ID = Object.freeze(
  Object.fromEntries(CHARACTER_SKINS.map((skin) => [skin.id, skin])),
);

export function getAllSkins() {
  return [...CHARACTER_SKINS];
}

export function getSkin(id) {
  return BY_ID[id] ?? null;
}

export function getSkinsForCharacter(characterId) {
  return CHARACTER_SKINS.filter((skin) => skin.characterId === characterId);
}

export function skinsByRarity(rarity) {
  return CHARACTER_SKINS.filter((skin) => skin.rarity === rarity);
}

export function basePortraitSrc(characterId) {
  return `./assets/art/${encodeURIComponent(characterId)}.jpg`;
}

export function skinArtSrc(skinId) {
  return `./assets/skins/${encodeURIComponent(skinId)}.jpg`;
}

/**
 * Resolve how a character portrait should render. Palette skins reuse the base
 * painting with a CSS filter; art skins swap in the generated image. Returns the
 * base portrait whenever the skin is missing or mismatched.
 */
export function resolvePortrait(characterId, skinId) {
  const fallback = { src: basePortraitSrc(characterId), filter: null, skinId: null };
  if (!skinId) return fallback;
  const skin = BY_ID[skinId];
  if (!skin || skin.characterId !== characterId) return fallback;
  if (skin.kind === SKIN_KIND.ART) {
    return { src: skinArtSrc(skin.id), filter: null, skinId: skin.id };
  }
  return { src: basePortraitSrc(characterId), filter: skin.filter ?? null, skinId: skin.id };
}
