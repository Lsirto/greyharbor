/**
 * src/campaign/operations.mjs — resolve the narrative operation DSL on a run.
 *
 * All randomness consumes the run's own rngState (via engine rng helpers).
 * Empty pools / no-op choices are handled gracefully (no throw). Mutates the
 * run's deck / relics / supplies and returns the run.
 */

import { nextRandom, pickRandom, randInt } from '../engine/rng.js';
import { eligibleCardIds, unownedRelics } from './pools.mjs';

function addCard(run, operation) {
  if (typeof operation.cardId === 'string') {
    run.deck.push(operation.cardId);
    return;
  }
  const pool = eligibleCardIds(run);
  if (pool.length === 0) return; // no eligible card: no-op
  run.deck.push(pickRandom(run, pool));
}

function removeCard(run, operation) {
  if (typeof operation.cardId === 'string') {
    const index = run.deck.indexOf(operation.cardId);
    if (index >= 0) run.deck.splice(index, 1);
    return;
  }
  if (run.deck.length === 0) return;
  run.deck.splice(randInt(run, run.deck.length), 1);
}

function addRelic(run, operation) {
  if (typeof operation.relicId === 'string') {
    if (!run.relics.includes(operation.relicId)) run.relics.push(operation.relicId);
    return;
  }
  const pool = unownedRelics(run).map((relic) => relic.id);
  if (pool.length === 0) return; // all relics owned: no-op
  const id = pickRandom(run, pool);
  if (!run.relics.includes(id)) run.relics.push(id);
}

function applyRandom(run, operation) {
  const total = operation.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  let roll = nextRandom(run) * total;
  for (const outcome of operation.outcomes) {
    roll -= outcome.weight;
    if (roll < 0) {
      applyOperations(run, outcome.operations);
      return;
    }
  }
  applyOperations(run, operation.outcomes[operation.outcomes.length - 1].operations);
}

export function applyOperations(run, operations) {
  for (const operation of operations ?? []) {
    switch (operation.op) {
      case 'supplies':
        run.supplies = Math.max(0, run.supplies + operation.amount);
        break;
      case 'addCard':
        addCard(run, operation);
        break;
      case 'removeCard':
        removeCard(run, operation);
        break;
      case 'addRelic':
        addRelic(run, operation);
        break;
      case 'random':
        applyRandom(run, operation);
        break;
      default:
        break; // unknown op: ignore
    }
  }
  return run;
}

export default applyOperations;
