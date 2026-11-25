import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createRun,
  availableNextNodes,
  enterNode,
  resolveEvent,
  resolveBattle,
  chooseCardReward,
  chooseRelicReward,
  resolveTreasure,
  chooseRestSupplies,
  chooseRestRemove,
  eventChoiceAvailable,
} from '../../src/campaign/run-state.mjs';
import { getEvent } from '../../src/campaign/data/events.mjs';
import { PRESET_DECKS } from '../../src/engine/v2/cards.js';

/** Mirror the soak autopilot so determinism tests replay the exact policy. */
function drive(run) {
  let guard = 0;
  while (run.status === 'active') {
    assert.ok(guard++ < 100, 'autopilot guard');
    enterNode(run, availableNextNodes(run)[0]);
    const p = run.pending;
    if (p.kind === 'event') {
      const ev = getEvent(p.eventId);
      const ix = ev.choices.findIndex((c) => eventChoiceAvailable(run, c));
      resolveEvent(run, ix);
    } else if (p.kind === 'battle') {
      resolveBattle(run);
      if (run.status === 'lost') break;
      if (run.pending?.kind === 'cardReward') chooseCardReward(run, 0);
      if (run.pending?.kind === 'relicReward') chooseRelicReward(run, 0);
    } else if (p.kind === 'treasure') {
      resolveTreasure(run);
      chooseRelicReward(run, 0);
    } else if (p.kind === 'rest') {
      chooseRestSupplies(run);
    }
  }
}

test('createRun seeds the default society run correctly', () => {
  const run = createRun({ seed: 'a' });
  assert.equal(run.faction, 'society');
  assert.equal(run.leaderId, PRESET_DECKS.society.leader);
  assert.equal(run.deck.length, 19);
  assert.deepEqual(run.relics, []);
  assert.equal(run.supplies, 0);
  assert.equal(run.status, 'active');
  assert.equal(run.pending, null);
  assert.equal(run.currentTier, 0);
  assert.ok(run.map);
  assert.equal(run.currentNodeId, run.map.tiers[0][0].id);
});

test('createRun honours cult faction', () => {
  const run = createRun({ seed: 'a', faction: 'cult' });
  assert.equal(run.faction, 'cult');
  assert.equal(run.leaderId, PRESET_DECKS.cult.leader);
  assert.equal(run.deck.length, 19);
});

test('enterNode moves to a connected node and opens the right pending step', () => {
  const run = createRun({ seed: 'a' });
  const choices = availableNextNodes(run);
  assert.ok(choices.length > 0);
  const out = enterNode(run, choices[0]);
  assert.ok(out.ok);
  assert.equal(run.currentNodeId, choices[0]);
  assert.equal(run.currentTier, run.map.nodeById[choices[0]].tier);
  assert.ok(['battle', 'event', 'rest', 'treasure'].includes(run.pending.kind));
});

test('each node type maps to the expected pending kind', () => {
  const expected = {
    battle: 'battle', elite: 'battle', boss: 'battle',
    event: 'event', rest: 'rest', treasure: 'treasure',
  };
  const seen = new Set();
  for (let i = 0; i < 60 && seen.size < 6; i += 1) {
    const run = createRun({ seed: `kind-${i}` });
    for (const node of Object.values(run.map.nodeById)) {
      if (node.tier === 0 || seen.has(node.type)) continue;
      // Use a real predecessor so the node is genuinely connected.
      const predecessor = run.map.edges.find((edge) => edge.to === node.id)?.from;
      if (!predecessor) continue;
      run.currentTier = node.tier - 1;
      run.currentNodeId = predecessor;
      run.pending = null;
      const res = enterNode(run, node.id);
      if (res.ok) {
        assert.equal(run.pending.kind, expected[node.type]);
        seen.add(node.type);
      }
    }
  }
  assert.equal(seen.size, 6);
});

test('enterNode rejects a disconnected node and double entry while pending', () => {
  const run = createRun({ seed: 'a' });
  const all = Object.keys(run.map.nodeById).filter((id) => !availableNextNodes(run).includes(id));
  assert.ok(all.length > 0);
  assert.equal(enterNode(run, all[0]).ok, false);

  enterNode(run, availableNextNodes(run)[0]);
  assert.equal(enterNode(run, availableNextNodes(run)[0]).ok, false);
});

test('resolveBattle loss ends the run with no rewards', () => {
  const run = createRun({ seed: 'L0' });
  enterNode(run, availableNextNodes(run)[0]);
  assert.equal(run.pending.kind, 'battle');
  const before = run.supplies;
  resolveBattle(run);
  assert.equal(run.status, 'lost');
  assert.equal(run.pending, null);
  assert.equal(run.supplies, before);
});

