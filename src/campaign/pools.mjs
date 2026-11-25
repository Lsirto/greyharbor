/**
 * src/campaign/pools.mjs — eligibility helpers shared by operations & rewards.
 * Pure; reads the run's faction, deck and owned relics. No DOM.
 */

import { CARD_LIST } from '../engine/v2/cards.js';
import { RELICS } from './data/relics.mjs';

/** Count how many copies of a card id are currently in the deck. */
export function countInDeck(run, cardId) {
  return run.deck.reduce((total, id) => (id === cardId ? total + 1 : total), 0);
}

/**
 * Non-leader cards the run faction can use (own faction + neutral) that have
 * not already reached the 2-copy cap.  Returns the frozen card objects.
 */
export function eligibleCardPool(run) {
  return CARD_LIST.filter((card) => card.type !== 'leader'
    && (card.faction === run.faction || card.faction === 'neutral')
    && countInDeck(run, card.id) < 2);
}

/** Card ids (not objects) currently eligible; convenient for random adds. */
export function eligibleCardIds(run) {
  return eligibleCardPool(run).map((card) => card.id);
}

/** Relic data objects the run does not yet own. */
export function unownedRelics(run) {
  return RELICS.filter((relic) => !run.relics.includes(relic.id));
}

/** True if the run owns a relic id. */
export function hasRelic(run, relicId) {
  return run.relics.includes(relicId);
}
