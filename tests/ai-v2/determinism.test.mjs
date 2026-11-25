/** 确定性：同一 view + 同一 options 结果一致；并列时不同种子可以不同。 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { buildView, createGame } from '../../src/engine/v2/index.js';
import { chooseAction } from '../../src/ai/v2/ai.mjs';

function readyEngine(seed) {
  const engine = createGame({ seed });
  for (const p of [0, 1]) engine.apply(engine.getActions(p)[0]);
  return engine;
}

test('同一局面两次 chooseAction 完全一致', () => {
  const engine = readyEngine('determinism-once');
  const view = buildView(engine, engine.current ?? 0);
  const options = { seed: 'fixed-seed' };
  const first = chooseAction(view, options);
  const second = chooseAction(view, options);
  assert.ok(view.actions.includes(first));
  assert.equal(view.actions.indexOf(first), view.actions.indexOf(second));
  assert.deepStrictEqual(first, second);

  // 注入 rngState 也必须可复现。
  const state = { rngState: 123456789 };
  const third = chooseAction(view, { rngState: state });
  const fourth = chooseAction(view, { rngState: { rngState: 123456789 } });
  assert.equal(view.actions.indexOf(third), view.actions.indexOf(fourth));
});

test('完全并列的动作：不同种子允许给出不同选择', () => {
  const engine = readyEngine('determinism-ties');
  const pov = engine.current ?? 0;
  const view = buildView(engine, pov);
  // 把合法动作列表替换为若干个完全等价的 Pass：所有评分相同，只能靠 RNG 裁决。
  view.actions = Array.from({ length: 8 }, (_, index) => ({
    type: 'pass',
    player: pov,
    label: `Pass-${index}`,
  }));

  const choices = new Set();
  for (let seed = 0; seed < 24; seed += 1) {
    const action = chooseAction(view, { seed: `tie-${seed}` });
    assert.ok(view.actions.includes(action));
    choices.add(view.actions.indexOf(action));
  }
  assert.ok(choices.size > 1, 'tie-break RNG should be able to differ across seeds');
});
