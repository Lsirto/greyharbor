/**
 * scripts/campaign-balance.mjs — controlled difficulty calibration.
 *
 * Isolates the elite/boss difficulty lever (lower starting sanity: 6 / 5 / 4)
 * by running headless battles on a fresh baseline deck for every node type,
 * across many deterministic seeds. The deck, opponent and relic set are held
 * constant; only the node type (hence starting sanity) changes, so the win-rate
 * gradient is directly attributable to the difficulty configuration.
 *
 * Run: node scripts/campaign-balance.mjs [count]
 */

import { createRun } from '../src/campaign/run-state.mjs';
import { runHeadlessBattle } from '../src/campaign/battle.mjs';

const COUNT = Number(process.argv[2] ?? 200);
const TYPES = ['battle', 'elite', 'boss'];

function emptyBucket() {
  return { wins: 0, losses: 0, reasons: {} };
}

for (const faction of ['society', 'cult']) {
  const buckets = Object.fromEntries(TYPES.map((t) => [t, emptyBucket()]));

  for (let i = 0; i < COUNT; i += 1) {
    for (const type of TYPES) {
      const run = createRun({ seed: `bal-${faction}-${i}`, faction });
      // Same node id across types keeps the battle seed (and hence the shuffle)
      // identical; only node.type -> starting sanity differs.
      const node = { id: 'cal', type };
      const result = runHeadlessBattle(run, node);
      const bucket = buckets[type];
      const won = result.winner === 0;
      bucket[won ? 'wins' : 'losses'] += 1;
      const reason = result.reason ?? 'unknown';
      bucket.reasons[reason] = (bucket.reasons[reason] ?? 0) + 1;
    }
  }

  console.log(`\n${faction} (${COUNT} controlled battles per type):`);
  for (const type of TYPES) {
    const b = buckets[type];
    const winRate = (b.wins / COUNT * 100).toFixed(1);
    const reasons = Object.entries(b.reasons)
      .map(([k, v]) => `${k}=${(v / COUNT * 100).toFixed(1)}%`)
      .join(' ');
    console.log(`  ${type.padEnd(6)} winRate=${winRate}%  wins=${b.wins} losses=${b.losses}  [${reasons}]`);
  }
}

console.log(`\n${COUNT * TYPES.length * 2} controlled battles completed, 0 crashes.`);
