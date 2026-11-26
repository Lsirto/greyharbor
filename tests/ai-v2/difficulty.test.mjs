/**
 * AI 难度：profile 数据、严格/噪声/犯错选择、确定性、存档读写。
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { buildView, createGame } from '../../src/engine/v2/index.js';
import { chooseAction } from '../../src/ai/v2/ai.mjs';
import { scoreAction, scoreMulligan } from '../../src/ai/v2/evaluate.mjs';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIFFICULTY_LIST,
  DIFFICULTY_STORAGE_KEY,
  STRICT_PROFILE,
  isDifficulty,
  readDifficulty,
  resolveDifficulty,
  writeDifficulty,
} from '../../src/ai/v2/difficulty.mjs';

/** Advance a fresh engine past mulligan so the current player is in play. */
function playView(seed) {
  const engine = createGame({ seed });
  for (const p of [0, 1]) engine.apply(engine.getActions(p)[0]);
  const pov = engine.current ?? 0;
  return buildView(engine, pov);
}

/** Index of the unique best action for a play view, or -1 when tied/invalid. */
function uniqueBestPlayIndex(view) {
  const scores = view.actions.map((action) => scoreAction(view, action));
  let best = -Infinity;
  let bestIndex = -1;
  let ties = 0;
  scores.forEach((value, index) => {
    if (!Number.isFinite(value)) return;
    if (value > best) {
      best = value;
      bestIndex = index;
      ties = 1;
    } else if (value === best) {
      ties += 1;
    }
  });
  return ties === 1 ? bestIndex : -1;
}

/** A play view whose best action is unique, trying several engine seeds. */
function viewWithUniqueBest() {
  for (const seed of ['diff-a', 'diff-b', 'diff-c', 'diff-d', 'diff-e']) {
    const view = playView(seed);
    if (view.actions.length > 2 && uniqueBestPlayIndex(view) >= 0) return view;
  }
  throw new Error('could not build a play view with a unique best action');
}

function makeMemoryStorage() {
  const map = new Map();
  return {
    map,
    getRaw: (key) => (map.has(key) ? map.get(key) : null),
    setRaw: (key, value) => {
      map.set(key, String(value));
      return true;
    },
  };
}

test('难度 profile 数据完整且按 简单→标准→困难 排列', () => {
  assert.deepEqual(DIFFICULTY_LIST.map((p) => p.id), ['easy', 'normal', 'hard']);
  for (const profile of DIFFICULTY_LIST) {
    assert.ok(profile.mistakeChance >= 0 && profile.mistakeChance <= 1);
    assert.ok(profile.noiseRatio >= 0);
    assert.equal(typeof profile.label, 'string');
    assert.equal(typeof profile.description, 'string');
    assert.ok(Object.isFrozen(profile));
  }
  // Weakness must be ordered monotonically: easy noisier than normal than hard.
  assert.ok(DIFFICULTIES.easy.noiseRatio > DIFFICULTIES.normal.noiseRatio);
  assert.ok(DIFFICULTIES.normal.noiseRatio > DIFFICULTIES.hard.noiseRatio);
  assert.ok(DIFFICULTIES.easy.mistakeChance > 0);
  assert.equal(DEFAULT_DIFFICULTY, 'normal');
});

test('isDifficulty / resolveDifficulty 行为', () => {
  assert.equal(isDifficulty('easy'), true);
  assert.equal(isDifficulty('hard'), true);
  assert.equal(isDifficulty('nope'), false);
  assert.equal(isDifficulty(undefined), false);

  assert.equal(resolveDifficulty('hard'), DIFFICULTIES.hard);
  // Unknown / absent ids resolve to the strict profile, not the default one.
  assert.equal(resolveDifficulty(undefined), STRICT_PROFILE);
  assert.equal(resolveDifficulty('bogus'), STRICT_PROFILE);
  assert.deepEqual(STRICT_PROFILE, { mistakeChance: 0, noiseRatio: 0 });
});

