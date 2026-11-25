/**
 * tests/ui-v2/action-matcher.test.mjs — matcher tests against real engine
 * action lists.  No DOM; every action comes from buildView(pov).actions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../../src/engine/v2/index.js';
import { chooseAction } from '../../src/ai/v2/ai.mjs';
import { matchAction, findMatchingActions } from '../../src/ui-v2/action-matcher.mjs';

/** Play a full seeded game with the real AI and keep every generated view. */
function snapshotsFor(seed, maxSteps = 260) {
  const engine = createGame({ seed });
  const snapshots = [];
  for (let step = 0; step < maxSteps && engine.phase !== 'gameOver'; step += 1) {
    for (const pov of [0, 1]) {
      const snapshot = engine.viewFor(pov);
      if (snapshot.actions.length) snapshots.push(snapshot);
    }
    const actor = engine.phase === 'mulligan'
      ? (engine.viewFor(0).mulliganDone[0] !== true ? 0 : 1)
      : engine.current;
    const decisionView = engine.viewFor(actor);
    const action = chooseAction(decisionView, { seed: `${seed}:${step}` });
    if (!action) break;
    const outcome = engine.apply(action);
    if (!outcome.ok) break;
  }
  return snapshots;
}

const SNAPSHOTS = snapshotsFor('action-matcher-real-game');
const ALL = SNAPSHOTS.flatMap((view) => view.actions.map((action) => ({ view, action })));

function first(predicate) {
  const entry = ALL.find(({ action }) => predicate(action));
  assert.ok(entry, 'real game should supply a matching action');
  return entry;
}

test('真实 view.actions：单位卡在各地点槽位严格匹配且引用一致', () => {
  for (const location of ['scene', 'archive', 'dream']) {
    const { view, action } = first((candidate) =>
      candidate.type === 'playCard'
      && candidate.location === location
      && Number.isInteger(candidate.slot)
      && !candidate.hostUid
      && candidate.faceDown === false
      && candidate.choice === null,
    );
    const matched = matchAction(view.actions, {
      type: 'playCard',
      uid: action.uid,
      location,
      slot: action.slot,
      faceDown: false,
      choice: null,
    });
    assert.strictEqual(matched, action, `${location} 槽位必须返回原动作对象`);
    assert.strictEqual(
      matchAction(view.actions, {
        type: 'playCard', uid: action.uid, location, slot: action.slot + 7, faceDown: false, choice: null,
      }),
      null,
      '错误槽位必须返回 null',
    );
  }
});

test('隐秘单位明暗放：必须带 faceDown 才能消歧，且返回同一对象', () => {
  // The matcher always works inside one view's action list, so the face-up /
  // face-down pair must be found within a single snapshot rather than by
  // accumulating structurally equal actions across many turns.
  let pair = null;
  let owner = null;
  for (const view of SNAPSHOTS) {
    const group = new Map();
    for (const action of view.actions) {
      if (action?.type !== 'playCard' || !Number.isInteger(action.slot) || !action.location) continue;
      if (action.faceDown !== true && action.faceDown !== false) continue;
      if (action.choice) continue;
      const stableKey = `${action.uid}|${action.location}|${action.slot}`;
      if (!group.has(stableKey)) group.set(stableKey, []);
      group.get(stableKey).push(action);
    }
    pair = [...group.values()].find((list) =>
      list.length === 2 && list.some((a) => a.faceDown === true) && list.some((a) => a.faceDown === false),
    );
    if (pair) { owner = view; break; }
  }
  assert.ok(pair, '真实对局应出现隐秘卡的明/暗放两个动作');
  assert.ok(owner);
  assert.strictEqual(
    matchAction(owner.actions, {
      type: 'playCard', uid: pair[0].uid, location: pair[0].location, slot: pair[0].slot, faceDown: false,
    }),
    pair.find((a) => a.faceDown === false),
  );
  assert.strictEqual(
    matchAction(owner.actions, {
      type: 'playCard', uid: pair[0].uid, location: pair[0].location, slot: pair[0].slot, faceDown: true,
    }),
    pair.find((a) => a.faceDown === true),
  );
  assert.strictEqual(
    matchAction(owner.actions, {
      type: 'playCard', uid: pair[0].uid, location: pair[0].location, slot: pair[0].slot,
    }),
    null,
    '相同上下文产生两个动作时必须返回 null',
  );
});

test('装备宿主、事件仪式、地点与环境动作匹配', () => {
  const host = first((action) => action?.type === 'playCard' && !!action.hostUid);
  assert.strictEqual(
    matchAction(host.view.actions, {
      type: 'playCard', uid: host.action.uid, hostUid: host.action.hostUid,
      location: host.action.location, slot: host.action.slot,
    }),
    host.action,
  );
  assert.strictEqual(
    matchAction(host.view.actions, {
      type: 'playCard', uid: host.action.uid, hostUid: 'p9-not-a-host',
      location: host.action.location, slot: host.action.slot,
    }),
    null,
  );

  const event = first((action) =>
    action?.type === 'playCard' && action.location === null && action.slot === null && action.choice === null,
  );
  assert.strictEqual(
    matchAction(event.view.actions, {
      type: 'playCard', uid: event.action.uid, location: null, slot: null,
    }),
    event.action,
  );

  const locationCard = first((action) => action?.type === 'playCard' && action.location && action.slot === null);
  assert.strictEqual(
    matchAction(locationCard.view.actions, {
      type: 'playCard', uid: locationCard.action.uid, location: locationCard.action.location, slot: null,
    }),
    locationCard.action,
  );
});

