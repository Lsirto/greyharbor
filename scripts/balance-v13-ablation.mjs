/**
 * scripts/balance-v13-ablation.mjs — v1.3 mechanics toggle ablation.
 *
 * Runs the same seeded cross games (both seat directions) under four mechanics
 * configurations to isolate how the anomaly system and the chaos bag each move
 * the faction win rate and the sanity-ending ratio. Pure diagnostic: it only
 * flips createGame({mechanics}), never edits the shipped rules.
 *
 *   node scripts/balance-v13-ablation.mjs --games=1500 --seed=v13-ablation
 */
import { createGame, countCards, PRESET_DECKS } from '../src/engine/v2/index.js';
import { chooseAction } from '../src/ai/v2/ai.mjs';

const MAX_ACTIONS = 400;
const DECK_SIZE = 19;

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

function play(seed, decks, mechanics) {
  const engine = createGame({ seed, decks, mechanics });
  let actions = 0;
  while (engine.phase !== 'gameOver') {
    if (actions++ >= MAX_ACTIONS) throw new Error(`deadlock ${seed}`);
    const p = engine.phase === 'mulligan' ? engine.pending.players[0] : engine.current;
    const view = engine.viewFor(p);
    const action = chooseAction(view, { seed: `ai-match-ai:${p}:${seed}` });
    if (!action || !view.actions.includes(action)) throw new Error(`illegal action ${seed}`);
    const outcome = engine.apply(action);
    if (!outcome.ok) throw new Error(`engine rejected ${seed}: ${outcome.error}`);
    for (const player of [0, 1]) {
      if (countCards(engine.state, player) !== DECK_SIZE) throw new Error(`conservation ${seed}`);
    }
  }
  return engine.result();
}

function run(games, prefix, decks, mechanics) {
  let societyWins = 0;
  let sanity = 0;
  for (let i = 0; i < games; i += 1) {
    const result = play(`${prefix}-${i}`, decks, mechanics);
    const societySeat = decks[0] === PRESET_DECKS.society ? 0 : 1;
    if (result.winner === societySeat) societyWins += 1;
    if (result.reason === 'sanity') sanity += 1;
  }
  return {
    societyWinRate: Number((societyWins / games).toFixed(4)),
    cultWinRate: Number(((games - societyWins) / games).toFixed(4)),
    sanityEndingRatio: Number((sanity / games).toFixed(4)),
  };
}

const games = Math.max(1, Number(arg('games', 1500)) || 1500);
const seedPrefix = arg('seed', 'v13-ablation');

const configs = [
  ['both on (v1.3 baseline)', { anomaly: true, chaosBag: true }],
  ['chaos bag only', { anomaly: false, chaosBag: true }],
  ['anomaly only', { anomaly: true, chaosBag: false }],
  ['both off (v1.2-equivalent)', { anomaly: false, chaosBag: false }],
];

const out = { ok: true, games, seedPrefix, groups: [] };
for (const [label, mechanics] of configs) {
  const ab = run(games, seedPrefix, [PRESET_DECKS.society, PRESET_DECKS.cult], mechanics);
  const ba = run(games, seedPrefix, [PRESET_DECKS.cult, PRESET_DECKS.society], mechanics);
  const avg = (key) => Number(((ab[key] + ba[key]) / 2).toFixed(4));
  const group = {
    label,
    societyWinRate: avg('societyWinRate'),
    cultWinRate: avg('cultWinRate'),
    sanityEndingRatio: avg('sanityEndingRatio'),
  };
  out.groups.push(group);
  console.log(
    label.padEnd(28),
    `Society=${(group.societyWinRate * 100).toFixed(2)}%`,
    `Cult=${(group.cultWinRate * 100).toFixed(2)}%`,
    `sanity=${(group.sanityEndingRatio * 100).toFixed(2)}%`,
  );
}
