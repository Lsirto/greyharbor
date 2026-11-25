/**
 * Chaos bag (v1.3) — fixed token composition + one seeded draw.
 *
 * Tokens are drawn with replacement, so the bag itself never mutates and
 * every draw keeps the same probabilities.  See docs/EXPANSION_V1_DESIGN.md.
 */

import { randInt } from '../rng.js';

/**
 * Token definition:
 *   id, nameZh/nameEn, count, modifier (power), sanity (extra sanity change).
 */
export const CHAOS_TOKEN_TYPES = Object.freeze([
  Object.freeze({ id: 'bless', nameZh: '祝福', nameEn: 'Bless', count: 3, modifier: 2, sanity: 0 }),
  Object.freeze({ id: 'star', nameZh: '星辉', nameEn: 'Star', count: 4, modifier: 1, sanity: 0 }),
  Object.freeze({ id: 'blank', nameZh: '空白', nameEn: 'Blank', count: 5, modifier: 0, sanity: 0 }),
  Object.freeze({ id: 'curse', nameZh: '诅咒', nameEn: 'Curse', count: 4, modifier: -1, sanity: 0 }),
  Object.freeze({ id: 'doom', nameZh: '灾厄', nameEn: 'Doom', count: 2, modifier: -2, sanity: 0 }),
  Object.freeze({
    id: 'elder-sign', nameZh: '旧神之印', nameEn: 'Elder Sign',
    count: 1, modifier: -3, sanity: 0,
  }),
]);

/** Flat bag (repeated entries). Draws index into this array. */
export const CHAOS_BAG = Object.freeze(
  CHAOS_TOKEN_TYPES.flatMap((type) => Array(type.count).fill(type)),
);

export const CHAOS_BAG_SIZE = CHAOS_BAG.length;

/** Draw one token (with replacement) through the engine's seeded RNG. */
export function drawChaosToken(state) {
  return CHAOS_BAG[randInt(state, CHAOS_BAG_SIZE)];
}
