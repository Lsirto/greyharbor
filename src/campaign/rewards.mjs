/**
 * src/campaign/rewards.mjs — deterministic reward option builders.
 * Pure apart from consuming the run rng; reads run relics for option-count and
 * supply bonuses. Returns plain id arrays the state machine and UI can consume.
 */

import { pickRandomMany } from '../engine/rng.js';
import { eligibleCardPool, hasRelic, unownedRelics } from './pools.mjs';

const BASE_SUPPLIES = Object.freeze({ battle: 3, elite: 5, treasure: 2, boss: 0 });

/** Supplies granted immediately on a won battle/treasure node. */
export function battleSupplies(run, nodeType) {
  const base = BASE_SUPPLIES[nodeType] ?? 0;
  const bonus = (nodeType === 'battle' || nodeType === 'elite' || nodeType === 'boss')
    && hasRelic(run, 'brass-key') ? 1 : 0;
  return base + bonus;
}

/** Supplies offered by the "rest" action, including the grave-candle bonus. */
export function restSupplies(run) {
  return 2 + (hasRelic(run, 'grave-candle') ? 2 : 0);
}

/** Distinct card ids offered after a battle (3, or 4 with the journal). */
export function cardRewardOptions(run) {
  const count = 3 + (hasRelic(run, 'moth-eaten-journal') ? 1 : 0);
  return pickRandomMany(run, eligibleCardPool(run).map((card) => card.id), count);
}

/** Distinct relic ids offered at elite/treasure nodes (2, or 3 with the compass). */
export function relicRewardOptions(run) {
  const count = 2 + (hasRelic(run, 'abyssal-compass') ? 1 : 0);
  return pickRandomMany(run, unownedRelics(run).map((relic) => relic.id), count);
}
