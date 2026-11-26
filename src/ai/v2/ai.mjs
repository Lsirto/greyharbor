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
import { STRICT_PROFILE, resolveDifficulty } from './difficulty.mjs';

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

  const rng = makeRng(options);
  // Mulligan keeps strict scoring; in-play decisions follow the difficulty.
  const profile = isMulligan ? STRICT_PROFILE : resolveDifficulty(options.difficulty);
  return selectAction(actions, scores, best, rng, profile);
}

/**
 * Turn the computed scores into a decision using a difficulty profile.
 * See difficulty.mjs for the meaning of mistakeChance / noiseRatio.
 */
function selectAction(actions, scores, best, rng, profile) {
  const count = actions.length;

  // Deliberate blunder: ignore the scores and take a uniform legal action.
  if (profile.mistakeChance > 0 && nextRandom(rng) < profile.mistakeChance) {
    const index = Math.floor(nextRandom(rng) * count);
    return actions[Math.min(Math.max(index, 0), count - 1)];
  }

  // Noisy evaluation: jitter each score by a fraction of the score spread.
  if (profile.noiseRatio > 0) {
    let worst = Infinity;
    for (const value of scores) {
      if (Number.isFinite(value) && value < worst) worst = value;
    }
    const spread = Number.isFinite(worst) ? Math.max(0, best - worst) : 0;
    const amplitude = spread * profile.noiseRatio;
    let chosenIndex = -1;
    let chosenKey = -Infinity;
    for (let index = 0; index < count; index += 1) {
      if (!Number.isFinite(scores[index])) continue;
      const key = scores[index] + (nextRandom(rng) - 0.5) * 2 * amplitude;
      if (key > chosenKey) {
        chosenKey = key;
        chosenIndex = index;
      }
    }
    return actions[chosenIndex >= 0 ? chosenIndex : 0];
  }

  // Strict: only near-best actions compete; exact ties are broken by the RNG.
  const epsilon = CONFIG.rng.tieEpsilon;
  let chosenIndex = -1;
  let chosenKey = -Infinity;
  for (let index = 0; index < count; index += 1) {
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
