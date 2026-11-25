/**
 * Selector → concrete target list.
 *
 * A target is a small plain object so the same selector can address units,
 * attached equipment, location-slot cards and environments:
 *
 *   { kind: 'unit'|'attached'|'location'|'environment'|'leader'|'deck'|'hand'|'abyss',
 *     uid, inst, player, location?, slot? }
 */

import {
  LOCATIONS,
  canReceiveCorruption,
  currentUnitPower,
  findUnit,
  isCorruptionImmune,
  isSealImmune,
} from '../scoring.js';
import { SIDE, ZONE } from './dsl.js';

function playersForSide(controller, side) {
  if (side === SIDE.OWN) return [controller];
  if (side === SIDE.ENEMY) return [1 - controller];
  return [controller, 1 - controller];
}

function matchesType(card, types) {
  if (!types || !types.length) return true;
  return !!card && types.includes(card.type);
}

function faceMatches(inst, face) {
  if (face === 'any' || !face) return true;
  if (face === 'up') return !inst.faceDown;
  return !!inst.faceDown;
}

function locationMatches(selector, ctx, location) {
  if (!selector.location) return true;
  if (selector.location === 'sameAsSource') return location === ctx.source?.location;
  if (selector.location === 'any') return true;
  return location === selector.location;
}

function unitTarget(inst, player, location, slot) {
  return { kind: 'unit', uid: inst.uid, inst, player, location, slot };
}

function enumerateUnits(engine, ctx, selector) {
  const { state } = ctx;
  const out = [];
  for (const p of playersForSide(ctx.controller, selector.side)) {
    for (const location of LOCATIONS) {
      if (!locationMatches(selector, ctx, location)) continue;
      const row = state.players[p].board[location];
      for (let slot = 0; slot < row.length; slot++) {
        const inst = row[slot];
        if (!inst) continue;
        const card = state.cardIndex?.[inst.cardId];
        if (!matchesType(card, selector.types)) continue;
        if (!faceMatches(inst, selector.face)) continue;
        if (selector.excludeSelf && inst.uid === ctx.source?.inst?.uid) continue;
        if (selector.excludeSource && inst.uid === ctx.source?.inst?.uid) continue;
        if (selector.excludeUids?.includes(inst.uid)) continue;
        if (selector.cardId && inst.cardId !== selector.cardId) continue;
        if (selector.sealed !== undefined && !!inst.sealed !== selector.sealed) continue;
        if (selector.faceDown !== undefined && !!inst.faceDown !== selector.faceDown) continue;
        if (selector.adjacentToSource) {
          const sourceLocation = ctx.source?.location;
          const sourceSlot = ctx.source?.slot;
          if (!sourceLocation || sourceLocation !== location) continue;
          if (!Number.isInteger(sourceSlot)) continue;
          if (Math.abs(sourceSlot - slot) !== 1) continue;
        }
        if (selector.hasCorruption && !(inst.corruptionTokens?.length > 0)) continue;
        if (selector.canReceiveCorruption && !canReceiveCorruption(state, p, inst, location)) continue;
        if (selector.corruptionImmune === true && !isCorruptionImmune(state, p, inst, location)) continue;
        if (selector.corruptionImmune === false && isCorruptionImmune(state, p, inst, location)) continue;
        if (selector.sealable && isSealImmune(state, p, inst, location)) continue;

        const power = currentUnitPower(state, p, inst, location, slot);
        if (selector.maxCurrentPower !== undefined && power > selector.maxCurrentPower) continue;
        if (selector.minCurrentPower !== undefined && power < selector.minCurrentPower) continue;

        out.push({ ...unitTarget(inst, p, location, slot), power });
      }
    }
  }
  return out;
}

