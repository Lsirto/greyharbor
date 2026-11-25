/**
 * src/ai/v2/evaluate.mjs — view-only 1-ply 启发式评估。
 *
 * 输入只有 buildView(pov) 产生的对象；所有候选动作都来自 view.actions。
 * 本模块不 import 任何引擎模块（只通过 config.mjs 间接持有常量）。
 */

import { CONFIG } from './config.mjs';

const LOCATIONS = ['scene', 'archive', 'dream'];

const hasKeyword = (card, keyword) =>
  Array.isArray(card?.keywords) && card.keywords.includes(keyword);

/** 与 scoring.printedPower 同口径，但只使用 view 里的公开字段。 */
function printedForView(card) {
  const face = card?.face === 'madness' ? 'madness' : 'reason';
  const base = face === 'madness'
    ? (card?.madnessPower ?? card?.reasonPower ?? 0)
    : (card?.reasonPower ?? card?.madnessPower ?? 0);
  const bonus = face === 'madness' ? (CONFIG.power.madnessBonus[card?.cardId] ?? 0) : 0;
  return base + bonus;
}

function cloneBoard(view, player) {
  const board = {};
  for (const location of LOCATIONS) {
    board[location] = (view.players[player]?.board?.[location] ?? []).map((unit, slot) => {
      if (!unit) return null;
      return {
        uid: unit.uid,
        cardId: unit.cardId ?? null,
        face: unit.face ?? 'reason',
        faceDown: !!unit.faceDown,
        sealed: !!unit.sealed,
        keywords: Array.isArray(unit.keywords) ? unit.keywords.slice() : [],
        power: unit.power ?? 0,
        corruptionLoss: unit.corruptionLoss ?? 0,
        permanentPower: unit.permanentPower ?? 0,
        thisNightPower: unit.thisNightPower ?? 0,
        equipment: unit.equipment
          ? { cardId: unit.equipment.cardId ?? null, sealed: !!unit.equipment.sealed }
          : null,
        location,
        slot,
        // 引擎已算好战力的正面单位不需要重算；盖牌/新放置单位需要估算。
        raw: !!unit.faceDown,
      };
    });
  }
  return board;
}

function clonePosition(pos) {
  const cloneBoardCopy = (board) => {
    const out = {};
    for (const location of LOCATIONS) {
      out[location] = board[location].map((unit) => (unit ? { ...unit, keywords: unit.keywords.slice() } : null));
    }
    return out;
  };
  return {
    ...pos,
    myBoard: cloneBoardCopy(pos.myBoard),
    oppBoard: cloneBoardCopy(pos.oppBoard),
  };
}

function findBoardUnit(board, uid) {
  if (!uid) return null;
  for (const location of LOCATIONS) {
    for (const unit of board[location]) {
      if (unit && unit.uid === uid) return { unit, location };
    }
  }
  return null;
}

/** Active anomaly's power modifier at a location (0 when none applies). */
function anomalyPowerAt(anomaly, location) {
  return anomaly && anomaly.location === location ? (anomaly.power ?? 0) : 0;
}

function findViewUnit(view, player, uid) {
  if (!uid) return null;
  for (const location of LOCATIONS) {
    const row = view.players[player]?.board?.[location] ?? [];
    for (const unit of row) {
      if (unit && unit.uid === uid) return unit;
    }
  }
  return null;
}

function chainBonus(unit, board) {
  if (!hasKeyword(unit, 'chain') || unit.sealed) return 0;
  if (unit.cardId === 'edith-barrow') {
    return (board.archive.filter(Boolean).length - 1) * CONFIG.locations.chainWeight;
  }
  const cap = CONFIG.power.chainCap[unit.cardId] ?? 0;
  let neighbours = 0;
  const row = board[unit.location] ?? [];
  for (const slot of [unit.slot - 1, unit.slot + 1]) {
    if (row[slot]) neighbours += 1;
  }
  return Math.min(cap, neighbours) * CONFIG.locations.chainWeight;
}

function conditionalBonus(unit, otherBoard) {
  if (unit.cardId !== 'thousand-eyes' || unit.sealed) return 0;
  let visibleStealth = 0;
  for (const location of LOCATIONS) {
    for (const other of otherBoard[location]) {
      if (other && !other.faceDown && !other.sealed && hasKeyword(other, 'stealth')) visibleStealth += 1;
    }
  }
  return visibleStealth * CONFIG.locations.conditionalStealthBonus;
}

