import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGame,
  CARDS,
  currentUnitPower,
  countCards,
  EFFECT_REGISTRY,
  KEYWORD_ONLY_CARDS,
  KEYWORD_SPECS,
  effectsFor,
  isRegistered,
  chainSpecFor,
  hasSacrificeReplacement,
  madnessPowerBonusFor,
  equipmentSpecFor,
  isSealImmuneCard,
  conditionalPowerSpecFor,
  faceForSanity,
} from '../../src/engine/v2/index.js';

// ── deterministic scenario helpers (same contract as effects-pilot) ──────

function setup({
  seed = 1,
  p0,
  p1,
  sanity = 6,
  startingHand = null,
  cardPool = CARDS,
} = {}) {
  const engine = createGame({
    seed,
    cardPool,
    decks: [p0, p1],
    startingSanity: sanity,
    startingHand: startingHand ?? Math.max(
      (p0.cards ?? []).length,
      (p1.cards ?? []).length,
      1,
    ),
  });
  for (const p of [0, 1]) {
    const result = engine.apply({ type: 'mulligan', player: p, uids: [] });
    assert.equal(result.ok, true, result.error);
  }
  engine.state.current = 0;
  engine.state.firstPlayer = 0;
  engine.state.passed = [false, false];
  engine.state.turnActionTaken = false;
  return engine;
}

function forceTurn(engine, p) {
  engine.state.current = p;
  engine.state.firstPlayer = p;
  engine.state.passed = [false, false];
  engine.state.turnActionTaken = false;
}

function handInstance(engine, p, cardId) {
  const inst = engine.state.players[p].hand.find((entry) => entry.cardId === cardId);
  assert.ok(inst, `P${p} should hold ${cardId}`);
  return inst;
}

function play(engine, p, cardId, predicate = () => true) {
  const inst = handInstance(engine, p, cardId);
  const action = engine.getActions().find(
    (entry) => entry.type === 'playCard' && entry.uid === inst.uid && predicate(entry),
  );
  assert.ok(action, `expected a legal play for ${cardId}`);
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  return { inst, action, events: result.events };
}

function takeFromHandOrDeck(engine, p, cardId) {
  const player = engine.state.players[p];
  let index = player.hand.findIndex((entry) => entry.cardId === cardId);
  if (index >= 0) return player.hand.splice(index, 1)[0];
  index = player.deck.findIndex((entry) => entry.cardId === cardId);
  if (index >= 0) return player.deck.splice(index, 1)[0];
  throw new Error(`P${p} has no ${cardId} in hand or deck`);
}

function putUnit(engine, p, cardId, location, slot, options = {}) {
  const inst = takeFromHandOrDeck(engine, p, cardId);
  inst.face = options.face ?? 'reason';
  inst.faceDown = options.faceDown ?? false;
  inst.location = location;
  inst.slot = slot;
  inst.zone = 'board';
  inst.sealed = options.sealed ?? false;
  inst.corruptionTokens = [];
  inst.corruptionLoss = 0;
  engine.state.players[p].board[location][slot] = inst;
  return inst;
}

function putLocation(engine, p, cardId, location) {
  const inst = takeFromHandOrDeck(engine, p, cardId);
  inst.zone = 'locationSlot';
  inst.location = location;
  engine.state.players[p].locations[location] = inst;
  return inst;
}

function putEnvironment(engine, p, cardId) {
  const inst = takeFromHandOrDeck(engine, p, cardId);
  inst.zone = 'environment';
  inst.location = 'all';
  inst.owner = p;
  engine.state.environments.push(inst);
  return inst;
}

function putEquipment(engine, p, cardId, host) {
  const inst = takeFromHandOrDeck(engine, p, cardId);
  inst.zone = 'attached';
  inst.attachedTo = host.uid;
  host.equipment = inst;
  return inst;
}

function passUntilNight(engine, night) {
  let guard = 0;
  while (engine.phase === 'play' && engine.state.night < night) {
    const p = engine.state.current;
    const result = engine.apply({ type: 'pass', player: p });
    assert.equal(result.ok, true, result.error);
    guard += 1;
    assert.ok(guard < 60, 'night loop guard tripped');
  }
  assert.equal(engine.phase, 'play', 'game ended before the requested night');
  assert.equal(engine.state.night, night);
  forceTurn(engine, 0);
}

