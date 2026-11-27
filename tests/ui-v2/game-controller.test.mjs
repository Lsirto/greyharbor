/**
 * tests/ui-v2/game-controller.test.mjs — headless human-vs-AI soak.
 *
 * Drives the *same imperative methods* the DOM handlers call, with a queued
 * timer and a recording renderer.  Ten full games must finish without a
 * deadlock, a rejected action, or a conservation violation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { countCards } from '../../src/engine/v2/index.js';
import { createGameController } from '../../src/ui-v2/game-controller.mjs';
import { renderResultPanel } from '../../src/ui-v2/menu/templates/result-panel.mjs';

function makeQueueController(seed, decks = null) {
  const queue = [];
  const renders = [];
  const toasts = [];
  const controller = createGameController({
    seed,
    aiDelay: 0,
    ...(decks ? { decks } : {}),
    renderer: {
      render(view, options) {
        renders.push({
          phase: view.phase,
          night: view.night,
          current: view.current,
          actions: view.actions.length,
          mode: options.controller?.mode,
          aiThinking: options.controller?.aiThinking,
        });
      },
    },
    schedule(fn) {
      queue.push(fn);
      return queue.length;
    },
    cancel() { /* generation guard invalidates queued callbacks on restart */ },
    toast(text, tone) {
      toasts.push({ text, tone });
    },
  });
  return { controller, queue, renders, toasts };
}

function drain(queue, limit = 800) {
  let ticks = 0;
  while (queue.length) {
    if (ticks >= limit) throw new Error('AI queue did not settle (possible deadlock)');
    queue.shift()();
    ticks += 1;
  }
  return ticks;
}

function chooseModalForAction(controller, action) {
  const ui = controller.getUiState();
  if (!ui.modal) return false;
  const index = controller.getView().actions.indexOf(action);
  const optionIndex = ui.modal.options.findIndex((option) => option.actionIndex === index);
  assert.ok(optionIndex >= 0, '弹层必须包含目标动作对应的合法选项');
  assert.equal(controller.chooseModalOption(optionIndex), true);
  return true;
}

function driveHumanAction(controller, action) {
  switch (action.type) {
    case 'mulligan':
      assert.equal(controller.confirmMulligan(), true);
      break;
    case 'pass':
      assert.equal(controller.pass(), true);
      break;
    case 'reveal':
      if (action.uids.length > 1) {
        assert.equal(controller.revealAll(), true);
      } else {
        const view = controller.getView();
        let position = null;
        for (const location of ['front']) {
          const slot = view.players[0].board[location].findIndex((card) => card?.uid === action.uids[0]);
          if (slot >= 0) {
            position = { location, slot };
            break;
          }
        }
        assert.ok(position, '翻开目标必须位于己方棋盘');
        assert.equal(controller.clickSlot(position.location, position.slot, 0), true);
      }
      chooseModalForAction(controller, action);
      break;
    case 'useLeader':
      assert.equal(controller.clickLeader(), true);
      if (action.targetUid) {
        assert.equal(controller.clickTarget(action.targetUid), true);
      } else {
        chooseModalForAction(controller, action);
      }
      break;
    case 'playCard': {
      assert.equal(controller.selectHandCard(action.uid), true);
      if (chooseModalForAction(controller, action)) break;
      if (action.hostUid || Number.isInteger(action.slot)) {
        assert.equal(controller.clickSlot(action.location, action.slot, 0), true);
      } else if (action.location) {
        assert.equal(controller.clickLocationCardSlot(action.location), true);
      } else {
        assert.equal(controller.confirmPlay(), true);
      }
      chooseModalForAction(controller, action);
      break;
    }
    default:
      throw new Error(`unsupported action type: ${action.type}`);
  }
}

