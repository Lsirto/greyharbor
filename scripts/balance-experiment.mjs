/**
 * scripts/balance-experiment.mjs — 平衡补丁 v1.1 实验台。
 *
 * 同一 AI 策略（src/ai/v2/chooseAction，只读 buildView）对打，按「第一夜先手
 * 角色」统计胜负；支持把 firstPlayerCompensation 透传给 createGame。
 *
 *   node scripts/balance-experiment.mjs --games=600
 *   node scripts/balance-experiment.mjs --games=600 --comp=extraMulligan --value=1
 *   node scripts/balance-experiment.mjs --games=600 --matrix
 *   node scripts/balance-experiment.mjs --games=600 --matrix --out=docs/balance-raw.json
 *
 * 所有方案共用同一组 seed（seedPrefix-i）与同一组 AI seed，因此组间唯一变量
 * 就是补偿参数。随机只走注入式 rng；本脚本不调用 Math.random。
 */

import { writeFileSync } from 'node:fs';

import { createGame, countCards } from '../src/engine/v2/index.js';
import { chooseAction } from '../src/ai/v2/ai.mjs';

const DECK_SIZE = 19;
const DEFAULT_GAMES = 600;
const DEFAULT_MAX_ACTIONS = 400;
const KNOWN_COMPS = ['extraMulligan', 'extraStartingCard', 'night1Sanity'];

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function parseCompensation(raw, value) {
  if (raw === 'none' || raw === '') return {};
  const parts = raw.split('+').filter(Boolean);
  const unknown = parts.filter((name) => !KNOWN_COMPS.includes(name));
  if (unknown.length) throw new Error(`unknown compensation: ${unknown.join(', ')}`);
  return Object.fromEntries(parts.map((name) => [name, value]));
}

/** Mirror the ai-v2 driver: one game, same seed/AI options for every group. */
export function playExperimentGame(options = {}) {
  const seed = options.seed;
  const maxActions = options.maxActions ?? DEFAULT_MAX_ACTIONS;
  const aiSeed = (p) => `${options.aiSeedPrefix ?? 'ai-match-ai'}:${p}:${seed}`;
  // Spell out every hook: a group that omits a key must get 0, not the shipped
  // v1.1 default, otherwise the seed-matched comparison would be contaminated.
  const compensation = Object.fromEntries(
    KNOWN_COMPS.map((key) => [key, options.compensation?.[key] ?? 0]),
  );
  const engine = createGame({ seed, firstPlayerCompensation: compensation });

  let actionsTaken = 0;
  let firstPlayer = null;
  while (engine.phase !== 'gameOver') {
    if (actionsTaken >= maxActions) {
      throw new Error(`game ${seed} exceeded ${maxActions} actions (possible deadlock)`);
    }
    const p = engine.phase === 'mulligan'
      ? engine.pending?.players?.[0]
      : engine.current;
    if (p !== 0 && p !== 1) {
      throw new Error(`game ${seed} has no actor (phase=${engine.phase}, step=${actionsTaken})`);
    }
    const view = engine.viewFor(p);
    const action = chooseAction(view, { seed: aiSeed(p) });
    if (!action || !view.actions.includes(action)) {
      throw new Error(`illegal AI action in game ${seed} (phase=${engine.phase})`);
    }
    // Capture the night-1 coin once; state.firstPlayer rotates on nights 2/3
    // and must not overwrite this value for the first-player statistic.
    if (firstPlayer === null && engine.state.night >= 1) firstPlayer = engine.state.firstPlayer;
    const outcome = engine.apply(action);
    if (!outcome.ok) throw new Error(`engine rejected action in game ${seed}: ${outcome.error}`);
    for (const player of [0, 1]) {
      const count = countCards(engine.state, player);
      if (count !== DECK_SIZE) {
        throw new Error(`card conservation broken in game ${seed}: P${player} ${count} != ${DECK_SIZE}`);
      }
    }
    actionsTaken += 1;
  }
  if (firstPlayer === null) throw new Error(`game ${seed} never revealed its night-1 first player`);
  if (options.onFirstPlayer) options.onFirstPlayer(firstPlayer);
  const result = engine.result();
  if (!result) throw new Error(`game ${seed} ended without a result`);
  return { result, actionsTaken, engine };
}