/** 单个单位的投影战力；正面且非 raw 时直接信任引擎给的数值。 */
function estimateUnitPower(unit, board, otherBoard, anomaly = null) {
  if (!unit) return 0;
  if (!unit.faceDown && !unit.raw) return Math.max(0, unit.power);

  // The engine power of trusted units already includes the anomaly; raw and
  // face-down units are estimated here, so add the location bonus explicitly.
  let power = unit.faceDown
    ? (unit.cardId ? printedForView(unit) : CONFIG.hidden.opponentFaceDownEstimate)
    : (unit.power || printedForView(unit));
  power += anomalyPowerAt(anomaly, unit.location);

  // 盖牌在夜末必须翻开（§9.6），所以投影时计入其解锁后的连锁/ conditional。
  // 对手盖牌身份不可见（cardId 为 null），不参与这类计算。
  if (!unit.sealed && (unit.cardId || !unit.faceDown)) {
    power += chainBonus(unit, board);
    power += conditionalBonus(unit, otherBoard);
  }
  power += unit.permanentPower ?? 0;
  power += unit.thisNightPower ?? 0;
  power -= unit.corruptionLoss ?? 0;
  if (unit.equipment && !unit.equipment.sealed) {
    power += CONFIG.power.equipment[unit.equipment.cardId] ?? 0;
  }
  return Math.max(0, power);
}

function sumBoard(board, otherBoard, anomaly) {
  let total = 0;
  for (const location of LOCATIONS) {
    for (const unit of board[location]) {
      total += estimateUnitPower(unit, board, otherBoard, anomaly);
    }
  }
  return total;
}

function refreshPower(pos) {
  pos.myPower = sumBoard(pos.myBoard, pos.oppBoard, pos.anomaly ?? null);
  pos.oppPower = sumBoard(pos.oppBoard, pos.myBoard, pos.anomaly ?? null);
}

/** 手牌中一张卡的资源价值（自己的手牌总是可见的）。 */
export function handCardValue(view, card) {
  const face = card?.face === 'madness' ? 'madness' : 'reason';
  const isUnit = card?.type === 'unit' || card?.type === 'oldgod';
  let value = printedForView(card) * CONFIG.hand.powerWeight;
  value += isUnit ? CONFIG.hand.unitBase : CONFIG.hand.specialBase;
  value += CONFIG.hand.effectBonus[card?.cardId] ?? 0;
  value -= (card?.sanityCost ?? 0) * CONFIG.hand.costWeight;
  if (hasKeyword(card, 'backlash') && face === 'madness') {
    value -= CONFIG.hand.backlashPenalty;
  }
  if (hasKeyword(card, 'chain')) value += CONFIG.locations.adjacencyBonus;
  if (hasKeyword(card, 'stealth')) value += CONFIG.hidden.stealthFaceDownValue;
  if (card?.location === 'dream') value += CONFIG.locations.dreamHiddenBonus;
  if (card?.type === 'location') value += CONFIG.locations.archiveSynergyBonus;
  return value;
}

export function buildPosition(view, me) {
  const opp = 1 - me;
  const myHand = view.players[me]?.hand ?? [];
  const pos = {
    me,
    opp,
    night: view.night ?? 1,
    maxNights: view.maxNights ?? 3,
    anomaly: view.anomaly ?? null,
    mySanity: view.players[me]?.sanity ?? 0,
    oppSanity: view.players[opp]?.sanity ?? 0,
    mySanityWeight: view.players[me]?.faction === 'cult'
      ? CONFIG.sanity.factionWeight.cultSelf
      : CONFIG.sanity.factionWeight.societySelf,
    oppSanityWeight: view.players[opp]?.faction === 'cult'
      ? CONFIG.sanity.factionWeight.cultOpp
      : CONFIG.sanity.factionWeight.societyOpp,
    myNightWins: view.nightWins?.[me] ?? 0,
    oppNightWins: view.nightWins?.[opp] ?? 0,
    myObjective: view.players[me]?.objective ?? 0,
    oppObjective: view.players[opp]?.objective ?? 0,
    objectiveThreshold: view.players[me]?.objectiveThreshold ?? 7,
    myPassed: !!view.passed?.[me],
    oppPassed: !!view.passed?.[opp],
    myHandCount: myHand.length,
    oppHandCount: view.players[opp]?.handCount ?? 0,
    myHandValue: myHand.reduce((sum, card) => sum + handCardValue(view, card), 0),
    myFaceDownCount: countFaceDown(view.players[me]),
    oppFaceDownCount: countFaceDown(view.players[opp]),
    oppLeaderAvailable: !!view.players[opp]?.leader
      && !view.players[opp].leader.usedThisNight
      && !view.players[opp].leader.sealed,
    myFutureBonus: 0,
    oppFuturePenalty: 0,
    myPower: 0,
    oppPower: 0,
    myBoard: cloneBoard(view, me),
    oppBoard: cloneBoard(view, opp),
  };
  refreshPower(pos);
  return pos;
}

