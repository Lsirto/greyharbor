/**
 * src/deck/editor.mjs — pure deck-building logic.
 *
 * Data-driven, no DOM, no per-card-id branches. The editor holds a faction,
 * one of that faction's leaders and a count map of non-leader cards. Eligibility
 * and caps reuse the same DECK_RULES as deck-validation, and the assembled
 * deck is checked with the shared validateDeck before it can be played.
 */

import { CARDS, CARD_LIST } from '../engine/v2/cards.js';
import { DECK_RULES, validateDeck } from '../engine/v2/deck-validation.js';

const NEUTRAL = DECK_RULES.neutralFaction;

function firstLeader(faction) {
  const leader = CARD_LIST.find((card) => card.type === DECK_RULES.leaderType && card.faction === faction);
  return leader ? leader.id : null;
}

/** Eligible non-leader cards for a faction (faction + neutral). */
export function poolFor(faction) {
  return Object.freeze(
    CARD_LIST.filter(
      (card) => card.type !== DECK_RULES.leaderType
        && (card.faction === faction || card.faction === NEUTRAL),
    ),
  );
}

export function leadersFor(faction) {
  return Object.freeze(
    CARD_LIST.filter((card) => card.type === DECK_RULES.leaderType && card.faction === faction),
  );
}

export function createEditor(options = {}) {
  const faction = DECK_RULES.factions.includes(options.faction) ? options.faction : 'society';
  return {
    faction,
    leader: firstLeader(faction),
    counts: {},
  };
}

export function totalCount(editor) {
  return Object.values(editor.counts).reduce((sum, count) => sum + count, 0);
}

export function copiesOf(editor, id) {
  return editor.counts[id] ?? 0;
}

function isEligible(editor, card) {
  return card && card.type !== DECK_RULES.leaderType
    && (card.faction === editor.faction || card.faction === NEUTRAL);
}

export function addCard(editor, id) {
  const card = CARDS[id];
  if (!isEligible(editor, card)) return { ok: false, reason: 'invalid' };
  const current = copiesOf(editor, id);
  if (current >= DECK_RULES.maxCopies) return { ok: false, reason: 'copy-cap' };
  if (totalCount(editor) >= DECK_RULES.nonLeaderCount) return { ok: false, reason: 'full' };
  editor.counts[id] = current + 1;
  return { ok: true };
}

export function removeCard(editor, id) {
  const current = copiesOf(editor, id);
  if (!current) return { ok: false, reason: 'empty' };
  if (current <= 1) delete editor.counts[id];
  else editor.counts[id] = current - 1;
  return { ok: true };
}

export function setLeader(editor, leaderId) {
  const card = CARDS[leaderId];
  if (!card || card.type !== DECK_RULES.leaderType || card.faction !== editor.faction) {
    return { ok: false, reason: 'invalid' };
  }
  editor.leader = leaderId;
  return { ok: true };
}

/**
 * Replace the non-leader count map with a recommended preset's cards.
 * The chosen leader is left untouched so the player keeps their character.
 */
export function loadPreset(editor, preset) {
  if (!preset || typeof preset !== 'object' || !Array.isArray(preset.cards)) {
    return { ok: false, reason: 'invalid' };
  }
  if (preset.faction !== editor.faction) return { ok: false, reason: 'faction' };
  const counts = {};
  for (const id of preset.cards) {
    if (!isEligible(editor, CARDS[id])) return { ok: false, reason: 'invalid' };
    counts[id] = (counts[id] ?? 0) + 1;
    if (counts[id] > DECK_RULES.maxCopies) return { ok: false, reason: 'copy-cap' };
  }
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total !== DECK_RULES.nonLeaderCount) return { ok: false, reason: 'count' };
  editor.counts = counts;
  return { ok: true };
}

export function setFaction(editor, faction) {
  if (!DECK_RULES.factions.includes(faction)) return { ok: false, reason: 'invalid' };
  editor.faction = faction;
  editor.counts = {};
  editor.leader = firstLeader(faction);
  return { ok: true };
}

/** Expand the count map into the createGame deck spec. */
export function toDeckSpec(editor) {
  const cards = [];
  for (const [id, count] of Object.entries(editor.counts)) {
    for (let i = 0; i < count; i += 1) cards.push(id);
  }
  return { faction: editor.faction, leader: editor.leader, cards };
}

export function validateEditor(editor) {
  return validateDeck(toDeckSpec(editor), CARDS);
}

/** Count of cards per type (for the editor stats panel). */
export function typeBreakdown(editor) {
  const out = {};
  for (const [id, count] of Object.entries(editor.counts)) {
    const type = CARDS[id]?.type ?? 'unknown';
    out[type] = (out[type] ?? 0) + count;
  }
  return out;
}
