/**
 * tests/ui-v2/match-config.test.mjs — faction / seed configuration contract.
 *
 * All matches are driven headlessly with a queued timer and a fake renderer;
 * no DOM and no Math.random are involved.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { countCards } from '../../src/engine/v2/index.js';
import {
  DEFAULT_MATCH_CONFIG,
  DEFAULT_PLAY_SEED,
  createGameController,
  normalizeMatchConfig,
} from '../../src/ui-v2/game-controller.mjs';

function makeController(options = {}) {
  const queue = [];
  const toasts = [];
  const controller = createGameController({
    aiDelay: 0,
    renderer: { render() {} },
    schedule(fn) { queue.push(fn); return queue.length; },
    cancel() {},
    toast(text, tone) { toasts.push({ text, tone }); },
    ...options,
  });
  return { controller, queue, toasts };
}

function drain(queue) {
  while (queue.length) queue.shift()();
}

test('normalizeMatchConfig：缺省值 / 非法值回退 / 旧 seed 选项兼容', () => {
  assert.deepEqual(normalizeMatchConfig(), {
    humanFaction: 'society',
    seedMode: 'fixed',
    baseSeed: DEFAULT_PLAY_SEED,
    humanLeader: 'harold-ashby',
  });
  assert.deepEqual(DEFAULT_MATCH_CONFIG, normalizeMatchConfig());
  assert.deepEqual(normalizeMatchConfig({ humanFaction: 'CULT', seedMode: 'RANDOM' }), {
    humanFaction: 'society',
    seedMode: 'fixed',
    baseSeed: DEFAULT_PLAY_SEED,
    humanLeader: 'harold-ashby',
  });
  assert.deepEqual(normalizeMatchConfig({ humanFaction: 'cult', seedMode: 'random', baseSeed: '' }), {
    humanFaction: 'cult',
    seedMode: 'random',
    baseSeed: DEFAULT_PLAY_SEED,
    humanLeader: 'elias-thorne',
  });
  assert.equal(normalizeMatchConfig({}, 'legacy-seed').baseSeed, 'legacy-seed');
  assert.equal(normalizeMatchConfig({ baseSeed: 'config-seed' }, 'legacy-seed').baseSeed, 'config-seed');
});

test('人类选学会：decks 顺序 society/cult，名称与领袖席位正确', () => {
  const { controller } = makeController({ matchConfig: { humanFaction: 'society' } });
  const state = controller.getEngine().state;
  assert.deepEqual(state.players.map((player) => player.faction), ['society', 'cult']);
  assert.deepEqual(state.players.map((player) => player.leaderId), ['harold-ashby', 'elias-thorne']);
  assert.deepEqual(state.players.map((player) => player.name), ['你 · 学会', 'AI · 教团']);
  assert.deepEqual(controller.getMatchConfig(), {
    humanFaction: 'society', seedMode: 'fixed', baseSeed: DEFAULT_PLAY_SEED,
    humanLeader: 'harold-ashby',
  });
  controller.destroy();
});

test('人类选教团：decks 顺序 cult/society，名称与领袖席位正确', () => {
  const { controller } = makeController({ matchConfig: { humanFaction: 'cult' } });
  const state = controller.getEngine().state;
  assert.deepEqual(state.players.map((player) => player.faction), ['cult', 'society']);
  assert.deepEqual(state.players.map((player) => player.leaderId), ['elias-thorne', 'harold-ashby']);
  assert.deepEqual(state.players.map((player) => player.name), ['你 · 教团', 'AI · 学会']);
  assert.deepEqual(controller.getState().humanFaction, 'cult');
  controller.destroy();
});

test('humanLeader：覆盖人类座领袖，AI 座保留预设领袖', () => {
  const society = makeController({
    matchConfig: { humanFaction: 'society', humanLeader: 'enid-halloway' },
  });
  const s = society.controller.getEngine().state;
  assert.deepEqual(s.players.map((player) => player.leaderId), ['enid-halloway', 'elias-thorne']);
  assert.equal(society.controller.getMatchConfig().humanLeader, 'enid-halloway');
  society.controller.destroy();

  const cult = makeController({
    matchConfig: { humanFaction: 'cult', humanLeader: 'gregor-pestilence' },
  });
  const c = cult.controller.getEngine().state;
  assert.deepEqual(c.players.map((player) => player.leaderId), ['gregor-pestilence', 'harold-ashby']);
  cult.controller.destroy();
});

test('humanLeader：非法领袖（异阵营 / 非领袖卡 / 垃圾值）回退阵营预设', () => {
  const cases = [
    'vera-crowe',      // cult leader on a society match
    'finn-calloway',   // a unit, not a leader
    'no-such-leader',  // unknown id
    '',
  ];
  for (const humanLeader of cases) {
    const ctx = makeController({ matchConfig: { humanFaction: 'society', humanLeader } });
    const state = ctx.controller.getEngine().state;
    assert.equal(state.players[0].leaderId, 'harold-ashby', `case ${humanLeader}`);
    assert.equal(ctx.controller.getMatchConfig().humanLeader, 'harold-ashby');
    ctx.controller.destroy();
  }
  // Non-string requested value also falls back.
  const normalized = normalizeMatchConfig({ humanFaction: 'cult', humanLeader: 42 });
  assert.equal(normalized.humanLeader, 'elias-thorne');
});

test('固定种子：baseSeed 可复现，restart 沿用同种子与同阵营', () => {
  const first = makeController({ matchConfig: { humanFaction: 'cult', baseSeed: 'match-fixed-a' } });
  const second = makeController({ matchConfig: { humanFaction: 'cult', baseSeed: 'match-fixed-a' } });
  const deckOf = (controller) => controller.getEngine().state.players[0].deck.map((inst) => inst.cardId);
  assert.deepEqual(deckOf(first.controller), deckOf(second.controller));
  assert.equal(first.controller.getState().seed, 'match-fixed-a');

  const before = deckOf(first.controller);
  first.controller.restart();
  assert.equal(first.controller.getState().seed, 'match-fixed-a');
  assert.deepEqual(deckOf(first.controller), before);
  assert.equal(first.controller.getMatchConfig().humanFaction, 'cult');
  assert.equal(first.controller.getState().generation, 1);
  assert.deepEqual(first.toasts.at(-1).text, '已用相同固定种子重新开局');
  drain(first.queue);
  first.controller.destroy();
  second.controller.destroy();
});

test('随机种子：只用注入生成器，restart 换新种子且可复现序列', () => {
  const seeds = ['random-a', 'random-b', 'random-c'];
  let calls = 0;
  const generator = () => {
    if (calls >= seeds.length) throw new Error('unexpected extra seed request');
    return seeds[calls++];
  };
  const { controller, toasts } = makeController({
    matchConfig: { humanFaction: 'society', seedMode: 'random', baseSeed: 'unused-base' },
    seedGenerator: generator,
  });
  assert.equal(calls, 1);
  assert.equal(controller.getState().seed, 'random-a');
  assert.equal(controller.getEngine().state.seed, 'random-a');
  assert.equal(controller.getState().seedMode, 'random');

  controller.restart();
  assert.equal(calls, 2);
  assert.equal(controller.getState().seed, 'random-b');
  assert.equal(controller.getEngine().state.seed, 'random-b');
  assert.equal(controller.getMatchConfig().baseSeed, 'unused-base');
  assert.deepEqual(toasts.at(-1).text, '已用新随机种子重新开局');

  controller.restart();
  assert.equal(calls, 3);
  assert.equal(controller.getState().seed, 'random-c');
  controller.destroy();
});

test('随机模式接受非字符串生成器返回值（转字符串），固定模式不调用生成器', () => {
  let calls = 0;
  const { controller } = makeController({
    matchConfig: { seedMode: 'random' },
    seedGenerator: () => { calls += 1; return 42; },
  });
  assert.equal(controller.getState().seed, '42');
  assert.equal(calls, 1);
  controller.destroy();

  let unused = 0;
  const fixed = makeController({
    matchConfig: { seedMode: 'fixed' },
    seedGenerator: () => { unused += 1; return 'x'; },
  });
  assert.equal(unused, 0);
  fixed.controller.destroy();
});

test('Node 下随机模式缺少注入生成器时明确报错，不回退 Math.random', () => {
  assert.throws(
    () => makeController({ matchConfig: { seedMode: 'random' } }),
    /seedGenerator/,
  );
});

test('restart / destroy 取消全部定时器与键盘监听，旧回调不污染新局', () => {
  const { controller, queue } = makeController({ matchConfig: { humanFaction: 'cult' } });
  controller.confirmMulligan();
  assert.ok(queue.length > 0);
  const generation = controller.getUiState().generation;
  controller.restart();
  assert.equal(controller.getUiState().generation, generation + 1);
  const fresh = controller.getView();
  drain(queue);
  assert.strictEqual(controller.getView(), fresh);
  controller.destroy();
  assert.equal(controller.getUiState().generation, generation + 2);
});

// ── 20-game scripted soak: five matches per faction ──────────────────

function chooseModalFor(controller, action) {
  const ui = controller.getUiState();
  if (!ui.modal || ui.modal.kind === 'result') return false;
  const index = ui.modal.options.findIndex((option) =>
    option.actionIndex === controller.getView().actions.indexOf(action));
  if (index < 0) return false;
  return controller.chooseModalOption(index);
}

/** A click either commits directly or opens a modal that must be resolved. */
function afterClick(controller, action) {
  const modal = controller.getUiState().modal;
  if (!modal || modal.kind === 'result') return true;
  return chooseModalFor(controller, action);
}

