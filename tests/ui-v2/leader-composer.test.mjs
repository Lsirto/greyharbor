/**
 * tests/ui-v2/leader-composer.test.mjs — Elias leader orchestration against
 * the *real* engine, plus pure bad-data resilience of the state machine.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGameController } from '../../src/ui-v2/game-controller.mjs';
import {
  LEADER_STEPS,
  createLeaderComposer,
} from '../../src/ui-v2/leader-composer.mjs';
import { findMatchingActions } from '../../src/ui-v2/action-matcher.mjs';

function makeController(seed, humanFaction) {
  const queue = [];
  const toasts = [];
  const controller = createGameController({
    seed,
    matchConfig: { humanFaction },
    aiDelay: 0,
    renderer: { render() {} },
    schedule(fn) { queue.push(fn); return queue.length; },
    cancel() {},
    toast(text, tone) { toasts.push({ text, tone }); },
  });
  return { controller, queue, toasts };
}

function drain(queue) {
  while (queue.length) queue.shift()();
}

function chooseAction(controller, target) {
  const ui = controller.getUiState();
  if (!ui.modal) return false;
  const index = ui.modal.options.findIndex((option) =>
    option.actionIndex === controller.getView().actions.indexOf(target));
  if (index < 0) return false;
  return controller.chooseModalOption(index);
}

/** Drive non-leader actions only, stopping the moment a leader skill is legal. */
function driveHumanAction(controller, action) {
  switch (action.type) {
    case 'mulligan':
      return controller.confirmMulligan();
    case 'pass':
      return controller.pass();
    case 'reveal':
      if (action.uids.length > 1) {
        controller.revealAll();
        return chooseAction(controller, action);
      }
      for (const location of ['scene', 'archive', 'dream']) {
        const slot = controller.getView().players[0].board[location]
          .findIndex((card) => card?.uid === action.uids[0]);
        if (slot >= 0) {
          controller.clickSlot(location, slot, 0);
          return chooseAction(controller, action);
        }
      }
      return false;
    case 'playCard':
      if (!controller.selectHandCard(action.uid)) return false;
      if (chooseAction(controller, action)) return true;
      if (action.hostUid || Number.isInteger(action.slot)) {
        controller.clickSlot(action.location, action.slot, 0);
      } else if (action.location) {
        controller.clickLocationCardSlot(action.location);
      } else {
        controller.confirmPlay();
      }
      chooseAction(controller, action);
      return true;
    default:
      return false;
  }
}

function pickHumanAction(view) {
  const predicates = [
    (action) => action.type === 'playCard' && !!action.choice,
    (action) => action.type === 'playCard' && action.faceDown === true,
    (action) => action.type === 'reveal' && action.uids.length === 1,
    (action) => action.type === 'playCard' && !!action.hostUid,
    (action) => action.type === 'playCard',
    (action) => action.type === 'reveal',
    (action) => action.type === 'pass',
  ];
  for (const predicate of predicates) {
    const found = view.actions.find(predicate);
    if (found) return found;
  }
  return view.actions.find((action) => action.type !== 'useLeader') ?? null;
}

function driveToLeader(seed, humanFaction) {
  const ctx = makeController(seed, humanFaction);
  let steps = 0;
  while (ctx.controller.getView().phase !== 'gameOver' && steps < 120) {
    const view = ctx.controller.getView();
    const leader = view.actions.filter((action) => action.type === 'useLeader');
    if (leader.length) return { ...ctx, leader, steps };
    const action = pickHumanAction(view);
    if (!action || !driveHumanAction(ctx.controller, action)) break;
    drain(ctx.queue);
    steps += 1;
  }
  ctx.controller.destroy();
  return null;
}

function candidatesBackedByRealActions(state, realActions) {
  return state.candidates.every((candidate) =>
    findMatchingActions(realActions, { type: 'useLeader', ...candidate.value }).length > 0);
}

test('真实教团局：四步候选全部来自合法动作，最终深匹配出唯一动作并提交', () => {
  const found = driveToLeader('elias-scan-0', 'cult');
  assert.ok(found, '固定种子应在人类回合提供伊莱亚斯领袖动作');
  const { controller, leader, toasts } = found;
  const realActions = controller.getView().actions.filter((action) => action.type === 'useLeader');
  let committed = null;
  const composer = createLeaderComposer({
    commit: (action) => { committed = action; return true; },
  });

  let state = composer.begin(realActions);
  assert.equal(state.ok, true);
  assert.equal(state.active, true);
  assert.equal(state.stepIndex, 0);
  assert.deepEqual(LEADER_STEPS, ['sacrifice', 'aberration', 'placement', 'replacement']);

  for (let index = 0; index < LEADER_STEPS.length; index += 1) {
    state = composer.snapshot();
    assert.equal(state.step, LEADER_STEPS[index]);
    assert.ok(state.candidates.length >= 1, `${state.step} 必须有候选`);
    assert.equal(candidatesBackedByRealActions(state, realActions), true);
    for (const candidate of state.candidates) {
      assert.ok(typeof candidate.label === 'string' && candidate.label.length > 0);
      assert.deepEqual(Object.keys(candidate.value).sort(),
        index === 0 ? ['sacrificeUid']
          : index === 1 ? ['cardUid']
            : index === 2 ? ['location', 'slot'] : ['replaceWithUid']);
    }
    const choice = index === LEADER_STEPS.length - 1
      ? state.candidates.find((candidate) => candidate.value.replaceWithUid === null)
      : state.candidates[0];
    assert.ok(choice, '最后一步必须提供跳过（replaceWithUid: null）候选');
    const result = composer.choose(choice.id);
    assert.equal(result.ok, true, result.error);
    state = result.state;
  }
  assert.equal(state.finished, true);
  assert.ok(committed, '必须提交一个真实动作');
  assert.ok(realActions.includes(committed), '提交对象必须是 view.actions 中的原始引用');
  assert.equal(committed.type, 'useLeader');
  assert.equal(committed.sacrificeUid, realActions[0].sacrificeUid);
  assert.deepEqual(toasts.filter((entry) => entry.tone === 'error'), []);
  controller.destroy();
});

