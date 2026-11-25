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

function buildPreset({ id, name, faction, leader, entries }) {
  const validation = validateDeck({ faction, leader, entries }, CARDS);
  if (!validation.ok) {
    throw new Error(presetErrorMessage(id, validation.errors[0], validation.summary));
  }
  const cards = expand(entries);
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
