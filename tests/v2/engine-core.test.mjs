import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGame,
  countCards,
  ownedUids,
  LOCATIONS,
} from '../../src/engine/v2/index.js';

// ── synthetic blank-card helpers ────────────────────────────────────────

function card(id, overrides = {}) {
  return {
    id,
    name: id,
    faction: 'neutral',
    type: 'unit',
    location: 'scene',
    reasonPower: 1,
    madnessPower: 2,
    keywords: [],
    sanityCost: 0,
    ...overrides,
  };
}

function deckOf(cardId, count = 19) {
  return { leader: null, cards: Array(count).fill(cardId) };
}

function keepHands(engine) {
  for (const p of [0, 1]) {
    const result = engine.apply({ type: 'mulligan', player: p, uids: [] });
    assert.equal(result.ok, true, result.error);
  }
  assert.equal(engine.phase, 'play');
}

function passCurrent(engine) {
  const p = engine.state.current;
  const result = engine.apply({ type: 'pass', player: p });
  assert.equal(result.ok, true, result.error);
}

function playCard(engine, p, cardId, location, slot = 0, faceDown = false) {
  const inst = engine.state.players[p].hand.find((entry) => entry.cardId === cardId);
  assert.ok(inst, `P${p} should hold ${cardId}`);
  const action = engine.getActions().find(
    (entry) =>
      entry.type === 'playCard'
      && entry.player === p
      && entry.uid === inst.uid
      && entry.location === location
      && entry.slot === slot
      && entry.faceDown === faceDown,
  );
  assert.ok(action, `expected legal play: ${cardId} -> ${location}#${slot} faceDown=${faceDown}`);
  const result = engine.apply(action);
  assert.equal(result.ok, true, result.error);
  return inst.uid;
}

function endNight(engine, night) {
  let guard = 0;
  while (engine.phase === 'play' && engine.state.night === night) {
    passCurrent(engine);
    guard += 1;
    assert.ok(guard < 20, 'night did not end');
  }
}

// ── setup / mulligan ────────────────────────────────────────────────────

test('setup: 20-card presets, 8-card opening hands, mulligan up to 2', () => {
  const engine = createGame({ seed: 42 });

  assert.equal(engine.phase, 'mulligan');
  assert.equal(engine.night, 0);
  assert.equal(engine.state.firstPlayer, null);
  assert.deepEqual(engine.pending, { type: 'mulligan', players: [0, 1] });

  for (const p of [0, 1]) {
    const player = engine.state.players[p];
    assert.equal(player.hand.length, 8);
    assert.equal(player.deck.length, 11);
    assert.equal(player.discard.length, 0);
    assert.equal(player.sanity, 6);
    assert.equal(countCards(engine.state, p), 19);
    assert.ok(player.hand.every((inst) => inst.face === 'reason'));
    for (const location of LOCATIONS) {
      assert.equal(player.board[location].length, location === 'dream' ? 3 : 5);
      assert.ok(player.board[location].every((entry) => entry === null));
    }
  }
  assert.equal(engine.state.players[0].leaderId, 'harold-ashby');
  assert.equal(engine.state.players[1].leaderId, 'elias-thorne');

  // 37 mulligan combinations per player (keep / 8 singles / 28 pairs).
  assert.equal(engine.getActions().length, 74);

  // Too many cards is rejected without mutating the hand.
  const tooMany = engine.state.players[0].hand.slice(0, 3).map((inst) => inst.uid);
  const rejected = engine.apply({ type: 'mulligan', player: 0, uids: tooMany });
  assert.equal(rejected.ok, false);
  assert.equal(engine.state.players[0].hand.length, 8);
  assert.equal(engine.phase, 'mulligan');

  // P0 mulligans two cards: hand and deck stay at 8/11, conservation holds.
  const chosen = engine.state.players[0].hand.slice(0, 2).map((inst) => inst.uid);
  const first = engine.apply({ type: 'mulligan', player: 0, uids: chosen });
  assert.equal(first.ok, true, first.error);
  assert.equal(engine.state.players[0].hand.length, 8);
  assert.equal(engine.state.players[0].deck.length, 11);
  assert.equal(countCards(engine.state, 0), 19);
  assert.deepEqual(engine.pending, { type: 'mulligan', players: [1] });

  const second = engine.apply({ type: 'mulligan', player: 1, uids: [] });
  assert.equal(second.ok, true, second.error);
  assert.equal(engine.phase, 'play');
  assert.equal(engine.state.night, 1);
  assert.ok(engine.state.firstPlayer === 0 || engine.state.firstPlayer === 1);
  assert.equal(engine.state.current, engine.state.firstPlayer);
  assert.deepEqual(engine.state.mulliganDone, [true, true]);
  assert.deepEqual(engine.state.passed, [false, false]);
});