test('困难难度始终选择唯一最优动作（不同 RNG 种子也不偏离）', () => {
  const view = viewWithUniqueBest();
  const bestIndex = uniqueBestPlayIndex(view);
  for (let s = 0; s < 30; s += 1) {
    const action = chooseAction(view, { seed: `hard-${s}`, difficulty: 'hard' });
    assert.equal(view.actions.indexOf(action), bestIndex);
  }
});

test('未指定难度（旧调用）与困难一致，保持严格最优', () => {
  const view = viewWithUniqueBest();
  const bestIndex = uniqueBestPlayIndex(view);
  for (let s = 0; s < 10; s += 1) {
    const action = chooseAction(view, { seed: `legacy-${s}` });
    assert.equal(view.actions.indexOf(action), bestIndex);
  }
});

test('简单难度在多颗种子下会偏离最优，且始终返回合法动作', () => {
  const view = viewWithUniqueBest();
  const bestIndex = uniqueBestPlayIndex(view);
  const chosen = new Set();
  for (let s = 0; s < 60; s += 1) {
    const action = chooseAction(view, { seed: `easy-${s}`, difficulty: 'easy' });
    const index = view.actions.indexOf(action);
    assert.ok(index >= 0, 'choice must be a legal action');
    chosen.add(index);
  }
  assert.ok(chosen.size > 1, 'easy AI should vary its decisions');
  assert.ok(chosen.has(bestIndex) === false || chosen.size > 1);
  assert.ok([...chosen].some((index) => index !== bestIndex),
    'easy AI should sometimes pick a non-best action');
});

test('同一 view + 同一难度 + 同一种子完全可复现', () => {
  const view = viewWithUniqueBest();
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const options = { seed: 'repeatable', difficulty };
    const first = chooseAction(view, options);
    const second = chooseAction(view, options);
    assert.equal(view.actions.indexOf(first), view.actions.indexOf(second));
  }
});

test('换牌阶段不受难度影响：简单难度也按严格最优换牌', () => {
  const engine = createGame({ seed: 'mulligan-difficulty' });
  const pov = engine.current ?? 0;
  const view = buildView(engine, pov);
  assert.equal(view.phase, 'mulligan');
  const scores = view.actions.map((action) => scoreMulligan(view, action));
  let bestIndex = -1;
  let best = -Infinity;
  scores.forEach((value, index) => {
    if (value > best) {
      best = value;
      bestIndex = index;
    }
  });
  for (let s = 0; s < 20; s += 1) {
    const action = chooseAction(view, { seed: `mull-easy-${s}`, difficulty: 'easy' });
    assert.equal(view.actions.indexOf(action), bestIndex);
  }
});

test('难度存档：写入后读回，坏值回退默认，拒绝非法 id', () => {
  const storage = makeMemoryStorage();
  // Nothing stored → default.
  assert.equal(readDifficulty(storage), DEFAULT_DIFFICULTY);

  assert.equal(writeDifficulty(storage, 'hard'), true);
  assert.equal(storage.getRaw(DIFFICULTY_STORAGE_KEY), 'hard');
  assert.equal(readDifficulty(storage), 'hard');

  // Unknown id is rejected and does not overwrite.
  assert.equal(writeDifficulty(storage, 'insane'), false);
  assert.equal(readDifficulty(storage), 'hard');

  // A malformed stored value falls back to the default.
  storage.setRaw(DIFFICULTY_STORAGE_KEY, 'garbage');
  assert.equal(readDifficulty(storage), DEFAULT_DIFFICULTY);
});

test('缺少存储方法时读写安全降级', () => {
  assert.equal(readDifficulty(null), DEFAULT_DIFFICULTY);
  assert.equal(writeDifficulty(null, 'easy'), false);
  assert.equal(readDifficulty({}), DEFAULT_DIFFICULTY);
});
