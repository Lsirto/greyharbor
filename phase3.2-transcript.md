
> build · hy4-flash-free
I'll start by exploring the codebase thoroughly to understand the existing architecture before implementing.
⚙ execute {"code":"const r = await tools.shell({command: \"dir /b\", workdir: \"D:\\\\Games\\\\greyharbor\"}); return r;"} 
> build · hy4-flash-free
✱ Glob "*" in . · 100 matches
> build · hy4-flash-free
→ Read package.json 
✱ Glob "src/ui-v2/**" in . · 14 matches
✱ Glob "src/styles-v2/**" in . · 4 matches
✱ Glob "src/ai/v2/**" in . · 3 matches
✱ Glob "src/engine/v2/**" in . · 11 matches
> build · hy4-flash-free
→ Read phase3.2-transcript.md 
→ Read src/ui-v2/board-render.mjs 
→ Read src/ai/v2/ai.mjs 
→ Read src/engine/v2/view.js 
> build · hy4-flash-free
→ Read src/engine/v2/engine.js [offset=1, limit=470]
> build · hy4-flash-free
→ Read src/engine/v2/engine.js [offset=880, limit=200]
> build · hy4-flash-free
→ Read src/engine/v2/engine.js [offset=2130, limit=260]
> build · hy4-flash-free
→ Read src/engine/v2/engine.js [offset=2390, limit=120]
> build · hy4-flash-free
✱ Grep "_advanceAfterAction|_autoPassStuck|_checkSanityZero|_resolveNight|phase = '|turnActionTaken" in src/engine/v2/engine.js · 31 matches
> build · hy4-flash-free
→ Read src/engine/v2/engine.js [offset=1720, limit=160]
> build · hy4-flash-free
→ Read src/engine/v2/engine.js [offset=1930, limit=200]
> build · hy4-flash-free
→ Read src/ui-v2/templates/hand.mjs 
→ Read src/ui-v2/templates/board.mjs 
→ Read src/ui-v2/templates/location-column.mjs 
→ Read src/ui-v2/templates/leader.mjs 
> build · hy4-flash-free
→ Read src/ui-v2/demo-controller.mjs 
→ Read src/ui-v2/templates/card.mjs 
> build · hy4-flash-free
→ Read game.html 
→ Read src/styles-v2/theme.css 
→ Read src/ui-v2/utils.mjs 
→ Read src/engine/v2/index.js 
> build · hy4-flash-free
→ Read scripts/selfplay.mjs 
→ Read src/engine/rng.js 
→ Read tests/ui-v2/render-templates.test.mjs 
> build · hy4-flash-free
✱ Grep "PRESET_DECKS|DEFAULT_DECK_ORDER|harold|elias" in src/engine/v2/cards.js · 4 matches
> build · hy4-flash-free
→ Read src/engine/v2/cards.js [offset=130, limit=30]
> build · hy4-flash-free
✱ Grep "gh2-modal|gh2-toast|gh2-legal|gh2-selected|gh2-marked|gh2-ai|gh2-dim|gh2-disabled" in src/styles-v2 · 0 matches
> build · hy4-flash-free
→ Read phase3.1-transcript.md [offset=1, limit=80]
> build · hy4-flash-free
$ Select-String -Path phase3.1-transcript.md -Pattern "120|tests|测试|GREEN|green" | Select-Object -Last 30 | ForEach-Object { $_.Line }
# tests 13
# tests 13
$ node --test tests/ai.test.mjs tests/card-data.test.mjs tests/data-audit.test.mjs tests/e2e.test.mjs tests/engine.test.mjs tests/ui-v2/render-templates.test.mjs 2>&1 | Select-String -Pattern '^# (tests|pass|fail|skipped)'
# tests 119
�� Edit tests/ui-v2/render-templates.test.mjs
Index: tests/ui-v2/render-templates.test.mjs
--- tests/ui-v2/render-templates.test.mjs
+++ tests/ui-v2/render-templates.test.mjs
�� Edit tests/ui-v2/render-templates.test.mjs
Index: tests/ui-v2/render-templates.test.mjs
--- tests/ui-v2/render-templates.test.mjs
+++ tests/ui-v2/render-templates.test.mjs
$ node --test tests/ai.test.mjs tests/card-data.test.mjs tests/data-audit.test.mjs tests/e2e.test.mjs tests/engine.test.mjs tests/ui-v2/render-templates.test.mjs 2>&1 | Select-String -Pattern '^# (tests|pass|fail|skipped)'
# tests 120
 ### ���Խ��
 - ���в��ԣ�`node --test tests/ai.test.mjs tests/card-data.test.mjs tests/data-audit.test.mjs tests/e2e.test.mjs tests/engine.test.mjs` �� **106 �104 pass / 0 fail / 2 skipped**������ skip Ϊԭ�� E2E ���ز��ԣ���
-- �������ԣ�`node --test tests/ui-v2/*.test.mjs` �� **13 ��ȫ��**�������ֶ���ȫ/ת�塢���Ʋ�й¶��˫����ʽ��ս�������ؼ������Ļձꡢ���� 6 �񡢵ص�С�ơ��������ƽ������������ݲ����쳣����ʵ buildView ������Ⱦ������/����/ҹ���㡢��ʾ�����Ϸ������� DOM �ƽ������̣���
+- �������ԣ�`node --test tests/ui-v2/*.test.mjs` �� **14 ��ȫ��**�������ֶ���ȫ/ת�塢���Ʋ�й¶��˫����ʽ��ս�������ؼ������Ļձꡢ���� 6 �񡢵ص�С�ơ��������ƽ������������ݲ����쳣����ʵ buildView ������Ⱦ������/����/ҹ���㡢��ʾ�����Ϸ������� DOM �ƽ������̣���
 ### ���Խ��
 - ���в��ԣ�`node --test tests/ai.test.mjs tests/card-data.test.mjs tests/data-audit.test.mjs tests/e2e.test.mjs tests/engine.test.mjs` �� **106 �104 pass / 0 fail / 2 skipped**������ skip Ϊԭ�� E2E ���ز��ԣ���
 - �������ԣ�`node --test tests/ui-v2/*.test.mjs` �� **14 ��ȫ��**�������ֶ���ȫ/ת�塢���Ʋ�й¶��˫����ʽ��ս�������ؼ������Ļձꡢ���� 6 �񡢵ص�С�ơ��������ƽ������������ݲ����쳣����ʵ buildView ������Ⱦ������/����/ҹ���㡢��ʾ�����Ϸ������� DOM �ƽ������̣���
+- �ϼƣ�**120 �118 pass / 2 pre-existing skipped / 0 fail**��
-�׶� 3.1 ������ɣ���ʵ `buildView` ����������������й�ͨ�����̡����ơ��ص㡢���������ǡ�������״̬��������� untouched������ 106 ����������� 13 �����ȫ�̣�2 ����� skip�������Խ�����һ�׶ν�����Ҳ�����
+�׶� 3.1 ������ɣ���ʵ `buildView` ����������������й�ͨ�����̡����ơ��ص㡢���������ǡ�������״̬��������� untouched������ 106 ����������� 14 �����ȫ�̣�2 ����� skip�������Խ�����һ�׶ν�����Ҳ�����
- `tests/ui-v2/render-templates.test.mjs`
### ��������
- **120 �118 pass / 0 fail / 2 skipped**
  - ���� 106 �104 pass��2 skipped��ԭ�� E2E ���ز��ԣ�
4. ��ʾ��ע��ʽ RNG ��������ƫ�õļ�Ȩ���ѡ�������ǲ��� AI��ϡ��״̬�������ȡ���ڹ̶����ӣ���ģ������Ծ���֧�֡�
��ʵ `buildView` �������Ѵ������ͨ�����̡����ơ��ص㡢���������ǡ�������״̬��������������������������²���ȫ�̡��׶� 3.1 Ŀ���ɣ��ɽ�����һ�׶ν�����Ҳ�����
> build · hy4-flash-free
$ Select-String -Path phase2.4-transcript.md -Pattern "node --test" | Select-Object -Last 10 | ForEach-Object { $_.Line }
$ node --test "tests/v2/*.test.mjs" "tests/ai-v2/*.test.mjs" 2>&1 | Select-Object -Last 20
$ node --test tests/v2/deck-validation.test.mjs 2>&1 | Select-Object -Last 60
$ node --test tests/v2/deck-validation.test.mjs 2>&1 | Select-String -Pattern "not ok|expected|actual|error:|code:|AssertionError" -Context 0,12
$ node --test tests/v2/deck-validation.test.mjs 2>&1 | Select-Object -Last 12
$ node --test "tests/v2/*.test.mjs" "tests/ai-v2/*.test.mjs" 2>&1 | Select-Object -Last 14
$ node --test tests/v2/deck-validation.test.mjs 2>&1 | Select-String -Pattern "^(ok|not ok) "
���� `tests/v2/deck-validation.test.mjs`��25/25 ͨ����ȫ���ع飺`node --test "tests/v2/*.test.mjs" "tests/ai-v2/*.test.mjs"` �� 82 tests / 82 pass / 0 fail��ԭ 57 + �� 25����
**����ͨ������**��ȫ�� `node --test "tests/v2/*.test.mjs" "tests/ai-v2/*.test.mjs"` �� **82 / 82**��ԭ 57 + ���� 25��0 ʧ�ܣ����������Ե��� 25 / 25��
> build · hy4-flash-free
I have a clear picture now. Let me implement the pure logic modules first.
← Write src/ui-v2/action-matcher.mjs
Created file successfully: src/ui-v2/action-matcher.mjs
> build · hy4-flash-free
← Write src/ui-v2/selection.mjs
Created file successfully: src/ui-v2/selection.mjs
> build · hy4-flash-free
← Edit src/ui-v2/selection.mjs
Index: src/ui-v2/selection.mjs
===================================================================
--- src/ui-v2/selection.mjs
+++ src/ui-v2/selection.mjs
@@ -155,9 +155,9 @@
       for (const uid of this._marked) {
         if (!next.has(uid)) return { ok: false, changed: false, reason: 'not-allowed' };
       }
     }
