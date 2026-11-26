
> build · hy4-flash-free
I'll start by reading the required files to understand the existing structure before making changes.
→ Read docs/GREYHARBOR_RULES_V1.md 
→ Read src/engine/v2/cards.js 
> build · hy4-flash-free
Now let me look at the card data, existing tests, and scripts structure.
✱ Glob "tests/**/*.test.mjs" 14 matches
→ Read src/data/card-table.normalized.json [limit=80]
→ Read package.json 
✱ Glob "scripts/*.mjs" 4 matches
> build · hy4-flash-free
→ Read tests/v2/engine-core.test.mjs [limit=60]
✱ Grep "buildPreset|PRESET_DECKS|makeCardIndex|validateDeck" in . · 56 matches
> build · hy4-flash-free
→ Read src/engine/v2/index.js 
→ Read src/data/card-table.normalized.json [offset=80, limit=700]
> build · hy4-flash-free
Let me check the regression scripts to see if they write any files, and confirm baseline tests pass before changes.
→ Read scripts/ai-match.mjs 
→ Read scripts/selfplay.mjs 
> build · hy4-flash-free
$ node --test "tests/v2/*.test.mjs" "tests/ai-v2/*.test.mjs" 2>&1 | Select-Object -Last 20
ok 56 - dream admission: affinity, stealth face-down entry, and the per-night limit
  ---
  duration_ms: 2.7831
  type: 'test'
  ...
# Subtest: random legal self-play never crashes or deadlocks
ok 57 - random legal self-play never crashes or deadlocks
  ---
  duration_ms: 72.8539
  type: 'test'
  ...
1..57
# tests 57
# suites 0
# pass 57
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2427.4412
> build · hy4-flash-free
Now I'll create the new validator module.
← Write src/engine/v2/deck-validation.js
Created file successfully: src/engine/v2/deck-validation.js
> build · hy4-flash-free
← Edit src/engine/v2/cards.js
Index: src/engine/v2/cards.js
===================================================================
--- src/engine/v2/cards.js
+++ src/engine/v2/cards.js
@@ -11,8 +11,10 @@
  */
 
 import { readFileSync } from 'node:fs';
 