/** Run one compensation group over the shared seed set and return a JSON-ready summary. */
export function runExperiment(options = {}) {
  const games = options.games ?? DEFAULT_GAMES;
  const compensation = options.compensation ?? {};
  const stats = {
    games: 0,
    firstPlayerWins: 0,
    secondPlayerWins: 0,
    draws: 0,
    p0Wins: 0,
    p1Wins: 0,
    firstPlayerIsP0: 0,
    reasons: Object.create(null),
    endingNight: Object.create(null),
    totalActions: 0,
    maxActionsPerGame: 0,
  };
  const startedAt = Date.now();

  for (let index = 0; index < games; index += 1) {
    const seed = `${options.seedPrefix ?? 'balance-v1.1'}-${index}`;
    let firstPlayer = null;
    const { result, actionsTaken } = playExperimentGame({
      ...options,
      seed,
      compensation,
      onFirstPlayer: (fp) => { firstPlayer = fp; },
    });
    if (firstPlayer === null) throw new Error(`game ${seed} never revealed its night-1 first player`);

    stats.games += 1;
    if (firstPlayer === 0) stats.firstPlayerIsP0 += 1;
    if (result.winner === firstPlayer) stats.firstPlayerWins += 1;
    else if (result.winner === 1 - firstPlayer) stats.secondPlayerWins += 1;
    else stats.draws += 1;
    if (result.winner === 0) stats.p0Wins += 1;
    else if (result.winner === 1) stats.p1Wins += 1;
    stats.reasons[result.reason] = (stats.reasons[result.reason] ?? 0) + 1;
    stats.endingNight[result.night] = (stats.endingNight[result.night] ?? 0) + 1;
    stats.totalActions += actionsTaken;
    stats.maxActionsPerGame = Math.max(stats.maxActionsPerGame, actionsTaken);
  }

  const rate = (count) => Number((count / stats.games).toFixed(4));
  return {
    ok: true,
    games: stats.games,
    compensation,
    wins: {
      firstPlayer: stats.firstPlayerWins,
      secondPlayer: stats.secondPlayerWins,
      draw: stats.draws,
      p0: stats.p0Wins,
      p1: stats.p1Wins,
    },
    firstPlayerWinRate: rate(stats.firstPlayerWins),
    secondPlayerWinRate: rate(stats.secondPlayerWins),
    p0WinRate: rate(stats.p0Wins),
    p1WinRate: rate(stats.p1Wins),
    firstPlayerIsP0Rate: rate(stats.firstPlayerIsP0),
    reasons: stats.reasons,
    endingNight: stats.endingNight,
    sanityEndingRatio: rate(stats.reasons.sanity ?? 0),
    totalActions: stats.totalActions,
    avgActionsPerGame: Number((stats.totalActions / stats.games).toFixed(2)),
    maxActionsPerGame: stats.maxActionsPerGame,
    elapsedMs: Date.now() - startedAt,
    seedPrefix: options.seedPrefix ?? 'balance-v1.1',
    conservation: 'ok',
  };
}

const MATRIX_GROUPS = [
  { name: 'baseline', compensation: {} },
  { name: 'extraMulligan=1', compensation: { extraMulligan: 1 } },
  { name: 'extraMulligan=2', compensation: { extraMulligan: 2 } },
  { name: 'extraStartingCard=1', compensation: { extraStartingCard: 1 } },
  { name: 'extraStartingCard=2', compensation: { extraStartingCard: 2 } },
  { name: 'night1Sanity=1', compensation: { night1Sanity: 1 } },
  { name: 'night1Sanity=2', compensation: { night1Sanity: 2 } },
];

const isCli = typeof process.argv[1] === 'string'
  && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isCli) {
  const games = Math.max(1, Number(arg('games', DEFAULT_GAMES)) || DEFAULT_GAMES);
  const seedPrefix = arg('seed', 'balance-v1.1');
  const common = { games, seedPrefix, maxActions: Number(arg('maxActions', DEFAULT_MAX_ACTIONS)) };
  const matrixFlag = hasFlag('matrix');

  const output = matrixFlag
    ? {
      ok: true,
      games,
      seedPrefix,
      groups: MATRIX_GROUPS.map((group) => ({
        name: group.name,
        ...runExperiment({ ...common, compensation: group.compensation }),
      })),
    }
    : runExperiment({
      ...common,
      compensation: parseCompensation(arg('comp', 'none'), Math.max(0, Number(arg('value', 1)) || 0)),
    });

  const json = JSON.stringify(output, null, 2);
  const outPath = arg('out', undefined);
  if (outPath) writeFileSync(outPath, `${json}\n`, 'utf8');
  console.log(json);
}