// ── determinism ─────────────────────────────────────────────────────────

test('same seed + same action sequence is fully deterministic', () => {
  const a = createGame({ seed: 'deterministic-seed' });
  const b = createGame({ seed: 'deterministic-seed' });

  let step = 0;
  while (a.phase !== 'gameOver' && step < 400) {
    const actionsA = a.getActions();
    const actionsB = b.getActions();
    assert.deepEqual(actionsA, actionsB);
    assert.ok(actionsA.length > 0, 'no legal action while game is running');

    const action = actionsA[(step * 13 + 5) % actionsA.length];
    const resultA = a.apply(action);
    const resultB = b.apply(action);
    assert.equal(resultA.ok, true, resultA.error);
    assert.equal(resultB.ok, true, resultB.error);
    assert.deepEqual(a.state, b.state);
    step += 1;
  }

  assert.equal(a.phase, 'gameOver');
  assert.ok(step < 400);
  assert.deepEqual(a.state, b.state);
  assert.deepEqual(a.result(), b.result());
});

// ── clone independence ──────────────────────────────────────────────────

test('clone() supports speculation without polluting the original game', () => {
  const engine = createGame({ seed: 7 });
  keepHands(engine);

  const opening = engine.getActions().find((action) => action.type === 'playCard');
  if (opening) assert.equal(engine.apply(opening).ok, true);

  const snapshot = structuredClone(engine.state);
  const clone = engine.clone();

  assert.notStrictEqual(clone.state, engine.state);
  assert.deepEqual(clone.state, snapshot);

  // One speculative action on the clone must not touch the original.
  const p = clone.state.current;
  const clonePass = clone.apply({ type: 'pass', player: p });
  assert.equal(clonePass.ok, true, clonePass.error);
  assert.deepEqual(engine.state, snapshot);

  // Play the clone to completion; the original snapshot must remain byte-equal.
  let guard = 0;
  while (clone.phase !== 'gameOver' && guard < 400) {
    const actions = clone.getActions();
    assert.ok(actions.length > 0);
    const result = clone.apply(actions[guard % actions.length]);
    assert.equal(result.ok, true, result.error);
    guard += 1;
  }
  assert.equal(clone.phase, 'gameOver');
  assert.deepEqual(engine.state, snapshot);
});

// ── hidden information ──────────────────────────────────────────────────

