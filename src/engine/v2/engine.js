/**
 * Greyharbor v2.1 — headless, deterministic, DOM-free rules skeleton.
 *
 * Deliberately NOT implemented in this phase:
 *   card abilities, leaders' active skills, events/rituals/environments/
 *   equipment/locations, corruption, sealing, sacrifice, chain bonuses.
 *
 * Implemented:
 *   deck setup (1 leader + 19 cards), opening hand 8, mulligan up to 2,
 *   three locations with 5/5/3 slots, dream = madness face only,
 *   sanity 6 / forced madness hand at <=3 / night penalties / zero loss,
 *   play + pass turn loop, night-end reveal + scoring + night winner,
 *   best-of-three nights with final tiebreak, viewFor(pov), clone(), events.
 */

import { hashSeed, randInt, shuffle } from '../rng.js';
import { CARDS, DEFAULT_DECK_ORDER, PRESET_DECKS, makeCardIndex } from './cards.js';
import {
  LOCATIONS,
  LOCATION_CAPACITY,
  LOCATION_LABELS,
  SANITY_MIN,
  clampSanity,
  countCards,
  faceForSanity,
  isStealth,
  isUnitCard,
  scorePlayer,
} from './scoring.js';
import { buildView } from './view.js';

const ENGINE_VERSION = '2.1';

function fail(error) {
  return { ok: false, error };
}

function isPlayerIndex(value) {
  return value === 0 || value === 1;
}

function resolveDeckSpec(spec, cardIndex) {
  let raw = spec;
  if (typeof raw === 'string') {
    const preset = PRESET_DECKS[raw];
    if (!preset) throw new Error(`unknown preset deck: ${raw}`);
    raw = preset;
  }
  if (Array.isArray(raw)) raw = { cards: raw };
  if (!raw || typeof raw !== 'object') throw new Error('deck spec must be an object, array, or preset id');

  const entries = raw.cards ?? raw.deck ?? [];
  const cardIds = [];
  for (const entry of entries) {
    if (typeof entry === 'string') {
      cardIds.push(entry);
      continue;
    }
    if (entry && typeof entry === 'object' && typeof entry.id === 'string') {
      const count = entry.count ?? 1;
      if (!Number.isInteger(count) || count < 1) {
        throw new Error(`invalid card count for ${entry.id}`);
      }
      for (let i = 0; i < count; i++) cardIds.push(entry.id);
      continue;
    }
    throw new Error('deck entries must be card-id strings or {id, count}');
  }

  for (const id of cardIds) {
    const card = cardIndex[id];
    if (!card) throw new Error(`unknown card id: ${id}`);
    if (card.type === 'leader') throw new Error(`leader ${id} cannot be in the 19-card deck`);
  }

  const leaderId = raw.leader ?? raw.leaderId ?? null;
  if (leaderId !== null && !cardIndex[leaderId]) throw new Error(`unknown leader id: ${leaderId}`);

  return {
    id: raw.id ?? null,
    name: raw.name ?? raw.id ?? 'custom',
    leaderId,
    cardIds,
  };
}

function normalizeOptions(options = {}) {
  const seed = options.seed ?? 'greyharbor';
  const cardIndex = makeCardIndex(options.cardPool ?? CARDS);

  const rawDecks = options.decks ?? DEFAULT_DECK_ORDER.map((id) => PRESET_DECKS[id]);
  if (!Array.isArray(rawDecks) || rawDecks.length !== 2) {
    throw new Error('createGame() needs exactly two decks');
  }
  const decks = rawDecks.map((spec) => resolveDeckSpec(spec, cardIndex));

  const startingHand = options.startingHand ?? 8;
  if (!Number.isInteger(startingHand) || startingHand < 0) {
    throw new Error('startingHand must be a non-negative integer');
  }

  const sanityOption = options.startingSanity ?? 6;
  const startingSanity = (Array.isArray(sanityOption) ? sanityOption : [sanityOption, sanityOption])
    .map((value) => {
      if (!Number.isFinite(value)) throw new Error('startingSanity must be a number');
      return clampSanity(Math.trunc(value));
    });

  const maxNights = options.maxNights ?? 3;
  if (!Number.isInteger(maxNights) || maxNights < 1) {
    throw new Error('maxNights must be a positive integer');
  }

  const names = options.names ?? ['P0', 'P1'];
  if (!Array.isArray(names) || names.length !== 2) throw new Error('names must contain two strings');

  return {
    seed,
    cardIndex,
    decks,
    startingHand,
    startingSanity,
    maxNights,
    names: names.map(String),
  };
}

