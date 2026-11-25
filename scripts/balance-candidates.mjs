/**
 * scripts/balance-candidates.mjs — experiment matrix for the v1.2 final rule.
 *
 * HISTORICAL HARNESS. Every candidate below was injected through the temporary
 * `cardOverrides` / `ruleOverrides` engine hooks, which have been removed at
 * finalization. Recorded matrices are frozen in docs/v12-candidates-*.json;
 * re-running now only replays the shipped JSON.
 *
 * Every candidate is an injected override bundle; the shipped JSON is never
 * edited during the search. Each candidate runs four groups on the SAME seed
 * set: cross A (P0 Society / P1 Cult), cross B (P0 Cult / P1 Society), and
 * both mirrors. Output includes win rates, seat split and sanity endings.
 *
 *   node scripts/balance-candidates.mjs --games=600 --seed=balance-v1.2 \
 *     --out=docs/v12-candidates.json
 */
import { writeFileSync } from 'node:fs';

import { PRESET_DECKS } from '../src/engine/v2/index.js';
import { runExperiment } from './balance-experiment.mjs';

const CROSS_AB = [PRESET_DECKS.society, PRESET_DECKS.cult];
const CROSS_BA = [PRESET_DECKS.cult, PRESET_DECKS.society];
const CULT_MIRROR = [PRESET_DECKS.cult, PRESET_DECKS.cult];
const SOC_MIRROR = [PRESET_DECKS.society, PRESET_DECKS.society];

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

const patch = (id, changes) => ({ [id]: changes });

// ── candidate bundles ─────────────────────────────────────────────────
// Passive amounts are experiment-only rule overrides; card numbers are
// experiment-only card overrides. Final numbers will be written to the JSON
// (and the passive constants in scoring.js) only after this matrix is fixed.
const C = {
  baseline: {},
  'passive=1/3': { ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 3 } },
  'passive=1/2': { ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 2 } },
  'passive=1/1': { ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 1 } },
  'passive=0/3': { ruleOverrides: { cultSacrificeBonus: 0, cultAltarBonus: 3 } },
  'passive=0/2': { ruleOverrides: { cultSacrificeBonus: 0, cultAltarBonus: 2 } },
  'passive=0/1': { ruleOverrides: { cultSacrificeBonus: 0, cultAltarBonus: 1 } },
  'passive=0/0': { ruleOverrides: { cultSacrificeBonus: 0, cultAltarBonus: 0 } },
  'passive=2/2': { ruleOverrides: { cultSacrificeBonus: 2, cultAltarBonus: 2 } },
  'passive=2/1': { ruleOverrides: { cultSacrificeBonus: 2, cultAltarBonus: 1 } },
  'passive=2/0': { ruleOverrides: { cultSacrificeBonus: 2, cultAltarBonus: 0 } },

  // Card-number packages (passive left at shipped 2/3).
  'cards:madness-nerf': {
    cardOverrides: {
      ...patch('zealot', { madnessPower: 5 }),         // 9 -> 8
      ...patch('deep-one', { madnessPower: 7 }),      // 11 -> 10
      ...patch('the-sleeper', { madnessPower: 10 }),  // 12 -> 10
    },
  },
  'cards:base-nerf': {
    cardOverrides: {
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4 }),
      ...patch('zealot', { reasonPower: 2 }),
    },
  },
  'cards:combo-nerf': {
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('the-sleeper', { madnessPower: 10 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
    },
  },
  // Combined: reduced passive + light card nerf.
  'passive=1/2+cards': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 2 },
    cardOverrides: {
      ...patch('zealot', { madnessPower: 5 }),
      ...patch('deep-one', { madnessPower: 7 }),
      ...patch('the-sleeper', { madnessPower: 10 }),
    },
  },
  'passive=0/1+cards': {
    ruleOverrides: { cultSacrificeBonus: 0, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { madnessPower: 5 }),
      ...patch('deep-one', { madnessPower: 7 }),
      ...patch('the-sleeper', { madnessPower: 10 }),
    },
  },

  // Stronger packages: reduced passive + the full base/madness nerf bundle.
  'passive=1/2+combo': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 2 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('the-sleeper', { madnessPower: 10 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
    },
  },
  'passive=1/1+combo': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('the-sleeper', { madnessPower: 10 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
    },
  },
  'passive=0/1+combo': {
    ruleOverrides: { cultSacrificeBonus: 0, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('the-sleeper', { madnessPower: 10 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
    },
  },

  // Package B: Cult-only cards, including the Bell-Claw devour target
  // (Hooded Acolyte) and the recurrent Gravedigger body.
  'passive=1/1+packageB': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
      ...patch('hooded-acolyte', { madnessPower: 2 }),
      ...patch('gravedigger', { reasonPower: 2, madnessPower: 3 }),
    },
  },
  'passive=1/2+packageB': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 2 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
      ...patch('hooded-acolyte', { madnessPower: 2 }),
      ...patch('gravedigger', { reasonPower: 2, madnessPower: 3 }),
    },
  },
  'passive=1/1+packageB-noSleeperNerf': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
      ...patch('hooded-acolyte', { madnessPower: 2 }),
      ...patch('gravedigger', { reasonPower: 2, madnessPower: 3 }),
      ...patch('the-sleeper', { reasonPower: 7, madnessPower: 10 }),
    },
  },
  'passive=1/1+packageB-sleeperU': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
      ...patch('hooded-acolyte', { madnessPower: 2 }),
      ...patch('gravedigger', { reasonPower: 2, madnessPower: 3 }),
    },
  },
  'passive=1/1+packageB-lite': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2 }),
      ...patch('deep-one', { reasonPower: 4 }),
      ...patch('sea-priestess', { reasonPower: 3 }),
      ...patch('bell-claw', { reasonPower: 5 }),
    },
  },
  'passive=1/0+packageB': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 0 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
      ...patch('hooded-acolyte', { madnessPower: 2 }),
      ...patch('gravedigger', { reasonPower: 2, madnessPower: 3 }),
      ...patch('the-sleeper', { reasonPower: 7, madnessPower: 10 }),
    },
  },
  'passive=1/1+packageB+extra': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 4 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 6 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
      ...patch('hooded-acolyte', { madnessPower: 2 }),
      ...patch('gravedigger', { reasonPower: 2, madnessPower: 3 }),
      ...patch('the-sleeper', { reasonPower: 7, madnessPower: 10 }),
    },
  },
  'passive=1/1+packageB-core': {
    ruleOverrides: { cultSacrificeBonus: 1, cultAltarBonus: 1 },
    cardOverrides: {
      ...patch('zealot', { reasonPower: 2, madnessPower: 5 }),
      ...patch('deep-one', { reasonPower: 4, madnessPower: 7 }),
      ...patch('sea-priestess', { reasonPower: 3, madnessPower: 4 }),
      ...patch('bell-claw', { reasonPower: 5, madnessPower: 5 }),
    },
  },
};