test('viewFor hides opponent hand, deck order, and face-down identities', () => {
  const cards = [
    card('hidden-a', { reasonPower: 2, madnessPower: 5, keywords: ['stealth'] }),
    card('hidden-b', { reasonPower: 2, madnessPower: 5, keywords: ['stealth'] }),
  ];
  const engine = createGame({
    seed: 11,
    cardPool: cards,
    decks: [deckOf('hidden-a'), deckOf('hidden-b')],
    startingSanity: 3,
  });
  keepHands(engine);

  if (engine.state.current === 1) passCurrent(engine);
  playCard(engine, 0, 'hidden-a', 'scene', 0, true);

  const own = engine.viewFor(0);
  const opponent = engine.viewFor(1);

  // Controller sees the identity; opponent sees only a hidden card.
  assert.equal(own.players[0].board.scene[0].cardId, 'hidden-a');
  assert.equal(opponent.players[0].board.scene[0].hidden, true);
  assert.equal(opponent.players[0].board.scene[0].power, 0);
  assert.equal('cardId' in opponent.players[0].board.scene[0], false);
  assert.equal('face' in opponent.players[0].board.scene[0], false);

  // Hands and deck order are redacted for the opponent.
  assert.equal(opponent.players[0].hand.length, 0);
  assert.equal(opponent.players[0].handCount, 7);
  assert.equal('deck' in opponent.players[0], false);
  assert.equal(own.players[1].hand.length, 0);
  assert.equal(own.players[1].handCount, 8);

  // No identity leaks through any nested view field or event.
  assert.equal(JSON.stringify(opponent).includes('hidden-a'), false);
  assert.equal(JSON.stringify(own).includes('hidden-b'), false);

  const hiddenEvent = opponent.events.find((event) => event.type === 'play' && event.player === 0);
  assert.equal(hiddenEvent.faceDown, true);
  assert.equal('cardId' in hiddenEvent, false);
  assert.equal('face' in hiddenEvent, false);

  const ownEvent = own.events.find((event) => event.type === 'play' && event.player === 0);
  assert.equal(ownEvent.cardId, 'hidden-a');

  // Spectators receive no action list at all.
  assert.deepEqual(engine.viewFor(null).actions, []);

  // Night end reveals the card before scoring.
  endNight(engine, 1);
  const revealed = engine.viewFor(1);
  assert.equal(revealed.players[0].board.scene[0].cardId, 'hidden-a');
  assert.equal(revealed.players[0].board.scene[0].faceDown, false);
});

// ── card conservation ───────────────────────────────────────────────────

test('card count is conserved through every action (hand + deck + discard + board)', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const engine = createGame({ seed });

    const check = () => {
      for (const p of [0, 1]) {
        assert.equal(countCards(engine.state, p), 19, `seed ${seed}, player ${p}`);
        const uids = ownedUids(engine.state, p);
        assert.equal(new Set(uids).size, uids.length, `duplicate uid for player ${p}`);
      }
    };

    check();
    let step = 0;
    while (engine.phase !== 'gameOver' && step < 400) {
      const actions = engine.getActions();
      assert.ok(actions.length > 0, `seed ${seed} deadlocked`);
      const result = engine.apply(actions[(step * 17 + seed) % actions.length]);
      assert.equal(result.ok, true, result.error);
      check();
      step += 1;
    }
    assert.equal(engine.phase, 'gameOver');
    assert.ok(step < 400);
  }
});

// ── scoring / night flow ────────────────────────────────────────────────

test('scoring, night winner, and loser-goes-first rotation', () => {
  const engine = createGame({
    seed: 3,
    cardPool: [card('five', { reasonPower: 5, madnessPower: 8 })],
    decks: [deckOf('five'), deckOf('five')],
  });
  keepHands(engine);

  let played = false;
  while (engine.phase === 'play' && engine.state.night === 1) {
    if (engine.state.current === 0 && !played) {
      playCard(engine, 0, 'five', 'scene', 0);
      played = true;
    } else {
      passCurrent(engine);
    }
  }

  assert.equal(engine.state.history.length, 1);
  const firstNight = engine.state.history[0];
  assert.equal(firstNight.scores[0].total, 5);
  assert.equal(firstNight.scores[1].total, 0);
  assert.equal(firstNight.winner, 0);
  assert.deepEqual(firstNight.nightWins, [1, 0]);
  assert.deepEqual(firstNight.sanityAfter, [6, 5]);

  assert.equal(engine.phase, 'play');
  assert.equal(engine.state.night, 2);
  assert.equal(engine.state.firstPlayer, 1, 'the night-1 loser starts night 2');

  let played2 = false;
  while (engine.phase === 'play' && engine.state.night === 2) {
    if (engine.state.current === 1) {
      passCurrent(engine);
    } else if (engine.state.current === 0 && !played2) {
      playCard(engine, 0, 'five', 'scene', 1);
      played2 = true;
    } else {
      passCurrent(engine);
    }
  }

  assert.equal(engine.phase, 'gameOver');
  assert.equal(engine.result().winner, 0);
  assert.equal(engine.result().reason, 'nightWins');
  assert.deepEqual(engine.result().nightWins, [2, 0]);
});

