import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRun } from '../../src/campaign/run-state.mjs';
import { buildBattleConfig, runHeadlessBattle } from '../../src/campaign/battle.mjs';

function findNode(run, type) {
  return Object.values(run.map.nodeById).find((node) => node.type === type);
}

test('normal battle config: derived seed, decks, sanity and mechanics', () => {
  const run = createRun({ seed: 'cfg-1' });
  const node = findNode(run, 'battle');
  const cfg = buildBattleConfig(run, node);

  assert.equal(cfg.seed, `cfg-1#battle-${node.id}`);
  assert.equal(cfg.decks[0].leader, run.leaderId);
  assert.deepEqual(cfg.decks[0].cards, run.deck);
  assert.equal(cfg.decks[1], 'cult'); // society run faces the cult preset
  assert.deepEqual(cfg.startingHand, [8, 8]);
  assert.deepEqual(cfg.startingSanity, [6, 6]);
  assert.deepEqual(cfg.mechanics, { anomaly: true, chaosBag: true, objectives: true });
  assert.equal(cfg.firstPlayerCompensation, undefined);
});

test('cult run faces a society opponent', () => {
  const run = createRun({ seed: 'cfg-2', faction: 'cult' });
  const node = findNode(run, 'battle');
  assert.equal(buildBattleConfig(run, node).decks[1], 'society');
});

test('elite and boss reduce starting hand and sanity', () => {
  const run = createRun({ seed: 'cfg-3' });
  const elite = buildBattleConfig(run, findNode(run, 'elite'));
  const boss = buildBattleConfig(run, findNode(run, 'boss'));
  assert.deepEqual(elite.startingHand, [7, 8]);
  assert.deepEqual(elite.startingSanity, [5, 6]);
  assert.deepEqual(boss.startingHand, [6, 8]);
  assert.deepEqual(boss.startingSanity, [4, 6]);
});

test('battle relics translate to mechanics toggles and mulligan', () => {
  const run = createRun({ seed: 'cfg-4' });
  run.relics.push('salt-ward', 'harbor-seal', 'silver-pocket-watch');
  const cfg = buildBattleConfig(run, findNode(run, 'battle'));
  assert.equal(cfg.mechanics.chaosBag, false);
  assert.equal(cfg.mechanics.anomaly, false);
  assert.equal(cfg.mechanics.objectives, true);
  assert.deepEqual(cfg.firstPlayerCompensation, { extraMulligan: 3 });
});

test('warded lantern floors boss sanity at 6', () => {
  const run = createRun({ seed: 'cfg-5' });
  run.relics.push('warded-lantern');
  assert.deepEqual(buildBattleConfig(run, findNode(run, 'boss')).startingSanity, [6, 6]);
});

test('headless battle returns a finished result with a declared winner', () => {
  const run = createRun({ seed: 'probe-1' });
  const node = findNode(run, 'battle');
  const result = runHeadlessBattle(run, node);
  assert.ok([0, 1].includes(result.winner));
  assert.equal(typeof result.reason, 'string');
});
