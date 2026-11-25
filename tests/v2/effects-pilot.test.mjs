import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGame,
  CARDS,
  countCards,
  currentUnitPower,
  LOCATIONS,
} from '../../src/engine/v2/index.js';

// ── deterministic scenario helpers ──────────────────────────────────────

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
  forceTurn(engine, 0);
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

// ── nora-wells: stealth / hidden information / reveal peek ──────────────

test('nora-wells: face-down stealth is hidden, unselectable, and peeks privately on reveal', () => {
  const engine = setup({
    seed: 101,
    p0: { leader: 'harold-ashby', cards: ['nora-wells', 'abjuration'] },
    p1: { leader: 'harold-ashby', cards: ['samuel-pike', 'finn-calloway', 'edith-barrow'] },
  });

  const nora = play(engine, 0, 'nora-wells', (action) => action.faceDown === true).inst;
  assert.equal(nora.faceDown, true);
  assert.equal(engine.state.players[0].board.scene[0].faceDown, true);

  const own = engine.viewFor(0);
  const opponent = engine.viewFor(1);
  assert.equal(own.players[0].board.scene[0].cardId, 'nora-wells');
  assert.equal(own.players[0].board.scene[0].power, 0);
  assert.equal(opponent.players[0].board.scene[0].hidden, true);
  assert.equal(opponent.players[0].board.scene[0].cardId, undefined);
  assert.equal(opponent.players[0].board.scene[0].face, undefined);
  assert.equal(opponent.players[0].board.scene[0].keywords, undefined);
  assert.equal(JSON.stringify(opponent.players[0].board).includes('nora-wells'), false);

  // P1 cannot target the face-down card with Harold (no other enemy board card).
  assert.equal(
    engine.getActions(1).filter((action) => action.type === 'useLeader').length,
    0,
  );

  // P1's Pike cannot seal it either: the only enter-effect option fizzles.
  const pikePlay = engine.getActions(1)
    .filter((action) => action.type === 'playCard' && action.cardId === 'samuel-pike');
  assert.ok(pikePlay.length > 0);
  assert.equal(pikePlay.every((action) => action.choice === null), true);
  assert.equal(engine.apply(pikePlay[0]).ok, true);

  // Playing Pike ended P1's turn, so P0 may now reveal the face-down card.
  assert.equal(engine.state.current, 0);
  const reveal = engine.getActions().find(
    (action) => action.type === 'reveal' && action.uids.includes(nora.uid),
  );
  assert.ok(reveal);
  const revealed = engine.apply(reveal);
  assert.equal(revealed.ok, true, revealed.error);
  // v1.3: a reveal also draws a chaos token; assert the key events exist.
  const revealTypes = revealed.events.map((event) => event.type);
  assert.ok(revealTypes.includes('reveal'));
  assert.ok(revealTypes.includes('peek'));

  assert.equal(nora.faceDown, false);
  assert.equal(engine.viewFor(1).players[0].board.scene[0].cardId, 'nora-wells');
  // Printed 2 + chaos token + any scene anomaly power.
  const noraAnomaly = engine.state.anomaly?.location === 'scene'
    ? (engine.state.anomaly.power ?? 0)
    : 0;
  const noraExpected = Math.max(0, 2 + (nora.chaosToken?.modifier ?? 0) + noraAnomaly);
  assert.equal(engine.viewFor(1).players[0].board.scene[0].power, noraExpected);

  const ownPeek = engine.viewFor(0).events.find((event) => event.type === 'peek');
  const opponentPeek = engine.viewFor(1).events.find((event) => event.type === 'peek');
  assert.ok(ownPeek.cardId);
  assert.equal(opponentPeek.cardId, undefined);
  assert.equal(opponentPeek.name, undefined);
  assert.equal(engine.state.players[0].privateNotes.length, 1);
  assert.equal(engine.viewFor(1).players[0].privateNotes.length, 0);

  // Night end must reveal every remaining face-down card.
  const engine2 = setup({
    seed: 102,
    p0: { leader: 'harold-ashby', cards: ['nora-wells', 'abjuration'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway'] },
  });
  play(engine2, 0, 'nora-wells', (action) => action.faceDown === true);
  passUntilNight(engine2, 2);
  const revealEvent = engine2.state.events.find(
    (event) => event.type === 'reveal' && event.via === 'nightEnd',
  );
  assert.ok(revealEvent);
});

// ── samuel-pike: seal, expiry, refresh, sealed chain = 0 ───────────────

test('samuel-pike: seals a legal unit, seals refresh, and expiry happens at next night start', () => {
  const engine = setup({
    seed: 111,
    p0: { leader: 'harold-ashby', cards: ['samuel-pike', 'abjuration'] },
    p1: {
      leader: 'elias-thorne',
      cards: ['edith-barrow', 'finn-calloway', 'walter-morse', 'abjuration'],
    },
  });
  const edith = putUnit(engine, 1, 'edith-barrow', 'archive', 0);
  putUnit(engine, 1, 'finn-calloway', 'archive', 1);
  putUnit(engine, 1, 'walter-morse', 'archive', 2);
  assert.equal(currentUnitPower(engine.state, 1, edith, 'archive', 0), 4);

  const pike = play(engine, 0, 'samuel-pike', (action) =>
    action.choice?.mode === 'seal' && action.choice?.targetUid === edith.uid);
  const sealEvent = pike.events.find((event) => event.type === 'seal');
  assert.equal(sealEvent.uid, edith.uid);
  assert.equal(sealEvent.refreshed, false);
  assert.equal(edith.sealed, true);
  assert.equal(currentUnitPower(engine.state, 1, edith, 'archive', 0), 2);

  // Harold re-seals the same target: the seal refreshes instead of stacking.
  engine.apply({ type: 'pass', player: 1 });
  forceTurn(engine, 0);
  engine.state.players[0].sanity = 5;
  const harold = engine.getActions().find(
    (action) => action.type === 'useLeader' && action.targetUid === edith.uid,
  );
  assert.ok(harold);
  const refresh = engine.apply(harold);
  assert.equal(refresh.ok, true, refresh.error);
  assert.equal(refresh.events.find((event) => event.type === 'seal').refreshed, true);
  assert.equal(engine.state.players[0].sanity, 6);

  passUntilNight(engine, 2);
  assert.equal(edith.sealed, false);
  assert.equal(currentUnitPower(engine.state, 1, edith, 'archive', 0), 4);
  assert.ok(engine.state.events.some(
    (event) => event.type === 'sealExpire' && event.uid === edith.uid,
  ));
});

// ── sea-priestess: corruption target, immunity, cap, night tick, removal ─

test('sea-priestess: highest legal target, immunity/full-token retarget, night tick, Pike removal', () => {
  const engine = setup({
    seed: 121,
    p0: { leader: 'elias-thorne', cards: ['sea-priestess', 'samuel-pike', 'abjuration'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'edith-barrow', 'walter-morse'] },
  });
  const finn = putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  const edith = putUnit(engine, 1, 'edith-barrow', 'scene', 1);
  const walter = putUnit(engine, 1, 'walter-morse', 'scene', 2);

  // Finn is immune and already full; Edith is lower power than Walter.
  finn.corruptionImmune = true;
  engine._applyCorruption(0, { kind: 'unit', inst: finn, player: 1, location: 'scene', slot: 0 }, 3);

  const priestess = play(engine, 0, 'sea-priestess');
  const corruption = priestess.events.find((event) => event.type === 'corruption');
  assert.equal(corruption.uid, walter.uid);
  assert.equal(walter.corruptionTokens.length, 1);
  assert.equal(walter.corruptionLoss, 0, 'corruption does not reduce power in the same night');
  assert.equal(currentUnitPower(engine.state, 1, walter, 'scene', 2), 3);

  // Next night: each existing token ticks exactly once.
  passUntilNight(engine, 2);
  assert.equal(walter.corruptionLoss, 1);
  assert.equal(currentUnitPower(engine.state, 1, walter, 'scene', 2), 2);
  assert.ok(engine.state.events.some(
    (event) => event.type === 'corruptionTick' && event.uid === walter.uid && event.delta === 1,
  ));

  // Pike removes one token and its accumulated loss.
  engine.state.players[0].sanity = 6;
  const pike = play(engine, 0, 'samuel-pike', (action) =>
    action.choice?.mode === 'removeCorruption' && action.choice?.targetUid === walter.uid);
  assert.equal(walter.corruptionTokens.length, 0);
  assert.equal(walter.corruptionLoss, 0);
  assert.equal(currentUnitPower(engine.state, 1, walter, 'scene', 2), 3);
  assert.ok(pike.events.some((event) => event.type === 'corruptionRemoved'));
  void edith;
});

test('sea-priestess: the applier chooses among tied highest-power legal targets', () => {
  const engine = setup({
    seed: 123,
    p0: { leader: 'elias-thorne', cards: ['sea-priestess', 'abjuration'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'walter-morse'] },
  });
  // An empty slot between them breaks Finn's adjacency bonus. Equalize the
  // random chaos modifiers so the two units genuinely tie for highest power;
  // a scene anomaly (if drawn) affects both equally.
  const finn = putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  const walter = putUnit(engine, 1, 'walter-morse', 'scene', 2);
  finn.chaosToken = null;
  walter.chaosToken = null;
  const tiedPower = currentUnitPower(engine.state, 1, finn, 'scene', 0);
  assert.equal(tiedPower, currentUnitPower(engine.state, 1, walter, 'scene', 2), 'the two units are tied');
  assert.ok(Number.isFinite(tiedPower) && tiedPower >= 0, 'both share one power value; a scene anomaly may shift it together');

  const choices = new Set(
    engine.getActions()
      .filter((action) => action.type === 'playCard' && action.cardId === 'sea-priestess')
      .map((action) => action.choice?.targetUid)
      .filter(Boolean),
  );
  assert.equal(choices.has(finn.uid), true);
  assert.equal(choices.has(walter.uid), true);

  play(engine, 0, 'sea-priestess', (action) => action.choice?.targetUid === walter.uid);
  assert.equal(walter.corruptionTokens.length, 1);
  assert.equal(finn.corruptionTokens.length, 0);
});

test('corruption: a target at 3 tokens is skipped and an immune highest target is skipped', () => {
  const engine = setup({
    seed: 122,
    p0: { leader: 'elias-thorne', cards: ['sea-priestess', 'abjuration'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'edith-barrow'] },
  });
  const finn = putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  const edith = putUnit(engine, 1, 'edith-barrow', 'scene', 1);
  finn.corruptionImmune = true;
  engine._applyCorruption(0, { kind: 'unit', inst: edith, player: 1, location: 'scene', slot: 1 }, 3);

  play(engine, 0, 'sea-priestess');
  assert.equal(finn.corruptionTokens.length, 0);
  assert.equal(edith.corruptionTokens.length, 3);
});

// ── hooded-acolyte / elias: sacrifice replacement + abyss ──────────────

test('elias + hooded-acolyte: replacement sacrifices the Acolyte, keeps the target, and summons from deck', () => {
  const engine = setup({
    seed: 131,
    p0: {
      leader: 'elias-thorne',
      cards: ['zealot', 'hooded-acolyte', 'deep-one', 'finn-calloway'],
    },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'abjuration'] },
  });
  const zealot = putUnit(engine, 0, 'zealot', 'scene', 0);
  const acolyte = putUnit(engine, 0, 'hooded-acolyte', 'scene', 1);

  // Make sure the aberration is in the deck.
  const deepOne = takeFromHandOrDeck(engine, 0, 'deep-one');
  deepOne.zone = 'deck';
  engine.state.players[0].deck.push(deepOne);

  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader'
      && entry.sacrificeUid === zealot.uid
      && entry.replaceWithUid === acolyte.uid
      && entry.cardUid === deepOne.uid
      && entry.location === 'dream'
      && entry.slot === 0,
  );
  assert.ok(action, 'Elias should offer the Acolyte-replacement line');
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(
    result.events.map((event) => event.type),
    ['leaderSkill', 'sacrifice', 'objectiveGain', 'cultEcho', 'playFromDeck'],
  );

  assert.equal(engine.state.players[0].board.scene[0].uid, zealot.uid, 'original target stays');
  assert.equal(engine.state.players[0].abyss.length, 1);
  assert.equal(engine.state.players[0].abyss[0].uid, acolyte.uid);
  assert.equal(engine.state.players[0].discard.some((inst) => inst.uid === acolyte.uid), false);
  assert.equal(engine.state.players[0].board.dream[0].cardId, 'deep-one');
  assert.equal(engine.state.players[0].board.dream[0].face, 'reason');
  assert.equal(engine.state.players[0].sanity, 6, 'Elias summoning pays no sanity cost');
  assert.equal(engine.state.players[0].leaderUsedThisNight, true);
  assert.equal(engine.state.players[0].flags.cultSacrificeTriggered, true);
  // v1.2: §7.2 echo reduced from +2/altar +3 to +1/altar +1.
  assert.equal(result.events.find((event) => event.type === 'cultEcho').bonus, 1);
  conservation(engine, [4, 2]);
});

