/**
 * tests/ui-v2/render-templates.test.mjs — Node native tests for the pure v2 UI
 * templates.  No DOM, no external dependencies.
 *
 *   node --test tests/ui-v2/*.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { renderCard, renderCardBack } from '../../src/ui-v2/templates/card.mjs';
import { renderSanityMeter } from '../../src/ui-v2/templates/sanity.mjs';
import { renderObjectiveTrack } from '../../src/ui-v2/templates/objective.mjs';
import { renderLocationColumn, renderLocationGrid } from '../../src/ui-v2/templates/location-column.mjs';
import { renderHandZone } from '../../src/ui-v2/templates/hand.mjs';
import { renderEnvironmentRow } from '../../src/ui-v2/templates/environment.mjs';
import { renderLeaderZone } from '../../src/ui-v2/templates/leader.mjs';
import { renderPlayerBar } from '../../src/ui-v2/templates/player-bar.mjs';
import { renderBoardMarkup } from '../../src/ui-v2/templates/board.mjs';
import { createGame, buildView } from '../../src/engine/v2/index.js';
import { chooseDemoAction, createDemoController, publicActionLabel } from '../../src/ui-v2/demo-controller.mjs';

function unit(overrides = {}) {
  return {
    uid: 'p0-1',
    cardId: 'nora-wells',
    name: 'Nora Wells',
    nameZh: '诺拉·威尔斯',
    faction: 'society',
    type: 'unit',
    cardLocation: 'front',
    face: 'reason',
    faceDown: false,
    reasonPower: 2,
    madnessPower: 4,
    sanityCost: 0,
    keywords: ['stealth'],
    power: 2,
    boardLocation: 'front',
    slot: 0,
    sealed: false,
    corruption: 0,
    corruptionLoss: 0,
    permanentPower: 0,
    thisNightPower: 0,
    equipment: null,
    ...overrides,
  };
}

function player(overrides = {}) {
  return {
    id: 0,
    name: '玩家',
    faction: 'society',
    leader: { cardId: 'harold-ashby', name: 'Harold Ashby', nameZh: '哈罗德·阿什比', faction: 'society', usedThisNight: false, sealed: false },
    sanity: 6,
    hand: [unit()],
    handCount: 1,
    deckCount: 11,
    discard: [],
    abyss: [],
    board: { front: [unit()] },
    locations: { front: null },
    score: { total: 2, locations: { front: 2 } },
    nightWins: 0,
    ...overrides,
  };
}

function viewFixture(overrides = {}) {
  return {
    version: '2.2',
    phase: 'play',
    night: 1,
    maxNights: 3,
    current: 0,
    passed: [false, false],
    mulliganDone: [true, true],
    nightWins: [0, 0],
    history: [],
    result: null,
    environments: [],
    scores: [2, 0],
    players: [player(), player({ id: 1, name: '对手', faction: 'cult', hand: [], handCount: 4, board: { front: [] }, score: { total: 0, locations: { front: 0 } } })],
    events: [],
    actions: [],
    ...overrides,
  };
}

function countMatches(text, regex) {
  return (String(text).match(regex) ?? []).length;
}

test('卡牌模板字段齐全且做 HTML 转义', () => {
  const html = renderCard(unit({
    nameZh: '<img src=x onerror="boom()">诺拉',
    name: '<script>alert(1)</script>Nora',
    faction: 'society',
    type: 'unit',
    sanityCost: 1,
    keywords: ['stealth', 'chain'],
  }), { size: 'hand' });

  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;诺拉/);
  // The template's own art <img> is allowed; injected payloads must still be escaped.
  assert.ok(!html.includes('<img src=x'), '原始 img 标签不得进入 HTML');
  assert.ok(!html.includes('<script'), '原始 script 标签不得进入 HTML');
  assert.match(html, /data-card-id="nora-wells"/);
  assert.match(html, /data-uid="p0-1"/);
  assert.match(html, /data-faction="society"/);
  assert.match(html, /data-type="unit"/);
  assert.match(html, /data-face="reason"/);
  assert.match(html, /data-power="2"/);
  assert.match(html, /gh2-card--size-hand/);
  assert.match(html, /当前战力 2/);
  assert.match(html, /理智代价/);
  assert.match(html, /单位/);
  assert.match(html, /理 2/);
  assert.match(html, /狂 4/);
});

test('卡牌模板在关键词下方显示效果简介并做 HTML 转义', () => {
  const html = renderCard(unit({ effect: '入场封印敌方领袖能力一夜；对手每有一张隐秘卡自身+1' }), { size: 'hand' });
  assert.match(html, /gh2-card__effect/);
  assert.match(html, /入场封印敌方领袖能力一夜/);

  const unsafe = renderCard(unit({ effect: '<img src=x onerror="boom()">简介文本' }));
  assert.ok(!unsafe.includes('<img src=x'), '原始 img 标签不得进入 HTML');
  assert.match(unsafe, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;简介文本/);
});

test('盖牌只渲染统一卡背，不泄露身份/战力/关键词/uid', () => {
  const hidden = {
    uid: 'p0-secret-uid',
    cardId: 'lucia-vaughn',
    name: 'Lucia Vaughn',
    nameZh: '露西娅·沃恩',
    faction: 'cult',
    type: 'unit',
    face: 'madness',
    power: 7,
    keywords: ['stealth'],
    boardLocation: 'dream',
    slot: 2,
    hidden: true,
  };
  const html = renderCard(hidden);

  assert.match(html, /gh2-card--hidden/);
  assert.match(html, /gh2-card--back/);
  assert.match(html, /盖牌/);
  for (const leak of ['Lucia', '露西娅', 'p0-secret-uid', 'lucia-vaughn', 'data-power="7"', 'stealth', '隐秘', 'cult', 'dream']) {
    assert.ok(!html.includes(leak), `盖牌 HTML 泄露了 ${leak}`);
  }
  assert.equal(html, renderCardBack(), 'hidden 卡与统一卡背走同一条渲染路径');
});

test('装备卡背：renderCardBack 按 id 输出修饰类与数据属性，非法 id 回退默认', () => {
  const custom = renderCardBack({ cardBackId: 'oldgod' });
  assert.match(custom, /gh2-card--back-oldgod/);
  assert.match(custom, /data-card-back="oldgod"/);
  // hidden card forwards the equipped id through renderCard.
  const hiddenCard = renderCard({ hidden: true }, { size: 'board', cardBackId: 'tide' });
  assert.match(hiddenCard, /gh2-card--back-tide/);
  assert.match(hiddenCard, /data-card-back="tide"/);
  // unsafe / unknown-shaped ids fall back to the default and never inject classes.
  const unsafe = renderCardBack({ cardBackId: 'x" onclick="evil' });
  assert.match(unsafe, /data-card-back="default"/);
  assert.ok(!unsafe.includes('gh2-card--back-x'));
});

test('卡背 id 经 location grid 透传到盖牌，对手手牌保持默认', () => {
  const player = {
    board: {
      front: [{ hidden: true, uid: 'a' }],
    },
  };
  const grid = renderLocationGrid(player, { cardBackId: 'abyss' });
  assert.match(grid, /gh2-card--back-abyss/);
  const opponent = renderHandZone({ visible: false, count: 3 });
  assert.ok(!opponent.includes('gh2-card--back-abyss'), '对手盖牌不使用己方卡背');
});

test('双面卡按 face 取对应样式与当前战力', () => {
  const card = unit({ reasonPower: 3, madnessPower: 6 });
  const reason = renderCard({ ...card, face: 'reason', power: 3 });
  const madness = renderCard({ ...card, face: 'madness', power: 6 });

  assert.match(reason, /gh2-card--face-reason/);
  assert.match(reason, /data-face="reason"/);
  assert.match(reason, /data-power="3"/);
  assert.ok(!reason.includes('gh2-card--face-madness'));

  assert.match(madness, /gh2-card--face-madness/);
  assert.match(madness, /data-face="madness"/);
  assert.match(madness, /data-power="6"/);
  assert.match(madness, /当前战力 6/);
  assert.match(madness, /理 3/);
  assert.match(madness, /狂 6/);

  // 面角标用文字标明当前是理性还是疯狂
  assert.match(reason, /gh2-card__face-tag--reason">理性/);
  assert.match(madness, /gh2-card__face-tag--madness">疯狂/);
});

test('六个关键词以中文徽标呈现', () => {
  const html = renderCard(unit({
    keywords: ['stealth', 'seal', 'chain', 'backlash', 'corruption', 'sacrifice'],
  }));
  for (const [id, label] of [
    ['stealth', '隐秘'], ['seal', '封印'], ['chain', '连锁'],
    ['backlash', '理智反噬'], ['corruption', '腐化'], ['sacrifice', '献祭'],
  ]) {
    assert.match(html, new RegExp(`data-keyword="${id}"`));
    assert.ok(html.includes(label), `缺少关键词中文徽标 ${label}`);
  }
  const statuses = renderCard(unit({ sealed: true, corruption: 2, corruptionLoss: 1, equipment: { nameZh: '银灯' }, permanentPower: 3, thisNightPower: -1 }));
  assert.match(statuses, /封印/);
  assert.match(statuses, /腐化 ×2/);
  assert.match(statuses, /装备·银灯/);
  assert.match(statuses, /永久 \+3/);
  assert.match(statuses, /本夜 -1/);
});

test('理智计量条按数值渲染 6 格，坏值钳制', () => {
  const html = renderSanityMeter(4);
  assert.equal(countMatches(html, /gh2-sanity__cell(?: is-lit)?(?: is-danger-zone)?"/g), 6);
  assert.equal(countMatches(html, /gh2-sanity__cell is-lit(?: is-danger-zone)?"/g), 4);
  assert.match(html, /data-sanity="4"/);
  assert.match(html, /4\/6/);

  assert.match(renderSanityMeter(99), /data-sanity="6"/);
  assert.equal(countMatches(renderSanityMeter(99), /gh2-sanity__cell is-lit(?: is-danger-zone)?"/g), 6);
  assert.match(renderSanityMeter(-3), /data-sanity="0"/);
  assert.match(renderSanityMeter('bad'), /data-sanity="0"/);
  assert.match(renderSanityMeter(2), /is-madness/);
  assert.ok(!renderSanityMeter(5).includes('is-madness'));

  // 危险区格子（前 3 格）与清醒/疯狂状态徽章
  assert.equal(countMatches(renderSanityMeter(6), /is-danger-zone/g), 3);
  assert.match(renderSanityMeter(2), /gh2-sanity__state--mad">疯狂/);
  assert.match(renderSanityMeter(5), /gh2-sanity__state--sane">清醒/);
});

test('目标进度轨按阵营渲染线索/末日，pips 与阈值一致且坏值钳制', () => {
  const clue = renderObjectiveTrack({ objectiveType: 'clue', objective: 3, objectiveThreshold: 7 });
  assert.match(clue, /gh2-objective--clue/);
  assert.match(clue, /data-type="clue"/);
  assert.match(clue, /<span>线索<\/span>/);
  assert.equal(countMatches(clue, /gh2-objective__pip(?: is-lit)?"/g), 7);
  assert.equal(countMatches(clue, /gh2-objective__pip is-lit"/g), 3);
  assert.match(clue, /3\/7/);

  const doom = renderObjectiveTrack({ objectiveType: 'doom', objective: 6, objectiveThreshold: 7 }, { compact: true });
  assert.match(doom, /gh2-objective--doom/);
  assert.match(doom, /gh2-objective--compact/);
  assert.match(doom, /<span>末日<\/span>/);
  assert.equal(countMatches(doom, /gh2-objective__pip is-lit"/g), 6);

  // Missing type defaults to clue; over-threshold and bad values clamp.
  assert.match(renderObjectiveTrack({ objective: 99, objectiveThreshold: 7 }), /gh2-objective--clue/);
  assert.equal(countMatches(renderObjectiveTrack({ objective: 99, objectiveThreshold: 7 }), /gh2-objective__pip is-lit"/g), 7);
  assert.match(renderObjectiveTrack({ objectiveType: 'doom', objective: -4, objectiveThreshold: 7 }), /0\/7/);
});

test('地点列小计由视图卡牌战力求和，空槽与盖牌计 0', () => {
  const html = renderLocationColumn({
    location: 'front',
    playerIndex: 0,
    board: [
      unit({ uid: 'a', power: 2 }),
      null,
      unit({ uid: 'b', power: 3 }),
      { hidden: true, power: 9, uid: 'secret' },
      unit({ uid: 'c', type: 'event', power: 5 }),
    ],
    locationCard: unit({ type: 'location', nameZh: '溺钟祭坛', sealed: true }),
  });

  assert.match(html, /data-location="front"/);
  assert.match(html, /data-subtotal="5"/);
  assert.match(html, /对峙线/);
  assert.match(html, /<span>小计<\/span>/);
  assert.equal(countMatches(html, /gh2-location__slot(?:--empty)?"/g), 6, 'front capacity is 6');
  assert.match(html, /is-sealed/);
  assert.ok(!html.includes('secret'));

  const grid = renderLocationGrid(player());
  assert.equal(countMatches(grid, /data-location="/g), 1);
});

test('异变徽标只在对峙线按归属显示，全局异变也显示', () => {
  const frontAnomaly = {
    id: 'echoes-of-old-harbor', nameZh: '旧港回声', nameEn: 'Echoes of the Old Harbor',
    location: 'front', power: 1,
  };
  const front = renderLocationColumn({ location: 'front', board: [], anomaly: frontAnomaly });
  assert.match(front, /data-anomaly="echoes-of-old-harbor"/);
  assert.match(front, /旧港回声/);

  // A stale anomaly bound to a removed location must not render on the front column.
  const stale = renderLocationColumn({ location: 'front', board: [], anomaly: { ...frontAnomaly, location: 'scene' } });
  assert.ok(!stale.includes('gh2-anomaly'), '非对峙线归属的异变不显示徽标');

  const globalAnomaly = {
    id: 'windless-night', nameZh: '无风之夜', nameEn: 'Windless Night',
    location: null, environmentBlocked: true,
  };
  const html = renderLocationColumn({ location: 'front', board: [], anomaly: globalAnomaly });
  assert.match(html, /data-anomaly="windless-night"/);
  assert.match(html, /环境禁用/);
});

test('混沌代币在卡面显示带正负号的徽标', () => {
  const blessed = renderCard(unit({ chaos: { id: 'bless', modifier: 2 } }));
  const cursed = renderCard(unit({ chaos: { id: 'doom', modifier: -2 } }));
  assert.match(blessed, /代币 \+2/);
  assert.match(cursed, /代币 -2/);
});

test('对手手牌只输出数量，己方手牌输出卡牌', () => {
  const opponent = renderHandZone({
    visible: false,
    count: 5,
    cards: [unit({ uid: 'leak', name: 'TopSecretCard', nameZh: '绝密卡牌' })],
  });
  assert.match(opponent, /data-hand-visible="false"/);
  assert.match(opponent, /data-hand-count="5"/);
  assert.match(opponent, /对手手牌 5 张/);
  assert.ok(!opponent.includes('TopSecretCard'));
  assert.ok(!opponent.includes('绝密卡牌'));
  assert.ok(!opponent.includes('leak'));
  assert.ok(!opponent.includes('data-power='));

  const mine = renderHandZone({ visible: true, count: 1, cards: [unit()] });
  assert.match(mine, /data-hand-visible="true"/);
  assert.match(mine, /诺拉·威尔斯/);
});

test('环境行、领袖区与玩家信息条渲染状态', () => {
  const env = renderEnvironmentRow([unit({ type: 'environment', name: 'Lunar Eclipse', nameZh: '月食', power: 0, sealed: true })]);
  assert.match(env, /data-env-count="1"/);
  assert.match(env, /<span>环境<\/span>/);
  assert.match(env, /月食/);
  assert.match(env, /is-sealed/);
  assert.match(renderEnvironmentRow(null), /本夜无环境卡/);

  const ready = renderLeaderZone(player().leader, { playerIndex: 0 });
  assert.match(ready, /本夜可用/);
  const used = renderLeaderZone({ ...player().leader, usedThisNight: true, sealed: true }, { playerIndex: 1 });
  assert.match(used, /已被封印/);
  assert.match(renderLeaderZone(null), /无领袖/);

  const bar = renderPlayerBar(player(), { role: '你', current: true, handCount: 1 });
  assert.match(bar, /<span class="gh2-player-bar__score-label">夜分<\/span>/);
  assert.match(bar, /0 胜/);
  assert.match(bar, /data-sanity="6"/);
  assert.match(bar, /哈罗德·阿什比/);
});

test('坏数据不抛异常', () => {
  const calls = [
    () => renderCard(null),
    () => renderCard(42),
    () => renderCard('broken'),
    () => renderSanityMeter(null),
    () => renderSanityMeter({}),
    () => renderLocationColumn(null),
    () => renderLocationColumn({ board: 'not-array', location: '???', locationCard: 7 }),
    () => renderLocationGrid(null),
    () => renderHandZone(null),
    () => renderHandZone({ visible: true, cards: 'bad' }),
    () => renderEnvironmentRow(undefined),
    () => renderLeaderZone(null),
    () => renderPlayerBar(null),
    () => renderBoardMarkup(null),
    () => renderBoardMarkup({ players: [null, 'bad'], phase: null }),
  ];
  for (const call of calls) {
    assert.doesNotThrow(() => {
      const html = call();
      assert.equal(typeof html, 'string');
      assert.ok(html.length > 0);
    });
  }
});

test('真实 buildView 数据可直接驱动整盘模板', () => {
  const engine = createGame({ seed: 'ui-template-integration' });
  const view = buildView(engine, 0);
  const html = renderBoardMarkup(view, {
    pov: 0,
    demo: { enabled: true, seed: 'ui-template-integration', step: 3, running: true, lastAction: 'Mulligan 1 card' },
  });

  assert.match(html, /灰港三夜/);
  assert.ok(!html.includes('THREE NIGHTS IN GREYHARBOR'), '界面不再出现英文标题');
  assert.match(html, /data-phase="mulligan"/);
  assert.match(html, /演示模式/);
  assert.match(html, /data-hand-visible="true"/);
  assert.match(html, /data-hand-visible="false"/);
  assert.match(html, /data-location="front"/);
  assert.ok(!html.includes('data-location="scene"'));
  assert.ok(!html.includes('data-location="archive"'));
  assert.ok(!html.includes('data-location="dream"'));
  assert.equal(countMatches(html, /data-location="front"/g), 2, '双方各一条对峙线');
  assert.equal(countMatches(html, /gh2-sanity__cell(?: is-lit)?(?: is-danger-zone)?"/g), 12, '双方各一条 6 格理智条');
  assert.ok(!html.includes('<script'));
});

test('选中手牌时下方显示卡名与效果简介，未选中则不显示', () => {
  const hand = [unit({ effect: '附属单位+3；夜末返回手牌' })];
  const view = viewFixture({
    players: [player({ hand, handCount: 1 }), player({ id: 1, hand: [], handCount: 4 })],
  });
  const html = renderBoardMarkup(view, { pov: 0, controller: { selectedUid: 'p0-1' } });
  assert.match(html, /gh2-selected-note/);
  assert.match(html, /诺拉·威尔斯/);
  assert.match(html, /附属单位\+3；夜末返回手牌/);

  const none = renderBoardMarkup(view, { pov: 0, controller: {} });
  assert.ok(!none.includes('gh2-selected-note'), '未选中手牌时不渲染简介条');
});

test('演示控制器只从 view.actions 里选择合法动作（含双方换牌）', () => {
  const actions = [
    { type: 'pass', player: 0, label: 'Pass' },
    { type: 'playCard', player: 0, uid: 'p0-1', label: 'Play Nora' },
  ];
  const playView = {
    phase: 'play',
    current: 0,
    actions,
    mulliganDone: [true, true],
    players: [player(), player()],
  };
  const rng = { next: () => 0.1, int: (n) => (n > 0 ? 0 : 0) };
  assert.ok(actions.includes(chooseDemoAction(playView, rng)));
  assert.equal(chooseDemoAction(playView, rng), chooseDemoAction(playView, rng));

  const mullActions = [
    { type: 'mulligan', player: 0, uids: [], label: 'keep' },
    { type: 'mulligan', player: 0, uids: ['p0-1'], label: 'swap' },
    { type: 'mulligan', player: 1, uids: [], label: 'keep' },
  ];
  const mullView = {
    phase: 'mulligan',
    current: null,
    actions: mullActions,
    mulliganDone: [false, false],
  };
  assert.equal(chooseDemoAction(mullView, rng).player, 0);
  assert.ok(mullActions.includes(chooseDemoAction(mullView, { next: () => 0.5, int: () => 1 })));
  assert.equal(chooseDemoAction(mullView, { next: () => 0.5, int: () => 1 }).player, 1);
  assert.equal(chooseDemoAction({ ...playView, actions: [] }, rng), null);
});

test('对手动作标签不泄露手牌身份', () => {
  const label = publicActionLabel({
    type: 'playCard',
    player: 1,
    cardId: 'lucia-vaughn',
    uid: 'p1-3',
    location: 'front',
    slot: 0,
    label: 'Play Lucia Vaughn @ front#0 (face-down)',
  });
  assert.equal(label, '对手出牌 → 对峙线#1');
  assert.ok(!label.includes('Lucia'));
  assert.ok(!label.includes('lucia-vaughn'));
  assert.ok(!label.includes('p1-3'));
  assert.equal(publicActionLabel({ type: 'mulligan', player: 1, uids: ['p1-1'], label: 'Mulligan 1 card' }), '对手换牌');
  assert.equal(publicActionLabel({ type: 'pass', player: 1 }), '对手过牌');
});

test('演示控制器可无 DOM 推进到中盘并持续渲染', () => {
  const snapshots = [];
  const renderer = {
    render(view, options) {
      snapshots.push({ phase: view.phase, night: view.night, demo: options.demo });
    },
  };
  const demo = createDemoController({ renderer, seed: 'ui-demo-controller-test', pov: 0 });
  assert.equal(snapshots.length, 1, '创建时立即渲染初始视角');

  for (let i = 0; i < 60 && demo.getState().phase !== 'gameOver'; i += 1) demo.step();
  const phases = new Set(snapshots.map((entry) => entry.phase));
  const nights = new Set(snapshots.map((entry) => entry.night));
  assert.ok(phases.has('mulligan'), '应渲染换牌阶段');
  assert.ok(phases.has('play'), '应渲染行动阶段');
  assert.ok([...nights].some((night) => night >= 2), '应推进到中盘（第 2 夜及以后）');
  assert.ok(snapshots.every((entry) => entry.demo.enabled === true), '每张盘面都带演示标识');

  demo.restart();
  const jumped = demo.fastForwardToMidgame();
  assert.ok(jumped > 0);
  assert.ok(demo.getState().night >= 2 || demo.getState().phase === 'gameOver');
  demo.destroy();
});

test('整盘模板覆盖过牌、换牌与夜结算记录', () => {
  const html = renderBoardMarkup(viewFixture({
    phase: 'play',
    night: 2,
    passed: [true, false],
    mulliganDone: [true, true],
    history: [{
      night: 1,
      scores: [{ total: 12, locations: {} }, { total: 8, locations: {} }],
      winner: 0,
    }],
    result: null,
  }), { pov: 0 });

  assert.match(html, /你已过牌/);
  assert.match(html, /第 1 夜 · 12 : 8 · 你胜/);
  assert.match(html, /第 2 夜/);
  assert.match(html, /夜胜 0 : 0/);
});