test('真实教团局：skip() 等价于替换步骤的 null 候选，唯一匹配不被破坏', () => {
  const found = driveToLeader('elias-scan-0', 'cult');
  assert.ok(found);
  const { controller, leader } = found;
  const realActions = controller.getView().actions.filter((action) => action.type === 'useLeader');
  const composer = createLeaderComposer({ commit: () => true });
  composer.begin(realActions);
  for (let index = 0; index < LEADER_STEPS.length - 1; index += 1) {
    const state = composer.snapshot();
    assert.equal(composer.choose(state.candidates[0].id).ok, true);
  }
  assert.equal(composer.skip().ok, true);
  assert.equal(composer.snapshot().finished, true);
  assert.ok(leader.length > 0);
  controller.destroy();
});

test('控制器编排：clickLeader 打开四步弹层，取消回到选牌且不改盘面', () => {
  const found = driveToLeader('elias-scan-0', 'cult');
  assert.ok(found);
  const { controller, leader } = found;
  const before = controller.getView();

  assert.equal(controller.clickLeader(), true);
  let ui = controller.getUiState();
  assert.equal(ui.modal?.kind, 'leader-compose');
  assert.equal(ui.modal.composerState.step, 'sacrifice');
  assert.equal(ui.modal.composerState.totalSteps, 4);
  assert.equal(ui.selectedUid, null);

  // Every step can be cancelled back to the select-card state.
  for (let index = 0; index < 3; index += 1) {
    const state = controller.getUiState().modal.composerState;
    assert.ok(state.candidates.length >= 1);
    assert.equal(controller.chooseLeaderCandidate(0), true);
    ui = controller.getUiState();
    if (index < 2) assert.equal(ui.modal?.kind, 'leader-compose');
  }
  assert.equal(controller.cancelLeaderComposer(), true);
  ui = controller.getUiState();
  assert.equal(ui.modal, null);
  assert.equal(ui.leaderComposer.active, false);
  assert.strictEqual(controller.getView(), before, '取消不得提交任何动作');
  assert.equal(controller.getUiState().mode, 'play');

  // Re-open and commit through the controller's imperative candidates.
  assert.equal(controller.clickLeader(), true);
  for (let index = 0; index < 3; index += 1) {
    assert.equal(controller.chooseLeaderCandidate(0), true);
  }
  assert.equal(controller.skipLeaderReplacement(), true);
  assert.equal(controller.getUiState().modal, null);
  assert.notStrictEqual(controller.getView(), before);
  assert.ok(controller.getUiState().eventLog.some((line) => line.includes('领袖技')));
  assert.ok(leader.length >= 1);
  controller.destroy();
});

test('Harold 侧维持原单步流程：不开启编排弹层', () => {
  const found = driveToLeader('play-soak-0', 'society');
  assert.ok(found, '固定种子应提供哈罗德领袖动作');
  const { controller, leader } = found;
  assert.ok(leader.every((action) => typeof action.targetUid === 'string'));
  assert.equal(controller.clickLeader(), true);
  const ui = controller.getUiState();
  assert.notEqual(ui.modal?.kind, 'leader-compose');
  assert.equal(ui.leaderComposer.active, false);
  assert.ok(ui.modal?.kind === 'leader' || ui.mode === 'leader-target');
  controller.destroy();
});

test('纯状态机：坏数据不抛异常，非法选择返回失败并保留状态', () => {
  const composer = createLeaderComposer({ commit: () => true });
  assert.equal(composer.begin(null).ok, false);
  assert.equal(composer.begin('not-an-array').ok, false);
  assert.equal(composer.begin([null, 3, 'x', {}, { type: 'useLeader' }]).ok, false);
  assert.equal(composer.choose('junk').ok, false);
  assert.equal(composer.choose(null).ok, false);
  assert.equal(composer.chooseValue({ nonsense: true }).ok, false);
  assert.equal(composer.skip().ok, false);
  assert.equal(composer.snapshot().active, false);
  assert.deepEqual(composer.snapshot().candidates, []);

  const weird = [{
    type: 'useLeader', sacrificeUid: 7, cardUid: {}, location: null, slot: 'x', replaceWithUid: [],
  }];
  assert.equal(composer.begin(weird).ok, false);
  assert.equal(composer.begin([{
    type: 'useLeader', sacrificeUid: 'p0-1', cardUid: 'p0-2', location: 'scene', slot: 0, replaceWithUid: null,
  }]).ok, true);
  assert.equal(composer.choose({}).ok, false);
  assert.equal(composer.cancel().ok, true);
  assert.equal(composer.snapshot().error, '');
});
