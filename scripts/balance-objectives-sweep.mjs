/**
 * scripts/balance-objectives-sweep.mjs — objective threshold sweep.
 *
 * Runs AI-vs-AI games across several OBJECTIVE THRESHOLD values (the engine
 * option objectiveThreshold) and reports the ending-reason mix and seat win
 * rates, so the shipped threshold can be chosen by data rather than guesswork.
 *
 *   node scripts/balance-objectives-sweep.mjs
 *   node scripts/balance-objectives-sweep.mjs --games=400
 */

import { createGame, countCards } from '../src/engine/v2/index.js';
import { chooseAction } from '../src/ai/v2/ai.mjs';

const DECK_SIZE = 19;
const MAX_ACTIONS = 400;

const gamesArg = process.argv.find((arg) => arg.startsWith('--games='));
const GAMES = Math.max(1, Number(gamesArg?.split('=')[1] ?? 400));
const THRESHOLDS = [5, 6, 7, 8, 9, 10];

function playOne(seed, threshold) {
  const engine = createGame({ seed, objectiveThreshold: threshold });

  let actions = 0;
  while (engine.phase !== 'gameOver') {
    if (actions >= MAX_ACTIONS) throw new Error(`${seed} exceeded ${MAX_ACTIONS} actions`);
    const player = engine.phase === 'mulligan' ? engine.pending.players[0] : engine.current;
    const view = engine.viewFor(player);
    const action = chooseAction(view, { seed: `sweep:${threshold}:${player}:${seed}` });
    if (!view.actions.includes(action)) throw new Error(`action not legal in ${seed}`);
    const outcome = engine.apply(action);
    if (!outcome.ok) throw new Error(`engine rejected action: ${outcome.error}`);
    for (const p of [0, 1]) {
      if (countCards(engine.state, p) !== DECK_SIZE) {
        throw new Error(`conservation broken in ${seed} for P${p}`);
      }
    }
    actions += 1;
  }
  return engine.result();
}

function runThreshold(threshold) {
  const reasons = Object.create(null);
  const wins = [0, 0];
  for (let i = 0; i < GAMES; i += 1) {
    const result = playOne(`obj-sweep-${i}`, threshold);
    reasons[result.reason] = (reasons[result.reason] ?? 0) + 1;
    if (result.winner === 0 || result.winner === 1) wins[result.winner] += 1;
  }
  return {
    threshold,
    objective: Number(((reasons.objective ?? 0) / GAMES).toFixed(3)),
    sanity: Number(((reasons.sanity ?? 0) / GAMES).toFixed(3)),
    nightWins: Number(((reasons.nightWins ?? 0) / GAMES).toFixed(3)),
    tiebreak: Number(((reasons.tiebreak ?? 0) / GAMES).toFixed(3)),
    p0WinRate: Number((wins[0] / GAMES).toFixed(3)),
    p1WinRate: Number((wins[1] / GAMES).toFixed(3)),
  };
}

const rows = THRESHOLDS.map(runThreshold);
console.log(`Greyharbor objective threshold sweep (${GAMES} AI-vs-AI games each)`);
console.table(rows);