function createInitialState(config) {
  const state = {
    version: ENGINE_VERSION,
    seed: config.seed,
    rngState: hashSeed(config.seed),
    phase: 'mulligan',
    night: 0,
    maxNights: config.maxNights,
    firstPlayer: null,
    current: null,
    passed: [false, false],
    mulliganDone: [false, false],
    nightWins: [0, 0],
    history: [],
    players: config.decks.map((deck, p) => ({
      id: p,
      name: config.names[p],
      leaderId: deck.leaderId,
      sanity: config.startingSanity[p],
      deck: [],
      hand: [],
      discard: [],
      board: Object.fromEntries(
        LOCATIONS.map((location) => [location, Array(LOCATION_CAPACITY[location]).fill(null)]),
      ),
    })),
    events: [],
    result: null,
  };

  for (let p = 0; p < 2; p++) {
    const face = faceForSanity(state.players[p].sanity);
    const instances = config.decks[p].cardIds.map((cardId, index) => ({
      uid: `p${p}-${index + 1}`,
      cardId,
      owner: p,
      face,
      faceDown: false,
      location: null,
      slot: null,
    }));
    state.players[p].deck = shuffle(state, instances);
  }

  return state;
}

export class EngineV2 {
  constructor(config, internalState = null) {
    this.config = config;
    this.cardIndex = config.cardIndex;
    this.state = internalState;
  }

  // ── public API ──────────────────────────────────────────────────────

  get phase() {
    return this.state.phase;
  }

  get night() {
    return this.state.night;
  }

  get current() {
    return this.state.current;
  }

  get turn() {
    return this.state.current;
  }

  get pending() {
    if (this.state.phase !== 'mulligan') return null;
    const players = [0, 1].filter((p) => !this.state.mulliganDone[p]);
    return players.length ? { type: 'mulligan', players } : null;
  }

  result() {
    return this.state.result ? structuredClone(this.state.result) : null;
  }

  clone() {
    return new EngineV2(this.config, structuredClone(this.state));
  }

  viewFor(pov = 0) {
    return buildView(this, pov);
  }

  getActions(pov = null) {
    const state = this.state;
    if (state.phase === 'mulligan') {
      const actions = [];
      for (const p of [0, 1]) {
        if (!state.mulliganDone[p] && (pov === null || pov === p)) {
          actions.push(...this._mulliganActions(p));
        }
      }
      return actions;
    }
    if (state.phase !== 'play') return [];
    const p = state.current;
    if (p === null) return [];
    if (pov !== null && pov !== p) return [];
    return [...this._legalPlays(p), { type: 'pass', player: p, label: 'Pass' }];
  }

  apply(action) {
    const eventStart = this.state.events.length;
    let outcome;
    try {
      outcome = this._apply(action);
    } catch (error) {
      this.state.events.length = eventStart;
      return { ok: false, error: error.message, events: [] };
    }
    if (!outcome.ok) {
      this.state.events.length = eventStart;
      return { ok: false, error: outcome.error, events: [] };
    }
    return { ok: true, events: this.state.events.slice(eventStart) };
  }

  // ── setup ───────────────────────────────────────────────────────────

  _setup() {
    const state = this.state;
    this._emit({
      type: 'gameStart',
      version: state.version,
      seed: state.seed,
      players: state.players.map((p) => ({ id: p.id, name: p.name, leaderId: p.leaderId })),
      decks: this.config.decks.map((d) => d.name),
    });
    for (const p of [0, 1]) {
      const count = this._draw(p, this.config.startingHand, false);
      this._emit({ type: 'deal', player: p, count });
    }
    for (const p of [0, 1]) this._syncHandFaces(p);
  }

