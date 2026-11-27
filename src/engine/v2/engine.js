/**
 * Greyharbor v2.2 — headless, deterministic, DOM-free rules engine.
 *
 * Phase 2.2a adds the structured effect layer, all eight card types, the six
 * keyword primitives, faction passives and the two leader active skills.
 * Twenty-two cards still have no card-text effect (registered null); their
 * keyword primitives (stealth / chain / backlash …) remain active because
 * keywords are engine rules, not card text.
 *
 * All randomness goes through the injected seeded RNG in ../rng.js.
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
  currentUnitPower,
  faceForSanity,
  hasBacklash,
  hasKeyword,
  hasUnsealedAltar,
  isCorruptionImmune,
  isSealImmune,
  isStealth,
  isUnitCard,
  scorePlayer,
} from './scoring.js';
import {
  effectsFor,
  equipmentSpecFor,
  hasSacrificeReplacement,
} from './effects/registry.js';
import { SIDE, TRIGGER } from './effects/dsl.js';
import {
  canPlayCard,
  choiceEntryMatches,
  enumerateEffectChoices,
  makeContext,
  runEffect,
  runTrigger,
} from './effects/interpreter.js';
import { enumerateCandidates, resolveTargetByUid } from './effects/targets.js';
import { drawAnomaly } from './anomalies.js';
import { drawChaosToken } from './chaos-bag.js';
import {
  OBJECTIVE_THRESHOLD,
  thresholdForFaction,
  objectiveMetaForFaction,
  objectiveTypeForFaction,
} from './objectives.js';
import { buildView } from './view.js';

const ENGINE_VERSION = '2.2';

function fail(error) {
  return { ok: false, error };
}

function isPlayerIndex(value) {
  return value === 0 || value === 1;
}

function newInstance(uid, cardId, owner, face) {
  return {
    uid,
    cardId,
    owner,
    face,
    faceDown: false,
    zone: 'deck',
    location: null,
    slot: null,
    sealed: false,
    sealedNight: null,
    corruptionTokens: [],
    corruptionLoss: 0,
    permanentPower: 0,
    thisNightPower: 0,
    equipment: null,
    attachedTo: null,
    enteredNight: null,
    chaosToken: null,
  };
}

function resolveDeckSpec(spec, cardIndex) {
  let raw = spec;
  let presetFaction = null;
  let presetName = null;
  if (typeof raw === 'string') {
    const preset = PRESET_DECKS[raw];
    if (!preset) throw new Error(`unknown preset deck: ${raw}`);
    raw = preset;
    presetFaction = preset.faction;
    presetName = preset.name;
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
  if (leaderId !== null) {
    const leader = cardIndex[leaderId];
    if (!leader) throw new Error(`unknown leader id: ${leaderId}`);
    if (leader.type !== 'leader') throw new Error(`${leaderId} is not a leader`);
  }

  let faction = raw.faction ?? presetFaction;
  if (!faction && leaderId) faction = cardIndex[leaderId]?.faction ?? null;
  if (!faction) faction = 'neutral';

  return {
    id: raw.id ?? null,
    name: raw.name ?? presetName ?? raw.id ?? 'custom',
    faction,
    leaderId,
    cardIds,
  };
}

const COMPENSATION_KEYS = Object.freeze([
  'extraMulligan',
  'extraStartingCard',
  'night1Sanity',
]);

/**
 * Balance-patch v1.1 hooks. All values are non-negative integers; 0 means the
 * mechanism is disabled.
 *
 * During the experiment all three defaults were 0 (pre-patch behaviour). The
 * v1.1 final rule enables extraMulligan=2 for the night-1 first player, the
 * only candidate inside the pre-registered 45–55% first-player band with no
 * material sanity-ending shift. Explicit options still override it.
 */
const COMPENSATION_DEFAULTS = Object.freeze({
  extraMulligan: 2,
  extraStartingCard: 0,
  night1Sanity: 0,
});