function countFaceDown(player) {
  let count = 0;
  for (const location of LOCATIONS) {
    for (const unit of player?.board?.[location] ?? []) {
      if (unit && unit.faceDown) count += 1;
    }
  }
  return count;
}

/** 局面标量评分：所有权重来自 CONFIG。 */
export function evaluate(pos) {
  const lead = pos.myPower - pos.oppPower;
  const finalNight = pos.night >= pos.maxNights;
  let score = lead * CONFIG.night.leadWeight;

  if (lead > 0) {
    score += finalNight ? CONFIG.night.finalNightWinBonus : CONFIG.night.winBonus;
  } else if (lead < 0) {
    score -= finalNight ? CONFIG.night.finalNightWinBonus : CONFIG.night.winBonus;
  }

  score += (pos.myNightWins - pos.oppNightWins) * CONFIG.night.nightWinsDiffWeight;
  if (pos.myNightWins + (lead > 0 ? 1 : 0) >= 2) score += CONFIG.night.matchWinBonus;
  if (pos.oppNightWins + (lead < 0 ? 1 : 0) >= 2) score += CONFIG.night.matchLossPenalty;

  // v1.4 objective race: stored progress (escalating near the threshold) and
  // immediate objective victory/ defeat once the projected count reaches it.
  const threshold = pos.objectiveThreshold;
  const near = (count) => Math.max(0, count - (threshold - CONFIG.objectives.nearThresholdWindow));
  score += (pos.myObjective - pos.oppObjective) * CONFIG.objectives.progressWeight;
  score += (near(pos.myObjective) - near(pos.oppObjective)) * CONFIG.objectives.nearThresholdExtraWeight;
  if (pos.myObjective >= threshold) score += CONFIG.night.matchWinBonus;
  if (pos.oppObjective >= threshold) score += CONFIG.night.matchLossPenalty;

  if (pos.mySanity <= 0) score += CONFIG.sanity.zeroMatchLossPenalty;
  if (pos.oppSanity <= 0) score += CONFIG.sanity.zeroMatchWinBonus;
  score += pos.mySanity * pos.mySanityWeight - pos.oppSanity * pos.oppSanityWeight;
  score -= Math.max(0, CONFIG.sanity.lowSanityThreshold - pos.mySanity)
    * CONFIG.sanity.lowSanityExtraWeight * (pos.mySanityWeight / CONFIG.sanity.selfWeight);
  score += Math.max(0, CONFIG.sanity.lowSanityThreshold - pos.oppSanity)
    * CONFIG.sanity.oppLowSanityExtraWeight * (pos.oppSanityWeight / CONFIG.sanity.oppWeight);
  if (lead < 0 && pos.mySanity - CONFIG.sanity.backlashLoss <= 0) {
    score += CONFIG.sanity.losingNightToZeroPenalty;
  }
  if (lead > 0 && pos.oppSanity - CONFIG.sanity.backlashLoss <= 0) {
    score += CONFIG.sanity.winningNightToZeroBonus;
  }

  score += pos.myHandValue * CONFIG.hand.valueWeight
    - pos.oppHandCount * CONFIG.hand.opponentThreatWeight;
  score -= Math.max(0, pos.oppHandCount - pos.myHandCount) * CONFIG.hand.tempoGapWeight;
  score += pos.myFaceDownCount * CONFIG.hidden.ownFaceDownInfoBonus;
  score += pos.myFutureBonus - pos.oppFuturePenalty;

  if (pos.mySanity <= CONFIG.sanity.madnessThreshold) {
    score += CONFIG.sanity.madnessHandUnlockBonus;
  }
  return score;
}