-    const changed = deepEqualSet(next, this._allowedUids);
+    const changed = setsDiffer(next, this._allowedUids);
     this._allowedUids = next;
     return { ok: true, changed };
   }
 

> build · hy4-flash-free
← Edit src/ui-v2/selection.mjs
Index: src/ui-v2/selection.mjs
===================================================================
--- src/ui-v2/selection.mjs
+++ src/ui-v2/selection.mjs
@@ -170,9 +170,9 @@
     };
   }
 }
 
-function deepEqualSet(a, b) {
+function setsDiffer(a, b) {
   if (a === b) return false;
   if (!a || !b || a.size !== b.size) return true;
   for (const uid of a) {
     if (!b.has(uid)) return true;

> build · hy4-flash-free
← Write src/ui-v2/game-controller.mjs
Created file successfully: src/ui-v2/game-controller.mjs
> build · hy4-flash-free
Now the interaction stylesheet and play page:
← Write src/styles-v2/interaction.css
Created file successfully: src/styles-v2/interaction.css
> build · hy4-flash-free
← Write play.html
Created file successfully: play.html
> build · hy4-flash-free
← Write C:/Users/31709/AppData/Local/Temp/opencode/probe.mjs
Created file successfully: C:/Users/31709/AppData/Local/Temp/opencode/probe.mjs
> build · hy4-flash-free
$ node C:\Users\31709\AppData\Local\Temp\opencode\probe.mjs
node:internal/modules/esm/load:199
    throw new ERR_UNSUPPORTED_ESM_URL_SCHEME(parsed, schemes);
          ^

Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data, and node are supported by the default ESM loader. On Windows, absolute paths must be valid file:// URLs. Received protocol 'd:'
    at throwIfUnsupportedURLScheme (node:internal/modules/esm/load:199:11)
    at defaultLoadSync (node:internal/modules/esm/load:146:3)
    at ModuleLoader.load (node:internal/modules/esm/loader:831:12)
    at ModuleLoader.loadAndTranslate (node:internal/modules/esm/loader:609:31)
    at #createModuleJob (node:internal/modules/esm/loader:640:36)
    at #getJobFromResolveResult (node:internal/modules/esm/loader:353:34)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:321:41) {
  code: 'ERR_UNSUPPORTED_ESM_URL_SCHEME'
}

Node.js v22.23.2
> build · hy4-flash-free
← Write C:/Users/31709/AppData/Local/Temp/opencode/probe.mjs
Wrote file successfully: C:/Users/31709/AppData/Local/Temp/opencode/probe.mjs
> build · hy4-flash-free
$ node C:\Users\31709\AppData\Local\Temp\opencode\probe.mjs
phase mulligan actions 163 mull [
  { type: 'mulligan', player: 0, uids: [], label: 'Keep hand' },
  {
    type: 'mulligan',
    player: 0,
    uids: [ 'p0-15' ],
    label: 'Mulligan 1 cards'
  },
  {
    type: 'mulligan',
    player: 0,
    uids: [ 'p0-1' ],
    label: 'Mulligan 1 cards'
  }
]
v1 actions 37
mulligan apply 0 [ 'p0-6' ] true
mulligan apply 1 [ 'p1-2', 'p1-1' ] true
play phase play current 0 actions 53
playCard 52 {"type":"playCard","player":0,"uid":"p0-15","cardId":"silas-gold","location":"archive","slot":0,"faceDown":false,"face":"reason","choice":null,"label":"Play Silas Gold → 档案#0"}
pass 1 {"type":"pass","player":0,"label":"Pass"}
> build · hy4-flash-free
← Write C:/Users/31709/AppData/Local/Temp/opencode/probe2.mjs
Created file successfully: C:/Users/31709/AppData/Local/Temp/opencode/probe2.mjs
> build · hy4-flash-free
$ node C:\Users\31709\AppData\Local\Temp\opencode\probe2.mjs
phase gameOver night 2
mulligan::::-: {"type":"mulligan","player":0,"uids":[],"label":"Keep hand"}
playCard::::-: {"type":"playCard","player":1,"uid":"p1-11","cardId":"tide-ritual","location":null,"slot":null,"faceDown":false,"face":"reason","choice":null,"label":"Play Tide Ritual"}
playCard::::scene: {"type":"playCard","player":1,"uid":"p1-9","cardId":"bell-claw","location":"scene","slot":0,"faceDown":false,"face":"reason","choice":null,"label":"Play Bell-Claw → 现场#0"}
playCard::::dream: {"type":"playCard","player":1,"uid":"p1-16","cardId":"the-sleeper","location":"dream","slot":0,"faceDown":false,"face":"reason","choice":null,"label":"Play The Sleeper → 梦境#0"}
playCard::::archive: {"type":"playCard","player":1,"uid":"p1-14","cardId":"finn-calloway","location":"archive","slot":0,"faceDown":false,"face":"reason","choice":null,"label":"Play Finn Calloway → 档案#0"}
playCard::down::dream: {"type":"playCard","player":1,"uid":"p1-7","cardId":"whisperer","location":"dream","slot":0,"faceDown":true,"face":"reason","choice":null,"label":"Play The Whisperer → 梦境#0 (face-down)"}
pass::::-: {"type":"pass","player":1,"label":"Pass"}
playCard::down::scene: {"type":"playCard","player":0,"uid":"p0-1","cardId":"nora-wells","location":"scene","slot":0,"faceDown":true,"face":"reason","choice":null,"label":"Play Nora Wells → 现场#0 (face-down)"}
playCard::down::archive: {"type":"playCard","player":0,"uid":"p0-16","cardId":"silas-gold","location":"archive","slot":0,"faceDown":true,"face":"reason","choice":null,"label":"Play Silas Gold → 档案#0 (face-down)"}
playCard:::choice:scene: {"type":"playCard","player":0,"uid":"p0-3","cardId":"samuel-pike","location":"scene","slot":0,"faceDown":false,"face":"reason","choice":{"mode":"seal","targetUid":"p1-14","secondaryUids":[],"replaceWithUid":null},"label":"Play Dr. Samuel Pike → 现场#0 (Seal an enemy unit with current power <= 4)"}
useLeader::::-:target {"type":"useLeader","player":0,"leaderId":"harold-ashby","targetUid":"p1-14","label":"harold-ashby: seal p1-14"}
useLeader::::archive: {"type":"useLeader","player":1,"leaderId":"elias-thorne","sacrificeUid":"p1-14","replaceWithUid":null,"cardUid":"p1-5","location":"archive","slot":0,"label":"elias-thorne: sacrifice p1-14 → sea-priestess @ archive#0"}
useLeader::::scene: {"type":"useLeader","player":1,"leaderId":"elias-thorne","sacrificeUid":"p1-14","replaceWithUid":null,"cardUid":"p1-4","location":"scene","slot":0,"label":"elias-thorne: sacrifice p1-14 → zealot @ scene#0"}
useLeader::::dream: {"type":"useLeader","player":1,"leaderId":"elias-thorne","sacrificeUid":"p1-14","replaceWithUid":null,"cardUid":"p1-8","location":"dream","slot":0,"label":"elias-thorne: sacrifice p1-14 → deep-one @ dream#0"}
playCard:host:::scene: {"type":"playCard","player":0,"uid":"p0-12","cardId":"silver-lantern","hostUid":"p0-3","location":"scene","slot":2,"face":"reason","label":"Attach The Silver Lantern → 现场#2"}
playCard:host:::archive: {"type":"playCard","player":0,"uid":"p0-12","cardId":"silver-lantern","hostUid":"p0-17","location":"archive","slot":2,"face":"reason","label":"Attach The Silver Lantern → 档案#2"}
reveal::::-: {"type":"reveal","player":1,"uids":["p1-7"],"label":"Reveal The Whisperer at 梦境#2"}
playCard:::choice:-: {"type":"playCard","player":1,"uid":"p1-19","cardId":"unexpected-aid","location":null,"slot":null,"faceDown":false,"face":"madness","choice":{"mode":"aid","targetUid":"p1-9","secondaryUids":[],"replaceWithUid":null},"label":"Play Unexpected Aid (Target a friendly face-up unit: +3, remove all seals and corruption)"}
> build · hy4-flash-free
← Write tests/ui-v2/action-matcher.test.mjs
Created file successfully: tests/ui-v2/action-matcher.test.mjs
> build · hy4-flash-free
← Edit tests/ui-v2/action-matcher.test.mjs
Index: tests/ui-v2/action-matcher.test.mjs
===================================================================
--- tests/ui-v2/action-matcher.test.mjs
+++ tests/ui-v2/action-matcher.test.mjs
@@ -126,9 +126,11 @@
     }),
     null,
   );
 
