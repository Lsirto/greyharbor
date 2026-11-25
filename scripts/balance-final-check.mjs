/**
 * scripts/balance-final-check.mjs — post-finalization regression check.
 *
 * Uses the shipped rule set exactly: createGame({seed, decks}) with NO
 * firstPlayerCompensation / cardOverrides / ruleOverrides. Both seat
 * assignments plus both mirrors on one shared seed set.
 *
 *   node scripts/balance-final-check.mjs --games=2000 --seed=balance-v1.2-final \
 *     --out=docs/v12-final-check.json
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
    const action = chooseAction(view, { seed: `ai-match-ai:${p}:${seed}` });
    if (!action || !view.actions.includes(action)) throw new Error(`illegal action ${seed}`);
    const outcome = engine.apply(action);
    if (!outcome.ok) throw new Error(`engine rejected action ${seed}: ${outcome.error}`);
    for (const player of [0, 1]) {
      if (countCards(engine.state, player) !== DECK_SIZE) throw new Error(`conservation broken ${seed}`);
    }
  }
  return {
    result: engine.result(),
    firstPlayer,
    history: engine.state.history.map((h) => h.scores.map((s) => s.total)),
  };
}

function summarize(games, label) {
  const wins = [0, 0];
  let draws = 0;
  let fpWins = 0;
  let sanity = 0;
  const reasons = {};
  const nights = {};
  for (const g of games) {
    const { result: r } = g;
    if (r.winner === 0 || r.winner === 1) wins[r.winner] += 1;
    else draws += 1;
    if (r.winner === g.firstPlayer) fpWins += 1;
    if (r.reason === 'sanity') sanity += 1;
    reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
    nights[r.night] = (nights[r.night] ?? 0) + 1;
  }
  const n = games.length;
  const rate = (v) => Number((v / n).toFixed(4));
  return {
    label,
    games: n,
    p0Wins: wins[0],
    p1Wins: wins[1],
    draws,
    p0WinRate: rate(wins[0]),
    p1WinRate: rate(wins[1]),
    firstPlayerWinRate: rate(fpWins),
    sanityEndingRatio: rate(sanity),
    reasons,
    endingNight: nights,
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
const seedPrefix = arg('seed', 'balance-v1.2-final');

const out = {
  ok: true,
  games,
  seedPrefix,
  engineVersion: 'v1.2 final (shipped defaults)',
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
    `P0=${g.p0Wins} P1=${g.p1Wins} draw=${g.draws}`,
    `P0=${(g.p0WinRate * 100).toFixed(2)}% P1=${(g.p1WinRate * 100).toFixed(2)}%`,
    `FP=${(g.firstPlayerWinRate * 100).toFixed(2)}%`,
    `sanity=${(g.sanityEndingRatio * 100).toFixed(2)}%`,
    `reasons=${JSON.stringify(g.reasons)}`,
    `nights=${JSON.stringify(g.endingNight)}`,
    g.conservation,
  ].join('  '));
}

const outPath = arg('out', undefined);
if (outPath) writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