  // ── action dispatch ─────────────────────────────────────────────────

  _apply(action) {
    const state = this.state;
    if (!action || typeof action !== 'object') return fail('action must be an object');
    if (state.phase === 'gameOver') return fail('game is over');

    switch (action.type) {
      case 'mulligan':
        return this._applyMulligan(action);
      case 'playCard':
        return this._applyPlayCard(action);
      case 'pass':
        return this._applyPass(action);
      default:
        return fail(`unknown action type: ${action.type}`);
    }
  }

  _applyMulligan(action) {
    const state = this.state;
    if (state.phase !== 'mulligan') return fail('mulligan is only allowed during setup');
    const p = action.player;
    if (!isPlayerIndex(p)) return fail('mulligan needs player 0 or 1');
    if (state.mulliganDone[p]) return fail(`player ${p} has already mulliganed`);

    const uids = action.uids ?? [];
    if (!Array.isArray(uids)) return fail('mulligan uids must be an array');
    if (uids.length > 2) return fail('mulligan allows at most 2 cards');
    if (new Set(uids).size !== uids.length) return fail('mulligan uids must be unique');

    const player = state.players[p];
    const handUids = new Set(player.hand.map((inst) => inst.uid));
    for (const uid of uids) {
      if (typeof uid !== 'string' || !handUids.has(uid)) {
        return fail(`card ${uid} is not in player ${p}'s hand`);
      }
    }

    const removed = [];
    for (const uid of uids) {
      const index = player.hand.findIndex((inst) => inst.uid === uid);
      removed.push(player.hand.splice(index, 1)[0]);
    }
    if (removed.length) {
      player.deck.push(...removed);
      player.deck = shuffle(state, player.deck);
      this._draw(p, removed.length);
    }
    this._syncHandFaces(p);
    state.mulliganDone[p] = true;
    this._emit({ type: 'mulligan', player: p, uids: uids.slice(), count: uids.length });

    if (state.mulliganDone[0] && state.mulliganDone[1]) {
      state.phase = 'play';
      this._startNight(1);
      if (state.phase === 'play') this._autoPassStuck();
    }
    return { ok: true };
  }

  _applyPlayCard(action) {
    const state = this.state;
    if (state.phase !== 'play') return fail('cards can only be played during a night');

    const p = action.player ?? state.current;
    if (!isPlayerIndex(p)) return fail('playCard needs player 0 or 1');
    if (p !== state.current) return fail('not this player\'s turn');
    if (state.passed[p]) return fail('this player has already passed');

    const player = state.players[p];
    const uid = action.uid;
    if (typeof uid !== 'string') return fail('playCard needs a card uid');
    const handIndex = player.hand.findIndex((inst) => inst.uid === uid);
    if (handIndex < 0) return fail(`card ${uid} is not in player ${p}'s hand`);

    const inst = player.hand[handIndex];
    const card = this.cardIndex[inst.cardId];
    if (!card) return fail(`unknown card: ${inst.cardId}`);
    if (!isUnitCard(card)) {
      return fail('phase 2.1 only supports playing unit/oldgod cards (abilities are inert)');
    }

    const face = faceForSanity(player.sanity);
    const location = action.location;
    if (!LOCATIONS.includes(location)) return fail(`invalid location: ${location}`);

    const allowedLocations =
      card.location === 'any'
        ? ['scene', 'archive', 'dream']
        : LOCATIONS.includes(card.location)
          ? [card.location]
          : [];
    if (!allowedLocations.includes(location)) {
      return fail(`${card.name} cannot be placed in ${location}`);
    }
    if (location === 'dream' && face !== 'madness') {
      return fail('dream only accepts cards currently on their madness face');
    }

    const faceDown = action.faceDown === true;
    if (faceDown && !isStealth(card)) return fail(`${card.name} has no stealth keyword`);
    if (location === 'dream' && isStealth(card) && !faceDown) {
      return fail(`${card.name} must enter the dream face-down`);
    }

    const row = player.board[location];
    let slot;
    if (action.slot === undefined || action.slot === null) {
      slot = row.findIndex((entry) => entry === null);
      if (slot < 0) return fail(`${location} has no empty slot`);
    } else {
      slot = action.slot;
      if (!Number.isInteger(slot) || slot < 0 || slot >= row.length) {
        return fail(`invalid slot ${slot} for ${location}`);
      }
      if (row[slot]) return fail(`slot ${slot} in ${location} is occupied`);
    }

    const sanityCost = Math.max(0, card.sanityCost ?? 0);
    if (sanityCost > player.sanity) return fail(`${card.name} costs ${sanityCost} sanity`);

    // All validation passed: commit atomically.
    player.hand.splice(handIndex, 1);
    inst.face = face;
    inst.faceDown = faceDown;
    inst.location = location;
    inst.slot = slot;
    row[slot] = inst;

    this._emit({
      type: 'play',
      player: p,
      uid: inst.uid,
      cardId: inst.cardId,
      name: card.name,
      location,
      slot,
      face,
      faceDown,
      sanityCost,
    });

    if (sanityCost > 0) this._changeSanity(p, -sanityCost, 'sanityCost');
    if (this._checkSanityZero()) return { ok: true };

    this._advanceAfterPlay(p);
    this._autoPassStuck();
    return { ok: true };
  }