/* ---------------------------------------------------------------------- */
/* 动作模拟                                                                */
/* ---------------------------------------------------------------------- */

function bump(pos, side, unit, delta) {
  if (!unit) return;
  if (!unit.faceDown && !unit.raw) unit.power += delta;
  else unit.thisNightPower += delta;
}

/** v1.4: add objective progress to a side during action simulation. */
function bumpObjective(pos, side, amount) {
  if (side === 'my') pos.myObjective += amount;
  else pos.oppObjective += amount;
}

function sacrificeUnit(pos, side, uid) {
  const board = side === 'my' ? pos.myBoard : pos.oppBoard;
  const found = findBoardUnit(board, uid);
  if (!found) return null;
  const removed = found.unit;
  board[found.location][found.slot] = null;
  return removed;
}

function applyCultEcho(pos, view, me) {
  if (view.players[me]?.faction !== 'cult') return;
  if (view.players[me]?.flags?.cultSacrificeTriggered) return;
  const altar = view.players[me]?.locations?.scene;
  const bonus = altar && altar.cardId === 'drowned-altar' && !altar.sealed
    ? CONFIG.effects.cultEchoWithAltar
    : CONFIG.effects.cultEcho;
  for (const location of LOCATIONS) {
    for (const unit of pos.myBoard[location]) {
      if (unit && !unit.faceDown) bump(pos, 'my', unit, bonus);
    }
  }
}

function applyBacklash(pos, unit, face) {
  if (!unit || face !== 'madness') return;
  if (!hasKeyword(unit, 'backlash')) return;
  pos.mySanity -= CONFIG.sanity.backlashLoss;
  if (pos.mySanity <= CONFIG.sanity.madnessThreshold) {
    pos.myFutureBonus -= CONFIG.sanity.lowSanityBacklashExtra;
  }
}

