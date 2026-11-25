
> build · deepseek-v4.1-flash-free
I'll start by reading the existing code and rules to understand the patterns I must follow.
→ Read src/engine/v2/effects/registry.js 
$ find src/engine/v2 -type f | head -50 && echo "---" && ls tests/v2 && echo "---" && ls scripts
head: The term 'head' is not recognized as a name of a cmdlet, function, script file, or executable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
> build · deepseek-v4.1-flash-free
$ Get-ChildItem -Recurse src\engine\v2 | Select-Object FullName, Length | Format-Table -AutoSize
FullName                                                 Length
--------                                                 ------
D:\Games\greyharbor\src\engine\v2\effects                
D:\Games\greyharbor\src\engine\v2\cards.js               4311
D:\Games\greyharbor\src\engine\v2\engine.js              65333
D:\Games\greyharbor\src\engine\v2\index.js               708
D:\Games\greyharbor\src\engine\v2\scoring.js             8304
D:\Games\greyharbor\src\engine\v2\view.js                5390
D:\Games\greyharbor\src\engine\v2\effects\dsl.js         2733
D:\Games\greyharbor\src\engine\v2\effects\index.js       121
D:\Games\greyharbor\src\engine\v2\effects\interpreter.js 11564
D:\Games\greyharbor\src\engine\v2\effects\registry.js    7451
D:\Games\greyharbor\src\engine\v2\effects\targets.js     11328
$ Get-ChildItem -Recurse tests | Select-Object FullName, Length | Format-Table -AutoSize
FullName                                            Length
--------                                            ------
D:\Games\greyharbor\tests\v2                        
D:\Games\greyharbor\tests\ai.test.mjs               33957
D:\Games\greyharbor\tests\card-data.test.mjs        34676
D:\Games\greyharbor\tests\data-audit.test.mjs       24801
D:\Games\greyharbor\tests\e2e.test.mjs              2027
D:\Games\greyharbor\tests\engine.test.mjs           32560
D:\Games\greyharbor\tests\fixtures.mjs              7376
D:\Games\greyharbor\tests\v2\effects-pilot.test.mjs 29419
D:\Games\greyharbor\tests\v2\engine-core.test.mjs   19980
> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/effects/dsl.js 
→ Read src/engine/v2/effects/targets.js 
→ Read src/engine/v2/effects/interpreter.js 
> build · deepseek-v4.1-flash-free
→ Read docs/GREYHARBOR_RULES_V1.md 
→ Read src/engine/v2/scoring.js 
→ Read src/engine/v2/cards.js 
> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/engine.js [limit=700]
> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/engine.js [offset=701, limit=750]
> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/engine.js [offset=1451]
> build · deepseek-v4.1-flash-free
→ Read scripts/selfplay.mjs 
→ Read src/engine/v2/view.js 
→ Read src/engine/v2/index.js 
> build · deepseek-v4.1-flash-free
→ Read tests/v2/effects-pilot.test.mjs 
$ Get-ChildItem -File | Select-Object Name; Get-ChildItem docs | Select-Object Name
Name
----
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
phase2.2b-transcript.md
README.md
server.mjs
ARCHITECTURE.md
ART_DIRECTION.md
GAME_RULES.md
GREYHARBOR_RULES_V1.md
QA_RULES_AUDIT.md
> build · deepseek-v4.1-flash-free
→ Read phase2.2b-transcript.md 
$ Select-String -Path phase2.2a-transcript.md -Pattern "self-play|games|wins|reasons|endingNight|sanityEnding" -Context 2,6
  phase2.2a-transcript.md:145:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:146:$ Select-String -Path docs/GREYHARBOR_RULES_V1.md -Pattern "ʧȥ1|ʧȥ 1|ҹ�ֽ���|���|��
��|ҹ������" | Select-Object LineNumber, Line
  phase2.2a-transcript.md:147:LineNumber Line
  phase2.2a-transcript.md:148:---------- ----
  phase2.2a-transcript.md:149:        47 - ????????��???????????/????��?? **??????????**????????????
  phase2.2a-transcript.md:150:        90 - ?????????????????????????????????
  phase2.2a-transcript.md:269:�� Read src/engine/rng.js 
  phase2.2a-transcript.md:270:$ ls; echo "---"; ls src; echo "---"; ls src/engine; echo "---"; ls tests 2>$null; echo "
---"; cat package.json
> phase2.2a-transcript.md:271:Directory: D:\Games\greyharbor
  phase2.2a-transcript.md:272:
  phase2.2a-transcript.md:273:Mode                 LastWriteTime         Length Name
  phase2.2a-transcript.md:274:----                 -------------         ------ ----
  phase2.2a-transcript.md:275:d----          2026/11/24    21:44                demo
  phase2.2a-transcript.md:276:d----          2026/11/24    22:20                docs
  phase2.2a-transcript.md:277:d----          2026/11/24    21:44                research
  phase2.2a-transcript.md:294:---
  phase2.2a-transcript.md:295:
> phase2.2a-transcript.md:296:    Directory: D:\Games\greyharbor\src
  phase2.2a-transcript.md:297:
  phase2.2a-transcript.md:298:Mode                 LastWriteTime         Length Name
  phase2.2a-transcript.md:299:----                 -------------         ------ ----
  phase2.2a-transcript.md:300:d----          2026/11/24    22:16                data
  phase2.2a-transcript.md:301:d----          2026/11/24    21:44                engine
  phase2.2a-transcript.md:302:d----          2026/11/24    21:44                styles
  phase2.2a-transcript.md:306:---
  phase2.2a-transcript.md:307:
> phase2.2a-transcript.md:308:    Directory: D:\Games\greyharbor\src\engine
  phase2.2a-transcript.md:309:
  phase2.2a-transcript.md:310:Mode                 LastWriteTime         Length Name
  phase2.2a-transcript.md:311:----                 -------------         ------ ----
  phase2.2a-transcript.md:312:-a---          2026/10/17     8:32          72995 ai.js
  phase2.2a-transcript.md:313:-a---          2026/10/17     8:32           3468 deck.js
  phase2.2a-transcript.md:314:-a---          2026/10/17     8:32          65385 engine.js
  phase2.2a-transcript.md:317:---
  phase2.2a-transcript.md:318:
> phase2.2a-transcript.md:319:    Directory: D:\Games\greyharbor\tests
  phase2.2a-transcript.md:320:
  phase2.2a-transcript.md:321:Mode                 LastWriteTime         Length Name
  phase2.2a-transcript.md:322:----                 -------------         ------ ----
  phase2.2a-transcript.md:323:-a---          2026/10/17     8:32          33957 ai.test.mjs
  phase2.2a-transcript.md:324:-a---          2026/10/17     8:32          34676 card-data.test.mjs
  phase2.2a-transcript.md:325:-a---          2026/10/17     8:32          24801 data-audit.test.mjs
  phase2.2a-transcript.md:347:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:348:$ ls docs; echo "---"; ls scripts; echo "---"; ls src/data | Select-Object -First 20
> phase2.2a-transcript.md:349:Directory: D:\Games\greyharbor\docs
  phase2.2a-transcript.md:350:
  phase2.2a-transcript.md:351:Mode                 LastWriteTime         Length Name
  phase2.2a-transcript.md:352:----                 -------------         ------ ----
  phase2.2a-transcript.md:353:-a---          2026/10/17     8:32          17038 ARCHITECTURE.md
  phase2.2a-transcript.md:354:-a---          2026/10/17     8:32           9829 ART_DIRECTION.md
  phase2.2a-transcript.md:355:-a---
  phase2.2a-transcript.md:357:$ node --version; node --test tests/v2/engine-core.test.mjs 2>&1 | Select-Object -Last 15
  phase2.2a-transcript.md:358:v22.23.2
> phase2.2a-transcript.md:359:# Subtest: random legal self-play never crashes or deadlocks
> phase2.2a-transcript.md:360:ok 11 - random legal self-play never crashes or deadlocks
  phase2.2a-transcript.md:361:  ---
  phase2.2a-transcript.md:362:  duration_ms: 7.2625
  phase2.2a-transcript.md:363:  type: 'test'
  phase2.2a-transcript.md:364:  ...
  phase2.2a-transcript.md:365:1..11
  phase2.2a-transcript.md:366:# tests 11
  phase2.2a-transcript.md:552:  duration_ms: 1.2708
  phase2.2a-transcript.md:553:  type: 'test'
> phase2.2a-transcript.md:554:  location: 'D:\\Games\\greyharbor\\tests\\v2\\engine-core.test.mjs:454:1'
  phase2.2a-transcript.md:555:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:556:  error: 'expected legal play: dreamer -> dream#0 faceDown=false'
  phase2.2a-transcript.md:557:  code: 'ERR_ASSERTION'
  phase2.2a-transcript.md:558:  name: 'AssertionError'
  phase2.2a-transcript.md:559:  expected: true
  phase2.2a-transcript.md:560:  operator: '=='
  phase2.2a-transcript.md:561:  stack: |-
> phase2.2a-transcript.md:562:    playCard (file:///D:/Games/greyharbor/tests/v2/engine-core.test.mjs:58:10)
> phase2.2a-transcript.md:563:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/engine-core.test.mjs:48
6:3)
  phase2.2a-transcript.md:564:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:565:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:566:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:567:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:568:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:569:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:570:  ...
> phase2.2a-transcript.md:571:# Subtest: random legal self-play never crashes or deadlocks
> phase2.2a-transcript.md:572:ok 11 - random legal self-play never crashes or deadlocks
  phase2.2a-transcript.md:573:  ---
  phase2.2a-transcript.md:574:  duration_ms: 24.3639
  phase2.2a-transcript.md:575:  type: 'test'
  phase2.2a-transcript.md:576:  ...
  phase2.2a-transcript.md:577:1..11
  phase2.2a-transcript.md:578:# tests 11
  phase2.2a-transcript.md:693: });
  phase2.2a-transcript.md:694: 
> phase2.2a-transcript.md:695: // ���� self-play smoke (the 1000-game run lives in scripts/selfplay.mjs) ������
  phase2.2a-transcript.md:696: 
  phase2.2a-transcript.md:697:
  phase2.2a-transcript.md:698:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:699:$ node --test tests/v2/engine-core.test.mjs 2>&1 | Select-Object -Last 30
  phase2.2a-transcript.md:700:duration_ms: 0.4485
  phase2.2a-transcript.md:701:  type: 'test'
  phase2.2a-transcript.md:713:  type: 'test'
  phase2.2a-transcript.md:714:  ...
> phase2.2a-transcript.md:715:# Subtest: random legal self-play never crashes or deadlocks
> phase2.2a-transcript.md:716:ok 11 - random legal self-play never crashes or deadlocks
  phase2.2a-transcript.md:717:  ---
  phase2.2a-transcript.md:718:  duration_ms: 27.1263
  phase2.2a-transcript.md:719:  type: 'test'
  phase2.2a-transcript.md:720:  ...
  phase2.2a-transcript.md:721:1..11
  phase2.2a-transcript.md:722:# tests 11
  phase2.2a-transcript.md:729:# duration_ms 236.1211
  phase2.2a-transcript.md:730:> build �� deepseek-v4.1-flash-free
> phase2.2a-transcript.md:731:$ node scripts/selfplay.mjs --games=50 2>&1 | Select-Object -Last 40
> phase2.2a-transcript.md:732:Greyharbor v2.1 self-play
  phase2.2a-transcript.md:733:{
  phase2.2a-transcript.md:734:  "ok": true,
> phase2.2a-transcript.md:735:  "games": 50,
  phase2.2a-transcript.md:736:  "elapsedMs": 59,
  phase2.2a-transcript.md:737:  "avgMsPerGame": 1.18,
  phase2.2a-transcript.md:738:  "maxGameMs": 10,
> phase2.2a-transcript.md:739:  "wins": {
  phase2.2a-transcript.md:740:    "p0": 14,
  phase2.2a-transcript.md:741:    "p1": 36,
  phase2.2a-transcript.md:742:    "draw": 0
  phase2.2a-transcript.md:743:  },
> phase2.2a-transcript.md:744:  "reasons": {
> phase2.2a-transcript.md:745:    "nightWins": 37,
  phase2.2a-transcript.md:746:    "sanity": 12,
  phase2.2a-transcript.md:747:    "tiebreak": 1
  phase2.2a-transcript.md:748:  },
> phase2.2a-transcript.md:749:  "endingNight": {
  phase2.2a-transcript.md:750:    "1": 2,
  phase2.2a-transcript.md:751:    "2": 42,
  phase2.2a-transcript.md:752:    "3": 6
  phase2.2a-transcript.md:753:  },
  phase2.2a-transcript.md:754:  "totalActions": 1295,
  phase2.2a-transcript.md:755:  "avgActionsPerGame": 25.9,
  phase2.2a-transcript.md:861:  'pass:Pass'
  phase2.2a-transcript.md:862:]
> phase2.2a-transcript.md:863:file:///D:/Games/greyharbor/[eval1]:17
  phase2.2a-transcript.md:864:const pa=g.getActions().find(a=>a.type==='playCard'&&a.uid===pike.uid);
  phase2.2a-transcript.md:865:                                                                  ^
  phase2.2a-transcript.md:866:
  phase2.2a-transcript.md:867:TypeError: Cannot read properties of undefined (reading 'uid')
> phase2.2a-transcript.md:868:    at file:///D:/Games/greyharbor/[eval1]:17:67
  phase2.2a-transcript.md:869:    at Array.find (<anonymous>)
> phase2.2a-transcript.md:870:    at file:///D:/Games/greyharbor/[eval1]:17:25
  phase2.2a-transcript.md:871:    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
  phase2.2a-transcript.md:872:    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:282:26)
  phase2.2a-transcript.md:873:    at async ModuleLoader.executeModuleJob (node:internal/modules/esm/loader:278:20)
  phase2.2a-transcript.md:874:    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)
  phase2.2a-transcript.md:875:
  phase2.2a-transcript.md:876:Node.js v22.23.2
  phase2.2a-transcript.md:965:fd counts 5
  phase2.2a-transcript.md:966:sealed 2
> phase2.2a-transcript.md:967:file:///D:/Games/greyharbor/[eval1]:16
  phase2.2a-transcript.md:968:console.log('score',scorePlayer(g.state,0));
  phase2.2a-transcript.md:969:        ^
  phase2.2a-transcript.md:970:
  phase2.2a-transcript.md:971:ReferenceError: scorePlayer is not defined
> phase2.2a-transcript.md:972:    at file:///D:/Games/greyharbor/[eval1]:16:9
  phase2.2a-transcript.md:973:    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
  phase2.2a-transcript.md:974:    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:282:26)
  phase2.2a-transcript.md:975:    at async ModuleLoader.executeModuleJob (node:internal/modules/esm/loader:278:20)
  phase2.2a-transcript.md:976:    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)
  phase2.2a-transcript.md:977:
  phase2.2a-transcript.md:978:Node.js v22.23.2
  phase2.2a-transcript.md:1263:  reason: 'sanity',
  phase2.2a-transcript.md:1264:  night: 1,
