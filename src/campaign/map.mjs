/**
 * src/campaign/map.mjs — deterministic layered node-map generator.
 *
 * Produces a DAG of TIER_COUNT tiers: a fixed start (tier 0) and boss (last
 * tier), with 2–3 typed nodes per interior tier.  Edge generation guarantees
 * every node is reachable from the start and the boss is always reachable.
 * Pure apart from consuming the injected rng holder ({ rngState }).
 */

import { hashSeed, randInt } from '../engine/rng.js';

export const TIER_COUNT = 7;

// Per-tier sampling tables; the chosen node count takes a shuffled prefix.
const TIER_TYPE_TABLES = Object.freeze([
  ['start'],
  ['battle', 'battle', 'event'],
  ['battle', 'elite', 'treasure'],
  ['battle', 'event', 'rest'],
  ['battle', 'elite', 'treasure'],
  ['battle', 'battle', 'event'],
  ['boss'],
]);

function nodeCountForTier(tier, holder) {
  if (tier === 0 || tier === TIER_COUNT - 1) return 1;
  return 2 + randInt(holder, 2); // 2 or 3
}

function typesForTier(tier, count, holder) {
  if (tier === 0) return ['start'];
  if (tier === TIER_COUNT - 1) return ['boss'];
  const table = TIER_TYPE_TABLES[tier].slice();
  for (let i = table.length - 1; i > 0; i -= 1) {
    const j = randInt(holder, i + 1);
    [table[i], table[j]] = [table[j], table[i]];
  }
  return table.slice(0, count);
}

/** Connect one tier boundary; guarantees full in/out coverage then adds branches. */
function connectTiers(holder, idsA, idsB) {
  const edgeSet = new Set();
  const outgoing = new Map(idsA.map((id) => [id, new Set()]));

  function add(a, b) {
    const key = `${a}>${b}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    outgoing.get(a).add(b);
  }

  // Every B node gets at least one incoming edge.
  idsB.forEach((b, index) => { add(idsA[index % idsA.length], b); });
  // Every A node gets at least one outgoing edge.
  for (const a of idsA) {
    if (outgoing.get(a).size === 0) add(a, idsB[randInt(holder, idsB.length)]);
  }
  // Optional branching: a node may gain a second distinct connection.
  for (const a of idsA) {
    if (idsB.length > 1 && randInt(holder, 2) === 1) {
      add(a, idsB[randInt(holder, idsB.length)]);
    }
  }

  return [...edgeSet].map((key) => {
    const [from, to] = key.split('>');
    return { from, to };
  });
}

export function generateMap(holder) {
  const tiers = [];
  for (let tier = 0; tier < TIER_COUNT; tier += 1) {
    const count = nodeCountForTier(tier, holder);
    const types = typesForTier(tier, count, holder);
    tiers.push(Array.from({ length: count }, (_, index) => ({
      id: `n${tier}-${index}`,
      tier,
      type: types[index],
    })));
  }

  const edges = [];
  for (let tier = 0; tier < TIER_COUNT - 1; tier += 1) {
    edges.push(...connectTiers(
      holder,
      tiers[tier].map((node) => node.id),
      tiers[tier + 1].map((node) => node.id),
    ));
  }

  const nodeById = Object.fromEntries(tiers.flat().map((node) => [node.id, node]));
  return { tiers, edges, nodeById };
}

export function generateMapForSeed(seed) {
  return generateMap({ rngState: hashSeed(seed) });
}

/** Ids directly reachable from a node (forward edges only). */
export function outgoingIds(map, nodeId) {
  return map.edges.filter((edge) => edge.from === nodeId).map((edge) => edge.to);
}

/**
 * Structural validation: every node reachable from the start, the boss
 * reachable, edges only between adjacent tiers, and no dangling references.
 */
export function validateMap(map) {
  const errors = [];
  const startId = map.tiers[0][0].id;
  const bossId = map.tiers[TIER_COUNT - 1][0].id;

  for (const edge of map.edges) {
    const from = map.nodeById[edge.from];
    const to = map.nodeById[edge.to];
    if (!from) errors.push(`edge from unknown node ${edge.from}`);
    if (!to) errors.push(`edge to unknown node ${edge.to}`);
    if (from && to && to.tier !== from.tier + 1) {
      errors.push(`edge ${edge.from}->${edge.to} skips a tier`);
    }
  }

  const seen = new Set([startId]);
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift();
    for (const next of outgoingIds(map, id)) {
      if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }

  for (const node of map.tiers.flat()) {
    if (!seen.has(node.id)) errors.push(`node ${node.id} unreachable from start`);
  }
  if (!seen.has(bossId)) errors.push('boss unreachable');

  return { ok: errors.length === 0, errors };
}

export default generateMap;
