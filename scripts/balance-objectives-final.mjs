/**
 * scripts/balance-objectives-final.mjs — v1.4 objectives finalisation check.
 *
 * Uses the shipped rule set exactly (default objective threshold 7 in
 * objectives.js), with both cross seat assignments plus both mirrors on one
 * shared seed set. Tracks the objective-ending share alongside sanity/nightWins.
 *
 *   node scripts/balance-objectives-final.mjs --games=2000 \
 *     --seed=v14-objectives-final --out=docs/v14-final-check.json
 */
import { writeFileSync } from 'node:fs';

import { createGame, countCards, PRESET_DECKS } from '../src/engine/v2/index.js';
import { chooseAction } from '../src/ai/v2/ai.mjs';

const MAX_ACTIONS = 400;
const DECK_SIZE = 19;

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

function play(seed, decks) {
  const engine = createGame({ seed, decks });
  let firstPlayer = null;
  let actions = 0;
  while (engine.phase !== 'gameOver') {
    if (actions++ >= MAX_ACTIONS) throw new Error(`deadlock ${seed}`);
    if (firstPlayer === null && engine.state.night >= 1) firstPlayer = engine.state.firstPlayer;
    const p = engine.phase === 'mulligan' ? engine.pending.players[0] : engine.current;
    const view = engine.viewFor(p);
    const action = chooseAction(view, { seed: `v14-ai:${p}:${seed}` });
    if (!action || !view.actions.includes(action)) throw new Error(`illegal action ${seed}`);
    const outcome = engine.apply(action);
    if (!outcome.ok) throw new Error(`engine rejected action ${seed}: ${outcome.error}`);
    for (const player of [0, 1]) {
      if (countCards(engine.state, player) !== DECK_SIZE) throw new Error(`conservation broken ${seed}`);
    }
  }
  return { result: engine.result(), firstPlayer };
}

function summarize(games, label) {
  const wins = [0, 0];
  let draws = 0;
  let fpWins = 0;
  let objective = 0;
  let sanity = 0;
  const reasons = {};
  for (const g of games) {
    const r = g.result;
    if (r.winner === 0 || r.winner === 1) wins[r.winner] += 1;
    else draws += 1;
    if (r.winner === g.firstPlayer) fpWins += 1;
    if (r.reason === 'objective') objective += 1;
    if (r.reason === 'sanity') sanity += 1;
    reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
  }
  const n = games.length;
  const rate = (v) => Number((v / n).toFixed(4));
  return {
    label,
    games: n,
    p0WinRate: rate(wins[0]),
    p1WinRate: rate(wins[1]),
    draws,
    firstPlayerWinRate: rate(fpWins),
    objectiveEndingRatio: rate(objective),
    sanityEndingRatio: rate(sanity),
    reasons,
    conservation: 'ok',
  };
}

function run(count, prefix, decks, label) {
  const games = [];
  for (let i = 0; i < count; i += 1) games.push(play(`${prefix}-${i}`, decks));
  return summarize(games, label);
}

const games = Math.max(1, Number(arg('games', 2000)) || 2000);
const mirrorGames = Math.max(1, Math.floor(games * 0.6));
const seedPrefix = arg('seed', 'v14-objectives-final');

const out = {
  ok: true,
  games,
  seedPrefix,
  engineVersion: 'v1.4 objectives final (shipped defaults, threshold 7)',
  groups: [
    run(games, seedPrefix, [PRESET_DECKS.society, PRESET_DECKS.cult], 'crossAB (P0 Society / P1 Cult)'),
    run(games, seedPrefix, [PRESET_DECKS.cult, PRESET_DECKS.society], 'crossBA (P0 Cult / P1 Society)'),
    run(mirrorGames, seedPrefix, [PRESET_DECKS.cult, PRESET_DECKS.cult], 'cult mirror'),
    run(mirrorGames, seedPrefix, [PRESET_DECKS.society, PRESET_DECKS.society], 'society mirror'),
  ],
};

for (const g of out.groups) {
  console.log([
    g.label.padEnd(30),
    `P0=${(g.p0WinRate * 100).toFixed(2)}% P1=${(g.p1WinRate * 100).toFixed(2)}%`,
    `FP=${(g.firstPlayerWinRate * 100).toFixed(2)}%`,
    `objective=${(g.objectiveEndingRatio * 100).toFixed(2)}%`,
    `sanity=${(g.sanityEndingRatio * 100).toFixed(2)}%`,
    `reasons=${JSON.stringify(g.reasons)}`,
    g.conservation,
  ].join('  '));
}

const outPath = arg('out', undefined);
if (outPath) writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
