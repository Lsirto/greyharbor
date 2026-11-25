/**
 * scripts/campaign-soak.mjs — full-run headless soak test.
 *
 * Runs many deterministic campaigns for both factions with a fixed auto-pilot
 * (first connected node, first legal choice, first reward, rest = supplies).
 * Reports win/loss distribution and asserts every run keeps its invariants:
 * no crashes, unique relics, non-negative supplies, valid deck ids, no node
 * visited twice. Run: node scripts/campaign-soak.mjs [count]
 */

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
  eventChoiceAvailable,
} from '../src/campaign/run-state.mjs';
import { getEvent } from '../src/campaign/data/events.mjs';
import { CARD_LIST } from '../src/engine/v2/cards.js';

const COUNT = Number(process.argv[2] ?? 60);
const VALID_IDS = new Set(CARD_LIST.map((card) => card.id));

function autopilot(run) {
  let guard = 0;
  while (run.status === 'active') {
    if (guard++ > 100) throw new Error('run autopilot exceeded step guard');
    const next = availableNextNodes(run);
    if (next.length === 0) throw new Error('no forward node while active');
    const move = enterNode(run, next[0]);
    if (!move.ok) throw new Error(`enterNode failed: ${move.error}`);

    const pending = run.pending;
    if (pending.kind === 'event') {
      const event = getEvent(pending.eventId);
      const index = event.choices.findIndex((choice) => eventChoiceAvailable(run, choice));
      if (index < 0) throw new Error('no available event choice');
      const out = resolveEvent(run, index);
      if (!out.ok) throw new Error(`resolveEvent failed: ${out.error}`);
    } else if (pending.kind === 'battle') {
      const out = resolveBattle(run);
      if (!out.ok) throw new Error(`resolveBattle failed: ${out.error}`);
      if (run.status === 'lost') break;
      if (run.pending?.kind === 'cardReward') {
        const c = chooseCardReward(run, 0);
        if (!c.ok) throw new Error(`card reward failed: ${c.error}`);
      }
      if (run.pending?.kind === 'relicReward') {
        const r = chooseRelicReward(run, 0);
        if (!r.ok) throw new Error(`relic reward failed: ${r.error}`);
      }
    } else if (pending.kind === 'treasure') {
      const t = resolveTreasure(run);
      if (!t.ok) throw new Error(`treasure failed: ${t.error}`);
      const r = chooseRelicReward(run, 0);
      if (!r.ok) throw new Error(`treasure relic failed: ${r.error}`);
    } else if (pending.kind === 'rest') {
      const r = chooseRestSupplies(run);
      if (!r.ok) throw new Error(`rest failed: ${r.error}`);
    }
  }
}

function assertInvariants(run) {
  if (run.supplies < 0) throw new Error('negative supplies');
  if (new Set(run.relics).size !== run.relics.length) throw new Error('duplicate relics');
  if (new Set(run.completedNodes).size !== run.completedNodes.length) {
    throw new Error('a node was completed twice');
  }
  for (const id of run.deck) {
    if (!VALID_IDS.has(id)) throw new Error(`unknown deck id ${id}`);
  }
}

const summary = {
  society: { won: 0, lost: 0, lastTier: [] },
  cult: { won: 0, lost: 0, lastTier: [] },
};

for (const faction of ['society', 'cult']) {
  for (let i = 0; i < COUNT; i += 1) {
    const run = createRun({ seed: `soak-${faction}-${i}`, faction });
    autopilot(run);
    assertInvariants(run);
    summary[faction][run.status] += 1;
    summary[faction].lastTier.push(run.currentTier);
  }
}

for (const faction of ['society', 'cult']) {
  const s = summary[faction];
  const winRate = (s.won / COUNT * 100).toFixed(1);
  const avgTier = (s.lastTier.reduce((a, b) => a + b, 0) / COUNT).toFixed(2);
  console.log(`${faction}: won=${s.won} lost=${s.lost} winRate=${winRate}% avgFinalTier=${avgTier}`);
}
console.log(`\n${COUNT * 2} runs completed, 0 crashes, all invariants held.`);