  _applyPass(action) {
    const state = this.state;
    if (state.phase !== 'play') return fail('pass is only allowed during a night');
    const p = action.player ?? state.current;
    if (!isPlayerIndex(p)) return fail('pass needs player 0 or 1');
    if (p !== state.current) return fail('not this player\'s turn');
    if (state.passed[p]) return fail('this player has already passed');

    this._pass(p, false);
    if (state.phase === 'play') this._autoPassStuck();
    return { ok: true };
  }

  // ── turn / night machinery ──────────────────────────────────────────

  _advanceAfterPlay(p) {
    const state = this.state;
    if (state.phase !== 'play') return;
    const other = 1 - p;
    state.current = state.passed[other] ? p : other;
  }

  _pass(p, auto) {
    const state = this.state;
    state.passed[p] = true;
    this._emit({ type: 'pass', player: p, auto: !!auto });
    if (state.passed[0] && state.passed[1]) {
      this._endNight();
    } else {
      state.current = 1 - p;
    }
  }

  _autoPassStuck() {
    const state = this.state;
    let guard = 0;
    while (
      state.phase === 'play'
      && state.current !== null
      && !state.passed[state.current]
    ) {
      const plays = this._legalPlays(state.current);
      if (plays.length > 0) break;
      this._pass(state.current, true);
      guard += 1;
      if (guard > 50) throw new Error('auto-pass guard tripped');
    }
  }

  _startNight(night) {
    const state = this.state;
    state.night = night;
    if (night === 1) {
      state.firstPlayer = randInt(state, 2);
    }
    const draws = [0, 0];
    if (night > 1) {
      for (const p of [0, 1]) draws[p] = this._draw(p, 2);
    }
    state.current = state.firstPlayer;
    state.passed = [false, false];
    for (const p of [0, 1]) this._syncHandFaces(p);

    this._emit({
      type: 'nightStart',
      night,
      firstPlayer: state.firstPlayer,
      draws,
    });

    this._checkSanityZero();
  }