test('choice 效果可按 targetUid / secondaryUids / replaceWithUid 精确匹配', () => {
  const choice = first((action) => action?.type === 'playCard' && !!action.choice?.targetUid);
  assert.strictEqual(
    matchAction(choice.view.actions, {
      type: 'playCard',
      uid: choice.action.uid,
      location: choice.action.location,
      slot: choice.action.slot,
      faceDown: choice.action.faceDown,
      choice: choice.action.choice,
    }),
    choice.action,
  );
  assert.strictEqual(
    matchAction(choice.view.actions, {
      type: 'playCard',
      uid: choice.action.uid,
      location: choice.action.location,
      slot: choice.action.slot,
      faceDown: choice.action.faceDown,
      choice: { ...choice.action.choice, targetUid: 'p9-no-such-target' },
    }),
    null,
  );
  const candidates = findMatchingActions(choice.view.actions, {
    type: 'playCard', uid: choice.action.uid, location: choice.action.location, slot: choice.action.slot,
  });
  assert.ok(candidates.length >= 1, '未指定 choice 时应返回全部候选，交由 UI 弹层选择');
  assert.ok(candidates.every((action) => choice.view.actions.includes(action)));
});

test('领袖目标、pass、reveal 与 mulligan 子集匹配', () => {
  const leader = first((action) => action?.type === 'useLeader' && !!action.targetUid);
  assert.strictEqual(
    matchAction(leader.view.actions, { type: 'useLeader', targetUid: leader.action.targetUid }),
    leader.action,
  );
  assert.strictEqual(
    matchAction(leader.view.actions, { type: 'useLeader', targetUid: 'p9-missing' }),
    null,
  );

  const passed = first((action) => action?.type === 'pass');
  assert.strictEqual(matchAction(passed.view.actions, { type: 'pass' }), passed.action);

  const reveal = first((action) => action?.type === 'reveal' && action.uids?.length === 1);
  assert.strictEqual(
    matchAction(reveal.view.actions, { type: 'reveal', uids: [reveal.action.uids[0]] }),
    reveal.action,
  );

  const opening = SNAPSHOTS.find((view) => view.phase === 'mulligan' && view.actions.some((a) => a.uids?.length >= 2));
  assert.ok(opening, '真实开局应提供换牌子集动作');
  const keep = opening.actions.find((a) => a.type === 'mulligan' && a.uids.length === 0);
  const two = opening.actions.find((a) => a.type === 'mulligan' && a.uids.length === 2);
  assert.strictEqual(matchAction(opening.actions, { type: 'mulligan', uids: [] }), keep);
  assert.strictEqual(matchAction(opening.actions, { type: 'mulligan', uids: two.uids.slice().reverse() }), two, 'uids 顺序无关');
  assert.strictEqual(
    matchAction(opening.actions, { type: 'mulligan', uids: ['p0-999', 'p0-998'] }),
    null,
  );
  assert.notStrictEqual(
    matchAction(opening.actions, { type: 'mulligan', uids: [two.uids[0]] }),
    two,
    '不同子集不能误匹配为同一个动作',
  );
  assert.strictEqual(
    matchAction(opening.actions, { type: 'mulligan', uids: [two.uids[0]] })?.uids.length,
    1,
  );
});

test('非法落点与重复上下文不会产生歧义动作', () => {
  const { view, action } = first((candidate) => candidate?.type === 'playCard' && !!candidate.uid);
  assert.strictEqual(matchAction(view.actions, { type: 'playCard', uid: 'p9-ghost' }), null);
  assert.strictEqual(matchAction(view.actions, { type: 'useLeader' }), null);
  assert.strictEqual(matchAction(view.actions, {}), null);
  assert.strictEqual(matchAction(view.actions, { type: 'playCard', uid: action.uid, location: '???' }), null);

  const duplicates = [action, { ...action }];
  assert.strictEqual(matchAction(duplicates, { type: 'playCard', uid: action.uid }), null);
  assert.equal(findMatchingActions(duplicates, { type: 'playCard', uid: action.uid }).length, 2);
});

test('坏数据不抛异常', () => {
  const cyclic = { type: 'playCard' };
  cyclic.self = cyclic;
  const calls = [
    () => matchAction(null, { type: 'pass' }),
    () => matchAction(undefined, null),
    () => matchAction('nope', { type: 'pass' }),
    () => matchAction([null, 42, 'bad', []], { type: 'pass' }),
    () => matchAction([], null),
    () => matchAction([], 42),
    () => matchAction([], cyclic),
    () => matchAction([{ type: 'mulligan', uids: 'bad' }], { uids: ['x'] }),
    () => matchAction([{ type: 'playCard', choice: 'bad' }], { choice: { mode: 'x' } }),
    () => findMatchingActions(null, {}),
    () => findMatchingActions([], {}),
  ];
  for (const call of calls) {
    assert.doesNotThrow(() => {
      const result = call();
      assert.ok(result === null || Array.isArray(result));
    });
  }
});
