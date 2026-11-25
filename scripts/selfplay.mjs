/**
 * Phase 2.2 self-play soak test.
 *
 * Plays N complete games (default 1000) with the two frozen 20-card preset
 * decks, using only actions returned by engine.getActions(), i.e. random legal
 * actions.  Fails loudly on an illegal action, deadlock, card-conservation
 * violation, or timeout.
 *
 *   node scripts/selfplay.mjs
 *   node scripts/selfplay.mjs --games=2000
 */

import { createGame, countCards } from '../src/engine/v2/index.js';
import { hashSeed, nextRandom } from '../src/engine/rng.js';

const gamesArg = process.argv.find((arg) => arg.startsWith('--games='));
const GAMES = Math.max(1, Number(gamesArg?.split('=')[1] ?? 1000));
const MAX_STEPS_PER_GAME = 400;
const TIME_LIMIT_MS = 30_000;
const DECK_SIZE = 19;

const random = { rngState: hashSeed('greyharbor-selfplay-v2.2') };
const pick = (items) => items[Math.floor(nextRandom(random) * items.length)];

const stats = {
  games: 0,
  p0Wins: 0,
  p1Wins: 0,
  draws: 0,
  reasons: Object.create(null),
  nights: Object.create(null),
  totalActions: 0,
  maxActionsPerGame: 0,
  maxGameMs: 0,
};

const startedAt = Date.now();

for (let gameIndex = 0; gameIndex < GAMES; gameIndex++) {
  const gameStartedAt = Date.now();
  const seed = `selfplay-${gameIndex}`;
  const engine = createGame({ seed });
  let actionsTaken = 0;

  while (engine.phase !== 'gameOver') {
    if (actionsTaken >= MAX_STEPS_PER_GAME) {
      throw new Error(`game ${gameIndex} exceeded ${MAX_STEPS_PER_GAME} actions (possible deadlock)`);
    }

    const actions = engine.getActions();
    if (actions.length === 0) {
      throw new Error(`game ${gameIndex} has no legal actions while phase=${engine.phase}`);
    }

    const result = engine.apply(pick(actions));
    if (!result.ok) {
      throw new Error(`game ${gameIndex} rejected a generated action: ${result.error}`);
    }

    for (const p of [0, 1]) {
      const count = countCards(engine.state, p);
      if (count !== DECK_SIZE) {
        throw new Error(
          `game ${gameIndex} card conservation broken for P${p}: ${count} !== ${DECK_SIZE}`,
        );
      }
    }

    actionsTaken += 1;
    if (Date.now() - startedAt > TIME_LIMIT_MS) {
      throw new Error(`self-play exceeded ${TIME_LIMIT_MS}ms after ${gameIndex} games`);
    }
  }

  const result = engine.result();
  if (!result) throw new Error(`game ${gameIndex} ended without a result`);

  stats.games += 1;
  if (result.winner === 0) stats.p0Wins += 1;
  else if (result.winner === 1) stats.p1Wins += 1;
  else stats.draws += 1;

  stats.reasons[result.reason] = (stats.reasons[result.reason] ?? 0) + 1;
  stats.nights[result.night] = (stats.nights[result.night] ?? 0) + 1;
  stats.totalActions += actionsTaken;
  stats.maxActionsPerGame = Math.max(stats.maxActionsPerGame, actionsTaken);
  stats.maxGameMs = Math.max(stats.maxGameMs, Date.now() - gameStartedAt);
}

const elapsedMs = Date.now() - startedAt;
if (elapsedMs > TIME_LIMIT_MS) {
  throw new Error(`self-play took ${elapsedMs}ms (limit ${TIME_LIMIT_MS}ms)`);
}

const summary = {
  ok: true,
  games: stats.games,
  elapsedMs,
  avgMsPerGame: Number((elapsedMs / stats.games).toFixed(4)),
  maxGameMs: stats.maxGameMs,
  wins: { p0: stats.p0Wins, p1: stats.p1Wins, draw: stats.draws },
  reasons: stats.reasons,
  endingNight: stats.nights,
  totalActions: stats.totalActions,
  avgActionsPerGame: Number((stats.totalActions / stats.games).toFixed(2)),
  maxActionsPerGame: stats.maxActionsPerGame,
  sanityEndingRatio: Number(((stats.reasons.sanity ?? 0) / stats.games).toFixed(3)),
  conservation: 'ok',
};

console.log('Greyharbor v2.2 self-play');
console.log(JSON.stringify(summary, null, 2));