function enumerateAttached(engine, ctx, selector) {
  const { state } = ctx;
  const out = [];
  for (const p of playersForSide(ctx.controller, selector.side)) {
    for (const location of LOCATIONS) {
      if (!locationMatches(selector, ctx, location)) continue;
      const row = state.players[p].board[location];
      for (let slot = 0; slot < row.length; slot++) {
        const host = row[slot];
        const equipment = host?.equipment;
        if (!equipment) continue;
        const card = state.cardIndex?.[equipment.cardId];
        if (!matchesType(card, selector.types)) continue;
        if (selector.sealed !== undefined && !!equipment.sealed !== selector.sealed) continue;
        if (selector.sealable && isSealImmune(state, p, equipment, location)) continue;
        if (selector.excludeUids?.includes(equipment.uid)) continue;
        if (selector.cardId && equipment.cardId !== selector.cardId) continue;
        out.push({
          kind: 'attached',
          uid: equipment.uid,
          inst: equipment,
          player: p,
          location,
          slot,
          host,
          power: 0,
        });
      }
    }
  }
  return out;
}

function enumerateLocationSlots(engine, ctx, selector) {
  const { state } = ctx;
  const out = [];
  for (const p of playersForSide(ctx.controller, selector.side)) {
    for (const location of LOCATIONS) {
      if (!locationMatches(selector, ctx, location)) continue;
      const inst = state.players[p].locations?.[location];
      if (!inst) continue;
      const card = state.cardIndex?.[inst.cardId];
      if (!matchesType(card, selector.types)) continue;
      if (selector.sealed !== undefined && !!inst.sealed !== selector.sealed) continue;
      if (selector.sealable && isSealImmune(state, p, inst, location)) continue;
      if (selector.excludeUids?.includes(inst.uid)) continue;
      if (selector.cardId && inst.cardId !== selector.cardId) continue;
      out.push({
        kind: 'location',
        uid: inst.uid,
        inst,
        player: p,
        location,
        power: 0,
      });
    }
  }
  return out;
}

/** A bare row (location) target, whether or not a location card is present. */
function enumerateLocationRows(engine, ctx, selector) {
  void engine;
  const out = [];
  for (const p of playersForSide(ctx.controller, selector.side)) {
    for (const location of LOCATIONS) {
      if (!locationMatches(selector, ctx, location)) continue;
      if (selector.excludeLocations?.includes(location)) continue;
      out.push({
        kind: 'locationRow',
        uid: `p${p}-${location}`,
        inst: null,
        player: p,
        location,
        power: 0,
      });
    }
  }
  return out;
}

function enumerateEnvironments(engine, ctx, selector) {
  const { state } = ctx;
  const out = [];
  for (const inst of state.environments ?? []) {
    const p = inst.owner;
    if (selector.side === SIDE.OWN && p !== ctx.controller) continue;
    if (selector.side === SIDE.ENEMY && p === ctx.controller) continue;
    const card = state.cardIndex?.[inst.cardId];
    if (!matchesType(card, selector.types)) continue;
    if (selector.sealed !== undefined && !!inst.sealed !== selector.sealed) continue;
    if (selector.sealable && isSealImmune(state, p, inst, null)) continue;
    if (selector.excludeUids?.includes(inst.uid)) continue;
    if (selector.cardId && inst.cardId !== selector.cardId) continue;
    out.push({ kind: 'environment', uid: inst.uid, inst, player: p, location: null, power: 0 });
  }
  return out;
}

function enumerateCards(engine, ctx, selector, zone) {
  const { state } = ctx;
  const out = [];
  for (const p of playersForSide(ctx.controller, selector.side)) {
    const pile =
      zone === ZONE.DECK
        ? state.players[p].deck
        : zone === ZONE.HAND
          ? state.players[p].hand
          : zone === ZONE.ABYSS
            ? state.players[p].abyss ?? []
            : state.players[p].discard;
    const ordered = zone === ZONE.DECK && selector.topN
      ? pile.slice(0, selector.topN)
      : pile;
    for (const inst of ordered) {
      const card = state.cardIndex?.[inst.cardId];
      if (!matchesType(card, selector.types)) continue;
      if (selector.cardId && inst.cardId !== selector.cardId) continue;
      if (selector.cardIds && !selector.cardIds.includes(inst.cardId)) continue;
      if (selector.excludeUids?.includes(inst.uid)) continue;
      if (selector.filter === 'aberration' && !isAberration(engine, inst.cardId)) continue;
      out.push({ kind: zone, uid: inst.uid, inst, player: p, cardId: inst.cardId, power: 0 });
    }
  }
  return out;
}