+import { validateDeck, DECK_ERROR_CODES } from './deck-validation.js';
+
 const DATA_URL = new URL('../../data/card-table.normalized.json', import.meta.url);
 
 const KEYWORD_MAP = Object.freeze({
   隐秘: 'stealth',

> build · hy4-flash-free
← Edit src/engine/v2/cards.js
Index: src/engine/v2/cards.js
===================================================================
--- src/engine/v2/cards.js
+++ src/engine/v2/cards.js
@@ -99,24 +99,38 @@
 function expand(entries) {
   return Object.freeze(entries.flatMap(([id, count]) => Array(count).fill(id)));
 }
 
+/** Keep the historical preset error wording while delegating all checks to the validator. */
+function presetErrorMessage(id, error, summary) {
+  switch (error.code) {
+    case DECK_ERROR_CODES.MALFORMED_INPUT:
+      return `preset ${id} has malformed deck input`;
+    case DECK_ERROR_CODES.UNKNOWN_CARD:
+      return `preset ${id} references unknown card ${error.cardId}`;
+    case DECK_ERROR_CODES.LEADER_INVALID:
+      return `preset ${id} has an invalid leader ${error.cardId}`;
+    case DECK_ERROR_CODES.LEADER_IN_ENTRIES:
+      return `preset ${id} contains leader ${error.cardId}`;
+    case DECK_ERROR_CODES.FACTION_MISMATCH:
+      return `preset ${id} contains out-of-faction card ${error.cardId}`;
+    case DECK_ERROR_CODES.COPY_LIMIT:
+      return `preset ${id} contains more than 2 copies of ${error.cardId}`;
+    case DECK_ERROR_CODES.NON_LEADER_COUNT:
+      return `preset ${id} must contain 19 non-leader cards, got ${summary.nonLeaderCount}`;
+    case DECK_ERROR_CODES.TOTAL_COUNT:
+      return `preset ${id} must contain 20 cards, got ${summary.total}`;
+    default:
+      return `preset ${id} failed deck validation: ${error.message}`;
+  }
+}
+
 function buildPreset({ id, name, faction, leader, entries }) {
-  const cards = expand(entries);
-  if (cards.length !== 19) {
-    throw new Error(`preset ${id} must contain 19 non-leader cards, got ${cards.length}`);
+  const validation = validateDeck({ faction, leader, entries }, CARDS);
+  if (!validation.ok) {
+    throw new Error(presetErrorMessage(id, validation.errors[0], validation.summary));
   }
-  for (const cardId of cards) {
-    const card = CARDS[cardId];
-    if (!card) throw new Error(`preset ${id} references unknown card ${cardId}`);
-    if (card.type === 'leader') throw new Error(`preset ${id} contains leader ${cardId}`);
-    if (card.faction !== faction && card.faction !== 'neutral') {
-      throw new Error(`preset ${id} contains out-of-faction card ${cardId}`);
-    }
-  }
-  if (!CARDS[leader] || CARDS[leader].type !== 'leader') {
-    throw new Error(`preset ${id} has an invalid leader ${leader}`);
-  }
+  const cards = expand(entries);
   return Object.freeze({ id, name, faction, leader, cards });
 }
 
 export const PRESET_DECKS = Object.freeze({

> build · hy4-flash-free
→ Read src/engine/v2/cards.js [offset=90, limit=80]
> build · hy4-flash-free
$ node --input-type=module -e "import { PRESET_DECKS, CARDS, CARD_LIST, DEFAULT_DECK_ORDER, makeCardIndex } from './src/engine/v2/cards.js'; import { validateDeck } from './src/engine/v2/deck-validation.js'; for (const k of DEFAULT_DECK_ORDER) { const d = PRESET_DECKS[k]; const r = validateDeck({faction:d.faction, leader:d.leader, cards:[...d.cards]}, CARDS); console.log(k, d.cards.length, Object.isFrozen(d), Object.isFrozen(d.cards), r.ok, JSON.stringify(r.summary)); } console.log('exports', Object.keys(CARDS).length, CARD_LIST.length, Object.keys(makeCardIndex()).length);"
society 19 true true true {"faction":"society","leader":"harold-ashby","total":20,"leaderCount":1,"nonLeaderCount":19,"distinctNonLeaders":16,"copies":{"nora-wells":2,"samuel-pike":2,"edith-barrow":1,"walter-morse":1,"lucia-vaughn":1,"frank-holt":1,"arthur-pendleton":1,"abjuration":1,"warding-rite":1,"silver-lantern":1,"old-library":1,"finn-calloway":1,"silas-gold":2,"thousand-eyes":1,"unexpected-aid":1,"stormy-night":1}}
cult 19 true true true {"faction":"cult","leader":"elias-thorne","total":20,"leaderCount":1,"nonLeaderCount":19,"distinctNonLeaders":17,"copies":{"hooded-acolyte":2,"zealot":2,"sea-priestess":1,"gravedigger":1,"whisperer":1,"deep-one":1,"bell-claw":1,"seance":1,"tide-ritual":1,"lunar-eclipse":1,"drowned-altar":1,"finn-calloway":1,"silas-gold":1,"the-sleeper":1,"thousand-eyes":1,"stormy-night":1,"unexpected-aid":1}}
exports 30 30 30
> build · hy4-flash-free
Now the test file with comprehensive coverage.
← Write tests/v2/deck-validation.test.mjs
Created file successfully: tests/v2/deck-validation.test.mjs
> build · hy4-flash-free
← Edit tests/v2/deck-validation.test.mjs
Index: tests/v2/deck-validation.test.mjs
===================================================================
--- tests/v2/deck-validation.test.mjs
+++ tests/v2/deck-validation.test.mjs
@@ -112,9 +112,9 @@
     );
     assert.equal(result.ok, true, JSON.stringify(result.errors));
     assert.deepEqual(result.errors, []);
     assert.equal(result.summary.faction, key);
-    assert.equal(result.summary.leader, EXPECTED_COPIES[key] && deck.leader);
+    assert.equal(result.summary.leader, deck.leader);
     assert.equal(result.summary.leaderCount, 1);
     assert.equal(result.summary.nonLeaderCount, 19);
     assert.equal(result.summary.total, 20);
     assert.equal(result.summary.distinctNonLeaders, Object.keys(EXPECTED_COPIES[key]).length);

> build · hy4-flash-free
← Edit tests/v2/deck-validation.test.mjs
Index: tests/v2/deck-validation.test.mjs
===================================================================
--- tests/v2/deck-validation.test.mjs
+++ tests/v2/deck-validation.test.mjs
@@ -295,22 +295,26 @@
   assert.equal(result.summary.nonLeaderCount, 19);
 });
 
 test('a caller-supplied card index is used (reusable for a future UI builder)', () => {
-  const customIndex = {
-    'custom-leader': { id: 'custom-leader', faction: 'society', type: 'leader' },
-    'custom-unit': { id: 'custom-unit', faction: 'neutral', type: 'unit' },
-  };
-  const entries = Array.from({ length: 19 }, () => ['custom-unit', 1]);
-  const result = validateDeck(
+  const unitIds = Array.from({ length: 19 }, (_, index) => `custom-unit-${index}`);
+  const makeIndex = (leaderFaction, unitFaction) => ({
+    'custom-leader': { id: 'custom-leader', faction: leaderFaction, type: 'leader' },
+    ...Object.fromEntries(
+      unitIds.map((id) => [id, { id, faction: unitFaction, type: 'unit' }]),
+    ),
+  });
+  const entries = unitIds.map((id) => [id, 1]);
+  const legal = validateDeck(
     { faction: 'society', leader: 'custom-leader', entries },
-    customIndex,
+    makeIndex('society', 'neutral'),
   );
-  assert.equal(result.ok, true, JSON.stringify(result.errors));
+  assert.equal(legal.ok, true, JSON.stringify(legal.errors));
   const bad = validateDeck(
     { faction: 'cult', leader: 'custom-leader', entries },
-    customIndex,
+    makeIndex('society', 'society'),
   );
+  assert.equal(bad.ok, false);
   assert.ok(codesOf(bad).includes(C.LEADER_INVALID));
   assert.ok(codesOf(bad).includes(C.FACTION_MISMATCH));
 });
 

> build · hy4-flash-free
← Edit tests/v2/deck-validation.test.mjs
Index: tests/v2/deck-validation.test.mjs
===================================================================
--- tests/v2/deck-validation.test.mjs
+++ tests/v2/deck-validation.test.mjs
@@ -342,9 +342,9 @@
 });
 
 test('boundary: duplicate leader (leader slot + entry, twice in entries)', () => {
   const entries = baseEntries();
-  entries[2] = ['harold-ashby', 2];
+  entries[2] = ['harold-ashby', 3];
   const result = validateDeck(makeInput({ entries }), CARDS);
   assert.equal(result.ok, false);
   assert.equal(codesOf(result).filter((code) => code === C.LEADER_IN_ENTRIES).length, 1);
   assert.ok(codesOf(result).includes(C.COPY_LIMIT));

> build · hy4-flash-free
Now let me run the new test file.
$ node --test tests/v2/deck-validation.test.mjs 2>&1 | Select-Object -Last 60
duration_ms: 0.1255
  type: 'test'
  ...
# Subtest: a caller-supplied card index is used (reusable for a future UI builder)
ok 18 - a caller-supplied card index is used (reusable for a future UI builder)
  ---
  duration_ms: 0.6049
  type: 'test'
  ...
# Subtest: boundary: empty entries array
ok 19 - boundary: empty entries array
  ---
  duration_ms: 0.0891
  type: 'test'
  ...
# Subtest: boundary: empty cards array
ok 20 - boundary: empty cards array
  ---
  duration_ms: 0.058
  type: 'test'
  ...
# Subtest: boundary: duplicate leader (leader slot + entry, twice in entries)
ok 21 - boundary: duplicate leader (leader slot + entry, twice in entries)
  ---
  duration_ms: 0.0937
  type: 'test'
  ...
# Subtest: boundary: unknown id
ok 22 - boundary: unknown id
  ---
  duration_ms: 0.0853
  type: 'test'
  ...
# Subtest: boundary: zero and negative counts are MALFORMED_INPUT
ok 23 - boundary: zero and negative counts are MALFORMED_INPUT
  ---
  duration_ms: 0.2012
  type: 'test'
  ...
# Subtest: boundary: non-string element in cards form
ok 24 - boundary: non-string element in cards form
  ---
  duration_ms: 0.084
  type: 'test'
  ...
# Subtest: boundary: missing card index is a programmer-level error (throws)
ok 25 - boundary: missing card index is a programmer-level error (throws)
  ---
  duration_ms: 0.3248
  type: 'test'
  ...
1..25
# tests 25
# suites 0
# pass 24
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 118.3045
> build · hy4-flash-free
$ node --test tests/v2/deck-validation.test.mjs 2>&1 | Select-String -Pattern "not ok|expected|actual|error:|code:|AssertionError" -Context 0,12
> not ok 8 - LEADER_INVALID: missing / non-leader / wrong-faction leader
    ---
    duration_ms: 0.6737
    type: 'test'
    location: 'D:\\Games\\greyharbor\\tests\\v2\\deck-validation.test.mjs:167:1'
    failureType: 'testCodeFailure'
>   error: |-
      leader=undefined
      
      true !== false
      
>   code: 'ERR_ASSERTION'
>   name: 'AssertionError'
>   expected: false
>   actual: true
    operator: 'strictEqual'
    stack: |-
      TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/deck-validation.test.mjs:170:12)
      Test.runInAsyncScope (node:async_hooks:214:14)
      Test.run (node:internal/test_runner/test:1047:25)
      Test.processPendingSubtests (node:internal/test_runner/test:744:18)
      Test.postRun (node:internal/test_runner/test:1173:19)
      Test.run (node:internal/test_runner/test:1101:12)
      async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
    ...
  # Subtest: LEADER_IN_ENTRIES: leader card smuggled into the 19-card area
  ok 9 - LEADER_IN_ENTRIES: leader card smuggled into the 19-card area
> build · hy4-flash-free
← Edit tests/v2/deck-validation.test.mjs
Index: tests/v2/deck-validation.test.mjs
===================================================================
--- tests/v2/deck-validation.test.mjs
+++ tests/v2/deck-validation.test.mjs
@@ -164,13 +164,19 @@
   assert.equal(error.cardId, 'zealot');
 });
 
 test('LEADER_INVALID: missing / non-leader / wrong-faction leader', () => {
-  for (const leader of [undefined, 'nora-wells', 'elias-thorne']) {
-    const result = validateDeck(makeInput({ leader }), CARDS);
-    assert.equal(result.ok, false, `leader=${leader}`);
-    assert.ok(codesOf(result).includes(C.LEADER_INVALID), `leader=${leader}`);
-  }
+  const cases = [
+    { faction: 'society', entries: baseEntries() }, // missing leader field
+    { faction: 'society', leader: null, entries: baseEntries() },
+    makeInput({ leader: 'nora-wells' }), // not a leader card
+    makeInput({ leader: 'elias-thorne' }), // wrong faction
+  ];
+  cases.forEach((input, index) => {
+    const result = validateDeck(input, CARDS);
+    assert.equal(result.ok, false, `case=${index}`);
+    assert.ok(codesOf(result).includes(C.LEADER_INVALID), `case=${index}`);
+  });
 });
 
 test('LEADER_IN_ENTRIES: leader card smuggled into the 19-card area', () => {
   const entries = baseEntries();

> build · hy4-flash-free
$ node --test tests/v2/deck-validation.test.mjs 2>&1 | Select-Object -Last 12
duration_ms: 0.3062
  type: 'test'
  ...
1..25
# tests 25
# suites 0
# pass 25
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 110.4184
> build · hy4-flash-free
New tests are green. Now the full regression and both script reruns in parallel.
$ node scripts/ai-match.mjs 2>&1
{
  "ok": true,
  "mode": "ai-vs-random",
  "games": 200,
  "elapsedMs": 804,
  "aiSeats": [
    0,
    1
  ],
  "wins": {
    "ai": 147,
    "p0": 61,
    "p1": 139,
    "draw": 0
  },
  "aiWinRate": 0.735,
  "reasons": {
    "nightWins": 148,
    "sanity": 52
  },
  "endingNight": {
    "1": 6,
    "2": 165,
    "3": 29
  },
  "sanityEndingRatio": 0.26,
  "totalActions": 5340,
  "avgActionsPerGame": 26.7,
  "maxActionsPerGame": 39,
  "conservation": "ok"
}
$ node scripts/selfplay.mjs 2>&1
Greyharbor v2.2 self-play
{
  "ok": true,
  "games": 1000,
  "elapsedMs": 1054,
  "avgMsPerGame": 1.054,
  "maxGameMs": 13,
  "wins": {
    "p0": 436,
    "p1": 564,
    "draw": 0
  },
  "reasons": {
    "sanity": 386,
    "nightWins": 614
  },
  "endingNight": {
    "1": 67,
    "2": 768,
    "3": 165
  },
  "totalActions": 26239,
  "avgActionsPerGame": 26.24,
  "maxActionsPerGame": 39,
  "sanityEndingRatio": 0.386,
  "conservation": "ok"
}
$ node --test "tests/v2/*.test.mjs" "tests/ai-v2/*.test.mjs" 2>&1 | Select-Object -Last 14
ok 82 - random legal self-play never crashes or deadlocks
  ---
  duration_ms: 79.3401
  type: 'test'
  ...
1..82
# tests 82
# suites 0
# pass 82
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2556.7445
> build · hy4-flash-free
All green. Let me capture the full test listing for the transcript's coverage matrix.
$ node --test tests/v2/deck-validation.test.mjs 2>&1 | Select-String -Pattern "^(ok|not ok) "
ok 1 - error code constants are semantic, frozen and complete
ok 2 - official preset society: ok with §10 summary numbers
ok 3 - official preset cult: ok with §10 summary numbers
ok 4 - MALFORMED_INPUT: null input is an error, not an exception
ok 5 - MALFORMED_INPUT: wrong entry shape is reported
ok 6 - UNKNOWN_CARD: unindexed id is reported with cardId
ok 7 - FACTION_MISMATCH: enemy-faction card in a society deck
ok 8 - LEADER_INVALID: missing / non-leader / wrong-faction leader
ok 9 - LEADER_IN_ENTRIES: leader card smuggled into the 19-card area
ok 10 - NON_LEADER_COUNT: 18 non-leaders is rejected
ok 11 - COPY_LIMIT: three copies of one non-leader is rejected
ok 12 - TOTAL_COUNT: 21 cards including the leader is rejected
ok 13 - multiple violations are all reported in one pass
ok 14 - entries and expanded cards forms give identical results (legal deck)
ok 15 - entries and expanded cards forms give identical errors (illegal deck)
ok 16 - validateDeck does not mutate either input form
ok 17 - entries takes precedence when both forms are supplied
ok 18 - a caller-supplied card index is used (reusable for a future UI builder)
ok 19 - boundary: empty entries array
ok 20 - boundary: empty cards array
ok 21 - boundary: duplicate leader (leader slot + entry, twice in entries)
ok 22 - boundary: unknown id
ok 23 - boundary: zero and negative counts are MALFORMED_INPUT
ok 24 - boundary: non-string element in cards form
ok 25 - boundary: missing card index is a programmer-level error (throws)
> build · hy4-flash-free
✗ Write phase2.4-transcript.md failed
Error: Unable to write D:\Games\greyharbor\phase2.4-transcript.md
> build · hy4-flash-free
$ Get-Item -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' -ErrorAction SilentlyContinue | Format-List FullName,Length,Attributes; Test-Path -LiteralPath 'D:\Games\greyharbor'
FullName   : D:\Games\greyharbor\phase2.4-transcript.md
Length     : 17852
Attributes : Archive

True
> build · hy4-flash-free
The file appears to exist despite the error. Let me verify its contents.
→ Read phase2.4-transcript.md [limit=40]
> build · hy4-flash-free
→ Read phase2.4-transcript.md [offset=280, limit=80]
> build · hy4-flash-free
→ Read phase2.4-transcript.md [offset=400, limit=60]
> build · hy4-flash-free
The harness is auto-writing the transcript file, so my overwrite was blocked. I'll append the required appendix to the existing full transcript instead.
✗ $append = @'
---

# 阶段 2.4 结构附录（错误码清单 / 覆盖矩阵 / 疑问）

## A. 错误码清单

模块 `src/engine/v2/deck-validation.js` 导出冻结常量 `DECK_ERROR_CODES`（键名与值相同）、别名 `ERROR_CODES`、固定顺序数组 `DECK_ERROR_CODE_LIST`、规则常量 `DECK_RULES`（total=20 / nonLeaderCount=19 / maxCopies=2 / factions / neutral / leaderType）。

| # | code | 触发条件 | 附带字段 |
|---|---|---|---|
| 1 | `MALFORMED_INPUT` | input 非对象；缺 faction；entries/cards 非数组；条目形状错误；份数 0/负数/非整数；cards 元素非字符串 | 份数类错误带 cardId |
| 2 | `UNKNOWN_CARD` | 条目 id 不在 cardIndex 中（按 id 去重） | cardId |
| 3 | `FACTION_MISMATCH` | 非领袖卡 faction 既非声明阵营也非 neutral | cardId |
| 4 | `LEADER_INVALID` | 领袖字段缺失 / id 未知 / 非 leader 类型 / 阵营与牌组不符（每副牌最多一条） | 有 id 时带 cardId |
| 5 | `LEADER_IN_ENTRIES` | leader 类型卡出现在非领袖区（按 id 去重） | cardId |
| 6 | `NON_LEADER_COUNT` | 非领袖合计 != 19 | — |
| 7 | `COPY_LIMIT` | 任一非领袖 id 份数 > 2（按 id 一条） | cardId |
| 8 | `TOTAL_COUNT` | 含领袖总数 != 20 | — |

`ok = errors.length === 0`。坏数据全部进 errors，不抛业务异常；只有 `cardIndex` 不是对象时抛 `TypeError`。返回结构：`{ ok, errors: [{code,message,cardId?}], summary: {faction, leader, total, leaderCount, nonLeaderCount, distinctNonLeaders, copies} }`。两种输入形式：`{faction, leader, entries:[[id,count],...]}` 与 `{faction, leader, cards:[id,...]}`，同时存在时 entries 优先。

## B. 测试覆盖矩阵

新增 `tests/v2/deck-validation.test.mjs`：25/25 通过。全量回归：`node --test "tests/v2/*.test.mjs" "tests/ai-v2/*.test.mjs"` → 82 tests / 82 pass / 0 fail（原 57 + 新 25）。

| 测试 # | 覆盖点 | 错误码/需求 |
|---|---|---|
| 1 | 错误码常量、冻结、顺序、DECK_RULES | A 语义化常量 |
| 2 | 官方 society 预设：ok、20/19/1、16 类各份数 | C §10.1 + summary |
| 3 | 官方 cult 预设：ok、20/19/1、17 类各份数 | C §10.2 + summary |
| 4 | null 输入返回 errors 不抛异常 | C null 边界 |
| 5 | 条目形状错误 | MALFORMED_INPUT |
| 6 | 未知 id + cardId | UNKNOWN_CARD / C |
| 7 | society 中 cult 卡 zealot | FACTION_MISMATCH |
| 8 | 缺字段/null/非领袖/错阵营四例 | LEADER_INVALID |
| 9 | 领袖混入非领袖区 | LEADER_IN_ENTRIES / C |
| 10 | 18 张非领袖 | NON_LEADER_COUNT |
| 11 | nora-wells x3（message 含份数） | COPY_LIMIT |
| 12 | 20 非领袖 + 领袖 = 21 | TOTAL_COUNT |
| 13 | 7 类错误一次全报 | C 多错并存 |
| 14 | entries 与 cards 合法结果 deepEqual | C 两形式一致 |
| 15 | entries 与 cards 非法结果一致 | C 两形式一致 |
| 16 | 两种输入均不被修改；预设仍冻结 | C 纯函数 |
| 17 | 两形式同时存在时 entries 优先 | A 双形式兼容 |
| 18 | 注入自定义 cardIndex | A 可复用 |
| 19 | 空 entries 数组 | C 空数组 / 计数错误 |
| 20 | 空 cards 数组 | C 空数组 |
| 21 | 重复领袖（entries 中 x3） | LEADER_IN_ENTRIES + COPY_LIMIT |
| 22 | 未知 id 边界 | UNKNOWN_CARD |
| 23 | 份数 0 与 -1 | MALFORMED_INPUT / C |
| 24 | cards 元素非字符串 | MALFORMED_INPUT |
| 25 | cardIndex 为 null / 123 抛 TypeError | A 仅程序员级错误抛 |

错误码 → 用例：MALFORMED_INPUT #4/#5/#23/#24；UNKNOWN_CARD #6/#13/#22；FACTION_MISMATCH #7/#13/#18；LEADER_INVALID #8/#13/#18；LEADER_IN_ENTRIES #9/#13/#21；NON_LEADER_COUNT #10/#12/#13/#19/#20；COPY_LIMIT #11/#13/#21；TOTAL_COUNT #12/#13/#19。

脚本复跑：`node scripts/selfplay.mjs` → ok:true、1000 局、conservation:ok；`node scripts/ai-match.mjs` → ok:true、ai-vs-random 200 局、aiWinRate 0.735、conservation:ok。行为无回归。

## C. 交付物清单

- 新增 `src/engine/v2/deck-validation.js`
- 新增 `tests/v2/deck-validation.test.mjs`
- 新增 `phase2.4-transcript.md`（本文件：完整转录 + 本附录）
- 重构 `src/engine/v2/cards.js`（仅删除内联校验、改调 validateDeck，组装与冻结结构不变）

未触碰旧引擎、UI、AI、其他测试、scripts、数据文件与 package.json。

## D. 疑问（只记录，不自创规则）

1. 规则文档未规定 `entries` 与 `cards` 同时出现时的优先级；本实现取 `entries` 优先，是否改为报错待确认。
2. §2.2 明确 `copies` 为收藏字段、预设不套用；本次完全忽略该字段。未来 UI 若需同时校验收藏上限，错误码与入口需另行定义。
3. 份数 0/负数/非整数、非字符串 id 等，规则文档无对应条款；本实现统一归为 `MALFORMED_INPUT`，是否需要独立错误码待确认。
4. 领袖卡阵营不符本实现归 `LEADER_INVALID`（需求释义含“阵营不符”）；若 UI 希望 faction 类提示统一，需产品裁定。
5. 硬约束禁改其他文件，故 `src/engine/deck.js`（v1）与 `src/data/decks.js` 中同名校验仍存在；是否未来统一为单一路径需另行安排。
6. `buildPreset` 失败文案保留历史风格，但新增 COPY_LIMIT/TOTAL_COUNT/LEADER_IN_ENTRIES 等分支原实现无对应文案；本实现按同风格补充，是否逐字沿用旧文案待确认。
7. `summary` 字段名由本阶段定义，规则文档未规定 UI 消费格式；UI 组接入如需改名应作为 API 变更处理。
'@
Add-Content -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' -Value $append -Encoding utf8
(Get-Content -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' | Measure-Object -Line).Lines failed
Error: Portable shell scanner cannot analyze command: invalid-structure
> build · hy4-flash-free
← Write C:/Users/31709/AppData/Local/Temp/opencode/phase24-appendix.md
Created file successfully: C:/Users/31709/AppData/Local/Temp/opencode/phase24-appendix.md
> build · hy4-flash-free
$ Get-Content -LiteralPath 'C:\Users\31709\AppData\Local\Temp\opencode\phase24-appendix.md' -Raw -Encoding utf8 | Add-Content -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' -Encoding utf8
Add-Content: The process cannot access the file 'D:\Games\greyharbor\phase2.4-transcript.md' because it is being used by another process.
> build · hy4-flash-free
$ Add-Content -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' -Value '<!-- appendix-pending -->' -Encoding utf8
Add-Content: The process cannot access the file 'D:\Games\greyharbor\phase2.4-transcript.md' because it is being used by another process.
> build · hy4-flash-free
→ Read phase2.4-transcript.md [offset=452, limit=20]
> build · hy4-flash-free
$ Get-Content -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' -Tail 8
$ Get-Content -LiteralPath 'C:\Users\31709\AppData\Local\Temp\opencode\phase24-appendix.md' -Raw -Encoding utf8 | Add-Content -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' -Encoding utf8
Add-Content: The process cannot access the file 'D:\Games\greyharbor\phase2.4-transcript.md' because it is being used by another process.
> build �� hy4-flash-free
$ Add-Content -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' -Value '<!-- appendix-pending -->' -Encoding utf8
Add-Content: The process cannot access the file 'D:\Games\greyharbor\phase2.4-transcript.md' because it is being used by another process.
> build �� hy4-flash-free
�� Read phase2.4-transcript.md [offset=452, limit=20]
> build �� hy4-flash-free
> build · hy4-flash-free
✗ Edit phase2.4-transcript.md failed
Error: Found 2 matches for oldString, but expected exactly one. Add more surrounding context to make oldString unique, or set replaceAll to true to replace every occurrence.
> build · hy4-flash-free
$ $src='C:\Users\31709\AppData\Local\Temp\opencode\phase24-appendix.md'; $dst='D:\Games\greyharbor\phase2.4-transcript.md'; for($i=0; $i -lt 25; $i++){ try { $text=Get-Content -LiteralPath $src -Raw -Encoding utf8; Add-Content -LiteralPath $dst -Value $text -Encoding utf8 -ErrorAction Stop; Write-Output "APPENDED_ON_ATTEMPT_$i"; break } catch { Start-Sleep -Milliseconds 200 } }
(no output)
> build · hy4-flash-free
✗ Edit phase2.4-transcript.md failed
Error: Unable to edit D:\Games\greyharbor\phase2.4-transcript.md
> build · hy4-flash-free
$ Get-Content -LiteralPath 'D:\Games\greyharbor\phase2.4-transcript.md' -Tail 12
?? Read phase2.4-transcript.md [offset=452, limit=20]
> build ?? hy4-flash-free
> build �� hy4-flash-free
? Edit phase2.4-transcript.md failed
Error: Found 2 matches for oldString, but expected exactly one. Add more surrounding context to make oldString unique, or set replaceAll to true to replace every occurrence.
> build �� hy4-flash-free
$ $src='C:\Users\31709\AppData\Local\Temp\opencode\phase24-appendix.md'; $dst='D:\Games\greyharbor\phase2.4-transcript.md'; for($i=0; $i -lt 25; $i++){ try { $text=Get-Content -LiteralPath $src -Raw -Encoding utf8; Add-Content -LiteralPath $dst -Value $text -Encoding utf8 -ErrorAction Stop; Write-Output "APPENDED_ON_ATTEMPT_$i"; break } catch { Start-Sleep -Milliseconds 200 } }
(no output)
> build �� hy4-flash-free
? Edit phase2.4-transcript.md failed
Error: Unable to edit D:\Games\greyharbor\phase2.4-transcript.md
> build �� hy4-flash-free
> build · hy4-flash-free
✱ Grep "if \(cards\.length|CARDS\[cardId\]|card\.type === 'leader'|card\.faction !== faction" in src/engine/v2/cards.js · 0 matches
$ Get-ChildItem -LiteralPath 'D:\Games\greyharbor' -File | Select-Object -ExpandProperty Name
.gitignore
.nojekyll
������Ϸ.bat
card-table-v1.csv
index.html
LICENSE
migration-plan.md
package.json
phase1-transcript.md
phase2.1-transcript.md
phase2.2a-transcript.md
phase2.2b-final-transcript.md
phase2.2b-final2-transcript.md
phase2.2b-final3-transcript.md
phase2.2b-resume-transcript.md
phase2.2b-transcript.md
phase2.3-transcript.md
phase2.4-transcript.md
README.md
server.mjs
> build · hy4-flash-free
$ Get-Content -LiteralPath 'D:\Games\greyharbor\phase2.3-transcript.md' -Tail 60
# AI vs AI stability: {"ok":true,"mode":"ai-vs-ai","games":1000,"elapsedMs":2126,"aiSeats":[0,1],"wins":{"ai":158,"p0":158,"p1":842,"draw":0},"aiWinRate":0.158,"reasons":{"nightWins":861,"sanity":139},"endingNight":{"1":2,"2":892,"3":106},"sanityEndingRatio":0.139,"totalActions":27405,"avgActionsPerGame":27.41,"maxActionsPerGame":37,"conservation":"ok"}
# Subtest: AI vs AI 1000 ���ȶ����غ㲢���ͳ��
ok 6 - AI vs AI 1000 ���ȶ����غ㲢���ͳ��
  ---
  duration_ms: 2127.476
  type: 'test'
  ...
# AI vs random strength: {"ok":true,"mode":"ai-vs-random","games":400,"elapsedMs":938,"aiSeats":[0,1],"wins":{"ai":283,"p0":111,"p1":289,"draw":0},"aiWinRate":0.7075,"reasons":{"nightWins":303,"sanity":97},"endingNight":{"1":18,"2":336,"3":46},"sanityEndingRatio":0.2425,"totalActions":10554,"avgActionsPerGame":26.39,"maxActionsPerGame":39,"conservation":"ok"}
# Subtest: AI vs random 400 ��ʤ�� > 65%
ok 7 - AI vs random 400 ��ʤ�� > 65%
  ---
  duration_ms: 940.1621
  type: 'test'
  ...
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2381.0918
> build �� hy4-flash-free
## �׶� 2.3 ���

### �ļ��嵥����Ϊ������δ�޸��κμ����ļ���

**AI ģ��**
- `src/ai/v2/config.mjs` �� ȫ������ʽȨ��/��ֵ/���Ź�����ֵ���������ò�����ע��
- `src/ai/v2/evaluate.mjs` �� view-only 1-ply ������ҹ��ͶӰ������ѹ����Pass ʱ����������Դ�����ص�/�ؼ���������������Ϣ��ֵ
- `src/ai/v2/ai.mjs` �� ���� `chooseAction(view, options)`������ `view.actions` ԭ����������ȣ���֧�� `seed`/`rngState`

**����**
- `tests/ai-v2/anti-cheat.test.mjs` �� Դ�� import ��������� + ������Ϣ�޹���
- `tests/ai-v2/legality.test.mjs` �� 200 �ֶ����Ϸ��� / `apply ok`
- `tests/ai-v2/strength.test.mjs` �� 400 �� AI vs random
- `tests/ai-v2/stability.test.mjs` �� 1000 �� AI vs AI
- `tests/ai-v2/determinism.test.mjs` �� ȷ�����벢�� RNG

**�ű���ת¼**
- `scripts/ai-match.mjs` �� ����ģʽ + `--games`��JSON �����Ĭ��������λ�ֻ�
- `phase2.3-transcript.md` �� ��������ժҪ��Ȩ���嵥����������ơ�ʵ�����ݡ��������ʣ�

### ����ͨ������
- ���� `tests/ai-v2/`��**7 / 7 ͨ��**
- ���лع飨�� AI / ���� / ���� / v2����**154 / 154 ͨ��**
- �ϼ� **161 ��ͨ����0 ʧ��**

### AI �����ʤ��
- **70.75%��283 / 400 �֣�**��������λ�ֻ����������� 65% ��ֵ
- CLI ���� 400 �֣�71.25%������ԭ�� `nightWins 303 / sanity 96 / tiebreak 1`

### AI vs AI 1000 ��ͳ��ժҪ
- 0 ������0 �������������غ�
- ʤ�֣�`P0 158 / P1 842 / ƽ�� 0`
- ����ԭ��`nightWins 861 / sanity 139`��ƽҹ��ƽ�ָ������Ӧ�
- ����ҹ��`��1ҹ 2 / ��2ҹ 892 / ��3ҹ 106`
- ���ǽ���ռ�ȣ�`0.139`
- �ܶ��� 27405��ƽ�� 27.41 ��/�֣���� 37 ��
> build · hy4-flash-free
$ Remove-Item -LiteralPath 'C:\Users\31709\AppData\Local\Temp\opencode\phase24-appendix.md' -ErrorAction SilentlyContinue; Get-Item -LiteralPath 'D:\Games\greyharbor\src\engine\v2\deck-validation.js','D:\Games\greyharbor\src\engine\v2\cards.js','D:\Games\greyharbor\tests\v2\deck-validation.test.mjs','D:\Games\greyharbor\phase2.4-transcript.md' | Select-Object Name,Length
Name                     Length
----                     ------
deck-validation.js         8636
cards.js                   5083
deck-validation.test.mjs  14130
phase2.4-transcript.md    32542
> build · hy4-flash-free
## 阶段 2.4 完成

**文件清单**
- 新增 `src/engine/v2/deck-validation.js`（纯函数校验器，含规则注释块与语义化常量）
- 新增 `tests/v2/deck-validation.test.mjs`（25 项测试）
- 新增 `phase2.4-transcript.md`（会话完整转录，见文末附录说明）
- 重构 `src/engine/v2/cards.js`（删除内联校验，改调 `validateDeck`；`CARDS / CARD_LIST / PRESET_DECKS / DEFAULT_DECK_ORDER / makeCardIndex` 与两套预设的冻结组装结果不变）

未触碰旧引擎、UI、AI、其他测试、scripts 或数据文件。

**测试通过总数**：全量 `node --test "tests/v2/*.test.mjs" "tests/ai-v2/*.test.mjs"` → **82 / 82**（原 57 + 新增 25，0 失败）；新增测试单独 25 / 25。

**回归复跑结果**
- `node scripts/selfplay.mjs`：`ok:true`，1000 局，`conservation:"ok"`，理智结束 386 / 夜胜 614。
- `node scripts/ai-match.mjs`：`ok:true`，ai-vs-random 200 局，`aiWinRate:0.735`，`conservation:"ok"`。

---

## 附录（将被自动追加到 `phase2.4-transcript.md` 末尾）

> 说明：`phase2.4-transcript.md` 是会话自动转录文件，写入进程持有独占句柄，`write`/`edit`/`Add-Content` 均被系统拒绝，因此本附录通过最终回复写入；该回复会被转录器自动追加到文件末尾，形成“完整转录 + 结构附录”。

### A. 错误码清单

导出：`DECK_ERROR_CODES`（冻结，键值同名）、别名 `ERROR_CODES`、`DECK_ERROR_CODE_LIST`、`DECK_RULES`。返回 `{ ok, errors:[{code,message,cardId?}], summary:{faction,leader,total,leaderCount,nonLeaderCount,distinctNonLeaders,copies} }`。坏数据全部走 errors；仅 `cardIndex` 类型不对抛 `TypeError`。

| # | code | 触发条件 | 附带字段 |
|---|---|---|---|
| 1 | `MALFORMED_INPUT` | input 非对象；缺 faction；entries/cards 非数组；条目形状错；份数 0/负/非整数；cards 元素非字符串 | 份数类带 `cardId` |
| 2 | `UNKNOWN_CARD` | 条目 id 不在 cardIndex（按 id 去重） | `cardId` |
| 3 | `FACTION_MISMATCH` | 非领袖卡既非本阵营也非 neutral | `cardId` |
| 4 | `LEADER_INVALID` | 领袖缺失/未知/非 leader/阵营不符（每副最多一条） | 有 id 时带 `cardId` |
| 5 | `LEADER_IN_ENTRIES` | leader 卡混入非领袖区（按 id 去重） | `cardId` |
| 6 | `NON_LEADER_COUNT` | 非领袖合计 ≠ 19 | — |
| 7 | `COPY_LIMIT` | 任一非领袖 id 份数 > 2 | `cardId` |
| 8 | `TOTAL_COUNT` | 含领袖总数 ≠ 20 | — |

两种输入形式：`{faction,leader,entries:[[id,count],...]}` 与 `{faction,leader,cards:[id,...]}`，同时出现时 entries 优先。

### B. 测试覆盖矩阵（25 项）

| # | 覆盖点 | 对应码/需求 |
|---|---|---|
| 1 | 常量/冻结/顺序/DECK_RULES | A 语义常量 |
| 2 | society 预设 ok + 20/19/1 + 16 类份数 | C §10.1 |
| 3 | cult 预设 ok + 20/19/1 + 17 类份数 | C §10.2 |
| 4 | null 不抛异常 | C null |
| 5 | 条目形状错误 | MALFORMED_INPUT |
| 6 | 未知 id + cardId | UNKNOWN_CARD |
| 7 | 阵营错误 zealot | FACTION_MISMATCH |
| 8 | 缺失/null/非领袖/错阵营四例 | LEADER_INVALID |
| 9 | 领袖混入 | LEADER_IN_ENTRIES |
| 10 | 18 张非领袖 | NON_LEADER_COUNT |
| 11 | 3 份 nora-wells | COPY_LIMIT |
| 12 | 21 张总牌 | TOTAL_COUNT |
| 13 | 7 类错误一次全报 | C 多错并存 |
| 14 | 合法两形式 deepEqual | C 两形式一致 |
| 15 | 非法两形式一致 | C 两形式一致 |
| 16 | 输入不被修改/预设仍冻结 | C 纯函数 |
| 17 | 两形式并存 entries 优先 | A 兼容 |
| 18 | 注入自定义 cardIndex | A 可复用 |
| 19 | 空 entries | C 空数组 |
| 20 | 空 cards | C 空数组 |
| 21 | 重复领袖 ×3 | LEADER_IN_ENTRIES + COPY_LIMIT |
| 22 | 未知 id 边界 | UNKNOWN_CARD |
| 23 | 份数 0 / -1 | MALFORMED_INPUT |
| 24 | cards 非字符串元素 | MALFORMED_INPUT |
| 25 | cardIndex 类型错抛 TypeError | A 程序员错误 |

码→用例：MALFORMED_INPUT #4/#5/#23/#24；UNKNOWN_CARD #6/#13/#22；FACTION_MISMATCH #7/#13/#18；LEADER_INVALID #8/#13/#18；LEADER_IN_ENTRIES #9/#13/#21；NON_LEADER_COUNT #10/#12/#13/#19/#20；COPY_LIMIT #11/#13/#21；TOTAL_COUNT #12/#13/#19。

### C. 疑问（只记录，不自创规则）

1. 规则未规定 `entries` 与 `cards` 同时出现的优先级，本实现取 entries 优先，是否改为报错待确认。
2. §2.2 明确 `copies` 为收藏字段、预设不套用；本次完全忽略，未来 UI 如需校验收藏上限需另行定义。
3. 份数 0/负数/非整数、非字符串 id 无对应规则条款，本实现归为 `MALFORMED_INPUT`，是否需独立错误码待确认。
4. 领袖阵营不符归 `LEADER_INVALID`（需求释义含“阵营不符”），若 UI 要统一 faction 提示需产品裁定。
5. 硬约束禁改其他文件，故 `src/engine/deck.js`（v1）与 `src/data/decks.js` 的同名校验仍存在，是否统一需另行安排。
6. `buildPreset` 保留历史文案风格，新增码的分支文案为同风格补充，是否逐字沿用旧文案待确认。
7. `summary` 字段名由本阶段定义，规则文档未规定 UI 消费格式，改名应作为 API 变更处理。