function applyPlayEffect(pos, view, card, action, face) {
  const { me } = pos;
  switch (card.cardId) {
    case 'samuel-pike': {
      const mode = action.choice?.mode;
      if (mode === 'seal') {
        const found = findBoardUnit(pos.oppBoard, action.choice?.targetUid);
        if (found) {
          bump(pos, 'opp', found.unit, -chainBonus(found.unit, pos.oppBoard, pos.myBoard));
          found.unit.sealed = true;
        }
      } else if (mode === 'removeCorruption') {
        const found = findBoardUnit(pos.myBoard, action.choice?.targetUid)
          ?? findBoardUnit(pos.oppBoard, action.choice?.targetUid);
        if (found) {
          const loss = found.unit.corruptionLoss ?? 0;
          found.unit.corruptionLoss = 0;
          bump(pos, found.unit === findBoardUnit(pos.myBoard, action.choice?.targetUid)?.unit ? 'my' : 'opp', found.unit, loss);
        }
      }
      break;
    }
    case 'abjuration': {
      if (action.choice?.mode === 'removeCorruption') {
        const found = findBoardUnit(pos.myBoard, action.choice?.targetUid)
          ?? findBoardUnit(pos.oppBoard, action.choice?.targetUid);
        if (found) {
          const loss = found.unit.corruptionLoss ?? 0;
          found.unit.corruptionLoss = 0;
          bump(pos, 'my', found.unit, loss);
        }
      } else if (action.choice?.mode === 'removeEnvironment') {
        const env = (view.environments ?? []).find((entry) => entry.uid === action.choice?.targetUid);
        if (env?.owner === me) pos.myFutureBonus += CONFIG.effects.removeEnvironment;
        else pos.oppFuturePenalty += CONFIG.effects.removeEnvironment;
      }
      break;
    }
    case 'warding-rite': {
      const target = action.choice?.targetUid ?? '';
      for (const location of LOCATIONS) {
        if (!target.endsWith(`-${location}`)) continue;
        for (const unit of pos.myBoard[location]) {
          if (unit && !unit.faceDown) bump(pos, 'my', unit, CONFIG.effects.warding);
        }
      }
      break;
    }
    case 'tide-ritual': {
      for (const unit of pos.myBoard.dream) {
        if (unit && !unit.faceDown) bump(pos, 'my', unit, CONFIG.effects.tide);
      }
      break;
    }
    case 'lunar-eclipse': {
      for (const side of ['my', 'opp']) {
        const board = side === 'my' ? pos.myBoard : pos.oppBoard;
        for (const location of LOCATIONS) {
          for (const unit of board[location]) {
            if (!unit || unit.faceDown) continue;
            bump(pos, side, unit, unit.face === 'madness'
              ? CONFIG.effects.lunar
              : -CONFIG.effects.lunar);
          }
        }
      }
      break;
    }
    case 'stormy-night': {
      for (const side of ['my', 'opp']) {
        const board = side === 'my' ? pos.myBoard : pos.oppBoard;
        for (const unit of board.scene) {
          if (unit && !unit.faceDown) bump(pos, side, unit, CONFIG.effects.stormy);
        }
      }
      break;
    }
    case 'unexpected-aid': {
      const found = findBoardUnit(pos.myBoard, action.choice?.targetUid);
      if (found) {
        const loss = found.unit.corruptionLoss ?? 0;
        found.unit.corruptionLoss = 0;
        found.unit.sealed = false;
        bump(pos, 'my', found.unit, CONFIG.effects.unexpectedAid + loss);
      }
      break;
    }
    case 'sea-priestess': {
      if (findBoardUnit(pos.oppBoard, action.choice?.targetUid)) {
        pos.oppFuturePenalty += CONFIG.effects.corruptionImmediate;
      }
      break;
    }
    case 'thousand-eyes': {
      if (pos.oppLeaderAvailable) {
        pos.oppLeaderAvailable = false;
        pos.oppFuturePenalty += CONFIG.effects.sealLeader;
      }
      break;
    }
    case 'silver-lantern': {
      const found = findBoardUnit(pos.myBoard, action.hostUid);
      if (found) {
        found.unit.equipment = { cardId: 'silver-lantern', sealed: false };
        bump(pos, 'my', found.unit, CONFIG.power.equipment['silver-lantern']);
      }
      break;
    }
    case 'old-library': {
      pos.myFutureBonus += CONFIG.effects.oldLibrary;
      break;
    }
    case 'drowned-altar': {
      pos.myFutureBonus += CONFIG.effects.drownedAltar;
      break;
    }
    case 'bell-claw': {
      if (action.choice?.mode !== 'devour') break;
      const target = sacrificeUnit(pos, 'my', action.choice?.targetUid);
      if (!target) break;
      const source = findBoardUnit(pos.myBoard, card.uid);
      bump(pos, 'my', source?.unit, estimateUnitPower(target, pos.myBoard, pos.oppBoard));
      applyBacklash(pos, target, target.face);
      applyCultEcho(pos, view, me);
      bumpObjective(pos, 'my', 1); // cult sacrifice → doom
      break;
    }
    case 'gravedigger':
    case 'seance': {
      const target = sacrificeUnit(pos, 'my', action.choice?.targetUid);
      if (!target) break;
      applyBacklash(pos, target, target.face);
      applyCultEcho(pos, view, me);
      bumpObjective(pos, 'my', 1); // cult sacrifice → doom
      const abyss = view.players[me]?.abyss ?? [];
      const candidates = abyss
        .filter((entry) => entry.uid !== target.uid)
        .map((entry) => handCardValue(view, entry))
        .sort((a, b) => b - a);
      const count = card.cardId === 'seance' ? Math.min(2, candidates.length) : Math.min(1, candidates.length);
      for (let i = 0; i < count; i += 1) {
        pos.myHandValue += candidates[i];
        pos.myHandCount += 1;
      }
      break;
    }
    default:
      break;
  }
  void face;
}

