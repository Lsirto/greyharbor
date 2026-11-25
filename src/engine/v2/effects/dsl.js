/**
 * Greyharbor v2.2 — structured effect DSL.
 *
 * Every card ability is plain data.  The interpreter (interpreter.js) is the
 * only place that knows how to walk the tree; card-specific code lives in the
 * registry as selectors / conditions / operations, never as imperative hooks.
 *
 * Shape
 * -----
 *   Effect = {
 *     id: string,
 *     trigger: Trigger,
 *     condition?: Condition,             // whole-effect guard
 *     target?: Selector,                 // convenience shorthand for targetKey
 *     targetKey?: string,                // named selector (default "targetUid")
 *     choices?: Choice[],                // modal effects ("二选一")
 *     operations: Operation[],
 *     duration?: Duration,
 *   }
 *
 *   Choice = {
 *     id: string,
 *     label?: string,
 *     condition?: Condition,
 *     target?: Selector,
 *     targetKey?: string,
 *     operations: Operation[],
 *   }
 *
 * Conditions are AND-ed.  Selectors describe which cards/players a primitive
 * may touch; the interpreter turns them into concrete targets.
 */

export const TRIGGER = Object.freeze({
  ON_PLAY: 'onPlay',
  ON_REVEAL: 'onReveal',
  ON_SACRIFICE: 'onSacrifice',
  ON_LEAVE: 'onLeave',
  NIGHT_START: 'nightStart',
  NIGHT_END: 'nightEnd',
  PASSIVE: 'passive',
  LEADER_ACTIVE: 'leaderActive',
});

export const DURATION = Object.freeze({
  INSTANT: 'instant',
  THIS_NIGHT: 'thisNight',
  UNTIL_NEXT_NIGHT: 'untilNextNight',
  PERMANENT: 'permanent',
});

export const SIDE = Object.freeze({
  OWN: 'own',
  ENEMY: 'enemy',
  ANY: 'any',
});

export const ZONE = Object.freeze({
  BOARD: 'board',
  ATTACHED: 'attached',
  LOCATION_SLOT: 'locationSlot',
  ENVIRONMENT: 'environment',
  DECK: 'deck',
  HAND: 'hand',
  ABYSS: 'abyss',
  DISCARD: 'discard',
  LEADER: 'leader',
});

/** Card types that occupy a normal unit slot. */
export const SLOT_TYPES = Object.freeze(['unit', 'oldgod']);

/** Types a generic "board card" selector may touch (Harold, Pike-like). */
export const BOARD_CARD_TYPES = Object.freeze([
  'unit',
  'oldgod',
  'equipment',
  'location',
  'environment',
]);

export function effect(trigger, operations, options = {}) {
  return { trigger, operations, ...options };
}

export function selector(options = {}) {
  return {
    side: SIDE.ENEMY,
    zone: ZONE.BOARD,
    face: 'up',
    count: 1,
    required: false,
    ...options,
  };
}

/** Normalise a small amount of authoring sugar before the interpreter sees it. */
export function normalizeEffect(effectDef) {
  if (!effectDef || typeof effectDef !== 'object') return null;
  const operations = Array.isArray(effectDef.operations) ? effectDef.operations.slice() : [];
  return {
    ...effectDef,
    operations,
  };
}
