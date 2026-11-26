/**
 * src/ui-v2/fx/view-diff.mjs — pure buildView() differ for the atmosphere layer.
 *
 * Takes two snapshots produced by engine.viewFor(pov) and returns a plain,
 * DOM-free description of what visually changed.  It never reads the engine,
 * the DOM, Math.random, or any global clock: the same inputs always produce
 * the same diff, which is what makes it cheap to unit test.
 *
 * Recognised changes:
 *   - entered    new cards on a board (uid list)
 *   - flipped    reason <-> madness face changes (hand *and* board)
 *   - sanity     per-player sanity deltas
 *   - sealed     cards / locations / leaders that became sealed
 *   - corrupted  cards whose corruption token count grew
 *   - nightChanged / gameOver / result
 *
 * Malformed fragments are skipped, never thrown.
 */

import { asArray, asObject } from '../utils.mjs';

export const BOARD_LOCATIONS = Object.freeze(['front']);
export const CARD_FACES = Object.freeze(['reason', 'madness']);

function numberOrNull(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function usableUid(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Flatten the reachable, visually relevant card states of a view.
 * Opponent face-down cards have a uid but no face/seal metadata; those are
 * still kept so "entered" works, while face/status comparisons simply skip.
 */
export function collectCardStates(view) {
  const data = asObject(view);
  const players = asArray(data.players);
  const states = new Map();
  const boardUids = new Set();

  function put(card, { player, area, onBoard }) {
    const item = asObject(card);
    const uid = usableUid(item.uid);
    if (!uid) return;
    const face = CARD_FACES.includes(item.face) ? item.face : null;
    const corruption = numberOrNull(item.corruption);
    states.set(uid, Object.freeze({
      uid,
      player,
      area,
      face,
      sealed: item.sealed === true,
      corruption: corruption === null ? 0 : corruption,
      hidden: item.hidden === true || item.faceDown === true,
    }));
    if (onBoard) boardUids.add(uid);
  }

  for (let player = 0; player < 2; player += 1) {
    const playerView = asObject(players[player]);
    const board = asObject(playerView.board);
    for (const location of BOARD_LOCATIONS) {
      for (const card of asArray(board[location])) {
        put(card, { player, area: location, onBoard: true });
      }
    }
    for (const card of asArray(playerView.hand)) {
      put(card, { player, area: 'hand', onBoard: false });
    }
    const locations = asObject(playerView.locations);
    for (const location of BOARD_LOCATIONS) {
      put(locations[location], { player, area: `location:${location}`, onBoard: false });
    }
    if (asObject(playerView.leader).sealed === true) {
      const uid = `leader:${player}`;
      states.set(uid, Object.freeze({
        uid, player, area: 'leader', face: null,
        sealed: true, corruption: 0, hidden: false,
      }));
    }
  }

  for (const card of asArray(data.environments)) {
    put(card, { player: null, area: 'environment', onBoard: false });
  }

  return Object.freeze({ states, boardUids });
}

function emptyDiff(view) {
  const data = asObject(view);
  return Object.freeze({
    entered: Object.freeze([]),
    flipped: Object.freeze([]),
    sanity: Object.freeze([]),
    objectives: Object.freeze([]),
    sealed: Object.freeze([]),
    corrupted: Object.freeze([]),
    nightChanged: false,
    night: numberOrNull(data.night),
    gameOver: data.phase === 'gameOver',
    result: data.result && typeof data.result === 'object' ? data.result : null,
  });
}

/**
 * @param {object|null} previous  the view painted before the current one
 * @param {object|null} next      the freshly built view
 */
export function diffViews(previous, next) {
  if (!next || typeof next !== 'object' || Array.isArray(next)) return emptyDiff(null);
  if (!previous || typeof previous !== 'object' || Array.isArray(previous)) return emptyDiff(next);

  const before = collectCardStates(previous);
  const after = collectCardStates(next);

  const entered = [];
  for (const uid of after.boardUids) {
    if (!before.boardUids.has(uid)) entered.push(uid);
  }

  const flipped = [];
  for (const [uid, card] of after.states) {
    const old = before.states.get(uid);
    if (!old || !card.face || !old.face || old.face === card.face) continue;
    flipped.push(Object.freeze({
      uid,
      from: old.face,
      to: card.face,
      player: card.player,
      area: card.area,
    }));
  }

  const sanity = [];
  const oldPlayers = asArray(asObject(previous).players);
  const newPlayers = asArray(asObject(next).players);
  for (let player = 0; player < 2; player += 1) {
    const from = numberOrNull(asObject(oldPlayers[player]).sanity);
    const to = numberOrNull(asObject(newPlayers[player]).sanity);
    if (from === null || to === null || from === to) continue;
    sanity.push(Object.freeze({ player, from, to, delta: to - from }));
  }

  const objectives = [];
  for (let player = 0; player < 2; player += 1) {
    const from = numberOrNull(asObject(oldPlayers[player]).objective);
    const to = numberOrNull(asObject(newPlayers[player]).objective);
    if (from === null || to === null || to <= from) continue;
    objectives.push(Object.freeze({ player, from, to, delta: to - from }));
  }

  const sealed = [];
  const corrupted = [];
  for (const [uid, card] of after.states) {
    const old = before.states.get(uid);
    if (!old) continue;
    if (!old.sealed && card.sealed) sealed.push(uid);
    const delta = card.corruption - old.corruption;
    if (delta > 0) {
      corrupted.push(Object.freeze({
        uid,
        player: card.player,
        tokens: card.corruption,
        added: delta,
      }));
    }
  }

  const oldNight = numberOrNull(asObject(previous).night);
  const newNight = numberOrNull(asObject(next).night);
  const nightChanged = oldNight !== null && newNight !== null && oldNight !== newNight;
  const oldPhase = asObject(previous).phase;
  const newPhase = asObject(next).phase;
  const result = asObject(next).result;

  return Object.freeze({
    entered: Object.freeze(entered),
    flipped: Object.freeze(flipped),
    sanity: Object.freeze(sanity),
    objectives: Object.freeze(objectives),
    sealed: Object.freeze(sealed),
    corrupted: Object.freeze(corrupted),
    nightChanged,
    night: newNight,
    gameOver: newPhase === 'gameOver' && oldPhase !== 'gameOver',
    result: result && typeof result === 'object' ? result : null,
  });
}

/** True when at least one visual effect is worth scheduling. */
export function hasChanges(diff) {
  const data = asObject(diff);
  return data.entered?.length > 0
    || data.flipped?.length > 0
    || data.sanity?.length > 0
    || data.objectives?.length > 0
    || data.sealed?.length > 0
    || data.corrupted?.length > 0
    || data.nightChanged === true
    || data.gameOver === true;
}

export default diffViews;