function simulatePlayCard(view, base, action) {
  const next = clonePosition(base);
  const me = base.me;
  const card = (view.players[me]?.hand ?? []).find((entry) => entry.uid === action.uid);
  if (!card) return next;

  const face = action.face ?? card.face ?? 'reason';
  const isUnit = card.type === 'unit' || card.type === 'oldgod';
  next.myHandCount = Math.max(0, next.myHandCount - 1);
  next.myHandValue -= handCardValue(view, card);
  next.mySanity -= card.sanityCost ?? 0;

  if (isUnit) {
    const unit = {
      uid: card.uid,
      cardId: card.cardId ?? null,
      face,
      faceDown: !!action.faceDown,
      sealed: false,
      keywords: Array.isArray(card.keywords) ? card.keywords.slice() : [],
      power: printedForView(card),
      corruptionLoss: 0,
      permanentPower: 0,
      thisNightPower: 0,
      equipment: null,
      location: action.location,
      slot: action.slot,
      raw: true,
    };
    next.myBoard[action.location][action.slot] = unit;
    if (action.faceDown) {
      next.myFaceDownCount += 1;
      if (hasKeyword(card, 'stealth')) next.myFutureBonus += CONFIG.hidden.stealthFaceDownValue;
    }
    if (action.location === 'scene') next.myFutureBonus += CONFIG.locations.scenePressureBonus;
    if (action.location === 'archive') next.myFutureBonus += CONFIG.locations.archiveSynergyBonus;
    if (action.location === 'dream') next.myFutureBonus += CONFIG.locations.dreamHiddenBonus;
    const capacity = CONFIG.locations.capacity[action.location] ?? 0;
    if (capacity > 1) {
      const center = (capacity - 1) / 2;
      next.myFutureBonus += CONFIG.locations.centerSlotBonus
        * (1 - Math.abs(action.slot - center) / center);
    }
    if (!action.faceDown) applyBacklash(next, unit, face);
    // v1.4: a Society unit entering the archive face-up gains a clue.
    if (!action.faceDown && action.location === 'archive'
      && view.players[me]?.faction === 'society') {
      bumpObjective(next, 'my', 1);
    }
  } else {
    if (card.location === 'dream') next.myFutureBonus += CONFIG.locations.dreamHiddenBonus;
  }

  // v1.4: casting a Cult ritual adds 1 doom.
  if (card.type === 'ritual') bumpObjective(next, 'my', 1);

  if (hasKeyword(card, 'backlash') && !isUnit && face === 'madness') {
    applyBacklash(next, { cardId: card.cardId, keywords: card.keywords }, face);
  }

  // v1.3: anomaly entry effects (sanity/corruption) at the placed location.
  const anomaly = view.anomaly ?? null;
  if (isUnit && anomaly && anomaly.location === action.location) {
    if (anomaly.entrySanity) {
      next.mySanity += anomaly.entrySanity;
      next.myFutureBonus += anomaly.entrySanity * CONFIG.mechanics.anomaly.entrySanityWeight;
    }
    if (anomaly.entryCorruption && !action.faceDown) {
      next.myFutureBonus -= CONFIG.mechanics.anomaly.entryCorruptionPenalty;
    }
  }

  // v1.3: chaos bag — expected elder-sign sanity cost on a face-up unit play.
  if (isUnit && !action.faceDown) {
    next.mySanity -= CONFIG.mechanics.chaos.elderSignProbability
      * CONFIG.mechanics.chaos.elderSignSanity;
  }

  // v1.3: discover moves one chosen deck card into hand (tempo +1).
  if (isUnit && action.choice?.mode === 'discover' && action.choice.targetUid) {
    next.myHandCount += 1;
  }

  applyPlayEffect(next, view, card, action, face);
  refreshPower(next);
  return next;
}

function simulateUseLeader(view, base, action) {
  const next = clonePosition(base);
  const me = base.me;
  const leaderId = view.players[me]?.leaderId;

  if (leaderId === 'harold-ashby') {
    next.mySanity += CONFIG.sanity.backlashLoss; // 规则 §8.1：回复 1 理智
    next.myFutureBonus += CONFIG.effects.harold;
    const found = findBoardUnit(next.oppBoard, action.targetUid);
    if (found) {
      bump(next, 'opp', found.unit, -chainBonus(found.unit, next.oppBoard, next.myBoard));
      found.unit.sealed = true;
    }
  } else if (leaderId === 'elias-thorne') {
    const sacrificed = sacrificeUnit(next, 'my', action.sacrificeUid);
    if (sacrificed) {
      applyBacklash(next, sacrificed, sacrificed.face);
      applyCultEcho(next, view, me);
      bumpObjective(next, 'my', 1); // cult leader sacrifice → doom
    }
    const match = /:\s*([a-z-]+)\s+@/.exec(action.label ?? '');
    const summonedId = match?.[1] ?? null;
    const pair = CONFIG.power.eliasSummon[summonedId];
    const madnessFace = next.mySanity <= CONFIG.sanity.madnessThreshold;
    const power = pair ? pair[madnessFace ? 1 : 0] : CONFIG.hidden.opponentFaceDownEstimate;
    const unit = {
      uid: action.cardUid ?? `elias-${summonedId}`,
      cardId: summonedId,
      face: madnessFace ? 'madness' : 'reason',
      faceDown: false,
      sealed: false,
      keywords: CONFIG.power.backlash.includes(summonedId) ? ['backlash'] : [],
      power,
      corruptionLoss: 0,
      permanentPower: 0,
      thisNightPower: 0,
      equipment: null,
      location: action.location,
      slot: action.slot,
      raw: true,
    };
    next.myBoard[action.location][action.slot] = unit;
    if (madnessFace && CONFIG.power.backlash.includes(summonedId)) {
      next.mySanity -= CONFIG.sanity.backlashLoss;
    }
  }
  refreshPower(next);
  return next;
}

