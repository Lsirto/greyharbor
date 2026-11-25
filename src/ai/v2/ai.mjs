/**
 * src/ai/v2/ai.mjs — 评估型 AI 对手入口。
 *
 *   import { chooseAction } from './src/ai/v2/ai.mjs';
 *   const action = chooseAction(buildView(engine, pov), { seed: 'p1' });
 *
 * 严格 view-only：本目录只 import 自身文件与 src/engine/rng.js；输入只有
 * buildView(pov) 的脱敏视角，返回值一定是传入 view.actions 中的同一个对象。
 * 相同 view + 相同 options 必然得到相同结果；并列时用注入式种子 RNG 裁决。
 */

import { hashSeed, nextRandom } from '../../engine/rng.js';
import { CONFIG } from './config.mjs';
import { buildPosition, scoreAction, scoreMulligan } from './evaluate.mjs';

function makeRng(options) {
  if (options && typeof options.rngState === 'number' && Number.isFinite(options.rngState)) {
    return { rngState: options.rngState >>> 0 };
  }
  if (options?.rngState && typeof options.rngState.rngState === 'number') {
    return { rngState: options.rngState.rngState >>> 0 };
  }
  return { rngState: hashSeed(options?.seed ?? CONFIG.rng.defaultSeed) };
}

/**
 * @param {object} view buildView(pov) 产生的脱敏视角
 * @param {{seed?:string|number, rngState?:number|{rngState:number}}} options
 * @returns {object|null} view.actions 中的对象（引用相等），无动作时返回 null
 */
export function chooseAction(view, options = {}) {
  const actions = view?.actions;
  if (!Array.isArray(actions) || actions.length === 0) return null;

  const isMulligan = view.phase === 'mulligan';
  const me = isMulligan
    ? (actions.find((entry) => entry?.type === 'mulligan')?.player ?? 0)
    : (view.current ?? actions.find((entry) => entry?.player !== undefined)?.player ?? 0);
  const base = isMulligan ? null : buildPosition(view, me);

  const scores = actions.map((action) =>
    (isMulligan ? scoreMulligan(view, action) : scoreAction(view, action, base)));

  let best = -Infinity;
  for (const score of scores) {
    if (Number.isFinite(score) && score > best) best = score;
  }
  if (!Number.isFinite(best)) return actions[0];

  const epsilon = CONFIG.rng.tieEpsilon;
  const rng = makeRng(options);
  let chosenIndex = -1;
  let chosenKey = -Infinity;
  for (let index = 0; index < scores.length; index += 1) {
    if (scores[index] < best - epsilon) continue;
    const key = nextRandom(rng);
    if (key > chosenKey) {
      chosenKey = key;
      chosenIndex = index;
    }
  }
  return actions[chosenIndex >= 0 ? chosenIndex : 0];
}

/** 可选工厂：把固定 options 绑定成一个可复用的决策器。 */
export function createAI(options = {}) {
  return {
    chooseAction: (view) => chooseAction(view, options),
  };
}