-  const event = first((action) => action?.type === 'playCard' && action.location === null && action.slot === null);
+  const event = first((action) =>
+    action?.type === 'playCard' && action.location === null && action.slot === null && action.choice === null,
+  );
   assert.strictEqual(
     matchAction(event.view.actions, {
       type: 'playCard', uid: event.action.uid, location: null, slot: null,
     }),

> build · hy4-flash-free
← Write tests/ui-v2/selection.test.mjs
Created file successfully: tests/ui-v2/selection.test.mjs
> build · hy4-flash-free
← Edit tests/ui-v2/selection.test.mjs
Index: tests/ui-v2/selection.test.mjs
===================================================================
--- tests/ui-v2/selection.test.mjs
+++ tests/ui-v2/selection.test.mjs
@@ -83,9 +83,9 @@
   const state = fresh();
   for (const uid of ['p0-999', '', null, 42, {}]) {
     const result = state.mark(uid);
     assert.equal(result.ok, false, `${String(uid)} 不应被接受`);
-    assert.equal(result.reason, 'invalid-uid' === result.reason ? 'invalid-uid' : result.reason);
+    assert.ok(result.reason, '拒绝时必须给出原因');
   }
   assert.deepEqual(state.markedUids, []);
   assert.equal(state.toggleMark('p0-999').ok, false);
   assert.deepEqual(state.markedUids, []);

> build · hy4-flash-free
$ node --test tests/ui-v2/action-matcher.test.mjs tests/ui-v2/selection.test.mjs 2>&1 | Select-Object -Last 80
type: 'test'
  ...
# Subtest: 坏数据不抛异�?ok 7 - 坏数据不抛异�?  ---
  duration_ms: 0.3584
  type: 'test'
  ...
# Subtest: 真实手牌与合法上限驱动初始状�?ok 8 - 真实手牌与合法上限驱动初始状�?  ---
  duration_ms: 1.3364
  type: 'test'
  ...
# Subtest: 选牌：点击选中、再次点击取消、无�?uid 清空
not ok 9 - 选牌：点击选中、再次点击取消、无�?uid 清空
  ---
  duration_ms: 1.0745
  type: 'test'
  location: 'D:\\Games\\greyharbor\\tests\\ui-v2\\selection.test.mjs:37:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
    + actual - expected
    
    + {
    +   changed: true,
    +   ok: true
    + }
    - true
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: true
  actual:
    ok: true
    changed: true
  operator: 'strictEqual'
  stack: |-
    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/ui-v2/selection.test.mjs:43:10)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
    Test.postRun (node:internal/test_runner/test:1173:19)
    Test.run (node:internal/test_runner/test:1101:12)
    async startSubtestAfterBootstrap (node:internal/test_runner/harness:296:3)
  ...
# Subtest: 换牌标记集合：toggle / unmark / 上限校验
ok 10 - 换牌标记集合：toggle / unmark / 上限校验
  ---
  duration_ms: 0.3591
  type: 'test'
  ...
# Subtest: 越界 uid / 非字符串 uid 拒绝且不改变状�?ok 11 - 越界 uid / 非字符串 uid 拒绝且不改变状�?  ---
  duration_ms: 0.1494
  type: 'test'
  ...
# Subtest: setMarked 原子替换，重�?越界/超限整体拒绝
ok 12 - setMarked 原子替换，重�?越界/超限整体拒绝
  ---
  duration_ms: 0.2957
  type: 'test'
  ...
# Subtest: reset / restore 快照后仍可用于真�?mulligan 动作匹配
ok 13 - reset / restore 快照后仍可用于真�?mulligan 动作匹配
  ---
  duration_ms: 1.3632
  type: 'test'
  ...
# Subtest: 坏数据构造与调用不抛异常
ok 14 - 坏数据构造与调用不抛异常
  ---
  duration_ms: 0.354
  type: 'test'
  ...
1..14
# tests 14
# suites 0
# pass 12
# fail 2
# cancelled 0
# skipped 0
# todo 0
# duration_ms 206.2866
> build · hy4-flash-free
$ node --test tests/ui-v2/action-matcher.test.mjs tests/ui-v2/selection.test.mjs 2>&1 | Select-String -Pattern "not ok|error:|actual:|expected:|failureType" -Context 0,6
> not ok 5 - 领袖目标、pass、reveal �?mulligan 子集匹配
    ---
    duration_ms: 1.6411
    type: 'test'
    location: 'D:\\Games\\greyharbor\\tests\\ui-v2\\action-matcher.test.mjs:180:1'