function simulateReveal(view, base, action) {
  const next = clonePosition(base);
  const me = base.me;
  for (const uid of action.uids ?? []) {
    const found = findBoardUnit(next.myBoard, uid);
    if (!found || !found.unit.faceDown) continue;
    const unit = found.unit;
    const revealLocation = found.location;
    unit.faceDown = false;
    next.myFaceDownCount = Math.max(0, next.myFaceDownCount - 1);
    if (unit.cardId === 'whisperer') next.oppSanity -= CONFIG.effects.whispererDrain;
    if (unit.cardId === 'silas-gold') {
      next.myHandValue += CONFIG.effects.silasDraw;
      next.myHandCount += 1;
    }
    if (unit.cardId === 'nora-wells' || unit.cardId === 'arthur-pendleton') {
      next.myHandValue += CONFIG.effects.infoPeek;
    }
    // v1.3: anomaly entry effects now that the card is face-up.
    const anomaly = view.anomaly ?? null;
    if (anomaly && anomaly.location === revealLocation) {
      if (anomaly.entrySanity) {
        next.mySanity += anomaly.entrySanity;
        next.myFutureBonus += anomaly.entrySanity * CONFIG.mechanics.anomaly.entrySanityWeight;
      }
      if (anomaly.entryCorruption) next.myFutureBonus -= CONFIG.mechanics.anomaly.entryCorruptionPenalty;
    }
    // v1.3: chaos token drawn on reveal — expected elder-sign sanity cost.
    next.mySanity -= CONFIG.mechanics.chaos.elderSignProbability
      * CONFIG.mechanics.chaos.elderSignSanity;
    // v1.3: Lucia discovers a deck card into hand on reveal.
    if (unit.cardId === 'lucia-vaughn') next.myHandCount += 1;
    applyBacklash(next, unit, unit.face);
  }
  refreshPower(next);
  return next;
}

function simulatePass(view, base) {
  const next = clonePosition(base);
  next.myPassed = true;
  if (!next.oppPassed) {
    next.oppPower += next.oppHandCount * CONFIG.pass.futureCardThreat;
    if (next.oppLeaderAvailable) next.oppPower += CONFIG.pass.leaderThreat;
  } else if (next.myPower > next.oppPower) {
    next.myFutureBonus += CONFIG.pass.opponentPassedAheadBonus;
  }
  return next;
}

/** 对一个 view.actions 中的动作评分。 */
export function scoreAction(view, action, basePosition = null) {
  const me = view.current ?? view.actions?.find((entry) => entry?.player !== undefined)?.player ?? 0;
  const pos = basePosition ?? buildPosition(view, me);
  let next;
  switch (action.type) {
    case 'playCard':
      next = simulatePlayCard(view, pos, action);
      break;
    case 'useLeader':
      next = simulateUseLeader(view, pos, action);
      break;
    case 'reveal':
      next = simulateReveal(view, pos, action);
      break;
    case 'pass':
      next = simulatePass(view, pos);
      break;
    default:
      next = clonePosition(pos);
      break;
  }
  return evaluate(next);
}

/** 换牌阶段：按手牌价值选择丢弃组合。 */
export function scoreMulligan(view, action) {
  const me = action.player ?? 0;
  const hand = view.players[me]?.hand ?? [];
  const values = hand.map((card) => handCardValue(view, card));
  const average = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
  const discard = new Set(action.uids ?? []);
  let kept = 0;
  hand.forEach((card, index) => {
    if (!discard.has(card.uid)) kept += values[index];
  });
  return kept + discard.size * average * CONFIG.hand.mulliganExpectedRatio;
}