const only = arg('only', '');
const names = only ? only.split(',').filter((n) => C[n]) : Object.keys(C);
if (!names.length) throw new Error(`no candidates matched: ${only}`);

const games = Math.max(1, Number(arg('games', 600)) || 600);
const mirrorGames = Math.max(1, Math.floor(games * 0.6));
const seedPrefix = arg('seed', 'balance-v1.2');
const common = { games, seedPrefix, maxActions: 400 };

function compact(summary) {
  return {
    games: summary.games,
    p0Wins: summary.wins.p0,
    p1Wins: summary.wins.p1,
    p0WinRate: summary.p0WinRate,
    p1WinRate: summary.p1WinRate,
    firstPlayerWinRate: summary.firstPlayerWinRate,
    firstIsP0Rate: summary.firstPlayerIsP0Rate,
    sanityEndingRatio: summary.sanityEndingRatio,
    reasons: summary.reasons,
    endingNight: summary.endingNight,
    avgActionsPerGame: summary.avgActionsPerGame,
    conservation: summary.conservation,
  };
}

const results = [];
for (const name of names) {
  const cfg = C[name];
  const crossAB = compact(runExperiment({ ...common, ...cfg, decks: CROSS_AB }));
  const crossBA = compact(runExperiment({ ...common, ...cfg, decks: CROSS_BA }));
  const cultMirror = compact(runExperiment({
    ...common, ...cfg, games: mirrorGames, decks: CULT_MIRROR,
  }));
  const socMirror = compact(runExperiment({
    ...common, ...cfg, games: mirrorGames, decks: SOC_MIRROR,
  }));
  results.push({
    name,
    config: cfg,
    crossAB,
    crossBA,
    cultMirror,
    societyMirror: socMirror,
    // Cult win rate in both seat assignments: the headline balance metric.
    cultWinAB: crossAB.p1WinRate,
    cultWinBA: crossBA.p0WinRate,
  });
  console.log([
    name.padEnd(22),
    `AB cult=${(crossAB.p1WinRate * 100).toFixed(1)}%`,
    `BA cult=${(crossBA.p0WinRate * 100).toFixed(1)}%`,
    `mirror cult=${(cultMirror.p0WinRate * 100).toFixed(1)}%/${(cultMirror.p1WinRate * 100).toFixed(1)}%`,
    `mirror soc=${(socMirror.p0WinRate * 100).toFixed(1)}%/${(socMirror.p1WinRate * 100).toFixed(1)}%`,
    `sanity AB=${(crossAB.sanityEndingRatio * 100).toFixed(1)}%`,
  ].join('  '));
}

const out = { ok: true, games, mirrorGames, seedPrefix, results };
const outPath = arg('out', undefined);
if (outPath) writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
