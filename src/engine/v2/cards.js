/**
 * Greyharbor v2.2 — canonical card data + preset decks.
 *
 * The single source of truth for numbers / types / keywords is
 * `src/data/card-table.normalized.json`.  This module loads it once, maps the
 * Chinese keyword labels to the canonical English ids used by the engine, and
 * assembles the two v1 preset decks exactly as listed in rules §10.
 *
 * Browsers are not a target of the v2 headless engine; Node's fs is used so
 * that the JSON stays the only source of truth (no duplicated card table).
 */

import { readFileSync } from 'node:fs';

import { validateDeck, DECK_ERROR_CODES } from './deck-validation.js';

const DATA_URL = new URL('../../data/card-table.normalized.json', import.meta.url);

const KEYWORD_MAP = Object.freeze({
  隐秘: 'stealth',
  封印: 'seal',
  连锁: 'chain',
  理智反噬: 'backlash',
  腐化: 'corruption',
  献祭: 'sacrifice',
});

const RAW_CARDS = JSON.parse(readFileSync(DATA_URL, 'utf8'));

function normalizeCard(raw) {
  const keywordsZh = Array.isArray(raw.keywords) ? raw.keywords.slice() : [];
  const keywords = keywordsZh.map((word) => KEYWORD_MAP[word] ?? word);
  return Object.freeze({
    id: raw.id,
    name: raw.nameEn,
    nameEn: raw.nameEn,
    nameZh: raw.nameZh,
    faction: raw.faction,
    type: raw.type,
    location: raw.location,
    reasonPower: raw.reasonPower,
    madnessPower: raw.madnessPower,
    keywords: Object.freeze(keywords),
    keywordsZh: Object.freeze(keywordsZh),
    sanityCost: raw.sanityCost ?? 0,
    copies: raw.copies ?? 1,
    effect: raw.effect ?? '',
    flavor: raw.flavor ?? '',
  });
}

export const CARDS = Object.freeze(
  Object.fromEntries(RAW_CARDS.map((raw) => [raw.id, normalizeCard(raw)])),
);

export const CARD_LIST = Object.freeze(Object.values(CARDS));

/** Rules §10.1 — 1 leader + 19 non-leader cards. */
const SOCIETY_DECK = Object.freeze([
  ['nora-wells', 2],
  ['samuel-pike', 2],
  ['edith-barrow', 1],
  ['walter-morse', 1],
  ['lucia-vaughn', 1],
  ['frank-holt', 1],
  ['arthur-pendleton', 1],
  ['abjuration', 1],
  ['warding-rite', 1],
  ['silver-lantern', 1],
  ['old-library', 1],
  ['finn-calloway', 1],
  ['silas-gold', 2],
  ['thousand-eyes', 1],
  ['unexpected-aid', 1],
  ['stormy-night', 1],
]);

/** Rules §10.2 — 1 leader + 19 non-leader cards. */
const CULT_DECK = Object.freeze([
  ['hooded-acolyte', 2],
  ['zealot', 2],
  ['sea-priestess', 1],
  ['gravedigger', 1],
  ['whisperer', 1],
  ['deep-one', 1],
  ['bell-claw', 1],
  ['seance', 1],
  ['tide-ritual', 1],
  ['lunar-eclipse', 1],
  ['drowned-altar', 1],
  ['finn-calloway', 1],
  ['silas-gold', 1],
  ['the-sleeper', 1],
  ['thousand-eyes', 1],
  ['stormy-night', 1],
  ['unexpected-aid', 1],
]);

/** 学会强攻：高战力单位 + 双装备，正面点数碾压，不含解场与据点。 */
const SOCIETY_AGGRO_DECK = Object.freeze([
  ['frank-holt', 2],
  ['samuel-pike', 2],
  ['walter-morse', 2],
  ['the-sleeper', 1],
  ['thousand-eyes', 1],
  ['arthur-pendleton', 1],
  ['finn-calloway', 1],
  ['lucia-vaughn', 1],
  ['nora-wells', 1],
  ['edith-barrow', 1],
  ['silas-gold', 1],
  ['brass-badge', 1],
  ['silver-lantern', 1],
  ['unexpected-aid', 1],
  ['warding-rite', 1],
  ['stormy-night', 1],
]);

/** 教团狂袭：高疯狂面单位 + 削弱与献祭，主动走低理智抢节奏。 */
const CULT_MADNESS_DECK = Object.freeze([
  ['hooded-acolyte', 2],
  ['zealot', 1],
  ['deep-one', 1],
  ['whisperer', 1],
  ['bell-claw', 1],
  ['sea-priestess', 1],
  ['gravedigger', 1],
  ['finn-calloway', 1],
  ['silas-gold', 1],
  ['the-sleeper', 1],
  ['thousand-eyes', 1],
  ['bone-ward', 1],
  ['drowning-curse', 1],
  ['brass-badge', 1],
  ['lunar-eclipse', 1],
  ['stormy-night', 1],
  ['unexpected-aid', 1],
  ['drowned-altar', 1],
]);