function driveSoakAction(controller, action) {
  switch (action.type) {
    case 'mulligan': return controller.confirmMulligan();
    case 'pass': return controller.pass();
    case 'reveal':
      if (action.uids.length > 1) {
        if (!controller.revealAll()) return false;
        return afterClick(controller, action);
      }
      for (const location of ['front']) {
        const slot = controller.getView().players[0].board[location]
          .findIndex((card) => card?.uid === action.uids[0]);
        if (slot >= 0) {
          if (!controller.clickSlot(location, slot, 0)) return false;
          return afterClick(controller, action);
        }
      }
      return false;
    case 'useLeader':
      if (!controller.clickLeader()) return false;
      if (typeof action.sacrificeUid === 'string') {
        for (let step = 0; step < 3; step += 1) {
          if (!controller.chooseLeaderCandidate(0)) return false;
        }
        return controller.skipLeaderReplacement();
      }
      if (typeof action.targetUid === 'string' && controller.getUiState().mode === 'leader-target') {
        return controller.clickTarget(action.targetUid);
      }
      return chooseModalFor(controller, action);
    case 'playCard':
      if (!controller.selectHandCard(action.uid)) return false;
      const initialModal = controller.getUiState().modal;
      if (initialModal && initialModal.kind !== 'result') return chooseModalFor(controller, action);
      if (action.hostUid || Number.isInteger(action.slot)) {
        if (!controller.clickSlot(action.location, action.slot, 0)) return false;
      } else if (action.location) {
        if (!controller.clickLocationCardSlot(action.location)) return false;
      } else if (!controller.confirmPlay()) {
        return false;
      }
      return afterClick(controller, action);
    default:
      return false;
  }
}

