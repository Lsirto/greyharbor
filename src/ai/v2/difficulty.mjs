/**
 * src/ai/v2/difficulty.mjs — data-driven AI difficulty profiles.
 *
 * A difficulty never duplicates the heuristic CONFIG.  It only changes how
 * chooseAction turns the already-computed action scores into a decision:
 *
 *   - mistakeChance: probability of a deliberate blunder (a uniform random
 *     legal action instead of the best one);
 *   - noiseRatio: per-action score jitter as a fraction of the current
 *     best-to-worst score spread.  0 means a strict argmax; larger values let
 *     weaker actions win while still generally preferring decent ones.
 *
 * The same injected RNG drives every roll, so a given view + seed + difficulty
 * is fully deterministic.
 */

export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({
    id: 'easy',
    label: '简单',
    description: '对手评估粗糙，时常打出次优选择',
    mistakeChance: 0.4,
    noiseRatio: 0.55,
  }),
  normal: Object.freeze({
    id: 'normal',
    label: '标准',
    description: '对手稳定评估，偶尔出现偏差',
    mistakeChance: 0,
    noiseRatio: 0.12,
  }),
  hard: Object.freeze({
    id: 'hard',
    label: '困难',
    description: '对手始终选择最优动作，几乎不留破绽',
    mistakeChance: 0,
    noiseRatio: 0,
  }),
});

/** Display order for selectors. */
export const DIFFICULTY_LIST = Object.freeze([
  DIFFICULTIES.easy,
  DIFFICULTIES.normal,
  DIFFICULTIES.hard,
]);

export const DEFAULT_DIFFICULTY = 'normal';

/** The strict profile used when no difficulty is supplied (legacy callers). */
export const STRICT_PROFILE = Object.freeze({
  mistakeChance: 0,
  noiseRatio: 0,
});

/**
 * Resolve a requested difficulty id to its profile.  An unknown/absent id
 * returns the strict profile so callers that predate difficulty keep their
 * exact original behaviour; an explicit valid id returns its profile.
 */
export function resolveDifficulty(id) {
  if (typeof id === 'string' && DIFFICULTIES[id]) return DIFFICULTIES[id];
  return STRICT_PROFILE;
}

/** Whether a value is a known difficulty id. */
export function isDifficulty(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(DIFFICULTIES, id);
}

export const DIFFICULTY_STORAGE_KEY = 'greyharbor.ai-difficulty.v1';

/**
 * Read the persisted difficulty id through a storage wrapper (getRaw/setRaw).
 * Falls back to the default when nothing valid is stored.
 */
export function readDifficulty(storage) {
  const raw = typeof storage?.getRaw === 'function'
    ? storage.getRaw(DIFFICULTY_STORAGE_KEY)
    : null;
  return isDifficulty(raw) ? raw : DEFAULT_DIFFICULTY;
}

/** Persist a difficulty id; no-op (false) for an unknown id or no storage. */
export function writeDifficulty(storage, id) {
  if (!isDifficulty(id)) return false;
  if (typeof storage?.setRaw !== 'function') return false;
  return storage.setRaw(DIFFICULTY_STORAGE_KEY, id) === true;
}
