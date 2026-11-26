/**
 * tests/arena/draft.test.mjs — pure Arena Draft logic contract.
 *
 * No DOM. Covers pool eligibility, deterministic three-card offers, the
 * two-copy cap, full 19-card legality (via validateDeck), battleOptions
 * translation and a headless game that runs to completion.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ARENA_RULES,
  buildArenaBattleOptions,
  buildDeckSpec,
  copiesOf,
  createDraft,
  draftPoolFor,
  getOffers,
  isComplete,
  pickCard,
  roundIndex,
} from '../../src/arena/draft.mjs';
import { CARDS } from '../../src/engine/v2/cards.js';
import { validateDeck } from '../../src/engine/v2/deck-validation.js';
import { createGame } from '../../src/engine/v2/index.js';
import { chooseAction } from '../../src/ai/v2/ai.mjs';

const LEADER = Object.freeze({ society: 'harold-ashby', cult: 'elias-thorne' });

/** Auto-draft with a supplied choice policy; returns the finished draft. */
function autoDraft(faction, seed, policy) {
  const draft = createDraft({ faction, seed });
  while (!isComplete(draft)) {
    const offers = [...getOffers(draft)];
    const choice = policy(draft, offers);
    pickCard(draft, choice);
  }
  return draft;
}

/** Always prefer a card already owned (stresses the copy cap / late rounds). */
function doublingPolicy(draft, offers) {
  return offers.find((id) => copiesOf(draft, id) > 0) ?? offers[0];
}

test('createDraft：拒绝非法阵营，缺省种子回退默认值', () => {
  assert.throws(() => createDraft({ faction: 'neutral' }), /valid faction/);
  assert.throws(() => createDraft({}), /valid faction/);
  const draft = createDraft({ faction: 'society' });
  assert.equal(draft.seed, 'greyharbor-arena');
  assert.equal(roundIndex(draft), 0);
  assert.equal(isComplete(draft), false);
});

test('draftPoolFor：本阵营 11 张 + 中立 6 张 = 17 张，全部非领袖且不含敌阵营', () => {
  for (const faction of ['society', 'cult']) {
    const pool = draftPoolFor(faction);
    const enemy = faction === 'society' ? 'cult' : 'society';
    assert.equal(pool.length, 17);
    for (const id of pool) {
      const card = CARDS[id];
      assert.notEqual(card.type, 'leader');
      assert.ok(card.faction === faction || card.faction === 'neutral');
      assert.notEqual(card.faction, enemy);
    }
    assert.equal(new Set(pool).size, 17, '候选池无重复');
  }
});

test('getOffers：每轮 3 张互不相同且都在池内，重复调用结果稳定', () => {
  const draft = createDraft({ faction: 'society', seed: 'offers-1' });
  const first = getOffers(draft);
  assert.equal(first.length, 3);
  assert.equal(new Set(first).size, 3);
  for (const id of first) assert.ok(draft.pool.includes(id));
  // Memoized: rendering twice must not change the offers.
  assert.deepEqual([...getOffers(draft)], [...first]);
});

test('确定性：同种子 + 同选择策略产出完全一致的选牌序列', () => {
  const a = autoDraft('society', 'deterministic-seed', (d, o) => o[0]);
  const b = autoDraft('society', 'deterministic-seed', (d, o) => o[0]);
  assert.deepEqual(a.picks, b.picks);
  assert.deepEqual(a.offers, b.offers);
});

test('不同种子：首轮候选存在差异（RNG 并非恒定）', () => {
  const a = getOffers(createDraft({ faction: 'cult', seed: 'seed-alpha' }));
  const b = getOffers(createDraft({ faction: 'cult', seed: 'seed-beta' }));
  assert.notDeepEqual([...a], [...b]);
});

test('pickCard：拒绝非当前候选卡，选满后拒绝再选', () => {
  const draft = createDraft({ faction: 'society', seed: 'reject-1' });
  assert.throws(() => pickCard(draft, 'not-an-offer'), /not among the current offers/);
  pickCard(draft, getOffers(draft)[0]);
  assert.equal(roundIndex(draft), 1);
});

test('份数上限：单卡最多 2 份，满份后不再出现；激进加倍策略下候选始终不少于 3', () => {
  const draft = createDraft({ faction: 'cult', seed: 'cap-1' });
  let guard = 0;
  while (!isComplete(draft)) {
    const offers = [...getOffers(draft)];
    assert.ok(offers.length >= 3, '任意轮次都能提供 3 张候选');
    pickCard(draft, doublingPolicy(draft, offers));
    for (const id of draft.pool) {
      assert.ok(copiesOf(draft, id) <= ARENA_RULES.maxCopies);
    }
    guard += 1;
    if (guard > 25) throw new Error('loop guard');
  }
  assert.equal(draft.picks.length, 19);
});

test('完整选牌：两阵营多种子均产出合法 19 张牌（validateDeck 通过）', () => {
  for (const faction of ['society', 'cult']) {
    for (const seed of ['s1', 's2', 's3']) {
      const draft = autoDraft(faction, seed, (d, o) => doublingPolicy(d, o));
      const spec = buildDeckSpec(draft, LEADER[faction]);
      const result = validateDeck(spec, CARDS);
      assert.equal(result.ok, true, result.errors.map((e) => e.message).join('; '));
      assert.equal(spec.cards.length, 19);
    }
  }
});

test('buildDeckSpec：拒绝非领袖 / 敌阵营领袖', () => {
  const draft = autoDraft('society', 'leader-check', (d, o) => o[0]);
  assert.throws(() => buildDeckSpec(draft, 'nora-wells'), /invalid arena leader/);
  assert.throws(() => buildDeckSpec(draft, LEADER.cult), /invalid arena leader/);
});

test('buildArenaBattleOptions：未选满拒绝开局；输出形状与校验正确', () => {
  const pending = createDraft({ faction: 'society', seed: 'shape' });
  assert.throws(() => buildArenaBattleOptions(pending, LEADER.society), /before the draft is complete/);

  const draft = autoDraft('society', 'shape', (d, o) => o[0]);
  const options = buildArenaBattleOptions(draft, LEADER.society);
  assert.match(options.seed, /#arena-battle$/);
  assert.deepEqual(options.names, ['你 · 竞技场', 'AI · 对手']);
  assert.equal(options.decks.length, 2);
  assert.equal(options.decks[0].cards.length, 19);
  // Opposing seat is the preset faction id string.
  assert.equal(options.decks[1], 'cult');
});

test('headless 验收：battleOptions 可直接 createGame 并由 AI 打完一整局', () => {
  for (const faction of ['society', 'cult']) {
    const draft = autoDraft(faction, `headless-${faction}`, (d, o) => o[o.length - 1]);
    const options = buildArenaBattleOptions(draft, LEADER[faction]);
    const game = createGame(options);
    let steps = 0;
    while (game.phase !== 'gameOver') {
      const player = game.phase === 'mulligan' ? game.pending.players[0] : game.current;
      const action = chooseAction(game.viewFor(player), { seed: `${options.seed}#ai-${player}` });
      const outcome = game.apply(action);
      assert.equal(outcome.ok, true, outcome.error);
      steps += 1;
      if (steps > 400) throw new Error('arena battle deadlocked');
    }
    const result = game.result();
    assert.ok([0, 1].includes(result.winner));
  }
});
