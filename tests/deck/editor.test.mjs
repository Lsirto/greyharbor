/**
 * tests/deck/editor.test.mjs — pure deck editor + storage contract.
 *
 * No DOM. Covers pool/leader eligibility, add/remove, the two-copy and
 * 19-card caps, faction/leader switching, validateDeck integration, the
 * local save round-trip and a headless game played with a custom deck.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addCard,
  copiesOf,
  createEditor,
  leadersFor,
  loadPreset,
  poolFor,
  removeCard,
  setFaction,
  setLeader,
  toDeckSpec,
  totalCount,
  typeBreakdown,
  validateEditor,
} from '../../src/deck/editor.mjs';
import { PRESET_GROUPS, findPresetById } from '../../src/engine/v2/cards.js';
import {
  CUSTOM_DECKS_KEY,
  hasSavedDeck,
  loadDeck,
  saveDeck,
} from '../../src/deck/decks-store.mjs';
import { buildDeckBattleOptions } from '../../src/deck/battle.mjs';
import { CARDS } from '../../src/engine/v2/cards.js';
import { createGame } from '../../src/engine/v2/index.js';
import { chooseAction } from '../../src/ai/v2/ai.mjs';

function fakeStorage() {
  const map = new Map();
  return {
    getJson: (key) => {
      const raw = map.get(key);
      if (raw == null) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    setJson: (key, value) => map.set(key, JSON.stringify(value)),
    getRaw: (key) => map.get(key) ?? null,
    setRaw: (key, value) => map.set(key, value),
    remove: (key) => map.delete(key),
  };
}

/** Fill non-leaders to exactly 19 using the eligible pool. */
function fillEditor(editor) {
  for (const card of poolFor(editor.faction)) {
    if (totalCount(editor) >= 19) break;
    addCard(editor, card.id);
    if (totalCount(editor) < 19) addCard(editor, card.id);
  }
  return editor;
}

test('createEditor：默认学会阵营与首个领袖，空选择', () => {
  const editor = createEditor();
  assert.equal(editor.faction, 'society');
  assert.equal(editor.leader, 'harold-ashby');
  assert.deepEqual(editor.counts, {});
  const cult = createEditor({ faction: 'cult' });
  assert.equal(cult.leader, 'elias-thorne');
  // 非法阵营回退默认。
  assert.equal(createEditor({ faction: 'neutral' }).faction, 'society');
});

test('poolFor / leadersFor：非领袖池按阵营区分、领袖按阵营计数，无敌人卡', () => {
  const poolSize = { society: 23, cult: 25 };
  const leaderSize = { society: 4, cult: 3 };
  for (const faction of ['society', 'cult']) {
    const pool = poolFor(faction);
    const enemy = faction === 'society' ? 'cult' : 'society';
    assert.equal(pool.length, poolSize[faction]);
    for (const card of pool) {
      assert.notEqual(card.type, 'leader');
      assert.notEqual(card.faction, enemy);
      assert.ok(card.faction === faction || card.faction === 'neutral');
    }
    const leaders = leadersFor(faction);
    assert.equal(leaders.length, leaderSize[faction]);
    for (const leader of leaders) {
      assert.equal(leader.type, 'leader');
      assert.equal(leader.faction, faction);
    }
  }
});

test('addCard：合法加入并计数；拒绝领袖、敌阵营与未知 id', () => {
  const editor = createEditor({ faction: 'society' });
  const firstId = poolFor('society')[0].id;
  assert.equal(addCard(editor, firstId).ok, true);
  assert.equal(copiesOf(editor, firstId), 1);
  assert.equal(totalCount(editor), 1);
  assert.equal(addCard(editor, 'harold-ashby').ok, false);
  assert.equal(addCard(editor, 'nope-not-a-card').ok, false);
  const enemyCard = poolFor('cult').find((c) => c.faction === 'cult').id;
  assert.equal(addCard(editor, enemyCard).ok, false);
});

test('份数上限：单卡最多 2 份，第三次返回 copy-cap', () => {
  const editor = createEditor();
  const id = poolFor('society')[0].id;
  assert.equal(addCard(editor, id).ok, true);
  assert.equal(addCard(editor, id).ok, true);
  assert.equal(addCard(editor, id).reason, 'copy-cap');
  assert.equal(copiesOf(editor, id), 2);
});

test('总数上限：满 19 张后再加入返回 full', () => {
  const editor = fillEditor(createEditor());
  assert.equal(totalCount(editor), 19);
  const another = poolFor('society').find((c) => copiesOf(editor, c.id) < 2).id;
  assert.equal(addCard(editor, another).reason, 'full');
});

test('removeCard：递减计数，归零删除；空卡返回 empty', () => {
  const editor = createEditor();
  const id = poolFor('society')[0].id;
  addCard(editor, id);
  addCard(editor, id);
  assert.equal(removeCard(editor, id).ok, true);
  assert.equal(copiesOf(editor, id), 1);
  assert.equal(removeCard(editor, id).ok, true);
  assert.equal(copiesOf(editor, id), 0);
  assert.equal(removeCard(editor, id).reason, 'empty');
});

test('setLeader：接受本阵营领袖，拒绝敌阵营与非领袖', () => {
  const editor = createEditor({ faction: 'society' });
  assert.equal(setLeader(editor, 'enid-halloway').ok, true);
  assert.equal(editor.leader, 'enid-halloway');
  assert.equal(setLeader(editor, 'elias-thorne').ok, false);
  assert.equal(setLeader(editor, poolFor('society')[0].id).ok, false);
});

