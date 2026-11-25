
> build · flint-40b-free
→ Read . 
$ find /workspace -maxdepth 2 -type d 2>/dev/null | head -50; echo "---"; ls /workspace 2>/dev/null || ls D:\Games\greyharbor
Out-File: Could not find a part of the path 'D:\dev\null'.
---
Out-File: Could not find a part of the path 'D:\dev\null'.

    Directory: D:\Games\greyharbor

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d----          2026/11/24    21:44                demo
d----          2026/11/24    22:20                docs
d----          2026/11/24    21:44                research
d----          2026/11/24    21:44                screenshots
d----          2026/11/24    22:43                scripts
d----          2026/11/25    12:57                scripts-tools
d----          2026/11/24    21:44                src
d----          2026/11/24    22:43                tests
-a---          2026/10/17     8:32            452 .gitignore
-a---          2026/10/17     8:32              0 .nojekyll
-a---          2026/11/24    21:06            207 ������Ϸ.bat
-a---          2026/11/24    21:58           4934 card-table-v1.csv
-a---          2026/10/17     8:32           1600 index.html
-a---          2026/10/17     8:32           1069 LICENSE
-a---          2026/11/24    21:56          75719 migration-plan.md
-a---          2026/10/17     8:32            497 package.json
-a---          2026/11/24    22:27          77424 phase1-transcript.md
-a---          2026/11/24    22:45          70527 phase2.1-transcript.md
-a---          2026/11/25    11:58         247781 phase2.2a-transcript.md
-a---          2026/11/25    15:37              0 phase2.2b-final-transcript.md
-a---          2026/11/25    13:36         270679 phase2.2b-resume-transcript.md
-a---          2026/11/25    12:42         132695 phase2.2b-transcript.md
-a---          2026/10/17     8:32           8059 README.md
-a---          2026/10/17     8:32           1944 server.mjs
> build · flint-40b-free
$ ls -R /workspace/src /workspace/tests /workspace/scripts /workspace/docs | head -120
head: The term 'head' is not recognized as a name of a cmdlet, function, script file, or executable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
$ wc -l /workspace/tests/v2/*.mjs /workspace/src/engine/v2/*.js /workspace/src/engine/v2/**/*.js /workspace/scripts/*.mjs /workspace/docs/GREYHARBOR_RULES_V1.md 2>/dev/null
wc: The term 'wc' is not recognized as a name of a cmdlet, function, script file, or executable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
> build · flint-40b-free
$ which bash pwsh node npm; node --version
which: The term 'which' is not recognized as a name of a cmdlet, function, script file, or executable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
v22.23.2
> build · flint-40b-free
$ ls -R src tests scripts docs src/engine src/engine/v2 src/data src/data/v2 2>/dev/null | head -150
Out-File: Could not find a part of the path 'D:\dev\null'.
> build · flint-40b-free
$ Get-ChildItem -Recurse src | Select-Object -First 200 | ForEach-Object { $_.FullName }
D:\Games\greyharbor\src\data
D:\Games\greyharbor\src\engine
D:\Games\greyharbor\src\styles
D:\Games\greyharbor\src\ui
D:\Games\greyharbor\src\app.js
D:\Games\greyharbor\src\main.js
D:\Games\greyharbor\src\data\ability-text.js
D:\Games\greyharbor\src\data\card-table.normalized.json
D:\Games\greyharbor\src\data\cards.js
D:\Games\greyharbor\src\data\db.js
D:\Games\greyharbor\src\data\decks.js
D:\Games\greyharbor\src\data\factions.js
D:\Games\greyharbor\src\data\leaders.js
D:\Games\greyharbor\src\engine\v2
D:\Games\greyharbor\src\engine\ai.js
D:\Games\greyharbor\src\engine\deck.js
D:\Games\greyharbor\src\engine\engine.js
D:\Games\greyharbor\src\engine\rng.js
D:\Games\greyharbor\src\engine\scoring.js
D:\Games\greyharbor\src\engine\v2\effects
D:\Games\greyharbor\src\engine\v2\cards.js
D:\Games\greyharbor\src\engine\v2\engine.js
D:\Games\greyharbor\src\engine\v2\index.js
D:\Games\greyharbor\src\engine\v2\scoring.js
D:\Games\greyharbor\src\engine\v2\view.js
D:\Games\greyharbor\src\engine\v2\effects\dsl.js
D:\Games\greyharbor\src\engine\v2\effects\index.js
D:\Games\greyharbor\src\engine\v2\effects\interpreter.js
D:\Games\greyharbor\src\engine\v2\effects\registry.js
D:\Games\greyharbor\src\engine\v2\effects\targets.js
D:\Games\greyharbor\src\styles\card.css
D:\Games\greyharbor\src\styles\deckbuilder.css
D:\Games\greyharbor\src\styles\fx.css
D:\Games\greyharbor\src\styles\screens.css
D:\Games\greyharbor\src\styles\theme.css
D:\Games\greyharbor\src\ui\art.js
D:\Games\greyharbor\src\ui\audio.js
D:\Games\greyharbor\src\ui\board.js
D:\Games\greyharbor\src\ui\card-fallback.js
D:\Games\greyharbor\src\ui\card-render.js
D:\Games\greyharbor\src\ui\deckbuilder.js
D:\Games\greyharbor\src\ui\fx.js
D:\Games\greyharbor\src\ui\i18n.js
D:\Games\greyharbor\src\ui\menu.js
D:\Games\greyharbor\src\ui\tooltip.js
> build · flint-40b-free
$ Get-ChildItem -Recurse tests scripts | Select-Object -ExpandProperty FullName
(no output)
> build · flint-40b-free
$ Get-ChildItem -Recurse tests | ForEach-Object { $_.FullName }; Get-ChildItem -Recurse scripts | ForEach-Object { $_.FullName }
D:\Games\greyharbor\tests\v2
D:\Games\greyharbor\tests\ai.test.mjs
D:\Games\greyharbor\tests\card-data.test.mjs
D:\Games\greyharbor\tests\data-audit.test.mjs
D:\Games\greyharbor\tests\e2e.test.mjs
D:\Games\greyharbor\tests\engine.test.mjs
D:\Games\greyharbor\tests\fixtures.mjs
D:\Games\greyharbor\tests\v2\effects-cards.test.mjs
D:\Games\greyharbor\tests\v2\effects-pilot.test.mjs
D:\Games\greyharbor\tests\v2\engine-core.test.mjs
D:\Games\greyharbor\scripts\e2e.mjs
D:\Games\greyharbor\scripts\import-card-table.mjs
D:\Games\greyharbor\scripts\selfplay.mjs
> build · flint-40b-free
$ Get-Content -Raw tests/v2/effects-cards.test.mjs | ForEach-Object { $_.Split("`n") } | Where-Object { $_ } | Select-Object -Skip 0 -First 120
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
// ���� deterministic scenario helpers (same contract as effects-pilot) ������������
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
> build · flint-40b-free
$ Get-Content -Raw tests/v2/effects-cards.test.mjs | ForEach-Object { $_.Split("`n") } | Where-Object { $_ } | Select-Object -Skip 120 -First 260
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
// ���� lucia-vaughn: dream-native stealth (��4.4 / ��6.1) ��������������������������������������������
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
// ���� frank-holt / finn-calloway: adjacent chain caps (��6.5) ����������������������������������
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
// ���� arthur-pendleton: public reveal peek (��9.10) ����������������������������������������������������
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
// ���� abjuration: two-choice effect (��9.9) ��������������������������������������������������������������������
test('abjuration: two choices �� remove corruption or remove an environment', () => {
  const engine = setup({
    seed: 205,
    p0: { leader: 'harold-ashby', cards: ['abjuration', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one', 'stormy-night'] },
  });
  const finn = putUnit(engine, 1, 'finn-calloway', 'scene', 0);
  engine._applyCorruption(0, { kind: 'unit', inst: finn, player: 1, location: 'scene', slot: 0 }, 1);
  assert.equal(finn.corruptionTokens.length, 1);
  const played = play(engine, 0, 'abjuration', (action) => action.choice?.mode === 'removeCorruption');
  assert.ok(played.events.some((event) => event.type === 'corruptionRemoved'));
  assert.equal(finn.corruptionTokens.length, 0);
  assert.equal(finn.corruptionLoss, 0);
  // Second mode: remove 1 environment card to the discard pile.
  forceTurn(engine, 0);
  const env = putEnvironment(engine, 1, 'stormy-night');
  const playedEnv = play(engine, 0, 'abjuration', (action) => action.choice?.mode === 'removeEnvironment');
  assert.ok(playedEnv.events.some((event) => event.type === 'discard'));
  assert.equal(engine.state.environments.length, 0);
});
// ���� warding-rite: location protection (��9.9) ������������������������������������������������������������
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
// ���� silver-lantern: replacement on seal / destroy, not on sacrifice (��9.9) ��
test('silver-lantern: replaces seal and destroy but not sacrifice', () => {
  const engine = setup({
    seed: 207,
    p0: { leader: 'harold-ashby', cards: ['silver-lantern', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const finn = putUnit(engine, 0, 'finn-calloway', 'scene', 0);
  const lantern = putEquipment(engine, 0, 'silver-lantern', finn);
  assert.equal(currentUnitPower(engine.state, 0, finn, 'scene', 0), 5, 'silver lantern gives +2');
  const sealTarget = { kind: 'unit', uid: finn.uid, inst: finn, player: 0, location: 'scene', slot: 0 };
  assert.equal(engine._sealTarget(sealTarget, 'untilNextNight', { controller: 0 }), false, 'unsealed lantern replaces the seal');
  assert.equal(finn.sealed, false);
  assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === lantern.uid));
  assert.ok(engine.state.events.some((event) => event.type === 'silverLanternReplace' && event.event === 'seal'));
  const destroyTarget = { kind: 'unit', uid: finn.uid, inst: finn, player: 0, location: 'scene', slot: 0 };
  assert.equal(engine._destroyTarget(destroyTarget, 'destroy'), false, 'unsealed lantern replaces the destroy');
  assert.equal(finn.equipment, null);
  assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === lantern.uid));
  // Sacrifice/devour never route through the lantern replacement.
  const sacrificed = engine._sacrificeUnit(0, finn.uid, { allowReplacement: false });
  assert.equal(sacrificed.uid, finn.uid);
  assert.equal(engine.state.players[0].abyss.length, 1);
  assert.equal(engine.state.players[0].discard.some((inst) => inst.uid === finn.uid), false, 'sacrifice discards the host to the abyss, not the lantern');
});
// ���� old-library: corruption immunity + archive discount (��6.3 / ��5.4) ����������
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
// ���� zealot / deep-one: madness face values, backlash and sanity cost ��������������
test('zealot: madness face is printed +3 with backlash, reason face is plain', () => {
  const engine = setup({
    seed: 209,
    p0: { leader: 'harold-ashby', cards: ['zealot', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const zealot = putUnit(engine, 0, 'zealot', 'scene', 0, { face: 'madness' });
  assert.equal(currentUnitPower(engine.state, 0, zealot, 'scene', 0), 9, 'madness face: base 6 + 3');
  engine.state.current = 0;
  engine._maybeBacklash(0, zealot, engine.cardIndex['zealot'], { context: 'entry' });
  assert.equal(engine.state.players[0].sanity, 5, 'madness entry backlash loses 1 sanity');
  const reasonEngine = setup({
    seed: 209,
    p0: { leader: 'harold-ashby', cards: ['zealot', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
  });
  const reasonUnit = putUnit(reasonEngine, 0, 'zealot', 'scene', 0, { face: 'reason' });
  assert.equal(currentUnitPower(reasonEngine.state, 0, reasonUnit, 'scene', 0), 3, 'reason face stays at base 3');
});
test('deep-one: madness face is printed +3 with backlash and pays 1 sanity', () => {
  const madnessEngine = setup({
    seed: 210,
    p0: { leader: 'elias-thorne', cards: ['deep-one', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  const deep = putUnit(madnessEngine, 0, 'deep-one', 'dream', 0, { face: 'madness' });
  assert.equal(currentUnitPower(madnessEngine.state, 0, deep, 'dream', 0), 11, 'madness face: base 8 + 3');
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
// ���� gravedigger: mandatory sacrifice + abyss retrieval (��6.4) ������������������������
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
// ���� whisperer: flip drains the opponent sanity (��6.1) ������������������������������������������
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
// ���� bell-claw: devour permanent gain (��6.4) ����������������������������������������������������������������
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
  assert.equal(bell.inst.permanentPower, 3, 'bell-claw permanently gained the devoured current power');
> build · flint-40b-free
$ Get-Content -Raw tests/v2/effects-cards.test.mjs | ForEach-Object { $_.Split("`n") } | Where-Object { $_ } | Select-Object -Skip 340 -First 240
deep.zone = 'abyss';
  engine.state.players[0].abyss.push(deep);
  const played = play(engine, 0, 'gravedigger', (action) => action.choice?.mode === 'grave');
  assert.ok(played.action.choice?.mode === 'grave');
  assert.ok(played.events.some((event) => event.type === 'sacrifice'));
  assert.ok(engine.state.players[0].abyss.some((inst) => inst.uid === zealot.uid), 'sacrificed unit went to the abyss');
  assert.equal(engine.state.players[0].abyss.length, 1);
  assert.equal(engine.state.players[0].hand.some((inst) => inst.uid === deep.uid), true, 'one abyss unit was retrieved');
});
// ���� whisperer: flip drains the opponent sanity (��6.1) ������������������������������������������
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
// ���� bell-claw: devour permanent gain (��6.4) ����������������������������������������������������������������
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
  assert.equal(bell.inst.permanentPower, 3, 'bell-claw permanently gained the devoured current power');
});
// ���� seance: mandatory sacrifice + bounded retrieval (��6.4) ����������������������������������
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
// ���� tide-ritual: dream +3 this night, expires next night ��������������������������������������
test('tide-ritual: gives the own dream row +3 this night and expires afterwards', () => {
  const engine = setup({
    seed: 217,
    p0: { leader: 'elias-thorne', cards: ['tide-ritual', 'deep-one', 'finn-calloway', 'finn-calloway'] },
    p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
  });
  const played = play(engine, 0, 'tide-ritual');
  assert.ok(played.events.some((event) => event.type === 'auraAdded'));
  putUnit(engine, 0, 'deep-one', 'dream', 0);
  assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.dream[0], 'dream', 0), 8, 'own dream unit +3');
  passUntilNight(engine, 2);
  assert.equal(engine.state.effects.length, 0, 'this-night aura cleared at night end cleanup');
});
// ���� lunar-eclipse / stormy-night: global auras ��������������������������������������������������������
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
  assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.scene[0], 'scene', 0), 2);
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
  assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.scene[0], 'scene', 0), 1);
  assert.equal(currentUnitPower(engine.state, 1, engine.state.players[1].board.scene[0], 'scene', 0), 1);
});
// ���� drowned-altar: scene sacrifice immunity + cult echo +3 ����������������������������������
test('drowned-altar: scene sacrifices skip backlash and the cult echo becomes +3', () => {
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
  assert.equal(result.events.find((event) => event.type === 'cultEcho').bonus, 3, 'unsealed altar upgrades the echo to +3');
  assert.equal(engine.state.players[0].sanity, 2, 'deep-one madness entry backlash still applies after the summon');
});
// ���� silas-gold: discard hand + pick from deck top 3 (��6.2) ����������������������������������
test('silas-gold: discard one hand card and retrieve one of the top three', () => {
  const engine = setup({
    seed: 221,
    p0: { leader: 'harold-ashby', cards: ['silas-gold', 'finn-calloway', 'deep-one', 'zealot', 'whisperer', 'gravedigger'] },
    p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
    startingHand: 3,
  });
  const silas = putUnit(engine, 0, 'silas-gold', 'archive', 0, { faceDown: true });
  const reveals = engine.getActions().filter(
    (action) => action.type === 'reveal' && action.uids.includes(silas.uid),
  );
  assert.equal(reveals.length, 1, 'a face-down Silas has exactly one reveal line');
  const result = engine.apply(reveals[0]);
  assert.equal(result.ok, true, result.error);
  assert.ok(result.events.some((event) => event.type === 'revealDeckTop'));
  assert.ok(result.events.some((event) => event.type === 'shuffleDeck'));
  assert.equal(result.events.some((event) => event.type === 'abyssToHand'), false, 'silas picks from the deck, not the abyss');
});
// ���� thousand-eyes: seal leader exception + face-up stealth count ����������������������
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
// ���� unexpected-aid: permanent +3 and full cleanse (��9.9) ����������������������������������������
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
// ���� the-sleeper: seal immunity, entry cost, nightly drain ��������������������������������������
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
> build · flint-40b-free
$ grep -n "^test(\|^// \|^import\|^function\|^const" tests/v2/effects-cards.test.mjs | head -200
grep: The term 'grep' is not recognized as a name of a cmdlet, function, script file, or executable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
> build · flint-40b-free
$ Get-Content tests/v2/effects-cards.test.mjs -Raw | Split-Path | Out-Null; Get-Content tests/v2/effects-cards.test.mjs | Select-String "^test\(|^\s*test\(" -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { $_.Value }
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
> build · flint-40b-free
$ Get-Content tests/v2/effects-cards.test.mjs | ForEach-Object { if ($_ -match '^test\(.+\)\s*\(') { $matches[0] } }
(no output)
> build · flint-40b-free
$ Get-Content tests/v2/effects-cards.test.mjs | ForEach-Object { $_.TrimStart(); if ($_ -match '^test\(') { $_.TrimStart() } }
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

// ���� deterministic scenario helpers (same contract as effects-pilot) ������������

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

// ���� lucia-vaughn: dream-native stealth (��4.4 / ��6.1) ��������������������������������������������

test('lucia-vaughn: dream-native stealth enters the dream face-down with no enter effect', () => {
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

// ���� frank-holt / finn-calloway: adjacent chain caps (��6.5) ����������������������������������

test('frank-holt: adjacent chain counts own neighbours with cap +3', () => {
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

// ���� arthur-pendleton: public reveal peek (��9.10) ����������������������������������������������������

test('arthur-pendleton: reveal peeks the opponent hand publicly', () => {
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

// ���� abjuration: two-choice effect (��9.9) ��������������������������������������������������������������������

test('abjuration: two choices �� remove corruption or remove an environment', () => {
test('abjuration: two choices �� remove corruption or remove an environment', () => {
const engine = setup({
seed: 205,
p0: { leader: 'harold-ashby', cards: ['abjuration', 'finn-calloway', 'finn-calloway'] },
p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one', 'stormy-night'] },
});
const finn = putUnit(engine, 1, 'finn-calloway', 'scene', 0);
engine._applyCorruption(0, { kind: 'unit', inst: finn, player: 1, location: 'scene', slot: 0 }, 1);
assert.equal(finn.corruptionTokens.length, 1);

const played = play(engine, 0, 'abjuration', (action) => action.choice?.mode === 'removeCorruption');
assert.ok(played.events.some((event) => event.type === 'corruptionRemoved'));
assert.equal(finn.corruptionTokens.length, 0);
assert.equal(finn.corruptionLoss, 0);

// Second mode: remove 1 environment card to the discard pile.
forceTurn(engine, 0);
const env = putEnvironment(engine, 1, 'stormy-night');
const playedEnv = play(engine, 0, 'abjuration', (action) => action.choice?.mode === 'removeEnvironment');
assert.ok(playedEnv.events.some((event) => event.type === 'discard'));
assert.equal(engine.state.environments.length, 0);
});

// ���� warding-rite: location protection (��9.9) ������������������������������������������������������������

test('warding-rite: wards one friendly location this night (+1, seal + corruption immunity)', () => {
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

// ���� silver-lantern: replacement on seal / destroy, not on sacrifice (��9.9) ��

test('silver-lantern: replaces seal and destroy but not sacrifice', () => {
test('silver-lantern: replaces seal and destroy but not sacrifice', () => {
const engine = setup({
seed: 207,
p0: { leader: 'harold-ashby', cards: ['silver-lantern', 'finn-calloway', 'finn-calloway'] },
p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
});
const finn = putUnit(engine, 0, 'finn-calloway', 'scene', 0);
const lantern = putEquipment(engine, 0, 'silver-lantern', finn);
assert.equal(currentUnitPower(engine.state, 0, finn, 'scene', 0), 5, 'silver lantern gives +2');

const sealTarget = { kind: 'unit', uid: finn.uid, inst: finn, player: 0, location: 'scene', slot: 0 };
assert.equal(engine._sealTarget(sealTarget, 'untilNextNight', { controller: 0 }), false, 'unsealed lantern replaces the seal');
assert.equal(finn.sealed, false);
assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === lantern.uid));
assert.ok(engine.state.events.some((event) => event.type === 'silverLanternReplace' && event.event === 'seal'));

const destroyTarget = { kind: 'unit', uid: finn.uid, inst: finn, player: 0, location: 'scene', slot: 0 };
assert.equal(engine._destroyTarget(destroyTarget, 'destroy'), false, 'unsealed lantern replaces the destroy');
assert.equal(finn.equipment, null);
assert.ok(engine.state.players[0].discard.some((inst) => inst.uid === lantern.uid));

// Sacrifice/devour never route through the lantern replacement.
const sacrificed = engine._sacrificeUnit(0, finn.uid, { allowReplacement: false });
assert.equal(sacrificed.uid, finn.uid);
assert.equal(engine.state.players[0].abyss.length, 1);
assert.equal(engine.state.players[0].discard.some((inst) => inst.uid === finn.uid), false, 'sacrifice discards the host to the abyss, not the lantern');
});

// ���� old-library: corruption immunity + archive discount (��6.3 / ��5.4) ����������

test('old-library: archive cards are corruption immune and the first archive play costs 1 less', () => {
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

// ���� zealot / deep-one: madness face values, backlash and sanity cost ��������������

test('zealot: madness face is printed +3 with backlash, reason face is plain', () => {
test('zealot: madness face is printed +3 with backlash, reason face is plain', () => {
const engine = setup({
seed: 209,
p0: { leader: 'harold-ashby', cards: ['zealot', 'finn-calloway', 'finn-calloway'] },
p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
});
const zealot = putUnit(engine, 0, 'zealot', 'scene', 0, { face: 'madness' });
assert.equal(currentUnitPower(engine.state, 0, zealot, 'scene', 0), 9, 'madness face: base 6 + 3');
engine.state.current = 0;
engine._maybeBacklash(0, zealot, engine.cardIndex['zealot'], { context: 'entry' });
assert.equal(engine.state.players[0].sanity, 5, 'madness entry backlash loses 1 sanity');

const reasonEngine = setup({
seed: 209,
p0: { leader: 'harold-ashby', cards: ['zealot', 'finn-calloway', 'finn-calloway'] },
p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
});
const reasonUnit = putUnit(reasonEngine, 0, 'zealot', 'scene', 0, { face: 'reason' });
assert.equal(currentUnitPower(reasonEngine.state, 0, reasonUnit, 'scene', 0), 3, 'reason face stays at base 3');
});

test('deep-one: madness face is printed +3 with backlash and pays 1 sanity', () => {
test('deep-one: madness face is printed +3 with backlash and pays 1 sanity', () => {
const madnessEngine = setup({
seed: 210,
p0: { leader: 'elias-thorne', cards: ['deep-one', 'finn-calloway', 'finn-calloway'] },
p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
});
const deep = putUnit(madnessEngine, 0, 'deep-one', 'dream', 0, { face: 'madness' });
assert.equal(currentUnitPower(madnessEngine.state, 0, deep, 'dream', 0), 11, 'madness face: base 8 + 3');
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

// ���� gravedigger: mandatory sacrifice + abyss retrieval (��6.4) ������������������������

test('gravedigger: must sacrifice when possible, then retrieves one unit from the abyss', () => {
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

// ���� whisperer: flip drains the opponent sanity (��6.1) ������������������������������������������

test('whisperer: flipping the dream stealth card drains the opponent 1 sanity', () => {
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

// ���� bell-claw: devour permanent gain (��6.4) ����������������������������������������������������������������

test('bell-claw: devouring an adjacent unit permanently gains its current power', () => {
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
assert.equal(bell.inst.permanentPower, 3, 'bell-claw permanently gained the devoured current power');
});

// ���� seance: mandatory sacrifice + bounded retrieval (��6.4) ����������������������������������

test('seance: cannot be played without a sacrifice target and cannot retrieve the sacrificed card', () => {
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

// ���� tide-ritual: dream +3 this night, expires next night ��������������������������������������

test('tide-ritual: gives the own dream row +3 this night and expires afterwards', () => {
test('tide-ritual: gives the own dream row +3 this night and expires afterwards', () => {
const engine = setup({
seed: 217,
p0: { leader: 'elias-thorne', cards: ['tide-ritual', 'deep-one', 'finn-calloway', 'finn-calloway'] },
p1: { leader: 'harold-ashby', cards: ['finn-calloway', 'deep-one'] },
});
const played = play(engine, 0, 'tide-ritual');
assert.ok(played.events.some((event) => event.type === 'auraAdded'));
putUnit(engine, 0, 'deep-one', 'dream', 0);
assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.dream[0], 'dream', 0), 8, 'own dream unit +3');
passUntilNight(engine, 2);
assert.equal(engine.state.effects.length, 0, 'this-night aura cleared at night end cleanup');
});

// ���� lunar-eclipse / stormy-night: global auras ��������������������������������������������������������

test('lunar-eclipse: this night reason face -1 and madness face +1 for both players', () => {
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
assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.scene[0], 'scene', 0), 2);
assert.equal(currentUnitPower(engine.state, 1, engine.state.players[1].board.scene[0], 'scene', 0), 2);
});

test('stormy-night: this night scene -2 for both players', () => {
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
assert.equal(currentUnitPower(engine.state, 0, engine.state.players[0].board.scene[0], 'scene', 0), 1);
assert.equal(currentUnitPower(engine.state, 1, engine.state.players[1].board.scene[0], 'scene', 0), 1);
});

// ���� drowned-altar: scene sacrifice immunity + cult echo +3 ����������������������������������

test('drowned-altar: scene sacrifices skip backlash and the cult echo becomes +3', () => {
test('drowned-altar: scene sacrifices skip backlash and the cult echo becomes +3', () => {
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
assert.equal(result.events.find((event) => event.type === 'cultEcho').bonus, 3, 'unsealed altar upgrades the echo to +3');
assert.equal(engine.state.players[0].sanity, 2, 'deep-one madness entry backlash still applies after the summon');
});

// ���� silas-gold: discard hand + pick from deck top 3 (��6.2) ����������������������������������

test('silas-gold: discard one hand card and retrieve one of the top three', () => {
test('silas-gold: discard one hand card and retrieve one of the top three', () => {
const engine = setup({
seed: 221,
p0: { leader: 'harold-ashby', cards: ['silas-gold', 'finn-calloway', 'deep-one', 'zealot', 'whisperer', 'gravedigger'] },
p1: { leader: 'elias-thorne', cards: ['finn-calloway', 'deep-one'] },
startingHand: 3,
});
const silas = putUnit(engine, 0, 'silas-gold', 'archive', 0, { faceDown: true });

const reveals = engine.getActions().filter(
(action) => action.type === 'reveal' && action.uids.includes(silas.uid),
);
assert.equal(reveals.length, 1, 'a face-down Silas has exactly one reveal line');
const result = engine.apply(reveals[0]);
assert.equal(result.ok, true, result.error);
assert.ok(result.events.some((event) => event.type === 'revealDeckTop'));
assert.ok(result.events.some((event) => event.type === 'shuffleDeck'));
assert.equal(result.events.some((event) => event.type === 'abyssToHand'), false, 'silas picks from the deck, not the abyss');
});

// ���� thousand-eyes: seal leader exception + face-up stealth count ����������������������

test('thousand-eyes: seals the enemy leader and counts face-up unsealed stealth', () => {
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

// ���� unexpected-aid: permanent +3 and full cleanse (��9.9) ����������������������������������������

test('unexpected-aid: permanent +3 plus remove all seals and corruption', () => {
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

// ���� the-sleeper: seal immunity, entry cost, nightly drain ��������������������������������������

test('the-sleeper: cannot be sealed, pays 2 sanity on entry and 1 sanity per night', () => {
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
> build · flint-40b-free
$ Get-Content tests/v2/effects-cards.test.mjs | Select-String -Pattern "^test\(" -AllMatches | ForEach-Object { $_.Matches.Value }
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
test(
> build · flint-40b-free
$ Get-Content tests/v2/effects-cards.test.mjs | Select-String -Pattern "^test\(" -AllMatches | ForEach-Object { $_.Line }
test('lucia-vaughn: dream-native stealth enters the dream face-down with no enter effect', () => {
test('frank-holt: adjacent chain counts own neighbours with cap +3', () => {
test('finn-calloway: adjacent chain caps at +2 and the non-stealth card cannot enter the dream', () => {
test('arthur-pendleton: reveal peeks the opponent hand publicly', () => {
test('abjuration: two choices �� remove corruption or remove an environment', () => {
test('warding-rite: wards one friendly location this night (+1, seal + corruption immunity)', () => {
test('silver-lantern: replaces seal and destroy but not sacrifice', () => {
test('old-library: archive cards are corruption immune and the first archive play costs 1 less', () => {
test('zealot: madness face is printed +3 with backlash, reason face is plain', () => {
test('deep-one: madness face is printed +3 with backlash and pays 1 sanity', () => {
test('gravedigger: must sacrifice when possible, then retrieves one unit from the abyss', () => {
test('whisperer: flipping the dream stealth card drains the opponent 1 sanity', () => {
test('bell-claw: devouring an adjacent unit permanently gains its current power', () => {
test('seance: cannot be played without a sacrifice target and cannot retrieve the sacrificed card', () => {
test('tide-ritual: gives the own dream row +3 this night and expires afterwards', () => {
test('lunar-eclipse: this night reason face -1 and madness face +1 for both players', () => {
test('stormy-night: this night scene -2 for both players', () => {
test('drowned-altar: scene sacrifices skip backlash and the cult echo becomes +3', () => {
test('silas-gold: discard one hand card and retrieve one of the top three', () => {
test('thousand-eyes: seals the enemy leader and counts face-up unsealed stealth', () => {
test('unexpected-aid: permanent +3 plus remove all seals and corruption', () => {
test('the-sleeper: cannot be sealed, pays 2 sanity on entry and 1 sanity per night', () => {
> build · flint-40b-free
$ node --test "tests/v2/*.test.mjs" 2>&1 | tail -80
tail: The term 'tail' is not recognized as a name of a cmdlet, function, script file, or executable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
> build · flint-40b-free
$ node --test "tests/v2/*.test.mjs" > /tmp/opencode/v2run1.txt 2>&1; $LASTEXITCODE = 0; Get-Content /tmp/opencode/v2run1.txt -Tail 100
...
# Subtest: backlash and sanity zero: the whole batch resolves before the loss is checked
ok 32 - backlash and sanity zero: the whole batch resolves before the loss is checked
  ---
  duration_ms: 0.6383
  type: 'test'
  ...
# Subtest: harold-ashby: requires a legal target, seals any face-up board card, and heals 1
ok 33 - harold-ashby: requires a legal target, seals any face-up board card, and heals 1
  ---
  duration_ms: 0.6084
  type: 'test'
  ...
# Subtest: card types: events/rituals discard, equipment attaches and drops, locations and environments persist
ok 34 - card types: events/rituals discard, equipment attaches and drops, locations and environments persist
  ---
  duration_ms: 2.4483
  type: 'test'
  ...
# Subtest: society passive heals 1 at night start after the night penalty; cult gets no heal
ok 35 - society passive heals 1 at night start after the night penalty; cult gets no heal
  ---
  duration_ms: 0.3559
  type: 'test'
  ...
# Subtest: setup: 20-card presets, 8-card opening hands, mulligan up to 2
ok 36 - setup: 20-card presets, 8-card opening hands, mulligan up to 2
  ---
  duration_ms: 4.248
  type: 'test'
  ...
# Subtest: same seed + same action sequence is fully deterministic
ok 37 - same seed + same action sequence is fully deterministic
  ---
  duration_ms: 20.2741
  type: 'test'
  ...
# Subtest: clone() supports speculation without polluting the original game
ok 38 - clone() supports speculation without polluting the original game
  ---
  duration_ms: 3.5174
  type: 'test'
  ...
# Subtest: viewFor hides opponent hand, deck order, and face-down identities
ok 39 - viewFor hides opponent hand, deck order, and face-down identities
  ---
  duration_ms: 2.3416
  type: 'test'
  ...
# Subtest: card count is conserved through every action (hand + deck + discard + board)
ok 40 - card count is conserved through every action (hand + deck + discard + board)
  ---
  duration_ms: 14.6016
  type: 'test'
  ...
# Subtest: scoring, night winner, and loser-goes-first rotation
ok 41 - scoring, night winner, and loser-goes-first rotation
  ---
  duration_ms: 0.7867
  type: 'test'
  ...
# Subtest: tie night: both lose 1 sanity and the previous first player keeps priority
ok 42 - tie night: both lose 1 sanity and the previous first player keeps priority
  ---
  duration_ms: 0.3895
  type: 'test'
  ...
# Subtest: sanity zero is an immediate loss; simultaneous zero is a draw
ok 43 - sanity zero is an immediate loss; simultaneous zero is a draw
  ---
  duration_ms: 0.4354
  type: 'test'
  ...
# Subtest: three nights: loser starts next night, tie keeps priority, final tiebreak resolves
ok 44 - three nights: loser starts next night, tie keeps priority, final tiebreak resolves
  ---
  duration_ms: 1.5785
  type: 'test'
  ...
# Subtest: dream admission: affinity, stealth face-down entry, and the per-night limit
ok 45 - dream admission: affinity, stealth face-down entry, and the per-night limit
  ---
  duration_ms: 2.2296
  type: 'test'
  ...
# Subtest: random legal self-play never crashes or deadlocks
ok 46 - random legal self-play never crashes or deadlocks
  ---
  duration_ms: 48.3257
  type: 'test'
  ...
1..46
# tests 46
# suites 0
# pass 43
# fail 3
# cancelled 0
# skipped 0
# todo 0
# duration_ms 317.7912
> build · flint-40b-free
$ Get-Content /tmp/opencode/v2run1.txt | Select-String -Pattern "^not ok|^ok 1[0-9] |^not ok" -AllMatches | ForEach-Object { $_.Line }
not ok 5 - abjuration: two choices �?remove corruption or remove an environment
not ok 7 - silver-lantern: replaces seal and destroy but not sacrifice
ok 10 - deep-one: madness face is printed +3 with backlash and pays 1 sanity
ok 11 - gravedigger: must sacrifice when possible, then retrieves one unit from the abyss
ok 12 - whisperer: flipping the dream stealth card drains the opponent 1 sanity
ok 13 - bell-claw: devouring an adjacent unit permanently gains its current power
ok 14 - seance: cannot be played without a sacrifice target and cannot retrieve the sacrificed card
ok 15 - tide-ritual: gives the own dream row +3 this night and expires afterwards
ok 16 - lunar-eclipse: this night reason face -1 and madness face +1 for both players
ok 17 - stormy-night: this night scene -2 for both players
ok 18 - drowned-altar: scene sacrifices skip backlash and the cult echo becomes +3
not ok 19 - silas-gold: discard one hand card and retrieve one of the top three
> build · flint-40b-free
$ node --test tests/v2/effects-cards.test.mjs > /tmp/opencode/fail1.txt 2>&1; Get-Content /tmp/opencode/fail1.txt -Raw | Out-Null; Select-String -Path /tmp/opencode/fail1.txt -Pattern "not ok|error:|expected|actual|at " -AllMatches | ForEach-Object { $_.Line } | Select-Object -First 120
# Subtest: finn-calloway: adjacent chain caps at +2 and the non-stealth card cannot enter the dream
ok 3 - finn-calloway: adjacent chain caps at +2 and the non-stealth card cannot enter the dream
not ok 5 - abjuration: two choices �?remove corruption or remove an environment
  error: 'P0 should hold abjuration'
  expected: true
not ok 7 - silver-lantern: replaces seal and destroy but not sacrifice
  error: |-
  expected: false
  actual: true
not ok 19 - silas-gold: discard one hand card and retrieve one of the top three
  error: |-
  expected: 1
  actual: 6
# Subtest: unexpected-aid: permanent +3 plus remove all seals and corruption
ok 21 - unexpected-aid: permanent +3 plus remove all seals and corruption
> build · flint-40b-free
$ Get-Content /tmp/opencode/fail1.txt | Select-String -Pattern "not ok" -Context 40 | ForEach-Object { $_.Line } | Select-Object -First 250
not ok 5 - abjuration: two choices �?remove corruption or remove an environment
not ok 7 - silver-lantern: replaces seal and destroy but not sacrifice
not ok 19 - silas-gold: discard one hand card and retrieve one of the top three
> build · flint-40b-free
Error: Free usage limit reached. Connect a provider or subscribe to OpenCode Go to keep going, or switch models.
