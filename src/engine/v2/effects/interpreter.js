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
    case 'handEmpty': {
      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
      return engine.state.players[p].hand.length === 0;
    }
    case 'deckNotEmpty': {
      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
      return engine.state.players[p].deck.length > 0;
    }
    case 'deckEmpty': {
      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
      return engine.state.players[p].deck.length === 0;
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
    if (resolved) {
      targets = [resolved];
    } else {
      // Pseudo targets (e.g. a bare location row chosen by Warding Rite) are
      // not resolvable by uid, so fall back to the selector enumeration.
      targets = selector
        ? enumerateTargets(engine, ctx, selector).filter((entry) => entry.uid === choice.targetUid)
        : [];
    }
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
    // An omitted choice is the explicit "decline" option when one exists.
    let effectiveChoice = choice;
    if (!effectiveChoice) {
      const skipEntry = legal.find((entry) => entry && isSkipMode(effectDef, entry.mode));
      if (!skipEntry) {
        throw new Error(`effect ${effectDef.id} requires a choice`);
      }
      effectiveChoice = { mode: skipEntry.mode, targetUid: null, secondaryUids: [] };
    }
    const chosen = effectDef.choices.find((entry) => entry.id === effectiveChoice.mode);
    if (!chosen) throw new Error(`unknown effect choice: ${effectiveChoice.mode}`);
    const match = legal.find((entry) => choiceEntryMatches(entry, effectiveChoice));
    if (!match) {
      throw new Error(`illegal effect choice for ${effectDef.id}: ${effectiveChoice.mode}`);
    }
    if (!evalCondition(engine, ctx, chosen.condition)) return;
    // Merge the player's concrete selection ({targetUid, secondaryUids, ...})
    // with the registry definition so operations can resolve the chosen
    // targets; the definition alone only carries selectors.
    const executionChoice = { ...chosen, ...effectiveChoice };
    for (const operation of chosen.operations ?? []) {
      runOperation(engine, ctx, effectDef, executionChoice, operation);
    }
    return;
  }

  for (const operation of effectDef.operations ?? []) {
    runOperation(engine, ctx, effectDef, null, operation);
  }
}

function isSkipMode(effectDef, mode) {
  return (effectDef.choices ?? []).some((entry) => entry.id === mode && entry.skip);
}