test('resolveBattle win grants supplies and opens a card reward', () => {
  const run = createRun({ seed: 'probe-1' });
  enterNode(run, availableNextNodes(run)[0]);
  resolveBattle(run);
  assert.equal(run.status, 'active');
  assert.equal(run.supplies, 3);
  assert.equal(run.pending.kind, 'cardReward');
  assert.equal(run.pending.cardOptions.length, 3);
  assert.equal(run.pending.relicOptions, null);
});

test('chooseCardReward adds the chosen card and finishes the node', () => {
  const run = createRun({ seed: 'probe-1' });
  enterNode(run, availableNextNodes(run)[0]);
  resolveBattle(run);
  const size = run.deck.length;
  const cardId = run.pending.cardOptions[0];
  const out = chooseCardReward(run, 0);
  assert.ok(out.ok);
  assert.equal(run.deck.length, size + 1);
  assert.equal(run.deck.at(-1), cardId);
  assert.equal(run.pending, null);
  assert.ok(run.completedNodes.includes(run.currentNodeId));
});

test('chooseCardReward can be skipped without changing the deck', () => {
  const run = createRun({ seed: 'probe-1' });
  enterNode(run, availableNextNodes(run)[0]);
  resolveBattle(run);
  const size = run.deck.length;
  chooseCardReward(run, -1);
  assert.equal(run.deck.length, size);
  assert.equal(run.pending, null);
});

test('elite reward chain: card then relic', () => {
  const run = createRun({ seed: 'probe-1' });
  enterNode(run, availableNextNodes(run)[0]);
  resolveBattle(run);
  // Synthesize the elite-style pending step.
  run.pending = {
    kind: 'cardReward',
    nodeType: 'elite',
    cardOptions: run.pending.cardOptions,
    relicOptions: ['salt-ward', 'brass-key'],
  };
  chooseCardReward(run, 0);
  assert.equal(run.pending.kind, 'relicReward');
  assert.deepEqual(run.pending.relicOptions, ['salt-ward', 'brass-key']);
  const out = chooseRelicReward(run, 1);
  assert.ok(out.ok);
  assert.ok(run.relics.includes('brass-key'));
  assert.equal(run.pending, null);
});

test('chooseRelicReward can be skipped and rejects a bad index', () => {
  const run = createRun({ seed: 'probe-1' });
  run.pending = { kind: 'relicReward', relicOptions: ['salt-ward'] };
  const before = run.relics.length;
  assert.ok(chooseRelicReward(run, -1).ok);
  assert.equal(run.relics.length, before);

  run.pending = { kind: 'relicReward', relicOptions: ['salt-ward'] };
  assert.equal(chooseRelicReward(run, 9).ok, false);
});

test('resolveTreasure grants supplies then a relic reward', () => {
  const run = createRun({ seed: 'a' });
  run.pending = { kind: 'treasure' };
  const out = resolveTreasure(run);
  assert.ok(out.ok);
  assert.equal(run.supplies, 2);
  assert.equal(run.pending.kind, 'relicReward');
  assert.ok(run.pending.relicOptions.length >= 2);
});

test('rest supplies option adds 2 and finishes', () => {
  const run = createRun({ seed: 'a' });
  run.pending = { kind: 'rest' };
  const out = chooseRestSupplies(run);
  assert.ok(out.ok);
  assert.equal(run.supplies, 2);
  assert.equal(run.pending, null);
});

test('rest remove option trims the deck and rejects an invalid index', () => {
  const run = createRun({ seed: 'a' });
  run.pending = { kind: 'rest' };
  const size = run.deck.length;
  const removed = run.deck[3];
  assert.ok(chooseRestRemove(run, 3).ok);
  assert.equal(run.deck.length, size - 1);
  assert.ok(!run.deck.includes(removed) || run.deck.indexOf(removed) !== 3);

  run.pending = { kind: 'rest' };
  assert.equal(chooseRestRemove(run, 999).ok, false);
});

test('event condition gating: supplies requirement', () => {
  const run = createRun({ seed: 'a' });
  const choice = { condition: { supplies: 4 }, operations: [] };
  assert.equal(eventChoiceAvailable(run, choice), false);
  run.supplies = 4;
  assert.equal(eventChoiceAvailable(run, choice), true);
});

test('full autopilot reaches a won boss for a fixed winning seed', () => {
  const run = createRun({ seed: 'soak-society-7', faction: 'society' });
  drive(run);
  assert.equal(run.status, 'won');
  assert.equal(run.currentNodeId, 'n6-0');
  assert.ok(run.completedNodes.includes('n6-0'));
});

test('identical seeds replay identical runs', () => {
  const a = createRun({ seed: 'determinism-x', faction: 'society' });
  const b = createRun({ seed: 'determinism-x', faction: 'society' });
  drive(a);
  drive(b);
  assert.equal(b.status, a.status);
  assert.deepEqual(b.deck, a.deck);
  assert.deepEqual(b.relics, a.relics);
  assert.equal(b.supplies, a.supplies);
  assert.deepEqual(b.completedNodes, a.completedNodes);
});