/** Prefer richer interactions so a 10-game soak also exercises the UI paths. */
function pickHumanAction(view, gameIndex) {
  const actions = view.actions;
  const priority = [
    (action) => action.type === 'useLeader',
    (action) => action.type === 'reveal' && action.uids?.length === 1,
    (action) => action.type === 'playCard' && !!action.choice,
    (action) => action.type === 'playCard' && action.faceDown === true,
    (action) => action.type === 'playCard' && !!action.hostUid,
    (action) => action.type === 'playCard' && !!action.location && action.slot === null,
    (action) => action.type === 'playCard',
    (action) => action.type === 'reveal',
    (action) => action.type === 'pass',
  ];
  for (const predicate of priority) {
    const found = actions.find(predicate);
    if (found) return found;
  }
  if (gameIndex < 0) throw new Error('no legal human action');
  return actions[0];
}

test('10 局脚本化完整人机对战：无卡死、无拒绝、守恒 ok', () => {
  const stats = {
    games: 0,
    humanActions: 0,
    aiSteps: 0,
    phases: new Set(),
    nights: new Set(),
    types: new Set(),
    modalKinds: new Set(),
    reasons: new Set(),
  };

  for (let gameIndex = 0; gameIndex < 10; gameIndex += 1) {
    const { controller, queue, renders, toasts } = makeQueueController(`play-soak-${gameIndex}`);
    let steps = 0;
    while (controller.getView().phase !== 'gameOver') {
      if (steps >= 300) throw new Error(`game ${gameIndex}: human step limit exceeded`);
      const view = controller.getView();
      assert.ok(view.actions.length > 0, `game ${gameIndex}: no legal human action`);
      stats.phases.add(view.phase);
      stats.nights.add(view.night);

      let action;
      if (view.phase === 'mulligan') {
        const hand = view.players[0].hand;
        action = gameIndex % 3 === 0
          ? view.actions.find((entry) => entry.type === 'mulligan' && entry.uids.length === 0)
          : view.actions.find((entry) => entry.type === 'mulligan' && entry.uids.length === 1 && entry.uids[0] === hand[0].uid)
            ?? view.actions.find((entry) => entry.type === 'mulligan' && entry.uids.length === 0);
        if (action.uids.length) {
          assert.equal(controller.toggleMark(action.uids[0]), true);
        }
      } else if (steps % 7 === 6 && view.actions.some((entry) => entry.type === 'pass')) {
        action = view.actions.find((entry) => entry.type === 'pass');
      } else {
        action = pickHumanAction(view, gameIndex);
      }
      stats.types.add(action.type);
      driveHumanAction(controller, action);
      drain(queue);
      steps += 1;
      stats.humanActions += 1;
      for (const ui of controller.getUiState().eventLog) {
        if (ui.includes('夜结算')) stats.nights.add(view.night + 1);
      }
      if (controller.getUiState().modal?.kind === 'night-summary') {
        // The info-only night modal must be dismissed before play can continue.
        assert.equal(controller.cancel(), true);
        stats.modalKinds.add('night-summary');
      } else if (controller.getUiState().modal) {
        stats.modalKinds.add(controller.getUiState().modal.kind);
      }
      for (const player of [0, 1]) {
        assert.equal(
          countCards(controller.getEngine().state, player),
          19,
          `game ${gameIndex}: card conservation broken for P${player}`,
        );
      }
    }

    const finalView = controller.getView();
    assert.ok(finalView.result, `game ${gameIndex}: ended without result`);
    stats.reasons.add(finalView.result.reason);
    stats.aiSteps += controller.getUiState().aiSteps;
    assert.equal(controller.getUiState().mode, 'over');
    assert.equal(controller.getUiState().modal?.kind, 'result');
    assert.ok(renders.some((entry) => entry.aiThinking === true), `game ${gameIndex}: AI thinking state was rendered`);
    assert.ok(renders.some((entry) => entry.phase === 'mulligan'));
    assert.ok(renders.some((entry) => entry.phase === 'play'));
    const errors = toasts.filter((entry) => entry.tone === 'error');
    assert.deepEqual(errors, [], `game ${gameIndex}: unexpected error toast: ${errors.map((e) => e.text).join(' | ')}`);
    stats.games += 1;
    controller.destroy();
  }

  assert.equal(stats.games, 10);
  assert.ok(stats.aiSteps >= 10, 'AI must actually act in every game');
  assert.ok(stats.types.has('mulligan') && stats.types.has('playCard') && stats.types.has('pass'));
  assert.ok([...stats.nights].some((night) => night >= 2), '至少一局应推进到第 2 夜');
  console.log('SOAK', JSON.stringify({
    games: stats.games,
    humanActions: stats.humanActions,
    aiSteps: stats.aiSteps,
    phases: [...stats.phases],
    nights: [...stats.nights].sort(),
    humanActionTypes: [...stats.types],
    modalKinds: [...stats.modalKinds],
    reasons: [...stats.reasons],
  }));
});