export function choiceEntryMatches(entry, choice) {
  if (!entry) return false;
  if (entry.mode !== choice?.mode) return false;
  if ((entry.targetUid ?? null) !== (choice?.targetUid ?? null)) return false;
  const a = [...(entry.secondaryUids ?? [])].sort();
  const b = [...(choice?.secondaryUids ?? [])].sort();
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  if ((entry.replaceWithUid ?? null) !== (choice?.replaceWithUid ?? null)) return false;
  return true;
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
      const key = operation.secondaryKey ?? operation.secondary?.key ?? 'secondaryUids';
      const raw = ctx.choice?.[key] ?? ctx.choice?.secondaryUids ?? [];
      const uids = Array.isArray(raw) ? raw : (raw ? [raw] : []);
      const limit = operation.max ?? uids.length;
      for (const uid of uids.slice(0, limit)) engine._moveAbyssToHand(ctx.controller, uid);
      return;
    }
    case 'moveDeckToHand': {
      const key = operation.secondaryKey ?? operation.cardKey ?? operation.secondary?.key ?? 'secondaryUids';
      const raw = ctx.choice?.[key] ?? ctx.choice?.secondaryUids ?? [];
      const uids = Array.isArray(raw) ? raw : (raw ? [raw] : []);
      const limit = operation.max ?? uids.length;
      for (const uid of uids.slice(0, limit)) engine._moveDeckToHand(ctx.controller, uid);
      return;
    }
    case 'revealDeckTop': {
      engine._revealDeckTop(ctx.controller, operation.count ?? 3);
      return;
    }
    case 'shuffleDeck': {
      engine._shuffleDeck(ctx.controller);
      return;
    }
    case 'addAura': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        engine._addAura({
          cardId: ctx.source?.cardId ?? null,
          sourceUid: ctx.source?.inst?.uid ?? null,
          sourcePlayer: ctx.controller,
          duration: operation.duration ?? 'thisNight',
          requiresSourceActive: !!operation.requiresSourceActive,
          scope: { ...(operation.scope ?? {}) },
          modifiers: { ...(operation.modifiers ?? {}) },
        }, target);
      }
      return;
    }
    case 'removeFromPlay': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        engine._removeFromPlay(target, operation.reason ?? 'effect');
      }
      return;
    }
    case 'destroy': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        engine._destroyTarget(target, operation.reason ?? 'destroy');
      }
      return;
    }
    case 'removeSeal': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        engine._removeSeal(target);
      }
      return;
    }
    case 'sealLeader': {
      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
        if (target.kind === 'leader') {
          engine._sealLeader(target.player, operation.duration ?? 'untilNextNight', ctx);
        }
      }
      return;
    }
    case 'devour': {
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
 * Every k-sized subset of `items`, in stable order.
 */
function combinations(items, k) {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const out = [];
  const walk = (start, chosen) => {
    if (chosen.length === k) {
      out.push(chosen.slice());
      return;
    }
    for (let i = start; i < items.length; i++) {
      chosen.push(items[i]);
      walk(i + 1, chosen);
      chosen.pop();
    }
  };
  walk(0, []);
  return out;
}

function secondarySelections(engine, ctx, secondary) {
  if (!secondary) return [[]];
  const selector = secondary.selector ?? {};
  const max = secondary.max ?? selector.count ?? 1;
  const candidates = enumerateCandidates(engine, ctx, { ...selector, count: undefined });
  const min = secondary.required === false ? 0 : Math.min(1, max);
  if (candidates.length < min) return [];
  const out = [];
  for (let size = min; size <= Math.min(max, candidates.length); size++) {
    for (const combo of combinations(candidates, size)) {
      out.push(combo);
    }
  }
  return out;
}

function replacementSelections(engine, ctx, replacements, primaryUid) {
  if (!replacements) return [null];
  const key = replacements.key ?? 'replaceWithUid';
  const candidates = engine._replacementCandidates
    ? engine._replacementCandidates(ctx.controller, primaryUid)
    : [];
  void key;
  return [null, ...candidates.map((inst) => inst.uid)];
}

/**
 * Enumerate every legal (mode, targetUid, secondaryUids, replaceWithUid) tuple
 * for a modal effect.  Returns `[]` for non-modal effects and `[null]` when
 * every mode fizzles (the card is still playable, it simply has no effect).
 *
 * `choice.skip` marks an optional "decline" mode; it is only offered while at
 * least one real mode is legal.  Otherwise the effect collapses to [null].
 */
export function enumerateEffectChoices(engine, ctx, effectDef) {
  if (!Array.isArray(effectDef.choices) || !effectDef.choices.length) return [];
  const out = [];
  const skips = [];

  for (const choice of effectDef.choices) {
    if (!evalCondition(engine, ctx, choice.condition)) continue;
    if (choice.skip) {
      skips.push(choice);
      continue;
    }

    let primaries;
    if (!choice.target) {
      primaries = [null];
    } else {
      const candidates = enumerateCandidates(engine, ctx, choice.target);
      if (choice.target.required === true) {
        if (!candidates.length) continue;
        primaries = candidates;
      } else {
        primaries = candidates.length ? candidates : [null];
      }
    }

    for (const primary of primaries) {
      const secondaries = secondarySelections(engine, ctx, choice.secondary);
      if (!secondaries.length) continue;
      const replacements = replacementSelections(
        engine,
        ctx,
        choice.replacements,
        primary?.uid ?? null,
      );
      for (const secondary of secondaries) {
        for (const replaceWithUid of replacements) {
          out.push({
            mode: choice.id,
            targetUid: primary?.uid ?? null,
            secondaryUids: secondary.map((entry) => entry.uid),
            replaceWithUid,
            label: choice.label ?? choice.id,
          });
        }
      }
    }
  }

  if (out.length) {
    for (const choice of skips) {
      out.push({
        mode: choice.id,
        targetUid: null,
        secondaryUids: [],
        replaceWithUid: null,
        label: choice.label ?? choice.id,
      });
    }
  }
  return out.length ? out : [null];
}

/** Non-modal effects never require a choice; modal ones validate it. */
export function requiresChoice(effectDef) {
  return Array.isArray(effectDef?.choices) && effectDef.choices.length > 0;
}

/**
 * Evaluate an effect-level `playCondition` (a condition that gates whether the
 * card can be played at all, e.g. Séance's mandatory sacrifice).  Conditions
 * on individual effects still only gate resolution.
 */
export function canPlayCard(engine, ctx, cardId) {
  const entries = effectsFor(cardId) ?? [];
  for (const effectDef of entries) {
    if (effectDef.trigger !== TRIGGER.ON_PLAY) continue;
    if (!effectDef.playCondition) continue;
    const context = makeContext(engine, ctx.controller, ctx.source, {
      trigger: TRIGGER.ON_PLAY,
      choice: ctx.choice,
      ...ctx.extra,
    });
    if (!evalCondition(engine, context, effectDef.playCondition)) return false;
  }
  return true;
}

export { TRIGGER, ZONE };
