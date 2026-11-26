/**
 * scripts/campaign-balance-final.mjs — campaign difficulty finalisation check.
 *
 * Controlled calibration that isolates the elite/boss difficulty lever. A fresh
 * baseline deck faces the opposing preset under the SAME battle seed for all
 * three node types; only the node type changes (opening hand 8 / 7 / 6 and
 * starting sanity 6 / 5 / 4). Because the deck and seed are held constant, the
 * win-rate gradient is directly attributable to the difficulty configuration.
 *
 *   node scripts/campaign-balance-final.mjs --games=300 \
 *     --seed=campaign-final --out=docs/campaign-final-check.json
 */
import { writeFileSync } from 'node:fs';

import { createRun } from '../src/campaign/run-state.mjs';
import { runHeadlessBattle } from '../src/campaign/battle.mjs';

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

const games = Math.max(1, Number(arg('games', 300)) || 300);
const seedPrefix = arg('seed', 'campaign-final');
const TYPES = ['battle', 'elite', 'boss'];

function measure(faction, type) {
  let wins = 0;
  const reasons = {};
  for (let i = 0; i < games; i += 1) {
    const run = createRun({ seed: `${seedPrefix}-${faction}-${i}`, faction });
    // Identical node id keeps the seed/shuffle the same across types.
    const result = runHeadlessBattle(run, { id: 'cal', type });
    if (result.winner === 0) wins += 1;
    reasons[result.reason] = (reasons[result.reason] ?? 0) + 1;
  }
  return {
    nodeType: type,
    games,
    wins,
    losses: games - wins,
    winRate: Number((wins / games).toFixed(4)),
    reasons,
  };
}

const factions = {};
for (const faction of ['society', 'cult']) {
  factions[faction] = Object.fromEntries(TYPES.map((t) => [t, measure(faction, t)]));
}

const out = {
  ok: true,
  gamesPerType: games,
  seedPrefix,
  methodology:
    'Fresh baseline deck vs opposing preset; identical battle seed across node types; ' +
    'only node type changes (player opening hand 8/7/6, starting sanity 6/5/4). ' +
    'In a live run, deck growth and relics raise real odds above this baseline.',
  difficulty: {
    battle: { openingHand: 8, startingSanity: 6 },
    elite: { openingHand: 7, startingSanity: 5 },
    boss: { openingHand: 6, startingSanity: 4 },
  },
  factions,
};

for (const faction of ['society', 'cult']) {
  console.log(`\n${faction}:`);
  for (const type of TYPES) {
    const b = factions[faction][type];
    console.log(
      `  ${type.padEnd(6)} winRate=${(b.winRate * 100).toFixed(2)}%  ` +
      `wins=${b.wins} losses=${b.losses} reasons=${JSON.stringify(b.reasons)}`,
    );
  }
}

const outPath = arg('out', undefined);
if (outPath) writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
