/**
 * AI 评估保真度专项：
 *  - 静态牌张/效果数值对齐 v1.2 定稿（防止旧 v1.1 基数残留回潮）；
 *  - 对手领袖可用是公开威胁信号：可用时己方动作评分应低于其已用/被封印时。
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { buildView, createGame } from '../../src/engine/v2/index.js';
import { OBJECTIVE_THRESHOLDS } from '../../src/engine/v2/objectives.js';
import { CONFIG } from '../../src/ai/v2/config.mjs';
import { scoreAction } from '../../src/ai/v2/evaluate.mjs';

/** 对齐 src/data/card-table.normalized.json 的 v1.2 定稿 [理性面, 疯狂面]。 */
const ELlIAS_SUMMON_FINAL = {
  'hooded-acolyte': [2, 2],
  zealot: [2, 7],
  'sea-priestess': [3, 4],
  gravedigger: [2, 3],
  whisperer: [2, 7],
  'deep-one': [4, 9],
  'bell-claw': [5, 5],
  'the-sleeper': [7, 10],
  'thousand-eyes': [7, 10],
};

test('回响数值对齐 v1.2 定稿：全场 +1，祭坛不再额外加成', () => {
  assert.equal(CONFIG.effects.cultEcho, 1);
  assert.equal(CONFIG.effects.cultEchoWithAltar, undefined);
});

test('Elias 召唤表对齐定稿战力（含疯狂面固定 +3）', () => {
  for (const [id, pair] of Object.entries(ELlIAS_SUMMON_FINAL)) {
    assert.deepEqual(CONFIG.power.eliasSummon[id], pair, `elias summon ${id}`);
  }
});

test('装备加成表覆盖银灯/铜徽/骨护符', () => {
  assert.equal(CONFIG.power.equipment['silver-lantern'], 2);
  assert.equal(CONFIG.power.equipment['brass-badge'], 3);
  assert.equal(CONFIG.power.equipment['bone-ward'], 1);
});

test('反噬名单与定稿关键词一致', () => {
  assert.deepEqual(
    [...CONFIG.power.backlash].sort(),
    ['deep-one', 'the-sleeper', 'walter-morse', 'zealot'].sort(),
  );
});

function playView(seed) {
  const engine = createGame({ seed });
  for (const p of [0, 1]) engine.apply(engine.getActions(p)[0]);
  const pov = engine.current ?? 0;
  return buildView(engine, pov);
}

test('对手领袖可用时，己方出牌评分低于其已用过后的处境', () => {
  const view = playView('evaluate-leader-threat');
  const opp = 1 - view.current;
  const playActions = view.actions.filter((action) => action.type === 'playCard');
  assert.ok(playActions.length > 0, 'need at least one play action');

  const spent = structuredClone(view);
  spent.players[opp].leader.usedThisNight = true;
  spent.players[opp].leader.sealed = false;

  for (const action of playActions) {
    const threatScore = scoreAction(view, action);
    const safeScore = scoreAction(spent, action);
    assert.ok(
      safeScore >= threatScore - 1e-9,
      `leader ${opp} available should be a threat: ${safeScore} < ${threatScore}`,
    );
  }
});

test('双方视角各自暴露本阵营目标阈值，互不串用', () => {
  const view = playView('evaluate-threshold');
  const me = view.current;
  const opp = 1 - me;
  assert.equal(view.players[me].objectiveThreshold, OBJECTIVE_THRESHOLDS[view.players[me].faction]);
  assert.equal(view.players[opp].objectiveThreshold, OBJECTIVE_THRESHOLDS[view.players[opp].faction]);
});
