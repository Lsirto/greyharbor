/**
 * Structured-effect interpreter.
 *
 * The interpreter knows the *meaning* of the DSL; card data only supplies
 * selectors/conditions/operations.  Engine primitives (sacrifice, seal,
 * corruption, deck-play, peek) live on EngineV2 and are called here.
 */

import { SIDE, TRIGGER, ZONE } from './dsl.js';
import { effectsFor } from './registry.js';
import { enumerateCandidates, enumerateTargets, resolveTargetByUid } from './targets.js';

export function makeContext(engine, controller, source = {}, extra = {}) {
  return {
    engine,
    state: engine.state,
    controller,
    source,
    choice: extra.choice ?? null,
    trigger: extra.trigger ?? null,
    selected: Object.create(null),
    ...extra,
  };
}

export function evalCondition(engine, ctx, condition) {
  if (!condition) return true;
  const kind = condition.kind ?? condition.type;
  switch (kind) {
    case 'all':
      return (condition.conditions ?? []).every((entry) => evalCondition(engine, ctx, entry));
    case 'any':
      return (condition.conditions ?? []).some((entry) => evalCondition(engine, ctx, entry));
    case 'not':
      return !evalCondition(engine, ctx, condition.condition);
    case 'handNotEmpty': {
      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
      return engine.state.players[p].hand.length > 0;
    }
    case 'deckHasAberration': {
      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
      return engine.state.players[p].deck.some((inst) => engine._isAberration(inst.cardId));
    }
    case 'hasSacrificeTarget': {
      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
      return engine._sacrificeTargets(p).length > 0;
    }
    case 'exists':
      return enumerateTargets(engine, ctx, condition.selector).length > 0;
    case 'none':
      return enumerateTargets(engine, ctx, condition.selector).length === 0;
    case 'sanityAtMost': {
      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
      return engine.state.players[p].sanity <= condition.value;
    }
    case 'sanityAtLeast': {
      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
      return engine.state.players[p].sanity >= condition.value;
    }
    default:
      throw new Error(`unknown effect condition: ${kind}`);
  }
}

function targetKeyFor(effect) {
  return effect.targetKey ?? 'targetUid';
}

function choiceKeyFor(choice) {
  return choice.targetKey ?? 'targetUid';
}

function getSelected(engine, ctx, key, selector, choice) {
  if (ctx.selected[key]) return ctx.selected[key];

  const choiceMatches =
    choice
    && choiceKeyFor(choice) === key
    && (choice.targetUid !== undefined && choice.targetUid !== null);

  let targets;
  if (choiceMatches) {
    const resolved = resolveTargetByUid(engine, choice.targetUid);
    targets = resolved ? [resolved] : [];
  } else if (selector) {
    targets = enumerateTargets(engine, ctx, selector);
  } else {
    targets = [];
  }
  ctx.selected[key] = targets;
  return targets;
}

function operationTargets(engine, ctx, effect, choice, operation) {
  if (operation.targets) return operation.targets;
  if (operation.selector) {
    return enumerateTargets(engine, ctx, operation.selector);
  }
  const key = operation.targetKey ?? targetKeyFor(choice ?? effect);
  const selector =
    operation.selector
    ?? (choice && choiceKeyFor(choice) === key ? choice.target ?? effect.target : effect.target);
  return getSelected(engine, ctx, key, selector, choice);
}

/** Run every registry effect for a trigger on one source card. */
export function runTrigger(engine, ctx, trigger, extra = {}) {
  const entries = effectsFor(ctx.source?.cardId) ?? [];
  for (const effectDef of entries) {
    if (effectDef.trigger !== trigger) continue;
    runEffect(engine, ctx, effectDef, extra);
  }
}

export function runEffect(engine, ctx, effectDef, extra = {}) {
  if (!evalCondition(engine, ctx, effectDef.condition)) return;

  if (Array.isArray(effectDef.choices) && effectDef.choices.length) {
    const choice = ctx.choice;
    const legal = enumerateEffectChoices(engine, ctx, effectDef);
    if (legal.length === 1 && legal[0] === null) {
      if (!choice) return;
      throw new Error(`illegal effect choice for ${effectDef.id}: no legal mode`);
    }
    const legalMode = choice?.mode ?? null;
    const match = legal.find((entry) => entry && entry.mode === legalMode
      && (entry.targetUid ?? null) === (choice?.targetUid ?? null));
    if (!match) {
      throw new Error(`illegal effect choice for ${effectDef.id}: ${legalMode}`);
    }
    const chosen = effectDef.choices.find((entry) => entry.id === legalMode);
    if (!chosen) throw new Error(`unknown effect choice: ${legalMode}`);
    if (!evalCondition(engine, ctx, chosen.condition)) return;
    // Merge the player's concrete selection ({targetUid, ...}) with the
    // registry definition so operations can resolve the chosen target; the
    // definition alone only carries the selector, not the picked uid.
    const executionChoice = { ...chosen, ...ctx.choice };
    for (const operation of chosen.operations ?? []) {
      runOperation(engine, ctx, effectDef, executionChoice, operation);
    }
    return;
  }

  for (const operation of effectDef.operations ?? []) {
    runOperation(engine, ctx, effectDef, null, operation);
  }
}