  _endNight() {
    const state = this.state;
    if (state.phase !== 'play') return;
    const night = state.night;

    // 1. Reveal all face-down cards: first player first, then the other.
    for (const p of [state.firstPlayer, 1 - state.firstPlayer]) {
      for (const location of LOCATIONS) {
        const row = state.players[p].board[location];
        for (let slot = 0; slot < row.length; slot++) {
          const inst = row[slot];
          if (!inst || !inst.faceDown) continue;
          inst.faceDown = false;
          this._emit({
            type: 'reveal',
            player: p,
            uid: inst.uid,
            cardId: inst.cardId,
            name: this.cardIndex[inst.cardId]?.name ?? inst.cardId,
            location,
            slot,
            face: inst.face,
          });
        }
      }
    }

    // 2. Score.
    const score0 = scorePlayer(state, 0, this.cardIndex);
    const score1 = scorePlayer(state, 1, this.cardIndex);
    const scores = [score0, score1];
    const sanityBefore = state.players.map((player) => player.sanity);

    let winner = null;
    let tie = false;
    let decidedBy;
    if (score0.total > score1.total) {
      winner = 0;
      decidedBy = 'score';
    } else if (score1.total > score0.total) {
      winner = 1;
      decidedBy = 'score';
    } else if (sanityBefore[0] > sanityBefore[1]) {
      winner = 0;
      decidedBy = 'sanity';
    } else if (sanityBefore[1] > sanityBefore[0]) {
      winner = 1;
      decidedBy = 'sanity';
    } else {
      tie = true;
      decidedBy = 'tie';
    }

    if (winner !== null) state.nightWins[winner] += 1;

    // 3. Night sanity penalty: loser -1, tied night both -1.
    if (tie) {
      this._changeSanity(0, -1, 'nightTie');
      this._changeSanity(1, -1, 'nightTie');
    } else {
      this._changeSanity(1 - winner, -1, 'nightLoss');
    }

    const entry = {
      night,
      scores: scores.map((score) => ({
        total: score.total,
        locations: { ...score.locations },
      })),
      sanityBefore,
      sanityAfter: state.players.map((player) => player.sanity),
      winner,
      tie,
      decidedBy,
      nightWins: state.nightWins.slice(),
    };
    state.history.push(entry);
    this._emit({ type: 'nightEnd', ...structuredClone(entry) });

    // 4. Sanity zero takes precedence over everything else.
    if (this._checkSanityZero()) return;

    // 5. Match win.
    if (winner !== null && state.nightWins[winner] >= 2) {
      this._gameOver(winner, 'nightWins', { decidedBy });
      return;
    }

    // 6. Three nights without a two-win player: final tiebreak.
    if (state.night >= state.maxNights) {
      this._finalTiebreak();
      return;
    }

    // 7. Next night: loser goes first; on a tie the previous first player keeps it.
    if (!tie) state.firstPlayer = 1 - winner;
    this._startNight(state.night + 1);
  }

  _finalTiebreak() {
    const state = this.state;
    const nightWins = state.nightWins.slice();
    const totals = [0, 1].map((p) =>
      state.history.reduce((sum, entry) => sum + entry.scores[p].total, 0),
    );
    const sanity = state.players.map((player) => player.sanity);

    let winner = null;
    let tiebreak;
    if (nightWins[0] !== nightWins[1]) {
      winner = nightWins[0] > nightWins[1] ? 0 : 1;
      tiebreak = 'nightWins';
    } else if (totals[0] !== totals[1]) {
      winner = totals[0] > totals[1] ? 0 : 1;
      tiebreak = 'totalScore';
    } else if (sanity[0] !== sanity[1]) {
      winner = sanity[0] > sanity[1] ? 0 : 1;
      tiebreak = 'sanity';
    } else {
      tiebreak = 'draw';
    }

    this._gameOver(winner, 'tiebreak', { tiebreak, totalScores: totals });
  }

  _gameOver(winner, reason, extra = {}) {
    const state = this.state;
    if (state.phase === 'gameOver') return;
    state.phase = 'gameOver';
    state.current = null;
    state.result = {
      winner,
      reason,
      night: state.night,
      nightWins: state.nightWins.slice(),
      sanity: state.players.map((player) => player.sanity),
      ...extra,
    };
    this._emit({ type: 'gameOver', ...structuredClone(state.result) });
  }

  // ── sanity / cards ──────────────────────────────────────────────────

  _changeSanity(p, delta, reason) {
    const player = this.state.players[p];
    const from = player.sanity;
    const to = clampSanity(from + delta);
    if (to === from) return 0;
    player.sanity = to;
    this._emit({ type: 'sanityChange', player: p, from, to, reason });
    this._syncHandFaces(p);
    return to - from;
  }