test('tie night: both lose 1 sanity and the previous first player keeps priority', () => {
  const engine = createGame({
    seed: 5,
    cardPool: [card('one')],
    decks: [deckOf('one'), deckOf('one')],
  });
  keepHands(engine);
  const first = engine.state.firstPlayer;

  passCurrent(engine);
  passCurrent(engine);

  assert.equal(engine.state.history.length, 1);
  const tie = engine.state.history[0];
  assert.equal(tie.tie, true);
  assert.equal(tie.winner, null);
  assert.deepEqual(tie.sanityAfter, [5, 5]);
  assert.deepEqual(engine.state.nightWins, [0, 0]);
  assert.equal(engine.state.night, 2);
  assert.equal(engine.state.firstPlayer, first);
});

// ── sanity zero / match result ──────────────────────────────────────────

test('sanity zero is an immediate loss; simultaneous zero is a draw', () => {
  const cards = [card('one')];

  const oneZero = createGame({
    seed: 8,
    cardPool: cards,
    decks: [deckOf('one'), deckOf('one')],
    startingSanity: [1, 2],
  });
  keepHands(oneZero);
  passCurrent(oneZero);
  passCurrent(oneZero);

  assert.equal(oneZero.phase, 'gameOver');
  assert.equal(oneZero.result().winner, 1);
  assert.equal(oneZero.result().reason, 'sanity');
  assert.deepEqual(oneZero.result().sanity, [0, 2]);

  const bothZero = createGame({
    seed: 9,
    cardPool: cards,
    decks: [deckOf('one'), deckOf('one')],
    startingSanity: 1,
  });
  keepHands(bothZero);
  passCurrent(bothZero);
  passCurrent(bothZero);

  assert.equal(bothZero.phase, 'gameOver');
  assert.equal(bothZero.result().winner, null);
  assert.equal(bothZero.result().reason, 'sanity');
  assert.deepEqual(bothZero.result().sanity, [0, 0]);
});

test('three nights: loser starts next night, tie keeps priority, final tiebreak resolves', () => {
  const cards = [
    card('p5', { reasonPower: 5, madnessPower: 5 }),
    card('p1', { reasonPower: 1, madnessPower: 1 }),
    card('p3', { reasonPower: 3, madnessPower: 3 }),
  ];
  const p0Deck = { leader: null, cards: [...Array(10).fill('p5'), ...Array(9).fill('p1')] };
  const p1Deck = { leader: null, cards: Array(19).fill('p3') };

  // Draw the whole deck so this scenario is fully scripted.
  const engine = createGame({
    seed: 21,
    cardPool: cards,
    decks: [p0Deck, p1Deck],
    startingHand: 19,
  });
  keepHands(engine);

  // Night 1: P0 plays one 5-power unit; P1 passes.
  let p0Played = false;
  while (engine.phase === 'play' && engine.state.night === 1) {
    if (engine.state.current === 0 && !p0Played) {
      playCard(engine, 0, 'p5', 'scene', 0);
      p0Played = true;
    } else {
      passCurrent(engine);
    }
  }
  assert.equal(engine.state.history[0].winner, 0);
  assert.equal(engine.state.night, 2);
  assert.equal(engine.state.firstPlayer, 1, 'night-1 loser starts night 2');

  // Night 2: P1 plays two 3-power units; P0 passes. P1 wins 6 vs 5.
  let p1Plays = 0;
  while (engine.phase === 'play' && engine.state.night === 2) {
    if (engine.state.current === 1 && p1Plays < 2) {
      playCard(engine, 1, 'p3', 'scene', p1Plays);
      p1Plays += 1;
    } else {
      passCurrent(engine);
    }
  }
  assert.equal(engine.state.history[1].winner, 1);
  assert.deepEqual(engine.state.history[1].scores.map((score) => score.total), [5, 6]);
  assert.equal(engine.state.night, 3);
  assert.equal(engine.state.firstPlayer, 0, 'night-2 loser starts night 3');

  // Night 3: P0 plays a 1-power unit to tie 6 vs 6. Sanity is also tied.
  let p0Played3 = false;
  while (engine.phase === 'play' && engine.state.night === 3) {
    if (engine.state.current === 0 && !p0Played3) {
      playCard(engine, 0, 'p1', 'scene', 1);
      p0Played3 = true;
    } else {
      passCurrent(engine);
    }
  }
  assert.equal(engine.state.history[2].tie, true);
  assert.deepEqual(engine.state.history[2].scores.map((score) => score.total), [6, 6]);
  assert.deepEqual(engine.state.history[2].sanityAfter, [4, 4]);

  assert.equal(engine.phase, 'gameOver');
  assert.equal(engine.result().reason, 'tiebreak');
  assert.equal(engine.result().tiebreak, 'totalScore');
  assert.equal(engine.result().winner, 0);
  assert.deepEqual(engine.result().totalScores, [16, 12]);
});