test('onGameOver 回传的夜分可被终局面板渲染（不再显示 0:0）', () => {
  let captured = null;
  const queue = [];
  const controller = createGameController({
    seed: 'result-panel-history-shape',
    aiDelay: 0,
    renderer: { render() {} },
    schedule(fn) { queue.push(fn); return queue.length; },
    cancel() {},
    toast() {},
    onGameOver(info) { captured = info; },
  });

  let steps = 0;
  while (controller.getView().phase !== 'gameOver') {
    if (steps >= 300) throw new Error('step limit exceeded');
    const view = controller.getView();
    const action = view.phase === 'mulligan'
      ? view.actions.find((entry) => entry.type === 'mulligan' && entry.uids.length === 0)
      : view.actions.find((entry) => entry.type === 'pass') ?? pickHumanAction(view, 0);
    driveHumanAction(controller, action);
    drain(queue);
    if (controller.getUiState().modal?.kind === 'night-summary') controller.cancel();
    steps += 1;
  }

  assert.ok(captured, '必须触发 onGameOver 回调');
  assert.ok(captured.nightHistory.length >= 1);
  for (const entry of captured.nightHistory) {
    for (const score of entry.scores) {
      assert.equal(typeof score, 'object', '夜分必须保持对象形状');
      assert.equal(typeof score.total, 'number');
    }
  }
  // The panel must render the real totals rather than 0 : 0.
  const panelHtml = renderResultPanel(captured);
  assert.ok(!/0 : 0/.test(panelHtml), '终局面板不应渲染 0:0');
  const first = captured.nightHistory[0];
  assert.match(panelHtml, new RegExp(`${first.scores[0].total} : ${first.scores[1].total}`));
  controller.destroy();
});

test('choice 弹层取消可回到选牌态，重新选择才提交动作', () => {
  const decks = [
    { leader: 'harold-ashby', cards: ['unexpected-aid', 'finn-calloway', 'walter-morse'] },
    { leader: 'elias-thorne', cards: ['finn-calloway', 'finn-calloway'] },
  ];
  const { controller, queue } = makeQueueController('choice-modal-test', decks);
  controller.confirmMulligan();
  drain(queue);

  // Place two own units so the aid event has two distinct targets.
  const engine = controller.getEngine();
  const player = engine.state.players[0];
  const placeDirect = (cardId, slot) => {
    const idx = player.hand.findIndex((entry) => entry.cardId === cardId);
    const inst = player.hand.splice(idx, 1)[0];
    inst.face = 'reason';
    inst.faceDown = false;
    inst.location = 'front';
    inst.slot = slot;
    inst.zone = 'board';
    inst.corruptionTokens = [];
    inst.corruptionLoss = 0;
    player.board.front[slot] = inst;
  };
  placeDirect('finn-calloway', 0);
  placeDirect('walter-morse', 1);
  controller.refresh();

  const view = controller.getView();
  const aid = player.hand.find((entry) => entry.cardId === 'unexpected-aid');
  assert.equal(controller.selectHandCard(aid.uid), true);
  assert.equal(controller.confirmPlay(), true);
  assert.equal(controller.getUiState().modal?.kind, 'choice');
  assert.equal(controller.getUiState().modal?.options.length, 2);
  assert.equal(controller.getUiState().selectedUid, aid.uid);

  assert.equal(controller.cancel(), true);
  assert.equal(controller.getUiState().modal, null);
  assert.equal(controller.getUiState().selectedUid, aid.uid, '取消后保留选牌态');

  assert.equal(controller.confirmPlay(), true);
  const optionIndex = 0;
  assert.equal(controller.chooseModalOption(optionIndex), true);
  drain(queue);
  assert.notStrictEqual(controller.getView(), view, '成功提交后应刷新整盘视角');
  controller.destroy();
});