  _syncHandFaces(p) {
    const player = this.state.players[p];
    const face = faceForSanity(player.sanity);
    let changed = false;
    for (const inst of player.hand) {
      inst.faceDown = false;
      if (inst.face !== face) {
        inst.face = face;
        changed = true;
      }
    }
    if (changed) this._emit({ type: 'handFlip', player: p, face });
  }

  _checkSanityZero() {
    const state = this.state;
    if (state.phase === 'gameOver') return true;
    const s0 = state.players[0].sanity;
    const s1 = state.players[1].sanity;
    if (s0 > SANITY_MIN && s1 > SANITY_MIN) return false;
    if (s0 === SANITY_MIN && s1 === SANITY_MIN) {
      this._gameOver(null, 'sanity');
    } else if (s0 === SANITY_MIN) {
      this._gameOver(1, 'sanity');
    } else {
      this._gameOver(0, 'sanity');
    }
    return true;
  }

  _draw(p, count, emit = true) {
    const state = this.state;
    const player = state.players[p];
    const actual = Math.min(count, player.deck.length);
    if (actual <= 0) return 0;
    const drawn = player.deck.splice(0, actual);
    const face = faceForSanity(player.sanity);
    for (const inst of drawn) {
      inst.face = face;
      inst.faceDown = false;
      player.hand.push(inst);
    }
    if (emit) this._emit({ type: 'draw', player: p, count: actual });
    return actual;
  }

  // ── action generation ───────────────────────────────────────────────

  _mulliganActions(p) {
    const hand = this.state.players[p].hand;
    const uids = hand.map((inst) => inst.uid);
    const actions = [{ type: 'mulligan', player: p, uids: [], label: 'Keep hand' }];
    for (let i = 0; i < uids.length; i++) {
      actions.push({
        type: 'mulligan',
        player: p,
        uids: [uids[i]],
        label: 'Mulligan 1 card',
      });
    }
    for (let i = 0; i < uids.length; i++) {
      for (let j = i + 1; j < uids.length; j++) {
        actions.push({
          type: 'mulligan',
          player: p,
          uids: [uids[i], uids[j]],
          label: 'Mulligan 2 cards',
        });
      }
    }
    return actions;
  }

  _legalPlays(p) {
    const state = this.state;
    const player = state.players[p];
    const face = faceForSanity(player.sanity);
    const actions = [];

    for (const inst of player.hand) {
      const card = this.cardIndex[inst.cardId];
      if (!isUnitCard(card)) continue;
      const sanityCost = Math.max(0, card.sanityCost ?? 0);
      if (sanityCost > player.sanity) continue;

      let locations;
      if (card.location === 'any') locations = ['scene', 'archive', 'dream'];
      else if (LOCATIONS.includes(card.location)) locations = [card.location];
      else locations = [];
      if (locations.includes('dream') && face !== 'madness') {
        locations = locations.filter((location) => location !== 'dream');
      }

      const stealth = isStealth(card);
      for (const location of locations) {
        const row = player.board[location];
        for (let slot = 0; slot < row.length; slot++) {
          if (row[slot]) continue;
          const variants = stealth ? (location === 'dream' ? [true] : [false, true]) : [false];
          for (const faceDown of variants) {
            actions.push({
              type: 'playCard',
              player: p,
              uid: inst.uid,
              cardId: inst.cardId,
              location,
              slot,
              faceDown,
              face,
              label: `Play ${card.name} → ${LOCATION_LABELS[location]}#${slot}${faceDown ? ' (face-down)' : ''}`,
            });
          }
        }
      }
    }

    return actions;
  }

  _emit(event) {
    this.state.events.push(event);
  }
}

export function createGame(options = {}) {
  const config = normalizeOptions(options);
  const state = createInitialState(config);
  const engine = new EngineV2(config, state);
  engine._setup();
  return engine;
}

/** Convenience re-export used by tests and self-play. */
export { countCards, faceForSanity, scorePlayer };
