/**
 * v2.1 player-specific views.
 *
 * The authoritative state is never handed to UI/AI code.  viewFor(pov)
 * returns a fresh, plain-data object in which the opponent's hand, deck
 * order, and face-down card identities are redacted.
 */

import {
  LOCATIONS,
  printedPower,
  scorePlayer,
  unitPower,
} from './scoring.js';

function fullCardView(inst, card, { onBoard = false, location = null, slot = null } = {}) {
  return {
    uid: inst.uid,
    cardId: inst.cardId,
    name: card?.name ?? inst.cardId,
    faction: card?.faction ?? null,
    type: card?.type ?? null,
    cardLocation: card?.location ?? null,
    face: inst.face,
    faceDown: !!inst.faceDown,
    reasonPower: card?.reasonPower ?? null,
    madnessPower: card?.madnessPower ?? null,
    sanityCost: card?.sanityCost ?? 0,
    keywords: Array.isArray(card?.keywords) ? card.keywords.slice() : [],
    power: onBoard ? unitPower(inst, card) : printedPower(card, inst.face),
    ...(onBoard ? { boardLocation: location, slot } : {}),
  };
}

function hiddenCardView(inst, location, slot) {
  return {
    uid: inst.uid,
    faceDown: true,
    hidden: true,
    power: 0,
    boardLocation: location,
    slot,
  };
}

function sanitizeEvent(event, pov) {
  const out = { ...event };
  if (out.type === 'mulligan' && out.player !== pov) {
    delete out.uids;
    delete out.count;
  }
  if (out.type === 'play' && out.faceDown && out.player !== pov) {
    delete out.cardId;
    delete out.name;
    delete out.face;
  }
  return out;
}

export function buildView(engine, pov) {
  const state = engine.state;
  const cardIndex = engine.cardIndex;
  const viewer = pov === 0 || pov === 1 ? pov : null;

  const players = state.players.map((player, p) => {
    const own = viewer === p;
    const hand = own
      ? player.hand.map((inst) => fullCardView(inst, cardIndex[inst.cardId]))
      : [];

    const board = {};
    for (const location of LOCATIONS) {
      board[location] = player.board[location].map((inst, slot) => {
        if (!inst) return null;
        if (inst.faceDown && !own) return hiddenCardView(inst, location, slot);
        return fullCardView(inst, cardIndex[inst.cardId], { onBoard: true, location, slot });
      });
    }

    return {
      id: p,
      name: player.name,
      leaderId: player.leaderId,
      sanity: player.sanity,
      hand,
      handCount: player.hand.length,
      deckCount: player.deck.length,
      discard: player.discard.map((inst) => fullCardView(inst, cardIndex[inst.cardId])),
      board,
      score: scorePlayer(state, p, cardIndex),
      nightWins: state.nightWins[p],
    };
  });

  return {
    version: state.version,
    phase: state.phase,
    night: state.night,
    maxNights: state.maxNights,
    firstPlayer: state.firstPlayer,
    current: state.current,
    passed: state.passed.slice(),
    mulliganDone: state.mulliganDone.slice(),
    nightWins: state.nightWins.slice(),
    history: state.history.map((entry) => structuredClone(entry)),
    result: state.result ? structuredClone(state.result) : null,
    pending: engine.pending,
    players,
    scores: players.map((p) => p.score.total),
    events: state.events.map((event) => sanitizeEvent(event, viewer)),
    // A spectator must never receive action lists: mulligan actions contain
    // hand uids, and play actions contain the current player's card ids.
    actions: viewer === null ? [] : engine.getActions(viewer),
  };
}
