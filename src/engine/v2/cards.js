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

function expand(entries) {
  return Object.freeze(entries.flatMap(([id, count]) => Array(count).fill(id)));
}

function buildPreset({ id, name, faction, leader, entries }) {
  const cards = expand(entries);
  if (cards.length !== 19) {
    throw new Error(`preset ${id} must contain 19 non-leader cards, got ${cards.length}`);
  }
  for (const cardId of cards) {
    const card = CARDS[cardId];
    if (!card) throw new Error(`preset ${id} references unknown card ${cardId}`);
    if (card.type === 'leader') throw new Error(`preset ${id} contains leader ${cardId}`);
    if (card.faction !== faction && card.faction !== 'neutral') {
      throw new Error(`preset ${id} contains out-of-faction card ${cardId}`);
    }
  }
  if (!CARDS[leader] || CARDS[leader].type !== 'leader') {
    throw new Error(`preset ${id} has an invalid leader ${leader}`);
  }
  return Object.freeze({ id, name, faction, leader, cards });
}

export const PRESET_DECKS = Object.freeze({
  society: buildPreset({
    id: 'society',
    name: 'Society',
    faction: 'society',
    leader: 'harold-ashby',
    entries: SOCIETY_DECK,
  }),
  cult: buildPreset({
    id: 'cult',
    name: 'Cult',
    faction: 'cult',
    leader: 'elias-thorne',
    entries: CULT_DECK,
  }),
});

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