> phase2.2a-transcript.md:1265:  nightWins: [ 0, 0 ],
  phase2.2a-transcript.md:1266:  sanity: [ 0, 3 ]
  phase2.2a-transcript.md:1267:}
  phase2.2a-transcript.md:1268:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:1269:$ node --input-type=module -e "
  phase2.2a-transcript.md:1270:import { createGame } from './src/engine/v2/index.js';
  phase2.2a-transcript.md:1271:const g=createGame({seed:14,decks:[{leader:'elias-thorne',cards:['sea-priestess','abjura
tion']},{leader:'harold-ashby',cards:['finn-calloway','edith-barrow','walter-morse']}],startingHand:3});
  phase2.2a-transcript.md:1343:night 2 env 0 discard [ 'stormy-night' ] count 2
  phase2.2a-transcript.md:1344:> build �� deepseek-v4.1-flash-free
> phase2.2a-transcript.md:1345:$ node scripts/selfplay.mjs --games=1000 2>&1 | Select-Object -Last 40
> phase2.2a-transcript.md:1346:Greyharbor v2.1 self-play
  phase2.2a-transcript.md:1347:{
  phase2.2a-transcript.md:1348:  "ok": true,
> phase2.2a-transcript.md:1349:  "games": 1000,
  phase2.2a-transcript.md:1350:  "elapsedMs": 345,
  phase2.2a-transcript.md:1351:  "avgMsPerGame": 0.345,
  phase2.2a-transcript.md:1352:  "maxGameMs": 8,
> phase2.2a-transcript.md:1353:  "wins": {
  phase2.2a-transcript.md:1354:    "p0": 247,
  phase2.2a-transcript.md:1355:    "p1": 753,
  phase2.2a-transcript.md:1356:    "draw": 0
  phase2.2a-transcript.md:1357:  },
> phase2.2a-transcript.md:1358:  "reasons": {
> phase2.2a-transcript.md:1359:    "nightWins": 780,
  phase2.2a-transcript.md:1360:    "sanity": 218,
  phase2.2a-transcript.md:1361:    "tiebreak": 2
  phase2.2a-transcript.md:1362:  },
> phase2.2a-transcript.md:1363:  "endingNight": {
  phase2.2a-transcript.md:1364:    "1": 42,
  phase2.2a-transcript.md:1365:    "2": 827,
  phase2.2a-transcript.md:1366:    "3": 131
  phase2.2a-transcript.md:1367:  },
  phase2.2a-transcript.md:1368:  "totalActions": 25737,
  phase2.2a-transcript.md:1369:  "avgActionsPerGame": 25.74,
  phase2.2a-transcript.md:1411:  duration_ms: 1.305
  phase2.2a-transcript.md:1412:  type: 'test'
> phase2.2a-transcript.md:1413:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:430:1'
  phase2.2a-transcript.md:1414:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:1415:  error: |-
  phase2.2a-transcript.md:1416:    Expected values to be strictly equal:
  phase2.2a-transcript.md:1417:    
  phase2.2a-transcript.md:1418:    true !== false
  phase2.2a-transcript.md:1419:    
  phase2.2a-transcript.md:1424:  operator: 'strictEqual'
  phase2.2a-transcript.md:1425:  stack: |-
> phase2.2a-transcript.md:1426:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:519:10)
  phase2.2a-transcript.md:1427:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:1428:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:1429:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:1430:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:1431:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:1432:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:1443:  duration_ms: 0.5972
  phase2.2a-transcript.md:1444:  type: 'test'
> phase2.2a-transcript.md:1445:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:549:1'
  phase2.2a-transcript.md:1446:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:1447:  error: |-
  phase2.2a-transcript.md:1448:    Expected values to be strictly equal:
  phase2.2a-transcript.md:1449:    
  phase2.2a-transcript.md:1450:    false !== true
  phase2.2a-transcript.md:1451:    
  phase2.2a-transcript.md:1456:  operator: 'strictEqual'
  phase2.2a-transcript.md:1457:  stack: |-
> phase2.2a-transcript.md:1458:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:575:10)
  phase2.2a-transcript.md:1459:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:1460:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:1461:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:1462:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:1463:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:1464:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:1475:  duration_ms: 0.9576
  phase2.2a-transcript.md:1476:  type: 'test'
> phase2.2a-transcript.md:1477:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:667:1'
  phase2.2a-transcript.md:1478:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:1479:  error: |-
  phase2.2a-transcript.md:1480:    Expected values to be strictly deep-equal:
  phase2.2a-transcript.md:1481:    + actual - expected
  phase2.2a-transcript.md:1482:    
  phase2.2a-transcript.md:1483:      [
  phase2.2a-transcript.md:1497:  operator: 'deepStrictEqual'
  phase2.2a-transcript.md:1498:  stack: |-
> phase2.2a-transcript.md:1499:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:676:10)
  phase2.2a-transcript.md:1500:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:1501:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:1502:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:1503:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:1504:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:1505:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:1548:  duration_ms: 5.6344
  phase2.2a-transcript.md:1549:  type: 'test'
> phase2.2a-transcript.md:1550:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:132:1'
  phase2.2a-transcript.md:1551:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:1552:  error: |-
  phase2.2a-transcript.md:1553:    not this player's turn
  phase2.2a-transcript.md:1554:    
  phase2.2a-transcript.md:1555:    false !== true
  phase2.2a-transcript.md:1556:    
  phase2.2a-transcript.md:1561:  operator: 'strictEqual'
  phase2.2a-transcript.md:1562:  stack: |-
> phase2.2a-transcript.md:1563:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:168:10)
  phase2.2a-transcript.md:1564:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:1565:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:1566:    Test.start (node:internal/test_runner/test:944:17)
  phase2.2a-transcript.md:1567:    startSubtestAfterBootstrap (node:internal/test_runner/harness:296:17)
  phase2.2a-transcript.md:1568:  ...
  phase2.2a-transcript.md:1569:# Subtest: samuel-pike: seals a legal unit, seals refresh, and expiry happens at next ni
ght start
  phase2.2a-transcript.md:1578:  duration_ms: 1.7408
  phase2.2a-transcript.md:1579:  type: 'test'
> phase2.2a-transcript.md:1580:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:251:1'
  phase2.2a-transcript.md:1581:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:1582:  error: 'expected a legal play for samuel-pike'
  phase2.2a-transcript.md:1583:  code: 'ERR_ASSERTION'
  phase2.2a-transcript.md:1584:  name: 'AssertionError'
  phase2.2a-transcript.md:1585:  expected: true
  phase2.2a-transcript.md:1586:  operator: '=='
  phase2.2a-transcript.md:1587:  stack: |-
> phase2.2a-transcript.md:1588:    play (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs:59:10)
> phase2.2a-transcript.md:1589:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:282:16)
  phase2.2a-transcript.md:1590:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:1591:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:1592:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:1593:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:1594:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:1595:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:1606:  duration_ms: 1.7459
  phase2.2a-transcript.md:1607:  type: 'test'
> phase2.2a-transcript.md:1608:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:309:1'
  phase2.2a-transcript.md:1609:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:1610:  error: |-
  phase2.2a-transcript.md:1611:    Expected values to be strictly equal:
  phase2.2a-transcript.md:1612:    
  phase2.2a-transcript.md:1613:    2 !== 4
  phase2.2a-transcript.md:1614:    
  phase2.2a-transcript.md:1619:  operator: 'strictEqual'
  phase2.2a-transcript.md:1620:  stack: |-
> phase2.2a-transcript.md:1621:    conservation (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs:127:34)
> phase2.2a-transcript.md:1622:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:352:3)
  phase2.2a-transcript.md:1623:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:1624:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:1625:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:1626:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:1627:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:1628:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:1645:  duration_ms: 1.2077
  phase2.2a-transcript.md:1646:  type: 'test'
> phase2.2a-transcript.md:1647:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:430:1'
  phase2.2a-transcript.md:1648:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:1649:  error: |-
  phase2.2a-transcript.md:1650:    Expected values to be strictly equal:
  phase2.2a-transcript.md:1651:    
  phase2.2a-transcript.md:1652:    true !== false
  phase2.2a-transcript.md:1653:    
  phase2.2a-transcript.md:1658:  operator: 'strictEqual'
  phase2.2a-transcript.md:1659:  stack: |-
> phase2.2a-transcript.md:1660:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:519:10)
  phase2.2a-transcript.md:1661:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:1662:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:1663:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:1664:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:1665:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:1666:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:2753:  duration_ms: 1.8476
  phase2.2a-transcript.md:2754:  type: 'test'
> phase2.2a-transcript.md:2755:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:250:1'
  phase2.2a-transcript.md:2756:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:2757:  error: |-
  phase2.2a-transcript.md:2758:    Expected values to be strictly equal:
  phase2.2a-transcript.md:2759:    
  phase2.2a-transcript.md:2760:    1 !== 0
  phase2.2a-transcript.md:2761:    
  phase2.2a-transcript.md:2766:  operator: 'strictEqual'
  phase2.2a-transcript.md:2767:  stack: |-
> phase2.2a-transcript.md:2768:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:283:10)
  phase2.2a-transcript.md:2769:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:2770:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:2771:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:2772:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:2773:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:2774:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:2803:  duration_ms: 0.9628
  phase2.2a-transcript.md:2804:  type: 'test'
> phase2.2a-transcript.md:2805:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:429:1'
  phase2.2a-transcript.md:2806:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:2807:  error: |-
  phase2.2a-transcript.md:2808:    Expected values to be strictly equal:
  phase2.2a-transcript.md:2809:    
  phase2.2a-transcript.md:2810:    true !== false
  phase2.2a-transcript.md:2811:    
  phase2.2a-transcript.md:2816:  operator: 'strictEqual'
  phase2.2a-transcript.md:2817:  stack: |-
> phase2.2a-transcript.md:2818:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:518:10)
  phase2.2a-transcript.md:2819:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:2820:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:2821:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:2822:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:2823:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:2824:    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:2835:  duration_ms: 1.0487
  phase2.2a-transcript.md:2836:  type: 'test'