function onOwnBoard(view, uid) {
  for (const location of ['front']) {
    if (view.players[0].board[location].some((card) => card?.uid === uid)) return true;
  }
  return false;
}

function pickSoakAction(view, index) {
  const predicates = [
    (action) => action.type === 'useLeader',
    (action) => action.type === 'reveal' && action.uids.length > 1,
    (action) => action.type === 'reveal' && action.uids.length === 1 && onOwnBoard(view, action.uids[0]),
    (action) => action.type === 'playCard' && !!action.choice,
    (action) => action.type === 'playCard' && action.faceDown === true,
    (action) => action.type === 'playCard',
    (action) => action.type === 'pass',
  ];
  for (const predicate of predicates) {
    const found = view.actions.find(predicate);
    if (found) return found;
  }
  return index < 0 ? null : view.actions.find((action) => action.type === 'mulligan') ?? view.actions[0];
}

test('20 局脚本化对战：学会 / 教团各 5 局，无卡死崩溃且守恒 ok', () => {
  const stats = { games: 0, factions: {}, modes: {}, seeds: new Set(), reasons: new Set(), actions: 0 };
  for (let game = 0; game < 20; game += 1) {
    const faction = game < 10 ? 'society' : 'cult';
    const random = game % 10 >= 5;
    const seed = `soak-20-${game}`;
    let calls = 0;
    const ctx = makeController({
      seed,
      matchConfig: {
        humanFaction: faction,
        seedMode: random ? 'random' : 'fixed',
        baseSeed: seed,
      },
      seedGenerator: random ? () => { calls += 1; return `soak-random-${game}-${calls}`; } : undefined,
    });
    let steps = 0;
    while (ctx.controller.getView().phase !== 'gameOver') {
      if (steps >= 320) throw new Error(`game ${game}: step limit exceeded (possible deadlock)`);
      const view = ctx.controller.getView();
      assert.ok(view.actions.length > 0, `game ${game}: no legal action`);
      const action = pickSoakAction(view, game);
      assert.ok(action, `game ${game}: no driveable action`);
      assert.equal(driveSoakAction(ctx.controller, action), true, `game ${game}: action rejected: ${action.type}`);
      ctx.toasts.length = 0;
      drain(ctx.queue);
      steps += 1;
      stats.actions += 1;
      for (const player of [0, 1]) {
        assert.equal(countCards(ctx.controller.getEngine().state, player), 19,
          `game ${game}: conservation broken for P${player}`);
      }
    }
    const finalView = ctx.controller.getView();
    assert.ok(finalView.result, `game ${game}: ended without result`);
    assert.equal(ctx.controller.getUiState().mode, 'over');
    assert.equal(ctx.controller.getUiState().modal?.kind, 'result');
    assert.equal(ctx.toasts.filter((entry) => entry.tone === 'error').length, 0,
      `game ${game}: unexpected error toast`);
    assert.equal(calls, random ? 1 : 0, `game ${game}: seed generator call count`);
    stats.games += 1;
    stats.factions[faction] = (stats.factions[faction] ?? 0) + 1;
    const mode = random ? 'random' : 'fixed';
    stats.modes[mode] = (stats.modes[mode] ?? 0) + 1;
    stats.seeds.add(ctx.controller.getState().seed);
    stats.reasons.add(finalView.result.reason);
    ctx.controller.destroy();
  }
  assert.equal(stats.games, 20);
  assert.deepEqual(stats.factions, { society: 10, cult: 10 });
  assert.deepEqual(stats.modes, { fixed: 10, random: 10 });
  assert.equal(stats.seeds.size, 20);
  console.log('FACTION-SOAK', JSON.stringify({
    games: stats.games,
    factions: stats.factions,
    modes: stats.modes,
    actions: stats.actions,
    distinctSeeds: stats.seeds.size,
    reasons: [...stats.reasons],
  }));
});