test('隐秘单位明暗放弹层可取消、可分别选择明放/暗放', () => {
  const { controller, queue } = makeQueueController('facedown-modal-test');
  controller.confirmMulligan();
  drain(queue);
  let found = false;
  for (let step = 0; step < 40 && !found; step += 1) {
    const view = controller.getView();
    if (view.phase === 'gameOver' || view.current !== 0) break;
    const faceDown = view.actions.find((entry) =>
      entry.type === 'playCard' && entry.faceDown === true && entry.location !== 'dream',
    );
    if (!faceDown) {
      driveHumanAction(controller, pickHumanAction(view, step));
      drain(queue);
      continue;
    }
    assert.equal(controller.selectHandCard(faceDown.uid), true);
    assert.equal(controller.clickSlot(faceDown.location, faceDown.slot, 0), true);
    const ui = controller.getUiState();
    assert.equal(ui.modal?.kind, 'facedown');
    assert.equal(ui.modal.options.length, 2);
    assert.equal(ui.modal.options.filter((option) => option.faceDown).length, 1);
    assert.equal(ui.modal.options.filter((option) => !option.faceDown).length, 1);
    assert.equal(controller.cancel(), true);
    assert.equal(controller.getUiState().modal, null);
    assert.equal(controller.getUiState().selectedUid, faceDown.uid);
    assert.equal(controller.clickSlot(faceDown.location, faceDown.slot, 0), true);
    const optionIndex = controller.getUiState().modal.options.findIndex((option) =>
      option.actionIndex === view.actions.indexOf(faceDown) && option.faceDown,
    );
    assert.ok(optionIndex >= 0, '暗放选项必须来自真实合法动作');
    assert.equal(controller.chooseModalOption(optionIndex), true);
    drain(queue);
    found = true;
  }
  assert.ok(found, '应在真实对局中遇到隐秘单位的明/暗放选择');
  controller.destroy();
});

test('重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局', () => {
  const { controller, queue } = makeQueueController('restart-cancels-ai');
  assert.equal(controller.confirmMulligan(), true);
  assert.ok(queue.length > 0, '人类换牌后必须排入 AI 定时器');
  const generation = controller.getUiState().generation;
  controller.restart();
  assert.equal(controller.getUiState().generation, generation + 1);
  assert.equal(controller.getState().phase, 'mulligan');
  assert.equal(controller.getUiState().mode, 'mulligan');
  const freshView = controller.getView();
  drain(queue);
  assert.strictEqual(controller.getView(), freshView, '过期 AI 回调不得重绘/推进新对局');
  assert.equal(controller.getUiState().aiSteps, 0);
  controller.destroy();
});

test('非法输入不崩溃：错误落点、错误目标、无可选动作', () => {
  const { controller, toasts } = makeQueueController('illegal-input');
  const view = controller.getView();
  assert.equal(controller.clickSlot('scene', 0, 0), false);
  assert.equal(controller.confirmPlay(), false);
  assert.equal(controller.pass(), false);
  assert.equal(controller.clickLeader(), false);
  assert.equal(controller.selectHandCard('p0-ghost'), false);
  assert.ok(toasts.length >= 4, '每次非法输入都必须给出提示');
  assert.equal(controller.getView().phase, view.phase);
  controller.destroy();
});