test('setFaction：切换阵营并清空选择、重置领袖', () => {
  const editor = createEditor({ faction: 'society' });
  addCard(editor, poolFor('society')[0].id);
  assert.equal(setFaction(editor, 'cult').ok, true);
  assert.equal(editor.faction, 'cult');
  assert.equal(editor.leader, 'elias-thorne');
  assert.deepEqual(editor.counts, {});
  assert.equal(setFaction(editor, 'neutral').ok, false);
});

test('toDeckSpec：展开为 createGame 形状，领袖不进 cards', () => {
  const editor = createEditor({ faction: 'cult' });
  const id = poolFor('cult')[0].id;
  addCard(editor, id);
  addCard(editor, id);
  const spec = toDeckSpec(editor);
  assert.equal(spec.faction, 'cult');
  assert.equal(spec.leader, 'elias-thorne');
  assert.deepEqual(spec.cards, [id, id]);
});

test('validateEditor：未选满不合法，满 19 张通过', () => {
  const pending = createEditor();
  assert.equal(validateEditor(pending).ok, false);
  const full = fillEditor(createEditor());
  const result = validateEditor(full);
  assert.equal(result.ok, true, result.errors.map((e) => e.message).join('; '));
  assert.equal(result.summary.nonLeaderCount, 19);
});

test('typeBreakdown：按类型统计且总数一致', () => {
  const editor = fillEditor(createEditor());
  const breakdown = typeBreakdown(editor);
  const sum = Object.values(breakdown).reduce((a, b) => a + b, 0);
  assert.equal(sum, 19);
});

test('存档：保存后可识别并按阵营重建，内容与原编辑器一致', () => {
  const storage = fakeStorage();
  assert.equal(hasSavedDeck(storage, 'society'), false);
  const editor = fillEditor(createEditor({ faction: 'society' }));
  setLeader(editor, 'augustus-wayne');
  saveDeck(storage, editor);
  assert.equal(hasSavedDeck(storage, 'society'), true);
  assert.equal(storage.getRaw(CUSTOM_DECKS_KEY).length > 0, true);
  const restored = loadDeck(storage, 'society');
  assert.equal(restored.faction, 'society');
  assert.equal(restored.leader, 'augustus-wayne');
  assert.deepEqual(restored.counts, editor.counts);
  // 未保存的阵营返回 null。
  assert.equal(loadDeck(storage, 'cult'), null);
});

test('存档容错：坏 JSON 不抛错，按无存档处理', () => {
  const storage = fakeStorage();
  storage.setRaw(CUSTOM_DECKS_KEY, '{broken json');
  assert.equal(hasSavedDeck(storage, 'society'), false);
  assert.equal(loadDeck(storage, 'society'), null);
});

test('buildDeckBattleOptions：非法牌组抛错，合法牌组输出正确形状', () => {
  assert.throws(() => buildDeckBattleOptions(createEditor(), 's1'), /failed validation/);
  const editor = fillEditor(createEditor({ faction: 'society' }));
  const options = buildDeckBattleOptions(editor, 'custom-seed');
  assert.equal(options.seed, 'custom-seed');
  assert.deepEqual(options.names, ['你 · 自定义牌组', 'AI · 对手']);
  assert.equal(options.decks[0].cards.length, 19);
  assert.equal(options.decks[1], 'cult');
});

test('headless 验收：自定义牌组可直接 createGame 并由 AI 打完一整局', () => {
  for (const faction of ['society', 'cult']) {
    const editor = fillEditor(createEditor({ faction }));
    const options = buildDeckBattleOptions(editor, `headless-${faction}`);
    const game = createGame(options);
    let steps = 0;
    while (game.phase !== 'gameOver') {
      const player = game.phase === 'mulligan' ? game.pending.players[0] : game.current;
      const action = chooseAction(game.viewFor(player), { seed: `${options.seed}#ai-${player}` });
      const outcome = game.apply(action);
      assert.equal(outcome.ok, true, outcome.error);
      steps += 1;
      if (steps > 400) throw new Error('custom deck battle deadlocked');
    }
    assert.ok([0, 1].includes(game.result().winner));
  }
});

test('PRESET_GROUPS：每阵营恰好 2 套，均含中文名/说明且 19 张合法', () => {
  for (const faction of ['society', 'cult']) {
    const group = PRESET_GROUPS[faction];
    assert.equal(group.length, 2);
    for (const preset of group) {
      assert.equal(preset.faction, faction);
      assert.equal(preset.cards.length, 19);
      assert.ok(preset.nameZh.length > 0);
      assert.ok(preset.descZh.length > 0);
      const editor = createEditor({ faction });
      assert.equal(loadPreset(editor, preset).ok, true);
      assert.equal(validateEditor(editor).ok, true);
      assert.equal(totalCount(editor), 19);
    }
    // The two styles must actually differ in their card lists.
    assert.notDeepEqual(group[0].cards, group[1].cards);
  }
});

test('findPresetById：命中返回套，异类型/未知 id 返回 null', () => {
  assert.equal(findPresetById('society-aggro').nameZh, '强攻阵线');
  assert.equal(findPresetById('cult-madness').nameZh, '狂乱深渊');
  assert.equal(findPresetById('no-such-preset'), null);
  assert.equal(findPresetById(42), null);
});

test('loadPreset：替换非领袖卡但保留当前领袖，异阵营套被拒绝', () => {
  const editor = createEditor({ faction: 'society' });
  setLeader(editor, 'enid-halloway');
  const preset = findPresetById('society-aggro');
  assert.equal(loadPreset(editor, preset).ok, true);
  assert.equal(editor.leader, 'enid-halloway');
  assert.equal(copiesOf(editor, 'brass-badge'), 1);

  const cultPreset = findPresetById('cult-madness');
  assert.equal(loadPreset(editor, cultPreset).ok, false);
  assert.equal(loadPreset(editor, { cards: null }).ok, false);
});
