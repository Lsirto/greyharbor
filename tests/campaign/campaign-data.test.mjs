/**
 * tests/campaign/campaign-data.test.mjs — relic & narrative event data contract.
 * Pure frozen data; validates shapes, uniqueness and the operation DSL names.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { RELICS, getRelic } from '../../src/campaign/data/relics.mjs';
import { EVENTS, getEvent } from '../../src/campaign/data/events.mjs';

const VALID_OPS = new Set(['supplies', 'addCard', 'removeCard', 'addRelic', 'random']);

test('遗物：8 件，id 唯一，字段齐全且 scope 合法', () => {
  assert.equal(RELICS.length, 8);
  const ids = new Set();
  for (const relic of RELICS) {
    assert.ok(typeof relic.id === 'string' && relic.id.length > 0);
    assert.equal(ids.has(relic.id), false, `重复遗物 id ${relic.id}`);
    ids.add(relic.id);
    assert.ok(relic.nameZh && relic.nameEn && relic.description && relic.flavor);
    assert.ok(relic.scope === 'battle' || relic.scope === 'run');
    if (relic.scope === 'battle') assert.ok(relic.battle && typeof relic.battle === 'object');
    if (relic.scope === 'run') assert.ok(relic.run && typeof relic.run === 'object');
  }
});

test('遗物 getter 命中返回对象，未知 id 返回 null', () => {
  assert.equal(getRelic(RELICS[0].id), RELICS[0]);
  assert.equal(getRelic('no-such-relic'), null);
});

test('事件：6 个，id 唯一，每个至少 2 个选择且带正文', () => {
  assert.equal(EVENTS.length, 6);
  const ids = new Set();
  for (const event of EVENTS) {
    assert.ok(typeof event.id === 'string');
    assert.equal(ids.has(event.id), false);
    ids.add(event.id);
    assert.ok(event.title && event.flavor);
    assert.ok(Array.isArray(event.choices) && event.choices.length >= 2);
    for (const choice of event.choices) {
      assert.ok(typeof choice.label === 'string' && choice.label.length > 0);
      assert.ok(Array.isArray(choice.operations));
    }
  }
});

test('事件操作 DSL 只使用已登记的 op 名，random 带权重 outcomes', () => {
  function checkOperations(operations) {
    for (const operation of operations) {
      assert.ok(VALID_OPS.has(operation.op), `非法 op: ${operation.op}`);
      if (operation.op === 'random') {
        assert.ok(Array.isArray(operation.outcomes) && operation.outcomes.length >= 2);
        for (const outcome of operation.outcomes) {
          assert.ok(Number.isFinite(outcome.weight) && outcome.weight > 0);
          checkOperations(outcome.operations);
        }
      }
    }
  }
  for (const event of EVENTS) {
    for (const choice of event.choices) checkOperations(choice.operations);
  }
});

test('带 condition 的选择声明了可识别的条件键', () => {
  const conditionKeys = new Set(['supplies', 'relic', 'card']);
  for (const event of EVENTS) {
    for (const choice of event.choices) {
      if (!choice.condition) continue;
      for (const key of Object.keys(choice.condition)) {
        assert.ok(conditionKeys.has(key), `非法 condition 键 ${key}`);
      }
    }
  }
});

test('事件 getter 命中返回对象，未知 id 返回 null', () => {
  assert.equal(getEvent(EVENTS[0].id), EVENTS[0]);
  assert.equal(getEvent('missing-event'), null);
});