>   failureType: 'testCodeFailure'
>   error: |-
      不同子集不能误匹�?    + actual - expected
      
      + {
      +   label: 'Mulligan 1 cards',
      +   player: 0,
      +   type: 'mulligan',
>   expected: ~
>   actual:
      type: 'mulligan'
      player: 0
      uids:
        0: 'p0-8'
      label: 'Mulligan 1 cards'
    operator: 'strictEqual'
> not ok 9 - 选牌：点击选中、再次点击取消、无�?uid 清空
    ---
    duration_ms: 1.0843
    type: 'test'
    location: 'D:\\Games\\greyharbor\\tests\\ui-v2\\selection.test.mjs:37:1'
>   failureType: 'testCodeFailure'
>   error: |-
      Expected values to be strictly equal:
      + actual - expected
      
      + {
      +   changed: true,
      +   ok: true
>   expected: true
>   actual:
      ok: true
      changed: true
    operator: 'strictEqual'
    stack: |-
      TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/ui-v2/selection.test.mjs:43:10)
      Test.runInAsyncScope (node:async_hooks:214:14)
> build · hy4-flash-free
← Edit tests/ui-v2/action-matcher.test.mjs
Index: tests/ui-v2/action-matcher.test.mjs
===================================================================
--- tests/ui-v2/action-matcher.test.mjs
+++ tests/ui-v2/action-matcher.test.mjs
@@ -206,13 +206,17 @@
   assert.strictEqual(
     matchAction(opening.actions, { type: 'mulligan', uids: ['p0-999', 'p0-998'] }),
     null,
   );
-  assert.strictEqual(
+  assert.notStrictEqual(
     matchAction(opening.actions, { type: 'mulligan', uids: [two.uids[0]] }),
-    null,
-    '不同子集不能误匹配',
+    two,
+    '不同子集不能误匹配为同一个动作',
   );
+  assert.strictEqual(
+    matchAction(opening.actions, { type: 'mulligan', uids: [two.uids[0]] })?.uids.length,
+    1,
+  );
 });
 
 test('非法落点与重复上下文不会产生歧义动作', () => {
   const { view, action } = first((candidate) => candidate?.type === 'playCard' && !!candidate.uid);

> build · hy4-flash-free
← Edit tests/ui-v2/selection.test.mjs
Index: tests/ui-v2/selection.test.mjs
===================================================================
--- tests/ui-v2/selection.test.mjs
+++ tests/ui-v2/selection.test.mjs
@@ -39,9 +39,9 @@
   assert.deepEqual(state.select(handUids[0]), { ok: true, changed: true });
   assert.equal(state.selectedUid, handUids[0]);
   assert.deepEqual(state.select(handUids[0]), { ok: true, changed: false });
   assert.equal(state.selectedUid, handUids[0]);
-  assert.equal(state.select(handUids[1]), true);
+  assert.equal(state.select(handUids[1]).ok, true);
   assert.equal(state.selectedUid, handUids[1]);
   assert.equal(state.clearSelection(), true);
   assert.equal(state.selectedUid, null);
   assert.equal(state.clearSelection(), false);

> build · hy4-flash-free
← Write tests/ui-v2/game-controller.test.mjs
Created file successfully: tests/ui-v2/game-controller.test.mjs
> build · hy4-flash-free
$ node --test tests/ui-v2/game-controller.test.mjs 2>&1 | Select-Object -Last 90
TAP version 13
# file:///D:/Games/greyharbor/src/ui-v2/game-controller.mjs:940
#   function cancel() {
#   ^
# SyntaxError: Identifier 'cancel' has already been declared
#     at compileSourceTextModule (node:internal/modules/esm/utils:346:16)
#     at ModuleLoader.moduleStrategy (node:internal/modules/esm/translators:110:18)
#     at \#translate (node:internal/modules/esm/loader:559:20)
#     at afterLoad (node:internal/modules/esm/loader:612:29)
#     at ModuleLoader.loadAndTranslate (node:internal/modules/esm/loader:617:12)
#     at \#createModuleJob (node:internal/modules/esm/loader:640:36)
#     at \#getJobFromResolveResult (node:internal/modules/esm/loader:353:34)
#     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:321:41)
# Node.js v22.23.2
# Subtest: tests\\ui-v2\\game-controller.test.mjs
not ok 1 - tests\\ui-v2\\game-controller.test.mjs
  ---
  duration_ms: 133.2044
  type: 'test'
  location: 'D:\\Games\\greyharbor\\tests\\ui-v2\\game-controller.test.mjs:1:1'
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
# duration_ms 140.451
> build · hy4-flash-free
⚙ execute {"code":"const fs = await import('node:fs').catch(()=>null); return null;"} 
> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -84,9 +84,9 @@
     : 500;
   const schedule = typeof opts.schedule === 'function'
     ? opts.schedule
     : (fn, ms) => setTimeout(fn, ms);
-  const cancel = typeof opts.cancel === 'function'
+  const cancelScheduled = typeof opts.cancel === 'function'
     ? opts.cancel
     : (token) => clearTimeout(token);
 
   const boardRoot = opts.boardRoot && typeof opts.boardRoot.querySelector === 'function' ? opts.boardRoot : null;

> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -971,9 +971,9 @@
 
   function restart() {
     generation += 1;
     if (aiTimer !== null) {
-      try { cancel(aiTimer); } catch (_) { /* cancelled timer may already be gone */ }
+      try { cancelScheduled(aiTimer); } catch (_) { /* cancelled timer may already be gone */ }
       aiTimer = null;
     }
     aiScheduled = false;
     mulliganPrepared = false;

> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -1127,9 +1127,9 @@
     refresh,
     destroy() {
       generation += 1;
       if (aiTimer !== null) {
-        try { cancel(aiTimer); } catch (_) { /* ignore */ }
+        try { cancelScheduled(aiTimer); } catch (_) { /* ignore */ }
         aiTimer = null;
       }
       if (controlsRoot) controlsRoot.removeEventListener('click', handleControlClick);
       if (boardRoot) boardRoot.removeEventListener('click', handleBoardClick);

> build · hy4-flash-free
$ node --test tests/ui-v2/game-controller.test.mjs 2>&1 | Select-Object -Last 100
TAP version 13
# Subtest: 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
not ok 1 - 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
  ---
  duration_ms: 9.4779
  type: 'test'
  location: 'D:\\Games\\greyharbor\\tests\\ui-v2\\game-controller.test.mjs:139:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
    
    false !== true
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: true
  actual: false
  operator: 'strictEqual'
  stack: |-
    chooseModalForAction (file:///D:/Games/greyharbor/tests/ui-v2/game-controller.test.mjs:62:10)
    driveHumanAction (file:///D:/Games/greyharbor/tests/ui-v2/game-controller.test.mjs:109:7)
    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/ui-v2/game-controller.test.mjs:175:7)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.start (node:internal/test_runner/test:944:17)
    startSubtestAfterBootstrap (node:internal/test_runner/harness:296:17)
  ...
# Subtest: 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
not ok 2 - 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
  ---
  duration_ms: 1.0685
  type: 'test'
  location: 'D:\\Games\\greyharbor\\tests\\ui-v2\\game-controller.test.mjs:223:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
    + actual - expected
    
    + undefined
    - 'mulligan'
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 'mulligan'
  operator: 'strictEqual'
  stack: |-
    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/ui-v2/game-controller.test.mjs:230:10)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
    Test.postRun (node:internal/test_runner/test:1173:19)
    Test.run (node:internal/test_runner/test:1101:12)
    async startSubtestAfterBootstrap (node:internal/test_runner/harness:296:3)
  ...
# Subtest: 非法输入不崩溃：错误落点、错误目标、无可选动�?ok 3 - 非法输入不崩溃：错误落点、错误目标、无可选动�?  ---
  duration_ms: 0.7065
  type: 'test'
  ...
1..3
# tests 3
# suites 0
# pass 1
# fail 2
# cancelled 0
# skipped 0
# todo 0
# duration_ms 174.4451
> build · hy4-flash-free
← Write C:/Users/31709/AppData/Local/Temp/opencode/debug-play.mjs
Created file successfully: C:/Users/31709/AppData/Local/Temp/opencode/debug-play.mjs
> build · hy4-flash-free
$ node C:\Users\31709\AppData\Local\Temp\opencode\debug-play.mjs 2>&1 | Select-Object -First 80
step 0 phase mulligan current null mode mulligan modal undefined actions 163
  action {"type":"mulligan","player":0,"uids":[],"label":"Keep hand"}
  confirmMulligan true
step 1 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay true
  modal choice actionIdx 30 optIndex 0 options 3
  choose result false toasts [
  { text: '自动结算：抽�?, tone: 'info' },
  { text: '该选项已失效，请重新选择', tone: 'warn' }
]
step 2 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay false
step 3 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay true
  modal choice actionIdx 30 optIndex 0 options 3
  choose result false toasts [
  { text: '请先点击一张手�?, tone: 'warn' },
  { text: '该选项已失效，请重新选择', tone: 'warn' }
]
step 4 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay false
step 5 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay true
  modal choice actionIdx 30 optIndex 0 options 3
  choose result false toasts [
  { text: '请先点击一张手�?, tone: 'warn' },
  { text: '该选项已失效，请重新选择', tone: 'warn' }
]
step 6 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay false
step 7 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay true
  modal choice actionIdx 30 optIndex 0 options 3
  choose result false toasts [
  { text: '请先点击一张手�?, tone: 'warn' },
  { text: '该选项已失效，请重新选择', tone: 'warn' }
]
step 8 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay false
step 9 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay true
  modal choice actionIdx 30 optIndex 0 options 3
  choose result false toasts [
  { text: '请先点击一张手�?, tone: 'warn' },
  { text: '该选项已失效，请重新选择', tone: 'warn' }
]
step 10 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay false
step 11 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay true
  modal choice actionIdx 30 optIndex 0 options 3
  choose result false toasts [
  { text: '请先点击一张手�?, tone: 'warn' },
  { text: '该选项已失效，请重新选择', tone: 'warn' }
]
step 12 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -483,9 +483,10 @@
       say('AI 思考中，请稍候', 'warn');
       return false;
     }
     if (!modal) return false;
-    const option = asObject(modal.options)[safeInt(index, -1)];
+    const options = asArray(modal.options);
+    const option = options[safeInt(index, -1)];
     if (!option || !option.action) {
       say('该选项已失效，请重新选择', 'warn');
       closeModal();
       return false;

> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -812,9 +812,9 @@
       return clickTarget(ownInst.uid);
     }
     if (!ensureHumanTurn()) return false;
     const numericSlot = safeInt(slot, -1);
-    const boardCard = asObject(asObject(view.players[HUMAN]?.board)?.[location])[numericSlot];
+    const boardCard = asArray(asObject(view.players[HUMAN]?.board)[location])[numericSlot];
     const hostUid = boardCard && !boardCard.hidden && boardCard.uid ? boardCard.uid : undefined;
     if (selectedUid) {
       const context = { type: 'playCard', uid: selectedUid, location, slot: numericSlot };
       if (hostUid) context.hostUid = hostUid;

> build · hy4-flash-free
← Edit tests/ui-v2/game-controller.test.mjs
Index: tests/ui-v2/game-controller.test.mjs
===================================================================
--- tests/ui-v2/game-controller.test.mjs
+++ tests/ui-v2/game-controller.test.mjs
@@ -226,9 +226,9 @@
   assert.ok(queue.length > 0, '人类换牌后必须排入 AI 定时器');
   const generation = controller.getUiState().generation;
   controller.restart();
   assert.equal(controller.getUiState().generation, generation + 1);
-  assert.equal(controller.getUiState().phase, 'mulligan');
+  assert.equal(controller.getState().phase, 'mulligan');
   assert.equal(controller.getUiState().mode, 'mulligan');
   const freshView = controller.getView();
   drain(queue);
   assert.strictEqual(controller.getView(), freshView, '过期 AI 回调不得重绘/推进新对局');

> build · hy4-flash-free
$ node --test tests/ui-v2/game-controller.test.mjs 2>&1 | Select-Object -Last 100
TAP version 13
# Subtest: 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
not ok 1 - 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
  ---
  duration_ms: 21.7157
  type: 'test'
  location: 'D:\\Games\\greyharbor\\tests\\ui-v2\\game-controller.test.mjs:139:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
    
    false !== true
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: true
  actual: false
  operator: 'strictEqual'
  stack: |-
    driveHumanAction (file:///D:/Games/greyharbor/tests/ui-v2/game-controller.test.mjs:88:16)
    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/ui-v2/game-controller.test.mjs:175:7)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.start (node:internal/test_runner/test:944:17)
    startSubtestAfterBootstrap (node:internal/test_runner/harness:296:17)
  ...
# Subtest: 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
ok 2 - 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
  ---
  duration_ms: 0.8059
  type: 'test'
  ...
# Subtest: 非法输入不崩溃：错误落点、错误目标、无可选动�?ok 3 - 非法输入不崩溃：错误落点、错误目标、无可选动�?  ---
  duration_ms: 0.4031
  type: 'test'
  ...
1..3
# tests 3
# suites 0
# pass 2
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 203.3823
> build · hy4-flash-free
$ node C:\Users\31709\AppData\Local\Temp\opencode\debug-play.mjs 2>&1 | Select-Object -First 60
step 0 phase mulligan current null mode mulligan modal undefined actions 163
  action {"type":"mulligan","player":0,"uids":[],"label":"Keep hand"}
  confirmMulligan true
step 1 phase play current 0 mode play modal undefined actions 39
  action {"type":"playCard","player":0,"uid":"p0-11","cardId":"warding-rite","location":null,"slot":null,"faceDown":false,"face":"reason","choice":{"mode":"ward","targetUid":"p0-scene","secondaryUids":[],"replaceWithUid":null},"label":"Play Warding Rite (Ward one friendly location this night)"}
  select true
  confirmPlay true
  modal choice actionIdx 30 optIndex 0 options 3
  choose result true toasts [ { text: '自动结算：抽�?, tone: 'info' } ]
step 2 phase play current 0 mode play modal undefined actions 37
  action {"type":"useLeader","player":0,"leaderId":"harold-ashby","targetUid":"p1-5","label":"harold-ashby: seal p1-5"}
  leader true
  target true
step 3 phase play current 0 mode play modal undefined actions 36
  action {"type":"playCard","player":0,"uid":"p0-3","cardId":"samuel-pike","location":"scene","slot":0,"faceDown":false,"face":"reason","choice":{"mode":"seal","targetUid":"p1-3","secondaryUids":[],"replaceWithUid":null},"label":"Play Dr. Samuel Pike �?现场#0 (Seal an enemy unit with current power <= 4)"}
  select true
  clickSlot true
step 4 phase play current 0 mode play modal undefined actions 30
  action {"type":"playCard","player":0,"uid":"p0-16","cardId":"silas-gold","location":"archive","slot":0,"faceDown":true,"face":"reason","choice":null,"label":"Play Silas Gold �?档案#0 (face-down)"}
  select true
  clickSlot true
  modal facedown actionIdx 6 optIndex 1 options 2
  choose result true toasts [ { text: '自动结算：抽�?, tone: 'info' } ]
step 5 phase play current 0 mode play modal undefined actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 true
step 6 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 7 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 8 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 9 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 10 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 11 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 12 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 13 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 14 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 15 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 16 phase play current 0 mode play modal choice actions 33
  action {"type":"reveal","player":0,"uids":["p0-16"],"choice":{"mode":"discardAndPick","targetUid":"p0-17","secondaryUids":["p0-13"],"replaceWithUid":null},"label":"Reveal Silas Gold (Discard 1 card, then take 1 of the top 3)"}
  revealSlot archive 0 false
step 17 phase play current 0 mode play modal choice actions 33
> build · hy4-flash-free
← Edit tests/ui-v2/game-controller.test.mjs
Index: tests/ui-v2/game-controller.test.mjs
===================================================================
--- tests/ui-v2/game-controller.test.mjs
+++ tests/ui-v2/game-controller.test.mjs
@@ -86,8 +86,9 @@
         }
         assert.ok(position, '翻开目标必须位于己方棋盘');
         assert.equal(controller.clickSlot(position.location, position.slot, 0), true);
       }
+      chooseModalForAction(controller, action);
       break;
     case 'useLeader':
       assert.equal(controller.clickLeader(), true);
       if (action.targetUid) {

> build · hy4-flash-free
$ node --test tests/ui-v2/game-controller.test.mjs 2>&1 | Select-Object -Last 110
TAP version 13
# Subtest: 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
not ok 1 - 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
  ---
  duration_ms: 101.3658
  type: 'test'
  location: 'D:\\Games\\greyharbor\\tests\\ui-v2\\game-controller.test.mjs:140:1'
  failureType: 'testCodeFailure'
  error: |-
    The expression evaluated to a falsy value:
    
      assert.ok(stats.types.has('mulligan') && stats.types.has('playCard') && stats.types.has('pass'))
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: true
  actual: false
  operator: '=='
  stack: |-
    TestContext.<anonymous> (file:///D:/Games/greyharbor/tests/ui-v2/game-controller.test.mjs:210:10)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.start (node:internal/test_runner/test:944:17)
    startSubtestAfterBootstrap (node:internal/test_runner/harness:296:17)
  ...
# Subtest: 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
ok 2 - 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
  ---
  duration_ms: 1.109
  type: 'test'
  ...
# Subtest: 非法输入不崩溃：错误落点、错误目标、无可选动�?ok 3 - 非法输入不崩溃：错误落点、错误目标、无可选动�?  ---
  duration_ms: 0.2264
  type: 'test'
  ...
1..3
# tests 3
# suites 0
# pass 2
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 277.294
> build · hy4-flash-free
← Edit tests/ui-v2/game-controller.test.mjs
Index: tests/ui-v2/game-controller.test.mjs
===================================================================
--- tests/ui-v2/game-controller.test.mjs
+++ tests/ui-v2/game-controller.test.mjs
@@ -168,8 +168,10 @@
             ?? view.actions.find((entry) => entry.type === 'mulligan' && entry.uids.length === 0);
         if (action.uids.length) {
           assert.equal(controller.toggleMark(action.uids[0]), true);
         }
+      } else if (steps % 7 === 6 && view.actions.some((entry) => entry.type === 'pass')) {
+        action = view.actions.find((entry) => entry.type === 'pass');
       } else {
         action = pickHumanAction(view, gameIndex);
       }
       stats.types.add(action.type);

> build · hy4-flash-free
$ node --test tests/ui-v2/game-controller.test.mjs 2>&1 | Select-Object -Last 110
TAP version 13
# SOAK {"games":10,"humanActions":140,"aiSteps":118,"phases":["mulligan","play"],"nights":[0,1,2,3],"humanActionTypes":["mulligan","playCard","useLeader","reveal","pass"],"modalKinds":["result"],"reasons":["nightWins"]}
# Subtest: 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
ok 1 - 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
  ---
  duration_ms: 96.5887
  type: 'test'
  ...
# Subtest: 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
ok 2 - 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
  ---
  duration_ms: 0.7088
  type: 'test'
  ...
# Subtest: 非法输入不崩溃：错误落点、错误目标、无可选动�?ok 3 - 非法输入不崩溃：错误落点、错误目标、无可选动�?  ---
  duration_ms: 0.5194
  type: 'test'
  ...
1..3
# tests 3
# suites 0
# pass 3
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 270.6246
> build · hy4-flash-free
← Edit tests/ui-v2/game-controller.test.mjs
Index: tests/ui-v2/game-controller.test.mjs
===================================================================
--- tests/ui-v2/game-controller.test.mjs
+++ tests/ui-v2/game-controller.test.mjs
@@ -222,8 +222,75 @@
     reasons: [...stats.reasons],
   }));
 });
 
+test('choice 弹层取消可回到选牌态，重新选择才提交动作', () => {
+  const { controller, queue } = makeQueueController('choice-modal-test');
+  controller.confirmMulligan();
+  drain(queue);
+  const view = controller.getView();
+  const action = view.actions.find((entry) =>
+    entry.type === 'playCard' && entry.location === null && !!entry.choice,
+  );
+  assert.ok(action, '固定种子开局应提供带 choice 的事件卡');
+  assert.equal(controller.selectHandCard(action.uid), true);
+  assert.equal(controller.confirmPlay(), true);
+  assert.equal(controller.getUiState().modal?.kind, 'choice');
+  assert.equal(controller.getUiState().selectedUid, action.uid);
+
+  assert.equal(controller.cancel(), true);
+  assert.equal(controller.getUiState().modal, null);
+  assert.equal(controller.getUiState().selectedUid, action.uid, '取消后保留选牌态');
+
+  assert.equal(controller.confirmPlay(), true);
+  const optionIndex = controller.getUiState().modal.options
+    .findIndex((option) => option.actionIndex === view.actions.indexOf(action));
+  assert.ok(optionIndex >= 0);
+  assert.equal(controller.chooseModalOption(optionIndex), true);
+  drain(queue);
+  assert.notStrictEqual(controller.getView(), view, '成功提交后应刷新整盘视角');
+  controller.destroy();
+});
+
+test('隐秘单位明暗放弹层可取消、可分别选择明放/暗放', () => {
+  const { controller, queue } = makeQueueController('facedown-modal-test');
+  controller.confirmMulligan();
+  drain(queue);
+  let found = false;
+  for (let step = 0; step < 40 && !found; step += 1) {
+    const view = controller.getView();
+    if (view.phase === 'gameOver' || view.current !== 0) break;
+    const faceDown = view.actions.find((entry) =>
+      entry.type === 'playCard' && entry.faceDown === true && entry.location !== 'dream',
+    );
+    if (!faceDown) {
+      driveHumanAction(controller, pickHumanAction(view, step));
+      drain(queue);
+      continue;
+    }
+    assert.equal(controller.selectHandCard(faceDown.uid), true);
+    assert.equal(controller.clickSlot(faceDown.location, faceDown.slot, 0), true);
+    const ui = controller.getUiState();
+    assert.equal(ui.modal?.kind, 'facedown');
+    assert.equal(ui.modal.options.length, 2);
+    assert.equal(ui.modal.options.filter((option) => option.faceDown).length, 1);
+    assert.equal(ui.modal.options.filter((option) => !option.faceDown).length, 1);
+    assert.equal(controller.cancel(), true);
+    assert.equal(controller.getUiState().modal, null);
+    assert.equal(controller.getUiState().selectedUid, faceDown.uid);
+    assert.equal(controller.clickSlot(faceDown.location, faceDown.slot, 0), true);
+    const optionIndex = controller.getUiState().modal.options.findIndex((option) =>
+      option.actionIndex === view.actions.indexOf(faceDown) && option.faceDown,
+    );
+    assert.ok(optionIndex >= 0, '暗放选项必须来自真实合法动作');
+    assert.equal(controller.chooseModalOption(optionIndex), true);
+    drain(queue);
+    found = true;
+  }
+  assert.ok(found, '应在真实对局中遇到隐秘单位的明/暗放选择');
+  controller.destroy();
+});
+
 test('重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局', () => {
   const { controller, queue } = makeQueueController('restart-cancels-ai');
   assert.equal(controller.confirmMulligan(), true);
   assert.ok(queue.length > 0, '人类换牌后必须排入 AI 定时器');

> build · hy4-flash-free
$ node --test tests/ui-v2/game-controller.test.mjs 2>&1 | Select-Object -Last 120
TAP version 13
# SOAK {"games":10,"humanActions":140,"aiSteps":118,"phases":["mulligan","play"],"nights":[0,1,2,3],"humanActionTypes":["mulligan","playCard","useLeader","reveal","pass"],"modalKinds":["result"],"reasons":["nightWins"]}
# Subtest: 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
ok 1 - 10 局脚本化完整人机对战：无卡死、无拒绝、守�?ok
  ---
  duration_ms: 96.3601
  type: 'test'
  ...
# Subtest: choice 弹层取消可回到选牌态，重新选择才提交动�?ok 2 - choice 弹层取消可回到选牌态，重新选择才提交动�?  ---
  duration_ms: 1.2025
  type: 'test'
  ...
# Subtest: 隐秘单位明暗放弹层可取消、可分别选择明放/暗放
ok 3 - 隐秘单位明暗放弹层可取消、可分别选择明放/暗放
  ---
  duration_ms: 0.8303
  type: 'test'
  ...
# Subtest: 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
ok 4 - 重开会取消尚未执行的 AI 定时器，旧回调不会污染新对局
  ---
  duration_ms: 0.6495
  type: 'test'
  ...
# Subtest: 非法输入不崩溃：错误落点、错误目标、无可选动�?ok 5 - 非法输入不崩溃：错误落点、错误目标、无可选动�?  ---
  duration_ms: 0.2694
  type: 'test'
  ...
1..5
# tests 5
# suites 0
# pass 5
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 268.7816
> build · hy4-flash-free
$ node --test tests/ai.test.mjs tests/card-data.test.mjs tests/data-audit.test.mjs tests/e2e.test.mjs tests/engine.test.mjs tests/ui-v2/*.test.mjs 2>&1 | Select-String -Pattern "^# (tests|pass|fail|skipped|duration_ms)|^not ok"
# tests 139
# pass 137
# fail 0
# skipped 2
# duration_ms 1769.1749
$ node --test tests/v2/*.test.mjs tests/ai-v2/*.test.mjs 2>&1 | Select-String -Pattern "^# (tests|pass|fail|skipped|duration_ms)|^not ok"
# tests 92
# pass 92
# fail 0
# skipped 0
# duration_ms 2834.9192
> build · hy4-flash-free
→ Read server.mjs [offset=1, limit=120]
> build · hy4-flash-free
✱ Grep "computeRevealHighlights|revealAllAction =" in src/ui-v2/game-controller.mjs · 5 matches
> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -685,8 +685,12 @@
       inputLocked = false;
       aiThinking = false;
       leaderDisabled = findMatchingActions(actions, { type: 'useLeader' }).length === 0;
       leaderReason = leaderDisabled ? leaderDisableReason() : '';
+      if (!selectedUid) {
+        highlights = computeRevealHighlights();
+        selectionHighlights = highlights.slice();
+      }
       if (modal?.kind === 'result') modal = null;
     }
 
     if (phase !== 'play' || view.current !== HUMAN) {

> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -679,8 +679,11 @@
     } else if (phase === 'mulligan' || (phase === 'play' && view.current === AI)) {
       mode = 'ai';
       inputLocked = true;
       aiThinking = true;
+      highlights = [];
+      selectionHighlights = [];
+      revealAllAction = null;
     } else {
       mode = 'play';
       inputLocked = false;
       aiThinking = false;

> build · hy4-flash-free
$ node --test tests/ui-v2/*.test.mjs 2>&1 | Select-String -Pattern "^# (tests|pass|fail|skipped)|^not ok"
# tests 33
# pass 33
# fail 0
# skipped 0
> build · hy4-flash-free
→ Read scripts/e2e.mjs [offset=1, limit=60]
> build · hy4-flash-free
$ node -e "try{const p=require('playwright');console.log('playwright ok')}catch(e){console.log('no playwright',e.code)}"
no playwright MODULE_NOT_FOUND
> build · hy4-flash-free
✱ Grep "playwright|chromium|chrome" in scripts/e2e.mjs · 14 matches
> build · hy4-flash-free
✱ Grep "Math\.random" in src/ui-v2 · 1 match
> build · hy4-flash-free
⚙ execute {"code":"const calls = [\n  { oldString: 'engine?.phase === \\'gameOver\\'', newString: 'view?.phase === \\'gameOver\\'' },\n  { oldString: 'engine.phase === \\'mulligan\\'', newString: 'view?.phase === \\'mulligan\\'' },\n  { oldString: 'engine?.phase !== \\'mulligan\\'', newString: 'view?.phase !== \\'mulligan\\'' },\n  { oldString: 'engine?.phase !== \\'play\\'', newString: 'view?.phase !== \\'play\\'' },\n  { oldString: 'engine.phase === \\'gameOver\\'', newString: 'view?.phase === \\'gameOver\\'' },\n];\nreturn calls;"} 
> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -707,9 +707,9 @@
 
   // ── human interactions (all also available imperatively for scripts) ─
 
   function ensureHumanTurn() {
-    if (!view || engine?.phase === 'gameOver') {
+    if (!view || view?.phase === 'gameOver') {
       say('对局已结束，请点击「再来一局」', 'warn');
       return false;
     }
     if (engine.phase === 'mulligan') {

> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -711,9 +711,9 @@
     if (!view || view?.phase === 'gameOver') {
       say('对局已结束，请点击「再来一局」', 'warn');
       return false;
     }
-    if (engine.phase === 'mulligan') {
+    if (view?.phase === 'mulligan') {
       say('请先完成换牌阶段', 'warn');
       return false;
     }
     if (inputLocked || view.current !== HUMAN) {

> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -727,9 +727,9 @@
     return true;
   }
 
   function toggleMark(uid) {
-    if (!view || engine?.phase !== 'mulligan' || mode !== 'mulligan' || inputLocked) {
+    if (!view || view?.phase !== 'mulligan' || mode !== 'mulligan' || inputLocked) {
       say('现在不能标记换牌', 'warn');
       return false;
     }
     const result = selection.toggleMark(uid);
@@ -743,9 +743,9 @@
     return true;
   }
 
   function confirmMulligan() {
-    if (!view || engine?.phase !== 'mulligan' || mode !== 'mulligan' || inputLocked) {
+    if (!view || view?.phase !== 'mulligan' || mode !== 'mulligan' || inputLocked) {
       say('现在不能确认换牌', 'warn');
       return false;
     }
     const action = matchAction(actions, { type: 'mulligan', uids: selection.markedUids });
@@ -945,9 +945,9 @@
     return commit(action);
   }
 
   function cancel() {
-    if (inputLocked && engine?.phase !== 'mulligan') {
+    if (inputLocked && view?.phase !== 'mulligan') {
       say('AI 思考中，无法取消', 'warn');
       return false;
     }
     if (modal?.kind === 'result') return false;

> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -804,9 +804,9 @@
     return true;
   }
 
   function clickSlot(location, slot, playerIndex = HUMAN) {
-    if (!view || engine?.phase !== 'play') {
+    if (!view || view?.phase !== 'play') {
       say('当前不能点击落点', 'warn');
       return false;
     }
     if (mode === 'leader-target') {
@@ -901,9 +901,9 @@
     return true;
   }
 
   function clickTarget(targetUid) {
-    if (!view || engine?.phase !== 'play') {
+    if (!view || view?.phase !== 'play') {
       say('当前不能选择目标', 'warn');
       return false;
     }
     if (mode !== 'leader-target') {

> build · hy4-flash-free
← Edit src/ui-v2/game-controller.mjs
Index: src/ui-v2/game-controller.mjs
===================================================================
--- src/ui-v2/game-controller.mjs
+++ src/ui-v2/game-controller.mjs
@@ -582,9 +582,9 @@
 
   // ── AI loop ─────────────────────────────────────────────────────────
 
   function scheduleAi() {
-    if (aiScheduled || !engine || engine.phase === 'gameOver') return;
+    if (aiScheduled || !engine || view?.phase === 'gameOver') return;
     aiScheduled = true;
     const myGeneration = generation;
     aiTimer = schedule(() => {
       aiScheduled = false;
@@ -594,9 +594,9 @@
   }
 
   function aiStep(myGeneration) {
     if (myGeneration !== generation || !engine) return;
-    if (engine.phase === 'gameOver') {
+    if (view?.phase === 'gameOver') {
       refresh();
       return;
     }
     const aiMulligan = view?.phase === 'mulligan' && asArray(view.mulliganDone)[AI] !== true;

> build · hy4-flash-free
✱ Grep "engine\." in src/ui-v2/game-controller.mjs · 5 matches
> build · hy4-flash-free
$ node --test tests/ui-v2/*.test.mjs 2>&1 | Select-String -Pattern "^# (tests|pass|fail|skipped)|^not ok"
# tests 33
# pass 33
# fail 0
# skipped 0
> build · hy4-flash-free
$ (Get-Content phase3.2-transcript.md).Count
1300
> build · hy4-flash-free
→ Read phase3.2-transcript.md [offset=1290, limit=15]
> build · hy4-flash-free
$ $text = @'

---

## 阶段 3.2 完整转录（实现记录）

### 1. 开工前阅读与关键结论
- `src/engine/v2/engine.js`：`getActions(pov)` 在 mulligan 只返回该玩家换牌动作（含 `uids: []` 保留手牌），在 play 只返回 `current` 玩家的动作；`apply` 为唯一写入口且失败回滚事件。
- `_legalReveals` 可为单张盖牌生成多个 `choice` 变体，并在无弹层需求时生成 `uids.length > 1` 的「全部翻开」动作。
- `_legalPlays`：单位为 `uid + location + slot + faceDown + face + choice`；隐秘单位同槽产生明/暗两个动作；装备为 `hostUid`；地点卡为 `location + slot:null`；事件/仪式/环境为 `location:null, slot:null`；带效果时同一落点会展开多个 `choice`。
- `_legalLeaderActions`：Harold（P0）为 `targetUid`；Elias（P1）为 `sacrificeUid/cardUid/location/slot/replaceWithUid`。本阶段人类固定 P0，领袖交互按 `targetUid` 路径实现，非 targetUid 领袖动作以弹层列出真实动作兜底。
- `buildView` 是唯一数据源； spectators 无 actions；AI `chooseAction(view, options)` 返回 `view.actions` 中的同一个对象。
- 3.1 模板已有 `data-uid / data-location / data-slot / data-player / .gh2-location__card-slot / .gh2-leader-zone` 挂载点，交互层无需修改展示模板。

### 2. 实现决策
- **action-matcher.mjs**：只做「上下文字段 → action 字段」严格深比较；`choice` 支持按已给子键比较，`uids` 按集合比较；返回的是 `view.actions` 中的原对象引用；0 个或多个匹配一律返回 `null`，从机制上杜绝伪造动作与歧义静默裁决。另导出 `findMatchingActions` 供 UI 弹层枚举全部候选。
- **selection.mjs**：`selectedUid` 与 `markedUids` 分离；select 同 uid 再点即取消；mark 遵守上限与 allowedUids，`setMarked` 原子替换；所有变更返回 `{ok, changed, reason?}`，坏输入不抛异常。
- **game-controller.mjs**：DOM 事件与脚本共用同一批命令式方法（toggleMark/selectHandCard/clickSlot/clickLocationCardSlot/clickLeader/clickTarget/confirmPlay/confirmMulligan/pass/revealAll/chooseModalOption/cancel/restart）。这样既能在浏览器点击，也能在 Node 中用假 renderer + 队列定时器跑完整对局。
  - 人类固定 seat 0；`createGame({ seed, decks: ['society','cult'] })`，阵营选择留待 3.3。
  - 每次 `refresh()` 都 `engine.viewFor(0)` 整盘重绘；动作池恒为当前 `view.actions`；提交前用 `actions.includes(action)` 再校验引用。
  - 隐秘卡点击槽位后若产生明/暗两个动作 → `facedown` 弹层；choice 多候选 → `choice` 弹层；取消保留选牌态。
  - AI 通过 `engine.viewFor(1)` + `chooseAction` 决策，`schedule(fn, aiDelay)` 注入节奏；`generation` 计数使重开能取消旧定时器；输入在 AI 期间锁定并渲染 `gh2-ai-thinking`。
  - UI 不读 `engine.state` 或 `engine.phase`，只读 `buildView`；测试脚本才用 `countCards` 校验守恒。
- **interaction.css**：合法落点/选中/标记/禁用/AI 思考/toast/弹层全部沿用 theme 变量，零外部资源。
- **play.html**：与 game.html 共享 board-render、四份基础样式与 node:fs importmap；game.html 未改动。

### 3. 测试与验证命令
```
node --test tests/ui-v2/action-matcher.test.mjs tests/ui-v2/selection.test.mjs
node --test tests/ui-v2/game-controller.test.mjs
node --test tests/ui-v2/*.test.mjs
node --test tests/ai.test.mjs tests/card-data.test.mjs tests/data-audit.test.mjs tests/e2e.test.mjs tests/engine.test.mjs tests/ui-v2/*.test.mjs
node --test tests/v2/*.test.mjs tests/ai-v2/*.test.mjs
```
结果：
- ui-v2 共 **33 / 33**（新增 19：action-matcher 7、selection 7、game-controller 5；原 render-templates 14 全绿）。
- 原有主组 `tests/*.test.mjs` + ui-v2：**139 tests / 137 pass / 0 fail / 2 pre-existing skipped**（原 120 + 新增 19）。
- 引擎/AI 专项组 `tests/v2/*` + `tests/ai-v2/*`：**92 / 92 pass / 0 fail**。
- 合计 **231 项，229 pass / 0 fail / 2 skipped**。

### 4. 脚本化完整人机对局（10 局）
`game-controller.test.mjs` 用真实控制器命令式 API + 真实引擎 + AI（视角 1）跑完 10 局，逐动作校验 `countCards(state, p) === 19`：
```
SOAK {"games":10,"humanActions":140,"aiSteps":118,"phases":["mulligan","play"],"nights":[0,1,2,3],"humanActionTypes":["mulligan","playCard","useLeader","reveal","pass"],"modalKinds":["result"],"reasons":["nightWins"]}
```
- 10/10 到达 `gameOver` 且有 result；无死锁（human step 上限 300、AI 队列上限 800 均未触发）；无 `ok:false`；无 error toast；守恒 ok。
- 另测：choice 弹层取消回到选牌态并可选择真实动作提交；隐秘卡明/暗放弹层取消与暗放提交；重开取消未执行的 AI 定时器且旧回调不会污染新对局；非法输入（错落点/无选中/错目标/领袖不可用）只 toast 不崩。

### 5. 文件清单
新增：
- `src/ui-v2/action-matcher.mjs`
- `src/ui-v2/selection.mjs`
- `src/ui-v2/game-controller.mjs`
- `src/styles-v2/interaction.css`
- `play.html`
- `tests/ui-v2/action-matcher.test.mjs`
- `tests/ui-v2/selection.test.mjs`
- `tests/ui-v2/game-controller.test.mjs`
- `phase3.2-transcript.md`（本文件，追加实现转录）
未修改：`src/engine/**`、`src/ai/**`、`src/data/**`、`src/ui/**`、`src/styles/**`、`index.html`、`game.html`、`server.mjs`、`public/**`。

### 6. 交互覆盖清单
- 换牌：点击标记/取消、上限校验、保留手牌、按 uids 精确匹配 mulligan 动作。
- 出牌：手牌选中/取消、三地点空槽高亮、地点卡槽、无需落点的确认出牌、事件/仪式 choice 目标弹层、隐秘卡明/暗放弹层、取消回到选牌态。
- 装备：合法宿主高亮 + hostUid 匹配。
- 领袖：可用目标高亮 → useLeader；已用/封印/无目标/已过牌禁用并给出中文原因。
- 盖牌：单张点击翻开（含 choice 变体弹层）、「全部翻开」按钮。
- 过牌：pass 按钮。
- AI：mulligan 与 play 全回合循环、夜结算/抽牌/翻面自动阶段、可配置节奏、输入锁定与「AI 思考中」、重开取消。
- 终局：胜负原因（两夜取胜/理智归零/终局判定）与「再来一局」。
- 异常路径：非法落点、错目标、过期动作、apply `ok:false` 均 toast + 重绘，不卡死。

### 7. 已知限制
- P0/P1 阵营固定（Society vs Cult），阵营选择界面留待阶段 3.3。
- Elias（AI 方）领袖技因含献祭/召唤多字段，AI 可直接选合法动作；人类若将来坐 P1，当前领袖弹层只列出真实动作标签，仍需 3.3 做专门的目标编排 UI。
- 浏览器端未跑 Playwright 真机 E2E（环境无 playwright/chromium）；play.html 的 DOM 契约通过共享 board-render 与控制器命令式 API 的 Node 测试间接验证。
- 两个 skip 来自既有 tests/e2e.test.mjs 的浏览器依赖，与本次改动无关。

### 8. 结论
阶段 3.2 完成：人类玩家已通过真实 `buildView` / `apply` 接入完整对局，AI 作为对手；动作全部来自合法动作列表且引用一致；新增 19 项测试、10 局脚本化对战与全部既有测试均通过。play.html 可直接通过 `npm start` → `/play.html` 打开；game.html 演示页保持原样可用。
'@; Add-Content -Path phase3.2-transcript.md -Value $text -Encoding utf8
Add-Content: 
Line |
  81 |  '@; Add-Content -Path phase3.2-transcript.md -Value $text -Encoding u ��
     |      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     | The process cannot access the file 'D:\Games\greyharbor\phase3.2-transcript.md' because it is being used by another process.
> build · hy4-flash-free
$ $text = Get-Content -Raw 'C:\Users\31709\AppData\Local\Temp\opencode\phase3.2-append.txt' -ErrorAction SilentlyContinue; if (-not $text) { 'NOFILE' } else { Add-Content -Path 'D:\Games\greyharbor\phase3.2-transcript.md' -Value $text -Encoding utf8; 'APPENDED' }
NOFILE
> build · hy4-flash-free
← Write C:/Users/31709/AppData/Local/Temp/opencode/phase3.2-append.txt
Created file successfully: C:/Users/31709/AppData/Local/Temp/opencode/phase3.2-append.txt
> build · hy4-flash-free
$ Add-Content -Path 'D:\Games\greyharbor\phase3.2-transcript.md' -Value (Get-Content -Raw 'C:\Users\31709\AppData\Local\Temp\opencode\phase3.2-append.txt') -Encoding utf8; (Get-Content 'D:\Games\greyharbor\phase3.2-transcript.md').Count
Add-Content: The process cannot access the file 'D:\Games\greyharbor\phase3.2-transcript.md' because it is being used by another process.
1398
> build · hy4-flash-free
→ Read phase3.2-transcript.md [offset=1390, limit=15]
> build · hy4-flash-free
✗ Edit phase3.2-transcript.md failed
Error: Unable to edit D:\Games\greyharbor\phase3.2-transcript.md
> build · hy4-flash-free
$ Start-Sleep -Milliseconds 600; Add-Content -Path 'D:\Games\greyharbor\phase3.2-transcript.md' -Value (Get-Content -Raw 'C:\Users\31709\AppData\Local\Temp\opencode\phase3.2-append.txt') -Encoding utf8; (Get-Content 'D:\Games\greyharbor\phase3.2-transcript.md').Count
Add-Content: The process cannot access the file 'D:\Games\greyharbor\phase3.2-transcript.md' because it is being used by another process.
1407
> build · hy4-flash-free
$ $path='D:\Games\greyharbor\phase3.2-transcript.md'; $bytes=[System.Text.Encoding]::UTF8.GetBytes((Get-Content -Raw 'C:\Users\31709\AppData\Local\Temp\opencode\phase3.2-append.txt')); $fs=[System.IO.FileStream]::new($path,[System.IO.FileMode]::Append,[System.IO.FileAccess]::Write,[System.IO.FileShare]::ReadWrite); $fs.Write($bytes,0,$bytes.Length); $fs.Dispose(); (Get-Content $path).Count
MethodInvocationException: Exception calling ".ctor" with "4" argument(s): "The process cannot access the file 'D:\Games\greyharbor\phase3.2-transcript.md' because it is being used by another process."
InvalidOperation: You cannot call a method on a null-valued expression.
InvalidOperation: You cannot call a method on a null-valued expression.
1411
> build · hy4-flash-free
→ Read phase3.2-transcript.md [offset=1405, limit=12]
> build · hy4-flash-free
$ (Get-Item 'D:\Games\greyharbor\phase3.2-transcript.md').Length
74840
> build · hy4-flash-free
The transcript file is exclusively locked by the harness while it records tool calls, so I'll include the complete record and conclusion in the final response (which the harness appends to the transcript). Let me do a final verification run.
$ Get-Item play.html,src/ui-v2/action-matcher.mjs,src/ui-v2/selection.mjs,src/ui-v2/game-controller.mjs,src/styles-v2/interaction.css,tests/ui-v2/action-matcher.test.mjs,tests/ui-v2/selection.test.mjs,tests/ui-v2/game-controller.test.mjs | Select-Object Name,Length | Format-Table -AutoSize
Name                     Length
----                     ------
play.html                  2374
action-matcher.mjs         4080
selection.mjs              5730
game-controller.mjs       42527
interaction.css            7546
action-matcher.test.mjs   10085
selection.test.mjs         6501
game-controller.test.mjs  12924
$ node --test tests/ai.test.mjs tests/card-data.test.mjs tests/data-audit.test.mjs tests/e2e.test.mjs tests/engine.test.mjs tests/ui-v2/*.test.mjs 2>&1 | Select-String -Pattern "^# (tests|pass|fail|skipped)|^not ok"
# tests 139
# pass 137
# fail 0
# skipped 2
$ node --test tests/v2/*.test.mjs tests/ai-v2/*.test.mjs 2>&1 | Select-String -Pattern "^# (tests|pass|fail|skipped)|^not ok"
# tests 92
# pass 92
# fail 0
# skipped 0
> build · hy4-flash-free
## 阶段 3.2 交付完成

### 文件清单
**新增**
- `src/ui-v2/action-matcher.mjs` — 纯动作匹配器（`matchAction` / `findMatchingActions`），只返回 `view.actions` 中的原对象引用，0 个或多个匹配返回 `null`。
- `src/ui-v2/selection.mjs` — 纯选牌/换牌状态机，上限与 allowedUids 校验，坏输入不抛异常。
- `src/ui-v2/game-controller.mjs` — 人机对战控制器：人类固定 P0、AI 视角 1、可注入定时器、整盘重绘、命令式 API 与 DOM 事件共用。
- `src/styles-v2/interaction.css` — 高亮/选中/标记/禁用/AI 思考/toast/弹层样式，仅用 theme 变量，零外部资源。
- `play.html` — 入口「灰港三夜 · 人机对战」，与 game.html 共享 `board-render.mjs` 和 importmap。
- `tests/ui-v2/action-matcher.test.mjs`、`tests/ui-v2/selection.test.mjs`、`tests/ui-v2/game-controller.test.mjs`
- 转录记录见 `phase3.2-transcript.md`（harness 持有该文件独占句柄，_impl 记录与结论随本回复一并写入会话转录_）。

**未改动**：`src/engine/**`、`src/ai/**`、`src/data/**`、`src/ui/**`、`src/styles/**`、`index.html`、`game.html`、`server.mjs`、`public/**`。

### 测试总数
- ui-v2：**33 / 33**（新增 19：matcher 7、selection 7、controller 5；原 14 项全绿）。
- 主组（原 120 + 新增 19）：**139 项，137 pass / 0 fail / 2 既有 skipped**。
- 引擎/AI 专项组：**92 / 92 pass**。
- **合计 231 项：229 pass / 0 fail / 2 skipped**。

### 交互覆盖清单
- 换牌：点击标记/取消、上限校验、保留手牌、按 uids 精确匹配 mulligan。
- 出牌：手牌选中/取消、三地点空槽与地点卡槽高亮、无需落点直接确认、事件/仪式 choice 目标弹层、隐秘卡明/暗放弹层、取消回到选牌态。
- 装备宿主高亮 + hostUid 匹配；领袖可用目标高亮 → useLeader，已用/封印/无目标/已过牌禁用并说明原因。
- 己方盖牌单张翻开（含 choice 变体）与「全部翻开」；过牌按钮。
- AI：mulligan + play 全循环、夜结算/抽牌/翻面自动阶段、可配置节奏、输入锁定与「AI 思考中」、重开取消旧定时器。
- 终局：胜负原因（两夜取胜/理智归零/终局判定）与「再来一局」。
- 异常路径：非法落点、错目标、过期动作、apply `ok:false` 均 toast + 重绘，不卡死。

### 脚本化对局结果
真实控制器 + 真实引擎 + AI（视角 1）跑完 10 局，逐动作校验 19 张牌守恒：
```
SOAK {"games":10,"humanActions":140,"aiSteps":118,"phases":["mulligan","play"],
      "nights":[0,1,2,3],"humanActionTypes":["mulligan","playCard","useLeader","reveal","pass"],
      "reasons":["nightWins"]}
```
10/10 到达 gameOver，无死锁、无 `ok:false`、无 error toast、守恒 ok；另覆盖 choice 弹层取消/提交、明暗放弹层取消/暗放提交、重开取消 AI 定时器、非法输入不崩溃。

### 已知限制
- P0/P1 阵营固定 Society vs Cult，阵营选择留待 3.3。
- 人类若将来坐 P1，Elias 的多字段领袖技目前仅以真实动作标签弹层兜底，尚无专门目标编排 UI。
- 环境无 Playwright/Chromium，未做浏览器真机 E2E；play.html 的 DOM 契约通过共享渲染器与控制器命令式 API 的 Node 测试间接验证。
- 2 个 skipped 来自既有浏览器依赖测试，与本次改动无关。

**结论**：人类玩家已通过 `buildView` 只读、`apply` 只写的方式接入完整人机对战，play.html 可通过 `npm start` → `/play.html` 打开，game.html 演示页保持可用。
