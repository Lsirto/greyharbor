/**
 * src/codex/codex.mjs — pure filter/query logic for the card codex.
 *
 * Operates on the canonical CARDS table (frozen card objects) and never touches
 * the DOM.  A codex filter is a plain data object; every predicate is keyed off
 * card fields, so there are no per-id branches.
 */

import { CARD_LIST } from '../engine/v2/cards.js';

export const DEFAULT_FILTERS = Object.freeze({
  faction: 'all',
  type: 'all',
  location: 'all',
  query: '',
});

/** Filter option ids (the labels live in the presentational template). */
export const FACTION_OPTIONS = Object.freeze(['all', 'society', 'cult', 'neutral']);
export const TYPE_OPTIONS = Object.freeze(['all', 'unit', 'event', 'ritual', 'equipment', 'location', 'environment', 'leader']);
export const LOCATION_OPTIONS = Object.freeze(['all', 'scene', 'archive', 'dream']);

function normalizeQuery(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function matchesFaction(card, faction) {
  return faction === 'all' || card.faction === faction;
}

/** The "unit" bucket groups printed units and old gods. */
function matchesType(card, type) {
  if (type === 'all') return true;
  if (type === 'unit') return card.type === 'unit' || card.type === 'oldgod';
  return card.type === type;
}

function matchesLocation(card, location) {
  return location === 'all' || card.location === location;
}

function matchesQuery(card, query) {
  if (!query) return true;
  const haystack = [
    card.id,
    card.name,
    card.nameZh,
    card.effect,
    Array.isArray(card.keywordsZh) ? card.keywordsZh.join(' ') : '',
  ].join(' ').toLowerCase();
  return haystack.includes(query);
}

/** Return the cards matching a filter, in canonical table order. */
export function filterCards(cards, filters = DEFAULT_FILTERS) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const query = normalizeQuery(f.query);
  return cards.filter((card) =>
    matchesFaction(card, f.faction)
    && matchesType(card, f.type)
    && matchesLocation(card, f.location)
    && matchesQuery(card, query));
}

/**
 * Build the codex view model for a filter.
 * @returns {{filters: object, cards: object[], total: number, shown: number}}
 */
export function selectCodex(filters = DEFAULT_FILTERS, cards = CARD_LIST) {
  const result = filterCards(cards, filters);
  return {
    filters: { ...DEFAULT_FILTERS, ...filters },
    cards: result,
    total: cards.length,
    shown: result.length,
  };
}

/** Whether a filter still matches the default (nothing narrowed). */
export function isDefaultFilters(filters) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return f.faction === 'all'
    && f.type === 'all'
    && f.location === 'all'
    && normalizeQuery(f.query) === '';
}
