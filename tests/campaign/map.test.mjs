/**
 * tests/campaign/map.test.mjs — deterministic node-map generation contract.
 * Pure functions only; no DOM.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TIER_COUNT,
  generateMap,
  generateMapForSeed,
  outgoingIds,
  validateMap,
} from '../../src/campaign/map.mjs';

test('地图有固定 7 层，起点与 Boss 类型固定', () => {
  const map = generateMapForSeed('map-structure');
  assert.equal(map.tiers.length, TIER_COUNT);
  assert.equal(map.tiers[0].length, 1);
  assert.equal(map.tiers[0][0].type, 'start');
  assert.equal(map.tiers[TIER_COUNT - 1].length, 1);
  assert.equal(map.tiers[TIER_COUNT - 1][0].type, 'boss');
});

test('内部每层 2–3 个节点，节点 id 唯一且带层号', () => {
  const map = generateMapForSeed('map-counts');
  const ids = [];
  for (let tier = 1; tier < TIER_COUNT - 1; tier += 1) {
    assert.ok(map.tiers[tier].length >= 2 && map.tiers[tier].length <= 3);
    for (const node of map.tiers[tier]) {
      assert.equal(node.tier, tier);
      ids.push(node.id);
    }
  }
  assert.equal(new Set(ids).size, ids.length);
});

test('同种子地图逐字节一致，不同种子产生不同地图', () => {
  const a = generateMapForSeed('same-seed');
  const b = generateMapForSeed('same-seed');
  assert.deepEqual(a, b);
  const c = generateMapForSeed('other-seed');
  assert.notDeepEqual(a, c);
});

test('结构校验通过：所有节点可达、Boss 可达、边只跨相邻层', () => {
  for (const seed of ['v0', 'v1', 'v2', 'v3', 'v4']) {
    const result = validateMap(generateMapForSeed(seed));
    assert.equal(result.ok, true, result.errors.join('; '));
  }
});

test('每个非末层节点至少 1 出边，每个非首节点至少 1 入边', () => {
  const map = generateMapForSeed('coverage');
  const incoming = new Set();
  for (const edge of map.edges) incoming.add(edge.to);
  for (let tier = 0; tier < TIER_COUNT - 1; tier += 1) {
    for (const node of map.tiers[tier]) {
      assert.ok(outgoingIds(map, node.id).length >= 1, `${node.id} 无出边`);
    }
  }
  for (let tier = 1; tier < TIER_COUNT; tier += 1) {
    for (const node of map.tiers[tier]) {
      assert.ok(incoming.has(node.id), `${node.id} 无入边`);
    }
  }
});

test('outgoingIds 只返回直接相连的下游节点', () => {
  const map = generateMapForSeed('outgoing');
  const startId = map.tiers[0][0].id;
  const next = outgoingIds(map, startId);
  assert.ok(next.length >= 1);
  for (const id of next) assert.equal(map.nodeById[id].tier, 1);
});

test('generateMap 消费注入的 rng holder，不依赖全局随机', () => {
  const holder = { rngState: 1234567 };
  const before = holder.rngState;
  const map = generateMap(holder);
  assert.notEqual(holder.rngState, before);
  assert.equal(validateMap(map).ok, true);
});
