/**
 * src/campaign/battle.mjs — build a single battle from run state and run it
 * headlessly with the evaluation AI driving both seats.
 *
 * Relic `battle` descriptors are translated into existing createGame options
 * (mechanics toggles, compensation mulligan, starting-sanity floor); no engine
 * special-casing is added. Elite/boss difficulty uses a lower starting sanity.
 */

import { createGame } from '../engine/v2/index.js';
import { chooseAction } from '../ai/v2/ai.mjs';
import { getRelic } from './data/relics.mjs';

const MAX_BATTLE_STEPS = 400;

/** Translate run + node into createGame() options. */
export function buildBattleConfig(run, node) {
  const mechanics = { anomaly: true, chaosBag: true, objectives: true };
  let extraMulligan = 0;
  let sanityFloor = 0;

  for (const id of run.relics) {
    const relic = getRelic(id);
    if (relic?.scope !== 'battle') continue;
    const descriptor = relic.battle;
    if (descriptor.mechanics) Object.assign(mechanics, descriptor.mechanics);
    if (descriptor.compensation?.extraMulligan) {
      extraMulligan = Math.max(extraMulligan, descriptor.compensation.extraMulligan);
    }
    if (descriptor.startingSanityFloor) {
      sanityFloor = Math.max(sanityFloor, descriptor.startingSanityFloor);
    }
  }

  // Difficulty: lower starting sanity for elite/boss unless a relic floors it.
  let playerSanity = node.type === 'elite' ? 5 : node.type === 'boss' ? 4 : 6;
  if (sanityFloor) playerSanity = Math.max(playerSanity, sanityFloor);

  const opponentFaction = run.faction === 'society' ? 'cult' : 'society';
  const seed = `${run.seed}#battle-${node.id}`;

  const options = {
    seed,
    decks: [
      { leader: run.leaderId, cards: run.deck.slice() },
      opponentFaction,
    ],
    startingSanity: [playerSanity, 6],
    mechanics,
    names: ['调查员', '对手'],
  };
  if (extraMulligan > 0) {
    options.firstPlayerCompensation = { extraMulligan };
  }
  return options;
}

/** Run a battle to completion; returns the engine result (frozen clone). */
export function runHeadlessBattle(run, node) {
  const config = buildBattleConfig(run, node);
  const engine = createGame(config);
  let steps = 0;

  while (engine.phase !== 'gameOver') {
    if (steps >= MAX_BATTLE_STEPS) throw new Error(`battle ${config.seed} deadlocked`);
    let player;
    if (engine.phase === 'mulligan') {
      player = engine.pending.players[0];
    } else {
      player = engine.current;
    }
    const view = engine.viewFor(player);
    const action = chooseAction(view, { seed: `${config.seed}#ai-${player}` });
    const outcome = engine.apply(action);
    if (!outcome.ok) throw new Error(`battle rejected action: ${outcome.error}`);
    steps += 1;
  }

  return engine.result();
}
