/**
 * src/ui-v2/leader-composer.mjs — pure step machine for Elias' leader skill.
 *
 * Harold's skill is a single target pick and stays in the game controller.
 * Elias' skill is encoded by the engine as one flat action per complete
 * combination of four fields:
 *
 *   sacrificeUid · cardUid · location/slot · replaceWithUid
 *
 * This module never invents an action.  It enumerates the values of those
 * fields from the *current real view.actions* (via action-matcher), walks the
 * player through the four choices, and at the end asks `matchAction` for the
 * single real action matching the accumulated context.  Only that exact
 * object is handed to the injected `commit` callback.
 *
 * DOM-free, engine-free, no randomness.  All mutating calls return
 * `{ ok, ... }` and never throw on malformed input.
 */

import { findMatchingActions, matchAction } from './action-matcher.mjs';

export const LEADER_STEPS = Object.freeze([
  'sacrifice',
  'aberration',
  'placement',
  'replacement',
]);

export const LEADER_STEP_LABELS = Object.freeze({
  sacrifice: '① 选择己方献祭目标',
  aberration: '② 选择牌堆异怪',
  placement: '③ 选择明放落点',
  replacement: '④ 选择替代信徒（可跳过）',
});

const LOCATION_ZH = Object.freeze({ scene: '现场', archive: '档案', dream: '梦境' });

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function isUid(value) {
  return typeof value === 'string' && value.length > 0;
}

function validSlot(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function isEliasAction(value) {
  const action = asObject(value);
  return action.type === 'useLeader'
    && isUid(action.sacrificeUid)
    && isUid(action.cardUid)
    && isUid(action.location);
}

function candidateId(value) {
  return JSON.stringify(value);
}

function defaultLabelFor(stepKey, value, action) {
  if (stepKey === 'sacrifice') return `献祭目标 ${value.sacrificeUid}`;
  if (stepKey === 'aberration') {
    const match = /→\s*([^\s@]+)/.exec(String(asObject(action).label ?? ''));
    return `牌堆异怪 ${match?.[1] ?? value.cardUid}`;
  }
  if (stepKey === 'placement') {
    return `${LOCATION_ZH[value.location] ?? value.location} #${value.slot + 1}`;
  }
  return value.replaceWithUid === null ? '不替换 · 跳过' : `替代信徒 ${value.replaceWithUid}`;
}

/**
 * @param {object} options
 * @param {(action: object) => boolean} [options.commit] receives the one real
 *        action object from the supplied action array; returning false means
 *        the commit was rejected.
 * @param {(stepKey: string, value: object, action: object) => string} [options.labelFor]
 * @returns {object} composer state machine
 */
export function createLeaderComposer(options = {}) {
  const opts = asObject(options);
  const commit = typeof opts.commit === 'function' ? opts.commit : null;
  const labelFor = typeof opts.labelFor === 'function' ? opts.labelFor : defaultLabelFor;

  let actions = [];
  let step = -1;
  let context = {};
  let error = '';

  /** Real actions still compatible with every choice made so far. */
  function pool() {
    return findMatchingActions(actions, { type: 'useLeader', ...context });
  }

  /** Candidate *field values*, deduplicated, each still backed by a real action. */
  function candidatesFor(stepIndex) {
    const key = LEADER_STEPS[stepIndex];
    if (!key) return [];
    const seen = new Map();
    for (const action of pool()) {
      let value = null;
      if (key === 'sacrifice') {
        if (isUid(action.sacrificeUid)) value = { sacrificeUid: action.sacrificeUid };
      } else if (key === 'aberration') {
        if (isUid(action.cardUid)) value = { cardUid: action.cardUid };
      } else if (key === 'placement') {
        const slot = validSlot(action.slot);
        if (isUid(action.location) && slot !== null) value = { location: action.location, slot };
      } else if (key === 'replacement') {
        value = { replaceWithUid: isUid(action.replaceWithUid) ? action.replaceWithUid : null };
      }
      if (!value) continue;
      const id = candidateId(value);
      if (seen.has(id)) continue;
      let label = '';
      try {
        label = String(labelFor(key, value, action) ?? defaultLabelFor(key, value, action));
      } catch (_) {
        label = defaultLabelFor(key, value, action);
      }
      seen.set(id, { id, label, value, action });
    }
    return Array.from(seen.values());
  }

  function snapshot() {
    const active = step >= 0 && step < LEADER_STEPS.length;
    return {
      active,
      finished: step === LEADER_STEPS.length,
      stepIndex: step,
      step: active ? LEADER_STEPS[step] : null,
      stepLabel: active ? LEADER_STEP_LABELS[LEADER_STEPS[step]] : '',
      totalSteps: LEADER_STEPS.length,
      context: { ...context },
      candidates: active
        ? candidatesFor(step).map((candidate) => ({
          id: candidate.id,
          label: candidate.label,
          value: { ...candidate.value },
        }))
        : [],
      error,
    };
  }

  function fail(reason) {
    error = String(reason ?? '无效选择');
    return { ok: false, error, state: snapshot() };
  }

  function begin(nextActions) {
    actions = Array.isArray(nextActions)
      ? nextActions.filter((entry) => isEliasAction(entry))
      : [];
    context = {};
    error = '';
    step = actions.length ? 0 : -1;
    if (!actions.length) error = '当前没有合法的伊莱亚斯领袖动作';
    return { ok: actions.length > 0, ...snapshot() };
  }

  function cancel() {
    step = -1;
    context = {};
    error = '';
    return { ok: true, state: snapshot() };
  }

  function finalize() {
    // The only write path: deep-match the accumulated context against the
    // untouched view.actions list and commit that exact object, if unique.
    const action = matchAction(actions, { type: 'useLeader', ...context });
    if (!action) return fail('无法唯一匹配合法领袖动作，请重新选择');
    step = LEADER_STEPS.length;
    error = '';
    const state = snapshot();
    if (commit && commit(action) === false) return fail('领袖动作被拒绝');
    return { ok: true, done: true, action, state };
  }

  function choose(candidateIdOrValue) {
    if (step < 0 || step >= LEADER_STEPS.length) return fail('领袖编排未在进行中');
    const candidates = candidatesFor(step);
    const wanted = isUid(candidateIdOrValue) ? candidateIdOrValue : candidateId(asObject(candidateIdOrValue));
    const candidate = candidates.find((entry) => entry.id === wanted);
    if (!candidate) return fail('该选项不属于当前合法动作');
    context = { ...context, ...candidate.value };
    error = '';
    if (step === LEADER_STEPS.length - 1) return finalize();
    step += 1;
    return { ok: true, done: false, state: snapshot() };
  }

  function chooseValue(value) {
    return choose(candidateId(asObject(value)));
  }

  function skip() {
    if (step !== LEADER_STEPS.length - 1) return fail('只有替代信徒步骤可以跳过');
    return choose(candidateId({ replaceWithUid: null }));
  }

  return {
    begin,
    cancel,
    choose,
    chooseValue,
    skip,
    snapshot,
    isActive: () => step >= 0 && step < LEADER_STEPS.length,
  };
}

export default createLeaderComposer;
