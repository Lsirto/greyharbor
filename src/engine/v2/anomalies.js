/**
 * Location anomalies (v1.3) — pure data + one seeded draw helper.
 *
 * Each night exactly one anomaly is active (see docs/EXPANSION_V1_DESIGN.md).
 * An anomaly carries exactly one effect flag; `location` is null for the
 * global (no-location) anomaly.  Engine/scoring read these fields, they never
 * contain card-specific imperative code.
 */

import { randInt } from '../rng.js';

/**
 * Effect fields (only one is active per anomaly):
 *   power           number  — location-wide power modifier this night
 *   entryCorruption number  — corruption added to a unit on entry
 *   entrySanity     number  — sanity change on entry (+ gain / − loss)
 *   sealImmune      boolean — cards at the location cannot be newly sealed
 *   leaderBlocked   boolean — leader skills cannot target the location
 *   environmentBlocked boolean — no environment cards this night (global)
 */
export const ANOMALIES = Object.freeze([
  Object.freeze({
    id: 'surging-black-tide', nameZh: '黑潮涌动', nameEn: 'Surging Black Tide',
    location: 'dream', power: 2,
  }),
  Object.freeze({
    id: 'whispering-archive', nameZh: '档案低语', nameEn: 'Whispering Archive',
    location: 'archive', power: 1,
  }),
  Object.freeze({
    id: 'blighted-scene', nameZh: '枯萎现场', nameEn: 'Blighted Scene',
    location: 'scene', power: -1,
  }),
  Object.freeze({
    id: 'echoes-of-old-harbor', nameZh: '旧港回声', nameEn: 'Echoes of the Old Harbor',
    location: 'scene', power: 1,
  }),
  Object.freeze({
    id: 'corrupt-mire', nameZh: '腐化泥沼', nameEn: 'Corrupt Mire',
    location: 'scene', entryCorruption: 1,
  }),
  Object.freeze({
    id: 'deep-nightmare', nameZh: '梦魇深处', nameEn: 'Deep Nightmare',
    location: 'dream', entryCorruption: 1,
  }),
  Object.freeze({
    id: 'gazing-rift', nameZh: '凝视裂隙', nameEn: 'Gazing Rift',
    location: 'dream', entrySanity: -1,
  }),
  Object.freeze({
    id: 'sanctum-of-reason', nameZh: '理智圣所', nameEn: 'Sanctum of Reason',
    location: 'archive', entrySanity: 1,
  }),
  Object.freeze({
    id: 'shelter-of-lamps', nameZh: '明灯庇护', nameEn: 'Shelter of Lamps',
    location: 'archive', sealImmune: true,
  }),
  Object.freeze({
    id: 'sealed-ruins', nameZh: '封印废墟', nameEn: 'Sealed Ruins',
    location: 'dream', sealImmune: true,
  }),
  Object.freeze({
    id: 'muted-ground', nameZh: '禁声之地', nameEn: 'Muted Ground',
    location: 'scene', leaderBlocked: true,
  }),
  Object.freeze({
    id: 'windless-night', nameZh: '无风之夜', nameEn: 'Windless Night',
    location: null, environmentBlocked: true,
  }),
]);

/** Draw tonight's anomaly through the engine's seeded RNG. */
export function drawAnomaly(state) {
  const def = ANOMALIES[randInt(state, ANOMALIES.length)];
  return { ...def };
}

export function anomalyFor(state) {
  return state.anomaly ?? null;
}
