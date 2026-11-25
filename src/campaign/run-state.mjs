/**
 * src/campaign/run-state.mjs — deterministic Roguelike run state machine.
 *
 * Pure headless logic (no DOM): createRun, move between connected nodes, and
 * resolve each node's pending step (event / battle / reward / relic / rest).
 * The run player is always seat 0 in battles; the opponent is the other
 * faction preset. Mutating helpers return { ok, ... } and report expected
 * rule violations rather than throwing.
 */

import { hashSeed, randInt } from '../engine/rng.js';
import { PRESET_DECKS } from '../engine/v2/cards.js';
import { generateMap, outgoingIds } from './map.mjs';
import { EVENTS, getEvent } from './data/events.mjs';
import { applyOperations } from './operations.mjs';
import {
  battleSupplies,
  cardRewardOptions,
  relicRewardOptions,
  restSupplies,
} from './rewards.mjs';
import { runHeadlessBattle } from './battle.mjs';

export const RUN_VERSION = '3.0';

const ok = () => ({ ok: true });
const bad = (error) => ({ ok: false, error });

export function createRun(options = {}) {
  const seed = options.seed ?? 'greyharbor-run';
  const faction = options.faction === 'cult' ? 'cult' : 'society';
  const preset = PRESET_DECKS[faction];

  const run = {
    version: RUN_VERSION,
    seed,
    faction,
    leaderId: preset.leader,
    deck: preset.cards.slice(),
    relics: [],
    supplies: 0,
    status: 'active',
    rngState: hashSeed(seed),
    map: null,
    currentTier: 0,
    currentNodeId: null,
    completedNodes: [],
    pending: null,
    log: [],
  };
  run.map = generateMap(run);
  run.currentNodeId = run.map.tiers[0][0].id;
  return run;
}

/** Nodes the player can move to right now (forward edges, while idle). */
export function availableNextNodes(run) {
  if (run.status !== 'active' || run.pending !== null) return [];
  return outgoingIds(run.map, run.currentNodeId);
}

function record(run, text) {
  run.log.push({ tier: run.currentTier, nodeId: run.currentNodeId, text });
}

function currentNode(run) {
  return run.map.nodeById[run.currentNodeId];
}

/** Move into a connected node and open its first pending step. */
export function enterNode(run, nodeId) {
  if (run.status !== 'active') return bad('run is not active');
  if (run.pending !== null) return bad('current node is not resolved');
  if (!availableNextNodes(run).includes(nodeId)) return bad('node is not connected');

  const node = run.map.nodeById[nodeId];
  run.currentNodeId = nodeId;
  run.currentTier = node.tier;

  switch (node.type) {
    case 'event':
      run.pending = { kind: 'event', eventId: EVENTS[randInt(run, EVENTS.length)].id };
      break;
    case 'battle':
    case 'elite':
    case 'boss':
      run.pending = { kind: 'battle', nodeType: node.type };
      break;
    case 'rest':
      run.pending = { kind: 'rest' };
      break;
    case 'treasure':
      run.pending = { kind: 'treasure' };
      break;
    default:
      return bad(`unknown node type ${node.type}`);
  }
  return ok();
}

/** Whether an event choice's condition is currently satisfied. */
export function eventChoiceAvailable(run, choice) {
  const condition = choice.condition;
  if (!condition) return true;
  if (Number.isInteger(condition.supplies) && run.supplies < condition.supplies) return false;
  if (condition.relic && !run.relics.includes(condition.relic)) return false;
  if (condition.card && !run.deck.includes(condition.card)) return false;
  return true;
}

/** Resolve an event by choosing one of its options. */
export function resolveEvent(run, choiceIndex) {
  if (run.pending?.kind !== 'event') return bad('not an event step');
  const event = getEvent(run.pending.eventId);
  const choice = event.choices[choiceIndex];
  if (!choice) return bad('invalid event choice');
  if (!eventChoiceAvailable(run, choice)) return bad('event choice condition not met');

  applyOperations(run, choice.operations);
  record(run, `事件：${event.title}`);
  return finishNode(run);
}

/** Run the pending battle headlessly; on a win open the reward step. */
export function resolveBattle(run) {
  if (run.pending?.kind !== 'battle') return bad('not a battle step');
  const node = currentNode(run);
  const result = runHeadlessBattle(run, node);

  if (result.winner !== 0) {
    run.status = 'lost';
    run.pending = null;
    record(run, '战斗失败，调查终止');
    return ok();
  }

  run.supplies += battleSupplies(run, node.type);
  record(run, `战斗胜利（${node.type}）`);
  run.pending = {
    kind: 'cardReward',
    nodeType: node.type,
    cardOptions: cardRewardOptions(run),
    relicOptions: node.type === 'elite' ? relicRewardOptions(run) : null,
  };
  return ok();
}

/** Choose a card reward (index) or skip it (index = -1). */
export function chooseCardReward(run, index) {
  if (run.pending?.kind !== 'cardReward') return bad('not a card reward step');
  if (index === -1) { /* skip */ } else {
    const cardId = run.pending.cardOptions[index];
    if (!cardId) return bad('invalid card reward');
    run.deck.push(cardId);
  }

  if (run.pending.relicOptions) {
    run.pending = { kind: 'relicReward', relicOptions: run.pending.relicOptions };
    return ok();
  }
  return finishNode(run);
}

/** Choose a relic reward (index) or skip it (index = -1). */
export function chooseRelicReward(run, index) {
  if (run.pending?.kind !== 'relicReward') return bad('not a relic reward step');
  if (index !== -1) {
    const relicId = run.pending.relicOptions[index];
    if (!relicId) return bad('invalid relic reward');
    if (!run.relics.includes(relicId)) run.relics.push(relicId);
  }
  return finishNode(run);
}

/** Treasure node: gain supplies then choose from relic options. */
export function resolveTreasure(run) {
  if (run.pending?.kind !== 'treasure') return bad('not a treasure step');
  run.supplies += battleSupplies(run, 'treasure');
  record(run, '发现宝藏');
  run.pending = { kind: 'relicReward', relicOptions: relicRewardOptions(run) };
  return ok();
}

/** Rest: take the supplies option. */
export function chooseRestSupplies(run) {
  if (run.pending?.kind !== 'rest') return bad('not a rest step');
  run.supplies += restSupplies(run);
  record(run, '休整：获得物资');
  return finishNode(run);
}

/** Rest: remove a card by deck index (deck trimming). */
export function chooseRestRemove(run, index) {
  if (run.pending?.kind !== 'rest') return bad('not a rest step');
  if (index < 0 || index >= run.deck.length) return bad('invalid remove index');
  const [removed] = run.deck.splice(index, 1);
  record(run, `休整：弃置 ${removed}`);
  return finishNode(run);
}

/** Clear the pending step, mark the node done, and detect the boss win. */
function finishNode(run) {
  const node = currentNode(run);
  run.completedNodes.push(node.id);
  run.pending = null;
  if (node.type === 'boss') {
    run.status = 'won';
    record(run, 'Boss 已被击败，调查成功');
  }
  return ok();
}

export default createRun;