// ── dream admission (rules §4.4) ────────────────────────────────────────
//
// v2.2 replaces the v2.1 placeholder "dream = madness face only" with the
// frozen §4.4 admission rules.  The old assertion that reason-face cards can
// never enter the dream is not part of v1: a dream-native unit may enter
// face-up on either face, while `any` + stealth must enter face-down and
// `any` without stealth cannot enter at all.

test('dream admission: affinity, stealth face-down entry, and the per-night limit', () => {
  const cards = [
    card('native', { location: 'dream', reasonPower: 2, madnessPower: 9 }),
    card('lurker', { location: 'any', reasonPower: 3, madnessPower: 5, keywords: ['stealth'] }),
    card('walker', { location: 'any', reasonPower: 4, madnessPower: 4 }),
  ];
  const p0Deck = {
    leader: null,
    cards: [
      ...Array(4).fill('native'),
      ...Array(4).fill('lurker'),
      ...Array(4).fill('walker'),
      ...Array(7).fill('native'),
    ],
  };
  const engine = createGame({
    seed: 31,
    cardPool: cards,
    decks: [p0Deck, deckOf('walker')],
    startingSanity: 4,
    startingHand: 19,
  });
  keepHands(engine);
  if (engine.state.current === 1) passCurrent(engine);
  assert.equal(engine.state.players[0].hand[0].face, 'reason');

  // Dream-native, no stealth: may enter face-up on the reason face.
  playCard(engine, 0, 'native', 'dream', 0, false);
  assert.equal(engine.state.players[0].board.dream[0].face, 'reason');

  // any + stealth: the dream requires a face-down entry, never face-up.
  const lurker = engine.state.players[0].hand.find((inst) => inst.cardId === 'lurker');
  assert.ok(lurker);
  const lurkerActions = engine.getActions().filter(
    (action) => action.type === 'playCard' && action.uid === lurker.uid && action.location === 'dream',
  );
  assert.equal(lurkerActions.some((action) => action.faceDown === false), false);
  assert.equal(lurkerActions.some((action) => action.faceDown === true), true);

  // any without stealth: no dream entry at all.
  const walker = engine.state.players[0].hand.find((inst) => inst.cardId === 'walker');
  assert.ok(walker);
  assert.equal(
    engine.getActions().some(
      (action) => action.type === 'playCard' && action.uid === walker.uid && action.location === 'dream',
    ),
    false,
  );

  // Second hand entry fills the per-night limit; a third is illegal.
  playCard(engine, 0, 'lurker', 'dream', 1, true);
  assert.equal(engine.state.players[0].flags.dreamEntries, 2);
  assert.equal(
    engine.getActions().some((action) => action.type === 'playCard' && action.location === 'dream'),
    false,
  );
});

// ── self-play smoke (the 1000-game run lives in scripts/selfplay.mjs) ───

test('random legal self-play never crashes or deadlocks', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const engine = createGame({ seed });
    let steps = 0;
    while (engine.phase !== 'gameOver') {
      const actions = engine.getActions();
      assert.ok(actions.length > 0, `seed ${seed} produced no legal actions`);
      const result = engine.apply(actions[(steps * 7 + seed) % actions.length]);
      assert.equal(result.ok, true, result.error);
      steps += 1;
      assert.ok(steps < 400, `seed ${seed} did not finish`);
    }
    assert.ok(engine.result());
  }
});