function isAberration(engine, cardId) {
  const card = engine.cardIndex?.[cardId];
  return !!card && (
    (card.faction === 'cult' && card.type === 'unit')
    || (card.faction === 'neutral' && card.type === 'oldgod')
  );
}

/**
 * Enumerate every candidate a *player choice* may select.
 *
 * `count` describes how many cards an effect finally touches, not how many
 * options a chooser sees.  A modal card such as Pike must offer every legal
 * target, so choice enumeration ignores the `count` truncation while keeping
 * every other filter (power limits, corruption, face, ...).
 */
export function enumerateCandidates(engine, ctx, selector) {
  return enumerateTargets(engine, ctx, { ...selector, count: undefined });
}

export function enumerateTargets(engine, ctx, selector) {
  const zones = selector.zones ?? [selector.zone ?? ZONE.BOARD];
  let targets = [];

  for (const zone of zones) {
    if (zone === ZONE.BOARD) targets.push(...enumerateUnits(engine, ctx, selector));
    else if (zone === ZONE.ATTACHED) targets.push(...enumerateAttached(engine, ctx, selector));
    else if (zone === ZONE.LOCATION_SLOT) targets.push(...enumerateLocationSlots(engine, ctx, selector));
    else if (zone === ZONE.LOCATION_ROW) targets.push(...enumerateLocationRows(engine, ctx, selector));
    else if (zone === ZONE.ENVIRONMENT) targets.push(...enumerateEnvironments(engine, ctx, selector));
    else if (zone === ZONE.DECK || zone === ZONE.HAND || zone === ZONE.ABYSS || zone === ZONE.DISCARD) {
      targets.push(...enumerateCards(engine, ctx, selector, zone));
    } else if (zone === ZONE.LEADER) {
      // v1: leaders are only targetable by effects that explicitly say so.
      for (const p of playersForSide(ctx.controller, selector.side)) {
        if (stateLeaderId(engine.state, p)) {
          targets.push({ kind: 'leader', uid: `leader-p${p}`, player: p, inst: null, power: 0 });
        }
      }
    }
  }

  if (selector.distinctCardId) {
    const seen = new Set();
    targets = targets.filter((target) => {
      const key = target.cardId ?? target.inst?.cardId ?? target.uid;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (selector.highestCurrentPower) {
    const max = targets.reduce((best, target) => Math.max(best, target.power ?? 0), -Infinity);
    targets = targets.filter((target) => (target.power ?? 0) === max);
  }
  if (selector.lowestCurrentPower) {
    const min = targets.reduce((best, target) => Math.min(best, target.power ?? 0), Infinity);
    targets = targets.filter((target) => (target.power ?? 0) === min);
  }

  if (selector.count !== undefined && selector.count !== 'all') {
    targets = targets.slice(0, selector.count);
  }
  return targets;
}

function stateLeaderId(state, p) {
  return state.players[p]?.leaderId ?? null;
}

/** Locate a target uid in any zone (used by action validation). */
export function resolveTargetByUid(engine, uid) {
  const { state } = engine;
  for (const p of [0, 1]) {
    const found = findUnit(state, p, uid);
    if (found) {
      return {
        kind: 'unit',
        uid,
        inst: found.inst,
        player: p,
        location: found.location,
        slot: found.slot,
      };
    }
    for (const location of LOCATIONS) {
      const row = state.players[p].board[location];
      for (let slot = 0; slot < row.length; slot++) {
        const host = row[slot];
        if (host?.equipment?.uid === uid) {
          return {
            kind: 'attached',
            uid,
            inst: host.equipment,
            player: p,
            location,
            slot,
            host,
          };
        }
      }
      const locationCard = state.players[p].locations?.[location];
      if (locationCard?.uid === uid) {
        return { kind: 'location', uid, inst: locationCard, player: p, location };
      }
    }
    for (const inst of state.environments ?? []) {
      if (inst.uid === uid) {
        return { kind: 'environment', uid, inst, player: inst.owner, location: null };
      }
    }
    for (const zone of ['hand', 'deck', 'discard', 'abyss']) {
      const inst = (state.players[p][zone] ?? []).find((entry) => entry.uid === uid);
      if (inst) return { kind: zone, uid, inst, player: p, cardId: inst.cardId };
    }
  }
  return null;
}
