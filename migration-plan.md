
> build · deepseek-v4.1-flash-free
✱ Glob "src/**/*" 28 matches
$ Get-ChildItem -Force | Select-Object Mode,Length,Name | Format-Table -AutoSize
Mode  Length Name
----  ------ ----
d----        demo
d----        docs
d----        research
d----        screenshots
d----        scripts
d----        src
d----        tests
-a--- 452    .gitignore
-a--- 0      .nojekyll
-a--- 207    ������Ϸ.bat
-a--- 4944   card-table-v1.csv
-a--- 1600   index.html
-a--- 1069   LICENSE
-a--- 0      migration-plan.md
-a--- 497    package.json
-a--- 8059   README.md
-a--- 1944   server.mjs
> build · deepseek-v4.1-flash-free
→ Read card-table-v1.csv 
→ Read README.md 
> build · deepseek-v4.1-flash-free
→ Read src/app.js 
$ Get-ChildItem -Recurse src -File | Select-Object @{n='Lines';e={(Get-Content $_.FullName | Measure-Object -Line).Lines}}, @{n='KB';e={[math]::Round($_.Length/1KB,1)}}, FullName | Sort-Object FullName | Format-Table -AutoSize; Get-ChildItem docs,research,tests,scripts,demo -File -Recurse | Select-Object Length,FullName | Format-Table -AutoSize
Lines     KB FullName
-----     -- --------
  937  35.70 D:\Games\greyharbor\src\app.js
  473  20.40 D:\Games\greyharbor\src\data\ability-text.js
 3169 107.80 D:\Games\greyharbor\src\data\cards.js
  200   7.50 D:\Games\greyharbor\src\data\db.js
  352  13.50 D:\Games\greyharbor\src\data\decks.js
   98   4.20 D:\Games\greyharbor\src\data\factions.js
  275  15.00 D:\Games\greyharbor\src\data\leaders.js
 1919  71.30 D:\Games\greyharbor\src\engine\ai.js
   90   3.40 D:\Games\greyharbor\src\engine\deck.js
 1677  63.90 D:\Games\greyharbor\src\engine\engine.js
   52   1.50 D:\Games\greyharbor\src\engine\rng.js
  191   6.60 D:\Games\greyharbor\src\engine\scoring.js
   10   0.40 D:\Games\greyharbor\src\main.js
 1402  41.30 D:\Games\greyharbor\src\styles\card.css
 2043  51.00 D:\Games\greyharbor\src\styles\deckbuilder.css
  839  22.10 D:\Games\greyharbor\src\styles\fx.css
 1879  47.50 D:\Games\greyharbor\src\styles\screens.css
  261   6.20 D:\Games\greyharbor\src\styles\theme.css
 3202 145.70 D:\Games\greyharbor\src\ui\art.js
  929  34.90 D:\Games\greyharbor\src\ui\audio.js
  785  32.90 D:\Games\greyharbor\src\ui\board.js
  136   4.80 D:\Games\greyharbor\src\ui\card-fallback.js
  708  27.10 D:\Games\greyharbor\src\ui\card-render.js
 1371  58.50 D:\Games\greyharbor\src\ui\deckbuilder.js
 3351 110.90 D:\Games\greyharbor\src\ui\fx.js
  109   3.60 D:\Games\greyharbor\src\ui\i18n.js
  350  15.90 D:\Games\greyharbor\src\ui\menu.js
  104   4.30 D:\Games\greyharbor\src\ui\tooltip.js


Length FullName
------ --------
 17038 D:\Games\greyharbor\docs\ARCHITECTURE.md
  9829 D:\Games\greyharbor\docs\ART_DIRECTION.md
 23526 D:\Games\greyharbor\docs\GAME_RULES.md
 47358 D:\Games\greyharbor\docs\QA_RULES_AUDIT.md
  9121 D:\Games\greyharbor\research\fetch_w3_data.py
  6737 D:\Games\greyharbor\research\decks\deck-monsters.txt
  4626 D:\Games\greyharbor\research\decks\deck-neutral.txt
  8865 D:\Games\greyharbor\research\decks\deck-nilfgaard.txt
  6420 D:\Games\greyharbor\research\decks\deck-northern-realms.txt
  7960 D:\Games\greyharbor\research\decks\deck-scoiatael.txt
  7667 D:\Games\greyharbor\research\decks\deck-skellige.txt
  7694 D:\Games\greyharbor\research\decks\rules-main.txt
105340 D:\Games\greyharbor\research\qa\e2e-dom.txt
  6958 D:\Games\greyharbor\research\qa\e2e-report.json
  8165 D:\Games\greyharbor\research\qa\E2E.md
 27660 D:\Games\greyharbor\research\qa\final-tour.mjs
 26563 D:\Games\greyharbor\research\qa\rules-verify.mjs
 18358 D:\Games\greyharbor\research\reference\CARD_LIST.md
 95742 D:\Games\greyharbor\research\reference\cards.final.json
 94439 D:\Games\greyharbor\research\reference\cards.raw.json
  1515 D:\Games\greyharbor\research\reference\effects.final.json
  1515 D:\Games\greyharbor\research\reference\effects.raw.json
  1481 D:\Games\greyharbor\research\reference\factions.final.json
   689 D:\Games\greyharbor\research\reference\factions.raw.json
  9168 D:\Games\greyharbor\research\reference\leaders.final.json
  6975 D:\Games\greyharbor\research\reference\leaders.raw.json
 38006 D:\Games\greyharbor\research\upstream\cards.xlsx
  1593 D:\Games\greyharbor\research\upstream\effects.json
   583 D:\Games\greyharbor\research\upstream\factions.json
  5956 D:\Games\greyharbor\research\upstream\leaders.json
 49429 D:\Games\greyharbor\research\upstream\units.json
 33957 D:\Games\greyharbor\tests\ai.test.mjs
 34676 D:\Games\greyharbor\tests\card-data.test.mjs
 24801 D:\Games\greyharbor\tests\data-audit.test.mjs
  2027 D:\Games\greyharbor\tests\e2e.test.mjs
 32560 D:\Games\greyharbor\tests\engine.test.mjs
  7376 D:\Games\greyharbor\tests\fixtures.mjs
 36706 D:\Games\greyharbor\scripts\e2e.mjs
 41314 D:\Games\greyharbor\demo\cards.html
  3416 D:\Games\greyharbor\demo\deckbuilder.html
 59578 D:\Games\greyharbor\demo\fx.html