function expand(entries) {
  return Object.freeze(entries.flatMap(([id, count]) => Array(count).fill(id)));
}

/** Keep the historical preset error wording while delegating all checks to the validator. */
function presetErrorMessage(id, error, summary) {
  switch (error.code) {
    case DECK_ERROR_CODES.MALFORMED_INPUT:
      return `preset ${id} has malformed deck input`;
    case DECK_ERROR_CODES.UNKNOWN_CARD:
      return `preset ${id} references unknown card ${error.cardId}`;
    case DECK_ERROR_CODES.LEADER_INVALID:
      return `preset ${id} has an invalid leader ${error.cardId}`;
    case DECK_ERROR_CODES.LEADER_IN_ENTRIES:
      return `preset ${id} contains leader ${error.cardId}`;
    case DECK_ERROR_CODES.FACTION_MISMATCH:
      return `preset ${id} contains out-of-faction card ${error.cardId}`;
    case DECK_ERROR_CODES.COPY_LIMIT:
      return `preset ${id} contains more than 2 copies of ${error.cardId}`;
    case DECK_ERROR_CODES.NON_LEADER_COUNT:
      return `preset ${id} must contain 19 non-leader cards, got ${summary.nonLeaderCount}`;
    case DECK_ERROR_CODES.TOTAL_COUNT:
      return `preset ${id} must contain 20 cards, got ${summary.total}`;
    default:
      return `preset ${id} failed deck validation: ${error.message}`;
  }
}

function buildPreset({ id, name, nameZh, descZh, faction, leader, entries }) {
  const validation = validateDeck({ faction, leader, entries }, CARDS);
  if (!validation.ok) {
    throw new Error(presetErrorMessage(id, validation.errors[0], validation.summary));
  }
  const cards = expand(entries);
  return Object.freeze({ id, name, nameZh, descZh, faction, leader, cards });
}

const societyDefault = buildPreset({
  id: 'society',
  name: 'Society',
  nameZh: '守夜人',
  descZh: '稳健均衡，解场与据点兼顾，适合第一次上手。',
  faction: 'society',
  leader: 'harold-ashby',
  entries: SOCIETY_DECK,
});

const societyAggro = buildPreset({
  id: 'society-aggro',
  name: 'Society Aggro',
  nameZh: '强攻阵线',
  descZh: '高战力单位配双装备，靠正面点数一路碾压。',
  faction: 'society',
  leader: 'harold-ashby',
  entries: SOCIETY_AGGRO_DECK,
});

const cultDefault = buildPreset({
  id: 'cult',
  name: 'Cult',
  nameZh: '深海教团',
  descZh: '稳健均衡，仪式与环境配合，适合第一次上手。',
  faction: 'cult',
  leader: 'elias-thorne',
  entries: CULT_DECK,
});

const cultMadness = buildPreset({
  id: 'cult-madness',
  name: 'Cult Madness',
  nameZh: '狂乱深渊',
  descZh: '高疯狂面单位配削弱献祭，主动压低理智抢节奏。',
  faction: 'cult',
  leader: 'elias-thorne',
  entries: CULT_MADNESS_DECK,
});

/** 每阵营的默认套，保留单对象形态，供引擎、每日、战役等既有调用使用。 */
export const PRESET_DECKS = Object.freeze({
  society: societyDefault,
  cult: cultDefault,
});

/** 每阵营的全部推荐套，按展示顺序排列，供选牌界面与卡组编辑器使用。 */
export const PRESET_GROUPS = Object.freeze({
  society: Object.freeze([societyDefault, societyAggro]),
  cult: Object.freeze([cultDefault, cultMadness]),
});

/** 按推荐套 id 取牌，找不到返回 null。 */
export function findPresetById(presetId) {
  if (typeof presetId !== 'string') return null;
  for (const group of Object.values(PRESET_GROUPS)) {
    const hit = group.find((preset) => preset.id === presetId);
    if (hit) return hit;
  }
  return null;
}

export const DEFAULT_DECK_ORDER = Object.freeze(['society', 'cult']);

export function makeCardIndex(pool = CARDS) {
  if (!pool) return { ...CARDS };
  if (Array.isArray(pool)) {
    const out = {};
    for (const card of pool) {
      if (!card || typeof card.id !== 'string') throw new Error('card pool entries need a string id');
      out[card.id] = card;
    }
    return out;
  }
  return { ...pool };
}