function runOperation(engine, ctx, effectDef, choice, operation) {
  switch (operation.op) {
    case 'noop':
      return;
    case 'sanity': {
      let p = ctx.controller;
      if (operation.who === 'self') p = ctx.controller;
      else if (operation.who === 'opponent') p = 1 - ctx.controller;
      else if (operation.who === 'target') {
        const targets = operationTargets(engine, ctx, effectDef, choice, operation);
        p = targets[0]?.player ?? ctx.controller;
      }
      engine._changeSanity(p, operation.delta, operation.reason ?? 'effect');
      return;
    }
    case 'seal': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        engine._sealTarget(target, operation.duration, ctx);
      }
      return;
    }
    case 'corrupt': {
      const targets = operationTargets(engine, ctx, effectDef, choice, operation);
      for (const target of targets) {
        engine._applyCorruption(ctx.controller, target, operation.amount ?? 1, ctx);
      }
      return;
    }
    case 'removeCorruption': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        engine._removeCorruption(target, operation.amount ?? 1);
      }
      return;
    }
    case 'peekHand': {
      engine._peekRandomHandCard(ctx.controller, operation.side ?? SIDE.ENEMY, {
        source: ctx.source,
        private: operation.private !== false,
      });
      return;
    }
    case 'sacrifice': {
      const targets = operationTargets(engine, ctx, effectDef, choice, operation);
      const target = targets[0];
      if (!target) return;
      const replacementUid = ctx.choice?.[operation.replacementKey ?? 'replaceWithUid'] ?? null;
      engine._sacrificeUnit(ctx.controller, target.uid, {
        replacementUid,
        sourceUid: ctx.source?.inst?.uid ?? null,
        allowReplacement: true,
      });
      return;
    }
    case 'playFromDeck': {
      const cardKey = operation.cardKey ?? 'cardUid';
      const placementKey = operation.placementKey ?? 'placement';
      const cardUid = ctx.choice?.[cardKey] ?? null;
      const placement = ctx.choice?.[placementKey] ?? null;
      if (!cardUid || !placement) return;
      engine._playCardFromDeck(ctx.controller, cardUid, placement, {
        faceUp: operation.faceUp !== false,
        paySanityCost: !!operation.paySanityCost,
        source: ctx.source,
      });
      return;
    }
    case 'draw': {
      engine._draw(ctx.controller, operation.count ?? 1);
      return;
    }
    case 'reveal': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        engine._revealByUid(target.uid, 'effect');
      }
      return;
    }
    case 'discard': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        engine._discardFromZone(target.player, target.uid, 'effect');
      }
      return;
    }
    case 'buffPermanent':
    case 'buffThisNight': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        if (target.inst) {
          if (operation.op === 'buffPermanent') {
            target.inst.permanentPower = (target.inst.permanentPower ?? 0) + (operation.amount ?? 0);
          } else {
            target.inst.thisNightPower = (target.inst.thisNightPower ?? 0) + (operation.amount ?? 0);
          }
        }
      }
      engine._emit({
        type: 'buff',
        player: ctx.controller,
        targetUid: operationTargets(engine, ctx, effectDef, choice, operation).map((t) => t.uid),
        amount: operation.amount ?? 0,
        duration: operation.op === 'buffPermanent' ? 'permanent' : 'thisNight',
      });
      return;
    }
    case 'moveAbyssToHand': {
      const targets = operationTargets(engine, ctx, effectDef, choice, operation);
      for (const target of targets) engine._moveAbyssToHand(target.player, target.uid);
      return;
    }
    case 'devour': {
      // Extension point for Bell-Claw (phase 2.2b): a devour is a sacrifice
      // plus a permanent power transfer.  No v1 pilot uses it yet.
      const targets = operationTargets(engine, ctx, effectDef, choice, operation);
      const target = targets[0];
      if (!target) return;
      engine._devour(ctx.controller, target.uid, {
        sourceUid: ctx.source?.inst?.uid ?? null,
      });
      return;
    }
    default:
      throw new Error(`unknown effect operation: ${operation.op}`);
  }
}

/**
 * Enumerate every legal (mode, targetUid) pair for a modal effect.
 * Returns `[]` for non-modal effects and `[null]` when every mode fizzles
 * (the card is still playable, it simply has no effect).
 */
export function enumerateEffectChoices(engine, ctx, effectDef) {
  if (!Array.isArray(effectDef.choices) || !effectDef.choices.length) return [];
  const out = [];
  for (const choice of effectDef.choices) {
    if (!evalCondition(engine, ctx, choice.condition)) continue;
    const key = choiceKeyFor(choice);
    const selector = choice.target;
    if (!selector) {
      out.push({ mode: choice.id, targetUid: null, label: choice.label ?? choice.id });
      continue;
    }
    if (selector.required !== false && selector.required === true) {
      const targets = enumerateCandidates(engine, ctx, selector);
      if (!targets.length) continue;
      for (const target of targets) {
        out.push({ mode: choice.id, targetUid: target.uid, label: choice.label ?? choice.id });
      }
    } else {
      const targets = enumerateCandidates(engine, ctx, selector);
      if (!targets.length) {
        out.push({ mode: choice.id, targetUid: null, label: choice.label ?? choice.id });
      } else {
        for (const target of targets) {
          out.push({ mode: choice.id, targetUid: target.uid, label: choice.label ?? choice.id });
        }
      }
    }
    void key;
  }
  return out.length ? out : [null];
}

/** Non-modal effects never require a choice; modal ones validate it. */
export function requiresChoice(effectDef) {
  return Array.isArray(effectDef?.choices) && effectDef.choices.length > 0;
}

export { TRIGGER, ZONE };
