/**
 * scripts/ai-match.mjs — AI vs random / AI vs AI 对局驱动与统计。
 *
 *   node scripts/ai-match.mjs --mode=ai-vs-random --games=200
 *   node scripts/ai-match.mjs --mode=ai-vs-ai --games=1000
 *
 * 与 scripts/selfplay.mjs 同样的驱动方式：只用 engine.getActions() /
 * engine.viewFor() / engine.apply()，每步检查牌数守恒与动作合法性。
 * AI 侧只消费 buildView(pov) 的脱敏视角。
 */

import { createGame, countCards } from '../src/engine/v2/index.js';
import { hashSeed, nextRandom } from '../src/engine/rng.js';
import { chooseAction } from '../src/ai/v2/ai.mjs';

const DECK_SIZE = 19;
const DEFAULT_MAX_ACTIONS = 400;

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

function normalizeMode(mode) {
  if (mode === 'ai-vs-ai' || mode === 'aivai') return 'ai-vs-ai';
  if (mode === 'ai-vs-random' || mode === 'aivrandom' || mode === 'ai-vs-rnd') return 'ai-vs-random';
  throw new Error(`unknown mode: ${mode} (expected ai-vs-random|ai-vs-ai)`);
}

/**
 * 打一局。返回 { result, actionsTaken, engine }。
 * validate({ player, view, action, engine }) 可用于测试里断言动作属于 view.actions。
 */
export function playMatch(options = {}) {
  const mode = normalizeMode(options.mode ?? 'ai-vs-random');
  const seed = options.seed ?? 'ai-match';
  const maxActions = options.maxActions ?? DEFAULT_MAX_ACTIONS;
  const aiSeat = options.aiSeat ?? 0;
  const aiSeats = mode === 'ai-vs-ai' ? [0, 1] : [aiSeat];

  const engine = createGame({ seed });
  const random = { rngState: hashSeed(options.randomSeed ?? `ai-match-random:${seed}`) };
  const pick = (items) => items[Math.floor(nextRandom(random) * items.length)];
  const aiSeed = (p) => options.aiSeed
    ? `${options.aiSeed}:${p}:${seed}`
    : `ai-match-ai:${p}:${seed}`;

  let actionsTaken = 0;

  const decide = (p, view) => {
    const actions = view.actions;
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error(`no legal actions for P${p} (phase=${engine.phase}, step=${actionsTaken})`);
    }
    if (aiSeats.includes(p)) return chooseAction(view, { seed: aiSeed(p) });
    return pick(actions);
  };

  while (engine.phase !== 'gameOver') {
    if (actionsTaken >= maxActions) {
      throw new Error(`game ${seed} exceeded ${maxActions} actions (possible deadlock)`);
    }

    let player;
    if (engine.phase === 'mulligan') {
      const pending = engine.pending;
      if (!pending?.players?.length) {
        throw new Error(`mulligan phase without pending player in game ${seed}`);
      }
      player = pending.players[0];
    } else {
      player = engine.current;
    }

    const view = engine.viewFor(player);
    const action = decide(player, view);
    if (!view.actions.includes(action)) {
      throw new Error(`action not from view.actions for P${player} in game ${seed}`);
    }
    if (typeof options.validate === 'function') {
      options.validate({ player, view, action, engine, step: actionsTaken });
    }

    const outcome = engine.apply(action);
    if (!outcome.ok) {
      throw new Error(`engine rejected action in game ${seed}: ${outcome.error}`);
    }

    for (const p of [0, 1]) {
      const count = countCards(engine.state, p);
      if (count !== DECK_SIZE) {
        throw new Error(`card conservation broken in game ${seed}: P${p} has ${count} != ${DECK_SIZE}`);
      }
    }
    actionsTaken += 1;
  }

  const result = engine.result();
  if (!result) throw new Error(`game ${seed} ended without a result`);
  return { result, actionsTaken, engine };
}

/** 跑 N 局并汇总 JSON 统计。 */
export function runMatches(options = {}) {
  const games = options.games ?? 1;
  const mode = normalizeMode(options.mode ?? 'ai-vs-random');
  // 未显式指定 --seat 时左右座位轮换，避免预设牌组强度差污染胜率统计。
  const alternateSeats = options.aiSeat === undefined && mode === 'ai-vs-random';
  const aiSeats = mode === 'ai-vs-ai' ? [0, 1] : (alternateSeats ? [0, 1] : [options.aiSeat]);

  const stats = {
    games: 0,
    aiWins: 0,
    p0Wins: 0,
    p1Wins: 0,
    draws: 0,
    reasons: Object.create(null),
    nights: Object.create(null),
    totalActions: 0,
    maxActionsPerGame: 0,
  };
  const startedAt = Date.now();

  for (let index = 0; index < games; index += 1) {
    const seed = `${options.seedPrefix ?? 'ai-match'}-${index}`;
    const gameAiSeat = alternateSeats ? (index % 2) : (options.aiSeat ?? 0);
    const { result, actionsTaken } = playMatch({ ...options, mode, seed, aiSeat: gameAiSeat });
    stats.games += 1;
    if (result.winner === 0) stats.p0Wins += 1;
    else if (result.winner === 1) stats.p1Wins += 1;
    else stats.draws += 1;
    if (result.winner === gameAiSeat) stats.aiWins += 1;

    stats.reasons[result.reason] = (stats.reasons[result.reason] ?? 0) + 1;
    stats.nights[result.night] = (stats.nights[result.night] ?? 0) + 1;
    stats.totalActions += actionsTaken;
    stats.maxActionsPerGame = Math.max(stats.maxActionsPerGame, actionsTaken);
  }

  const elapsedMs = Date.now() - startedAt;
  return {
    ok: true,
    mode,
    games: stats.games,
    elapsedMs,
    aiSeats,
    wins: { ai: stats.aiWins, p0: stats.p0Wins, p1: stats.p1Wins, draw: stats.draws },
    aiWinRate: Number((stats.aiWins / stats.games).toFixed(4)),
    reasons: stats.reasons,
    endingNight: stats.nights,
    sanityEndingRatio: Number(((stats.reasons.sanity ?? 0) / stats.games).toFixed(4)),
    totalActions: stats.totalActions,
    avgActionsPerGame: Number((stats.totalActions / stats.games).toFixed(2)),
    maxActionsPerGame: stats.maxActionsPerGame,
    conservation: 'ok',
  };
}

const isCli = typeof process.argv[1] === 'string'
  && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isCli) {
  const mode = normalizeMode(arg('mode', 'ai-vs-random'));
  const games = Math.max(1, Number(arg('games', '200')) || 200);
  const seatArg = arg('seat', undefined);
  const summary = runMatches({
    mode,
    games,
    aiSeat: seatArg === undefined ? undefined : (Number(seatArg) === 1 ? 1 : 0),
    seedPrefix: arg('seed', mode === 'ai-vs-ai' ? 'ai-vs-ai' : 'ai-vs-random'),
  });
  console.log(JSON.stringify(summary, null, 2));
}