> build · deepseek-v4.1-flash-free
→ Read src/engine/scoring.js 
→ Read src/engine/deck.js 
→ Read src/engine/rng.js 
→ Read src/engine/engine.js [limit=400]
> build · deepseek-v4.1-flash-free
→ Read src/data/db.js 
→ Read src/data/factions.js 
→ Read src/data/cards.js [limit=90]
$ Select-String -Path src\engine\engine.js -Pattern '^  _[A-Za-z0-9_]+\(|^  [a-zA-Z0-9_]+\(' | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }
45: constructor(config, internalState = null) {
67: clone() {
92: viewFor(pov = 0) {
98: result() {
102: getActions() {
178: apply(action) {
204: respond(choice) {
254: _createState(config) {
347: _applyLeaderPassives(st) {
390: _leaderHas(leaderId, abilityId) {
398: _beginMulliganPhase(st) {
404: _resolveChooseFirst(pending, choice) {
414: _resolveMulligan(pending, choice) {
452: _startRound(roundNo) {
489: _endRound() {
616: _applyPass(player) {
627: _applyPlayCard(player, action) {
725: _applyUseLeader(player) {
745: _leaderActionInfo(player) {
761: _canAct(player) {
769: _finalizeAction() {
809: _pump() {
834: _execTask(task) {
915: _execAfter(task) {
922: _enterEffects(owner, uid, row, boardOwner = owner) {
1002: _muster(task) {
1065: _medicStart(task) {
1082: _resolveMedic(pending, choice) {
1092: _reviveUnit(player, uid) {
1115: _resolveReviveRow(pending, choice) {
1125: _placeRevived(player, inst, row) {
1135: _resolveScorchTask(task) {
1158: _transformBerserkers(player, row) {
1166: _transformBerserker(player, row, uid) {
1191: _spawnAvenger(task) {
1209: _leaderAbility(task) {
1309: _resolveChooseWeather(pending, choice) {
1316: _resolveTakeGraveUnit(pending, choice) {
1322: _resolveDiscardCards(pending, choice) {
1330: _discardCardsNow(task) {
1345: _resolveDeckChoice(pending, choice) {
1351: _moveDeckToHand(player, uid) {
1361: _moveGraveToHand(player, from, uid) {
1371: _shuffleGraveyards() {
1383: _repositionAgile(player) {
1445: _makeInst(st, cardId, owner, opts = {}) {
1455: _draw(player, n, opts = {}) {
1472: _removeHand(player, inst) {
1476: _toGrave(player, inst) {
1484: _removeFromBoard(inst, opts = {}) {
1516: _findUnitByUid(uid) {
1527: _findDecoy(uid) {
1537: _findByIdentity(uid) {
1552: _graveUnits(player) {
1559: _isToken(inst) {
1563: _canBeRevived(cardId) {
1572: _bestRowFor(player, cardId) {
1593: _rowHasHorn(player, row) {
1601: _rowHasMardroeme(player, row) {
1610: _playWeatherCard(player, inst, weatherKind, opts = {}) {
1630: _clearWeather() {
1644: _skelligeRevive(player) {
1669: _recompute(force = false) {
1681: _scoresArray() {
1686: _emit(type, payload = {}) {
1690: _log(text) {
1700: _buildView(pov) {
> build · deepseek-v4.1-flash-free
→ Read src/ui/board.js [limit=300]
→ Read src/ui/card-render.js [limit=220]
→ Read src/data/leaders.js [limit=60]
→ Read src/ui/i18n.js 
> build · deepseek-v4.1-flash-free
→ Read src/main.js 
→ Read src/ui/menu.js [limit=180]
→ Read src/ui/deckbuilder.js [limit=150]
→ Read src/ui/art.js [limit=120]
> build · deepseek-v4.1-flash-free
→ Read index.html 
→ Read package.json 
$ Select-String -Path src\ui\audio.js -Pattern 'export |^  [a-zA-Z0-9_]+[:(]|case .' | Select-Object -First 80 | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }
14: enabled: true,   // Ĭ�Ͽ��������״��û�����ǰ�������
15: volume: 0.72,    // 0..1 master volume
68: constructor() {
91: init() {
102: unlock() {
123: setEnabled(on) {
141: setVolume(v) {
148: isEnabled() {
153: isUnlocked() {
171: play(name, opts = {}) {
196: startAmbient() {
212: stopAmbient() {
245: destroy() {
271: _warn(msg, err) {
281: _masterTarget() {
285: _rampMaster(timeConstant = 0.05) {
297: _ensureContext() {
343: _silentTick() {
359: _bindVisibility() {
373: _makeNoise(seconds, brown) {
392: _panner(pan) {
402: _out(pan = 0) {
409: _env(t, peak, attack, dur) {
422: _filter(type, freq, q = 0.8) {
430: _tone(t, opts) {
478: _noise(t, opts) {
510: _metal(t, freq, dur, vol, opts = {}) {
531: _chime(t, freq, dur, vol, pan = 0) {
535: _horn(t, freq, dur, vol, pan = 0) {
568: _pluck(t, freq, dur, vol, pan = 0) {
583: _bell(t, freq, dur, vol, pan = 0) {
587: _thunder(t, vol = 0.1, pan = 0) {
615: _buildAmbient() {
677: _scheduleCrackle() {
724: coin(t, o) {
765: spy(t, o) {
774: medic(t, o) {
785: muster(t, o) {
795: scorch(t, o) {
849: horn(t, o) {
859: mardroeme(t, o) {
869: avenger(t, o) {
879: leader(t, o) {
889: pass(t, o) {
897: turn(t, o) {
948: victory(t, o) {
963: defeat(t, o) {
972: error(t, o) {
985: export const audio = new SoundEngine();
989: export function installAudioUnlock(target = typeof window !== 'undefined' ? window : null) {
1005: export default audio;
$ Select-String -Path src\ui\fx.js -Pattern 'case .[a-zA-Z]+.:|onEvent|export function|export const' | Select-Object -First 80 | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }
23: //   �� ��Ч�ֹ���onEvent ͳһ���������¼���Ч���¼���������ֱ�ӵ��� fx.* ��������
26: //     fx.cardPlay �Ⱦ�ϸ�������ɴ� eventEffects:'full' ���� onEvent ȫȨ������
2975: //  audio bridge��ֻ�� onEvent ��ͳһ������ֱ�� fx.* ���ò�������
3159: case 'gameStart': {
3181: case 'draw': {
3185: case 'mulligan': {
3189: case 'firstPlayerChosen': {
3193: case 'cardPlayed': {
3213: case 'cardSummoned': {
3223: case 'spyDraw': {
3227: case 'muster': {
3236: case 'medic': {
3247: case 'cardRevived': {
3254: case 'scorch': {
3270: case 'weatherChanged': {
3274: case 'hornPlaced': {
3285: case 'mardroeme': {
3296: case 'transform': {
3304: case 'decoy': {
3312: case 'avenger': {
3324: case 'leaderUsed': {
3337: case 'leaderCanceled': {
3341: case 'powerUpdate': {
3345: case 'roundStarted': {
3351: case 'roundEnded': {
3358: case 'gemsUpdate': {
3368: case 'gameOver': {
3376: case 'coinToss': {
3381: case 'turnChanged': {
3385: case 'pass': {
3389: case 'mardroemePlaced': {
3400: case 'scorchFizzle': {
3404: case 'graveToHand':
3405: case 'graveyardsShuffled': {
3409: case 'discarded': {
3413: case 'agileRepositioned': {
3417: case 'skelligeRevive': {
3425: case 'monsterKeep': {
3432: case 'mulliganChoice': {
3436: case 'cardEntered':
3437: case 'cardLeft':
3438: case 'stage':
3439: case 'revivePending': {
3442: case 'toast': {
3446: case 'log': {
3449: case 'pending': {
3457: warnOnce(`onEvent:${type}`, err);
3466: onEvent: handleEvent,
3520: export const fx = fxApi;
> build · deepseek-v4.1-flash-free
→ Read src/ui/fx.js [offset=3140, limit=340]
$ Select-String -Path src\styles\theme.css -Pattern '--[a-z0-9-]+:' | Select-Object -First 60 | ForEach-Object { $_.Line.Trim() }
--ink-0: #070605;
--ink-1: #0d0b09;
--ink-2: #14100c;
--ink-3: #1e1812;
--ink-4: #2a2118;
--paper: #e7dcc2;
--paper-dim: #c9bda3;
--paper-faint: #8f8570;
--gold: #c9a227;
--gold-bright: #f0d078;
--gold-dim: #8a6f22;
--blood: #7a1f1f;
--ember: #ff7a2f;
--nr: #4d7ea8;
--nr-glow: #9cc4e4;
--ng: #c9a227;
--ng-glow: #f0d078;
--st: #2f7a4a;
--st-glow: #a8e0a0;
--mo: #8a2323;
--mo-glow: #ff6b5a;
--sk: #2f6f6a;
--sk-glow: #9adfd6;
--neutral: #8b7d5c;
--neutral-glow: #d9cbb3;
--font-display: "Palatino Linotype", "Iowan Old Style", "Songti SC", "Noto Serif SC", "STSong", serif;
--font-ui: "Avenir Next", "PingFang SC", "Noto Sans SC", "Hiragino Sans GB", system-ui, sans-serif;
--card-w: 132px;
--card-h: 184px;
--card-radius: 10px;
--card-sm-w: 92px;
--card-sm-h: 128px;
--card-xs-w: 64px;
--card-xs-h: 89px;
--card-lg-w: 210px;
--card-lg-h: 293px;
--ease-out: cubic-bezier(0.22, 0.8, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--dur-fast: 140ms;
--dur-mid: 280ms;
--dur-slow: 520ms;
--shadow-deep: 0 18px 44px rgba(0, 0, 0, 0.65), 0 2px 8px rgba(0, 0, 0, 0.5);
--shadow-gold: 0 0 18px rgba(240, 208, 120, 0.28);
--shadow-inset: inset 0 1px 0 rgba(255, 235, 190, 0.08);
--topbar-h: 92px;
--hand-h: 210px;
--side-w: 190px;
--row-h: 128px;
$ Select-String -Path src\ui\card-render.js -Pattern '^export |^function |^const [A-Z_]+' | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }
33: const FACTION_SHORT = {
42: const FACTION_ALIASES = {
61: const ROW_LABEL = {
78: const LEADER_STATE_LABEL = {
84: const ABILITY_LABEL = {
101: const TILT_DEG = 6;
103: const prefersReducedMotion = () => {
111: const canHover = () => {
120: const ctx = {
127: const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
128: const normalizeFaction = (faction) => {
133: function normalizeCard(cardOrId) {
143: function normalizeLeader(leaderOrId) {
161: export function initCardRenderer(accessors = {}) {
176: function powerOf(card, opts) {
184: function cardType(card) {
190: function primaryRowIcon(card, art) {
207: function rowTooltip(card, art) {
223: function abilitySummary(card) {
234: function abilityIconMarkup(card, art) {
241: function ariaLabelFor(card, art, power) {
251: function artPlaceholderMarkup(card) {
258: function buildCardBackInto(el, factionId, size) {
277: export function createCardEl(cardOrId, opts = {}) {
394: export function mountCardArt(el, cardOrId) {
408: function crownSvg() {
416: function removeFloatingDelta(powerEl) {
421: function spawnPowerDelta(el, powerEl, delta) {
459: export function setCardPower(el, power, opts = {}) {
491: function mountPowerGem(el, power) {
510: const STATE_CLASSES = ["is-selected", "is-target", "is-disabled", "is-just-played", "is-normal"];
516: export function setCardState(el, state) {
547: export function createCardBack(factionId = "neutral", size = "md") {
566: export function createLeaderCardEl(leaderOrId, opts = {}) {
631: export function setLeaderState(el, { used = false, canceled = false, available = false } = {}) {
657: export function renderRowIcon(row) {
666: export function getCardArtDataUrl(card) {
680: export function preloadArt(cards) {
697: function enableTilt(el) {
760: export default {
> build · deepseek-v4.1-flash-free
→ Read src/ui/card-render.js [offset=277, limit=130]
→ Read src/ui/board.js [offset=300, limit=490]
> build · deepseek-v4.1-flash-free
→ Read src/data/decks.js [limit=90]
→ Read src/data/ability-text.js [limit=90]
$ Get-Content tests\engine.test.mjs -TotalCount 40; Get-Content tests\card-data.test.mjs -TotalCount 40
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/engine/engine.js';
import { CARDS, LEADERS } from './fixtures.mjs';
import { validateDeck } from '../src/engine/deck.js';

// ������������������������������������������������������������������������������������������������������������������������������������������������
// helpers
// ������������������������������������������������������������������������������������������������������������������������������������������������

function mkDeck(extra = []) {
  const units = [
    ...Array(6).fill('soldier'),
    ...Array(4).fill('archer'),
    ...Array(4).fill('siege'),
    ...Array(3).fill('bond'),
    ...Array(2).fill('morale'),
    ...Array(2).fill('spy'),
    ...Array(2).fill('medic'),
  ];
  const base = [...units.slice(0, 22), ...extra];
  return base;
}

function makeGame(opts = {}) {
  const game = createGame({
    seed: opts.seed ?? 7,
    cards: CARDS,
    leaders: LEADERS,
    players: [
      {
        id: 'p0',
        faction: opts.f0 ?? 'northern-realms',
        leaderId: opts.l0 ?? 'l-north',
        deck: opts.deck0 ?? mkDeck(),
      },
      {
        id: 'p1',
        faction: opts.f1 ?? 'monsters',
        leaderId: opts.l1 ?? 'l-mons',
/**
 * tests/card-data.test.mjs �� ���ݲ������Բ��ԣ�node --test��
 *
 * ���У�node --test tests/card-data.test.mjs
 *
 * ���ǣ�
 *  1. ������ȷ��163 �� / 22 ���� / ����Ӫ�ֲ���
 *  2. id Ψһ���Ϸ������� research/reference/*.final.json ���ֶ�һ��
 *  3. �����ֶ�����������
 *  4. �ṹ�� abilities �Ϸ���ÿ����������״Լ����
 *  5. copies / deckable / hero Լ����4 ��������
 *  6. ���ı��ػ����� & abilityZh ��ṹ�� abilities һ��
 *  7. art ��ʾ�Ϸ��� seed �ȶ�
 *  8. factions / leaders / ability-text ����
 *  9. db ������ collectionFor ��Ϊ
 * 10. validateDeck ��ȫ��Ԥ��ͨ�����ԷǷ�����ܾ�
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { CARDS, CARD_LIST } from "../src/data/cards.js";
import { LEADERS, LEADER_LIST } from "../src/data/leaders.js";
import { FACTIONS, FACTION_IDS, ALL_FACTION_IDS } from "../src/data/factions.js";
import { ALL_PRESETS, PRESET_DECKS, expandPreset, getDefaultPreset } from "../src/data/decks.js";
import {
  ABILITY_TEXT,
  ABILITY_IDS,
  GROUP_LABELS,
  ROW_NAMES,
  TOKEN_LABELS,
  WEATHER_NAMES,
  abilityIcon,
  abilityNameZh,
  formatAbilitiesEn,
  formatAbilitiesZh,
} from "../src/data/ability-text.js";
import {
  CARDS_BY_FACTION,
> build · deepseek-v4.1-flash-free
$ Get-Content card-table-v1.csv -Encoding UTF8 | Select-Object -Skip 1 | ForEach-Object { $c = $_ -split ','; [PSCustomObject]@{id=$c[0];faction=$c[3];type=$c[4];loc=$c[5];rp=$c[6];mp=$c[7];kw=$c[8];cost=$c[9];copies=$c[10];effect=$c[11]} } | Format-Table -AutoSize -Wrap
id               faction type        loc     rp mp kw       cost copies effect
--               ------- ----        ---     -- -- --       ---- ------ ------
harold-ashby     society leader                             0    1      ������ÿҹһ�Σ���ӡһ�ŵз���ֱ����һҹ���ظ�1
                                                                        ����
nora-wells       society unit        scene   2  4  ����     0    1      �����볡����ʱ�鿴����һ������
samuel-pike      society unit        scene   4  4  ��ӡ     0    1      �볡�Ƴ�һ���з��������ӡһ��ս��4���µз���
edith-barrow     society unit        archive 2  3  ����     0    1      ����λ��ÿ��һ�ż���������+1
walter-morse     society unit        archive 3  6  ���Ƿ��� 0    1      ����������1����
lucia-vaughn     society unit        dream   1  7  ����     0    1      �����ξ�λ�ø����볡
frank-holt       society unit        scene   5  5  ����     0    1      ÿ��һ�����ڼ�����+1����+3
arthur-pendleton society unit        archive 3  4  ����     0    1      �볡ʱ���չʾ����һ������
abjuration       society event       any                         0      1
warding-rite     society event       row                         0      1
silver-lantern   society equipment   attach                      0      1
old-library      society location    archive                     0      1
elias-thorne     cult    leader                             0    1      ������ÿҹһ�Σ��׼�һ�ż��������ƶ�ֱ�Ӵ��һ
                                                                        ����ֵ�λ
hooded-acolyte   cult    unit        scene   2  3  �׼�     0    2      �ɱ��׼�ʱ�����κμ��������Ƴ�
zealot           cult    unit        scene   3  6  ���Ƿ��� 0    1      �����+3������1����
sea-priestess    cult    unit        archive 4  5  ����     0    1      �볡���з�ս����ߵĿ����Ÿ���ÿҹ-1
gravedigger      cult    unit        archive 3  4  �׼�     0    1      �׼�һ�ż����������Ԩ���ƶ�����һ�ŵ�λ
whisperer        cult    unit        dream   2  7  ����     0    1      �����볡����ʱ���ֿ�1����
deep-one         cult    unit        dream   5  8  ���Ƿ��� 1    1      ��������+3������1����
bell-claw        cult    unit        scene   6  6  �׼�     1    1      ����һ�����ڼ��������û����ȫ��ս��
seance           cult    ritual      any                         0      1
tide-ritual      cult    ritual      dream                       0      1
lunar-eclipse    cult    environment all                         0      1
drowned-altar    cult    location    scene                       0      1
finn-calloway    neutral unit        any     3  4  ����     0    1      ÿ��һ�����ڼ�����+1����+2
silas-gold       neutral unit        archive 2  3  ����     0    1      �볡��һ�����ƴ��ƶѷ�3��ѡ1������
the-sleeper      neutral oldgod      dream   8  12 ���Ƿ��� 2    1      �޷�����ӡ�볡��2���Ǵ˺�ÿҹ�ٿ�1
thousand-eyes    neutral oldgod      archive 7  10 ��ӡ     2    1      �볡��ӡ�з���������һҹ������ÿ��һ�����ؿ���
                                                                        ��+1
stormy-night     neutral environment all                         0      1
unexpected-aid   neutral event       any                         0      1
$ node -e "const fs=require('fs');const t=fs.readFileSync('card-table-v1.csv','utf8').trim().split(/\r?\n/);const h=t[0].split(',');const rows=t.slice(1).map(l=>{const c=l.split(',');const o={};h.forEach((k,i)=>o[k]=c[i]);return o});const uniq=k=>[...new Set(rows.map(r=>r[k]).filter(Boolean))];console.log('cards',rows.length);console.log('faction',uniq('faction'));console.log('type',uniq('type'));console.log('location',uniq('location'));console.log('keywords',uniq('keywords'));console.log('sanityCost',uniq('sanityCost'));console.log('copies',uniq('copies'));for(const f of uniq('faction')){const rs=rows.filter(r=>r.faction===f);console.log(f,rs.length,'types',[...new Set(rs.map(r=>r.type))].join('/'),'locations',[...new Set(rs.map(r=>r.location).filter(Boolean))].join('/'))}console.log('effect lengths',rows.map(r=>[r.id,r.effect.length]))"
cards 30
faction [ 'society', 'cult', 'neutral' ]
type [
  'leader',
  'unit',
  'event',
  'equipment',
  'location',
  'ritual',
  'environment',
  'oldgod'
]
location [
  'scene', 'archive',
  'dream', 'any',
  'row',   'attach',
  'all'
]
keywords [ '隐秘', '封印', '连锁', '理智反噬', '献祭', '腐化' ]
sanityCost [ '0', '1', '2' ]
copies [ '1', '0', '2' ]
society 12 types leader/unit/event/equipment/location locations scene/archive/dream/any/row/attach
cult 12 types leader/unit/ritual/environment/location locations scene/archive/dream/any/all
neutral 6 types unit/oldgod/environment/event locations any/archive/dream/all
effect lengths [
  [ 'harold-ashby', 26 ],
  [ 'nora-wells', 15 ],
  [ 'samuel-pike', 23 ],
  [ 'edith-barrow', 15 ],
  [ 'walter-morse', 10 ],
  [ 'lucia-vaughn', 10 ],
  [ 'frank-holt', 15 ],
  [ 'arthur-pendleton', 13 ],
  [ 'abjuration', 1 ],
  [ 'warding-rite', 1 ],
  [ 'silver-lantern', 1 ],
  [ 'old-library', 1 ],
  [ 'elias-thorne', 28 ],
  [ 'hooded-acolyte', 15 ],
  [ 'zealot', 12 ],
  [ 'sea-priestess', 19 ],
  [ 'gravedigger', 20 ],
  [ 'whisperer', 13 ],
  [ 'deep-one', 14 ],
  [ 'bell-claw', 18 ],
  [ 'seance', 1 ],
  [ 'tide-ritual', 1 ],
  [ 'lunar-eclipse', 1 ],
  [ 'drowned-altar', 1 ],
  [ 'finn-calloway', 15 ],
  [ 'silas-gold', 18 ],
  [ 'the-sleeper', 18 ],
  [ 'thousand-eyes', 26 ],
  [ 'stormy-night', 1 ],
  [ 'unexpected-aid', 1 ]
]
> build · deepseek-v4.1-flash-free
$ node -e "const fs=require('fs');const lines=fs.readFileSync('card-table-v1.csv','utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);for(const l of lines){const c=l.split(',');if(c.length===14)console.log(c[0].padEnd(20), 'rp='+JSON.stringify(c[6]),'mp='+JSON.stringify(c[7]),'kw='+JSON.stringify(c[8]),'cost='+JSON.stringify(c[9]),'copies='+JSON.stringify(c[10]),'effect='+JSON.stringify(c[11]))}"
abjuration           rp="" mp="" kw="" cost="" copies="0" effect="1"
warding-rite         rp="" mp="" kw="" cost="" copies="0" effect="1"
silver-lantern       rp="" mp="" kw="" cost="" copies="0" effect="1"
old-library          rp="" mp="" kw="" cost="" copies="0" effect="1"
seance               rp="" mp="" kw="" cost="" copies="0" effect="1"
tide-ritual          rp="" mp="" kw="" cost="" copies="0" effect="1"
lunar-eclipse        rp="" mp="" kw="" cost="" copies="0" effect="1"
drowned-altar        rp="" mp="" kw="" cost="" copies="0" effect="1"
stormy-night         rp="" mp="" kw="" cost="" copies="0" effect="1"
unexpected-aid       rp="" mp="" kw="" cost="" copies="0" effect="1"
$ node -e "const fs=require('fs');const lines=fs.readFileSync('card-table-v1.csv','utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);const h=lines[0].split(',');lines.forEach((l,i)=>{const c=l.split(',');if(c.length!==h.length)console.log('LINE',i+1,'fields',c.length,'expected',h.length,'|',l)});console.log('header fields',h.length,h.join('|'))"
LINE 10 fields 14 expected 13 | abjuration,驱魔咒,Abjuration,society,event,any,,,,,0,1,移除一个腐化或环境效果,退回去这里不欢迎你
LINE 11 fields 14 expected 13 | warding-rite,结界术,Warding Rite,society,event,row,,,,,0,1,目标排本夜免疫封印与腐化全体+1,粉笔划的圈挡住了不该存在的东西
LINE 12 fields 14 expected 13 | silver-lantern,银灯,The Silver Lantern,society,equipment,attach,,,,,0,1,附属单位+2；单位将被摧毁或封印时弃掉银灯代替,灯罩上的裂纹比任何报告都多
LINE 13 fields 14 expected 13 | old-library,旧图书馆,The Old Library,society,location,archive,,,,,0,1,档案位置己方卡不受腐化；在此打出的卡理智代价-1每夜一次,门牌早就摘了灯却每晚都亮
LINE 22 fields 14 expected 13 | seance,降灵会,Séance,cult,ritual,any,,,,,0,1,献祭一张己方卡从深渊拉回最多2张单位入手牌,桌子震了三下然后多了一个人的呼吸
LINE 23 fields 14 expected 13 | tide-ritual,潮汐仪式,Tide Ritual,cult,ritual,dream,,,,,0,1,本夜梦境位置己方卡全体+3下夜复原,月亮被水托着越升越低
LINE 24 fields 14 expected 13 | lunar-eclipse,月食,Lunar Eclipse,cult,environment,all,,,,,0,1,本夜全场理性面卡-1疯狂面卡+1,狗先不叫了然后轮到人
LINE 25 fields 14 expected 13 | drowned-altar,溺钟祭坛,Drowned Bell Altar,cult,location,scene,,,,,0,1,在此献祭的卡不触发理智反噬；教团被动加成由+2变+3,祭坛是湿的从来没干过
LINE 30 fields 14 expected 13 | stormy-night,暴雨夜,Stormy Night,neutral,environment,all,,,,,0,1,本夜双方现场位置卡全体-2,雨冲掉了脚印也冲掉了理智
LINE 31 fields 14 expected 13 | unexpected-aid,意外援手,Unexpected Aid,neutral,event,any,,,,,0,1,目标己方卡+3并解除其封印或腐化,门开了门外站着一个不该存在的人
header fields 13 id|nameZh|nameEn|faction|type|location|reasonPower|madnessPower|keywords|sanityCost|copies|effect|flavor
> build · deepseek-v4.1-flash-free
$ Select-String -Path src\styles\screens.css -Pattern '^\.[a-z0-9_-]+' | Select-Object -First 120 | ForEach-Object { $_.Line.Trim() }
.menu-screen {
.menu-bg {
.menu-bg svg {
.menu-inner {
.menu-corners {
.menu-header {
.menu-crest {
.menu-title {
.menu-subtitle {
.menu-divider {
.menu-tagline {
.menu-actions {
.menu-btn {
.menu-btn::after {
.menu-btn:hover {
.menu-btn:hover::after {
.menu-btn--primary {
.menu-btn__icon {
.menu-btn__text {
.menu-btn__text b {
.menu-btn__text small {
.menu-footer {
.menu-setting {
.menu-setting__label {
.segmented {
.seg {
.seg:hover {
.seg.is-active {
.sound-toggle {
.sound-toggle:hover {
.menu-copy {
.menu-panel-layer {
.menu-panel-layer > * {
.faction-select,
.gallery-screen {
.faction-select.is-open,
.gallery-screen.is-open {
.faction-select.is-closing,
.gallery-screen.is-closing {
.faction-select__panel {
.panel-head {
.panel-title {
.panel-close {
.panel-close:hover {
.faction-grid {
.faction-tile {
.faction-tile__emblem {
.faction-tile__name {
.faction-tile__en {
.faction-tile:hover,
.faction-tile.is-selected {
.faction-detail {
.faction-detail__empty {
.faction-detail__info {
.faction-detail__name {
.faction-detail__tagline {
.faction-detail__ability {
.faction-detail__ability p {
.ability-label {
.faction-detail__preset {
.faction-detail__leader {
.faction-detail__leader-card {
.faction-detail__ai-hint {
.gallery {
.gallery-filters {
.gallery-filter {
.gallery-filter.is-active,
.gallery-filter:hover {
.gallery-search {
.gallery-search:focus {
.gallery-body {
.gallery-tabs {
.gallery-tab {
.gallery-tab:hover {
.gallery-tab.is-active {
.gallery-grid {
.gallery-item {
.gallery-item:hover {
.gallery-count {
.match-screen {
.match-topbar {
.side-badge {
.side-badge--me {
.match-topbar .side-badge {
.side-badge.is-active {
.side-badge.is-active::after {
.side-badge.is-passed {
.side-leader {
.side-leader .gt-card,
.side-leader > * {
.side-leader.is-available {
.side-leader.is-used,
.side-leader.is-canceled {
.side-info {
.side-name-row {
.side-emblem {
.side-emblem--northern-realms { color: var(--nr-glow); }
.side-emblem--nilfgaard { color: var(--ng-glow); }
.side-emblem--scoiatael { color: var(--st-glow); }
.side-emblem--monsters { color: var(--mo-glow); }
.side-emblem--skellige { color: var(--sk-glow); }
.side-faction {
.side-ai-tag,
.side-you-tag {
.side-you-tag {
.side-piles {
.pile-btn {
.pile-btn:hover {
.pile-ico {
.pile-num {
.side-score-wrap {
.side-gems {
.gem {
.gem--on {
.side-score {
.side-score.is-leading {
.side-score.is-score-up {
.side-score.is-score-down {
.pass-stamp {
.side-badge.is-passed .pass-stamp {
$ Select-String -Path src\styles\card.css -Pattern '^\.[a-z0-9_-]+' | Select-Object -First 80 | ForEach-Object { $_.Line.Trim() }
.gt-card,
.gt-leader {
.gt-card__art,
.gt-card__art-shade,
.gt-card__frame,
.gt-card__shine,
.gt-card__foil,
.gt-card__weather,
.gt-card__name,
.gt-card__paper,
.gt-card__row,
.gt-card__power,
.gt-card__back-art,
.gt-card__back-sheen,
.gt-leader__art,
.gt-leader__art-shade,
.gt-leader__frame,
.gt-leader__name,
.gt-leader__paper,
.gt-leader__state,
.gt-leader__crown {
.gt-card--xxs {
.gt-card--xs,
.gt-leader--xs {
.gt-card--sm,
.gt-leader--sm {
.gt-card--md,
.gt-leader--md {
.gt-card--lg,
.gt-leader--lg {
.gt-card--northern-realms,
.gt-card--nr,
.gt-leader--northern-realms,
.gt-leader--nr {
.gt-card--nilfgaard,
.gt-card--ng,
.gt-leader--nilfgaard,
.gt-leader--ng {
.gt-card--scoiatael,
.gt-card--st,
.gt-leader--scoiatael,
.gt-leader--st {
.gt-card--monsters,
.gt-card--mo,
.gt-leader--monsters,
.gt-leader--mo {
.gt-card--skellige,
.gt-card--sk,
.gt-leader--skellige,
.gt-leader--sk {
.gt-card--neutral,
.gt-card--neutral,
.gt-leader--neutral,
.gt-leader--neutral {
.gt-card__surface {
.gt-card__surface::before {
.gt-card__surface::after {
.gt-card__art {
.gt-card__art-svg,
.gt-card__art > svg {
.gt-card__art-placeholder {
.gt-card__art-shade {
.gt-card__name {
.gt-card__name-crown {
.gt-card--hero .gt-card__name-crown {
.gt-card--hero .gt-card__name {
.gt-card__name-zh {
.gt-card--hero .gt-card__name-zh {
.gt-card__name-en {
.gt-card__paper {
.gt-card__paper::before {
.gt-card__paper::after {
.gt-card__ability-icon {
.gt-card__ability-icon svg,
.gt-card__row-icon svg {
.gt-card__ability-text {
.gt-card__ability-text--flavor {
.gt-card__power {
.gt-card__power::before {
.gt-card__power::after {
$ Select-String -Path src\ui\art.js -Pattern 'export function|export const|const PALETTE|FACTION|MOTIF|resolveCardArt|renderCardArtSvg|renderLeaderArtSvg|renderCardBackSvg|renderRowIcon' | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }
18: /** ʮ���� motif ���� �� docs/ART_DIRECTION.md ��3 ��Ӧ */
19: export const MOTIFS = [
39: export function hashSeed(str) {
50: export function mulberry32(seed) {
124: export const FACTION_PALETTES = {
193: const PALETTE_ALIASES = {
212: export function paletteFor(factionId) {
213: const raw = String(factionId || "neutral").toLowerCase();
215: return FACTION_PALETTES[id];
218: export function factionKey(factionId) {
219: return paletteFor(factionId).key;
333: function factionDefs(pal, prefix = "gtf") {
392: export function ensureArtSprite() {
407: Object.values(FACTION_PALETTES).forEach((pal) => {
408: markup += factionDefs(pal, "gtf");
624: export function sigilMarkup(key, prefix = "gtf") {
643: * @param {string} factionId
646: export function renderSigil(factionId, opts = {}) {
647: const pal = paletteFor(factionId);
679: export function renderFrameSvg(opts = {}) {
818: export function renderRowIcon(row) {
865: export function renderAbilityIcon(abilities) {
880: export function weatherIconSvg(kind) {
881: return renderRowIcon(String(kind || "").toLowerCase());
910: function factionBackOrnament(pal, prefix) {
953: * @param {string} factionId
956: export function renderCardBackSvg(factionId) {
957: const pal = paletteFor(factionId);
979: ${factionBackOrnament(pal, prefix)}
1334: /** սʿ�ı����������Ǳ� / ���� / ���� / ���棨����ͬ motif ���Ĺ�ͼ���죩 */
1481: function miniSigil(factionKey, x, y, size, opacity = 0.35) {
1485: )}" stroke-linecap="round" opacity="${n(opacity)}">${sigilMarkup(factionKey)}</g>`;
1506: /*  16 �� motif ���ƺ���                                                      */
2666: const baseKey = ctx.subjectMotif && ctx.subjectMotif !== "hero" ? ctx.subjectMotif : "warrior";
2906: /*  Motif ����                                                                */
2909: const MOTIF_ALIASES = {
2959: const MOTIF_RULES = [
3018: /** ���� id / ���� / ��Ӫ�Զ����� motif�������� art.motif�� */
3019: function autoMotif(card) {
3021: for (let i = 0; i < MOTIF_RULES.length; i += 1) {
3022: if (MOTIF_RULES[i][0].test(id)) return MOTIF_RULES[i][1];
3024: const faction = String(card.faction || "neutral").toLowerCase();
3025: if (faction === "scoiatael") return "elf";
3026: if (faction === "monsters") return "monster";
3027: if (faction === "skellige") return "warrior";
3033: * @param {object} card �������ݣ����� id/faction/type/hero/abilities��
3034: * @returns {{motif:string, subjectMotif:string, hero:boolean, weatherKind:string,
3037: export function resolveCardArt(card = {}) {
3040: const explicitRaw = card.art && card.art.motif ? String(card.art.motif).toLowerCase() : "";
3041: const explicit = MOTIFS.includes(explicitRaw)
3043: : MOTIF_ALIASES[explicitRaw] || "";
3047: let motif;
3048: if (type === "weather") motif = "weather";
3049: else if (type === "special") motif = "spell";
3050: else if (explicit) motif = explicit;
3051: else motif = autoMotif(card);
3053: let subjectMotif = motif;
3055: if (motif === "hero") subjectMotif = autoMotif(card);
3056: else subjectMotif = motif;
3057: motif = "hero";
3059: const seedText = `${card.id || "card"}:${card.faction || "neutral"}:${
3061: }:${hero ? "hero" : type}:${subjectMotif}`;
3062: return { motif, subjectMotif, hero, weatherKind, specialKind, seedText };
3095: out += renderSigil(ctx.factionId, {
3173: function composeArt(card, overrideMotif) {
3174: const info = resolveCardArt(card);
3175: const pal = paletteFor(card && card.faction);
3181: factionId: String((card && card.faction) || "neutral"),
3183: motif: overrideMotif || info.motif,
3185: const painter = PAINTERS[ctx.motif] || paintWarrior;
3199: sceneScale[ctx.motif] || 1,
3204: return { ...info, motif: ctx.motif, body, ctx };
3215: card.faction || "",
3218: art.motif || "",
3225: * �õ�һ�ſ��Ĳ廭�����棩������ { motif, body, svg }��
3228: export function getCardArt(card) {
3234: const result = { motif: composed.motif, subjectMotif: composed.subjectMotif, body: composed.body, svg };
3244: export function renderCardArtSvg(card) {
3251: const pal = paletteFor(card && card.faction);
3252: return `<defs>${globalDefs("gtf")}${factionDefs(pal, "gtf")}</defs>`;
3258: export function getCardArtStandaloneSvg(card) {
3271: export function getCardArtDataUrl(card) {
3284: export function preloadArt(cards) {
3291: renderCardArtSvg(card);
3307: export function renderLeaderArtSvg(leader) {
3313: faction: (leader && leader.faction) || "neutral",
3316: art: { motif: "leader", seed: leader && leader.art ? leader.art.seed : undefined },
3325: export const ART_SIZE = { width: ART_W, height: ART_H };
> build · deepseek-v4.1-flash-free
✗ node -e "const fs=require('fs');const b=fs.readFileSync('card-table-v1.csv');console.log('BOM',b[0],b[1],b[2],'bytes',b.length);const t=b.toString('utf8');console.log('CRLF',t.includes('\r\n'),'LF',t.includes('\n'));console.log('quotes',t.includes('\"'));" failed
Error: Portable shell scanner cannot analyze command: unterminated-quote
$ Get-Content migration-plan.md -TotalCount 20; Get-ChildItem docs -File | Select-Object Name,Length
> build �� deepseek-v4.1-flash-free
? Glob "src/**/*" 28 matches
$ Get-ChildItem -Force | Select-Object Mode,Length,Name | Format-Table -AutoSize
Mode  Length Name
----  ------ ----
d----        demo
d----        docs
d----        research
d----        screenshots
d----        scripts
d----        src
d----        tests
-a--- 452    .gitignore
-a--- 0      .nojekyll
-a--- 207    ???????.bat
-a--- 4944   card-table-v1.csv
-a--- 1600   index.html
-a--- 1069   LICENSE
-a--- 0      migration-plan.md

Name              Length
----              ------
ARCHITECTURE.md    17038
ART_DIRECTION.md    9829
GAME_RULES.md      23526
QA_RULES_AUDIT.md  47358
> build · deepseek-v4.1-flash-free
$ Get-Item migration-plan.md | Select-Object Length,LastWriteTime; Get-Content migration-plan.md -Raw | Measure-Object -Character
Length LastWriteTime
------ -------------
 40280 2026/11/24 21:49:40
     1
> build · deepseek-v4.1-flash-free
$ Select-String -Path docs\ARCHITECTURE.md -Pattern '^#|^##|^###' | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }
1: # ���̼ܹ���ģ����Լ �� v1.0
3: ## 1. ����ջ��Ӳ��Լ����
11: ## 2. ���������
21: ## 3. Ŀ¼�ṹ���� Owner��
80: ## 4. ����������Լ��cardsmith �������أ�
125: ## 5. ������Լ��Lead ʵ�֣�AI/UI ������
149: ### 5.1 ������action��
160: ### 5.2 pending ���ߣ�`game.respond(choice)`��
177: ### 5.3 �¼���events���� UI/��Ч���ѣ�
185: ### 5.4 ״̬��ͼ��view��
211: ### 5.5 ����ʵ��Լ��
225: ## 6. ������Ⱦ��Լ��visualist ʵ�֣�Lead ���ã�
247: ## 7. ��Ч��Լ��vfx ʵ�֣�Lead ���ã�
285: ## 8. Э����д������
299: ## 9. ��̱�
$ Select-String -Path docs\GAME_RULES.md -Pattern '^#|^##|^###' | Select-Object -First 80 | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }
1: # Gwent������ʦ3�������ƣ�����淶 �� v1.0
9: ## 1. �Ծ�����
21: ### 1.1 �������̣��ϸ�˳��
31: ### 1.2 С������
39: ### 1.3 С�ֽ�������һС��
58: ## 2. ���㣨ս�����㣩
80: ### 2.1 ������
91: ## 3. ��λ������
93: ### 3.1 ��� Spy
99: ### 3.2 ҽʦ Medic
105: ### 3.3 ���� Muster
118: ### 3.4 ���� Tight Bond
121: ### 3.5 ʿ�� Morale
124: ### 3.6 ���� Agile
127: ### 3.7 ���� Scorch����λ������
134: ### 3.8 ������ Avenger
141: ### 3.9 ��սʿ Berserker
148: ### 3.10 �Žǵ�λ Horn
152: ### 3.11 �����޵�λ Mardroeme
156: ### 3.12 �ٻ� Shield Maidens��Cerys��
162: ## 4. �����ƣ�Special��
166: ### 4.1 Commander's Horn���Žǣ�
172: ### 4.2 Decoy���ն���
179: ### 4.3 Mardroeme�������ޣ�
184: ### 4.4 Scorch�����գ������ƣ�
191: ## 5. �����ƣ�22 �ţ�
233: ## 6. ��Ӫ����
251: ## 7. �������ղ�
261: ## 8. ���������Ӣ��
289: ## 9. ʵ�ֲö����ܣ�������밴��ʵ�֣�
> build · deepseek-v4.1-flash-free
→ Read docs/ARCHITECTURE.md [offset=80, limit=220]
> build · deepseek-v4.1-flash-free
$ $t = [System.IO.File]::ReadAllText('card-table-v1.csv'); [PSCustomObject]@{HasCRLF=$t.Contains("`r`n"); HasLF=$t.Contains("`n"); HasQuote=$t.Contains('"'); StartsWithBOM=$t.StartsWith([char]0xFEFF)} | Format-List
HasCRLF       : False
HasLF         : True
HasQuote      : False
StartsWithBOM : False
$ Format-Hex -Path card-table-v1.csv -Count 8
Label: D:\Games\greyharbor\card-table-v1.csv

          Offset Bytes                                           Ascii
                 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
          ------ ----------------------------------------------- -----
0000000000000000 69 64 2C 6E 61 6D 65 5A                         id,nameZ
> build · deepseek-v4.1-flash-free
→ Read src/ui/card-fallback.js [limit=140]
→ Read src/ui/tooltip.js [limit=120]
> build · deepseek-v4.1-flash-free
$ node -e "const fs=require('fs');const lines=fs.readFileSync('card-table-v1.csv','utf8').trim().split(/\r?\n/);const h=lines[0].split(',');const rows=lines.slice(1).map(l=>{const c=l.split(',');const o={};h.forEach((k,i)=>o[k]=c[i]);o._n=c.length;return o});const count=(arr,key)=>arr.reduce((m,r)=>(m[r[key]||'(空)']=(m[r[key]||'(空)']||0)+1,m),{});console.log('total',rows.length);console.log('faction',count(rows,'faction'));console.log('type',count(rows,'type'));console.log('location',count(rows,'location'));console.log('keywords',count(rows,'keywords'));console.log('sanityCost',count(rows,'sanityCost'));console.log('copies',count(rows,'copies'));console.log('badRows',rows.filter(r=>r._n!==h.length).map(r=>r.id));console.log('byFactionType');for(const f of ['society','cult','neutral'])console.log(f,count(rows.filter(r=>r.faction===f),'type'));"
total 30
faction { society: 12, cult: 12, neutral: 6 }
type {
  leader: 2,
  unit: 16,
  event: 3,
  equipment: 1,
  location: 2,
  ritual: 2,
  environment: 2,
  oldgod: 2
}
location {
  '(空)': 2,
  scene: 7,
  archive: 8,
  dream: 5,
  any: 4,
  row: 1,
  attach: 1,
  all: 2
}
keywords { '(空)': 12, '隐秘': 5, '封印': 2, '连锁': 3, '理智反噬': 4, '献祭': 3, '腐化': 1 }
sanityCost { '0': 16, '1': 2, '2': 2, '(空)': 10 }
copies { '0': 10, '1': 19, '2': 1 }
badRows [
  'abjuration',
  'warding-rite',
  'silver-lantern',
  'old-library',
  'seance',
  'tide-ritual',
  'lunar-eclipse',
  'drowned-altar',
  'stormy-night',
  'unexpected-aid'
]
byFactionType
society { leader: 1, unit: 7, event: 2, equipment: 1, location: 1 }
cult { leader: 1, unit: 7, ritual: 2, environment: 1, location: 1 }
neutral { unit: 2, oldgod: 2, environment: 1, event: 1 }
> build · deepseek-v4.1-flash-free
→ Read server.mjs 
> build · deepseek-v4.1-flash-free
# 《灰港三夜》改造方案（调研版，不含代码）

> **结论先行：这不是昆特牌换皮。**  
> 现有代码里可复用的是“基础设施”（确定性随机、音频合成、粒子特效、程序化美术、无构建外壳、测试运行方式），而**规则引擎、计分、AI、棋盘、卡面、数据层主体都要重做**。  
> 当前 `src` 约 2.7 万行，其中 `engine + ai + board + card-render + app` 约 6.3k 行与昆特规则强耦合；`fx + art` 约 6.5k 行是通用表现层，可复用但需要改事件映射和主题映射。
>
> **重要前提：当前目录不是 git 仓库。** 这次改造会替换大量文件，动手前必须先 `git init` + 首次提交，或整目录快照；否则无法安全回滚。

---

## 1. 卡表盘点

### 1.1 卡表事实

`card-table-v1.csv` 共 **30 张卡**：

| 维度 | 分布 |
|---|---|
| 阵营 | `society` 12 / `cult` 12 / `neutral` 6 |
| 类型 | `leader` 2 / `unit` 16 / `oldgod` 2 / `event` 3 / `equipment` 1 / `location` 2 / `ritual` 2 / `environment` 2 |
| 位置字段 | `scene` 7 / `archive` 8 / `dream` 5 / `any` 4 / `row` 1 / `attach` 1 / `all` 2 / 空 2（领袖） |
| 关键词列 | 隐秘 5 / 封印 2 / 连锁 3 / 理智反噬 4 / 献祭 3 / 腐化 1；另有 12 行为空 |
| 理智代价 | `0` 16 / `1` 2 / `2` 2 / 空 10（列错位，应为 0） |
| 份数 | `1` 19 / `2` 1 / `0` 10（列错位，应为 1） |
| 双面战力 | 理性面 1–8，疯狂面 3–12；疯狂面普遍更高 |

核心新机制已经很清楚：

- **三夜制**：卡牌文本大量出现“每夜一次”“本夜”“下夜”“第三夜”。
- **双面战力**：每张单位/旧神都有 `reasonPower` 与 `madnessPower`。
- **理智**：既有 `sanityCost`（打出代价），又有“扣/回理智”（压力或生命）。
- **三地点**：`scene` / `archive` / `dream`，另有 `any`。
- **六关键词**：隐秘、封印、连锁、理智反噬、献祭、腐化。
- **持续/触发效果**：环境、地点、装备、仪式、领袖主动技。

### 1.2 必须先修的数据缺陷

#### 缺陷 A：10 张非单位牌整行列错位

表头是 **13 列**，但这 10 行是 **14 个字段**：

`abjuration`、`warding-rite`、`silver-lantern`、`old-library`、`seance`、`tide-ritual`、`lunar-eclipse`、`drowned-altar`、`stormy-night`、`unexpected-aid`

如果按列号直接读，会得到：

- `sanityCost = 空`
- `copies = 0`
- `effect = "1"`
- `flavor = 真正的 effect`
- 真正的 `flavor` 被丢弃

**这不是小问题：按现有 CSV 直接导入，1/3 的卡会变成“不可收藏、没有效果”的废卡。**  
必须用“按表头映射 + 行字段数断言 + 显式修复”的导入器，并把修复差异输出成审计报告。按语义推断，正确值应为 `sanityCost=0, copies=1`，但需要原作者确认。

#### 缺陷 B：关键词列不完整

- 10 张效果牌的效果文本里出现了“献祭”“封印”“腐化”等词，但 `keywords` 列为空。
- 关键词列只覆盖了 18 张有战力的单位/旧神。
- 因此不能把 `keywords` 当唯一事实源，必须**从结构化效果反推/人工校对关键词**。

#### 缺陷 C：`location` 字段语义混用

同一个字段承担了三种含义：

- 单位/旧神：`scene` / `archive` / `dream` / `any`，表示**放置地点**。
- 效果牌：`row` / `attach` / `all` / `any`，表示**目标模式**。
- 领袖：空。

建议在数据模型里拆成两个字段：

- `lane`：单位/旧神可放置的地点。
- `target`：效果牌的目标模式（地点、行、附属、全局）。
- 领袖两者都为空。

#### 缺陷 D：牌池规模与现有构筑规则冲突

- 去掉领袖后，单阵营可用牌约为：
  - `society`：11 张本阵营 + 6 张中立 ≈ **17 张**
  - `cult`：11 张本阵营 + 1 张额外份数 + 6 张中立 ≈ **18 张**
- 现有昆特规则要求“单位牌 ≥ 22，特殊牌 ≤ 10”，在新牌池下**不可能成立**。
- 必须重新定义：牌组张数、起手张数、换牌数量、每卡份数、是否允许双阵营、AI 牌组如何构成。

#### 缺陷 E：没有结构化效果

CSV 的 `effect` 是自然语言，不是机器可执行数据。引擎、AI、UI、测试都需要同一套结构化效果，否则只能“解析中文”或“每张卡写死逻辑”，两者都不可维护。

### 1.3 规则空白（必须在写引擎前冻结）

| 主题 | 卡表里的线索 | 必须裁定的问题 |
|---|---|---|
| 三夜流程 | “每夜一次”“本夜”“下夜”“第三夜” | 每夜如何开始/结束？行动数？Pass？三夜两胜还是积分？平夜怎么算？ |
| 理智 | `sanityCost` 0/1/2；“扣/回 1 理智” | 初始值/上限？归零是否立即败？代价与反噬是否同一数值？ |
| 双面 | 理性面/疯狂面；疯狂面普遍更高 | 入场时选面？地点决定？何时翻转？计分用哪一面？ |
| 地点与相邻 | `scene/archive/dream/any`；“相邻”“档案位置” | 每地点容量？相邻怎么定义？能否移动？地点卡如何附着？ |
| 盖牌/隐秘 | “盖牌入场翻开时……” | 何时盖放？何时翻？盖牌是否计分、可被指定？信息对谁可见？ |
| 封印/腐化 | “直到下一夜”“每夜 -1” | 封印持续多久、能封什么？腐化是否叠加、何时结算、如何清除？ |
| 献祭/深渊 | “献祭”“深渊弃牌堆” | 献祭是代价还是效果？被献祭卡去哪？是否触发理智反噬？溺钟祭坛的例外如何生效？ |
| 连锁/教团/环境 | “每有一张相邻己方 +1，上限 +3”“教团被动 +2 变 +3”“本夜” | 连锁的相邻与上限；教团被动的对象与触发；环境叠加与时序；社会阵营被动是什么？ |
| 构筑/起手/AI 信息 | 30 张总量、`copies` 1/2 | 牌组张数、起手、换牌、先手；AI 是否能看到盖牌身份/对手手牌？ |

**从数值设计看，最可能的意图是：**  
理性面低战力、安全；疯狂面高战力，但会触发“理智反噬”扣理智。也就是“高收益 / 高理智代价”的双面抉择。这个方向需要先确认，否则引擎会建立在错误假设上。

---

## 2. 目标架构与改造原则

建议采用“**保留基础设施、并行重写核心、验收后切换入口**”的方式，而不是在原文件里边改边猜。

### 2.1 六条原则

1. **数据优先**：CSV → 规范化 JSON → 生成 `cards.js`；生成文件不手改。
2. **效果结构化**：引擎只读 `effects[]`，不解析中文；中文文案由 `effect-text.js` 从结构化数据渲染，测试保证一致。
3. **引擎契约保持**：继续使用 `createGame / apply / respond / viewFor / getActions / pending / clone` 这套形状，降低 UI/AI/测试改造成本。
4. **隐藏信息隔离**：`viewFor(pov)` 明确哪些字段可见；AI 只拿自己的 view；盖牌身份、对手手牌不能泄漏。
5. **UI 围绕新玩法重做**：三地点、双面、理智、夜、封印/腐化/装备/盖牌；复用 FLIP、手牌扇形、粒子、音频等局部能力。
6. **旧昆特代码先归档**：新模块用 `-v2` 或新目录并行开发，旧测试/旧文档在新套件通过前不删除。

### 2.2 建议目标结构

```text
src/
  data/
    card-table.normalized.json   # 规范化后的唯一数据源
    cards.v1.js                  # 由 JSON 生成
    effects.js                   # 效果 DSL + 注册表
    keywords.js                  # 六关键词元数据
    locations.js                 # scene/archive/dream
    factions.js                  # society/cult/neutral
    leaders.js                   # 2 位领袖
    decks.js                     # 预设牌组
    db.js                        # 索引/查询/牌组校验
    effect-text.js               # 结构化效果 → 中文
  engine/
    engine.js                    # 核心状态机
    scoring.js                   # 双面/地点/连锁/腐化/环境/理智计分
    deck.js                      # 构筑规则
    ai.js                        # 新 AI
    rng.js                       # 直接复用
    view.js                      # view 投影/隐藏信息
    events.js                    # 事件 schema
    night.js                     # 三夜流程/持续效果
    effects/                     # 分类效果处理器
      index.js
      sanity.js
      seal.js
      corrupt.js
      sacrifice.js
      chain.js
      stealth.js
      environment.js
      locations.js
  ui/
    board.js                     # 三地点棋盘
    card-render.js               # 双面卡
    sanity-hud.js
    night-tracker.js
    gallery.js
    menu.js
    deckbuilder.js
    tooltip.js
    i18n.js
    art.js
    fx.js
    audio.js
  styles/
    theme.css
    card.css
    board.css
    screens.css
    deckbuilder.css
    fx.css
scripts/
  import-card-table.mjs
  audit-cards.mjs
  selfplay.mjs
  bench-ai.mjs
docs/
  GREYHARBOR_RULES_V1.md
  CARD_EFFECT_SPEC.md
  DATA_SCHEMA.md
  ARCHITECTURE_V2.md
tests/
  data-schema.test.mjs
  effects.test.mjs
  engine-core.test.mjs
  cards.test.mjs
  ai.test.mjs
  e2e.test.mjs
```

---

## 3. 文件级复用矩阵

> 我把“改造”单列，因为很多文件既不是完全复用，也不是完全重写。

### 3.1 ✅ 可直接复用（只改文案/常量/映射）

| 文件 | 规模 | 说明 |
|---|---:|---|
| `src/engine/rng.js` | 52 行 | mulberry32、洗牌、种子；与题材完全无关。 |
| `src/ui/audio.js` | 929 行 | WebAudio 合成器、环境音、静音、解锁；复用引擎，新增/映射音效名即可。 |
| `src/styles/theme.css` | 261 行 | 暗黑鎏金设计 token；新增 society/cult、地点、理智、夜的颜色变量。 |
| `src/styles/fx.css` | 839 行 | 粒子、横幅、闪光、震屏样式；基本可留。 |
| `index.html`、`server.mjs`、`package.json`、`src/main.js` | ~114 行 | 无构建外壳、静态服务、入口；改标题、meta、启动文案、脚本名。 |
| 测试运行方式 | — | 保留 `node:test` + fixtures 的组织方式；旧断言不复用。 |

### 3.2 🟡 复用骨架，需要改造

| 文件 | 规模 | 改造点 |
|---|---:|---|
| `src/ui/fx.js` | 3351 行 | 保留粒子池、卡牌飞行、屏幕闪白、震屏、横幅、天气粒子；替换 `onEvent` 的昆特分支。建议拆成 `fx-core.js`（通用能力）+ `fx-events.js`（新事件映射）。 |
| `src/ui/art.js` | 3202 行 | 保留确定性 SVG、画框、纹章、卡背、领袖插画；新增 society/cult 调色板和 `location/ritual/oldgod/cultist/deep-one` 等 motif；改 `resolveCardArt` / `autoMotif`。不建议整文件重写。 |
| `src/app.js` | 937 行 | 保留 boot、屏幕路由、modal、settings、AI 定时、事件播放；重写 match 配置、pending 处理、intro/result。建议把 `startMatch` 拆成 `app/match.js`。 |
| `src/ui/menu.js` | 350 行 | 保留菜单、面板、图鉴布局；从 5 阵营改为 2 阵营 + 中立；新筛选；把 gallery 拆成独立模块。 |
| `src/ui/deckbuilder.js` | 1371 行 | 保留搜索/筛选/排序/份数/localStorage/合法性提示；重写阵营、领袖、规则、筛选、牌组规模。 |
| `src/ui/tooltip.js` | 104 行 | 保留定位、单例、延迟隐藏；替换字段为双战力、理智代价、关键词、地点、当前面。 |
| `src/ui/card-fallback.js` | 136 行 | 保留 fallback 契约；新卡面字段需要重写渲染内容。 |
| `src/data/db.js` | 200 行 | 保留索引/查询 API；重写收藏范围、牌组校验、构筑规则。 |
| `src/data/factions.js` | 98 行 | 结构保留；内容换成 society / cult / neutral，补阵营被动。 |
| `src/data/leaders.js` | 275 行 | 结构保留；内容换成 2 位领袖。 |
| `src/data/decks.js` | 352 行 | 结构保留；内容换成新预设牌组。 |
| `src/data/ability-text.js` | 473 行 | 保留“结构化 → 文案”的模式；昆特能力文本全部替换，建议新文件 `effect-text.js`。 |
| `src/styles/screens.css` | 1879 行 | 保留菜单、modal、结算；重写 match/board 段。 |
| `src/styles/deckbuilder.css` | 2043 行 | 保留布局；适配新 token、类名、筛选器。 |
| `scripts/e2e.mjs` | 36 KB | 保留 Playwright 包装；改选择器与流程。 |
| `demo/cards.html` / `demo/fx.html` | — | 可改为“卡表预览 / 特效试验台”。 |

### 3.3 🔴 需要重写

| 文件 | 规模 | 原因 |
|---|---:|---|
| `src/engine/engine.js` | 1677 行 | 三行、天气、宝石、Pass、医师、集结、间谍、英雄等全部是昆特规则；新游戏需要三地点、三夜、理智、双面、封印/腐化/献祭/盖牌。保留公共 API 形状，内部重写。 |
| `src/engine/scoring.js` | 191 行 | 新计分模型：理性/疯狂面、地点加成、连锁、腐化、环境、理智。 |
| `src/engine/deck.js` | 90 行 | 新构筑规则；与 `data/db.js` 的校验合并，避免两套事实源。 |
| `src/engine/ai.js` | 1919 行 | 动作空间、评估函数、难度策略全部换；只复用 `clone + 1-ply` 思路。 |
| `src/ui/board.js` | 785 行 | 三行/天气/宝石/Pass 布局换三地点/理智/夜/盖牌/双面；可复用 FLIP、`fitRow`、手牌扇形。 |
| `src/ui/card-render.js` | 708 行 | 单战力/行图标/英雄/天气卡面换双战力、当前面、理智代价、关键词、地点、封印/腐化/装备标记；可复用 tilt、尺寸、卡背、领袖卡。 |
| `src/ui/i18n.js` | 109 行 | 全部昆特文案。 |
| `src/data/cards.js` | 3169 行 | 替换为 30 张新卡；由规范化 JSON 生成，不手写。 |
| `src/styles/card.css` | 1402 行 | 新卡面解剖：双战力、面切换、关键词条、状态标记。 |
| `tests/*` | — | 旧测试全部是昆特规则；保留运行方式，重写断言。 |
| `docs/GAME_RULES.md`、`docs/QA_RULES_AUDIT.md`、`README.md` | — | 归档旧昆特文档，重写新游戏文档。 |

### 3.4 🆕 需要新增

| 新增 | 用途 |
|---|---|
| `scripts/import-card-table.mjs` | CSV 解析、列错位修复、规范化 JSON、审计报告。 |
| `scripts/audit-cards.mjs` | 30 张卡字段/枚举/引用/牌池统计。 |
| `scripts/selfplay.mjs`、`bench-ai.mjs` | 自对弈稳定性与 AI 性能。 |
| `src/data/card-table.normalized.json` | 唯一数据源，保留原始行号/修复记录。 |
| `src/data/effects.js` | 效果 DSL 与注册表。 |
| `src/data/keywords.js` | 隐秘/封印/连锁/理智反噬/献祭/腐化。 |
| `src/data/locations.js` | scene/archive/dream 的元数据、图标、容量、相邻规则。 |
| `src/data/effect-text.js` | 结构化效果 → 中文文案。 |
| `src/engine/effects/*` | 按类别拆分的效果处理器。 |
| `src/engine/view.js` | view 投影与隐藏信息过滤。 |
| `src/engine/events.js` | 新事件常量与 schema。 |
| `src/engine/night.js` | 三夜流程、本夜/下夜持续效果。 |
| `src/ui/sanity-hud.js`、`night-tracker.js` | 理智与夜次 HUD。 |
| `src/ui/gallery.js` | 从 menu 拆出的独立图鉴。 |
| `src/styles/board.css` | 新棋盘/地点/理智/夜布局。 |
| `docs/GREYHARBOR_RULES_V1.md`、`CARD_EFFECT_SPEC.md`、`DATA_SCHEMA.md`、`ARCHITECTURE_V2.md` | 规则、效果、数据、架构契约。 |
| `tests/data-schema.test.mjs`、`effects.test.mjs`、`engine-core.test.mjs`、`cards.test.mjs`、`ai.test.mjs`、`e2e.test.mjs` | 新测试体系。 |
| `demo/card-table.html` | 可选：数据预览/卡面静态验收。 |

---

## 4. 实施顺序（按可独立验证的阶段）

### 阶段 0：规则与契约冻结（前置，不写实现）

**交付物**

- `docs/GREYHARBOR_RULES_V1.md`：三夜流程、理智、双面、地点/相邻、盖牌/封印/腐化/献祭、连锁、教团被动、环境时序、胜负。
- `docs/CARD_EFFECT_SPEC.md`：效果 DSL、触发器、目标、持续时间、事件 schema、view schema。
- `docs/DATA_SCHEMA.md`：CSV → JSON → JS 的字段映射与校验规则。
- 一页“规则裁定表”：上面 1.3 的每个空白项都要有明确答案。

**验证**

- 30 张卡都能映射到“触发器 + 操作 + 目标 + 持续”的结构。
- 6 个关键词都有触发、持续、叠加、清除规则。
- 文档里没有 `TBD`。

**退出条件**：规则 v1 冻结；后续引擎/UI 不再临时猜规则。

---

### 阶段 1：数据层（不依赖引擎/UI，可独立跑测试）

#### 1.1 CSV 导入与修复

- 新增 `scripts/import-card-table.mjs`：按表头解析，不按列号硬读；断言行字段数；修复 10 张错位牌；保留原始行号与修复 diff。
- 输出 `card-table.normalized.json` 和 `src/data/cards.v1.js`。
- 生成 `audit-cards.mjs` 报告。

**验证**

- 30/30 行；修复后 13 列；10 张修复牌有 diff 记录。
- id 唯一；faction/type/location 枚举合法。
- `sanityCost`、`copies` 正确；30/30 `effect` 非空；`flavor` 不丢失。
- 按阵营统计可收集牌数。

**退出条件**：数据审计 0 error；10 张错位牌全部恢复。

#### 1.2 结构化效果与关键词

- 新增 `effects.js`、`keywords.js`、`locations.js`、`effect-text.js`。
- 每张卡配置结构化效果；效果文本由结构化数据渲染。
- 关键词从效果中反推/人工校对，形成唯一事实源。

**验证**

- 30/30 卡有效果（无效果的普通单位显式标记 `vanilla`）。
- 所有 `op`、`target`、`duration` 都在注册表中。
- 文本渲染器输出与 CSV 原效果逐条对照，差异需人工批准。
- 关键词引用完整：没有“文本提到但数据没标签”的卡。

**退出条件**：30 张卡全部机器可读；效果文本与行为不会漂移。

#### 1.3 阵营、领袖、牌组与构筑规则

- 重写 `factions.js`、`leaders.js`、`decks.js`、`db.js`。
- 定义新牌组规模、起手、换牌、份数、阵营+中立规则。
- 为 society / cult 各准备至少 1 套合法预设，供玩家和 AI 使用。

**验证**

- 每阵营牌池报告；预设牌组合法。
- 非法牌组矩阵：错阵营、超份数、缺领袖、牌数不足/过多全部拒绝。
- AI 预设存在且合法。

**退出条件**：数据层可独立支撑一局“无效果单位”的对局。

#### 1.4 可选：静态卡表预览

- `demo/card-table.html`：只读数据，渲染 30 张卡 + 2 领袖 + 卡背。
- 不接引擎，用于数据/卡面早期验收。

**验证**：打开页面无 console error；30+2 全部出现；字段与 JSON 一致。

---

### 阶段 2：引擎（headless，Node 测试为主）

#### 2.1 核心状态机

- 新 `engine.js`、`scoring.js`、`view.js`、`events.js`、`deck.js`、`night.js`。
- 先只实现“白板单位”：三夜、三地点、理智、回合/Pass、放置、计分、胜负、view、clone、RNG。
- 卡牌效果暂时不接，确保骨架可跑。

**验证**

- 开局/三夜切换/计分/理智归零/胜负/平局裁定。
- 确定性：同种子同操作序列结果一致。
- `clone()` 后推演不污染原局。
- 隐藏信息：`viewFor(0)` 看不到对手手牌；盖牌身份不泄漏。
- 牌数守恒：手牌+牌堆+弃牌堆+深渊+场上+装备。
- 1000 局随机合法动作不崩溃、不卡死。

**退出条件**：白板对局可完整结束。

#### 2.2 卡牌效果系统

- `engine/effects/*`：按类别实现所有效果。
- 30 张卡逐张接入；每张卡至少一个 golden scenario。
- 事件流覆盖 UI 所需信息。

**验证**

- 30/30 卡 golden tests：给定局面，执行后状态/事件符合预期。
- 关键词矩阵：隐秘、封印、连锁、理智反噬、献祭、腐化逐条覆盖。
- 无“未实现 op”；无静默忽略。
- 同种子 replay 一致；clone 推演一致。
- 隐藏信息测试：盖牌翻面前，AI/对手 view 不含身份。

**退出条件**：全部卡牌可执行；事件足够驱动 UI。

#### 2.3 AI

- 新 `ai.js`：动作生成、局面评估、难度分层、1-ply 模拟、随机 fallback。
- 评估维度：理性/疯狂收益、理智安全线、地点控制、封印/腐化价值、手牌保留。

**验证**

- 1000 局 self-play：无非法动作、无卡死、无超时。
- 对随机 AI 胜率 > 60%（先作为健康线，后续调平衡）。
- 单步决策延迟在预算内（如 < 50ms，按实际硬件定）。
- AI view 泄漏测试：不能读取对手手牌/盖牌身份。

**退出条件**：AI 可稳定完成对局，且不作弊。

#### 2.4 牌组校验与预设

- 统一 `db.js` / `deck.js` 的校验入口。
- 预设牌组、随机合法牌组生成器、AI 牌组。

**验证**

- 所有预设合法；非法矩阵全部拒绝。
- 随机生成 1000 套牌组全部合法。
- AI 不会拿到非法牌组。

**退出条件**：玩家/AI 都能从合法牌组开局。

---

### 阶段 3：UI（浏览器 E2E）

#### 3.1 卡面渲染 + 图鉴

- 重写 `card-render.js`：双战力、当前面、理智代价、关键词、地点、封印/腐化/装备标记、盖牌。
- 复用 `art.js` 的程序化美术；新增 society/cult 主题与地点/仪式/旧神 motif。
- 卡背、领袖卡、尺寸、tilt、foil 保留。
- `gallery.js` 静态图鉴。

**验证**

- 30 张卡 + 2 领袖 + 卡背全部渲染。
- 双面切换、关键词、代价、状态标记正确。
- 1280×720 与移动端窄屏截图检查。
- 无 console error；aria-label/键盘可用。

**退出条件**：不接引擎也能验收全部卡面。

#### 3.2 对局棋盘

- 重写 `board.js`：三地点、手牌、理智 HUD、夜次、盖牌、目标选择、pending 弹窗、日志、结算。
- 接引擎 view/action/pending；复用 FLIP、手牌扇形、`fitRow`。

**验证**

- 完整打一局 vs AI：开局 → 三夜 → 结算 → 再来一局。
- 所有动作/目标/pending 都可达。
- 盖牌、封印、腐化、献祭、装备、环境都有可见反馈。
- 同种子 replay 可复现。
- E2E 0 console error、0 pageerror。

**退出条件**：完整对局可玩。

#### 3.3 菜单、组牌器、图鉴

- 菜单改为 society / cult / neutral；快速对局、图鉴、组牌器。
- 组牌器：新规则、新筛选（类型/地点/关键词）、份数、合法性、预设、localStorage。
- 图鉴：按阵营/类型/地点/关键词筛选。

**验证**

- E2E：菜单 → 选阵营 → 开局；组牌器 → 合法/非法牌组；图鉴筛选；刷新后牌组恢复。
- localStorage 使用新命名空间（如 `greyharbor.*`），不能读到旧 `gwent.decks.v1`。

**退出条件**：玩家可不用控制台完成整套流程。

#### 3.4 特效与音频

- `fx.js` 新事件映射：夜开始/结束、理智增减、翻面、封印、腐化、献祭、装备、地点触发。
- 保留粒子池上限、`prefers-reduced-motion`、音频解锁。
- 新增/映射音效名。

**验证**

- 引擎事件覆盖率：每个事件类型有处理器或显式 no-op。
- 粒子峰值不超预算；低配不卡顿。
- 静音/减少动态效果可用。
- 视觉 QA 截图。

**退出条件**：表现层不阻塞规则，且所有关键事件有反馈。

---

### 阶段 4：收尾

- 归档旧昆特数据/规则/测试/文档（保留 git 历史或 `legacy/`）。
- 更新 `README.md`、`index.html` 标题/meta、`package.json` 描述。
- 全量 `npm test` + `npm run e2e` + 数据审计。
- 输出数据审计报告、E2E 报告、规则覆盖表。

**退出条件**：新测试全绿；旧昆特测试不再作为回归基线；文档与代码一致。

### 依赖与并行建议

- **1.1 可以立即开始**，不依赖规则。
- **1.2 / 1.3 依赖阶段 0 的规则裁定**。
- **2.1 依赖 1.1 + 阶段 0**；可以先做白板单位。
- **3.1 依赖 1.2 的数据 schema**，可与 2.x 并行。
- **3.2 依赖 2.1 + 2.2**。
- **3.3 依赖 2.4**。
- **3.4 依赖 3.2**。

---

## 5. 最大的 3 个技术风险

### 风险 1：规则未定义，卡面文本不可执行（阻断级）

**证据**

- CSV 只有自然语言 `effect`，没有核心规则文档。
- 18 张有战力的卡涉及双面/关键词；但“理性面/疯狂面何时生效”“理智归零怎样”“三夜如何结算”“相邻怎么算”“深渊是什么”“教团被动 +2 是什么”全部未定义。
- 现有 `docs/` 全是昆特规则，`migration-plan.md` 没有可用的新规则。

**影响**

- 同一张卡可以有多种合理解释，引擎实现没有唯一正确答案。
- 测试没有 oracle，无法判断“实现对不对”。
- UI 不知道显示哪一面、哪个状态；AI 无法评估收益。
- 后期改规则会导致引擎/UI/AI 连锁返工。

**缓解**

- 先写 `RULES_V1`，每个关键词给出：触发、目标、持续、叠加、清除、结算顺序。
- 每张卡落成“触发器 + 操作 + 目标 + 持续”的结构化效果。
- 为 30 张卡写 golden scenario，作为规则 oracle。
- 卡面中文只做展示，不作为引擎输入。

**验收门槛**：30/30 卡结构化；6 关键词有裁定；0 个 `TBD`；规则评审通过后才开引擎。

---

### 风险 2：CSV 结构性缺陷 + 牌池规模不足（数据级）

**证据**

- 表头 13 列，10 行 14 列；直接按列号读会得到 `copies=0`、`effect="1"`，并丢掉真实效果和风味。
- 关键词列只覆盖单位/旧神；10 张效果牌的关键词为空。
- `location` 同时表示“放置地点”和“目标模式”。
- 单阵营可收集牌只有约 17–18 张，无法满足现有“22 单位 / ≤10 特殊”规则。

**影响**

- 数据导入静默错误，1/3 卡池不可用。
- 牌组无法合法构建，玩家/AI 无牌可打。
- 平衡、测试基线、AI 评估全部建立在错误牌池上。

**缓解**

- 用表头映射 + 行字段数断言 + 修复报告，不按列号硬读。
- 规范化 JSON 作为唯一源；`cards.js` 只生成。
- Schema 校验：枚举、引用、份数、代价、效果完整性。
- 统计每阵营可用牌数，重新定义牌组规模/起手/份数；必要时补牌或允许更多中立。
- 所有预设牌组必须通过新校验。

**验收门槛**：30/30 字段完整；10 行修复有 diff；每阵营至少 1 套合法预设；牌池报告通过。

---

### 风险 3：旧架构耦合 + 隐藏信息/AI 复杂度（工程级）

**证据**

- `engine.js` 1677 行、`ai.js` 1919 行、`board.js` 785 行、`card-render.js` 708 行、`app.js` 937 行，全部以“三行、天气、宝石、单战力、Pass”为前提。
- 新游戏需要“三地点、双面、理智、封印、腐化、装备、盖牌、夜”。
- 盖牌/隐秘/查看手牌引入隐藏信息；AI 的 `clone()` 推演必须只使用自己的 view，否则会“作弊”。
- `fx.js` 3.3k 行、`art.js` 3.2k 行，虽然可复用，但事件/主题映射不改会表现错位。

**影响**

- 直接在旧文件上改，容易出现“界面能跑、规则错位”。
- 旧 view/event 字段会泄漏到新 UI，导致后续难以清理。
- AI 可能读取盖牌身份/对手手牌，破坏对局公平。
- 重写范围失控，长期处于不可运行状态。

**缓解**

- 先定 v2 `view` / `event` 契约，再写 UI。
- 引擎保持 DOM-free；`viewFor(pov)` 明确隐藏字段；AI 只吃自己的 view。
- `board` / `card-render` 重写；`fx` 拆 core/events；`art` 加主题映射而不是整文件重写。
- 用 golden replay + view leak tests + 1000 局 self-play 做回归。
- 新模块并行开发，验收后切换入口；旧昆特代码保留到新套件全绿。

**验收门槛**：1000 局 self-play 无非法/卡死；AI view 不含隐藏信息；E2E 全流程 0 console error。

---

### 次级风险 / 注意事项

- **当前不是 git 仓库**：重写前必须快照，否则无法回滚。
- **旧测试会制造虚假安全感**：106 个昆特测试全部通过，不代表新游戏正确；必须新建 30 卡 golden tests。
- **localStorage 污染**：旧键 `gwent.settings.v1`、`gwent.decks.v1` 会被新游戏误读；改用 `greyharbor.*` 或版本号。
- **术语不统一**：CSV 里“位置/地点/排/行”混用；需要一份术语表，否则 UI/规则/测试会各说各话。
- **CSV 未来可能含逗号/引号**：当前无引号，但效果文本一旦出现英文逗号，`split(',')` 会再次错位；必须用真正的 CSV 解析器。
- **30 张卡、2 阵营的重开性有限**：技术跑通后要尽早做平衡/内容扩展评估，否则 AI 对局会很快退化。

---

## 6. 建议的下一步（仍不写实现代码）

1. **先确认 1.3 的规则空白**，尤其是：三夜胜负、理智归零、双面选择、地点容量/相邻、盖牌翻面、封印/腐化持续、献祭去向、教团被动。
2. **先做数据审计**：产出规范化 JSON + 10 行修复 diff + 牌池统计，不改引擎。
3. **再写 `RULES_V1` + 效果 DSL 草案**，用 30 张卡逐条对照，确认没有无法表达的效果。
4. **最后才开引擎**：先白板单位跑通三夜，再接效果，再接 AI，最后做 UI。

如果按这个顺序推进，最早可以独立验收的成果是：**30 张卡 100% 结构化 + 数据审计 0 error + 每阵营一套合法预设**，此时还不需要写一行引擎或 UI 代码。
