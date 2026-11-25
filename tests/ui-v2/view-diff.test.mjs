/**
 * tests/ui-v2/view-diff.test.mjs — pure atmosphere diff tests.
 * No DOM, no engine, no timers.  Run with:
 *   node --test 'tests/ui-v2/*.test.mjs'
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectCardStates,
  diffViews,
  hasChanges,
} from '../../src/ui-v2/fx/view-diff.mjs';

function card(uid, extras = {}) {
  return {
    uid,
    cardId: 'test-card',
    name: 'Test Card',
    type: 'unit',
    faction: 'society',
    face: 'reason',
    faceDown: false,
    sealed: false,
    corruption: 0,
    ...extras,
  };
}

function view({
  night = 1,
  phase = 'play',
  sanity = [6, 6],
  board = [[], []],
  hand = [[], []],
  result = null,
} = {}) {
  const player = (index) => ({
    id: index,
    faction: index === 0 ? 'society' : 'cult',
    sanity: sanity[index],
    hand: hand[index],
    board: { scene: board[index], archive: [], dream: [] },
    locations: { scene: null, archive: null, dream: null },
    leader: { sealed: false },
  });
  return {
    version: 1,
    phase,
    night,
    maxNights: 3,
    players: [player(0), player(1)],
    environments: [],
    result,
  };
}

test('首次绘制（无前序视图）不产生入场/翻面等噪音', () => {
  const next = view({ board: [[card('u1')], []] });
  const diff = diffViews(null, next);
  assert.deepEqual(diff.entered, []);
  assert.deepEqual(diff.flipped, []);
  assert.deepEqual(diff.sanity, []);
  assert.equal(diff.nightChanged, false);
  assert.equal(diff.gameOver, false);
  assert.equal(diff.night, 1);
});

test('新上板卡按 uid 报告入场，且只在首次出现时报告一次', () => {
  const before = view();
  const after = view({ board: [[card('u1'), card('u2')], [card('u3')]] });
  const diff = diffViews(before, after);
  assert.deepEqual([...diff.entered].sort(), ['u1', 'u2', 'u3']);
  assert.deepEqual(diffViews(after, after).entered, []);
});

test('手牌与场上卡的 reason↔madness 变化都算翻面', () => {
  const before = view({
    hand: [[card('h1', { face: 'reason' })], []],
    board: [[card('b1', { face: 'reason' })], []],
  });
  const after = view({
    hand: [[card('h1', { face: 'madness' })], []],
    board: [[card('b1', { face: 'madness' })], []],
  });
  const diff = diffViews(before, after);
  assert.deepEqual(diff.flipped.map((entry) => entry.uid).sort(), ['b1', 'h1']);
  const handFlip = diff.flipped.find((entry) => entry.uid === 'h1');
  assert.equal(handFlip.from, 'reason');
  assert.equal(handFlip.to, 'madness');
  assert.equal(handFlip.player, 0);
  assert.equal(handFlip.area, 'hand');
});

test('理智变化按玩家给出 before/after/delta，未变化者不报告', () => {
  const diff = diffViews(view({ sanity: [5, 6] }), view({ sanity: [4, 6] }));
  assert.equal(diff.sanity.length, 1);
  assert.deepEqual(diff.sanity[0], { player: 0, from: 5, to: 4, delta: -1 });
});

test('新封印与新腐化只报告状态升级', () => {
  const before = view({ board: [[card('u1'), card('u2')], []] });
  const after = view({ board: [[card('u1', { sealed: true }), card('u2', { corruption: 2 })], []] });
  const diff = diffViews(before, after);
  assert.deepEqual(diff.sealed, ['u1']);
  assert.equal(diff.corrupted.length, 1);
  assert.deepEqual(diff.corrupted[0], { uid: 'u2', player: 0, tokens: 2, added: 2 });
});

test('夜切换与终局按阶段/夜号判定，且终局只报一次', () => {
  const first = view({ night: 1 });
  const second = view({ night: 2 });
  const diff = diffViews(first, second);
  assert.equal(diff.nightChanged, true);
  assert.equal(diff.night, 2);

  const over = view({ phase: 'gameOver', result: { winner: 0, reason: 'nightWins' } });
  assert.equal(diffViews(second, over).gameOver, true);
  assert.equal(diffViews(over, over).gameOver, false);
});

test('坏数据与畸形片段不会抛异常', () => {
  assert.deepEqual(diffViews(null, null).entered, []);
  assert.deepEqual(diffViews({}, undefined).flipped, []);
  assert.doesNotThrow(() => diffViews({ players: [null, 'x'], night: 'oops' }, {
    players: [42, []],
    night: NaN,
    environments: 'not-an-array',
  }));
  const garbage = collectCardStates({ players: [{ hand: [null, 3, { uid: '' }] }] });
  assert.equal(garbage.states.size, 0);
  assert.equal(garbage.boardUids.size, 0);
  assert.equal(hasChanges(diffViews(null, view())), false);
});

test('diff 是确定性的：相同输入得到相同结果', () => {
  const before = view({ sanity: [4, 6], board: [[card('u1')], []] });
  const after = view({ sanity: [3, 6], night: 2, board: [[card('u1', { face: 'madness' })], []] });
  assert.deepEqual(diffViews(before, after), diffViews(before, after));
  assert.equal(hasChanges(diffViews(before, after)), true);
});