test('elias: all three conditions are required (sacrifice, aberration in deck, legal placement)', () => {
  // No sacrifice target.
  const noSacrifice = setup({
    seed: 132,
    p0: { leader: 'elias-thorne', cards: ['deep-one', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway'] },
  });
  const deep1 = takeFromHandOrDeck(noSacrifice, 0, 'deep-one');
  deep1.zone = 'deck';
  noSacrifice.state.players[0].deck.push(deep1);
  assert.equal(noSacrifice.getActions().filter((a) => a.type === 'useLeader').length, 0);

  // No aberration in the deck.
  const noAberration = setup({
    seed: 133,
    p0: { leader: 'elias-thorne', cards: ['zealot', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway'] },
  });
  putUnit(noAberration, 0, 'zealot', 'scene', 0);
  assert.equal(noAberration.getActions().filter((a) => a.type === 'useLeader').length, 0);

  // Aberration exists but every dream slot is full.
  const noPlacement = setup({
    seed: 134,
    p0: {
      leader: 'elias-thorne',
      cards: ['zealot', 'finn-calloway', 'finn-calloway', 'finn-calloway', 'deep-one'],
    },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway'] },
  });
  putUnit(noPlacement, 0, 'zealot', 'scene', 0);
  putUnit(noPlacement, 0, 'finn-calloway', 'dream', 0);
  putUnit(noPlacement, 0, 'finn-calloway', 'dream', 1);
  putUnit(noPlacement, 0, 'finn-calloway', 'dream', 2);
  const deep2 = takeFromHandOrDeck(noPlacement, 0, 'deep-one');
  deep2.zone = 'deck';
  noPlacement.state.players[0].deck.push(deep2);
  assert.equal(noPlacement.getActions().filter((a) => a.type === 'useLeader').length, 0);
});

// ── edith-barrow: chain recomputation, face-down/sealed counting ────────

test('edith-barrow: chain counts every other archive card and recomputes on board changes', () => {
  const engine = setup({
    seed: 141,
    p0: {
      leader: 'harold-ashby',
      cards: ['edith-barrow', 'walter-morse', 'arthur-pendleton', 'silas-gold', 'finn-calloway', 'abjuration'],
    },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway'] },
  });
  const edith = putUnit(engine, 0, 'edith-barrow', 'archive', 0);
  putUnit(engine, 0, 'walter-morse', 'archive', 1);
  putUnit(engine, 0, 'arthur-pendleton', 'archive', 2, { faceDown: true });
  putUnit(engine, 0, 'silas-gold', 'archive', 3);
  putUnit(engine, 0, 'finn-calloway', 'archive', 4);

  assert.equal(currentUnitPower(engine.state, 0, edith, 'archive', 0), 6);
  assert.equal(engine.viewFor(0).players[0].board.archive[0].power, 6);

  // Remove one other card: recompute immediately.
  engine.state.players[0].board.archive[4] = null;
  assert.equal(currentUnitPower(engine.state, 0, edith, 'archive', 0), 5);

  // Sealed chain card: its own chain is 0, but it still counts for others.
  edith.sealed = true;
  assert.equal(currentUnitPower(engine.state, 0, edith, 'archive', 0), 2);
  edith.sealed = false;

  // Empty slots break nothing here because Edith counts the whole archive row.
  assert.equal(currentUnitPower(engine.state, 0, edith, 'archive', 0), 5);
});

// ── walter-morse: backlash only on the madness face ────────────────────

test('walter-morse: backlash triggers on madness entry/reveal/sacrifice, never on the reason face', () => {
  // Reason face: no backlash.
  const reasonGame = setup({
    seed: 151,
    p0: { leader: 'elias-thorne', cards: ['walter-morse', 'abjuration'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway'] },
    sanity: 6,
  });
  const reasonPlay = play(reasonGame, 0, 'walter-morse');
  assert.equal(reasonPlay.events.some((event) => event.type === 'backlash'), false);
  assert.equal(reasonGame.state.players[0].sanity, 6);

  // Madness face: entry backlash.
  const madnessGame = setup({
    seed: 152,
    p0: { leader: 'elias-thorne', cards: ['walter-morse', 'abjuration'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway'] },
    sanity: 3,
  });
  const madnessPlay = play(madnessGame, 0, 'walter-morse');
  assert.equal(madnessPlay.inst.face, 'madness');
  assert.equal(madnessPlay.events.some((event) => event.type === 'backlash'), true);
  assert.equal(madnessGame.state.players[0].sanity, 2);

  // Reveal backlash (a synthetic stealth + backlash keyword card).
  const pool = [{
    id: 'haunt',
    name: 'Haunt',
    faction: 'neutral',
    type: 'unit',
    location: 'scene',
    reasonPower: 1,
    madnessPower: 5,
    keywords: ['stealth', 'backlash'],
    sanityCost: 0,
  }];
  const revealGame = setup({
    seed: 153,
    p0: { leader: null, cards: ['haunt'] },
    p1: { leader: null, cards: ['haunt'] },
    sanity: 3,
    cardPool: pool,
  });
  const haunt = play(revealGame, 0, 'haunt', (action) => action.faceDown === true).inst;
  assert.equal(revealGame.state.players[0].sanity, 3, 'face-down entry does not trigger backlash');
  revealGame.state.current = 0;
  const reveal = revealGame.getActions().find(
    (action) => action.type === 'reveal' && action.uids.includes(haunt.uid),
  );
  const revealed = revealGame.apply(reveal);
  assert.equal(revealed.events.some((event) => event.type === 'backlash'), true);
  assert.equal(revealGame.state.players[0].sanity, 2);

  // Sacrifice backlash; a sealed madness Walter does not trigger it.
  const sacrificeGame = setup({
    seed: 154,
    p0: { leader: 'elias-thorne', cards: ['walter-morse', 'deep-one', 'abjuration'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway'] },
    sanity: 3,
  });
  const walter = putUnit(sacrificeGame, 0, 'walter-morse', 'archive', 0, { face: 'madness' });
  const deep = takeFromHandOrDeck(sacrificeGame, 0, 'deep-one');
  deep.zone = 'deck';
  sacrificeGame.state.players[0].deck.push(deep);
  const eliasAction = sacrificeGame.getActions().find(
    (action) => action.type === 'useLeader' && action.sacrificeUid === walter.uid,
  );
  const sacrificed = sacrificeGame.apply(eliasAction);
  assert.equal(sacrificed.ok, true, sacrificed.error);
  assert.equal(sacrificed.events.some((event) => event.type === 'backlash'), true);
  assert.equal(sacrificeGame.state.players[0].abyss[0].uid, walter.uid);

  const sealedGame = setup({
    seed: 155,
    p0: { leader: 'elias-thorne', cards: ['walter-morse', 'deep-one', 'abjuration'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway'] },
    sanity: 3,
  });
  const sealedWalter = putUnit(sealedGame, 0, 'walter-morse', 'archive', 0, {
    face: 'madness',
    sealed: true,
  });
  const deep2 = takeFromHandOrDeck(sealedGame, 0, 'deep-one');
  deep2.zone = 'deck';
  sealedGame.state.players[0].deck.push(deep2);
  const sealedAction = sealedGame.getActions().find(
    (action) => action.type === 'useLeader' && action.sacrificeUid === sealedWalter.uid,
  );
  const sealedSacrifice = sealedGame.apply(sealedAction);
  assert.equal(
    sealedSacrifice.events.some(
      (event) => event.type === 'backlash' && event.uid === sealedWalter.uid,
    ),
    false,
  );
});

test('backlash and sanity zero: the whole batch resolves before the loss is checked', () => {
  const engine = setup({
    seed: 156,
    p0: { leader: 'elias-thorne', cards: ['walter-morse', 'deep-one'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway'] },
    sanity: 2,
  });
  const walter = putUnit(engine, 0, 'walter-morse', 'archive', 0, { face: 'madness' });
  const deep = takeFromHandOrDeck(engine, 0, 'deep-one');
  deep.zone = 'deck';
  engine.state.players[0].deck.push(deep);

  const action = engine.getActions().find(
    (entry) => entry.type === 'useLeader' && entry.sacrificeUid === walter.uid,
  );
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  // Both backlashes (sacrifice + madness Deep One entry) resolve, then sanity 0.
  assert.equal(engine.state.players[0].board.dream[0].cardId, 'deep-one');
  assert.equal(engine.phase, 'gameOver');
  assert.equal(engine.result().reason, 'sanity');
  assert.equal(engine.result().winner, 1);
  assert.equal(engine.state.players[0].sanity, 0);
});

// ── harold-ashby: leader active skill ──────────────────────────────────

test('harold-ashby: requires a legal target, seals any face-up board card, and heals 1', () => {
  const empty = setup({
    seed: 161,
    p0: { leader: 'harold-ashby', cards: ['finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway'] },
  });
  assert.equal(empty.getActions().filter((action) => action.type === 'useLeader').length, 0);

  const engine = setup({
    seed: 162,
    p0: { leader: 'harold-ashby', cards: ['finn-calloway', 'abjuration'] },
    p1: {
      leader: 'elias-thorne',
      cards: ['finn-calloway', 'nora-wells', 'old-library', 'stormy-night', 'silver-lantern'],
    },
  });
  const finn = putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  putUnit(engine, 1, 'nora-wells', 'scene', 1, { faceDown: true });
  const library = putLocation(engine, 1, 'old-library', 'archive');
  const storm = putEnvironment(engine, 1, 'stormy-night');
  const lantern = putEquipment(engine, 1, 'silver-lantern', finn);
  engine.state.players[0].sanity = 5;

  const actions = engine.getActions().filter((action) => action.type === 'useLeader');
  const targets = new Set(actions.map((action) => action.targetUid));
  assert.equal(targets.has(finn.uid), true);
  assert.equal(targets.has(lantern.uid), true);
  assert.equal(targets.has(library.uid), true);
  assert.equal(targets.has(storm.uid), true);
  assert.equal(actions.some((action) => action.targetUid === engine.state.players[1].board.scene[1].uid), false);

  const stormAction = actions.find((action) => action.targetUid === storm.uid);
  const result = engine.apply(stormAction);
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(
    result.events.map((event) => event.type).slice(0, 3),
    ['leaderSkill', 'seal', 'sanityChange'],
  );
  assert.equal(storm.sealed, true);
  assert.equal(engine.state.players[0].sanity, 6);

  // Used once per night: no further leader actions.
  assert.equal(engine.getActions().filter((action) => action.type === 'useLeader').length, 0);
});

// ── base rules for all eight card types ────────────────────────────────

test('card types: events/rituals discard, equipment attaches and drops, locations and environments persist', () => {
  const engine = setup({
    seed: 171,
    p0: {
      leader: 'harold-ashby',
      cards: [
        'finn-calloway',
        'silver-lantern',
        'old-library',
        'abjuration',
        'tide-ritual',
        'stormy-night',
        'thousand-eyes',
      ],
    },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'abjuration'] },
  });

  // Unit first, so equipment has a host.
  const finn = play(engine, 0, 'finn-calloway', (action) => action.faceDown === false).inst;
  forceTurn(engine, 0);

  // Equipment attach.
  const equipment = play(engine, 0, 'silver-lantern').inst;
  assert.equal(finn.equipment.uid, equipment.uid);

  // Location slot.
  forceTurn(engine, 0);
  const library = play(engine, 0, 'old-library').inst;
  assert.equal(engine.state.players[0].locations.archive.uid, library.uid);

  // A second location card in the same slot is not offered.
  engine.state.players[0].hand.push(structuredClone(library));
  engine.state.players[0].hand[engine.state.players[0].hand.length - 1].uid = 'extra-library';
  assert.equal(
    engine.getActions().some((action) => action.cardId === 'old-library'),
    false,
  );
  engine.state.players[0].hand.pop();

  // Event + ritual resolve and go to the ordinary discard.
  forceTurn(engine, 0);
  const event = play(engine, 0, 'abjuration');
  assert.equal(event.inst.zone, 'discard');
  assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === event.inst.uid));

  forceTurn(engine, 0);
  const ritual = play(engine, 0, 'tide-ritual');
  assert.equal(ritual.inst.zone, 'discard');

  // Environment lives until the night-end cleanup after scoring.
  forceTurn(engine, 0);
  const environment = play(engine, 0, 'stormy-night').inst;
  assert.equal(engine.state.environments.length, 1);

  // Oldgod occupies a normal slot (Thousand Eyes is text-inert this batch).
  forceTurn(engine, 0);
  engine.state.players[0].sanity = 6;
  const oldgod = play(engine, 0, 'thousand-eyes').inst;
  assert.equal(oldgod.location, 'archive');
  assert.equal(engine.state.players[0].board.archive.some((inst) => inst?.uid === oldgod.uid), true);

  // Host leaves: equipment goes to the ordinary discard, never the abyss.
  engine._sacrificeUnit(0, finn.uid, { allowReplacement: false });
  assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === equipment.uid));
  assert.equal(engine.state.players[0].abyss.some((inst) => inst.uid === equipment.uid), false);

  passUntilNight(engine, 2);
  assert.equal(engine.state.environments.length, 0);
  assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === environment.uid));
});

// ── faction passives ───────────────────────────────────────────────────

test('society passive heals 1 at night start after the night penalty; cult gets no heal', () => {
  const engine = setup({
    seed: 181,
    p0: { leader: 'harold-ashby', cards: ['abjuration'] },
    p1: { leader: 'elias-thorne', cards: ['abjuration'] },
    sanity: 4,
  });
  // Night 1 start: society already heals P0 4 -> 5; the cult player stays at 4.
  assert.deepEqual(engine.state.players.map((player) => player.sanity), [5, 4]);

  // Force a symmetric sanity total so the legacy night penalty is a tie.
  engine.state.players[0].sanity = 5;
  engine.state.players[1].sanity = 5;
  passUntilNight(engine, 2);
  assert.deepEqual(engine.state.history[0].sanityAfter, [4, 4]);
  // Night 2 start: society heals P0 4 -> 5 again; the cult player stays at 4.
  assert.deepEqual(engine.state.players.map((player) => player.sanity), [5, 4]);
});
