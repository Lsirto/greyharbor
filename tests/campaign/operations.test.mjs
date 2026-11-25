import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRun } from '../../src/campaign/run-state.mjs';
import { applyOperations } from '../../src/campaign/operations.mjs';
import {
  countInDeck,
  eligibleCardPool,
  eligibleCardIds,
  unownedRelics,
  hasRelic,
} from '../../src/campaign/pools.mjs';
import { CARD_LIST } from '../../src/engine/v2/cards.js';

test('supplies op adds and never goes below zero', () => {
  const run = createRun({ seed: 'op-1' });
  applyOperations(run, [{ op: 'supplies', amount: 5 }]);
  assert.equal(run.supplies, 5);
  applyOperations(run, [{ op: 'supplies', amount: -9 }]);
  assert.equal(run.supplies, 0);
});

test('addCard with explicit id pushes to the deck', () => {
  const run = createRun({ seed: 'op-2' });
  const size = run.deck.length;
  applyOperations(run, [{ op: 'addCard', cardId: 'nora-wells' }]);
  assert.equal(run.deck.length, size + 1);
  assert.equal(run.deck.at(-1), 'nora-wells');
});

test('addCard from the faction pool adds an eligible id', () => {
  const run = createRun({ seed: 'op-3' });
  const eligible = new Set(eligibleCardIds(run));
  applyOperations(run, [{ op: 'addCard', pool: 'faction' }]);
  assert.ok(eligible.has(run.deck.at(-1)));
});

test('removeCard explicit removes one copy; random removes a deck card', () => {
  const run = createRun({ seed: 'op-4' });
  // Pick an eligible card the preset does not already contain.
  const target = eligibleCardIds(run).find((id) => countInDeck(run, id) === 0);
  assert.ok(target);
  run.deck.push(target);
  assert.equal(countInDeck(run, target), 1);
  applyOperations(run, [{ op: 'removeCard', cardId: target }]);
  assert.equal(countInDeck(run, target), 0);

  const size = run.deck.length;
  const before = new Set(run.deck);
  applyOperations(run, [{ op: 'removeCard' }]);
  assert.equal(run.deck.length, size - 1);
  assert.ok(run.deck.every((id) => before.has(id)));
});

test('removeCard on an empty deck is a no-op', () => {
  const run = createRun({ seed: 'op-5' });
  run.deck = [];
  assert.doesNotThrow(() => applyOperations(run, [{ op: 'removeCard' }]));
  assert.equal(run.deck.length, 0);
});

test('addRelic explicit adds once and never duplicates', () => {
  const run = createRun({ seed: 'op-6' });
  applyOperations(run, [{ op: 'addRelic', relicId: 'brass-key' }]);
  assert.ok(hasRelic(run, 'brass-key'));
  applyOperations(run, [{ op: 'addRelic', relicId: 'brass-key' }]);
  assert.equal(run.relics.filter((id) => id === 'brass-key').length, 1);
});

test('addRelic from the relic pool adds an unowned relic', () => {
  const run = createRun({ seed: 'op-7' });
  const unowned = new Set(unownedRelics(run).map((r) => r.id));
  applyOperations(run, [{ op: 'addRelic', pool: 'relic' }]);
  assert.ok(unowned.has(run.relics[0]));
});

test('random op resolves a weighted outcome', () => {
  const run = createRun({ seed: 'op-8' });
  applyOperations(run, [{
    op: 'random',
    outcomes: [
      { weight: 1, operations: [{ op: 'supplies', amount: 1 }] },
      { weight: 0, operations: [{ op: 'supplies', amount: 100 }] },
    ],
  }]);
  assert.ok(run.supplies === 1 || run.supplies === 100);
});

test('unknown op is ignored without throwing', () => {
  const run = createRun({ seed: 'op-9' });
  assert.doesNotThrow(() => applyOperations(run, [{ op: 'mystery' }]));
});

test('pools: eligible cards are non-leader faction/neutral under the copy cap', () => {
  const run = createRun({ seed: 'op-10' });
  const pool = eligibleCardPool(run);
  assert.ok(pool.every((card) => card.type !== 'leader'));
  assert.ok(pool.every((card) => card.faction === run.faction || card.faction === 'neutral'));
  const validIds = new Set(CARD_LIST.map((c) => c.id));
  assert.ok(pool.every((card) => validIds.has(card.id)));
});