function normalizeCompensation(raw = {}) {
  if (raw === null || raw === undefined) raw = {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('firstPlayerCompensation must be an object');
  }
  const out = {};
  for (const key of COMPENSATION_KEYS) {
    const value = raw[key] ?? COMPENSATION_DEFAULTS[key];
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${key} must be a non-negative integer`);
    }
    out[key] = value;
  }
  return out;
}

function normalizeOptions(options = {}) {
  const seed = options.seed ?? 'greyharbor';
  const cardIndex = makeCardIndex(options.cardPool ?? CARDS);

  const rawDecks = options.decks ?? DEFAULT_DECK_ORDER.map((id) => PRESET_DECKS[id]);
  if (!Array.isArray(rawDecks) || rawDecks.length !== 2) {
    throw new Error('createGame() needs exactly two decks');
  }
  const decks = rawDecks.map((spec) => resolveDeckSpec(spec, cardIndex));

  // startingHand accepts a scalar (both seats) or a two-entry array so the
  // campaign can give elite/boss opponents a resource advantage without a new
  // game rule — mirroring how startingSanity accepts a per-player array.
  const handOption = options.startingHand ?? 8;
  const startingHand = (Array.isArray(handOption) ? handOption : [handOption, handOption])
    .map((value) => {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error('startingHand must be a non-negative integer');
      }
      return value;
    });
  if (startingHand.length !== 2) {
    throw new Error('startingHand array must contain two entries');
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

  // Experiment hook (defaults to the shipped constant in objectives.js) so a
  // diagnostic can sweep thresholds without editing the single source of truth.
  // Optional global override; when absent, each faction uses its own threshold.
  const objectiveThreshold = options.objectiveThreshold === undefined
    ? null
    : options.objectiveThreshold;
  if (objectiveThreshold !== null && (!Number.isInteger(objectiveThreshold) || objectiveThreshold < 1)) {
    throw new Error('objectiveThreshold must be a positive integer');
  }

  // Optional per-faction override map { society?, cult? }; lower priority than
  // the global objectiveThreshold above, higher than the shipped constants.
  let objectiveThresholds = null;
  if (options.objectiveThresholds !== undefined && options.objectiveThresholds !== null) {
    const src = options.objectiveThresholds;
    objectiveThresholds = {};
    for (const f of ['society', 'cult']) {
      const v = src[f];
      if (v !== undefined) {
        if (!Number.isInteger(v) || v < 1) throw new Error(`objectiveThresholds.${f} must be a positive integer`);
        objectiveThresholds[f] = v;
      }
    }
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
    objectiveThreshold,
    objectiveThresholds,
    names: names.map(String),
    compensation: normalizeCompensation(options.firstPlayerCompensation),
    mechanics: normalizeMechanics(options.mechanics),
  };
}

/**
 * v1.3 mechanics toggles. Both default to ON (shipped game). Deterministic
 * tests that isolate another rule can turn them off.
 */
const MECHANICS_DEFAULTS = Object.freeze({ anomaly: true, chaosBag: true, objectives: true });

function normalizeMechanics(raw = {}) {
  if (raw === null || raw === undefined) raw = {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('mechanics must be an object');
  }
  return {
    anomaly: raw.anomaly ?? MECHANICS_DEFAULTS.anomaly,
    chaosBag: raw.chaosBag ?? MECHANICS_DEFAULTS.chaosBag,
    objectives: raw.objectives ?? MECHANICS_DEFAULTS.objectives,
  };
}

function createInitialState(config) {
  const state = {
    version: ENGINE_VERSION,
    seed: config.seed,
    rngState: hashSeed(config.seed),
    cardIndex: config.cardIndex,
    phase: 'mulligan',
    night: 0,
    maxNights: config.maxNights,
    firstPlayer: null,
    // Night-1 coin is drawn during setup (after both decks are shuffled) so
    // compensation can identify its recipient before the mulligan batch.
    night1FirstPlayer: null,
    current: null,
    passed: [false, false],
    mulliganDone: [false, false],
    turnActionTaken: false,
    nightWins: [0, 0],
    history: [],
    players: config.decks.map((deck, p) => ({
      id: p,
      name: config.names[p],
      faction: deck.faction,
      leaderId: deck.leaderId,
      leaderUsedThisNight: false,
      leaderSealed: false,
      sanity: config.startingSanity[p],
      objective: 0,
      deck: [],
      hand: [],
      discard: [],
      abyss: [],
      board: Object.fromEntries(
        LOCATIONS.map((location) => [location, Array(LOCATION_CAPACITY[location]).fill(null)]),
      ),
      locations: Object.fromEntries(LOCATIONS.map((location) => [location, null])),
      flags: {
        libraryDiscountUsed: false,
        cultSacrificeTriggered: false,
      },
      privateNotes: [],
      lastSacrificedUid: null,
    })),
    environments: [],
    effects: [],
    events: [],
    anomaly: null,
    mechanics: config.mechanics,
    result: null,
  };

  for (let p = 0; p < 2; p++) {
    const face = faceForSanity(state.players[p].sanity);
    const instances = config.decks[p].cardIds.map((cardId, index) =>
      newInstance(`p${p}-${index + 1}`, cardId, p, face),
    );
    state.players[p].deck = shuffle(state, instances);
  }

  // The coin is the same seeded randInt(2) as the pre-patch night-1 start,
  // simply resolved one batch earlier so the mulligan limit and the sanity
  // bonus can be attached to the same player.
  state.night1FirstPlayer = randInt(state, 2);

  const sanityBonus = config.compensation.night1Sanity;
  if (sanityBonus > 0) {
    const p = state.night1FirstPlayer;
    const player = state.players[p];
    const boosted = clampSanity(player.sanity + sanityBonus);
    if (boosted !== player.sanity) {
      player.sanity = boosted;
      const face = faceForSanity(boosted);
      for (const inst of player.deck) inst.face = face;
    }
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
    return [
      ...this._legalReveals(p),
      ...this._legalPlays(p),
      ...this._legalLeaderActions(p),
      { type: 'pass', player: p, label: '过牌' },
    ];
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
      players: state.players.map((p) => ({
        id: p.id,
        name: p.name,
        faction: p.faction,
        leaderId: p.leaderId,
      })),
      decks: this.config.decks.map((d) => d.name),
    });
    for (const p of [0, 1]) {
      const count = this._draw(p, this.config.startingHand[p], false);
      this._emit({ type: 'deal', player: p, count });
    }
    for (const p of [0, 1]) this._syncHandFaces(p);

    const comp = this.config.compensation;
    if (comp.extraMulligan || comp.extraStartingCard || comp.night1Sanity) {
      this._emit({
        type: 'firstPlayerCompensation',
        firstPlayer: state.night1FirstPlayer,
        extraMulligan: comp.extraMulligan,
        extraStartingCard: comp.extraStartingCard,
        night1Sanity: comp.night1Sanity,
      });
    }
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
      case 'reveal':
        return this._applyReveal(action);
      case 'useLeader':
        return this._applyUseLeader(action);
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
    const limit = this._mulliganLimit(p);
    if (uids.length > limit) return fail(`mulligan allows at most ${limit} cards`);
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
    }
    return { ok: true };
  }

  // ── playing cards ───────────────────────────────────────────────────

  _applyPlayCard(action) {
    const state = this.state;
    if (state.phase !== 'play') return fail('cards can only be played during a night');

    const p = action.player ?? state.current;
    if (!isPlayerIndex(p)) return fail('playCard needs player 0 or 1');
    if (p !== state.current) return fail('not this player\'s turn');
    if (state.passed[p]) return fail('this player has already passed');
    if (state.turnActionTaken) return fail('the turn action has already been taken');

    const player = state.players[p];
    const uid = action.uid;
    if (typeof uid !== 'string') return fail('playCard needs a card uid');
    const handIndex = player.hand.findIndex((inst) => inst.uid === uid);
    if (handIndex < 0) return fail(`card ${uid} is not in player ${p}'s hand`);

    const inst = player.hand[handIndex];
    const card = this.cardIndex[inst.cardId];
    if (!card) return fail(`unknown card: ${inst.cardId}`);

    const baseSanityCost = Math.max(0, card.sanityCost ?? 0);
    const face = faceForSanity(player.sanity);
    let plan;
    switch (card.type) {
      case 'unit':
      case 'oldgod':
        plan = this._validateUnitPlay(p, card, action, face, baseSanityCost);
        break;
      case 'event':
      case 'ritual':
        plan = this._validateEffectCardPlay(p, card, action, face);
        break;
      case 'equipment':
        plan = this._validateEquipmentPlay(p, card, action);
        break;
      case 'location':
        plan = this._validateLocationPlay(p, card, action);
        break;
      case 'environment':
        plan = this._validateEnvironmentPlay(p, card, action);
        break;
      case 'leader':
        return fail('leaders are never played from hand');
      default:
        return fail(`unsupported card type: ${card.type}`);
    }
    if (!plan.ok) return plan;

    // Old Library: the first archive card each night costs 1 less, but only
    // when the discount actually reduces a positive printed cost (§5.4).
    const discount = this._archiveDiscount(p, plan, baseSanityCost);
    const sanityCost = Math.max(0, baseSanityCost - discount);
    if (sanityCost > player.sanity) return fail(`${card.name} costs ${sanityCost} sanity`);

    // Commit.
    player.hand.splice(handIndex, 1);
    inst.face = face;
    inst.enteredNight = state.night;
    if (discount > 0) {
      this.state.players[p].flags.libraryDiscountUsed = true;
      this._emit({ type: 'archiveDiscount', player: p, cardId: inst.cardId, amount: discount });
    }
    if (sanityCost > 0) this._changeSanity(p, -sanityCost, 'sanityCost');

    if (plan.kind === 'unit') {
      const { location, slot, faceDown } = plan;
      inst.faceDown = faceDown;
      inst.location = location;
      inst.slot = slot;
      inst.zone = 'board';
      player.board[location][slot] = inst;

      this._emit({
        type: 'play',
        player: p,
        uid: inst.uid,
        cardId: inst.cardId,
        name: card.name,
        cardType: card.type,
        location,
        slot,
        face,
        faceDown,
        sanityCost,
      });

      if (!faceDown) {
        // A Society investigator deploying face-up on the front gathers 1 clue.
        if (player.faction === 'society') {
          this._gainObjective(p, 1, 'frontEntry');
        }
        this._drawChaosFor(p, inst);
        this._runOnPlay(p, inst, card, action.choice ?? null);
        this._applyAnomalyEntry(p, inst, location);
        this._maybeBacklash(p, inst, card, { context: 'entry' });
      }
    } else if (plan.kind === 'event' || plan.kind === 'ritual') {
      this._emit({
        type: 'play',
        player: p,
        uid: inst.uid,
        cardId: inst.cardId,
        name: card.name,
        cardType: card.type,
        location: null,
        slot: null,
        face,
        faceDown: false,
        sanityCost,
      });
      // v1.4: casting a Cult ritual adds 1 doom.
      if (card.type === 'ritual') this._gainObjective(p, 1, 'ritual');
      this._runOnPlay(p, inst, card, action.choice ?? null);
      this._discardInstance(p, inst, 'resolved', { emit: true });
    } else if (plan.kind === 'equipment') {
      const host = player.board[plan.location][plan.slot];
      inst.zone = 'attached';
      inst.location = plan.location;
      inst.slot = plan.slot;
      inst.attachedTo = host.uid;
      host.equipment = inst;
      this._emit({
        type: 'attach',
        player: p,
        uid: inst.uid,
        cardId: inst.cardId,
        name: card.name,
        hostUid: host.uid,
        location: plan.location,
        slot: plan.slot,
        sanityCost,
      });
      this._runOnPlay(p, inst, card, action.choice ?? null);
    } else if (plan.kind === 'location') {
      const previous = player.locations[plan.location];
      if (previous) {
        // A stronghold occupies a single slot; the old one is replaced.
        previous.attachedTo = null;
        this._discardInstance(p, previous, 'strongholdReplaced');
      }
      inst.zone = 'locationSlot';
      inst.location = plan.location;
      inst.slot = null;
      player.locations[plan.location] = inst;
      this._emit({
        type: 'locationPlay',
        player: p,
        uid: inst.uid,
        cardId: inst.cardId,
        name: card.name,
        location: plan.location,
        replacedUid: previous?.uid ?? null,
        sanityCost,
      });
      this._runOnPlay(p, inst, card, action.choice ?? null);
    } else if (plan.kind === 'environment') {
      inst.zone = 'environment';
      inst.location = 'all';
      state.environments.push(inst);
      this._emit({
        type: 'environmentPlay',
        player: p,
        uid: inst.uid,
        cardId: inst.cardId,
        name: card.name,
        sanityCost,
      });
      this._runOnPlay(p, inst, card, action.choice ?? null);
    }

    if (this._checkSanityZero()) return { ok: true };
    this._advanceAfterAction(p);
    this._autoPassStuck();
    return { ok: true };
  }

  _archiveDiscount(p, plan, baseCost) {
    if (baseCost < 1) return 0;
    const player = this.state.players[p];
    if (player.flags.libraryDiscountUsed) return 0;
    const library = player.locations?.front;
    if (!library || library.cardId !== 'old-library' || library.sealed) return 0;
    // The first unit played each night costs 1 less while the Old Library is
    // the front stronghold.
    if (plan.kind !== 'unit') return 0;
    return 1;
  }

  _validateUnitPlay(p, card, action, face, sanityCost) {
    const player = this.state.players[p];
    const location = action.location;
    if (!LOCATIONS.includes(location)) return fail(`invalid location: ${location}`);
    if (!this._unitLocationsForHand(card, face).includes(location)) {
      return fail(`${card.name} cannot be placed in ${location}`);
    }

    const faceDown = action.faceDown === true;
    if (faceDown && !isStealth(card)) return fail(`${card.name} has no stealth keyword`);

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

    const source = {
      kind: 'card',
      cardId: card.id,
      player: p,
      location,
      slot,
      inst: null,
    };
    const choiceError = this._validateEffectChoice(p, card, source, action.choice, faceDown);
    if (choiceError) return fail(choiceError);

    void sanityCost;
    return { ok: true, kind: 'unit', location, slot, faceDown };
  }

  _validateEffectCardPlay(p, card, action, face) {
    const source = { kind: 'card', cardId: card.id, player: p, location: null, slot: null, inst: null };
    if (!this._playConditionAllows(p, card.id, source, action.choice)) {
      return fail(`${card.name} cannot be played right now`);
    }
    const choiceError = this._validateEffectChoice(p, card, source, action.choice, false);
    if (choiceError) return fail(choiceError);
    void face;
    return { ok: true, kind: card.type };
  }

  _playConditionAllows(p, cardId, source, choice) {
    const ctx = makeContext(this, p, source, { trigger: TRIGGER.ON_PLAY, choice: choice ?? null });
    return canPlayCard(this, ctx, cardId);
  }

  _validateEquipmentPlay(p, card, action) {
    const player = this.state.players[p];
    const hostUid = action.hostUid;
    if (typeof hostUid !== 'string') return fail('equipment needs a hostUid');
    let found = null;
    for (const location of LOCATIONS) {
      for (let slot = 0; slot < player.board[location].length; slot++) {
        const candidate = player.board[location][slot];
        if (candidate?.uid === hostUid) found = { inst: candidate, location, slot };
      }
    }
    if (!found) return fail('equipment host must be an own board unit');
    if (found.inst.faceDown) return fail('equipment cannot attach to a face-down card');
    if (!isUnitCard(this.cardIndex[found.inst.cardId])) return fail('equipment host must be a unit');
    if (found.inst.equipment) return fail('that unit already has equipment');
    return { ok: true, kind: 'equipment', location: found.location, slot: found.slot };
  }

  _validateLocationPlay(p, card, action) {
    const player = this.state.players[p];
    // There is one stronghold slot on the front. A new stronghold replaces the
    // old one (the replaced card goes to discard); see _applyPlayCard.
    void action;
    void card;
    const location = 'front';
    return { ok: true, kind: 'location', location };
  }

  _validateEnvironmentPlay(p, card, action) {
    void p;
    void card;
    void action;
    return { ok: true, kind: 'environment' };
  }

  _validateEffectChoice(p, card, source, choice, faceDown) {
    const choiceList = this._effectChoiceList(p, card.id, source);
    if (faceDown) {
      if (choiceList && choice) return 'a face-down card cannot use its enter effect';
      return null;
    }
    if (!choiceList) {
      if (choice) return `${card.name} has no modal enter effect`;
      return null;
    }
    if (choiceList.length === 1 && choiceList[0] === null) {
      if (choice) return `${card.name} has no legal enter-effect target`;
      return null;
    }
    if (!choice) {
      // A skip/decline mode makes an omitted choice legal.
      const skip = choiceList.find((entry) => entry && this._isSkipChoice(card.id, entry.mode));
      return skip ? null : `${card.name} requires an enter-effect choice`;
    }
    const match = choiceList.find((entry) => choiceEntryMatches(entry, choice));
    if (!match) return `illegal enter-effect choice for ${card.name}`;
    return null;
  }

  _isSkipChoice(cardId, mode) {
    const entries = effectsFor(cardId) ?? [];
    for (const entry of entries) {
      if (!Array.isArray(entry.choices)) continue;
      if (entry.choices.some((choice) => choice.id === mode && choice.skip)) return true;
    }
    return false;
  }

  _effectChoiceList(p, cardId, source, trigger = TRIGGER.ON_PLAY) {
    const entries = effectsFor(cardId) ?? [];
    const modal = entries.find(
      (entry) => entry.trigger === trigger
        && Array.isArray(entry.choices)
        && entry.choices.length > 0,
    );
    if (!modal) return null;
    const ctx = makeContext(this, p, source, { trigger });
    return enumerateEffectChoices(this, ctx, modal);
  }

  _runOnPlay(p, inst, card, choice) {
    const entries = effectsFor(inst.cardId) ?? [];
    if (!entries.length) return;
    const ctx = makeContext(this, p, {
      kind: 'card',
      cardId: inst.cardId,
      inst,
      player: p,
      location: inst.location,
      slot: inst.slot,
    }, { trigger: TRIGGER.ON_PLAY, choice });
    runTrigger(this, ctx, TRIGGER.ON_PLAY);
    void card;
  }

  _runOnReveal(p, inst, choice = null) {
    const entries = effectsFor(inst.cardId) ?? [];
    if (!entries.length) return;
    const source = {
      kind: 'card',
      cardId: inst.cardId,
      inst,
      player: p,
      location: inst.location,
      slot: inst.slot,
    };
    const hasModal = entries.some(
      (entry) => entry.trigger === TRIGGER.ON_REVEAL
        && Array.isArray(entry.choices)
        && entry.choices.length > 0,
    );
    // Forced reveals (night end, effect-driven reveals) have no interactive
    // choice; resolve the first legal mode deterministically.
    const resolvedChoice = hasModal && !choice ? this._autoChoice(p, inst, this.cardIndex[inst.cardId], TRIGGER.ON_REVEAL) : choice;
    const ctx = makeContext(this, p, source, { trigger: TRIGGER.ON_REVEAL, choice: resolvedChoice });
    runTrigger(this, ctx, TRIGGER.ON_REVEAL);
  }

  // ── reveal ──────────────────────────────────────────────────────────

  _applyReveal(action) {
    const state = this.state;
    if (state.phase !== 'play') return fail('reveals are only allowed during a night');
    const p = action.player ?? state.current;
    if (!isPlayerIndex(p)) return fail('reveal needs player 0 or 1');
    if (p !== state.current) return fail('not this player\'s turn');
    if (state.passed[p]) return fail('this player has already passed');
    if (state.turnActionTaken) return fail('cards may only be revealed at the start of a turn');

    const uids = action.uids;
    if (!Array.isArray(uids) || uids.length === 0) return fail('reveal needs at least one uid');
    if (new Set(uids).size !== uids.length) return fail('reveal uids must be unique');
    if (action.choice && uids.length !== 1) {
      return fail('a reveal choice needs exactly one revealed card');
    }
    for (const uid of uids) {
      const target = resolveTargetByUid(this, uid);
      if (!target || target.kind !== 'unit' || target.player !== p) {
        return fail(`card ${uid} is not an own board unit`);
      }
      if (!target.inst.faceDown) return fail(`card ${uid} is already face-up`);
      if (action.choice) {
        const source = {
          kind: 'card',
          cardId: target.inst.cardId,
          inst: target.inst,
          player: p,
          location: target.location,
          slot: target.slot,
        };
        const choiceList = this._effectChoiceList(p, target.inst.cardId, source, TRIGGER.ON_REVEAL);
        const match = choiceList && choiceList.find((entry) => choiceEntryMatches(entry, action.choice));
        if (!match) return fail('illegal reveal choice');
      }
    }

    for (const uid of uids) this._revealByUid(uid, 'turn', action.choice ?? null);
    if (this._checkSanityZero()) return { ok: true };
    this._autoPassStuck();
    return { ok: true };
  }

  _revealByUid(uid, via, choice = null) {
    const target = resolveTargetByUid(this, uid);
    if (!target || target.kind !== 'unit' || !target.inst.faceDown) return;
    this._revealInstance(target.player, target.inst, target.location, target.slot, via, choice);
  }

  _revealInstance(p, inst, location, slot, via, choice = null) {
    if (!inst.faceDown) return;
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
      via,
    });
    const card = this.cardIndex[inst.cardId];
    // A face-down unit draws its chaos token and settles location anomaly
    // entry effects only when it becomes face-up.
    this._drawChaosFor(p, inst);
    this._applyAnomalyEntry(p, inst, location);
    this._runOnReveal(p, inst, choice);
    this._maybeBacklash(p, inst, card, { context: 'reveal' });
  }

  // ── leader active skills ────────────────────────────────────────────

  _leaderEffect(p) {
    const leaderId = this.state.players[p].leaderId;
    if (!leaderId) return null;
    const entries = effectsFor(leaderId) ?? [];
    return entries.find((entry) => entry.trigger === TRIGGER.LEADER_ACTIVE) ?? null;
  }

  _leaderAvailable(p) {
    const player = this.state.players[p];
    if (!player.leaderId) return false;
    if (player.leaderUsedThisNight || player.leaderSealed) return false;
    return !!this._leaderEffect(p);
  }

  _legalLeaderActions(p) {
    const state = this.state;
    if (state.phase !== 'play' || p !== state.current) return [];
    if (state.passed[p] || state.turnActionTaken) return [];
    if (!this._leaderAvailable(p)) return [];
    const effectDef = this._leaderEffect(p);
    const leaderId = state.players[p].leaderId;

    if (effectDef.leader) {
      return this._summonComposerActions(p, leaderId, effectDef);
    }

    const ctx = makeContext(this, p, {
      kind: 'leader',
      cardId: leaderId,
      player: p,
      location: null,
      slot: null,
      inst: null,
    }, { trigger: TRIGGER.LEADER_ACTIVE });

    // Target-less leader skill (e.g. Madeline's group cleanse): one action.
    if (!effectDef.target) {
      return [{
        type: 'useLeader',
        player: p,
        leaderId,
        targetUid: null,
        label: `${this.cardIndex[leaderId]?.nameZh ?? leaderId} 主动技`,
      }];
    }

    const blockedLocation = this._leaderBlockedLocation();
    const targets = enumerateCandidates(this, ctx, effectDef.target)
      .filter((target) => !blockedLocation || target.location !== blockedLocation);
    return targets.map((target) => ({
      type: 'useLeader',
      player: p,
      leaderId,
      targetUid: target.uid,
      label: `${this.cardIndex[leaderId]?.nameZh ?? leaderId} 主动技 → ${this.cardIndex[target?.cardId ?? target?.inst?.cardId]?.nameZh ?? target.uid}`,
    }));
  }

  /**
   * Enumerate every legal leader action for a data-driven summon composer.
   * One composer covers Elias (sacrifice → aberration), Enid (1 sanity → any
   * unit) and Vera (no cost → corrupted aberration). The cost/pool differences
   * all come from `effectDef.leader`; this method only builds the cross
   * product of cost branch × deck card × placement.
   */
  _summonComposerActions(p, leaderId, effectDef) {
    const player = this.state.players[p];
    const spec = effectDef.leader;
    const summon = spec.summon ?? {};
    const blockedLocation = this._leaderBlockedLocation();

    // 1. Sacrifice iterations. A sacrifice spec yields one per sacrificeable
    //    own unit, each carrying its Hooded Acolyte replacement options; a
    //    no-sacrifice spec yields one iteration with a single null option.
    //    The replacement stays the innermost loop below so the generated
    //    action order is identical to the original Elias enumeration and the
    //    evaluation AI's deterministic tie-breaks do not shift.
    const sacrificeIterations = [];
    if (spec.sacrifice) {
      const sacrificeTargets = this._sacrificeTargets(p);
      if (!sacrificeTargets.length) return [];
      for (const sacrifice of sacrificeTargets) {
        const replacementOptions = [null];
        for (const acolyte of this._replacementCandidates(p, sacrifice.inst.uid)) {
          replacementOptions.push(acolyte.uid);
        }
        sacrificeIterations.push({ sacrificeUid: sacrifice.inst.uid, replacementOptions });
      }
    } else {
      sacrificeIterations.push({ sacrificeUid: null, replacementOptions: [null] });
    }

    // 2. Summonable deck cards, unique by card id, filtered by summon.filter.
    const summonable = [];
    const seen = new Set();
    for (const inst of player.deck) {
      if (seen.has(inst.cardId)) continue;
      if (summon.filter === 'aberration') {
        if (!this._isAberration(inst.cardId)) continue;
      } else if (summon.filter === 'unit') {
        if (!isUnitCard(this.cardIndex[inst.cardId])) continue;
      }
      seen.add(inst.cardId);
      summonable.push(inst);
    }
    if (!summonable.length) return [];

    // 3. Cross product in the original order: sacrifice → card → placement →
    //    replacement (innermost).
    const actions = [];
    for (const iteration of sacrificeIterations) {
      for (const card of summonable) {
        const placements = this._legalEffectPlacements(p, card.cardId, {
          requireFaceUp: true,
        }).filter((placement) => !blockedLocation || placement.location !== blockedLocation);
        for (const placement of placements) {
          for (const replaceWithUid of iteration.replacementOptions) {
            actions.push({
              type: 'useLeader',
              player: p,
              leaderId,
              sacrificeUid: iteration.sacrificeUid,
              replaceWithUid,
              cardUid: card.uid,
              location: placement.location,
              slot: placement.slot,
              label: `${this.cardIndex[leaderId]?.nameZh ?? leaderId}：${iteration.sacrificeUid ? '献祭己方单位，' : ''}召唤「${this.cardIndex[card.cardId]?.nameZh ?? card.cardId}」到${LOCATION_LABELS[placement.location]}第 ${placement.slot + 1} 槽`,
            });
          }
        }
      }
    }
    return actions;
  }

  _applyUseLeader(action) {
    const state = this.state;
    if (state.phase !== 'play') return fail('leader skills are only allowed during a night');
    const p = action.player ?? state.current;
    if (!isPlayerIndex(p)) return fail('useLeader needs player 0 or 1');
    if (p !== state.current) return fail('not this player\'s turn');
    if (state.passed[p]) return fail('this player has already passed');
    if (state.turnActionTaken) return fail('the turn action has already been taken');
    const player = state.players[p];
    if (!player.leaderId) return fail('this player has no leader');
    if (player.leaderUsedThisNight) return fail('leader skill already used this night');
    if (player.leaderSealed) return fail('leader is sealed');

    const effectDef = this._leaderEffect(p);
    if (!effectDef) return fail('this leader has no active skill');

    if (effectDef.leader) {
      return this._applySummonComposer(p, effectDef, action);
    }
    if (!effectDef.target) return this._applyNoTargetLeader(p, effectDef);
    return this._applySimpleLeader(p, effectDef, action);
  }

  /** Target-less leader skill: run the registry effect without a chosen target. */
  _applyNoTargetLeader(p, effectDef) {
    const leaderId = this.state.players[p].leaderId;
    const ctx = makeContext(this, p, {
      kind: 'leader', cardId: leaderId, player: p, location: null, slot: null, inst: null,
    }, { trigger: TRIGGER.LEADER_ACTIVE });

    this._emit({
      type: 'leaderSkill',
      player: p,
      leaderId,
      targetUid: null,
      mode: effectDef.id,
    });
    runEffect(this, ctx, effectDef);
    this.state.players[p].leaderUsedThisNight = true;

    if (this._checkSanityZero()) return { ok: true };
    this._advanceAfterAction(p);
    this._autoPassStuck();
    return { ok: true };
  }

  /** Generic single-target leader skill (Harold seal, Gregor corruption, ...). */
  _applySimpleLeader(p, effectDef, action) {
    const leaderId = this.state.players[p].leaderId;
    const ctx = makeContext(this, p, {
      kind: 'leader', cardId: leaderId, player: p, location: null, slot: null, inst: null,
    }, { trigger: TRIGGER.LEADER_ACTIVE });
    const legal = effectDef.target ? enumerateCandidates(this, ctx, effectDef.target) : [];
    const target = legal.find((entry) => entry.uid === action.targetUid);
    if (!target) return fail('illegal leader target');
    // runEffect hands operations a null choice, so pin the validated target on
    // the context; target-keyed operations resolve it instead of re-enumerating.
    ctx.selected[effectDef.targetKey ?? 'targetUid'] = [target];

    this._emit({
      type: 'leaderSkill',
      player: p,
      leaderId,
      targetUid: target.uid,
      mode: effectDef.id,
    });
    // Every effect (seal / corrupt / buff / sanity) is a generic registry op.
    runEffect(this, ctx, effectDef);
    this.state.players[p].leaderUsedThisNight = true;

    if (this._checkSanityZero()) return { ok: true };
    this._advanceAfterAction(p);
    this._autoPassStuck();
    return { ok: true };
  }

  /** Data-driven summon composer (Elias / Enid / Vera). */
  _applySummonComposer(p, effectDef, action) {
    const player = this.state.players[p];
    const leaderId = player.leaderId;
    const spec = effectDef.leader;
    const summon = spec.summon ?? {};

    // 1. Resolve the sacrifice cost (no-op when the spec has no sacrifice).
    let sacrificeUid = null;
    let replaceWithUid = null;
    if (spec.sacrifice) {
      const sacrifice = this._sacrificeTargets(p)
        .find((entry) => entry.inst.uid === action.sacrificeUid);
      if (!sacrifice) return fail('leader needs a sacrificeable own unit');
      sacrificeUid = sacrifice.inst.uid;
      replaceWithUid = action.replaceWithUid ?? null;
      if (replaceWithUid !== null) {
        const replacement = this._replacementCandidates(p, sacrificeUid)
          .find((entry) => entry.uid === replaceWithUid);
        if (!replacement) return fail('replacement must be an eligible Hooded Acolyte');
      }
    }

    // 2. The deck card must match the declared summon filter.
    const deckIndex = player.deck.findIndex((inst) => inst.uid === action.cardUid);
    if (deckIndex < 0) return fail('leader must summon a card from the deck');
    const summonedId = player.deck[deckIndex].cardId;
    if (summon.filter === 'aberration' && !this._isAberration(summonedId)) {
      return fail('this leader may only summon an aberration unit');
    }
    if (summon.filter === 'unit' && !isUnitCard(this.cardIndex[summonedId])) {
      return fail('this leader may only summon a unit');
    }

    // 3. The placement must be legal.
    const placement = this._legalEffectPlacements(p, summonedId, { requireFaceUp: true })
      .find((entry) => entry.location === action.location && entry.slot === action.slot);
    if (!placement) return fail('no legal placement for that card');

    this._emit({
      type: 'leaderSkill',
      player: p,
      leaderId,
      sacrificeUid,
      replaceWithUid,
      cardUid: action.cardUid,
      location: placement.location,
      slot: placement.slot,
    });

    // 4. Pay costs: sacrifice first, then a fixed sanity cost (Enid).
    if (sacrificeUid) {
      this._sacrificeUnit(p, sacrificeUid, {
        replacementUid: replaceWithUid,
        sourceUid: null,
        allowReplacement: true,
      });
    }
    if (summon.sanityCost) {
      this._changeSanity(p, -summon.sanityCost, 'leaderEnid');
    }

    // 5. Move the card from the deck onto the board.
    const inst = player.deck.splice(deckIndex, 1)[0];
    this._placeFromDeck(p, inst, placement, { byLeader: leaderId });

    // 6. Optional attached corruption (Vera).
    if (summon.attachCorruption) {
      const corruptionCtx = makeContext(this, p, {
        kind: 'leader', cardId: leaderId, player: p,
      }, { trigger: TRIGGER.LEADER_ACTIVE });
      this._applyCorruption(p, {
        kind: 'unit',
        uid: inst.uid,
        inst,
        player: p,
        location: placement.location,
        slot: placement.slot,
      }, summon.attachCorruption, corruptionCtx);
    }

    player.leaderUsedThisNight = true;
    if (this._checkSanityZero()) return { ok: true };
    this._advanceAfterAction(p);
    this._autoPassStuck();
    return { ok: true };
  }

  // ── placement helpers ───────────────────────────────────────────────

  _unitLocationsForHand(card, face) {
    // Every unit deploys on the single front line. Stealth units may choose
    // to enter face-down; that variant is built in _legalPlays.
    void card;
    void face;
    return ['front'];
  }

  _legalEffectPlacements(p, cardId, { requireFaceUp = true } = {}) {
    const player = this.state.players[p];
    const card = this.cardIndex[cardId];
    if (!isUnitCard(card)) return [];
    const face = faceForSanity(player.sanity);
    void requireFaceUp;
    const out = [];
    const row = player.board.front;
    for (let slot = 0; slot < row.length; slot++) {
      if (row[slot]) continue;
      out.push({ location: 'front', slot, face });
    }
    return out;
  }

  _placeFromDeck(p, inst, placement, { byLeader = null } = {}) {
    const player = this.state.players[p];
    const card = this.cardIndex[inst.cardId];
    inst.face = faceForSanity(player.sanity);
    inst.faceDown = false;
    inst.location = placement.location;
    inst.slot = placement.slot;
    inst.zone = 'board';
    inst.enteredNight = this.state.night;
    player.board[placement.location][placement.slot] = inst;
    this._emit({
      type: 'playFromDeck',
      player: p,
      uid: inst.uid,
      cardId: inst.cardId,
      name: card?.name ?? inst.cardId,
      location: placement.location,
      slot: placement.slot,
      face: inst.face,
      byLeader,
    });
    this._applyAnomalyEntry(p, inst, placement.location);
    this._runOnPlay(p, inst, card, this._autoChoice(p, inst, card));
    this._maybeBacklash(p, inst, card, { context: 'entry' });
  }

  _autoChoice(p, inst, card, trigger = TRIGGER.ON_PLAY) {
    const list = this._effectChoiceList(p, card.id, {
      kind: 'card',
      cardId: card.id,
      player: p,
      location: inst.location,
      slot: inst.slot,
      inst,
    }, trigger);
    if (!list || !list.length) return null;
    const first = list.find((entry) => entry && !this._isSkipChoice(card.id, entry.mode));
    return first
      ? {
        mode: first.mode,
        targetUid: first.targetUid,
        secondaryUids: first.secondaryUids ?? [],
        replaceWithUid: first.replaceWithUid ?? null,
      }
      : null;
  }

  // ── sacrifice / abyss ───────────────────────────────────────────────

  _sacrificeTargets(p) {
    const player = this.state.players[p];
    const out = [];
    for (const location of LOCATIONS) {
      const row = player.board[location];
      for (let slot = 0; slot < row.length; slot++) {
        const inst = row[slot];
        if (inst) out.push({ inst, location, slot });
      }
    }
    return out;
  }

  _replacementCandidates(p, excludeUid) {
    const player = this.state.players[p];
    const out = [];
    for (const location of LOCATIONS) {
      for (const inst of player.board[location]) {
        if (!inst) continue;
        if (inst.uid === excludeUid) continue;
        if (inst.faceDown || inst.sealed) continue;
        if (!hasSacrificeReplacement(inst.cardId)) continue;
        out.push(inst);
      }
    }
    return out;
  }

  _sacrificeUnit(p, uid, options = {}) {
    const state = this.state;
    const player = state.players[p];
    let found = null;
    for (const location of LOCATIONS) {
      const row = player.board[location];
      for (let slot = 0; slot < row.length; slot++) {
        if (row[slot]?.uid === uid) found = { inst: row[slot], location, slot };
      }
    }
    if (!found) throw new Error(`cannot sacrifice ${uid}: not an own board unit`);
    if (options.sourceUid && options.sourceUid === uid) {
      throw new Error('a card cannot sacrifice itself');
    }

    let sacrificed = found.inst;
    let replacedUid = null;
    if (options.replacementUid) {
      const replacement = this._replacementCandidates(p, uid)
        .find((entry) => entry.uid === options.replacementUid);
      if (!replacement) throw new Error('invalid sacrifice replacement');
      for (const location of LOCATIONS) {
        const row = player.board[location];
        for (let slot = 0; slot < row.length; slot++) {
          if (row[slot]?.uid === replacement.uid) {
            sacrificed = row[slot];
            replacedUid = found.inst.uid;
            found = { inst: sacrificed, location, slot };
          }
        }
      }
    }

    const card = this.cardIndex[sacrificed.cardId];
    const fromLocation = found.location;
    // Backlash is checked *before* this cleanup resets the seal flag: a sealed
    // madness unit never punishes its controller when it is sacrificed.
    const wasSealed = !!sacrificed.sealed;
    this._detachEquipment(p, sacrificed, 'hostSacrificed');
    player.board[fromLocation][found.slot] = null;
    sacrificed.location = null;
    sacrificed.slot = null;
    sacrificed.faceDown = false;
    sacrificed.sealed = false;
    sacrificed.sealedNight = null;
    sacrificed.corruptionTokens = [];
    sacrificed.corruptionLoss = 0;
    sacrificed.zone = 'abyss';
    player.abyss.push(sacrificed);
    player.lastSacrificedUid = sacrificed.uid;

    this._emit({
      type: 'sacrifice',
      player: p,
      uid: sacrificed.uid,
      cardId: sacrificed.cardId,
      name: card?.name ?? sacrificed.cardId,
      replacedUid,
      fromLocation,
      face: sacrificed.face,
      abyss: true,
    });

    // v1.4: a Cult sacrifice (devour also routes through here) adds 1 doom.
    if (player.faction === 'cult') this._gainObjective(p, 1, 'sacrifice');
    this._maybeBacklash(p, sacrificed, card, { context: 'sacrifice', fromLocation, sealed: wasSealed });
    this._triggerCultEcho(p);
    return sacrificed;
  }

  _triggerCultEcho(p) {
    const player = this.state.players[p];
    // The first-sacrifice echo is Elias Thorne's character passive, not a
    // faction-wide rule, so other cult characters do not trigger it.
    if (player.leaderId !== 'elias-thorne') return;
    if (player.flags.cultSacrificeTriggered) return;
    player.flags.cultSacrificeTriggered = true;
    this._emit({
      type: 'cultEcho',
      player: p,
      // Balance patch v1.2: echo reduced from +2 (altar +3) to +1 (altar +1).
      // Must stay in sync with scoring.js thisNightBonus().
      bonus: 1,
    });
  }

  _maybeBacklash(p, inst, card, { context, fromLocation = null, sealed = null } = {}) {
    if (!hasBacklash(card)) return;
    if (sealed ?? inst.sealed) return;
    if (inst.face !== 'madness') return;
    if (context === 'sacrifice' && fromLocation === 'front' && hasUnsealedAltar(this.state, p)) {
      return;
    }
    this._emit({
      type: 'backlash',
      player: p,
      uid: inst.uid,
      cardId: inst.cardId,
      context,
    });
    this._changeSanity(p, -1, 'backlash');
  }

  // ── seal / corruption ───────────────────────────────────────────────

  _sealTarget(target, duration = 'untilNextNight', ctx = null) {
    if (!target?.inst) throw new Error('seal needs a concrete card target');
    if (target.kind === 'unit' && target.inst.faceDown) {
      throw new Error('face-down cards cannot be sealed');
    }
    if (isSealImmune(this.state, target.player, target.inst, target.location ?? null)) {
      this._emit({
        type: 'sealBlocked',
        player: ctx?.controller ?? null,
        targetPlayer: target.player,
        uid: target.uid,
        cardId: target.inst.cardId,
        kind: target.kind,
        reason: 'immune',
      });
      return false;
    }
    if (this._trySilverLantern(target, 'seal')) return false;
    const refreshed = !!target.inst.sealed;
    target.inst.sealed = true;
    target.inst.sealedNight = this.state.night;
    this._emit({
      type: 'seal',
      player: ctx?.controller ?? null,
      targetPlayer: target.player,
      uid: target.uid,
      cardId: target.inst.cardId,
      kind: target.kind,
      duration,
      refreshed,
    });
    return true;
  }

  /**
   * Silver Lantern replacement (§5.6/§9.9): when the equipped host is about to
   * be sealed or destroyed, discard the unsealed lantern instead and cancel
   * the event.  Sacrifice/devour never route through this helper.
   */
  _trySilverLantern(target, eventKind) {
    if (target?.kind !== 'unit' || !target.inst) return false;
    const equipment = target.inst.equipment;
    if (!equipment || equipment.sealed) return false;
    const spec = equipmentSpecFor(equipment.cardId);
    if (!spec) return false;
    if (eventKind === 'seal' && !spec.replaceOnSeal) return false;
    if (eventKind === 'destroy' && !spec.replaceOnDestroy) return false;
    target.inst.equipment = null;
    equipment.attachedTo = null;
    this._discardInstance(target.player, equipment, 'silverLantern');
    this._emit({
      type: 'silverLanternReplace',
      player: target.player,
      hostUid: target.uid,
      equipmentUid: equipment.uid,
      event: eventKind,
    });
    return true;
  }

  _sealLeader(targetPlayer, duration = 'untilNextNight', ctx = null) {
    const player = this.state.players[targetPlayer];
    if (!player?.leaderId) return false;
    const refreshed = !!player.leaderSealed;
    player.leaderSealed = true;
    this._emit({
      type: 'sealLeader',
      player: ctx?.controller ?? null,
      targetPlayer,
      leaderId: player.leaderId,
      duration,
      refreshed,
    });
    return true;
  }

  _removeSeal(target) {
    if (!target?.inst || !target.inst.sealed) return;
    target.inst.sealed = false;
    target.inst.sealedNight = null;
    this._emit({
      type: 'sealRemoved',
      targetPlayer: target.player,
      uid: target.uid,
      cardId: target.inst.cardId,
      kind: target.kind,
    });
  }

  _applyCorruption(controller, target, amount = 1, ctx = null) {
    if (!target?.inst || target.kind !== 'unit') return;
    if (target.inst.faceDown) return;
    if (isCorruptionImmune(this.state, target.player, target.inst, target.location ?? null)) {
      this._emit({
        type: 'corruptionBlocked',
        player: controller,
        targetPlayer: target.player,
        uid: target.uid,
        cardId: target.inst.cardId,
        reason: 'immune',
      });
      return;
    }
    const { state } = this;
    const inst = target.inst;
    inst.corruptionTokens ??= [];
    if (inst.corruptionTokens.length >= 3) return;
    const capacity = 3 - inst.corruptionTokens.length;
    const added = Math.min(capacity, amount);
    for (let i = 0; i < added; i++) {
      inst.corruptionTokens.push({ appliedNight: state.night, source: ctx?.source?.cardId ?? null });
    }
    this._recomputeCorruption(inst);
    this._emit({
      type: 'corruption',
      player: controller,
      targetPlayer: target.player,
      uid: uidOf(inst),
      cardId: inst.cardId,
      added,
      tokens: inst.corruptionTokens.length,
      loss: inst.corruptionLoss,
    });
  }

  _removeCorruption(target, amount = 1) {
    if (!target?.inst) return;
    const inst = target.inst;
    if (!inst.corruptionTokens?.length) return;
    const removeCount = amount === 'all' ? inst.corruptionTokens.length : Math.min(amount, inst.corruptionTokens.length);
    // Remove the newest tokens first: the player chooses which marker to lose.
    inst.corruptionTokens.sort((a, b) => a.appliedNight - b.appliedNight);
    inst.corruptionTokens.splice(inst.corruptionTokens.length - removeCount, removeCount);
    this._recomputeCorruption(inst);
    this._emit({
      type: 'corruptionRemoved',
      targetPlayer: target.player,
      uid: inst.uid,
      cardId: inst.cardId,
      removed: removeCount,
      tokens: inst.corruptionTokens.length,
      loss: inst.corruptionLoss,
    });
  }

  _recomputeCorruption(inst) {
    // Each night is a self-contained clash, so every corruption token is an
    // immediate -1 power while it stays on the unit (cap 3 → at most -3).
    inst.corruptionLoss = (inst.corruptionTokens ?? []).length;
  }

  // ── other primitives used by the interpreter ────────────────────────

  _peekRandomHandCard(controller, side, options = {}) {
    const state = this.state;
    const targetPlayer = side === SIDE.ENEMY ? 1 - controller : controller;
    const hand = state.players[targetPlayer].hand;
    if (!hand.length) {
      this._emit({
        type: 'peek',
        player: controller,
        targetPlayer,
        cardId: null,
        private: true,
        night: state.night,
      });
      return;
    }
    const inst = hand[randInt(state, hand.length)];
    const card = this.cardIndex[inst.cardId];
    const isPrivate = options.private !== false;
    if (isPrivate) {
      state.players[controller].privateNotes.push({
        night: state.night,
        sourceUid: options.source?.inst?.uid ?? null,
        targetPlayer,
        cardId: inst.cardId,
        name: card?.name ?? inst.cardId,
      });
    }
    this._emit({
      type: 'peek',
      player: controller,
      targetPlayer,
      cardId: inst.cardId,
      name: card?.name ?? inst.cardId,
      private: isPrivate,
      night: state.night,
      sourceUid: options.source?.inst?.uid ?? null,
    });
  }

  _playCardFromDeck(p, uid, placement, options = {}) {
    const player = this.state.players[p];
    const index = player.deck.findIndex((inst) => inst.uid === uid);
    if (index < 0) throw new Error(`card ${uid} is not in the deck`);
    const inst = player.deck.splice(index, 1)[0];
    if (options.paySanityCost) {
      const cost = Math.max(0, this.cardIndex[inst.cardId]?.sanityCost ?? 0);
      if (cost > 0) this._changeSanity(p, -cost, 'sanityCost');
    }
    this._placeFromDeck(p, inst, placement, { byLeader: options.source?.cardId ?? null });
    return inst;
  }

  _discardInstance(p, inst, reason, { emit = true } = {}) {
    if (!inst) return;
    inst.zone = 'discard';
    inst.faceDown = false;
    inst.location = null;
    inst.slot = null;
    inst.sealed = false;
    this.state.players[p].discard.push(inst);
    if (emit) {
      this._emit({
        type: 'discard',
        player: p,
        uid: inst.uid,
        cardId: inst.cardId,
        reason,
      });
    }
  }

  _discardFromZone(p, uid, reason) {
    const player = this.state.players[p];
    for (const zone of ['hand', 'deck', 'abyss']) {
      const index = (player[zone] ?? []).findIndex((inst) => inst.uid === uid);
      if (index >= 0) {
        const inst = player[zone].splice(index, 1)[0];
        this._discardInstance(p, inst, reason);
        return inst;
      }
    }
    return null;
  }

  _detachEquipment(p, host, reason) {
    if (!host.equipment) return;
    const equipment = host.equipment;
    host.equipment = null;
    equipment.attachedTo = null;
    this._discardInstance(p, equipment, reason);
  }

  /**
   * Night reset: equipment is not discarded with its host.  It returns to the
   * owner's hand so it can be attached again on a later night.  Generic over
   * every equipment card (no per-id branch).
   */
  _returnEquipmentToHand(p, equipment) {
    const player = this.state.players[p];
    equipment.attachedTo = null;
    equipment.zone = 'hand';
    equipment.faceDown = false;
    equipment.location = null;
    equipment.slot = null;
    equipment.sealed = false;
    equipment.face = faceForSanity(player.sanity);
    player.hand.push(equipment);
    this._emit({ type: 'equipmentToHand', player: p, uid: equipment.uid, cardId: equipment.cardId });
  }

  _moveAbyssToHand(p, uid, { excludeUid = null } = {}) {
    if (excludeUid && uid === excludeUid) throw new Error('a sacrifice cannot retrieve itself');
    const player = this.state.players[p];
    const index = player.abyss.findIndex((inst) => inst.uid === uid);
    if (index < 0) return null;
    const inst = player.abyss.splice(index, 1)[0];
    inst.zone = 'hand';
    inst.faceDown = false;
    inst.chaosToken = null;
    inst.face = faceForSanity(player.sanity);
    player.hand.push(inst);
    this._emit({ type: 'abyssToHand', player: p, uid: inst.uid, cardId: inst.cardId });
    return inst;
  }

  _moveDeckToHand(p, uid) {
    const player = this.state.players[p];
    const index = player.deck.findIndex((inst) => inst.uid === uid);
    if (index < 0) return null;
    const inst = player.deck.splice(index, 1)[0];
    inst.zone = 'hand';
    inst.faceDown = false;
    inst.face = faceForSanity(player.sanity);
    player.hand.push(inst);
    this._emit({ type: 'deckToHand', player: p, uid: inst.uid, cardId: inst.cardId });
    return inst;
  }

  _revealDeckTop(p, count = 3) {
    const player = this.state.players[p];
    const shown = player.deck.slice(0, count).map((inst) => ({
      uid: inst.uid,
      cardId: inst.cardId,
      name: this.cardIndex[inst.cardId]?.name ?? inst.cardId,
    }));
    this._emit({ type: 'revealDeckTop', player: p, count: shown.length, cards: shown });
    return shown;
  }

  _shuffleDeck(p) {
    const player = this.state.players[p];
    player.deck = shuffle(this.state, player.deck);
    this._emit({ type: 'shuffleDeck', player: p, count: player.deck.length });
  }

  /**
   * Register a persistent aura.  `record` is pure data (see registry addAura
   * ops); `target` is the chosen card/location-row.  Scoring reads these
   * records for power/seal/corruption modifiers, engine removes them on the
   * appropriate night boundary.
   */
  _addAura(record, target = null) {
    const state = this.state;
    const scope = { ...(record.scope ?? {}) };
    if (scope.locationFromTarget) {
      scope.location = target?.location ?? null;
      delete scope.locationFromTarget;
    }
    const aura = {
      id: `aura-${state.effects.length + 1}-${record.cardId ?? 'effect'}`,
      kind: 'aura',
      cardId: record.cardId ?? null,
      sourceUid: record.sourceUid ?? null,
      sourcePlayer: record.sourcePlayer,
      duration: record.duration ?? 'thisNight',
      requiresSourceActive: !!record.requiresSourceActive,
      scope,
      modifiers: { ...(record.modifiers ?? {}) },
      targetUid: target?.uid ?? null,
      location: scope.location ?? null,
    };
    state.effects.push(aura);
    this._emit({
      type: 'auraAdded',
      player: record.sourcePlayer,
      cardId: aura.cardId,
      duration: aura.duration,
      location: aura.location,
      modifiers: { ...aura.modifiers },
    });
    return aura;
  }

  _expireAuras(duration) {
    const state = this.state;
    if (!state.effects?.length) return;
    const kept = [];
    for (const aura of state.effects) {
      if (aura.duration === duration) {
        this._emit({
          type: 'auraExpired',
          player: aura.sourcePlayer,
          cardId: aura.cardId,
          duration,
        });
      } else {
        kept.push(aura);
      }
    }
    state.effects = kept;
  }

  /** Move any on-field card/environment to its owner's ordinary discard pile. */
  _removeFromPlay(target, reason = 'effect') {
    const state = this.state;
    if (!target) return false;
    const player = state.players[target.player];
    if (target.kind === 'environment') {
      const index = state.environments.findIndex((inst) => inst.uid === target.uid);
      if (index < 0) return false;
      const inst = state.environments.splice(index, 1)[0];
      this._discardInstance(inst.owner ?? target.player, inst, reason);
      return true;
    }
    if (target.kind === 'attached') {
      const host = target.host
        ?? player.board[target.location]?.[target.slot];
      if (host?.equipment?.uid === target.uid) {
        const inst = host.equipment;
        host.equipment = null;
        inst.attachedTo = null;
        this._discardInstance(target.player, inst, reason);
        return true;
      }
      return false;
    }
    if (target.kind === 'location') {
      const inst = player.locations?.[target.location];
      if (!inst || inst.uid !== target.uid) return false;
      player.locations[target.location] = null;
      this._discardInstance(target.player, inst, reason);
      return true;
    }
    if (target.kind === 'unit') {
      const row = player.board[target.location];
      const inst = row?.[target.slot];
      if (!inst || inst.uid !== target.uid) return false;
      this._detachEquipment(target.player, inst, 'hostLeft');
      row[target.slot] = null;
      inst.location = null;
      inst.slot = null;
      this._discardInstance(target.player, inst, reason);
      return true;
    }
    return false;
  }

  /** Generic destroy primitive (currently only exercised by tests). */
  _destroyTarget(target, reason = 'destroy') {
    if (!target) return false;
    if (target.kind === 'unit' && this._trySilverLantern(target, 'destroy')) return false;
    this._emit({
      type: 'destroy',
      targetPlayer: target.player,
      uid: target.uid,
      cardId: target.inst?.cardId ?? null,
      kind: target.kind,
      reason,
    });
    return this._removeFromPlay(target, reason);
  }

  _devour(p, uid, options = {}) {
    const source = options.sourceUid ? resolveTargetByUid(this, options.sourceUid) : null;
    const target = resolveTargetByUid(this, uid);
    if (!target || target.kind !== 'unit') return;
    // §6.4: Bell-Claw permanently gains the devoured unit's *current* power,
    // including equipment / night / chain bonuses.
    const power = currentUnitPower(this.state, target.player, target.inst, target.location, target.slot);
    const sacrificed = this._sacrificeUnit(p, uid, {
      sourceUid: source?.uid ?? null,
      allowReplacement: false,
    });
    if (source?.inst) {
      source.inst.permanentPower = (source.inst.permanentPower ?? 0) + power;
    }
    this._emit({
      type: 'devour',
      player: p,
      sourceUid: source?.uid ?? null,
      uid: sacrificed?.uid ?? uid,
      gained: power,
    });
  }

  // ── turn / night machinery ──────────────────────────────────────────

  _advanceAfterAction(p) {
    const state = this.state;
    state.turnActionTaken = true;
    if (state.phase !== 'play') return;
    const other = 1 - p;
    state.current = state.passed[other] ? p : other;
    state.turnActionTaken = false;
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

  _pass(p, auto) {
    const state = this.state;
    state.passed[p] = true;
    this._emit({ type: 'pass', player: p, auto: !!auto });
    if (state.passed[0] && state.passed[1]) {
      this._endNight();
    } else {
      state.current = 1 - p;
      state.turnActionTaken = false;
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
      const p = state.current;
      if (this._legalPlays(p).length > 0) break;
      if (this._legalLeaderActions(p).length > 0) break;
      this._pass(p, true);
      guard += 1;
      if (guard > 50) throw new Error('auto-pass guard tripped');
    }
  }

  _startNight(night) {
    const state = this.state;
    state.night = night;

    // 0. Draw and publicly reveal tonight's location anomaly before any
    //    player action so entry effects can reference it.
    if (state.mechanics.anomaly) {
      state.anomaly = drawAnomaly(state);
      this._emit({
        type: 'anomalyRevealed',
        anomaly: { ...state.anomaly },
      });
    } else {
      state.anomaly = null;
    }

    // 1. Expire "until next night" effects.
    this._expireSeals();
    this._expireAuras('untilNextNight');

    // 2. Reset per-night counters.
    for (const player of state.players) {
      player.leaderUsedThisNight = false;
      player.flags.libraryDiscountUsed = false;
      player.flags.cultSacrificeTriggered = false;
      for (const location of LOCATIONS) {
        for (const inst of player.board[location]) {
          if (inst) inst.thisNightPower = 0;
        }
      }
    }

    // 3. First player. The night-1 coin is the setup-time randInt(2);
    //    nights 2/3 keep the inherited "loser goes first" rotation (§2.3).
    if (night === 1) state.firstPlayer = state.night1FirstPlayer ?? randInt(state, 2);
    state.current = state.firstPlayer;
    state.passed = [false, false];
    state.turnActionTaken = false;
    for (const p of [0, 1]) this._syncHandFaces(p);

    // 4. Night-start triggers: first player first, then the other.
    for (const p of [state.firstPlayer, 1 - state.firstPlayer]) {
      this._corruptionTick(p);
      this._forcedSanityLoss(p);
      this._leaderNightStart(p);
      this._runNightStartEffects(p);
    }

    // 5. Sanity check after the whole batch.
    if (this._checkSanityZero()) return;

    // 6. Night 2/3 draw. On night 1 the compensated first player draws N
    //    through this same batch; _draw already applies §2.4 (deck exhaustion).
    const draws = [0, 0];
    if (night > 1) {
      for (const p of [0, 1]) draws[p] = this._draw(p, 2);
    } else if (this.config.compensation.extraStartingCard > 0) {
      draws[state.firstPlayer] = this._draw(
        state.firstPlayer,
        this.config.compensation.extraStartingCard,
      );
    }
    for (const p of [0, 1]) this._syncHandFaces(p);

    this._emit({
      type: 'nightStart',
      night,
      firstPlayer: state.firstPlayer,
      draws,
    });

    this._autoPassStuck();
  }

  _expireSeals() {
    const state = this.state;
    const expire = (p, inst, location, slot) => {
      if (!inst?.sealed) return;
      inst.sealed = false;
      inst.sealedNight = null;
      this._emit({
        type: 'sealExpire',
        player: p,
        uid: inst.uid,
        cardId: inst.cardId,
        location,
        slot,
      });
    };
    for (const p of [0, 1]) {
      const player = state.players[p];
      for (const location of LOCATIONS) {
        for (let slot = 0; slot < player.board[location].length; slot++) {
          const inst = player.board[location][slot];
          if (!inst) continue;
          expire(p, inst, location, slot);
          if (inst.equipment) expire(p, inst.equipment, location, slot);
        }
        expire(p, player.locations[location], location, null);
      }
      if (player.leaderSealed) {
        player.leaderSealed = false;
        this._emit({ type: 'leaderUnsealed', player: p });
      }
    }
    for (const inst of state.environments) expire(inst.owner, inst, 'environment', null);
  }

  _corruptionTick(p) {
    const player = this.state.players[p];
    for (const location of LOCATIONS) {
      for (const inst of player.board[location]) {
        if (!inst) continue;
        const tokens = inst.corruptionTokens?.length ?? 0;
        if (!tokens) continue;
        const before = inst.corruptionLoss ?? 0;
        this._recomputeCorruption(inst);
        const delta = inst.corruptionLoss - before;
        if (delta !== 0) {
          this._emit({
            type: 'corruptionTick',
            player: p,
            uid: inst.uid,
            cardId: inst.cardId,
            delta,
            loss: inst.corruptionLoss,
            tokens,
          });
        }
      }
    }
  }

  _forcedSanityLoss(p) {
    const player = this.state.players[p];
    for (const location of LOCATIONS) {
      for (const inst of player.board[location]) {
        if (!inst || inst.sealed) continue;
        const entries = effectsFor(inst.cardId) ?? [];
        const hasNightStart = entries.some((entry) => entry.trigger === TRIGGER.NIGHT_START);
        if (!hasNightStart) continue;
        const ctx = makeContext(this, p, {
          kind: 'card', cardId: inst.cardId, inst, player: p, location, slot: inst.slot,
        }, { trigger: TRIGGER.NIGHT_START });
        runTrigger(this, ctx, TRIGGER.NIGHT_START);
      }
    }
  }

  /**
   * Run the selected character's NIGHT_START effects. A sealed leader does not
   * trigger its passive; the registry entries themselves carry any conditions.
   */
  _leaderNightStart(p) {
    const player = this.state.players[p];
    if (!player.leaderId || player.leaderSealed) return;
    const entries = effectsFor(player.leaderId) ?? [];
    if (!entries.some((entry) => entry.trigger === TRIGGER.NIGHT_START)) return;
    const ctx = makeContext(this, p, {
      kind: 'leader',
      cardId: player.leaderId,
      player: p,
      location: null,
      slot: null,
      inst: null,
    }, { trigger: TRIGGER.NIGHT_START });
    runTrigger(this, ctx, TRIGGER.NIGHT_START);
  }

  _runNightStartEffects(p) {
    // Reserved for location/environment persistent effects in 2.2b.
    void p;
  }

  // ── v1.3 anomaly entry effects + chaos bag ─────────────────────────

  /** Apply the active anomaly's on-entry effects when a unit is face-up. */
  _applyAnomalyEntry(p, inst, location) {
    const anomaly = this.state.anomaly;
    if (!anomaly || anomaly.location !== location) return;
    if (anomaly.entryCorruption) {
      this._applyCorruption(
        p,
        { kind: 'unit', uid: inst.uid, inst, player: p, location, slot: inst.slot },
        anomaly.entryCorruption,
        null,
      );
    }
    if (anomaly.entrySanity) {
      this._changeSanity(p, anomaly.entrySanity, 'anomaly');
    }
  }

  /** Location that leader skills may not target tonight (null if none). */
  _leaderBlockedLocation() {
    const anomaly = this.state.anomaly;
    return anomaly?.leaderBlocked ? anomaly.location : null;
  }

  /** Draw a chaos token for a hand-played unit becoming face-up. */
  _drawChaosFor(p, inst) {
    if (!this.state.mechanics.chaosBag) return;
    const token = drawChaosToken(this.state);
    inst.chaosToken = {
      id: token.id,
      modifier: token.modifier,
      sanity: token.sanity,
    };
    this._emit({
      type: 'chaosDraw',
      player: p,
      uid: inst.uid,
      token: token.id,
      nameZh: token.nameZh,
      modifier: token.modifier,
    });
    if (token.sanity) this._changeSanity(p, token.sanity, 'chaosElderSign');
  }

  _endNight() {
    const state = this.state;
    if (state.phase !== 'play') return;
    const night = state.night;

    // 1. Reveal every face-down card: first player first, then the other.
    for (const p of [state.firstPlayer, 1 - state.firstPlayer]) {
      for (const location of LOCATIONS) {
        const row = state.players[p].board[location];
        for (let slot = 0; slot < row.length; slot++) {
          const inst = row[slot];
          if (!inst || !inst.faceDown) continue;
          this._revealInstance(p, inst, location, slot, 'nightEnd');
        }
      }
    }
    // Reveal batch sanity check happens before scoring.
    if (this._checkSanityZero()) return;

    // 2. Score.
    const score0 = scorePlayer(state, 0);
    const score1 = scorePlayer(state, 1);
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

    // Inherited v2.1 night penalty.  NOTE: the frozen rules text does not
    // mention it; it is kept so the phase-2.1 contract stays green and is
    // recorded as an open rules question in the transcript.
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

    // 3. Sanity zero takes precedence over a second night win.
    if (this._checkSanityZero()) return;

    if (state.phase === 'gameOver') return;

    // 4. Match win.
    if (winner !== null && state.nightWins[winner] >= 2) {
      this._gameOver(winner, 'nightWins', { decidedBy });
      return;
    }

    // 5. Cleanup this night (after scoring).
    this._cleanupNight();

    // 6. Three nights without a two-win player.
    if (state.night >= state.maxNights) {
      this._finalTiebreak();
      return;
    }

    // 7. Next night: loser goes first; a tie keeps the previous first player.
    if (!tie) state.firstPlayer = 1 - winner;
    this._startNight(state.night + 1);
  }

  _cleanupNight() {
    const state = this.state;
    for (const inst of state.environments) {
      this._discardInstance(inst.owner, inst, 'nightEndEnvironment');
    }
    state.environments = [];
    for (const player of state.players) {
      player.flags.cultSacrificeTriggered = false;
      // Each night is a self-contained clash: every unit on the front line is
      // cleared to discard (with its equipment). The stronghold persists.
      for (const location of LOCATIONS) {
        const row = player.board[location];
        for (let slot = 0; slot < row.length; slot++) {
          const inst = row[slot];
          if (!inst) continue;
          if (inst.equipment) {
            const equipment = inst.equipment;
            inst.equipment = null;
            // Equipment survives the night reset and returns to hand.
            this._returnEquipmentToHand(player.id, equipment);
          }
          this._discardInstance(player.id, inst, 'nightReset');
          row[slot] = null;
        }
      }
    }
    state.effects = state.effects.filter((entry) => entry.duration !== 'thisNight');
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

  /** True when either player is already at the sanity floor (0). */
  _sanityAtZero() {
    return this.state.players.some((pl) => pl.sanity <= SANITY_MIN);
  }

  /**
   * Add progress to a player's faction objective (Society clue / Cult doom).
   * Returns true when this gain reached the threshold and ended the game.
   * Sanity-zero takes precedence: if anyone is already at 0 sanity the progress
   * is still recorded, but no objective victory is declared (the sanity check
   * at the end of the action resolves it).
   */
  _gainObjective(p, amount, source) {
    const state = this.state;
    if (!state.mechanics.objectives) return false;
    if (state.phase === 'gameOver') return false;
    const player = state.players[p];
    const objectiveType = objectiveTypeForFaction(player.faction);
    if (!objectiveType || amount <= 0) return false;

    player.objective += amount;
    this._emit({
      type: 'objectiveGain',
      player: p,
      objectiveType,
      source,
      amount,
      total: player.objective,
    });

    const threshold = this.config.objectiveThreshold
      ?? this.config.objectiveThresholds?.[player.faction]
      ?? thresholdForFaction(player.faction);
    if (player.objective >= threshold && !this._sanityAtZero()) {
      this._gameOver(p, 'objective', { objectiveType });
      return true;
    }
    return false;
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
      inst.zone = 'hand';
      player.hand.push(inst);
    }
    if (emit) this._emit({ type: 'draw', player: p, count: actual });
    return actual;
  }

  // ── action generation ───────────────────────────────────────────────

  /** v1 default is 2; only the night-1 coin winner may get the extra bonus. */
  _mulliganLimit(p) {
    return 2 + (p === this.state.night1FirstPlayer
      ? this.config.compensation.extraMulligan
      : 0);
  }

  _mulliganActions(p) {
    const hand = this.state.players[p].hand;
    const uids = hand.map((inst) => inst.uid);
    const limit = Math.min(this._mulliganLimit(p), uids.length);
    const actions = [{ type: 'mulligan', player: p, uids: [], label: '保留手牌，不换' }];
    for (let count = 1; count <= limit; count++) {
      const emit = (start, chosen) => {
        if (chosen.length === count) {
          actions.push({
            type: 'mulligan',
            player: p,
            uids: chosen.map((i) => uids[i]),
            label: `换掉 ${count} 张牌`,
          });
          return;
        }
        for (let i = start; i <= uids.length - (count - chosen.length); i++) {
          chosen.push(i);
          emit(i + 1, chosen);
          chosen.pop();
        }
      };
      emit(0, []);
    }
    return actions;
  }

  _legalReveals(p) {
    const state = this.state;
    if (state.phase !== 'play' || p !== state.current) return [];
    if (state.passed[p] || state.turnActionTaken) return [];
    const actions = [];
    const all = [];
    let modalPending = false;
    for (const location of LOCATIONS) {
      const row = state.players[p].board[location];
      for (let slot = 0; slot < row.length; slot++) {
        const inst = row[slot];
        if (!inst?.faceDown) continue;
        all.push(inst.uid);
        const source = {
          kind: 'card',
          cardId: inst.cardId,
          inst,
          player: p,
          location,
          slot,
        };
        const choices = this._effectChoiceList(p, inst.cardId, source, TRIGGER.ON_REVEAL);
        if (choices && !(choices.length === 1 && choices[0] === null)) {
          modalPending = true;
          for (const choice of choices) {
            actions.push({
              type: 'reveal',
              player: p,
              uids: [inst.uid],
              choice: {
                mode: choice.mode,
                targetUid: choice.targetUid,
                secondaryUids: choice.secondaryUids ?? [],
                replaceWithUid: choice.replaceWithUid ?? null,
              },
              label: `翻开「${this.cardIndex[inst.cardId]?.nameZh ?? inst.cardId}」：${choice.label}`,
            });
          }
        } else {
          actions.push({
            type: 'reveal',
            player: p,
            uids: [inst.uid],
            label: `翻开「${this.cardIndex[inst.cardId]?.nameZh ?? inst.cardId}」（${LOCATION_LABELS[location]} 第 ${slot + 1} 槽）`,
          });
        }
      }
    }
    if (all.length > 1 && !modalPending) {
      actions.push({ type: 'reveal', player: p, uids: all, label: '翻开全部盖牌' });
    }
    return actions;
  }

  _isAberration(cardId) {
    const card = this.cardIndex[cardId];
    return !!card && (
      (card.faction === 'cult' && card.type === 'unit')
      || (card.faction === 'neutral' && card.type === 'oldgod')
    );
  }

  _legalPlays(p) {
    const state = this.state;
    const player = state.players[p];
    const face = faceForSanity(player.sanity);
    const actions = [];

    for (const inst of player.hand) {
      const card = this.cardIndex[inst.cardId];
      if (!card) continue;
      const sanityCost = Math.max(0, card.sanityCost ?? 0);
      if (sanityCost > player.sanity) continue;

      if (isUnitCard(card)) {
        const locations = this._unitLocationsForHand(card, face);
        const stealth = isStealth(card);
        for (const location of locations) {
          const row = player.board[location];
          for (let slot = 0; slot < row.length; slot++) {
            if (row[slot]) continue;
            const variants = stealth ? [false, true] : [false];
            for (const faceDown of variants) {
              const source = {
                kind: 'card', cardId: card.id, player: p, location, slot, inst: null,
              };
              const choices = faceDown ? null : this._effectChoiceList(p, card.id, source);
              if (choices && choices.length && choices[0] !== null) {
                for (const choice of choices) {
                  actions.push({
                    type: 'playCard',
                    player: p,
                    uid: inst.uid,
                    cardId: card.id,
                    location,
                    slot,
                    faceDown,
                    face,
                    choice: {
                      mode: choice.mode,
                      targetUid: choice.targetUid,
                      secondaryUids: choice.secondaryUids ?? [],
                      replaceWithUid: choice.replaceWithUid ?? null,
                    },
                    label: `打出「${card.nameZh}」到${LOCATION_LABELS[location]}第 ${slot + 1} 槽${faceDown ? '（盖牌）' : ''}：${choice.label}`,
                  });
                }
              } else {
                actions.push({
                  type: 'playCard',
                  player: p,
                  uid: inst.uid,
                  cardId: card.id,
                  location,
                  slot,
                  faceDown,
                  face,
                  choice: null,
                  label: `打出「${card.nameZh}」到${LOCATION_LABELS[location]}第 ${slot + 1} 槽${faceDown ? '（盖牌）' : ''}`,
                });
              }
            }
          }
        }
        continue;
      }

      if (card.type === 'event' || card.type === 'ritual') {
        const source = { kind: 'card', cardId: card.id, player: p, location: null, slot: null, inst: null };
        if (!this._playConditionAllows(p, card.id, source, null)) continue;
        const choices = this._effectChoiceList(p, card.id, source);
        if (choices && choices.length && choices[0] !== null) {
          for (const choice of choices) {
            actions.push({
              type: 'playCard',
              player: p,
              uid: inst.uid,
              cardId: card.id,
              location: null,
              slot: null,
              faceDown: false,
              face,
              choice: {
                mode: choice.mode,
                targetUid: choice.targetUid,
                secondaryUids: choice.secondaryUids ?? [],
                replaceWithUid: choice.replaceWithUid ?? null,
              },
              label: `打出「${card.nameZh}」：${choice.label}`,
            });
          }
        } else {
          actions.push({
            type: 'playCard',
            player: p,
            uid: inst.uid,
            cardId: card.id,
            location: null,
            slot: null,
            faceDown: false,
            face,
            choice: null,
            label: `打出「${card.nameZh}」`,
          });
        }
        continue;
      }

      if (card.type === 'equipment') {
        for (const location of LOCATIONS) {
          const row = player.board[location];
          for (let slot = 0; slot < row.length; slot++) {
            const host = row[slot];
            if (!host || host.faceDown || host.equipment) continue;
            if (!isUnitCard(this.cardIndex[host.cardId])) continue;
            actions.push({
              type: 'playCard',
              player: p,
              uid: inst.uid,
              cardId: card.id,
              hostUid: host.uid,
              location,
              slot,
              face,
              label: `装备「${card.nameZh}」到${LOCATION_LABELS[location]}第 ${slot + 1} 槽`,
            });
          }
        }
        continue;
      }

      if (card.type === 'location') {
        // The single front stronghold slot; a new stronghold replaces the old.
        actions.push({
          type: 'playCard',
          player: p,
          uid: inst.uid,
          cardId: card.id,
          location: 'front',
          slot: null,
          face,
          label: `打出「${card.nameZh}」到对峙线据点槽`,
        });
        continue;
      }

      if (card.type === 'environment') {
        // v1.3 Windless Night: environments cannot be played.
        if (this.state.anomaly?.environmentBlocked) continue;
        actions.push({
          type: 'playCard',
          player: p,
          uid: inst.uid,
          cardId: card.id,
          location: null,
          slot: null,
          face,
          label: `打出「${card.nameZh}」`,
        });
      }
    }

    return actions;
  }

  _emit(event) {
    this.state.events.push(event);
  }
}

function uidOf(inst) {
  return inst.uid;
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
