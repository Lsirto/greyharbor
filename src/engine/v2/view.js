/**
 * v2.2 player-specific views.
 *
 * The authoritative state is never handed to UI/AI code.  viewFor(pov)
 * returns a fresh, plain-data object in which the opponent's hand, deck
 * order, face-down card identities, and private peeks are redacted.
 */

import {
  LOCATIONS,
  auraPowerBonus,
  currentUnitPower,
  printedPower,
  scorePlayer,
} from './scoring.js';
import { objectiveTypeForFaction } from './objectives.js';

function fullCardView(inst, card, {
  onBoard = false,
  location = null,
  slot = null,
  power = null,
  auraPower = null,
  cardIndex = null,
} = {}) {
  return {
    uid: inst.uid,
    cardId: inst.cardId,
    name: card?.name ?? inst.cardId,
    nameZh: card?.nameZh ?? null,
    faction: card?.faction ?? null,
    type: card?.type ?? null,
    cardLocation: card?.location ?? null,
    face: inst.face,
    faceDown: !!inst.faceDown,
    reasonPower: card?.reasonPower ?? null,
    madnessPower: card?.madnessPower ?? null,
    sanityCost: card?.sanityCost ?? 0,
    keywords: Array.isArray(card?.keywords) ? card.keywords.slice() : [],
    power: onBoard ? (power ?? 0) : printedPower(card, inst.face),
    ...(onBoard ? { boardLocation: location, slot } : {}),
    ...(onBoard
      ? {
        sealed: !!inst.sealed,
        corruption: inst.corruptionTokens?.length ?? 0,
        corruptionLoss: inst.corruptionLoss ?? 0,
        permanentPower: inst.permanentPower ?? 0,
        thisNightPower: inst.thisNightPower ?? 0,
        auraPower: auraPower ?? 0,
        chaos: inst.chaosToken
          ? { id: inst.chaosToken.id, modifier: inst.chaosToken.modifier }
          : null,
        equipment: inst.equipment
          ? fullCardView(inst.equipment, cardIndex?.[inst.equipment.cardId], { cardIndex })
          : null,
      }
      : {}),
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
  if (out.type === 'peek' && out.player !== pov) {
    // Arthur's shown card is public (§9.10); only private peeks are redacted.
    if (out.private !== false) {
      delete out.cardId;
      delete out.name;
      delete out.sourceUid;
    }
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
        return fullCardView(inst, cardIndex[inst.cardId], {
          onBoard: true,
          location,
          slot,
          power: currentUnitPower(state, p, inst, location, slot),
          auraPower: auraPowerBonus(state, p, inst, location, cardIndex[inst.cardId]),
          cardIndex,
        });
      });
    }

    const locations = {};
    for (const location of LOCATIONS) {
      const inst = player.locations[location];
      locations[location] = inst
        ? {
          ...fullCardView(inst, cardIndex[inst.cardId]),
          sealed: !!inst.sealed,
        }
        : null;
    }

    const leaderCard = player.leaderId ? cardIndex[player.leaderId] : null;

    return {
      id: p,
      name: player.name,
      faction: player.faction,
      leaderId: player.leaderId,
      leader: leaderCard
        ? {
          cardId: leaderCard.id,
          name: leaderCard.name,
          nameZh: leaderCard.nameZh,
          faction: leaderCard.faction,
          usedThisNight: player.leaderUsedThisNight,
          sealed: player.leaderSealed,
        }
        : null,
      sanity: player.sanity,
      objective: player.objective ?? 0,
      objectiveType: objectiveTypeForFaction(player.faction),
      objectiveThreshold: engine.config.objectiveThreshold,
      hand,
      handCount: player.hand.length,
      deckCount: player.deck.length,
      discard: player.discard.map((inst) => fullCardView(inst, cardIndex[inst.cardId])),
      abyss: player.abyss.map((inst) => fullCardView(inst, cardIndex[inst.cardId])),
      board,
      locations,
      flags: {
        cultSacrificeTriggered: !!player.flags?.cultSacrificeTriggered,
      },
      privateNotes: own ? structuredClone(player.privateNotes ?? []) : [],
      score: scorePlayer(state, p),
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
    environments: state.environments.map((inst) => ({
      ...fullCardView(inst, cardIndex[inst.cardId]),
      owner: inst.owner,
      sealed: !!inst.sealed,
    })),
    pending: engine.pending,
    players,
    anomaly: state.anomaly ? { ...state.anomaly } : null,
    scores: players.map((p) => p.score.total),
    events: state.events.map((event) => sanitizeEvent(event, viewer)),
    // A spectator must never receive action lists: mulligan actions contain
    // hand uids, and play actions contain the current player's card ids.
    actions: viewer === null ? [] : engine.getActions(viewer),
  };
}