function conservation(engine, sizes) {
  const expected = Array.isArray(sizes) ? sizes : [sizes, sizes];
  for (const p of [0, 1]) assert.equal(countCards(engine.state, p), expected[p]);
}

// ── lucia-vaughn: dream-native stealth (§4.4 / §6.1) ──────────────────────

test('lucia-vaughn: dream-native stealth enters the dream face-down with no enter effect', () => {
  const engine = setup({
    seed: 201,
    p0: { leader: 'harold-ashby', cards: ['lucia-vaughn', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });

  const lucia = handInstance(engine, 0, 'lucia-vaughn');
  const dreamPlays = engine.getActions().filter(
    (action) => action.type === 'playCard' && action.uid === lucia.uid && action.location === 'dream',
  );
  // The engine enumerates one play action per legal dream slot; all of them are
  // the dream-native face-down entry mode.
  assert.ok(dreamPlays.length >= 1, 'dream-native stealth has a face-down dream entry mode');
  for (const action of dreamPlays) assert.equal(action.faceDown, true, 'dream entry is face-down');
  const result = engine.apply(dreamPlays[0]);
  assert.equal(result.ok, true, result.error);
  assert.equal(engine.state.players[0].board.dream[0].uid, lucia.uid);
  assert.equal(engine.state.players[0].board.dream[0].faceDown, true);
  assert.equal(engine.state.players[0].flags.dreamEntries, 1);

  // Lucia's printed text is dream admission only; the keyword covers it.
  assert.equal(effectsFor('lucia-vaughn'), null);
  conservation(engine, [3, 2]);
});

// ── frank-holt / finn-calloway: adjacent chain caps (§6.5) ─────────────────

test('frank-holt: adjacent chain counts own neighbours with cap +3', () => {
  const engine = setup({
    seed: 202,
    p0: { leader: 'harold-ashby', cards: ['frank-holt', 'zealot', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const frank = putUnit(engine, 0, 'frank-holt', 'scene', 1);
  putUnit(engine, 0, 'zealot', 'scene', 0);
  putUnit(engine, 0, 'finn-calloway', 'scene', 2);
  assert.equal(currentUnitPower(engine.state, 0, frank, 'scene', 1), 7, 'two adjacent own cards -> +2');
  assert.deepEqual(chainSpecFor('frank-holt'), { scope: 'adjacent', cap: 3 });
});

test('finn-calloway: adjacent chain caps at +2 and the non-stealth card cannot enter the dream', () => {
  const engine = setup({
    seed: 203,
    p0: { leader: 'harold-ashby', cards: ['finn-calloway', 'finn-calloway', 'zealot'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const finn = handInstance(engine, 0, 'finn-calloway');
  const finnPlays = engine.getActions().filter(
    (action) => action.type === 'playCard' && action.uid === finn.uid,
  );
  assert.equal(finnPlays.some((action) => action.location === 'dream'), false, 'no stealth -> no dream entry');

  putUnit(engine, 0, 'finn-calloway', 'scene', 0);
  putUnit(engine, 0, 'zealot', 'scene', 2);
  putUnit(engine, 0, 'finn-calloway', 'scene', 1);
  const second = engine.state.players[0].board.scene[1];
  assert.equal(currentUnitPower(engine.state, 0, second, 'scene', 1), 5, 'three adjacent own cards -> +3 clamped to the hard cap +2');
  assert.deepEqual(chainSpecFor('finn-calloway'), { scope: 'adjacent', cap: 2 });
});

// ── arthur-pendleton: public reveal peek (§9.10) ──────────────────────────

test('arthur-pendleton: reveal peeks the opponent hand publicly', () => {
  const engine = setup({
    seed: 204,
    p0: { leader: 'harold-ashby', cards: ['arthur-pendleton', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const arthur = putUnit(engine, 0, 'arthur-pendleton', 'archive', 0, { faceDown: true });
  const reveal = engine.getActions().find(
    (action) => action.type === 'reveal' && action.uids.includes(arthur.uid),
  );
  assert.ok(reveal);
  const result = engine.apply(reveal);
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(result.events.map((event) => event.type), ['reveal', 'peek']);
  const peek = result.events.find((event) => event.type === 'peek');
  assert.equal(peek.private, false, "Arthur's reveal is public");
  assert.equal(engine.state.players[0].privateNotes.length, 0);
});

// ── abjuration: two-choice effect (§9.9) ──────────────────────────────────

test('abjuration: two choices — remove corruption or remove an environment', () => {
  // §11.3/§5.7: Abjuration is an event; each copy resolves once and then goes
  // to the discard pile.  Two copies are needed to exercise both modes.
  const engine = setup({
    seed: 205,
    p0: { leader: 'harold-ashby', cards: ['abjuration', 'abjuration', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one', 'stormy-night'] },
  });
  const abjurationUids = engine.state.players[0].hand
    .filter((inst) => inst.cardId === 'abjuration')
    .map((inst) => inst.uid);
  assert.equal(abjurationUids.length, 2, 'two separate event copies are in hand');

  const finn = putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  engine._applyCorruption(0, { kind: 'unit', inst: finn, player: 1, location: 'scene', slot: 0 }, 1);
  assert.equal(finn.corruptionTokens.length, 1);

  const played = play(engine, 0, 'abjuration', (action) => action.choice?.mode === 'removeCorruption');
  assert.equal(played.inst.uid, abjurationUids[0], 'first copy resolves the corruption mode');
  assert.ok(played.events.some((event) => event.type === 'corruptionRemoved'));
  assert.equal(finn.corruptionTokens.length, 0);
  assert.equal(finn.corruptionLoss, 0);
  assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === abjurationUids[0]), 'the resolved event is discarded');

  // Second mode: a second copy removes 1 environment card to the discard pile.
  forceTurn(engine, 0);
  const env = putEnvironment(engine, 1, 'stormy-night');
  const playedEnv = play(engine, 0, 'abjuration', (action) => action.choice?.mode === 'removeEnvironment');
  assert.equal(playedEnv.inst.uid, abjurationUids[1], 'second copy resolves the environment mode');
  assert.ok(playedEnv.events.some((event) => event.type === 'discard' && event.uid === env.uid));
  assert.equal(engine.state.environments.length, 0);
  assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === abjurationUids[1]));
  assert.equal(engine.state.players[1].deck.some((inst) => inst.uid === env.uid), false, 'the environment is not shuffled back into the deck');
  conservation(engine, [4, 3]);
});

// ── warding-rite: location protection (§9.9) ──────────────────────────────

test('warding-rite: wards one friendly location this night (+1, seal + corruption immunity)', () => {
  const engine = setup({
    seed: 206,
    p0: { leader: 'harold-ashby', cards: ['warding-rite', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const finn = putUnit(engine, 0, 'finn-calloway', 'scene', 0);
  assert.equal(currentUnitPower(engine.state, 0, finn, 'scene', 0), 3);

  const played = play(engine, 0, 'warding-rite', (action) => action.choice?.mode === 'ward');
  assert.ok(played.events.some((event) => event.type === 'auraAdded'));
  assert.equal(engine.state.effects.length, 1);
  assert.equal(engine.state.effects[0].modifiers.power, 1);
  assert.equal(engine.state.effects[0].modifiers.sealImmune, true);
  assert.equal(engine.state.effects[0].modifiers.corruptionImmune, true);
  assert.equal(currentUnitPower(engine.state, 0, finn, 'scene', 0), 4, 'warded location grants +1 power');

  const wardedTarget = { kind: 'unit', uid: finn.uid, inst: finn, player: 0, location: 'scene', slot: 0 };
  assert.equal(engine._sealTarget(wardedTarget, 'untilNextNight', { controller: 0 }), false, 'warded location is seal immune');
  const finnForCorruption = { kind: 'unit', uid: finn.uid, inst: finn, player: 0, location: 'scene', slot: 0 };
  engine._applyCorruption(0, finnForCorruption, 1);
  assert.equal(finn.corruptionTokens.length, 0, 'warded location is corruption immune');
});

// ── silver-lantern: replacement on seal / destroy, not on sacrifice (§9.9) ─

test('silver-lantern: replaces seal and destroy but not sacrifice', () => {
  // §5.6/§9.9: the replacement is one-shot and discards the lantern.  Each of
  // the three branches therefore gets its own fresh, unsealed lantern so the
  // assertions test the rule rather than a second event on an empty host.
  const lanternEngine = (seed) => {
    const fresh = setup({
      seed,
      p0: { leader: 'harold-ashby', cards: ['silver-lantern', 'finn-calloway', 'finn-calloway'] },
      p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
    });
    const host = putUnit(fresh, 0, 'finn-calloway', 'scene', 0);
    const lantern = putEquipment(fresh, 0, 'silver-lantern', host);
    assert.equal(currentUnitPower(fresh.state, 0, host, 'scene', 0), 5, 'silver lantern gives +2');
    return { fresh, host, lantern };
  };

  // §11.1: seal replacement cancels the seal, host stays, lantern is discarded.
  {
    const { fresh, host, lantern } = lanternEngine(207);
    const sealTarget = { kind: 'unit', uid: host.uid, inst: host, player: 0, location: 'scene', slot: 0 };
    assert.equal(fresh._sealTarget(sealTarget, 'untilNextNight', { controller: 0 }), false, 'unsealed lantern replaces the seal');
    assert.equal(host.sealed, false);
    assert.equal(host.equipment, null);
    assert.equal(fresh.state.players[0].board.scene[0].uid, host.uid, 'the host stays on the board');
    assert.ok(fresh.state.players[0].discard.some((inst) => inst.uid === lantern.uid));
    assert.ok(fresh.state.events.some((event) => event.type === 'silverLanternReplace' && event.event === 'seal'));
    assert.ok(fresh.state.events.some((event) => event.type === 'discard' && event.uid === lantern.uid && event.reason === 'silverLantern'));
    conservation(fresh, [3, 2]);
  }

  // §11.1: destroy replacement behaves the same way for the destroy event.
  {
    const { fresh, host, lantern } = lanternEngine(227);
    const destroyTarget = { kind: 'unit', uid: host.uid, inst: host, player: 0, location: 'scene', slot: 0 };
    assert.equal(fresh._destroyTarget(destroyTarget, 'destroy'), false, 'unsealed lantern replaces the destroy');
    assert.equal(host.equipment, null);
    assert.equal(fresh.state.players[0].board.scene[0].uid, host.uid, 'the host survives the replaced destroy');
    assert.ok(fresh.state.players[0].discard.some((inst) => inst.uid === lantern.uid));
    assert.ok(fresh.state.events.some((event) => event.type === 'silverLanternReplace' && event.event === 'destroy'));
    assert.equal(fresh.state.events.some((event) => event.type === 'destroy'), false, 'the destroy event itself was cancelled');
    conservation(fresh, [3, 2]);
  }

  // §6.4: sacrifice/devour never route through the lantern replacement.
  {
    const { fresh, host, lantern } = lanternEngine(228);
    const sacrificed = fresh._sacrificeUnit(0, host.uid);
    assert.equal(sacrificed.uid, host.uid, 'the host itself is sacrificed');
    assert.equal(fresh.state.players[0].abyss.length, 1, 'sacrifice goes to the abyss, not the discard');
    assert.equal(fresh.state.players[0].board.scene[0], null);
    assert.equal(fresh.state.players[0].discard.some((inst) => inst.uid === host.uid), false);
    assert.ok(fresh.state.players[0].discard.some((inst) => inst.uid === lantern.uid), 'equipment drops into the discard');
    assert.ok(fresh.state.events.some((event) => event.type === 'discard' && event.uid === lantern.uid && event.reason === 'hostSacrificed'));
    assert.equal(fresh.state.events.some((event) => event.type === 'silverLanternReplace'), false, 'the lantern cannot replace a sacrifice');
    conservation(fresh, [3, 2]);
  }
});

// ── old-library: corruption immunity + archive discount (§6.3 / §5.4) ─────

test('old-library: archive cards are corruption immune and the first archive play costs 1 less', () => {
  const engine = setup({
    seed: 208,
    p0: { leader: 'harold-ashby', cards: ['old-library', 'thousand-eyes', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  putLocation(engine, 0, 'old-library', 'archive');
  const finn = putUnit(engine, 0, 'finn-calloway', 'archive', 0);
  engine._applyCorruption(0, { kind: 'unit', inst: finn, player: 0, location: 'archive', slot: 0 }, 2);
  assert.equal(finn.corruptionTokens.length, 0, 'old library blocks new corruption on archive cards');

  engine.state.players[0].sanity = 6;
  putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  const played = play(engine, 0, 'thousand-eyes', (action) => action.location === 'archive');
  assert.equal(played.events.some((event) => event.type === 'sanityChange'), true, 'archive play pays the discounted sanity cost');
  assert.equal(engine.state.players[0].sanity, 5, 'first archive play cost 2 - 1 discount = 1');
  assert.equal(engine.state.players[0].flags.libraryDiscountUsed, true);
});

// ── zealot / deep-one: madness face values, backlash and sanity cost ───────

test('zealot: madness face is printed +3 with backlash, reason face is plain', () => {
  const engine = setup({
    seed: 209,
    p0: { leader: 'harold-ashby', cards: ['zealot', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const zealot = putUnit(engine, 0, 'zealot', 'scene', 0, { face: 'madness' });
  // v1.2: JSON madnessPower 6 -> 4; the printed +3 registry bonus is unchanged.
  assert.equal(currentUnitPower(engine.state, 0, zealot, 'scene', 0), 7, 'madness face: base 4 + 3');
  engine.state.current = 0;
  engine._maybeBacklash(0, zealot, engine.cardIndex['zealot'], { context: 'entry' });
  assert.equal(engine.state.players[0].sanity, 5, 'madness entry backlash loses 1 sanity');

  const reasonEngine = setup({
    seed: 209,
    p0: { leader: 'harold-ashby', cards: ['zealot', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const reasonUnit = putUnit(reasonEngine, 0, 'zealot', 'scene', 0, { face: 'reason' });
  // v1.2: JSON reasonPower 3 -> 2.
  assert.equal(currentUnitPower(reasonEngine.state, 0, reasonUnit, 'scene', 0), 2, 'reason face stays at base 2');
});

test('deep-one: madness face is printed +3 with backlash and pays 1 sanity', () => {
  const madnessEngine = setup({
    seed: 210,
    p0: { leader: 'elias-thorne', cards: ['deep-one', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  const deep = putUnit(madnessEngine, 0, 'deep-one', 'dream', 0, { face: 'madness' });
  // v1.2: JSON madnessPower 8 -> 6; printed +3 bonus unchanged.
  assert.equal(currentUnitPower(madnessEngine.state, 0, deep, 'dream', 0), 9, 'madness face: base 6 + 3');
  madnessEngine.state.current = 0;
  madnessEngine._maybeBacklash(0, deep, madnessEngine.cardIndex['deep-one'], { context: 'entry' });
  assert.equal(madnessEngine.state.players[0].sanity, 5);

  const costEngine = setup({
    seed: 211,
    p0: { leader: 'elias-thorne', cards: ['deep-one', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
    sanity: 6,
  });
  const playedDeep = play(costEngine, 0, 'deep-one', (action) => action.location === 'dream');
  assert.equal(costEngine.state.players[0].sanity, 5, 'deep one pays its printed sanity cost of 1');
});

// ── gravedigger: mandatory sacrifice + abyss retrieval (§6.4) ────────────

test('gravedigger: must sacrifice when possible, then retrieves one unit from the abyss', () => {
  const engine = setup({
    seed: 212,
    p0: { leader: 'elias-thorne', cards: ['gravedigger', 'zealot', 'deep-one', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  const zealot = putUnit(engine, 0, 'zealot', 'scene', 0);
  const deep = takeFromHandOrDeck(engine, 0, 'deep-one');
  deep.zone = 'abyss';
  engine.state.players[0].abyss.push(deep);

  const played = play(engine, 0, 'gravedigger', (action) => action.choice?.mode === 'grave');
  assert.ok(played.action.choice?.mode === 'grave');
  assert.ok(played.events.some((event) => event.type === 'sacrifice'));
  assert.ok(engine.state.players[0].abyss.some((inst) => inst.uid === zealot.uid), 'sacrificed unit went to the abyss');
  assert.equal(engine.state.players[0].abyss.length, 1);
  assert.equal(engine.state.players[0].hand.some((inst) => inst.uid === deep.uid), true, 'one abyss unit was retrieved');
});

// ── whisperer: flip drains the opponent sanity (§6.1) ─────────────────────

test('whisperer: flipping the dream stealth card drains the opponent 1 sanity', () => {
  const engine = setup({
    seed: 213,
    p0: { leader: 'elias-thorne', cards: ['whisperer', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  const whisperer = putUnit(engine, 0, 'whisperer', 'dream', 0, { faceDown: true });
  const reveal = engine.getActions().find(
    (action) => action.type === 'reveal' && action.uids.includes(whisperer.uid),
  );
  assert.ok(reveal);
  const result = engine.apply(reveal);
  assert.equal(result.ok, true, result.error);
  assert.ok(result.events.some((event) => event.type === 'sanityChange'));
  assert.equal(engine.state.players[1].sanity, 5);
});

// ── bell-claw: devour permanent gain (§6.4) ────────────────────────────────

test('bell-claw: devouring an adjacent unit permanently gains its current power', () => {
  const engine = setup({
    seed: 214,
    p0: { leader: 'elias-thorne', cards: ['bell-claw', 'zealot', 'deep-one'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
    sanity: 3,
  });
  putUnit(engine, 0, 'zealot', 'scene', 1);
  const bell = play(engine, 0, 'bell-claw', (action) => action.choice?.mode === 'devour');
  assert.ok(bell.events.some((event) => event.type === 'devour'));
  assert.equal(engine.state.players[0].board.scene[1], null, 'devoured neighbour left the board');
  assert.equal(engine.state.players[0].abyss.length, 1);
  // v1.2: devoured zealot's reasonPower 3 -> 2; devour rule (full current power) unchanged.
  assert.equal(bell.inst.permanentPower, 2, 'bell-claw permanently gained the devoured current power');
});

// ── seance: mandatory sacrifice + bounded retrieval (§6.4) ─────────────────

test('seance: cannot be played without a sacrifice target and cannot retrieve the sacrificed card', () => {
  const noTarget = setup({
    seed: 215,
    p0: { leader: 'elias-thorne', cards: ['seance', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  assert.equal(
    noTarget.getActions().some((action) => action.type === 'playCard' && action.cardId === 'seance'),
    false,
    'seance requires a sacrifice target to be playable at all',
  );

  const engine = setup({
    seed: 216,
    p0: { leader: 'elias-thorne', cards: ['seance', 'zealot', 'deep-one', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  putUnit(engine, 0, 'zealot', 'scene', 0);
  const deep = takeFromHandOrDeck(engine, 0, 'deep-one');
  deep.zone = 'abyss';
  engine.state.players[0].abyss.push(deep);
  const played = play(engine, 0, 'seance', (action) => action.choice?.mode === 'seance');
  assert.ok(played.action.choice?.mode === 'seance');
  assert.ok(played.events.some((event) => event.type === 'sacrifice'));
  assert.equal(engine.state.players[0].abyss.length, 1, 'the sacrificed unit is in the abyss');
  assert.equal(engine.state.players[0].hand.some((inst) => inst.uid === deep.uid), true, 'seance retrieves up to 2 abyss units, not the sacrificed one');
});

// ── tide-ritual: dream +3 this night, expires next night ───────────────────

test('tide-ritual: gives the own dream row +3 this night and expires afterwards', () => {
  const engine = setup({
    seed: 217,
    p0: { leader: 'elias-thorne', cards: ['tide-ritual', 'deep-one', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  const played = play(engine, 0, 'tide-ritual');
  assert.ok(played.events.some((event) => event.type === 'auraAdded'));
  putUnit(engine, 0, 'deep-one', 'dream', 0);
  // v1.2: deep-one reasonPower 5 -> 4, Tide Ritual +3 unchanged.
  assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.dream[0], 'dream', 0), 7, 'own dream unit +3');
  passUntilNight(engine, 2);
  assert.equal(engine.state.effects.length, 0, 'this-night aura cleared at night end cleanup');
});

// ── lunar-eclipse / stormy-night: global auras ────────────────────────────

test('lunar-eclipse: this night reason face -1 and madness face +1 for both players', () => {
  const engine = setup({
    seed: 218,
    p0: { leader: 'elias-thorne', cards: ['lunar-eclipse', 'zealot', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  putUnit(engine, 0, 'zealot', 'scene', 0);
  putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  const played = play(engine, 0, 'lunar-eclipse');
  assert.ok(played.events.some((event) => event.type === 'auraAdded'));
  // v1.2: zealot reasonPower 3 -> 2, Lunar Eclipse reason -1 unchanged; finn unaffected.
  assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.scene[0], 'scene', 0), 1);
  assert.equal(currentUnitPower(engine.state, 1, engine.state.players[1].board.scene[0], 'scene', 0), 2);
});

test('stormy-night: this night scene -2 for both players', () => {
  const engine = setup({
    seed: 219,
    p0: { leader: 'elias-thorne', cards: ['stormy-night', 'zealot', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  putUnit(engine, 0, 'zealot', 'scene', 0);
  putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  const played = play(engine, 0, 'stormy-night');
  assert.ok(played.events.some((event) => event.type === 'auraAdded'));
  // v1.2: zealot reasonPower 3 -> 2, Stormy Night scene -2 unchanged; finn unaffected.
  assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.scene[0], 'scene', 0), 0);
  assert.equal(currentUnitPower(engine.state, 1, engine.state.players[1].board.scene[0], 'scene', 0), 1);
});

// ── drowned-altar: scene sacrifice immunity + cult echo +3 ─────────────────

test('drowned-altar: scene sacrifices skip backlash and the cult echo is +1', () => {
  const engine = setup({
    seed: 220,
    p0: { leader: 'elias-thorne', cards: ['drowned-altar', 'zealot', 'deep-one', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
    sanity: 3,
  });
  putUnit(engine, 0, 'zealot', 'scene', 0);
  const deep = takeFromHandOrDeck(engine, 0, 'deep-one');
  deep.zone = 'deck';
  engine.state.players[0].deck.push(deep);
  putLocation(engine, 0, 'drowned-altar', 'scene');

  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader'
      && entry.sacrificeUid === engine.state.players[0].board.scene[0].uid
      && entry.cardUid === deep.uid
      && entry.location === 'dream'
      && entry.slot === 0,
  );
  assert.ok(action, 'Elias may sacrifice the madness zealot against the drowned altar');
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(
    result.events.map((event) => event.type),
    ['leaderSkill', 'sacrifice', 'cultEcho', 'playFromDeck', 'backlash', 'sanityChange'],
  );
  // v1.2: §7.2 echo +2/altar +3 -> +1/altar +1; the altar still suppresses backlash.
  assert.equal(result.events.find((event) => event.type === 'cultEcho').bonus, 1, 'v1.2 echo is +1 with or without the altar');
  assert.equal(engine.state.players[0].sanity, 2, 'deep-one madness entry backlash still applies after the summon');
});

// ── silas-gold: discard hand + pick from deck top 3 (§6.2) ─────────────────

test('silas-gold: discard one hand card and retrieve one of the top three', () => {
  const engine = setup({
    seed: 221,
    p0: { leader: 'harold-ashby', cards: ['silas-gold', 'finn-calloway', 'deep-one', 'zealot', 'whisperer', 'gravedigger'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
    startingHand: 3,
  });
  const silas = putUnit(engine, 0, 'silas-gold', 'archive', 0, { faceDown: true });

  // §11.3: after Silas leaves hand, 2 hand cards and 3 deck cards remain.  The
  // player chooses both the discarded card and the deck pick, so the engine
  // enumerates 2 x 3 = 6 legal reveal lines, not a single forced action.
  const handBefore = [...engine.state.players[0].hand];
  const topThree = engine.state.players[0].deck.slice(0, 3).map((inst) => inst.uid);
  assert.equal(handBefore.length, 2, 'two hand cards remain to discard from');
  assert.equal(topThree.length, 3, 'three deck cards are on top');

  const reveals = engine.getActions().filter(
    (action) => action.type === 'reveal' && action.uids.includes(silas.uid),
  );
  const expectedPairs = handBefore.flatMap((inst) => topThree.map((uid) => `${inst.uid}|${uid}`));
  assert.equal(reveals.length, expectedPairs.length, 'one legal reveal per (discard, pick) choice');
  assert.deepEqual(
    reveals.map((action) => `${action.choice.targetUid}|${action.choice.secondaryUids[0]}`).sort(),
    expectedPairs.sort(),
    'every hand card can be discarded and every top-3 card can be taken',
  );

  const chosen = reveals[0];
  const discardUid = chosen.choice.targetUid;
  const takeUid = chosen.choice.secondaryUids[0];
  const result = engine.apply(chosen);
  assert.equal(result.ok, true, result.error);
  assert.ok(result.events.some((event) => event.type === 'reveal' && event.uid === silas.uid && event.via === 'turn'));
  assert.equal(silas.faceDown, false);
  const revealDeckTop = result.events.find((event) => event.type === 'revealDeckTop');
  assert.deepEqual(revealDeckTop.cards.map((card) => card.uid), topThree, 'exactly the top three deck cards are shown');
  assert.ok(result.events.some((event) => event.type === 'discard' && event.uid === discardUid && event.reason === 'effect'));
  assert.ok(result.events.some((event) => event.type === 'deckToHand' && event.uid === takeUid));
  assert.ok(result.events.some((event) => event.type === 'shuffleDeck' && event.count === 2));
  assert.equal(result.events.some((event) => event.type === 'abyssToHand'), false, 'silas picks from the deck, not the abyss');

  const player = engine.state.players[0];
  assert.equal(player.hand.length, 2, 'discard one, take one');
  assert.equal(player.hand.some((inst) => inst.uid === discardUid), false, 'the discarded hand card left the hand');
  assert.equal(player.hand.some((inst) => inst.uid === takeUid), true, 'the chosen deck card entered the hand');
  assert.deepEqual(player.deck.map((inst) => inst.uid).sort(), topThree.filter((uid) => uid !== takeUid).sort(), 'the other top cards are shuffled back');
  conservation(engine, [6, 2]);
});

// ── thousand-eyes: seal leader exception + face-up stealth count ───────────

test('thousand-eyes: seals the enemy leader and counts face-up unsealed stealth', () => {
  const engine = setup({
    seed: 222,
    p0: { leader: 'elias-thorne', cards: ['thousand-eyes', 'deep-one', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['nora-wells', 'finn-calloway', 'deep-one'] },
  });
  putUnit(engine, 1, 'nora-wells', 'scene', 0);
  assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.scene[1], 'scene', 1), 0, 'sanity placeholder');
  const played = play(engine, 0, 'thousand-eyes', (action) => action.location === 'archive');
  assert.ok(played.events.some((event) => event.type === 'sealLeader'));
  assert.equal(engine.state.players[1].leaderSealed, true);
});

// ── unexpected-aid: permanent +3 and full cleanse (§9.9) ────────────────────

test('unexpected-aid: permanent +3 plus remove all seals and corruption', () => {
  const engine = setup({
    seed: 223,
    p0: { leader: 'harold-ashby', cards: ['unexpected-aid', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const finn = putUnit(engine, 0, 'finn-calloway', 'scene', 0);
  finn.sealed = true;
  finn.corruptionTokens = [{ appliedNight: engine.state.night, source: 'sea-priestess' }];
  finn.corruptionLoss = engine.state.night;
  const played = play(engine, 0, 'unexpected-aid', (action) => action.choice?.mode === 'aid');
  assert.ok(played.events.some((event) => event.type === 'buff'));
  assert.equal(finn.permanentPower, 3);
  assert.equal(finn.sealed, false);
  assert.equal(finn.corruptionTokens.length, 0);
  assert.equal(finn.corruptionLoss, 0);
  assert.equal(currentUnitPower(engine.state, 0, finn, 'scene', 0), 6, 'permanent +3 applied on top of printed power');
});

// ── the-sleeper: seal immunity, entry cost, nightly drain ───────────────────

test('the-sleeper: cannot be sealed, pays 2 sanity on entry and 1 sanity per night', () => {
  const engine = setup({
    seed: 224,
    p0: { leader: 'elias-thorne', cards: ['the-sleeper', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
    sanity: 5,
  });
  const played = play(engine, 0, 'the-sleeper', (action) => action.location === 'dream');
  const sleeper = engine.state.players[0].board.dream[0];
  assert.equal(sleeper.cardId, 'the-sleeper');
  assert.equal(engine.state.players[0].sanity, 3, 'sleeper entry costs 2 via the printed cost, without double charging');
  assert.equal(sleeper.face, 'reason');
  assert.equal(played.events.some((event) => event.type === 'backlash'), false, 'reason-face sleeper does not trigger backlash');
  assert.equal(isSealImmuneCard('the-sleeper'), true, 'the sleeper cannot be sealed (spec)');

  passUntilNight(engine, 2);
  assert.equal(engine.state.players[0].sanity, 2, 'each following night drains 1 more sanity');
});
