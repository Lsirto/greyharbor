/**
 * tests/ui-v2/selection.test.mjs — pure selection state machine tests.
 * Card uids and limits come from a real engine mulligan view.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../../src/engine/v2/index.js';
import { createSelection, Selection } from '../../src/ui-v2/selection.mjs';
import { matchAction } from '../../src/ui-v2/action-matcher.mjs';

const engine = createGame({ seed: 'selection-real-hand' });
const view = engine.viewFor(0);
const handUids = view.players[0].hand.map((card) => card.uid);
const limit = view.actions
  .filter((action) => action.type === 'mulligan' && action.player === 0)
  .reduce((max, action) => Math.max(max, action.uids.length), 0);

function fresh() {
  return createSelection({ limit, allowedUids: handUids });
}

test('真实手牌与合法上限驱动初始状态', () => {
  const state = fresh();
  assert.equal(state.limit, limit);
  assert.ok(limit >= 2 && limit <= 4);
  assert.equal(state.selectedUid, null);
  assert.deepEqual(state.markedUids, []);
  assert.equal(state.size, 0);
  assert.equal(state.isMarked(handUids[0]), false);
  const snapshot = state.snapshot();
  snapshot.markedUids.push('p0-ghost');
  assert.deepEqual(state.markedUids, [], '快照必须是副本');
});

test('选牌：点击选中、再次点击取消、无效 uid 清空', () => {
  const state = fresh();
  assert.deepEqual(state.select(handUids[0]), { ok: true, changed: true });
  assert.equal(state.selectedUid, handUids[0]);
  assert.deepEqual(state.select(handUids[0]), { ok: true, changed: false });
  assert.equal(state.selectedUid, handUids[0]);
  assert.equal(state.select(handUids[1]).ok, true);
  assert.equal(state.selectedUid, handUids[1]);
  assert.equal(state.clearSelection(), true);
  assert.equal(state.selectedUid, null);
  assert.equal(state.clearSelection(), false);
  state.select(handUids[0]);
  assert.deepEqual(state.select(null), { ok: true, changed: true });
  assert.equal(state.selectedUid, null);
  state.select(handUids[0]);
  assert.deepEqual(state.select(42), { ok: true, changed: true });
  assert.equal(state.selectedUid, null);
});

test('换牌标记集合：toggle / unmark / 上限校验', () => {
  const state = fresh();
  assert.deepEqual(state.toggleMark(handUids[0]), { ok: true, changed: true, marked: true });
  assert.equal(state.isMarked(handUids[0]), true);
  assert.deepEqual(state.toggleMark(handUids[0]), { ok: true, changed: true, marked: false });
  assert.equal(state.size, 0);

  assert.deepEqual(state.mark(handUids[0]), { ok: true, changed: true });
  assert.deepEqual(state.mark(handUids[0]), { ok: true, changed: false }, '重复标记不算错误');
  for (let i = 1; i < limit; i += 1) {
    assert.equal(state.mark(handUids[i]).ok, true);
  }
  assert.equal(state.size, limit);
  const overflow = state.mark(handUids[limit]);
  assert.equal(overflow.ok, false);
  assert.equal(overflow.reason, 'limit');
  assert.equal(state.size, limit);

  assert.deepEqual(state.unmark(handUids[0]), { ok: true, changed: true });
  assert.deepEqual(state.unmark(handUids[0]), { ok: true, changed: false });
  assert.equal(state.mark(handUids[limit]).ok, true, '腾出名额后可以标记新卡');
  assert.equal(state.clearMarks(), true);
  assert.equal(state.size, 0);
  assert.equal(state.clearMarks(), false);
});

test('越界 uid / 非字符串 uid 拒绝且不改变状态', () => {
  const state = fresh();
  for (const uid of ['p0-999', '', null, 42, {}]) {
    const result = state.mark(uid);
    assert.equal(result.ok, false, `${String(uid)} 不应被接受`);
    assert.ok(result.reason, '拒绝时必须给出原因');
  }
  assert.deepEqual(state.markedUids, []);
  assert.equal(state.toggleMark('p0-999').ok, false);
  assert.deepEqual(state.markedUids, []);
});

test('setMarked 原子替换，重复/越界/超限整体拒绝', () => {
  const state = fresh();
  assert.deepEqual(state.setMarked(handUids.slice(0, 2)), { ok: true, changed: true });
  assert.deepEqual(state.markedUids, handUids.slice(0, 2));
  assert.deepEqual(state.setMarked(handUids.slice(0, 2)), { ok: true, changed: false });
  assert.equal(state.setMarked([handUids[0], handUids[0]]).reason, 'duplicate');
  assert.equal(state.setMarked([handUids[0], 'p0-999']).reason, 'not-allowed');
  assert.equal(state.setMarked(handUids.slice(0, limit + 1)).reason, 'limit');
  assert.equal(state.setMarked('bad').reason, 'invalid-list');
  assert.deepEqual(state.markedUids, handUids.slice(0, 2), '失败不应污染状态');

  const setLimit = state.setLimit(1);
  assert.equal(setLimit.ok, false);
  assert.equal(setLimit.reason, 'limit');
  assert.equal(state.limit, limit);
  assert.equal(state.setLimit(limit + 1).ok, true);
  assert.equal(state.limit, limit + 1);
});

test('reset / restore 快照后仍可用于真实 mulligan 动作匹配', () => {
  const state = fresh();
  state.select(handUids[0]);
  state.setMarked(handUids.slice(0, 2));
  const snapshot = state.snapshot();

  const matched = matchAction(view.actions, { type: 'mulligan', uids: state.markedUids });
  assert.ok(matched, '标记集合必须对应一个真实合法动作');
  assert.equal(matched.type, 'mulligan');
  assert.equal(matched.uids.length, 2);

  const restored = createSelection();
  restored.reset(snapshot);
  assert.equal(restored.selectedUid, handUids[0]);
  assert.deepEqual(restored.markedUids, handUids.slice(0, 2));
  assert.strictEqual(matchAction(view.actions, { type: 'mulligan', uids: restored.markedUids }), matched);

  restored.reset({ limit: 0, allowedUids: [] });
  assert.equal(restored.limit, 0);
  assert.equal(restored.size, 0);
  assert.equal(restored.selectedUid, null);
  assert.strictEqual(matchAction(view.actions, { type: 'mulligan', uids: restored.markedUids }),
    view.actions.find((action) => action.type === 'mulligan' && action.uids.length === 0));
});

test('坏数据构造与调用不抛异常', () => {
  assert.doesNotThrow(() => {
    for (const value of [null, undefined, 42, 'bad', []]) {
      const state = new Selection(value);
      assert.equal(typeof state.mark(null).ok, 'boolean');
      assert.equal(typeof state.select(null).ok, 'boolean');
      assert.equal(state.snapshot().selectedUid, null);
    }
  });
  assert.doesNotThrow(() => {
    const state = createSelection({ limit: -5, allowedUids: [1, null, handUids[0]] });
    assert.equal(state.limit, 0);
    assert.equal(state.mark(handUids[0]).ok, false);
  });
});