> phase2.2a-transcript.md:2837:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:548:1'
  phase2.2a-transcript.md:2838:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:2839:  error: |-
  phase2.2a-transcript.md:2840:    Expected values to be strictly deep-equal:
  phase2.2a-transcript.md:2841:    + actual - expected
  phase2.2a-transcript.md:2842:    
  phase2.2a-transcript.md:2843:      [
  phase2.2a-transcript.md:3053:  duration_ms: 0.9681
  phase2.2a-transcript.md:3054:  type: 'test'
> phase2.2a-transcript.md:3055:  location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:674:1'
  phase2.2a-transcript.md:3056:  failureType: 'testCodeFailure'
  phase2.2a-transcript.md:3057:  error: |-
  phase2.2a-transcript.md:3058:    Expected values to be strictly deep-equal:
  phase2.2a-transcript.md:3059:    + actual - expected
  phase2.2a-transcript.md:3060:    
  phase2.2a-transcript.md:3061:      [
  phase2.2a-transcript.md:3075:  operator: 'deepStrictEqual'
  phase2.2a-transcript.md:3076:  stack: |-
> phase2.2a-transcript.md:3077:    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.mjs
:683:10)
  phase2.2a-transcript.md:3078:    Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:3079:    Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:3080:    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:3081:    Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:3082:    Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:3083:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:3135:  type: 'test'
  phase2.2a-transcript.md:3136:  ...
> phase2.2a-transcript.md:3137:# Subtest: random legal self-play never crashes or deadlocks
> phase2.2a-transcript.md:3138:ok 23 - random legal self-play never crashes or deadlocks
  phase2.2a-transcript.md:3139:  ---
  phase2.2a-transcript.md:3140:  duration_ms: 20.0663
  phase2.2a-transcript.md:3141:  type: 'test'
  phase2.2a-transcript.md:3142:  ...
  phase2.2a-transcript.md:3143:1..23
  phase2.2a-transcript.md:3144:# tests 23
  phase2.2a-transcript.md:3160:@@ -1,10 +1,11 @@
  phase2.2a-transcript.md:3161: /**
> phase2.2a-transcript.md:3162:- * Phase 2.1 self-play soak test.
> phase2.2a-transcript.md:3163:+ * Phase 2.2 self-play soak test.
  phase2.2a-transcript.md:3164:  *
> phase2.2a-transcript.md:3165:- * Plays N complete games (default 1000) using only actions returned by
  phase2.2a-transcript.md:3166:- * engine.getActions(), i.e. random legal actions.  Fails loudly on an
  phase2.2a-transcript.md:3167:- * illegal action, deadlock, card-conservation violation, or timeout.
> phase2.2a-transcript.md:3168:+ * Plays N complete games (default 1000) with the two frozen 20-card preset
  phase2.2a-transcript.md:3169:+ * decks, using only actions returned by engine.getActions(), i.e. random legal
  phase2.2a-transcript.md:3170:+ * actions.  Fails loudly on an illegal action, deadlock, card-conservation
  phase2.2a-transcript.md:3171:+ * violation, or timeout.
  phase2.2a-transcript.md:3172:  *
  phase2.2a-transcript.md:3173:  *   node scripts/selfplay.mjs
> phase2.2a-transcript.md:3174:  *   node scripts/selfplay.mjs --games=2000
  phase2.2a-transcript.md:3175:  */
  phase2.2a-transcript.md:3176:
  phase2.2a-transcript.md:3177:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:3178:�� Edit scripts/selfplay.mjs
  phase2.2a-transcript.md:3179:Index: scripts/selfplay.mjs
  phase2.2a-transcript.md:3180:===================================================================
  phase2.2a-transcript.md:3191: 
  phase2.2a-transcript.md:3192: const stats = {
> phase2.2a-transcript.md:3193:   games: 0,
  phase2.2a-transcript.md:3194:
  phase2.2a-transcript.md:3195:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:3196:�� Edit scripts/selfplay.mjs
  phase2.2a-transcript.md:3197:Index: scripts/selfplay.mjs
  phase2.2a-transcript.md:3198:===================================================================
  phase2.2a-transcript.md:3199:--- scripts/selfplay.mjs
  phase2.2a-transcript.md:3200:+++ scripts/selfplay.mjs
  phase2.2a-transcript.md:3201:@@ -103,9 +103,10 @@
> phase2.2a-transcript.md:3202:   endingNight: stats.nights,
  phase2.2a-transcript.md:3203:   totalActions: stats.totalActions,
> phase2.2a-transcript.md:3204:   avgActionsPerGame: Number((stats.totalActions / stats.games).toFixed(2)),
  phase2.2a-transcript.md:3205:   maxActionsPerGame: stats.maxActionsPerGame,
> phase2.2a-transcript.md:3206:+  sanityEndingRatio: Number(((stats.reasons.sanity ?? 0) / stats.games).toFixed(3)),
  phase2.2a-transcript.md:3207:   conservation: 'ok',
  phase2.2a-transcript.md:3208: };
  phase2.2a-transcript.md:3209: 
> phase2.2a-transcript.md:3210:-console.log('Greyharbor v2.1 self-play');
> phase2.2a-transcript.md:3211:+console.log('Greyharbor v2.2 self-play');
  phase2.2a-transcript.md:3212: console.log(JSON.stringify(summary, null, 2));
  phase2.2a-transcript.md:3213:
  phase2.2a-transcript.md:3214:> build �� deepseek-v4.1-flash-free
> phase2.2a-transcript.md:3215:$ node scripts/selfplay.mjs --games=1000 2>&1 | Select-Object -Last 45
> phase2.2a-transcript.md:3216:Greyharbor v2.2 self-play
  phase2.2a-transcript.md:3217:{
  phase2.2a-transcript.md:3218:  "ok": true,
> phase2.2a-transcript.md:3219:  "games": 1000,
  phase2.2a-transcript.md:3220:  "elapsedMs": 372,
  phase2.2a-transcript.md:3221:  "avgMsPerGame": 0.372,
  phase2.2a-transcript.md:3222:  "maxGameMs": 8,
> phase2.2a-transcript.md:3223:  "wins": {
  phase2.2a-transcript.md:3224:    "p0": 252,
  phase2.2a-transcript.md:3225:    "p1": 748,
  phase2.2a-transcript.md:3226:    "draw": 0
  phase2.2a-transcript.md:3227:  },
> phase2.2a-transcript.md:3228:  "reasons": {
> phase2.2a-transcript.md:3229:    "nightWins": 786,
  phase2.2a-transcript.md:3230:    "sanity": 213,
  phase2.2a-transcript.md:3231:    "tiebreak": 1
  phase2.2a-transcript.md:3232:  },
> phase2.2a-transcript.md:3233:  "endingNight": {
  phase2.2a-transcript.md:3234:    "1": 48,
  phase2.2a-transcript.md:3235:    "2": 818,
  phase2.2a-transcript.md:3236:    "3": 134
  phase2.2a-transcript.md:3237:  },
  phase2.2a-transcript.md:3238:  "totalActions": 26159,
  phase2.2a-transcript.md:3239:  "avgActionsPerGame": 26.16,
  phase2.2a-transcript.md:3240:  "maxActionsPerGame": 38,
> phase2.2a-transcript.md:3241:  "sanityEndingRatio": 0.213,
  phase2.2a-transcript.md:3242:  "conservation": "ok"
  phase2.2a-transcript.md:3243:}
  phase2.2a-transcript.md:3244:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:3245:�� Read src/engine/v2/scoring.js 
  phase2.2a-transcript.md:3246:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:3247:$ $c = Get-Content docs/GREYHARBOR_RULES_V1.md -Encoding UTF8; $c[468..492]
  phase2.2a-transcript.md:3807:scripts\selfplay.mjs:23:const pick = (items) => items[Math.floor(nextRandom(random) * it
ems.length)];
  phase2.2a-transcript.md:3808:scripts\selfplay.mjs:37:const startedAt = Date.now();
> phase2.2a-transcript.md:3809:scripts\selfplay.mjs:40:  const gameStartedAt = Date.now();
  phase2.2a-transcript.md:3810:scripts\selfplay.mjs:70:    if (Date.now() - startedAt > TIME_LIMIT_MS) {
> phase2.2a-transcript.md:3811:scripts\selfplay.mjs:87:  stats.maxGameMs = Math.max(stats.maxGameMs, Date.now() - gameS
tartedAt);
  phase2.2a-transcript.md:3812:scripts\selfplay.mjs:90:const elapsedMs = Date.now() - startedAt;
  phase2.2a-transcript.md:3813:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:3814:$ node --input-type=module -e "import { createGame } from './src/engine/v2/index.js'; co
nst run=(seed)=>{const g=createGame({seed}); for(const p of [0,1]) g.apply({type:'mulligan',player:p,uids:[]}); let n=0
; while(g.phase!=='gameOver'&&n++<200){const a=g.getActions(); g.apply(a[0]);} return JSON.stringify(g.result());}; con
sole.log(run('det')===run('det'), run('det'));"
> phase2.2a-transcript.md:3815:true {"winner":1,"reason":"nightWins","night":2,"nightWins":[0,2],"sanity":[5,4],"decide
dBy":"score"}
  phase2.2a-transcript.md:3816:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:3817:�� Read phase2.2a-transcript.md 
  phase2.2a-transcript.md:3818:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:3819:$ node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('src/data/card-tabl
e.normalized.json','utf8'));for(const c of d){if(['sea-priestess','samuel-pike','hooded-acolyte','edith-barrow','walter
-morse','nora-wells'].includes(c.id))console.log(c.id,c.effect)}"
  phase2.2a-transcript.md:3820:nora-wells �����볡����ʱ�鿴����һ������
  phase2.2a-transcript.md:3821:samuel-pike �볡�Ƴ�һ���з��������ӡһ��ս��4���µз���
  phase2.2a-transcript.md:3950:  type: 'test'
  phase2.2a-transcript.md:3951:  ...
> phase2.2a-transcript.md:3952:# Subtest: random legal self-play never crashes or deadlocks
> phase2.2a-transcript.md:3953:ok 23 - random legal self-play never crashes or deadlocks
  phase2.2a-transcript.md:3954:  ---
  phase2.2a-transcript.md:3955:  duration_ms: 26.7456
  phase2.2a-transcript.md:3956:  type: 'test'
  phase2.2a-transcript.md:3957:  ...
  phase2.2a-transcript.md:3958:1..23
  phase2.2a-transcript.md:3959:# tests 23
  phase2.2a-transcript.md:4013:  type: 'test'
  phase2.2a-transcript.md:4014:  ...
> phase2.2a-transcript.md:4015:# Subtest: random legal self-play never crashes or deadlocks
> phase2.2a-transcript.md:4016:ok 24 - random legal self-play never crashes or deadlocks
  phase2.2a-transcript.md:4017:  ---
  phase2.2a-transcript.md:4018:  duration_ms: 22.8884
  phase2.2a-transcript.md:4019:  type: 'test'
  phase2.2a-transcript.md:4020:  ...
  phase2.2a-transcript.md:4021:1..24
  phase2.2a-transcript.md:4022:# tests 24
  phase2.2a-transcript.md:4034:    duration_ms: 0.86
  phase2.2a-transcript.md:4035:    type: 'test'
> phase2.2a-transcript.md:4036:    location: 'D:\\Games\\greyharbor\\tests\\v2\\effects-pilot.test.mjs:290:1'
  phase2.2a-transcript.md:4037:    failureType: 'testCodeFailure'
  phase2.2a-transcript.md:4038:    error: |-
  phase2.2a-transcript.md:4039:      Expected values to be strictly equal:
  phase2.2a-transcript.md:4040:      
  phase2.2a-transcript.md:4041:      4 !== 3
  phase2.2a-transcript.md:4042:      
  phase2.2a-transcript.md:4047:    operator: 'strictEqual'
  phase2.2a-transcript.md:4048:    stack: |-
> phase2.2a-transcript.md:4049:      TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/v2/effects-pilot.test.m
js:298:10)
  phase2.2a-transcript.md:4050:      Test.runInAsyncScope (node:async_hooks:214:14)
  phase2.2a-transcript.md:4051:      Test.run (node:internal/test_runner/test:1047:25)
  phase2.2a-transcript.md:4052:      Test.processPendingSubtests (node:internal/test_runner/test:744:18)
  phase2.2a-transcript.md:4053:      Test.postRun (node:internal/test_runner/test:1173:19)
  phase2.2a-transcript.md:4054:      Test.run (node:internal/test_runner/test:1101:12)
  phase2.2a-transcript.md:4055:      async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  phase2.2a-transcript.md:4086:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4087:$ node --test tests/v2/engine-core.test.mjs tests/v2/effects-pilot.test.mjs 2>&1 | Selec
t-Object -Last 15
> phase2.2a-transcript.md:4088:# Subtest: random legal self-play never crashes or deadlocks
> phase2.2a-transcript.md:4089:ok 24 - random legal self-play never crashes or deadlocks
  phase2.2a-transcript.md:4090:  ---
  phase2.2a-transcript.md:4091:  duration_ms: 23.6139
  phase2.2a-transcript.md:4092:  type: 'test'
  phase2.2a-transcript.md:4093:  ...
  phase2.2a-transcript.md:4094:1..24
  phase2.2a-transcript.md:4095:# tests 24
  phase2.2a-transcript.md:4102:# duration_ms 231.2389
  phase2.2a-transcript.md:4103:> build �� deepseek-v4.1-flash-free
> phase2.2a-transcript.md:4104:$ node scripts/selfplay.mjs --games=1000 2>&1 | Select-Object -Last 40
> phase2.2a-transcript.md:4105:Greyharbor v2.2 self-play
  phase2.2a-transcript.md:4106:{
  phase2.2a-transcript.md:4107:  "ok": true,
> phase2.2a-transcript.md:4108:  "games": 1000,
  phase2.2a-transcript.md:4109:  "elapsedMs": 358,
  phase2.2a-transcript.md:4110:  "avgMsPerGame": 0.358,
  phase2.2a-transcript.md:4111:  "maxGameMs": 9,
> phase2.2a-transcript.md:4112:  "wins": {
  phase2.2a-transcript.md:4113:    "p0": 256,
  phase2.2a-transcript.md:4114:    "p1": 744,
  phase2.2a-transcript.md:4115:    "draw": 0
  phase2.2a-transcript.md:4116:  },
> phase2.2a-transcript.md:4117:  "reasons": {
> phase2.2a-transcript.md:4118:    "nightWins": 781,
  phase2.2a-transcript.md:4119:    "sanity": 219
  phase2.2a-transcript.md:4120:  },
> phase2.2a-transcript.md:4121:  "endingNight": {
  phase2.2a-transcript.md:4122:    "1": 49,
  phase2.2a-transcript.md:4123:    "2": 811,
  phase2.2a-transcript.md:4124:    "3": 140
  phase2.2a-transcript.md:4125:  },
  phase2.2a-transcript.md:4126:  "totalActions": 26043,
  phase2.2a-transcript.md:4127:  "avgActionsPerGame": 26.04,
  phase2.2a-transcript.md:4128:  "maxActionsPerGame": 39,
> phase2.2a-transcript.md:4129:  "sanityEndingRatio": 0.219,
  phase2.2a-transcript.md:4130:  "conservation": "ok"
  phase2.2a-transcript.md:4131:}
  phase2.2a-transcript.md:4132:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4133:�� Read scripts/selfplay.mjs 
  phase2.2a-transcript.md:4134:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4135:�� Read phase2.2a-transcript.md [offset=980, limit=90]
  phase2.2a-transcript.md:4171:FullName                                                 Length
  phase2.2a-transcript.md:4172:--------                                                 ------
> phase2.2a-transcript.md:4173:D:\Games\greyharbor\src\engine\v2\cards.js                 4311
> phase2.2a-transcript.md:4174:D:\Games\greyharbor\src\engine\v2\engine.js               65333
> phase2.2a-transcript.md:4175:D:\Games\greyharbor\src\engine\v2\index.js                  708
> phase2.2a-transcript.md:4176:D:\Games\greyharbor\src\engine\v2\scoring.js               8304
> phase2.2a-transcript.md:4177:D:\Games\greyharbor\src\engine\v2\view.js                  5390
> phase2.2a-transcript.md:4178:D:\Games\greyharbor\src\engine\v2\effects\dsl.js           2733
> phase2.2a-transcript.md:4179:D:\Games\greyharbor\src\engine\v2\effects\index.js          121
> phase2.2a-transcript.md:4180:D:\Games\greyharbor\src\engine\v2\effects\interpreter.js  11564
> phase2.2a-transcript.md:4181:D:\Games\greyharbor\src\engine\v2\effects\registry.js      7451
> phase2.2a-transcript.md:4182:D:\Games\greyharbor\src\engine\v2\effects\targets.js      11328
> phase2.2a-transcript.md:4183:D:\Games\greyharbor\tests\v2\effects-pilot.test.mjs       29419
> phase2.2a-transcript.md:4184:D:\Games\greyharbor\tests\v2\engine-core.test.mjs         19980
  phase2.2a-transcript.md:4185:
  phase2.2a-transcript.md:4186:
  phase2.2a-transcript.md:4187:FullName                                    Length
  phase2.2a-transcript.md:4188:--------                                    ------
> phase2.2a-transcript.md:4189:D:\Games\greyharbor\scripts\selfplay.mjs      3654
> phase2.2a-transcript.md:4190:D:\Games\greyharbor\phase2.2a-transcript.md 232479
  phase2.2a-transcript.md:4191:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4192:? Grep "^test\(" in tests/v2/effects-pilot.test.mjs �� 13 matches
  phase2.2a-transcript.md:4193:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4194:$ node --input-type=module -e "import { EFFECT_REGISTRY, KEYWORD_SPECS } from './src/eng
ine/v2/effects/registry.js'; console.log(Object.keys(EFFECT_REGISTRY).filter(k=>EFFECT_REGISTRY[k]!==null)); console.lo
g(Object.keys(KEYWORD_SPECS));"
  phase2.2a-transcript.md:4195:[
  phase2.2a-transcript.md:4196:  'harold-ashby',
  phase2.2a-transcript.md:4212:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4213:? Write phase2.2a-transcript.md failed
> phase2.2a-transcript.md:4214:Error: Unable to write D:\Games\greyharbor\phase2.2a-transcript.md
  phase2.2a-transcript.md:4215:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4216:$ Set-Content -Path phase2.2a-transcript.md -Value "test" -Encoding UTF8; Get-Item phase
2.2a-transcript.md | Select-Object Length
> phase2.2a-transcript.md:4217:Set-Content: The process cannot access the file 'D:\Games\greyharbor\phase2.2a-transcrip
t.md' because it is being used by another process.
  phase2.2a-transcript.md:4218:
  phase2.2a-transcript.md:4219:Length
  phase2.2a-transcript.md:4220:------
  phase2.2a-transcript.md:4221:234871
  phase2.2a-transcript.md:4222:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4223:$ Get-Process node,pwsh,powershell -ErrorAction SilentlyContinue | Select-Object Id,Proc
essName,StartTime,Path | Format-Table -AutoSize
  phase2.2a-transcript.md:4347:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4348:$ try { Add-Content -Path phase2.2a-transcript.md -Value "`n---`nprobe`n" -Encoding UTF8
 -ErrorAction Stop; 'append-ok' } catch { 'append-failed: ' + $_.Exception.Message }
> phase2.2a-transcript.md:4349:append-failed: The process cannot access the file 'D:\Games\greyharbor\phase2.2a-transcr
ipt.md' because it is being used by another process.
  phase2.2a-transcript.md:4350:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4351:$ node --input-type=module -e "import { PRESET_DECKS } from './src/engine/v2/cards.js'; 
for(const k of Object.keys(PRESET_DECKS)){const d=PRESET_DECKS[k]; console.log(k,d.leader,d.cards.length,new Set(d.card
s).size)}"
  phase2.2a-transcript.md:4352:society harold-ashby 19 16
  phase2.2a-transcript.md:4353:cult elias-thorne 19 17
  phase2.2a-transcript.md:4354:> build �� deepseek-v4.1-flash-free
  phase2.2a-transcript.md:4355:�׶� 2.2a ��ɡ�������֤�����
  phase2.2a-transcript.md:4369:
  phase2.2a-transcript.md:4370:```text
> phase2.2a-transcript.md:4371:Greyharbor v2.2 self-play
  phase2.2a-transcript.md:4372:{
  phase2.2a-transcript.md:4373:  "ok": true,
> phase2.2a-transcript.md:4374:  "games": 1000,
  phase2.2a-transcript.md:4375:  "elapsedMs": 358,
  phase2.2a-transcript.md:4376:  "avgMsPerGame": 0.358,
  phase2.2a-transcript.md:4377:  "maxGameMs": 9,
> phase2.2a-transcript.md:4378:  "wins": { "p0": 256, "p1": 744, "draw": 0 },
> phase2.2a-transcript.md:4379:  "reasons": { "nightWins": 781, "sanity": 219 },
> phase2.2a-transcript.md:4380:  "endingNight": { "1": 49, "2": 811, "3": 140 },
  phase2.2a-transcript.md:4381:  "totalActions": 26043,
  phase2.2a-transcript.md:4382:  "avgActionsPerGame": 26.04,
  phase2.2a-transcript.md:4383:  "maxActionsPerGame": 39,
> phase2.2a-transcript.md:4384:  "sanityEndingRatio": 0.219,
  phase2.2a-transcript.md:4385:  "conservation": "ok"
  phase2.2a-transcript.md:4386:}
  phase2.2a-transcript.md:4387:```
  phase2.2a-transcript.md:4388:
  phase2.2a-transcript.md:4389:> �÷ֲ��������ȶ���/�����ʣ�������ƽ���Խ��ۣ�P0 �̶�ѧ�ᡢP1 �̶����ţ���������Բ���
���׼�������վλ��
  phase2.2a-transcript.md:4390:


[showing lines 59-738 of 738; full output saved to C:\Users\31709\.local\share\opencode\shell\b42ec906b665c6e5b1b2a5b56610108f03116b78\sh_210e0d471001bOSzbY9P6ZTvLG.out]
> build · deepseek-v4.1-flash-free
→ Read tests/v2/engine-core.test.mjs 
$ node -e "const d=require('./src/data/card-table.normalized.json'); for(const c of d) console.log(JSON.stringify({id:c.id,f:c.faction,t:c.type,l:c.location,r:c.reasonPower,m:c.madnessPower,k:c.keywords,cost:c.sanityCost,e:c.effect}))"
{"id":"harold-ashby","f":"society","t":"leader","l":null,"r":null,"m":null,"k":[],"cost":0,"e":"主动技每夜一次：封印一张敌方卡直到下一夜并回复1理智"}
{"id":"nora-wells","f":"society","t":"unit","l":"scene","r":2,"m":4,"k":["隐秘"],"cost":0,"e":"盖牌入场翻开时查看对手一张手牌"}
{"id":"samuel-pike","f":"society","t":"unit","l":"scene","r":4,"m":4,"k":["封印"],"cost":0,"e":"入场移除一个敌方腐化或封印一张战力4以下敌方卡"}
{"id":"edith-barrow","f":"society","t":"unit","l":"archive","r":2,"m":3,"k":["连锁"],"cost":0,"e":"档案位置每有一张己方卡自身+1"}
{"id":"walter-morse","f":"society","t":"unit","l":"archive","r":3,"m":6,"k":["理智反噬"],"cost":0,"e":"疯狂面结算后扣1理智"}
{"id":"lucia-vaughn","f":"society","t":"unit","l":"dream","r":1,"m":7,"k":["隐秘"],"cost":0,"e":"可在梦境位置盖牌入场"}
{"id":"frank-holt","f":"society","t":"unit","l":"scene","r":5,"m":5,"k":["连锁"],"cost":0,"e":"每有一张相邻己方卡+1上限+3"}
{"id":"arthur-pendleton","f":"society","t":"unit","l":"archive","r":3,"m":4,"k":["隐秘"],"cost":0,"e":"入场时随机展示对手一张手牌"}
{"id":"abjuration","f":"society","t":"event","l":"any","r":null,"m":null,"k":[],"cost":0,"e":"移除一个腐化或环境效果"}
{"id":"warding-rite","f":"society","t":"event","l":"row","r":null,"m":null,"k":[],"cost":0,"e":"目标排本夜免疫封印与腐化全体+1"}
{"id":"silver-lantern","f":"society","t":"equipment","l":"attach","r":null,"m":null,"k":[],"cost":0,"e":"附属单位+2；单位将被摧毁或封印时弃掉银灯代替"}
{"id":"old-library","f":"society","t":"location","l":"archive","r":null,"m":null,"k":[],"cost":0,"e":"档案位置己方卡不受腐化；在此打出的卡理智代价-1每夜一次"}
{"id":"elias-thorne","f":"cult","t":"leader","l":null,"r":null,"m":null,"k":[],"cost":0,"e":"主动技每夜一次：献祭一张己方卡从牌堆直接打出一个异怪单位"}
{"id":"hooded-acolyte","f":"cult","t":"unit","l":"scene","r":2,"m":3,"k":["献祭"],"cost":0,"e":"可被献祭时代替任何己方卡被移除"}
{"id":"zealot","f":"cult","t":"unit","l":"scene","r":3,"m":6,"k":["理智反噬"],"cost":0,"e":"疯狂面+3结算后扣1理智"}
{"id":"sea-priestess","f":"cult","t":"unit","l":"archive","r":4,"m":5,"k":["腐化"],"cost":0,"e":"入场给敌方战力最高的卡附着腐化每夜-1"}
{"id":"gravedigger","f":"cult","t":"unit","l":"archive","r":3,"m":4,"k":["献祭"],"cost":0,"e":"献祭一张己方卡后从深渊弃牌堆拉回一张单位"}
{"id":"whisperer","f":"cult","t":"unit","l":"dream","r":2,"m":7,"k":["隐秘"],"cost":0,"e":"盖牌入场翻开时对手扣1理智"}
{"id":"deep-one","f":"cult","t":"unit","l":"dream","r":5,"m":8,"k":["理智反噬"],"cost":1,"e":"疯狂面额外+3结算后扣1理智"}
{"id":"bell-claw","f":"cult","t":"unit","l":"scene","r":6,"m":6,"k":["献祭"],"cost":1,"e":"吞噬一张相邻己方卡永久获得其全部战力"}
{"id":"seance","f":"cult","t":"ritual","l":"any","r":null,"m":null,"k":[],"cost":0,"e":"献祭一张己方卡从深渊拉回最多2张单位入手牌"}
{"id":"tide-ritual","f":"cult","t":"ritual","l":"dream","r":null,"m":null,"k":[],"cost":0,"e":"本夜梦境位置己方卡全体+3下夜复原"}
{"id":"lunar-eclipse","f":"cult","t":"environment","l":"all","r":null,"m":null,"k":[],"cost":0,"e":"本夜全场理性面卡-1疯狂面卡+1"}
{"id":"drowned-altar","f":"cult","t":"location","l":"scene","r":null,"m":null,"k":[],"cost":0,"e":"在此献祭的卡不触发理智反噬；教团被动加成由+2变+3"}
{"id":"finn-calloway","f":"neutral","t":"unit","l":"any","r":3,"m":4,"k":["连锁"],"cost":0,"e":"每有一张相邻己方卡+1上限+2"}
{"id":"silas-gold","f":"neutral","t":"unit","l":"archive","r":2,"m":3,"k":["隐秘"],"cost":0,"e":"入场弃一张手牌从牌堆翻3张选1张入手"}
{"id":"the-sleeper","f":"neutral","t":"oldgod","l":"dream","r":8,"m":12,"k":["理智反噬"],"cost":2,"e":"无法被封印入场扣2理智此后每夜再扣1"}
{"id":"thousand-eyes","f":"neutral","t":"oldgod","l":"archive","r":7,"m":10,"k":["封印"],"cost":2,"e":"入场封印敌方领袖能力一夜；对手每有一张隐秘卡自身+1"}
{"id":"stormy-night","f":"neutral","t":"environment","l":"all","r":null,"m":null,"k":[],"cost":0,"e":"本夜双方现场位置卡全体-2"}
{"id":"unexpected-aid","f":"neutral","t":"event","l":"any","r":null,"m":null,"k":[],"cost":0,"e":"目标己方卡+3并解除其封印或腐化"}
> build · deepseek-v4.1-flash-free
! retrying (attempt 2): Timed out waiting for response data
> build · deepseek-v4.1-flash-free
! retrying (attempt 3): ECONNRESET: The socket connection was closed unexpectedly. For more information, pass `verbose: true` in the second argument to fetch()
→ Read src/engine/rng.js 
$ Get-Content package.json
{
  "name": "gwent-classic-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Web-based Gwent (The Witcher 3) with faithful rules, full card pool, upgraded visuals and effects.",
  "scripts": {
    "start": "node server.mjs",
    "test": "node --test 'tests/*.test.mjs'",
    "check": "node --test 'tests/*.test.mjs'",
    "e2e": "node scripts/e2e.mjs --mode=full",
    "e2e:smoke": "node scripts/e2e.mjs --mode=smoke"
  },
  "engines": {
    "node": ">=20"
  }
}
> build · deepseek-v4.1-flash-free
Now I have the full picture. Let me start implementing, beginning with the DSL and registry.
← Edit src/engine/v2/effects/dsl.js
Index: src/engine/v2/effects/dsl.js
===================================================================
--- src/engine/v2/effects/dsl.js
+++ src/engine/v2/effects/dsl.js
@@ -57,9 +57,16 @@
 
 export const ZONE = Object.freeze({
   BOARD: 'board',
   ATTACHED: 'attached',
+  /** The location-effect slot of one player (a card instance). */
   LOCATION_SLOT: 'locationSlot',
+  /**
+   * A bare location ("row") rather than a card in it.  Used by effects that
+   * choose one of the three places, e.g. Warding Rite.  Pseudo target shape:
+   *   { kind: 'locationRow', uid: 'p0-scene', player, location }
+   */
+  LOCATION_ROW: 'locationRow',
   ENVIRONMENT: 'environment',
   DECK: 'deck',
   HAND: 'hand',
   ABYSS: 'abyss',

> build · deepseek-v4.1-flash-free
← Write src/engine/v2/effects/registry.js
Wrote file successfully: src/engine/v2/effects/registry.js
> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/scoring.js
Index: src/engine/v2/scoring.js
===================================================================
--- src/engine/v2/scoring.js
+++ src/engine/v2/scoring.js
@@ -8,9 +8,15 @@
  * Chain is recomputed on demand, so every board change is reflected without
  * stored aura state.  A face-down or sealed card contributes no chain bonus.
  */
 
-import { chainSpecFor } from './effects/registry.js';
+import {
+  chainSpecFor,
+  conditionalPowerSpecFor,
+  equipmentSpecFor,
+  isSealImmuneCard,
+  madnessPowerBonusFor,
+} from './effects/registry.js';
 
 export const LOCATIONS = Object.freeze(['scene', 'archive', 'dream']);
 
 export const LOCATION_CAPACITY = Object.freeze({

> build · deepseek-v4.1-flash-free
✗ Edit  failed
Error: Invalid arguments for tool "edit":
- path: Missing key

Arguments provided:
{
  "newString": "/** Printed power for the locked face.  Non-units have no power. */\nexport function printedPower(card, face) {\n  if (!isUnitCard(card)) return 0;\n  const base = face === 'madness'\n    ? (card.madnessPower ?? card.reasonPower ?? 0)\n    : (card.reasonPower ?? card.madnessPower ?? 0);\n  // §11.2 Zealot / Deep One: \"疯狂面基础 +3\".  The bonus is a printed-power\n  // modifier on the madness face, so it also shows correctly in views.\n  return base + (face === 'madness' ? madnessPowerBonusFor(card.id) : 0);\n}",
  "oldString": "/** Printed power for the locked face.  Non-units have no power. */\nexport function printedPower(card, face) {\n  if (!isUnitCard(card)) return 0;\n  if (face === 'madness') return card.madnessPower ?? card.reasonPower ?? 0;\n  return card.reasonPower ?? card.madnessPower ?? 0;\n}"
}

Update the arguments and call the tool again.
> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/scoring.js
Index: src/engine/v2/scoring.js
===================================================================
--- src/engine/v2/scoring.js
+++ src/engine/v2/scoring.js
@@ -76,10 +76,14 @@
 
 /** Printed power for the locked face.  Non-units have no power. */
 export function printedPower(card, face) {
   if (!isUnitCard(card)) return 0;
-  if (face === 'madness') return card.madnessPower ?? card.reasonPower ?? 0;
-  return card.reasonPower ?? card.madnessPower ?? 0;
+  const base = face === 'madness'
+    ? (card.madnessPower ?? card.reasonPower ?? 0)
+    : (card.reasonPower ?? card.madnessPower ?? 0);
+  // §11.2 Zealot / Deep One: "疯狂面基础 +3".  The bonus is a printed-power
+  // modifier on the madness face, so it also shows correctly in views.
+  return base + (face === 'madness' ? madnessPowerBonusFor(card.id) : 0);
 }
 
 export function boardUnits(state, p) {
   const out = [];

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/scoring.js
Index: src/engine/v2/scoring.js
===================================================================
--- src/engine/v2/scoring.js
+++ src/engine/v2/scoring.js
@@ -113,19 +113,26 @@
   return !!card && card.cardId === 'drowned-altar' && !card.sealed;
 }
 
 /**
- * Corruption immunity is a flag on the instance.  §6.3 names Old Library as
- * a source; the location card itself is implemented in phase 2.2b, but the
- * keyword primitive still honours its presence for archive cards so the
- * immunity/retarget rule is testable today.
+ * Corruption immunity.  Three sources:
+ *   1. an instance flag (`corruptionImmune`, used by tests/future cards),
+ *   2. Old Library while unsealed, for every own card in the archive,
+ *   3. a Warding Rite aura with `corruptionImmune` for the chosen location.
+ * Existing tokens are never removed by immunity (§6.3).
  */
 export function isCorruptionImmune(state, p, inst, location) {
   if (inst?.corruptionImmune) return true;
   if (location === 'archive') {
     const library = state.players[p].locations?.archive;
     if (library && library.cardId === 'old-library' && !library.sealed) return true;
   }
+  const card = state.cardIndex?.[inst?.cardId];
+  for (const aura of state.effects ?? []) {
+    if (!aura.modifiers?.corruptionImmune) continue;
+    if (!auraApplies(aura, state, p, inst, location, card)) continue;
+    return true;
+  }
   return false;
 }
 
 export function canReceiveCorruption(state, p, inst, location) {
@@ -134,8 +141,99 @@
   if ((inst.corruptionTokens?.length ?? 0) >= 3) return false;
   return !isCorruptionImmune(state, p, inst, location);
 }
 
+/** Locate one instance anywhere it can live (board, equipment, locations, env). */
+export function findInstanceByUid(state, uid) {
+  for (const p of [0, 1]) {
+    const player = state.players[p];
+    for (const location of LOCATIONS) {
+      const row = player.board[location];
+      for (const inst of row) {
+        if (!inst) continue;
+        if (inst.uid === uid) return { inst, player: p, location, slot: inst.slot };
+        if (inst.equipment?.uid === uid) {
+          return { inst: inst.equipment, player: p, location, slot: inst.slot, host: inst };
+        }
+      }
+      if (player.locations?.[location]?.uid === uid) {
+        return { inst: player.locations[location], player: p, location, slot: null };
+      }
+    }
+  }
+  for (const inst of state.environments ?? []) {
+    if (inst.uid === uid) return { inst, player: inst.owner, location: null, slot: null };
+  }
+  return null;
+}
+
+/** An aura whose source card must still be present and unsealed. */
+export function isAuraActive(state, aura) {
+  if (!aura.requiresSourceActive) return true;
+  const found = aura.sourceUid ? findInstanceByUid(state, aura.sourceUid) : null;
+  if (!found) return false;
+  return !found.inst.sealed;
+}
+
+/** Does one aura cover this card?  Scope is public, data-only. */
+export function auraApplies(aura, state, p, inst, location, card) {
+  if (!aura || !isAuraActive(state, aura)) return false;
+  const scope = aura.scope ?? {};
+  if (scope.side === 'own' && p !== aura.sourcePlayer) return false;
+  if (scope.location && location !== scope.location) return false;
+  if (scope.types && (!card || !scope.types.includes(card.type))) return false;
+  if (scope.faceUpOnly !== false && inst?.faceDown) return false;
+  return true;
+}
+
+/** Sum of this-night aura power modifiers for one board unit. */
+export function auraPowerBonus(state, p, inst, location, card) {
+  let bonus = 0;
+  for (const aura of state.effects ?? []) {
+    if (!auraApplies(aura, state, p, inst, location, card)) continue;
+    bonus += aura.modifiers?.power ?? 0;
+    const facePower = aura.modifiers?.facePower;
+    if (facePower && inst?.face) bonus += facePower[inst.face] ?? 0;
+  }
+  return bonus;
+}
+
+/**
+ * Seal immunity.  The Sleeper is immune by card text; Warding Rite grants it
+ * to every own card in the chosen location (including the location card).
+ * Existing seals are not cleared by immunity.
+ */
+export function isSealImmune(state, p, inst, location) {
+  if (!inst) return false;
+  if (isSealImmuneCard(inst.cardId)) return true;
+  const card = state.cardIndex?.[inst.cardId];
+  for (const aura of state.effects ?? []) {
+    if (!aura.modifiers?.sealImmune) continue;
+    if (!auraApplies(aura, state, p, inst, location, card)) continue;
+    return true;
+  }
+  return false;
+}
+
+/** Thousand Eyes' public-count static power (§11.3). */
+export function conditionalSelfPower(state, p, inst, location) {
+  const spec = conditionalPowerSpecFor(inst?.cardId);
+  if (!spec || inst.sealed || inst.faceDown) return 0;
+  if (spec.kind === 'enemyFaceUpStealth') {
+    const enemy = state.players[1 - p];
+    let count = 0;
+    for (const rowLocation of LOCATIONS) {
+      for (const entry of enemy.board[rowLocation]) {
+        if (!entry || entry.faceDown || entry.sealed) continue;
+        if (isStealth(state.cardIndex?.[entry.cardId])) count += 1;
+      }
+    }
+    return count * (spec.per ?? 1);
+  }
+  void location;
+  return 0;
+}
+
 function chainCount(state, p, inst, location, slot) {
   const card = state.cardIndex?.[inst.cardId];
   const spec = chainSpecFor(inst.cardId);
   if (!spec || !hasChain(card)) return 0;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/scoring.js
Index: src/engine/v2/scoring.js
===================================================================
--- src/engine/v2/scoring.js
+++ src/engine/v2/scoring.js
@@ -253,14 +253,15 @@
   }
   return Number.isFinite(spec.cap) ? Math.min(spec.cap, count) : count;
 }
 
-/** Equipment bonuses.  Silver Lantern's +2 is text (2.2b); the primitive is here. */
+/** Equipment bonuses.  Silver Lantern's +2 comes from KEYWORD_SPECS. */
 function equipmentBonus(state, inst) {
   const equipment = inst.equipment;
   if (!equipment || equipment.sealed) return 0;
   const card = state.cardIndex?.[equipment.cardId];
-  return (equipment.powerBonus ?? 0) + (card?.powerBonus ?? 0);
+  const spec = equipmentSpecFor(equipment.cardId);
+  return (equipment.powerBonus ?? 0) + (card?.powerBonus ?? 0) + (spec?.power ?? 0);
 }
 
 /** Player-wide "this night" auras; §7.2 cult sacrifice echo currently. */
 function thisNightBonus(state, p, inst) {

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/scoring.js
Index: src/engine/v2/scoring.js
===================================================================
--- src/engine/v2/scoring.js
+++ src/engine/v2/scoring.js
@@ -286,8 +286,10 @@
   power += inst.permanentPower ?? 0;
   power -= inst.corruptionLoss ?? 0;
   power += equipmentBonus(state, inst);
   power += thisNightBonus(state, p, inst);
+  power += auraPowerBonus(state, p, inst, location, card);
+  power += conditionalSelfPower(state, p, inst, location);
   power += chainCount(state, p, inst, location, slot);
   return Math.max(0, power);
 }
 

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -13,8 +13,9 @@
   canReceiveCorruption,
   currentUnitPower,
   findUnit,
   isCorruptionImmune,
+  isSealImmune,
 } from '../scoring.js';
 import { SIDE, ZONE } from './dsl.js';
 
 function playersForSide(controller, side) {

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -73,8 +73,9 @@
         if (selector.hasCorruption && !(inst.corruptionTokens?.length > 0)) continue;
         if (selector.canReceiveCorruption && !canReceiveCorruption(state, p, inst, location)) continue;
         if (selector.corruptionImmune === true && !isCorruptionImmune(state, p, inst, location)) continue;
         if (selector.corruptionImmune === false && isCorruptionImmune(state, p, inst, location)) continue;
+        if (selector.sealable && isSealImmune(state, p, inst, location)) continue;
 
         const power = currentUnitPower(state, p, inst, location, slot);
         if (selector.maxCurrentPower !== undefined && power > selector.maxCurrentPower) continue;
         if (selector.minCurrentPower !== undefined && power < selector.minCurrentPower) continue;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -100,8 +100,9 @@
         if (!equipment) continue;
         const card = state.cardIndex?.[equipment.cardId];
         if (!matchesType(card, selector.types)) continue;
         if (selector.sealed !== undefined && !!equipment.sealed !== selector.sealed) continue;
+        if (selector.sealable && isSealImmune(state, p, equipment, location)) continue;
         if (selector.excludeUids?.includes(equipment.uid)) continue;
         if (selector.cardId && equipment.cardId !== selector.cardId) continue;
         out.push({
           kind: 'attached',

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -130,8 +130,9 @@
       if (!inst) continue;
       const card = state.cardIndex?.[inst.cardId];
       if (!matchesType(card, selector.types)) continue;
       if (selector.sealed !== undefined && !!inst.sealed !== selector.sealed) continue;
+      if (selector.sealable && isSealImmune(state, p, inst, location)) continue;
       if (selector.excludeUids?.includes(inst.uid)) continue;
       if (selector.cardId && inst.cardId !== selector.cardId) continue;
       out.push({
         kind: 'location',

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -156,8 +156,9 @@
     if (selector.side === SIDE.ENEMY && p === ctx.controller) continue;
     const card = state.cardIndex?.[inst.cardId];
     if (!matchesType(card, selector.types)) continue;
     if (selector.sealed !== undefined && !!inst.sealed !== selector.sealed) continue;
+    if (selector.sealable && isSealImmune(state, p, inst, null)) continue;
     if (selector.excludeUids?.includes(inst.uid)) continue;
     if (selector.cardId && inst.cardId !== selector.cardId) continue;
     out.push({ kind: 'environment', uid: inst.uid, inst, player: p, location: null, power: 0 });
   }

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -146,8 +146,29 @@
   }
   return out;
 }
 
+/** A bare row (location) target, whether or not a location card is present. */
+function enumerateLocationRows(engine, ctx, selector) {
+  void engine;
+  const out = [];
+  for (const p of playersForSide(ctx.controller, selector.side)) {
+    for (const location of LOCATIONS) {
+      if (!locationMatches(selector, ctx, location)) continue;
+      if (selector.excludeLocations?.includes(location)) continue;
+      out.push({
+        kind: 'locationRow',
+        uid: `p${p}-${location}`,
+        inst: null,
+        player: p,
+        location,
+        power: 0,
+      });
+    }
+  }
+  return out;
+}
+
 function enumerateEnvironments(engine, ctx, selector) {
   const { state } = ctx;
   const out = [];
   for (const inst of state.environments ?? []) {

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -234,12 +234,13 @@
 export function enumerateTargets(engine, ctx, selector) {
   const zones = selector.zones ?? [selector.zone ?? ZONE.BOARD];
   let targets = [];
 
-  for (const zone of zones) {
+    for (const zone of zones) {
     if (zone === ZONE.BOARD) targets.push(...enumerateUnits(engine, ctx, selector));
     else if (zone === ZONE.ATTACHED) targets.push(...enumerateAttached(engine, ctx, selector));
     else if (zone === ZONE.LOCATION_SLOT) targets.push(...enumerateLocationSlots(engine, ctx, selector));
+    else if (zone === ZONE.LOCATION_ROW) targets.push(...enumerateLocationRows(engine, ctx, selector));
     else if (zone === ZONE.ENVIRONMENT) targets.push(...enumerateEnvironments(engine, ctx, selector));
     else if (zone === ZONE.DECK || zone === ZONE.HAND || zone === ZONE.ABYSS || zone === ZONE.DISCARD) {
       targets.push(...enumerateCards(engine, ctx, selector, zone));
     } else if (zone === ZONE.LEADER) {

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -234,9 +234,9 @@
 export function enumerateTargets(engine, ctx, selector) {
   const zones = selector.zones ?? [selector.zone ?? ZONE.BOARD];
   let targets = [];
 
-    for (const zone of zones) {
+  for (const zone of zones) {
     if (zone === ZONE.BOARD) targets.push(...enumerateUnits(engine, ctx, selector));
     else if (zone === ZONE.ATTACHED) targets.push(...enumerateAttached(engine, ctx, selector));
     else if (zone === ZONE.LOCATION_SLOT) targets.push(...enumerateLocationSlots(engine, ctx, selector));
     else if (zone === ZONE.LOCATION_ROW) targets.push(...enumerateLocationRows(engine, ctx, selector));

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -197,9 +197,12 @@
           ? state.players[p].hand
           : zone === ZONE.ABYSS
             ? state.players[p].abyss ?? []
             : state.players[p].discard;
-    for (const inst of pile) {
+    const ordered = zone === ZONE.DECK && selector.topN
+      ? pile.slice(0, selector.topN)
+      : pile;
+    for (const inst of ordered) {
       const card = state.cardIndex?.[inst.cardId];
       if (!matchesType(card, selector.types)) continue;
       if (selector.cardId && inst.cardId !== selector.cardId) continue;
       if (selector.cardIds && !selector.cardIds.includes(inst.cardId)) continue;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/interpreter.js
Index: src/engine/v2/effects/interpreter.js
===================================================================
--- src/engine/v2/effects/interpreter.js
+++ src/engine/v2/effects/interpreter.js
@@ -36,8 +36,20 @@
     case 'handNotEmpty': {
       const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
       return engine.state.players[p].hand.length > 0;
     }
+    case 'handEmpty': {
+      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
+      return engine.state.players[p].hand.length === 0;
+    }
+    case 'deckNotEmpty': {
+      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
+      return engine.state.players[p].deck.length > 0;
+    }
+    case 'deckEmpty': {
+      const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
+      return engine.state.players[p].deck.length === 0;
+    }
     case 'deckHasAberration': {
       const p = condition.side === SIDE.ENEMY ? 1 - ctx.controller : ctx.controller;
       return engine.state.players[p].deck.some((inst) => engine._isAberration(inst.cardId));
     }

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/interpreter.js
Index: src/engine/v2/effects/interpreter.js
===================================================================
--- src/engine/v2/effects/interpreter.js
+++ src/engine/v2/effects/interpreter.js
@@ -92,9 +92,17 @@
 
   let targets;
   if (choiceMatches) {
     const resolved = resolveTargetByUid(engine, choice.targetUid);
-    targets = resolved ? [resolved] : [];
+    if (resolved) {
+      targets = [resolved];
+    } else {
+      // Pseudo targets (e.g. a bare location row chosen by Warding Rite) are
+      // not resolvable by uid, so fall back to the selector enumeration.
+      targets = selector
+        ? enumerateTargets(engine, ctx, selector).filter((entry) => entry.uid === choice.targetUid)
+        : [];
+    }
   } else if (selector) {
     targets = enumerateTargets(engine, ctx, selector);
   } else {
     targets = [];

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/interpreter.js
Index: src/engine/v2/effects/interpreter.js
===================================================================
--- src/engine/v2/effects/interpreter.js
+++ src/engine/v2/effects/interpreter.js
@@ -141,21 +141,28 @@
     if (legal.length === 1 && legal[0] === null) {
       if (!choice) return;
       throw new Error(`illegal effect choice for ${effectDef.id}: no legal mode`);
     }
-    const legalMode = choice?.mode ?? null;
-    const match = legal.find((entry) => entry && entry.mode === legalMode
-      && (entry.targetUid ?? null) === (choice?.targetUid ?? null));
+    // An omitted choice is the explicit "decline" option when one exists.
+    let effectiveChoice = choice;
+    if (!effectiveChoice) {
+      const skipEntry = legal.find((entry) => entry && isSkipMode(effectDef, entry.mode));
+      if (!skipEntry) {
+        throw new Error(`effect ${effectDef.id} requires a choice`);
+      }
+      effectiveChoice = { mode: skipEntry.mode, targetUid: null, secondaryUids: [] };
+    }
+    const chosen = effectDef.choices.find((entry) => entry.id === effectiveChoice.mode);
+    if (!chosen) throw new Error(`unknown effect choice: ${effectiveChoice.mode}`);
+    const match = legal.find((entry) => choiceEntryMatches(entry, effectiveChoice));
     if (!match) {
-      throw new Error(`illegal effect choice for ${effectDef.id}: ${legalMode}`);
+      throw new Error(`illegal effect choice for ${effectDef.id}: ${effectiveChoice.mode}`);
     }
-    const chosen = effectDef.choices.find((entry) => entry.id === legalMode);
-    if (!chosen) throw new Error(`unknown effect choice: ${legalMode}`);
     if (!evalCondition(engine, ctx, chosen.condition)) return;
-    // Merge the player's concrete selection ({targetUid, ...}) with the
-    // registry definition so operations can resolve the chosen target; the
-    // definition alone only carries the selector, not the picked uid.
-    const executionChoice = { ...chosen, ...ctx.choice };
+    // Merge the player's concrete selection ({targetUid, secondaryUids, ...})
+    // with the registry definition so operations can resolve the chosen
+    // targets; the definition alone only carries selectors.
+    const executionChoice = { ...chosen, ...effectiveChoice };
     for (const operation of chosen.operations ?? []) {
       runOperation(engine, ctx, effectDef, executionChoice, operation);
     }
     return;
@@ -165,8 +172,24 @@
     runOperation(engine, ctx, effectDef, null, operation);
   }
 }
 
+function isSkipMode(effectDef, mode) {
+  return (effectDef.choices ?? []).some((entry) => entry.id === mode && entry.skip);
+}
+
+export function choiceEntryMatches(entry, choice) {
+  if (!entry) return false;
+  if (entry.mode !== choice?.mode) return false;
+  if ((entry.targetUid ?? null) !== (choice?.targetUid ?? null)) return false;
+  const a = [...(entry.secondaryUids ?? [])].sort();
+  const b = [...(choice?.secondaryUids ?? [])].sort();
+  if (a.length !== b.length) return false;
+  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
+  if ((entry.replaceWithUid ?? null) !== (choice?.replaceWithUid ?? null)) return false;
+  return true;
+}
+
 function runOperation(engine, ctx, effectDef, choice, operation) {
   switch (operation.op) {
     case 'noop':
       return;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/interpreter.js
Index: src/engine/v2/effects/interpreter.js
===================================================================
--- src/engine/v2/effects/interpreter.js
+++ src/engine/v2/effects/interpreter.js
@@ -291,15 +291,74 @@
       });
       return;
     }
     case 'moveAbyssToHand': {
+      if (operation.secondaryKey) {
+        const raw = ctx.choice?.[operation.secondaryKey];
+        const uids = Array.isArray(raw) ? raw : (raw ? [raw] : []);
+        const limit = operation.max ?? uids.length;
+        for (const uid of uids.slice(0, limit)) engine._moveAbyssToHand(ctx.controller, uid);
+        return;
+      }
       const targets = operationTargets(engine, ctx, effectDef, choice, operation);
       for (const target of targets) engine._moveAbyssToHand(target.player, target.uid);
       return;
     }
+    case 'moveDeckToHand': {
+      const cardKey = operation.cardKey ?? 'cardUid';
+      const cardUid = ctx.choice?.[cardKey] ?? null;
+      if (cardUid) engine._moveDeckToHand(ctx.controller, cardUid);
+      return;
+    }
+    case 'revealDeckTop': {
+      engine._revealDeckTop(ctx.controller, operation.count ?? 3);
+      return;
+    }
+    case 'shuffleDeck': {
+      engine._shuffleDeck(ctx.controller);
+      return;
+    }
+    case 'addAura': {
+      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
+        engine._addAura({
+          cardId: ctx.source?.cardId ?? null,
+          sourceUid: ctx.source?.inst?.uid ?? null,
+          sourcePlayer: ctx.controller,
+          duration: operation.duration ?? 'thisNight',
+          requiresSourceActive: !!operation.requiresSourceActive,
+          scope: { ...(operation.scope ?? {}) },
+          modifiers: { ...(operation.modifiers ?? {}) },
+        }, target);
+      }
+      return;
+    }
+    case 'removeFromPlay': {
+      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
+        engine._removeFromPlay(target, operation.reason ?? 'effect');
+      }
+      return;
+    }
+    case 'destroy': {
+      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
+        engine._destroyTarget(target, operation.reason ?? 'destroy');
+      }
+      return;
+    }
+    case 'removeSeal': {
+      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
+        engine._removeSeal(target);
+      }
+      return;
+    }
+    case 'sealLeader': {
+      for (const target of operationTargets(engine, ctx, effectDef, choice, operation)) {
+        if (target.kind === 'leader') {
+          engine._sealLeader(target.player, operation.duration ?? 'untilNextNight', ctx);
+        }
+      }
+      return;
+    }
     case 'devour': {
-      // Extension point for Bell-Claw (phase 2.2b): a devour is a sacrifice
-      // plus a permanent power transfer.  No v1 pilot uses it yet.
       const targets = operationTargets(engine, ctx, effectDef, choice, operation);
       const target = targets[0];
       if (!target) return;
       engine._devour(ctx.controller, target.uid, {

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/interpreter.js
Index: src/engine/v2/effects/interpreter.js
===================================================================
--- src/engine/v2/effects/interpreter.js
+++ src/engine/v2/effects/interpreter.js
@@ -371,41 +371,122 @@
   }
 }
 
 /**
- * Enumerate every legal (mode, targetUid) pair for a modal effect.
- * Returns `[]` for non-modal effects and `[null]` when every mode fizzles
- * (the card is still playable, it simply has no effect).
+ * Every k-sized subset of `items`, in stable order.
  */
+function combinations(items, k) {
+  if (k === 0) return [[]];
+  if (items.length < k) return [];
+  const out = [];
+  const walk = (start, chosen) => {
+    if (chosen.length === k) {
+      out.push(chosen.slice());
+      return;
+    }
+    for (let i = start; i < items.length; i++) {
+      chosen.push(items[i]);
+      walk(i + 1, chosen);
+      chosen.pop();
+    }
+  };
+  walk(0, []);
+  return out;
+}
+
+function secondarySelections(engine, ctx, secondary) {
+  if (!secondary) return [[]];
+  const selector = secondary.selector ?? {};
+  const max = secondary.max ?? selector.count ?? 1;
+  const candidates = enumerateCandidates(engine, ctx, { ...selector, count: undefined });
+  const min = secondary.required === false ? 0 : Math.min(1, max);
+  if (candidates.length < min) return [];
+  const out = [];
+  for (let size = min; size <= Math.min(max, candidates.length); size++) {
+    for (const combo of combinations(candidates, size)) {
+      out.push(combo);
+    }
+  }
+  return out;
+}
+
+function replacementSelections(engine, ctx, replacements, primaryUid) {
+  if (!replacements) return [null];
+  const key = replacements.key ?? 'replaceWithUid';
+  const candidates = engine._replacementCandidates
+    ? engine._replacementCandidates(ctx.controller, primaryUid)
+    : [];
+  void key;
+  return [null, ...candidates.map((inst) => inst.uid)];
+}
+
+/**
+ * Enumerate every legal (mode, targetUid, secondaryUids, replaceWithUid) tuple
+ * for a modal effect.  Returns `[]` for non-modal effects and `[null]` when
+ * every mode fizzles (the card is still playable, it simply has no effect).
+ *
+ * `choice.skip` marks an optional "decline" mode; it is only offered while at
+ * least one real mode is legal.  Otherwise the effect collapses to [null].
+ */
 export function enumerateEffectChoices(engine, ctx, effectDef) {
   if (!Array.isArray(effectDef.choices) || !effectDef.choices.length) return [];
   const out = [];
+  const skips = [];
+
   for (const choice of effectDef.choices) {
     if (!evalCondition(engine, ctx, choice.condition)) continue;
-    const key = choiceKeyFor(choice);
-    const selector = choice.target;
-    if (!selector) {
-      out.push({ mode: choice.id, targetUid: null, label: choice.label ?? choice.id });
+    if (choice.skip) {
+      skips.push(choice);
       continue;
     }
-    if (selector.required !== false && selector.required === true) {
-      const targets = enumerateCandidates(engine, ctx, selector);
-      if (!targets.length) continue;
-      for (const target of targets) {
-        out.push({ mode: choice.id, targetUid: target.uid, label: choice.label ?? choice.id });
-      }
+
+    let primaries;
+    if (!choice.target) {
+      primaries = [null];
     } else {
-      const targets = enumerateCandidates(engine, ctx, selector);
-      if (!targets.length) {
-        out.push({ mode: choice.id, targetUid: null, label: choice.label ?? choice.id });
+      const candidates = enumerateCandidates(engine, ctx, choice.target);
+      if (choice.target.required === true) {
+        if (!candidates.length) continue;
+        primaries = candidates;
       } else {
-        for (const target of targets) {
-          out.push({ mode: choice.id, targetUid: target.uid, label: choice.label ?? choice.id });
+        primaries = candidates.length ? candidates : [null];
+      }
+    }
+
+    for (const primary of primaries) {
+      const secondaries = secondarySelections(engine, ctx, choice.secondary);
+      if (!secondaries.length) continue;
+      const replacements = replacementSelections(
+        engine,
+        ctx,
+        choice.replacements,
+        primary?.uid ?? null,
+      );
+      for (const secondary of secondaries) {
+        for (const replaceWithUid of replacements) {
+          out.push({
+            mode: choice.id,
+            targetUid: primary?.uid ?? null,
+            secondaryUids: secondary.map((entry) => entry.uid),
+            replaceWithUid,
+            label: choice.label ?? choice.id,
+          });
         }
       }
     }
-    void key;
   }
+
+  if (out.length) {
+    for (const choice of skips) {
+      out.push({
+        mode: choice.id,
+        targetUid: null,
+        secondaryUids: [],
+        replaceWithUid: null,
+        label: choice.label ?? choice.id,
+      });
+    }
+  }
   return out.length ? out : [null];
 }
 
 /** Non-modal effects never require a choice; modal ones validate it. */

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/interpreter.js
Index: src/engine/v2/effects/interpreter.js
===================================================================
--- src/engine/v2/effects/interpreter.js
+++ src/engine/v2/effects/interpreter.js
@@ -493,5 +493,25 @@
 export function requiresChoice(effectDef) {
   return Array.isArray(effectDef?.choices) && effectDef.choices.length > 0;
 }
 
+/**
+ * Evaluate an effect-level `playCondition` (a condition that gates whether the
+ * card can be played at all, e.g. Séance's mandatory sacrifice).  Conditions
+ * on individual effects still only gate resolution.
+ */
+export function canPlayCard(engine, ctx, cardId) {
+  const entries = effectsFor(cardId) ?? [];
+  for (const effectDef of entries) {
+    if (effectDef.trigger !== TRIGGER.ON_PLAY) continue;
+    if (!effectDef.playCondition) continue;
+    const context = makeContext(engine, ctx.controller, ctx.source, {
+      trigger: TRIGGER.ON_PLAY,
+      choice: ctx.choice,
+      ...ctx.extra,
+    });
+    if (!evalCondition(engine, context, effectDef.playCondition)) return false;
+  }
+  return true;
+}
+
 export { TRIGGER, ZONE };

> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/effects/index.js 
> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -22,18 +22,23 @@
   faceForSanity,
   hasBacklash,
   hasKeyword,
   hasUnsealedAltar,
+  isCorruptionImmune,
+  isSealImmune,
   isStealth,
   isUnitCard,
   scorePlayer,
 } from './scoring.js';
 import {
   effectsFor,
+  equipmentSpecFor,
   hasSacrificeReplacement,
 } from './effects/registry.js';
 import { SIDE, TRIGGER } from './effects/dsl.js';
 import {
+  canPlayCard,
+  choiceEntryMatches,
   enumerateEffectChoices,
   makeContext,
   runTrigger,
 } from './effects/interpreter.js';

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -423,17 +423,15 @@
     const inst = player.hand[handIndex];
     const card = this.cardIndex[inst.cardId];
     if (!card) return fail(`unknown card: ${inst.cardId}`);
 
-    const sanityCost = Math.max(0, card.sanityCost ?? 0);
-    if (sanityCost > player.sanity) return fail(`${card.name} costs ${sanityCost} sanity`);
-
+    const baseSanityCost = Math.max(0, card.sanityCost ?? 0);
     const face = faceForSanity(player.sanity);
     let plan;
     switch (card.type) {
       case 'unit':
       case 'oldgod':
-        plan = this._validateUnitPlay(p, card, action, face, sanityCost);
+        plan = this._validateUnitPlay(p, card, action, face, baseSanityCost);
         break;
       case 'event':
       case 'ritual':
         plan = this._validateEffectCardPlay(p, card, action, face);
@@ -453,12 +451,19 @@
         return fail(`unsupported card type: ${card.type}`);
     }
     if (!plan.ok) return plan;
 
+    // Old Library: the first archive card each night costs 1 less, but only
+    // when the discount actually reduces a positive printed cost (§5.4).
+    const discount = this._archiveDiscount(p, plan, baseSanityCost);
+    const sanityCost = Math.max(0, baseSanityCost - discount);
+    if (sanityCost > player.sanity) return fail(`${card.name} costs ${sanityCost} sanity`);
+
     // Commit.
     player.hand.splice(handIndex, 1);
     inst.face = face;
     inst.enteredNight = state.night;
+    if (discount > 0) this.state.players[p].flags.libraryDiscountUsed = true;
     if (sanityCost > 0) this._changeSanity(p, -sanityCost, 'sanityCost');
 
     if (plan.kind === 'unit') {
       const { location, slot, faceDown } = plan;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -563,8 +563,20 @@
     this._autoPassStuck();
     return { ok: true };
   }
 
+  _archiveDiscount(p, plan, baseCost) {
+    if (baseCost < 1) return 0;
+    const player = this.state.players[p];
+    if (player.flags.libraryDiscountUsed) return 0;
+    const library = player.locations?.archive;
+    if (!library || library.cardId !== 'old-library' || library.sealed) return 0;
+    const archivePlay = (plan.kind === 'unit' && plan.location === 'archive')
+      || (plan.kind === 'location' && plan.location === 'archive');
+    if (!archivePlay) return 0;
+    return 1;
+  }
+
   _validateUnitPlay(p, card, action, face, sanityCost) {
     const player = this.state.players[p];
     const location = action.location;
     if (!LOCATIONS.includes(location)) return fail(`invalid location: ${location}`);

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -622,14 +622,22 @@
   }
 
   _validateEffectCardPlay(p, card, action, face) {
     const source = { kind: 'card', cardId: card.id, player: p, location: null, slot: null, inst: null };
+    if (!this._playConditionAllows(p, card.id, source, action.choice)) {
+      return fail(`${card.name} cannot be played right now`);
+    }
     const choiceError = this._validateEffectChoice(p, card, source, action.choice, false);
     if (choiceError) return fail(choiceError);
     void face;
     return { ok: true, kind: card.type };
   }
 
+  _playConditionAllows(p, cardId, source, choice) {
+    const ctx = makeContext(this, p, source, { trigger: TRIGGER.ON_PLAY, choice: choice ?? null });
+    return canPlayCard(this, ctx, cardId);
+  }
+
   _validateEquipmentPlay(p, card, action) {
     const player = this.state.players[p];
     const hostUid = action.hostUid;
     if (typeof hostUid !== 'string') return fail('equipment needs a hostUid');

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -685,26 +685,36 @@
     if (choiceList.length === 1 && choiceList[0] === null) {
       if (choice) return `${card.name} has no legal enter-effect target`;
       return null;
     }
-    if (!choice) return `${card.name} requires an enter-effect choice`;
-    const match = choiceList.find(
-      (entry) => entry && entry.mode === choice.mode
-        && (entry.targetUid ?? null) === (choice.targetUid ?? null),
-    );
+    if (!choice) {
+      // A skip/decline mode makes an omitted choice legal.
+      const skip = choiceList.find((entry) => entry && this._isSkipChoice(card.id, entry.mode));
+      return skip ? null : `${card.name} requires an enter-effect choice`;
+    }
+    const match = choiceList.find((entry) => choiceEntryMatches(entry, choice));
     if (!match) return `illegal enter-effect choice for ${card.name}`;
     return null;
   }
 
-  _effectChoiceList(p, cardId, source) {
+  _isSkipChoice(cardId, mode) {
     const entries = effectsFor(cardId) ?? [];
+    for (const entry of entries) {
+      if (!Array.isArray(entry.choices)) continue;
+      if (entry.choices.some((choice) => choice.id === mode && choice.skip)) return true;
+    }
+    return false;
+  }
+
+  _effectChoiceList(p, cardId, source, trigger = TRIGGER.ON_PLAY) {
+    const entries = effectsFor(cardId) ?? [];
     const modal = entries.find(
-      (entry) => entry.trigger === TRIGGER.ON_PLAY
+      (entry) => entry.trigger === trigger
         && Array.isArray(entry.choices)
         && entry.choices.length > 0,
     );
     if (!modal) return null;
-    const ctx = makeContext(this, p, source, { trigger: TRIGGER.ON_PLAY });
+    const ctx = makeContext(this, p, source, { trigger });
     return enumerateEffectChoices(this, ctx, modal);
   }
 
   _runOnPlay(p, inst, card, choice) {

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -731,19 +731,28 @@
     runTrigger(this, ctx, TRIGGER.ON_PLAY);
     void card;
   }
 
-  _runOnReveal(p, inst) {
+  _runOnReveal(p, inst, choice = null) {
     const entries = effectsFor(inst.cardId) ?? [];
     if (!entries.length) return;
-    const ctx = makeContext(this, p, {
+    const source = {
       kind: 'card',
       cardId: inst.cardId,
       inst,
       player: p,
       location: inst.location,
       slot: inst.slot,
-    }, { trigger: TRIGGER.ON_REVEAL });
+    };
+    const hasModal = entries.some(
+      (entry) => entry.trigger === TRIGGER.ON_REVEAL
+        && Array.isArray(entry.choices)
+        && entry.choices.length > 0,
+    );
+    // Forced reveals (night end, effect-driven reveals) have no interactive
+    // choice; resolve the first legal mode deterministically.
+    const resolvedChoice = hasModal && !choice ? this._autoChoice(p, inst, this.cardIndex[inst.cardId], TRIGGER.ON_REVEAL) : choice;
+    const ctx = makeContext(this, p, source, { trigger: TRIGGER.ON_REVEAL, choice: resolvedChoice });
     runTrigger(this, ctx, TRIGGER.ON_REVEAL);
   }
 
   // ── reveal ──────────────────────────────────────────────────────────

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -768,29 +768,45 @@
 
     const uids = action.uids;
     if (!Array.isArray(uids) || uids.length === 0) return fail('reveal needs at least one uid');
     if (new Set(uids).size !== uids.length) return fail('reveal uids must be unique');
+    if (action.choice && uids.length !== 1) {
+      return fail('a reveal choice needs exactly one revealed card');
+    }
     for (const uid of uids) {
       const target = resolveTargetByUid(this, uid);
       if (!target || target.kind !== 'unit' || target.player !== p) {
         return fail(`card ${uid} is not an own board unit`);
       }
       if (!target.inst.faceDown) return fail(`card ${uid} is already face-up`);
+      if (action.choice) {
+        const source = {
+          kind: 'card',
+          cardId: target.inst.cardId,
+          inst: target.inst,
+          player: p,
+          location: target.location,
+          slot: target.slot,
+        };
+        const choiceList = this._effectChoiceList(p, target.inst.cardId, source, TRIGGER.ON_REVEAL);
+        const match = choiceList && choiceList.find((entry) => choiceEntryMatches(entry, action.choice));
+        if (!match) return fail('illegal reveal choice');
+      }
     }
 
-    for (const uid of uids) this._revealByUid(uid, 'turn');
+    for (const uid of uids) this._revealByUid(uid, 'turn', action.choice ?? null);
     if (this._checkSanityZero()) return { ok: true };
     this._autoPassStuck();
     return { ok: true };
   }
 
-  _revealByUid(uid, via) {
+  _revealByUid(uid, via, choice = null) {
     const target = resolveTargetByUid(this, uid);
     if (!target || target.kind !== 'unit' || !target.inst.faceDown) return;
-    this._revealInstance(target.player, target.inst, target.location, target.slot, via);
+    this._revealInstance(target.player, target.inst, target.location, target.slot, via, choice);
   }
 
-  _revealInstance(p, inst, location, slot, via) {
+  _revealInstance(p, inst, location, slot, via, choice = null) {
     if (!inst.faceDown) return;
     inst.faceDown = false;
     this._emit({
       type: 'reveal',
@@ -803,9 +819,9 @@
       face: inst.face,
       via,
     });
     const card = this.cardIndex[inst.cardId];
-    this._runOnReveal(p, inst);
+    this._runOnReveal(p, inst, choice);
     this._maybeBacklash(p, inst, card, { context: 'reveal' });
   }
 
   // ── leader active skills ────────────────────────────────────────────

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1084,20 +1084,27 @@
     this._runOnPlay(p, inst, card, this._autoChoice(p, inst, card));
     this._maybeBacklash(p, inst, card, { context: 'entry' });
   }
 
-  _autoChoice(p, inst, card) {
+  _autoChoice(p, inst, card, trigger = TRIGGER.ON_PLAY) {
     const list = this._effectChoiceList(p, card.id, {
       kind: 'card',
       cardId: card.id,
       player: p,
       location: inst.location,
       slot: inst.slot,
       inst,
-    });
+    }, trigger);
     if (!list || !list.length) return null;
-    const first = list.find((entry) => entry);
-    return first ? { mode: first.mode, targetUid: first.targetUid } : null;
+    const first = list.find((entry) => entry && !this._isSkipChoice(card.id, entry.mode));
+    return first
+      ? {
+        mode: first.mode,
+        targetUid: first.targetUid,
+        secondaryUids: first.secondaryUids ?? [],
+        replaceWithUid: first.replaceWithUid ?? null,
+      }
+      : null;
   }
 
   // ── sacrifice / abyss ───────────────────────────────────────────────
 

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1876,23 +1876,51 @@
     if (state.phase !== 'play' || p !== state.current) return [];
     if (state.passed[p] || state.turnActionTaken) return [];
     const actions = [];
     const all = [];
+    let modalPending = false;
     for (const location of LOCATIONS) {
       const row = state.players[p].board[location];
       for (let slot = 0; slot < row.length; slot++) {
         const inst = row[slot];
         if (!inst?.faceDown) continue;
         all.push(inst.uid);
-        actions.push({
-          type: 'reveal',
+        const source = {
+          kind: 'card',
+          cardId: inst.cardId,
+          inst,
           player: p,
-          uids: [inst.uid],
-          label: `Reveal ${this.cardIndex[inst.cardId]?.name ?? inst.cardId} at ${LOCATION_LABELS[location]}#${slot}`,
-        });
+          location,
+          slot,
+        };
+        const choices = this._effectChoiceList(p, inst.cardId, source, TRIGGER.ON_REVEAL);
+        if (choices && !(choices.length === 1 && choices[0] === null)) {
+          modalPending = true;
+          for (const choice of choices) {
+            actions.push({
+              type: 'reveal',
+              player: p,
+              uids: [inst.uid],
+              choice: {
+                mode: choice.mode,
+                targetUid: choice.targetUid,
+                secondaryUids: choice.secondaryUids ?? [],
+                replaceWithUid: choice.replaceWithUid ?? null,
+              },
+              label: `Reveal ${this.cardIndex[inst.cardId]?.name ?? inst.cardId} (${choice.label})`,
+            });
+          }
+        } else {
+          actions.push({
+            type: 'reveal',
+            player: p,
+            uids: [inst.uid],
+            label: `Reveal ${this.cardIndex[inst.cardId]?.name ?? inst.cardId} at ${LOCATION_LABELS[location]}#${slot}`,
+          });
+        }
       }
     }
-    if (all.length > 1) {
+    if (all.length > 1 && !modalPending) {
       actions.push({ type: 'reveal', player: p, uids: all, label: 'Reveal all face-down cards' });
     }
     return actions;
   }

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1239,8 +1239,21 @@
     if (!target?.inst) throw new Error('seal needs a concrete card target');
     if (target.kind === 'unit' && target.inst.faceDown) {
       throw new Error('face-down cards cannot be sealed');
     }
+    if (isSealImmune(this.state, target.player, target.inst, target.location ?? null)) {
+      this._emit({
+        type: 'sealBlocked',
+        player: ctx?.controller ?? null,
+        targetPlayer: target.player,
+        uid: target.uid,
+        cardId: target.inst.cardId,
+        kind: target.kind,
+        reason: 'immune',
+      });
+      return false;
+    }
+    if (this._trySilverLantern(target, 'seal')) return false;
     const refreshed = !!target.inst.sealed;
     target.inst.sealed = true;
     target.inst.sealedNight = this.state.night;
     this._emit({
@@ -1252,10 +1265,66 @@
       kind: target.kind,
       duration,
       refreshed,
     });
+    return true;
   }
 
+  /**
+   * Silver Lantern replacement (§5.6/§9.9): when the equipped host is about to
+   * be sealed or destroyed, discard the unsealed lantern instead and cancel
+   * the event.  Sacrifice/devour never route through this helper.
+   */
+  _trySilverLantern(target, eventKind) {
+    if (target?.kind !== 'unit' || !target.inst) return false;
+    const equipment = target.inst.equipment;
+    if (!equipment || equipment.sealed) return false;
+    const spec = equipmentSpecFor(equipment.cardId);
+    if (!spec) return false;
+    if (eventKind === 'seal' && !spec.replaceOnSeal) return false;
+    if (eventKind === 'destroy' && !spec.replaceOnDestroy) return false;
+    target.inst.equipment = null;
+    equipment.attachedTo = null;
+    this._discardInstance(target.player, equipment, 'silverLantern');
+    this._emit({
+      type: 'silverLanternReplace',
+      player: target.player,
+      hostUid: target.uid,
+      equipmentUid: equipment.uid,
+      event: eventKind,
+    });
+    return true;
+  }
+
+  _sealLeader(targetPlayer, duration = 'untilNextNight', ctx = null) {
+    const player = this.state.players[targetPlayer];
+    if (!player?.leaderId) return false;
+    const refreshed = !!player.leaderSealed;
+    player.leaderSealed = true;
+    this._emit({
+      type: 'sealLeader',
+      player: ctx?.controller ?? null,
+      targetPlayer,
+      leaderId: player.leaderId,
+      duration,
+      refreshed,
+    });
+    return true;
+  }
+
+  _removeSeal(target) {
+    if (!target?.inst || !target.inst.sealed) return;
+    target.inst.sealed = false;
+    target.inst.sealedNight = null;
+    this._emit({
+      type: 'sealRemoved',
+      targetPlayer: target.player,
+      uid: target.uid,
+      cardId: target.inst.cardId,
+      kind: target.kind,
+    });
+  }
+
   _applyCorruption(controller, target, amount = 1, ctx = null) {
     if (!target?.inst || target.kind !== 'unit') return;
     if (target.inst.faceDown) return;
     const { state } = this;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1326,8 +1326,9 @@
 
   _applyCorruption(controller, target, amount = 1, ctx = null) {
     if (!target?.inst || target.kind !== 'unit') return;
     if (target.inst.faceDown) return;
+    if (isCorruptionImmune(this.state, target.player, target.inst, target.location ?? null)) return;
     const { state } = this;
     const inst = target.inst;
     inst.corruptionTokens ??= [];
     if (inst.corruptionTokens.length >= 3) return;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1396,22 +1396,25 @@
       return;
     }
     const inst = hand[randInt(state, hand.length)];
     const card = this.cardIndex[inst.cardId];
-    state.players[controller].privateNotes.push({
-      night: state.night,
-      sourceUid: options.source?.inst?.uid ?? null,
-      targetPlayer,
-      cardId: inst.cardId,
-      name: card?.name ?? inst.cardId,
-    });
+    const isPrivate = options.private !== false;
+    if (isPrivate) {
+      state.players[controller].privateNotes.push({
+        night: state.night,
+        sourceUid: options.source?.inst?.uid ?? null,
+        targetPlayer,
+        cardId: inst.cardId,
+        name: card?.name ?? inst.cardId,
+      });
+    }
     this._emit({
       type: 'peek',
       player: controller,
       targetPlayer,
       cardId: inst.cardId,
       name: card?.name ?? inst.cardId,
-      private: options.private !== false,
+      private: isPrivate,
       night: state.night,
       sourceUid: options.source?.inst?.uid ?? null,
     });
   }

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -18,8 +18,9 @@
   LOCATION_LABELS,
   SANITY_MIN,
   clampSanity,
   countCards,
+  currentUnitPower,
   faceForSanity,
   hasBacklash,
   hasKeyword,
   hasUnsealedAltar,

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1490,9 +1490,11 @@
   _devour(p, uid, options = {}) {
     const source = options.sourceUid ? resolveTargetByUid(this, options.sourceUid) : null;
     const target = resolveTargetByUid(this, uid);
     if (!target || target.kind !== 'unit') return;
-    const power = target.power ?? 0;
+    // §6.4: Bell-Claw permanently gains the devoured unit's *current* power,
+    // including equipment / night / chain bonuses.
+    const power = currentUnitPower(this.state, target.player, target.inst, target.location, target.slot);
     const sacrificed = this._sacrificeUnit(p, uid, {
       sourceUid: source?.uid ?? null,
       allowReplacement: false,
     });

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1486,8 +1486,155 @@
     this._emit({ type: 'abyssToHand', player: p, uid: inst.uid, cardId: inst.cardId });
     return inst;
   }
 
+  _moveDeckToHand(p, uid) {
+    const player = this.state.players[p];
+    const index = player.deck.findIndex((inst) => inst.uid === uid);
+    if (index < 0) return null;
+    const inst = player.deck.splice(index, 1)[0];
+    inst.zone = 'hand';
+    inst.faceDown = false;
+    inst.face = faceForSanity(player.sanity);
+    player.hand.push(inst);
+    this._emit({ type: 'deckToHand', player: p, uid: inst.uid, cardId: inst.cardId });
+    return inst;
+  }
+
+  _revealDeckTop(p, count = 3) {
+    const player = this.state.players[p];
+    const shown = player.deck.slice(0, count).map((inst) => ({
+      uid: inst.uid,
+      cardId: inst.cardId,
+      name: this.cardIndex[inst.cardId]?.name ?? inst.cardId,
+    }));
+    this._emit({ type: 'revealDeckTop', player: p, count: shown.length, cards: shown });
+    return shown;
+  }
+
+  _shuffleDeck(p) {
+    const player = this.state.players[p];
+    player.deck = shuffle(this.state, player.deck);
+    this._emit({ type: 'shuffleDeck', player: p, count: player.deck.length });
+  }
+
+  /**
+   * Register a persistent aura.  `record` is pure data (see registry addAura
+   * ops); `target` is the chosen card/location-row.  Scoring reads these
+   * records for power/seal/corruption modifiers, engine removes them on the
+   * appropriate night boundary.
+   */
+  _addAura(record, target = null) {
+    const state = this.state;
+    const scope = { ...(record.scope ?? {}) };
+    if (scope.locationFromTarget) {
+      scope.location = target?.location ?? null;
+      delete scope.locationFromTarget;
+    }
+    const aura = {
+      id: `aura-${state.effects.length + 1}-${record.cardId ?? 'effect'}`,
+      kind: 'aura',
+      cardId: record.cardId ?? null,
+      sourceUid: record.sourceUid ?? null,
+      sourcePlayer: record.sourcePlayer,
+      duration: record.duration ?? 'thisNight',
+      requiresSourceActive: !!record.requiresSourceActive,
+      scope,
+      modifiers: { ...(record.modifiers ?? {}) },
+      targetUid: target?.uid ?? null,
+      location: scope.location ?? null,
+    };
+    state.effects.push(aura);
+    this._emit({
+      type: 'auraAdded',
+      player: record.sourcePlayer,
+      cardId: aura.cardId,
+      duration: aura.duration,
+      location: aura.location,
+      modifiers: { ...aura.modifiers },
+    });
+    return aura;
+  }
+
+  _expireAuras(duration) {
+    const state = this.state;
+    if (!state.effects?.length) return;
+    const kept = [];
+    for (const aura of state.effects) {
+      if (aura.duration === duration) {
+        this._emit({
+          type: 'auraExpired',
+          player: aura.sourcePlayer,
+          cardId: aura.cardId,
+          duration,
+        });
+      } else {
+        kept.push(aura);
+      }
+    }
+    state.effects = kept;
+  }
+
+  /** Move any on-field card/environment to its owner's ordinary discard pile. */
+  _removeFromPlay(target, reason = 'effect') {
+    const state = this.state;
+    if (!target) return false;
+    const player = state.players[target.player];
+    if (target.kind === 'environment') {
+      const index = state.environments.findIndex((inst) => inst.uid === target.uid);
+      if (index < 0) return false;
+      const inst = state.environments.splice(index, 1)[0];
+      this._discardInstance(inst.owner ?? target.player, inst, reason);
+      return true;
+    }
+    if (target.kind === 'attached') {
+      const host = target.host
+        ?? player.board[target.location]?.[target.slot];
+      if (host?.equipment?.uid === target.uid) {
+        const inst = host.equipment;
+        host.equipment = null;
+        inst.attachedTo = null;
+        this._discardInstance(target.player, inst, reason);
+        return true;
+      }
+      return false;
+    }
+    if (target.kind === 'location') {
+      const inst = player.locations?.[target.location];
+      if (!inst || inst.uid !== target.uid) return false;
+      player.locations[target.location] = null;
+      this._discardInstance(target.player, inst, reason);
+      return true;
+    }
+    if (target.kind === 'unit') {
+      const row = player.board[target.location];
+      const inst = row?.[target.slot];
+      if (!inst || inst.uid !== target.uid) return false;
+      this._detachEquipment(target.player, inst, 'hostLeft');
+      row[target.slot] = null;
+      inst.location = null;
+      inst.slot = null;
+      this._discardInstance(target.player, inst, reason);
+      return true;
+    }
+    return false;
+  }
+
+  /** Generic destroy primitive (currently only exercised by tests). */
+  _destroyTarget(target, reason = 'destroy') {
+    if (!target) return false;
+    if (target.kind === 'unit' && this._trySilverLantern(target, 'destroy')) return false;
+    this._emit({
+      type: 'destroy',
+      targetPlayer: target.player,
+      uid: target.uid,
+      cardId: target.inst?.cardId ?? null,
+      kind: target.kind,
+      reason,
+    });
+    return this._removeFromPlay(target, reason);
+  }
+
   _devour(p, uid, options = {}) {
     const source = options.sourceUid ? resolveTargetByUid(this, options.sourceUid) : null;
     const target = resolveTargetByUid(this, uid);
     if (!target || target.kind !== 'unit') return;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1715,8 +1715,9 @@
     state.night = night;
 
     // 1. Expire "until next night" effects.
     this._expireSeals();
+    this._expireAuras('untilNextNight');
 
     // 2. Reset per-night counters.
     for (const player of state.players) {
       player.leaderUsedThisNight = false;

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -1962,10 +1962,9 @@
           if (inst) inst.thisNightPower = 0;
         }
       }
     }
-    state.effects = state.effects.filter((entry) => entry.duration !== 'thisNight');
-  }
+    state.effects = state.effects.filter((entry) => entry.duration !== 'thisNight');  }
 
   _finalTiebreak() {
     const state = this.state;
     const nightWins = state.nightWins.slice();

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -2194,9 +2194,14 @@
                     location,
                     slot,
                     faceDown,
                     face,
-                    choice: { mode: choice.mode, targetUid: choice.targetUid },
+                    choice: {
+                      mode: choice.mode,
+                      targetUid: choice.targetUid,
+                      secondaryUids: choice.secondaryUids ?? [],
+                      replaceWithUid: choice.replaceWithUid ?? null,
+                    },
                     label: `Play ${card.name} → ${LOCATION_LABELS[location]}#${slot}${faceDown ? ' (face-down)' : ''} (${choice.label})`,
                   });
                 }
               } else {

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -2225,8 +2225,9 @@
       }
 
       if (card.type === 'event' || card.type === 'ritual') {
         const source = { kind: 'card', cardId: card.id, player: p, location: null, slot: null, inst: null };
+        if (!this._playConditionAllows(p, card.id, source, null)) continue;
         const choices = this._effectChoiceList(p, card.id, source);
         if (choices && choices.length && choices[0] !== null) {
           for (const choice of choices) {
             actions.push({
@@ -2237,9 +2238,14 @@
               location: null,
               slot: null,
               faceDown: false,
               face,
-              choice: { mode: choice.mode, targetUid: choice.targetUid },
+              choice: {
+                mode: choice.mode,
+                targetUid: choice.targetUid,
+                secondaryUids: choice.secondaryUids ?? [],
+                replaceWithUid: choice.replaceWithUid ?? null,
+              },
               label: `Play ${card.name} (${choice.label})`,
             });
           }
         } else {

> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/view.js
Index: src/engine/v2/view.js
===================================================================
--- src/engine/v2/view.js
+++ src/engine/v2/view.js
@@ -73,11 +73,14 @@
     delete out.name;
     delete out.face;
   }
   if (out.type === 'peek' && out.player !== pov) {
-    delete out.cardId;
-    delete out.name;
-    delete out.sourceUid;
+    // Arthur's shown card is public (§9.10); only private peeks are redacted.
+    if (out.private !== false) {
+      delete out.cardId;
+      delete out.name;
+      delete out.sourceUid;
+    }
   }
   return out;
 }
 

> build · deepseek-v4.1-flash-free
$ node --input-type=module -e "import { createGame } from './src/engine/v2/index.js'; const g=createGame({seed:1}); console.log(g.phase, g.getActions().length);"
mulligan 74
> build · deepseek-v4.1-flash-free
$ node --test tests/v2/engine-core.test.mjs tests/v2/effects-pilot.test.mjs 2>&1 | Select-Object -Last 40
...
# Subtest: tie night: both lose 1 sanity and the previous first player keeps priority
ok 20 - tie night: both lose 1 sanity and the previous first player keeps priority
  ---
  duration_ms: 0.5173
  type: 'test'
  ...
# Subtest: sanity zero is an immediate loss; simultaneous zero is a draw
ok 21 - sanity zero is an immediate loss; simultaneous zero is a draw
  ---
  duration_ms: 0.8456
  type: 'test'
  ...
# Subtest: three nights: loser starts next night, tie keeps priority, final tiebreak resolves
ok 22 - three nights: loser starts next night, tie keeps priority, final tiebreak resolves
  ---
  duration_ms: 1.803
  type: 'test'
  ...
# Subtest: dream admission: affinity, stealth face-down entry, and the per-night limit
ok 23 - dream admission: affinity, stealth face-down entry, and the per-night limit
  ---
  duration_ms: 1.069
  type: 'test'
  ...
# Subtest: random legal self-play never crashes or deadlocks
ok 24 - random legal self-play never crashes or deadlocks
  ---
  duration_ms: 38.4792
  type: 'test'
  ...
1..24
# tests 24
# suites 0
# pass 24
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 277.3927
> build · deepseek-v4.1-flash-free
$ node scripts/selfplay.mjs --games=200 2>&1 | Select-Object -Last 40
Greyharbor v2.2 self-play
{
  "ok": true,
  "games": 200,
  "elapsedMs": 208,
  "avgMsPerGame": 1.04,
  "maxGameMs": 9,
  "wins": {
    "p0": 137,
    "p1": 63,
    "draw": 0
  },
  "reasons": {
    "sanity": 126,
    "nightWins": 74
  },
  "endingNight": {
    "1": 34,
    "2": 138,
    "3": 28
  },
  "totalActions": 4465,
  "avgActionsPerGame": 22.32,
  "maxActionsPerGame": 35,
  "sanityEndingRatio": 0.63,
  "conservation": "ok"
}
> build · deepseek-v4.1-flash-free
$ node --input-type=module -e "
import { createGame } from './src/engine/v2/index.js';
import { hashSeed, nextRandom } from './src/engine/rng.js';
const random={rngState:hashSeed('x')}; const pick=(a)=>a[Math.floor(nextRandom(random)*a.length)];
const tally={}; let games=0, sanityEnd=0, totalNights=0;
for(let i=0;i<50;i++){
 const g=createGame({seed:'d'+i});
 for(const p of [0,1]) g.apply({type:'mulligan',player:p,uids:[]});
 let n=0;
 while(g.phase!=='gameOver'&&n++<400){const a=g.getActions(); g.apply(pick(a));}
 games++; totalNights+=g.state.night;
 if(g.result().reason==='sanity') sanityEnd++;
 for(const e of g.state.events){ if(e.type==='sanityChange'&&e.reason!=='sanityCost'){tally[e.reason]=(tally[e.reason]??0)+(-e.to+e.from);} }
}
console.log({games,sanityEnd,totalNights,avgNight:totalNights/games});
console.log(tally);
"
{ games: 50, sanityEnd: 29, totalNights: 103, avgNight: 2.06 }
{
  nightLoss: 76,
  whisperer: 17,
  societyPassive: -41,
  leaderHarold: -16,
  theSleeperEntry: 53,
  backlash: 19,
  theSleeperNight: 7
}
> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/effects/targets.js
Index: src/engine/v2/effects/targets.js
===================================================================
--- src/engine/v2/effects/targets.js
+++ src/engine/v2/effects/targets.js
@@ -65,11 +65,13 @@
         if (selector.cardId && inst.cardId !== selector.cardId) continue;
         if (selector.sealed !== undefined && !!inst.sealed !== selector.sealed) continue;
         if (selector.faceDown !== undefined && !!inst.faceDown !== selector.faceDown) continue;
         if (selector.adjacentToSource) {
-          const source = ctx.source?.inst;
-          if (!source || ctx.source.location !== location) continue;
-          if (Math.abs(ctx.source.slot - slot) !== 1) continue;
+          const sourceLocation = ctx.source?.location;
+          const sourceSlot = ctx.source?.slot;
+          if (!sourceLocation || sourceLocation !== location) continue;
+          if (!Number.isInteger(sourceSlot)) continue;
+          if (Math.abs(sourceSlot - slot) !== 1) continue;
         }
         if (selector.hasCorruption && !(inst.corruptionTokens?.length > 0)) continue;
         if (selector.canReceiveCorruption && !canReceiveCorruption(state, p, inst, location)) continue;
         if (selector.corruptionImmune === true && !isCorruptionImmune(state, p, inst, location)) continue;

> build · deepseek-v4.1-flash-free
$ node --input-type=module -e "
import { EFFECT_REGISTRY } from './src/engine/v2/effects/registry.js';
const ids = Object.keys(EFFECT_REGISTRY);
console.log(ids.length);
for (const id of ids) console.log(id, Array.isArray(EFFECT_REGISTRY[id]) ? EFFECT_REGISTRY[id].map(e=>e.id).join(',') : 'null');
"
30
harold-ashby harold-seal
elias-thorne elias-summon
nora-wells nora-peek
samuel-pike pike-choice
edith-barrow edith-chain
walter-morse walter-backlash
lucia-vaughn null
frank-holt null
arthur-pendleton arthur-show
abjuration abjuration-choice
warding-rite warding-rite
silver-lantern silver-lantern-passive
old-library old-library-passive
hooded-acolyte acolyte-replacement
zealot zealot-madness
sea-priestess priestess-corruption
gravedigger gravedigger
whisperer whisperer-drain
deep-one deep-one-madness
bell-claw bell-claw-devour
seance seance
tide-ritual tide-ritual
lunar-eclipse lunar-eclipse
drowned-altar drowned-altar-passive
finn-calloway null
silas-gold silas-gold
the-sleeper the-sleeper-entry,the-sleeper-night
thousand-eyes thousand-eyes-seal,thousand-eyes-static
stormy-night stormy-night
unexpected-aid unexpected-aid
$ node --test tests/v2/ 2>&1 | Select-Object -Last 20
not ok 1 - tests\\v2
  ---
  duration_ms: 62.5312
  type: 'test'
  location: 'D:\\Games\\greyharbor\\tests\\v2:1:1'
  failureType: 'testCodeFailure'
  exitCode: 1
  signal: ~
  error: 'test failed'
  code: 'ERR_TEST_FAILURE'
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 69.7056
> build · deepseek-v4.1-flash-free
$ Get-ChildItem tests/v2
Directory: D:\Games\greyharbor\tests\v2

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026/11/25    11:56          29419 effects-pilot.test.mjs
-a---          2026/11/25    11:43          19980 engine-core.test.mjs
$ node --test tests/v2/engine-core.test.mjs tests/v2/effects-pilot.test.mjs 2>&1 | Select-Object -Last 15
# Subtest: random legal self-play never crashes or deadlocks
ok 24 - random legal self-play never crashes or deadlocks
  ---
  duration_ms: 40.4098
  type: 'test'
  ...
1..24
# tests 24
# suites 0
# pass 24
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 278.8686
> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/effects/interpreter.js 
$ grep -n "hasSacrificeTarget\|highestCurrentPower\|maxCurrentPower\|topN\|LOCATION_ROW\|deckEmpty\|case 'all'\|_removeFromPlay\|_destroyTarget\|_removeSeal\|_sealLeader\|_revealDeckTop\|_moveDeckToHand\|_shuffleDeck\|_addAura" src/engine/v2/effects/interpreter.js src/engine/v2/effects/targets.js src/engine/v2/engine.js
grep: The term 'grep' is not recognized as a name of a cmdlet, function, script file, or executable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/effects/targets.js 
> build · deepseek-v4.1-flash-free
$ Select-String -Path src/engine/v2/engine.js -Pattern "NIGHT_START|_validateEnvironmentPlay|_validateLocationPlay|_startNight|_endNight|_cleanupNight|_forcedSanityLoss|_sacrificeTargets|_replacementCandidates|_archiveDiscount|_isAberration|_applyPlayCard|_playCard|_sacrificeUnit" | ForEach-Object { "$($_.LineNumber): $($_.Line)" }
353:         return this._applyPlayCard(action);
401:       this._startNight(1);
408:   _applyPlayCard(action) {
444:         plan = this._validateLocationPlay(p, card, action);
447:         plan = this._validateEnvironmentPlay(p, card, action);
458:     const discount = this._archiveDiscount(p, plan, baseSanityCost);
568:   _archiveDiscount(p, plan, baseCost) {
659:   _validateLocationPlay(p, card, action) {
669:   _validateEnvironmentPlay(p, card, action) {
877:     const sacrificeTargets = this._sacrificeTargets(p);
884:       if (!this._isAberration(inst.cardId)) continue;
890:     const acolytes = this._replacementCandidates(p, null);
894:       for (const acolyte of this._replacementCandidates(p, sacrifice.inst.uid)) {
976:     const sacrificeTargets = this._sacrificeTargets(p);
982:       const replacement = this._replacementCandidates(p, sacrifice.inst.uid)
990:     if (!this._isAberration(summonedId)) return fail('Elias may only summon an aberration unit');
1007:     this._sacrificeUnit(p, sacrifice.inst.uid, {
1112:   _sacrificeTargets(p) {
1125:   _replacementCandidates(p, excludeUid) {
1140:   _sacrificeUnit(p, uid, options = {}) {
1158:       const replacement = this._replacementCandidates(p, uid)
1423:   _playCardFromDeck(p, uid, placement, options = {}) {
1644:     const sacrificed = this._sacrificeUnit(p, uid, {
1689:       this._endNight();
1713:   _startNight(night) {
1744:       this._forcedSanityLoss(p);
1828:   _forcedSanityLoss(p) {
1834:         const hasNightStart = entries.some((entry) => entry.trigger === TRIGGER.NIGHT_START);
1838:         }, { trigger: TRIGGER.NIGHT_START });
1839:         runTrigger(this, ctx, TRIGGER.NIGHT_START);
1856:   _endNight() {
1939:     this._cleanupNight();
1949:     this._startNight(state.night + 1);
1952:   _cleanupNight() {
2151:   _isAberration(cardId) {
> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/engine.js [offset=1650, limit=340]
> build · deepseek-v4.1-flash-free
→ Read src/engine/v2/engine.js [limit=140, offset=500]
> build · deepseek-v4.1-flash-free
$ Select-String -Path src/engine/v2/engine.js -Pattern "_runOnPlay\(|_runOnReveal\(|_maybeBacklash|_sealTarget\(|_trySilverLantern|_removeSeal|_sealLeader|_addAura" -Context 0,0 | ForEach-Object { "$($_.LineNumber): $($_.Line)" }
494:         this._runOnPlay(p, inst, card, action.choice ?? null);
495:         this._maybeBacklash(p, inst, card, { context: 'entry' });
511:       this._runOnPlay(p, inst, card, action.choice ?? null);
531:       this._runOnPlay(p, inst, card, action.choice ?? null);
546:       this._runOnPlay(p, inst, card, action.choice ?? null);
559:       this._runOnPlay(p, inst, card, action.choice ?? null);
721:   _runOnPlay(p, inst, card, choice) {
736:   _runOnReveal(p, inst, choice = null) {
824:     this._runOnReveal(p, inst, choice);
825:     this._maybeBacklash(p, inst, card, { context: 'reveal' });
961:     this._sealTarget(target, 'untilNextNight', ctx);
1085:     this._runOnPlay(p, inst, card, this._autoChoice(p, inst, card));
1086:     this._maybeBacklash(p, inst, card, { context: 'entry' });
1203:     this._maybeBacklash(p, sacrificed, card, { context: 'sacrifice', fromLocation, sealed: wasSealed });
1220:   _maybeBacklash(p, inst, card, { context, fromLocation = null, sealed = null } = {}) {
1239:   _sealTarget(target, duration = 'untilNextNight', ctx = null) {
1256:     if (this._trySilverLantern(target, 'seal')) return false;
1278:   _trySilverLantern(target, eventKind) {
1299:   _sealLeader(targetPlayer, duration = 'untilNextNight', ctx = null) {
1315:   _removeSeal(target) {
1526:   _addAura(record, target = null) {
1625:     if (target.kind === 'unit' && this._trySilverLantern(target, 'destroy')) return false;
> build · deepseek-v4.1-flash-free
Error: Free usage limit reached. Connect a provider or subscribe to OpenCode Go to keep going, or switch models.
