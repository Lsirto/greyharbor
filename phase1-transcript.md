
> build · deepseek-v4.1-flash-free
I'll start by exploring the project structure to understand the existing conventions and data.
→ Read . 
✱ Glob "**/*.md" 9 matches
> build · deepseek-v4.1-flash-free
→ Read package.json 
→ Read card-table-v1.csv 
→ Read migration-plan.md 
→ Read docs/GAME_RULES.md 
> build · deepseek-v4.1-flash-free
→ Read phase1-transcript.md 
→ Read migration-plan.md [offset=1141, limit=800]
→ Read README.md 
> build · deepseek-v4.1-flash-free
> build · deepseek-v4.1-flash-free
Continuing with the smaller pieces. First, the CSV importer.
← Write scripts/import-card-table.mjs
Created file successfully: scripts/import-card-table.mjs
> build · deepseek-v4.1-flash-free
$ node scripts/import-card-table.mjs
========================================================================
  《灰港三夜》卡表导入审计 / Greyharbor Card Table Import Audit
========================================================================
  输入: D:\Games\greyharbor\card-table-v1.csv
  输出: D:\Games\greyharbor\src\data\card-table.normalized.json
  原始数据行: 30
  成功规范化: 30
  自动修复行: 0

  按阵营
    cult             12
    neutral           6
    society          12

  按类型
    environment       2
    equipment         1
    event             3
    leader            2
    location          2
    oldgod            2
    ritual            2
    unit             16

  按阵营 × 类型
    society  总 12  equipment 1 / event 2 / leader 1 / location 1 / unit 7
    cult     总 12  environment 1 / leader 1 / location 1 / ritual 2 / unit 7
    neutral  总  6  environment 1 / event 1 / oldgod 2 / unit 2

  按地点
    (空)               2
    all               2
    any               4
    archive           8
    attach            1
    dream             5
    row               1
    scene             7

  关键词分布
    隐秘         5
    腐化         1
    封印         2
    连锁         3
    献祭         3
    理智反噬       4

  理智代价分布
    cost=0   26
    cost=1    2
    cost=2    2

  份数分布
    copies=1   29
    copies=2    1

  牌池可收集量（不含领袖；society/cult 可加中立）
    society  本阵营 11 张/11 份 + 中立 6 张/6 份 = 18 张（含领袖）
    cult     本阵营 11 张/12 份 + 中立 6 张/6 份 = 19 张（含领袖）

  ERROR (0)
    ✓ 0 error

  WARNING (17)
    ! KEYWORD_MENTIONED_NOT_TAGGED [harold-ashby]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [samuel-pike]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [abjuration]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [warding-rite]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [warding-rite]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [silver-lantern]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [old-library]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [elias-thorne]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [seance]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [drowned-altar]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [drowned-altar]: 效果文本提到“理智反噬”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [the-sleeper]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [thousand-eyes]: 效果文本提到“隐秘”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [unexpected-aid]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [unexpected-aid]: 效果文本提到“封印”，但 keywords 未标注。
    ! PRESET_POOL_SHORT [society]: society 严格按 copies 收藏只能组成 18 张（含领袖），不足 20 张预设牌组。v1 预设牌组为官方固定列表，不受收藏份数限制。
    ! PRESET_POOL_SHORT [cult]: cult 严格按 copies 收藏只能组成 19 张（含领袖），不足 20 张预设牌组。v1 预设牌组为官方固定列表，不受收藏份数限制。

========================================================================
  结果: PASS（0 error）
========================================================================
> build · deepseek-v4.1-flash-free
$ node -e "const d=require('./src/data/card-table.normalized.json'); for (const id of ['abjuration','seance','stormy-night','harold-ashby']) console.log(JSON.stringify(d.find(c=>c.id===id),null,2))"
{
  "id": "abjuration",
  "nameZh": "驱魔咒",
  "nameEn": "Abjuration",
  "faction": "society",
  "type": "event",
  "location": "any",
  "reasonPower": null,
  "madnessPower": null,
  "keywords": [],
  "sanityCost": 0,
  "copies": 1,
  "effect": "移除一个腐化或环境效果",
  "flavor": "退回去这里不欢迎你"
}
{
  "id": "seance",
  "nameZh": "降灵会",
  "nameEn": "Séance",
  "faction": "cult",
  "type": "ritual",
  "location": "any",
  "reasonPower": null,
  "madnessPower": null,
  "keywords": [],
  "sanityCost": 0,
  "copies": 1,
  "effect": "献祭一张己方卡从深渊拉回最多2张单位入手牌",
  "flavor": "桌子震了三下然后多了一个人的呼吸"
}
{
  "id": "stormy-night",
  "nameZh": "暴雨夜",
  "nameEn": "Stormy Night",
  "faction": "neutral",
  "type": "environment",
  "location": "all",
  "reasonPower": null,
  "madnessPower": null,
  "keywords": [],
  "sanityCost": 0,
  "copies": 1,
  "effect": "本夜双方现场位置卡全体-2",
  "flavor": "雨冲掉了脚印也冲掉了理智"
}
{
  "id": "harold-ashby",
  "nameZh": "哈罗德·阿什比",
  "nameEn": "Harold Ashby",
  "faction": "society",
  "type": "leader",
  "location": null,
  "reasonPower": null,
  "madnessPower": null,
  "keywords": [],
  "sanityCost": 0,
  "copies": 1,
  "effect": "主动技每夜一次：封印一张敌方卡直到下一夜并回复1理智",
  "flavor": "灯亮着人就还没输"
}
> build · deepseek-v4.1-flash-free
$ node --input-type=module -e "import fs from 'node:fs'; import {parseCsv} from './scripts/import-card-table.mjs'; const t=fs.readFileSync('card-table-v1.csv','utf8'); const rs=parseCsv(t); console.log(rs.length); for(const r of rs.slice(1,3)) console.log(r.line, r.fields.length, JSON.stringify(r.fields));"
========================================================================
  《灰港三夜》卡表导入审计 / Greyharbor Card Table Import Audit
========================================================================
  输入: D:\Games\greyharbor\card-table-v1.csv
  输出: D:\Games\greyharbor\src\data\card-table.normalized.json
  原始数据行: 30
  成功规范化: 30
  自动修复行: 0

  按阵营
    cult             12
    neutral           6
    society          12

  按类型
    environment       2
    equipment         1
    event             3
    leader            2
    location          2
    oldgod            2
    ritual            2
    unit             16

  按阵营 × 类型
    society  总 12  equipment 1 / event 2 / leader 1 / location 1 / unit 7
    cult     总 12  environment 1 / leader 1 / location 1 / ritual 2 / unit 7
    neutral  总  6  environment 1 / event 1 / oldgod 2 / unit 2

  按地点
    (空)               2
    all               2
    any               4
    archive           8
    attach            1
    dream             5
    row               1
    scene             7

  关键词分布
    隐秘         5
    腐化         1
    封印         2
    连锁         3
    献祭         3
    理智反噬       4

  理智代价分布
    cost=0   26
    cost=1    2
    cost=2    2

  份数分布
    copies=1   29
    copies=2    1

  牌池可收集量（不含领袖；society/cult 可加中立）
    society  本阵营 11 张/11 份 + 中立 6 张/6 份 = 18 张（含领袖）
    cult     本阵营 11 张/12 份 + 中立 6 张/6 份 = 19 张（含领袖）

  ERROR (0)
    ✓ 0 error

  WARNING (17)
    ! KEYWORD_MENTIONED_NOT_TAGGED [harold-ashby]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [samuel-pike]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [abjuration]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [warding-rite]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [warding-rite]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [silver-lantern]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [old-library]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [elias-thorne]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [seance]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [drowned-altar]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [drowned-altar]: 效果文本提到“理智反噬”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [the-sleeper]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [thousand-eyes]: 效果文本提到“隐秘”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [unexpected-aid]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [unexpected-aid]: 效果文本提到“封印”，但 keywords 未标注。
    ! PRESET_POOL_SHORT [society]: society 严格按 copies 收藏只能组成 18 张（含领袖），不足 20 张预设牌组。v1 预设牌组为官方固定列表，不受收藏份数限制。
    ! PRESET_POOL_SHORT [cult]: cult 严格按 copies 收藏只能组成 19 张（含领袖），不足 20 张预设牌组。v1 预设牌组为官方固定列表，不受收藏份数限制。

========================================================================
  结果: PASS（0 error）
========================================================================

31
2 13 ["harold-ashby","哈罗德·阿什比","Harold Ashby","society","leader","","","","","0","1","主动技每夜一次：封印一张敌方卡直到下一夜并回复1理智","灯亮着人就还没输"]
3 13 ["nora-wells","诺拉·威尔斯","Nora Wells","society","unit","scene","2","4","隐秘","0","1","盖牌入场翻开时查看对手一张手牌","我只问几个问题顺便拍几张照片"]
> build · deepseek-v4.1-flash-free
← Edit scripts/import-card-table.mjs
Index: scripts/import-card-table.mjs
===================================================================
--- scripts/import-card-table.mjs
+++ scripts/import-card-table.mjs
@@ -16,9 +16,9 @@
  */
 
 import fs from "node:fs";
 import path from "node:path";
-import { fileURLToPath } from "node:url";
+import { fileURLToPath, pathToFileURL } from "node:url";
 
 const __dirname = path.dirname(fileURLToPath(import.meta.url));
 const ROOT = path.resolve(__dirname, "..");
 const CSV_PATH = path.join(ROOT, "card-table-v1.csv");

> build · deepseek-v4.1-flash-free
← Edit scripts/import-card-table.mjs
Index: scripts/import-card-table.mjs
===================================================================
--- scripts/import-card-table.mjs
+++ scripts/import-card-table.mjs
@@ -62,8 +62,58 @@
   sanityCost: { min: 0, max: 6 },
   copies: { min: 1, max: 3 },
 };
 
+/**
+ * v1 锁定的预设牌组（20 张，含 1 领袖）。
+ * v1 不做组牌器，因此预设牌组使用独立的“预设份数”上限：
+ *   - 领袖恰好 1 张；
+ *   - 非领袖卡每张最多 2 份；
+ *   - 只能使用本阵营 + 中立卡。
+ * 收藏字段 copies 仍按 CSV 审计，但不约束 v1 预设列表。
+ */
+const PRESET_DECKS = {
+  society: [
+    "harold-ashby",
+    "nora-wells", "nora-wells",
+    "samuel-pike", "samuel-pike",
+    "edith-barrow",
+    "walter-morse",
+    "lucia-vaughn",
+    "frank-holt",
+    "arthur-pendleton",
+    "abjuration",
+    "warding-rite",
+    "silver-lantern",
+    "old-library",
+    "finn-calloway",
+    "silas-gold", "silas-gold",
+    "thousand-eyes",
+    "unexpected-aid",
+    "stormy-night",
+  ],
+  cult: [
+    "elias-thorne",
+    "hooded-acolyte", "hooded-acolyte",
+    "zealot", "zealot",
+    "sea-priestess",
+    "gravedigger",
+    "whisperer",
+    "deep-one",
+    "bell-claw",
+    "seance",
+    "tide-ritual",
+    "lunar-eclipse",
+    "drowned-altar",
+    "finn-calloway",
+    "silas-gold",
+    "the-sleeper",
+    "thousand-eyes",
+    "stormy-night",
+    "unexpected-aid",
+  ],
+};
+
 const errors = [];
 const warnings = [];
 const repairs = [];
 

> build · deepseek-v4.1-flash-free
← Edit scripts/import-card-table.mjs
Index: scripts/import-card-table.mjs
===================================================================
--- scripts/import-card-table.mjs
+++ scripts/import-card-table.mjs
@@ -523,8 +523,60 @@
   if (cards.some((c) => c.faction === "neutral" && c.type === "leader")) {
     addError("NEUTRAL_LEADER", "中立阵营不应有领袖。");
   }
 
+  // 预设牌组引用完整性 / 份数 / 阵营合法性
+  const byId = new Map(cards.map((c) => [c.id, c]));
+  const presetReport = {};
+  for (const [faction, ids] of Object.entries(PRESET_DECKS)) {
+    const report = { faction, total: ids.length, leader: 0, nonLeader: 0, duplicates: {}, unknown: [], illegalFaction: [] };
+    const counts = new Map();
+    for (const id of ids) {
+      counts.set(id, (counts.get(id) || 0) + 1);
+    }
+    for (const [id, n] of counts) {
+      const card = byId.get(id);
+      if (!card) {
+        report.unknown.push(id);
+        addError("PRESET_UNKNOWN_CARD", `预设牌组 ${faction} 引用了不存在的卡：${id}。`, { faction, id });
+        continue;
+      }
+      if (card.type === "leader") {
+        report.leader += n;
+        if (card.faction !== faction) {
+          addError("PRESET_WRONG_LEADER", `预设牌组 ${faction} 的领袖是 ${card.faction} 阵营的 ${id}。`, {
+            faction,
+            id,
+          });
+        }
+      } else {
+        report.nonLeader += n;
+        if (n > 2) {
+          addError("PRESET_COPIES", `预设牌组 ${faction} 中 ${id} 有 ${n} 份，超过预设上限 2。`, {
+            faction,
+            id,
+            count: n,
+          });
+        }
+        if (!(card.faction === faction || card.faction === "neutral")) {
+          report.illegalFaction.push(id);
+          addError("PRESET_ILLEGAL_FACTION", `预设牌组 ${faction} 不能使用 ${card.faction} 阵营的卡 ${id}。`, {
+            faction,
+            id,
+          });
+        }
+        if (n > 1) report.duplicates[id] = n;
+      }
+    }
+    if (ids.length !== 20) {
+      addError("PRESET_SIZE", `预设牌组 ${faction} 共 ${ids.length} 张，期望 20 张。`, { faction });
+    }
+    if (report.leader !== 1) {
+      addError("PRESET_LEADER_COUNT", `预设牌组 ${faction} 有 ${report.leader} 张领袖，期望恰好 1 张。`, { faction });
+    }
+    presetReport[faction] = report;
+  }
+
   // 关键词覆盖（引用完整性的一部分）：六个关键词都应在卡池中出现
   for (const kw of KEYWORDS) {
     if (!cards.some((c) => c.keywords.includes(kw))) {
       addWarning("UNUSED_KEYWORD", `关键词“${kw}”在卡池中没有被任何卡标注。`);

> build · deepseek-v4.1-flash-free
← Edit scripts/import-card-table.mjs
Index: scripts/import-card-table.mjs
===================================================================
--- scripts/import-card-table.mjs
+++ scripts/import-card-table.mjs
@@ -611,9 +611,9 @@
     fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
     fs.writeFileSync(OUT_PATH, `${JSON.stringify(cards, null, 2)}\n`, "utf8");
   }
 
-  printReport(cards, { rawRowCount, deckPool });
+  printReport(cards, { rawRowCount, deckPool, presetReport });
   process.exitCode = errors.length === 0 ? 0 : 1;
 }
 
 // ---------------------------------------------------------------------------

> build · deepseek-v4.1-flash-free
← Edit scripts/import-card-table.mjs
Index: scripts/import-card-table.mjs
===================================================================
--- scripts/import-card-table.mjs
+++ scripts/import-card-table.mjs
@@ -600,9 +600,9 @@
     };
     if (ownCopies + neutralCopies + 1 < 20) {
       addWarning(
         "PRESET_POOL_SHORT",
-        `${faction} 严格按 copies 收藏只能组成 ${ownCopies + neutralCopies + 1} 张（含领袖），不足 20 张预设牌组。v1 预设牌组为官方固定列表，不受收藏份数限制。`,
+        `${faction} 严格按 copies 收藏只能组成 ${ownCopies + neutralCopies + 1} 张（含领袖），不足 20 张。v1 预设牌组使用独立的“预设份数”上限（非领袖每卡最多 2 份），不直接套用收藏 copies。`,
         { faction, ...deckPool[faction] },
       );
     }
   }

> build · deepseek-v4.1-flash-free
← Edit scripts/import-card-table.mjs
Index: scripts/import-card-table.mjs
===================================================================
--- scripts/import-card-table.mjs
+++ scripts/import-card-table.mjs
@@ -691,8 +691,18 @@
         `    ${faction.padEnd(8)} 本阵营 ${p.ownUnique} 张/${p.ownCopies} 份 + 中立 ${p.neutralUnique} 张/${p.neutralCopies} 份 = ${p.strictTotalWithLeader} 张（含领袖）`,
       );
     }
     out.push("");
+    out.push("  预设牌组（v1 锁定：20 张，含 1 领袖；非领袖每卡最多 2 份）");
+    for (const faction of ["society", "cult"]) {
+      const p = extra.presetReport?.[faction];
+      if (!p) continue;
+      const dup = Object.entries(p.duplicates).map(([id, n]) => `${id}×${n}`).join(", ") || "无";
+      out.push(
+        `    ${faction.padEnd(8)} ${p.total} 张（领袖 ${p.leader} / 非领袖 ${p.nonLeader}）；重复：${dup}`,
+      );
+    }
+    out.push("");
   }
 
   if (repairs.length > 0) {
     out.push(`  自动修复记录（${repairs.length}）`);

> build · deepseek-v4.1-flash-free
← Edit scripts/import-card-table.mjs
Index: scripts/import-card-table.mjs
===================================================================
--- scripts/import-card-table.mjs
+++ scripts/import-card-table.mjs
@@ -742,5 +742,7 @@
 
   console.log(out.join("\n"));
 }
 
-main();
+const runDirectly =
+  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
+if (runDirectly) main();

> build · deepseek-v4.1-flash-free
$ node scripts/import-card-table.mjs
========================================================================
  《灰港三夜》卡表导入审计 / Greyharbor Card Table Import Audit
========================================================================
  输入: D:\Games\greyharbor\card-table-v1.csv
  输出: D:\Games\greyharbor\src\data\card-table.normalized.json
  原始数据行: 30
  成功规范化: 30
  自动修复行: 0

  按阵营
    cult             12
    neutral           6
    society          12

  按类型
    environment       2
    equipment         1
    event             3
    leader            2
    location          2
    oldgod            2
    ritual            2
    unit             16

  按阵营 × 类型
    society  总 12  equipment 1 / event 2 / leader 1 / location 1 / unit 7
    cult     总 12  environment 1 / leader 1 / location 1 / ritual 2 / unit 7
    neutral  总  6  environment 1 / event 1 / oldgod 2 / unit 2

  按地点
    (空)               2
    all               2
    any               4
    archive           8
    attach            1
    dream             5
    row               1
    scene             7

  关键词分布
    隐秘         5
    腐化         1
    封印         2
    连锁         3
    献祭         3
    理智反噬       4

  理智代价分布
    cost=0   26
    cost=1    2
    cost=2    2

  份数分布
    copies=1   29
    copies=2    1

  牌池可收集量（不含领袖；society/cult 可加中立）
    society  本阵营 11 张/11 份 + 中立 6 张/6 份 = 18 张（含领袖）
    cult     本阵营 11 张/12 份 + 中立 6 张/6 份 = 19 张（含领袖）

  预设牌组（v1 锁定：20 张，含 1 领袖；非领袖每卡最多 2 份）
    society  20 张（领袖 1 / 非领袖 19）；重复：nora-wells×2, samuel-pike×2, silas-gold×2
    cult     20 张（领袖 1 / 非领袖 19）；重复：hooded-acolyte×2, zealot×2

  ERROR (0)
    ✓ 0 error

  WARNING (17)
    ! KEYWORD_MENTIONED_NOT_TAGGED [harold-ashby]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [samuel-pike]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [abjuration]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [warding-rite]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [warding-rite]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [silver-lantern]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [old-library]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [elias-thorne]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [seance]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [drowned-altar]: 效果文本提到“献祭”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [drowned-altar]: 效果文本提到“理智反噬”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [the-sleeper]: 效果文本提到“封印”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [thousand-eyes]: 效果文本提到“隐秘”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [unexpected-aid]: 效果文本提到“腐化”，但 keywords 未标注。
    ! KEYWORD_MENTIONED_NOT_TAGGED [unexpected-aid]: 效果文本提到“封印”，但 keywords 未标注。
    ! PRESET_POOL_SHORT [society]: society 严格按 copies 收藏只能组成 18 张（含领袖），不足 20 张。v1 预设牌组使用独立的“预设份数”上限（非领袖每卡最多 2 份），不直接套用收藏 copies。
    ! PRESET_POOL_SHORT [cult]: cult 严格按 copies 收藏只能组成 19 张（含领袖），不足 20 张。v1 预设牌组使用独立的“预设份数”上限（非领袖每卡最多 2 份），不直接套用收藏 copies。

========================================================================
  结果: PASS（0 error）
========================================================================
> build · deepseek-v4.1-flash-free
Now the rules document, in sections. Part 1: overview, setup, sanity.
← Write docs/GREYHARBOR_RULES_V1.md
Created file successfully: docs/GREYHARBOR_RULES_V1.md
> build · deepseek-v4.1-flash-free
← Edit docs/GREYHARBOR_RULES_V1.md
Index: docs/GREYHARBOR_RULES_V1.md
===================================================================
--- docs/GREYHARBOR_RULES_V1.md
+++ docs/GREYHARBOR_RULES_V1.md
@@ -191,5 +191,169 @@
 - 理智低会解锁疯狂面高战力，但也会逼近归零判负；这是 v1 的核心风险/收益轴。
 
 ---
 
+## 4. 三地点与棋盘
+
+### 4.1 地点
+
+| 地点 | 英文 | 槽位/方 | 定位 |
+|---|---|---:|---|
+| 现场 | `scene` | 5 | 正面冲突、献祭、环境压力 |
+| 档案 | `archive` | 5 | 连锁、封印、腐化、情报 |
+| 梦境 | `dream` | 3 | 高战力旧神/隐秘，准入受限 |
+
+- 每个地点每方有独立槽位，槽位从左到右排列。
+- 槽位满后不能继续向该地点打出单位；除非有卡牌离场腾出槽位。
+- 地点卡占用该地点的 **地点效果位**，不占单位槽位；每方每个地点最多 1 张地点卡。
+- 地点效果位与单位槽位互相独立。
+
+### 4.2 相邻
+
+- **相邻** = 同一地点内，该单位左侧或右侧 **紧邻的已占用槽位** 中的己方单位。
+- 空槽会隔断相邻关系：`A _ B` 中 A 与 B 不相邻。
+- 最多两个相邻单位（左一、右一）。
+- 盖牌、被封印的单位仍然占用槽位，仍然是“卡”，因此可以构成相邻/计数对象；但其自身光环被封印时无效。
+- 单位不能在夜晚之间自由移动；v1 没有普通移动动作。
+
+### 4.3 地点准入
+
+单位/旧神的 `location` 字段决定可放置地点：
+
+- `scene`：只能放现场。
+- `archive`：只能放档案。
+- `dream`：只能放梦境（仍受 §4.4 梦境准入限制）。
+- `any`：可放现场/档案；进入梦境需满足 §4.4。
+- `row` / `attach` / `all` 是效果牌的目标模式，不是单位放置地点。
+
+### 4.4 梦境准入限制（v1 裁定）
+
+梦境不是开放地点。只有以下情况可以把单位放入梦境：
+
+1. 该单位 `location = dream`（梦境原生），且满足槽位/每夜上限；
+2. 该单位 `location = any` **且拥有“隐秘”关键词**，以盖牌方式进入；
+3. 由卡牌效果明确放入/移动到梦境。
+
+补充规则：
+
+- 梦境原生且不带“隐秘”的单位（如深潜者、沉睡之主）可以正面进入。
+- 梦境原生且带“隐秘”的单位（如露西娅、低语者）必须 **盖牌进入**。
+- `location = any` 但不带“隐秘”的单位（如芬恩）不能主动进入梦境。
+- 每方每夜通过“从手牌打出”进入梦境的单位最多 **2 张**；由效果放入的不计此上限。
+- 仪式/事件以梦境为目标时不占单位槽位，也不计入 2 张上限。
+- 梦境槽位只有 3 个；满槽后不能再进入。
+
+> 卡面“可在梦境位置盖牌入场”是提示/确认文本，不额外突破上述限制。
+
+### 4.5 盖牌的位置与计分
+
+- 盖牌仍占一个单位槽位。
+- 盖牌在翻开前战力为 0，不提供光环，不计入夜分。
+- 盖牌在翻开前不能被对手的任何效果选中（封印、腐化、指定摧毁等）。
+- 盖牌可以被其控制者献祭/吞噬；控制者知道其身份。
+- 盖牌在 **每夜结束、夜分结算之前** 全部翻开；也可以由控制者在自己回合开始时提前翻开（见 §6.1）。
+- 盖牌翻开后立即成为正常正面单位，参与夜分与光环。
+
+---
+
+## 5. 卡牌类型与区域
+
+### 5.1 类型
+
+| 类型 | 进入区域 | 说明 |
+|---|---|---|
+| `leader` | 场外 | 不进入手牌/牌堆；提供每夜一次的主动技。 |
+| `unit` | 地点槽位 | 普通单位，有理性/疯狂双战力。 |
+| `oldgod` | 地点槽位 | 旧神单位，有双战力；可被“异怪”类效果引用。 |
+| `event` | 结算后进普通弃牌堆 | 一次性效果。 |
+| `ritual` | 结算后进普通弃牌堆 | 一次性仪式；其“本夜/下夜”效果作为独立持续效果记录。 |
+| `environment` | 全局环境区 | 本夜持续；夜分结算后进普通弃牌堆。 |
+| `equipment` | 附属在单位上 | 持续提供加成/替代效果；宿主离场时进普通弃牌堆。 |
+| `location` | 地点效果位 | 持续地点效果；可被封印；不产生夜分。 |
+
+### 5.2 区域
+
+- **牌堆（Deck）**：19 张非领袖牌，洗牌后背面朝上。抽牌只从牌堆顶。
+- **手牌（Hand）**：默认隐藏；理智 ≤3 时全部翻到疯狂面。
+- **棋盘（Board）**：三个地点，双方各自的槽位与地点效果位。
+- **普通弃牌堆（Discard）**：事件、仪式、环境、装备、被摧毁/正常离场的单位。公开信息。
+- **深渊弃牌堆（Abyss）**：被 **献祭/吞噬** 的卡。公开信息；是 Seance、Gravedigger 的检索区域。
+- **场外领袖区**：领袖卡，不作为棋盘卡，不被普通“封印一张敌方卡”选中。
+
+### 5.3 区域移动规则
+
+- 卡牌从棋盘进入普通弃牌堆：被摧毁、正常离场、宿主离场时的装备、夜末环境卡。
+- 卡牌从棋盘进入深渊：被献祭、被吞噬。
+- **摧毁 ≠ 献祭**：
+  - 摧毁进普通弃牌堆；
+  - 献祭/吞噬进深渊。
+- 银灯只能替代“摧毁或封印”，不能替代献祭/吞噬。
+- 卡牌进入弃牌堆/深渊时公开身份；盖牌离场时不再隐藏，但其“翻开时”效果不触发。
+- 牌堆抽空不洗回弃牌堆。
+
+### 5.4 地点卡
+
+- 地点卡打到自己对应的地点，占用该地点的地点效果位。
+- 同一地点每方只能有 1 张地点卡；已有地点卡时不能再打第二张。
+- 地点卡跨夜保留。
+- 地点卡可被封印；被封印期间其效果全部失效，但卡仍在场。
+- 地点卡没有战力，不参与夜分。
+
+#### 旧图书馆（Old Library）
+
+- 档案地点卡。
+- 被动：己方在档案的卡 **不会获得新的腐化标记**；已有腐化不自动清除。
+- 每夜一次：己方在档案打出一张卡时，其 `sanityCost` 减少 1（最低 0）。
+- 减费只在真正减少 ≥1 点时消耗“每夜一次”；对 0 费卡不消耗。
+- 地点卡本身打出时也可以享受这次减费（若它是本夜第一张在档案打出的卡）。
+
+#### 溺钟祭坛（Drowned Bell Altar）
+
+- 现场地点卡。
+- 在 **现场** 被献祭/吞噬的卡，不触发该卡的“理智反噬”。
+- 教团被动“献祭回响”的加成由 **+2 变为 +3**（只要祭坛在场且未被封印）。
+- 祭坛被封印时，以上两条都失效。
+
+### 5.5 环境卡
+
+- 环境卡是全局效果，不占地点槽位/地点效果位。
+- 多张环境卡可以同时存在；效果按各自文本叠加。
+- 环境效果持续到 **本夜夜分结算之后**，然后进入普通弃牌堆。
+- 环境卡可以被封印（效果失效但卡仍在场），也可以被 Abjuration 移除。
+- 下一夜需要重新打出环境卡才能再次生效。
+
+### 5.6 装备卡
+
+- 装备只能附属在 **己方正面单位** 上；盖牌不能成为装备目标。
+- 每个单位最多 1 件装备；已有装备时不能再附属第二件。
+- 装备跨夜保留；宿主离场时装备进入普通弃牌堆。
+- 装备被封印时，其加成与替代效果失效；宿主被封印不影响装备本身（除非装备也被封印）。
+- 宿主被献祭/吞噬时，装备不替代，直接进入普通弃牌堆。
+
+#### 银灯（Silver Lantern）
+
+- 附属单位 **+2 战力**。
+- 当附属单位 **将被摧毁或将被封印** 时，可以弃掉银灯，替代这次摧毁/封印；该次效果被取消，单位留在场上。
+- 替代是一次性触发；银灯进入普通弃牌堆。
+- 不能替代献祭、吞噬、理智归零、夜分比较。
+- 银灯被封印时，+2 与替代效果都失效。
+- 若同一时点既有摧毁又有封印（v1 无此类复合效果），控制者选择替代其中一个；银灯只替代一次。
+
+### 5.7 事件与仪式
+
+- 事件/仪式结算后进入普通弃牌堆。
+- 事件/仪式的“本夜/下夜”持续效果作为独立效果记录，不随卡牌进入弃牌堆而立即消失。
+- 持续效果在满足其文本规定的时点过期。
+- 已结算的事件/仪式不再能被封印（卡已不在场）；其持续效果也不能被普通封印取消。
+- Abjuration 只能移除“环境效果”，不能移除事件/仪式的持续效果。
+
+### 5.8 领袖
+
+- 领袖不在棋盘、不在手牌、不在牌堆。
+- 领袖主动技每夜一次，使用后本回合结束（视为一次行动）。
+- 领袖可以被明确写有“领袖”的效果封印（如千瞳）；普通“封印一张敌方卡”不能选领袖。
+- 领袖被封印期间不能使用主动技；已使用的次数不返还。
+- 领袖封印持续到下一夜开始。
+
+---
+
 <!-- APPEND -->

> build · deepseek-v4.1-flash-free
Part 3: the six keywords.
← Edit docs/GREYHARBOR_RULES_V1.md
Index: docs/GREYHARBOR_RULES_V1.md
===================================================================
--- docs/GREYHARBOR_RULES_V1.md
+++ docs/GREYHARBOR_RULES_V1.md
@@ -355,5 +355,161 @@
 - 领袖封印持续到下一夜开始。
 
 ---
 
+## 6. 六个关键词
+
+关键词既是数据标签，也是共享规则。卡面文本与关键词冲突时，以卡面明确写出的例外为准；未写明的部分按本节执行。
+
+### 6.1 隐秘（Stealth）
+
+| 维度 | 规则 |
+|---|---|
+| 触发 | 从手牌打出时；翻开时触发“盖牌入场翻开时”效果。 |
+| 目标 | 自身。 |
+| 效果 | 可以选择 **盖牌入场**。盖牌：对手看不到身份/战力/关键词；战力按 0；不提供光环；不能被对手效果选中；仍占槽位；仍作为“卡”被己方连锁/计数。 |
+| 持续 | 直到翻开或离场。 |
+| 叠加 | 不叠加；多张隐秘卡各自独立。 |
+| 清除 | 翻开即解除；离场时公开身份但 **不触发** 翻开效果。 |
+| 结算顺序 | 支付代价 → 盖放 → 不结算入场效果 → 到达翻面时点 → 公开身份 → 结算“翻开时”效果 → 若是疯狂面且带理智反噬，触发反噬 → 批次结束后检查理智。 |
+
+补充裁定：
+
+- 盖牌可以在以下时点翻开：
+  1. **控制者回合开始时**：可免费翻开任意张己方盖牌，不消耗行动；按控制者选择的顺序逐张结算。
+  2. **每夜结束、夜分结算之前**：所有剩余盖牌必须翻开；先由本夜先手方翻开其全部盖牌（顺序自选），再由另一方翻开。
+  3. 由效果明确翻开。
+- 在梦境，带隐秘的单位 **必须** 盖牌进入；在其他地点，隐秘是可选（可以正面入场）。
+- 盖牌在翻开前不能被封印、腐化、指定摧毁；但可以被其控制者献祭/吞噬。
+- 盖牌不提供“隐秘”关键词给公开计数效果。例如千瞳的“对手每有一张隐秘卡”只数 **正面朝上** 的隐秘卡，避免泄露隐藏信息。
+- 盖牌算作“己方卡”参与连锁/伊迪丝/弗兰克/芬恩的计数，但自身不提供光环。
+- 盖牌在打出时锁定面；若理智 ≤3，翻开时按疯狂面结算。
+
+### 6.2 封印（Seal）
+
+| 维度 | 规则 |
+|---|---|
+| 触发 | 带封印效果的卡入场结算时，或效果明确封印时。 |
+| 目标 | 默认：敌方 **场上正面** 的卡（单位/装备/地点/环境）。不能选领袖、手牌、牌堆、弃牌堆、盖牌。千瞳例外，可封印敌方领袖。 |
+| 效果 | 被封印卡的卡面文本、关键词、持续光环、触发能力全部失效；基础战力与来自其他来源的加成 **保留**；仍占槽位；仍可被选中、腐化、献祭。 |
+| 持续 | 直到 **下一夜开始**（在夜开始批次最前面过期）。当夜夜分结算时仍处于封印状态。 |
+| 叠加 | 不叠加。重复封印不产生额外效果，只刷新“到下一夜开始”的到期时间。 |
+| 清除 | 到期；Unexpected Aid 解除；卡离场。 |
+| 结算顺序 | 封印来源效果结算完成后立即生效；已进入队列的触发仍然结算，但被封印卡不再产生新触发。 |
+
+补充裁定：
+
+- 被封印的单位：自身连锁加成为 0；但仍作为“卡”被其他连锁计数。
+- 被封印的单位：理智反噬失效；被献祭时不触发反噬。
+- 被封印的银灯：+2 与替代摧毁/封印效果失效。
+- 被封印的旧图书馆/溺钟祭坛：其地点效果失效，但卡仍在场。
+- 被封印的环境卡：效果失效，但卡仍在场；夜末仍进弃牌堆。
+- 被封印的领袖：不能使用主动技；本夜已使用的次数不返还。
+- 封印不阻止腐化标记继续每夜生效（腐化不是被封印卡的能力）。
+- 若封印效果没有合法目标，效果不结算；Harold 的领袖技因此不能空放（见 §8.1）。
+- 封印一张已盖牌：非法目标；若某效果只有盖牌可选，则该效果不结算。
+
+### 6.3 腐化（Corruption）
+
+| 维度 | 规则 |
+|---|---|
+| 触发 | 带腐化效果的卡入场结算时，或效果明确施加腐化时。 |
+| 目标 | 默认：敌方 **正面单位**。不能选盖牌、领袖、地点卡、装备卡、环境卡。若文本指定“战力最高”，在合法目标中选当前战力最高者；并列时由施加者选择。 |
+| 效果 | 给目标放置 1 个腐化标记。每个腐化标记在 **之后每个夜晚开始时** 使目标累计 -1 战力。 |
+| 持续 | 标记留在目标上，跨夜保留，直到被清除或目标离场。 |
+| 叠加 | 同一目标最多 **3 个腐化标记**。每个标记独立累计：第 1 夜后各 -1，第 2 夜后再各 -1。超过 3 个时，改为选择下一个合法目标；没有则效果不结算。 |
+| 清除 | Abjuration 移除 1 个标记；Unexpected Aid 移除目标身上全部腐化；目标离场时全部消失。清除标记会同时移除该标记累计的全部战力损失。 |
+| 结算顺序 | 施加腐化的卡入场效果完成后放置标记；当夜不立即扣战力；从下一夜开始批次起累计。 |
+
+补充裁定：
+
+- 腐化造成的战力损失记录为 `corruptionLoss`，从当前战力中扣除；战力最低为 0。
+- 腐化不是“摧毁”：单位降到 0 仍留在场上。
+- 被封印不阻止腐化标记继续累计；封印只关闭卡自身能力。
+- 免疫：
+  - 旧图书馆：己方档案卡免疫 **新的** 腐化标记；已有标记不自动清除。
+  - Warding Rite：目标地点本夜己方卡免疫 **新的** 腐化标记；已有标记不自动清除。
+  - 若“战力最高”的目标免疫，则改选下一个合法目标。
+- 盖牌不能被施加腐化；翻开后可以。
+- 腐化标记在目标离场时消失；不会转移到其他卡。
+
+### 6.4 献祭（Sacrifice）
+
+| 维度 | 规则 |
+|---|---|
+| 触发 | 卡牌/领袖技能要求献祭时；Bell-Claw 的“吞噬”视为献祭变体。 |
+| 目标 | 默认：己方 **场上单位**（可含盖牌）。v1 中卡面写“卡”的献祭也按单位处理，除非未来卡牌明确允许其他类型。不能献祭领袖。 |
+| 效果 | 将目标移出棋盘，放入 **深渊弃牌堆**（不是普通弃牌堆）。目标身上的装备进入普通弃牌堆；腐化标记消失。然后结算献祭带来的后续效果。 |
+| 持续 | 瞬时；被献祭卡留在深渊，直到被效果取回。 |
+| 叠加 | 每次献祭独立计数；教团被动的“每夜首次献祭”只触发一次。 |
+| 清除 | 深渊中的单位可被 Seance、Gravedigger 取回；除此之外不自然返回。 |
+| 结算顺序 | 选择目标 → Hooded Acolyte 替代 → 移出棋盘 → 放入深渊 → 结算理智反噬（若疯狂面且不在溺钟祭坛） → 教团被动（若本夜首次） → 结算献祭的后续效果 → 批次结束后检查理智。 |
+
+补充裁定：
+
+- **替换**：Hooded Acolyte 可以替代任意己方单位被献祭，忽略“相邻”等位置要求；替代后视为献祭已满足。多张 Acolyte 时任选 1 张。
+- **不能自我支付**：一张卡不能为它自己的入场效果献祭自己。例如 Gravedigger 不能献祭自己来触发自己的取回。
+- **不能自取**：为某效果献祭的卡，不能被该效果自身从深渊取回。例如 Seance 献祭的单位不能成为 Seance 取回的目标；Gravedigger 同理。
+- **理智反噬**：被献祭的卡若是疯狂面且带理智反噬，控制者失去 1 理智；在 **现场** 且有未被封印的溺钟祭坛时不触发。被封印的卡其理智反噬失效，也不触发。
+- **盖牌献祭**：可以献祭己方盖牌；公开身份并进入深渊，但其“翻开时”效果不触发；若锁定为疯狂面且带理智反噬，仍触发反噬（祭坛例外）。
+- **献祭不是摧毁**：银灯不能替代献祭/吞噬。
+- **Bell-Claw 吞噬**：
+  - 入场时可选：吞噬一张相邻己方单位。
+  - 被吞噬单位进入深渊，视为一次献祭（触发教团被动/祭坛规则/理智反噬）。
+  - Bell-Claw **永久获得** 该单位被吞噬时的当前战力（含其有效加成），加到自身当前战力与双面基础值上。
+  - 没有相邻己方单位时不吞噬，正常入场。
+- **Seance**：献祭 1 张己方单位，然后从深渊取回最多 2 张单位入手牌；不足则取可用数量；不能取本次献祭的卡。
+- **Gravedigger**：入场时，若可献祭，则必须献祭 1 张己方单位；然后从深渊取回 1 张单位入手牌（不能取本次献祭的卡，也不能取自己）。若没有可献祭单位，则不结算取回。
+- **Elias 领袖技**：献祭 1 张己方单位，然后从牌堆直接打出 1 个异怪单位；详见 §8.2。
+
+### 6.5 连锁（Chain）
+
+| 维度 | 规则 |
+|---|---|
+| 触发 | 持续效果；棋盘变化时重新计算。 |
+| 目标 | 自身。 |
+| 效果 | 按卡面指定的计数范围，每有 1 张符合条件的己方卡，自身 +1 战力，受卡面上限约束。 |
+| 持续 | 只要该卡在场上、正面朝上且未被封印。 |
+| 叠加 | 不同连锁卡各自独立计算，加成相加；上限是“每张卡”的上限，不是全局上限。 |
+| 清除 | 卡离场、被封印、或计数对象变化时立即重算；被封印期间自身连锁为 0。 |
+| 结算顺序 | 在基础战力、永久修正、装备、本夜加减之后，作为加算步骤统一计算；连锁只数“卡”，不数战力。 |
+
+具体卡牌口径：
+
+| 卡 | 计数范围 | 上限 |
+|---|---|---|
+| 伊迪丝·巴罗（Edith Barrow） | 档案地点内 **其他** 己方卡（含盖牌/被封印卡） | 无卡面上限；受 5 槽位限制，实际最高 +4 |
+| 弗兰克·霍尔特（Frank Holt） | 同地点内左右紧邻的己方卡 | +3 |
+| 芬恩·卡洛威（Finn Calloway） | 同地点内左右紧邻的己方卡 | +2 |
+
+补充裁定：
+
+- 空槽隔断相邻；盖牌与被封印卡仍算“卡”。
+- 连锁卡自身不计入自己的计数。
+- 连锁加成是加算，不参与“先乘后加”类运算（v1 没有战力乘法）。
+- 被封印的连锁卡自身加成为 0，但仍可被其他连锁卡计数。
+- 连锁卡离场后加成立即消失，不留下持续标记。
+
+### 6.6 理智反噬（Sanity Backlash）
+
+| 维度 | 规则 |
+|---|---|
+| 触发 | 以下任一：① 带此关键词的单位以 **疯狂面** 正面入场并完成入场效果；② 带此关键词的盖牌以疯狂面翻开并完成翻开效果；③ 带此关键词的疯狂面单位被献祭/吞噬。 |
+| 目标 | 该卡的控制者。 |
+| 效果 | 控制者失去 **1 点理智**。卡面额外写的“疯狂面 +3”等属于该卡的战力修正，不是关键词的一部分。 |
+| 持续 | 瞬时。 |
+| 叠加 | 每张卡分别触发；同一批次多张同时触发时逐张结算，失去量累加。 |
+| 清除 | 无需清除；它是触发能力。被封印期间失效；理性面不触发。 |
+| 结算顺序 | 入场/翻开效果完成后触发；献祭时在移出棋盘并进入深渊后、后续效果前触发；整个效果批次结束后才检查理智归零。 |
+
+补充裁定：
+
+- 带此关键词的卡若以理性面入场/翻开，不触发反噬。
+- 被封印的卡其理智反噬失效；若在入场后、反噬前被封印（v1 无此窗口），则不触发。
+- 疯狂面单位被献祭时触发 1 点；在 **现场** 且有未被封印的溺钟祭坛时不触发。
+- 反噬不是代价，不能被旧图书馆减费、不能被“防止失去理智”类效果防止（v1 暂无）。
+- 同一张卡一回合内多次进出场，每次符合条件的入场/翻开/献祭都分别触发。
+- 若反噬使理智归零，当前卡牌/领袖技的剩余效果仍先完成，然后判负。
+
+---
+
 <!-- APPEND -->

> build · deepseek-v4.1-flash-free
Part 4: faction passives, leaders, and the global resolution order.
← Edit docs/GREYHARBOR_RULES_V1.md
Index: docs/GREYHARBOR_RULES_V1.md
===================================================================
--- docs/GREYHARBOR_RULES_V1.md
+++ docs/GREYHARBOR_RULES_V1.md
@@ -511,5 +511,254 @@
 - 若反噬使理智归零，当前卡牌/领袖技的剩余效果仍先完成，然后判负。
 
 ---
 
+## 7. 阵营被动
+
+阵营被动只对使用该阵营的玩家生效；该玩家控制的中立卡也享受其阵营被动。
+
+### 7.1 学会（society）· 理性防线
+
+- **触发**：每夜开始批次。
+- **效果**：若你的理智低于 6，回复 1 点理智（上限 6）。
+- **时点**：在腐化累计与强制失去理智之后、夜开始理智检查之前。
+- **叠加**：每夜最多 1 次；多个来源不叠加。
+- **裁定**：若同一夜开始批次中，沉睡之主的每夜扣减使你降到 0，随后理性防线回复 1，则你在本批次结束时以 1 点理智存活；夜开始批次全部结算后才检查归零。
+
+### 7.2 教团（cult）· 献祭回响
+
+- **触发**：每夜 **第一次** 献祭/吞噬己方单位后。
+- **效果**：本夜己方所有正面单位 **+2 战力**；若溺钟祭坛在场且未被封印，则改为 **+3**。
+- **范围**：三个地点的己方全部正面单位，包括献祭之后才打出的单位、以及之后翻开的盖牌。
+- **持续**：到本夜夜分结算结束；不跨夜。
+- **叠加**：每夜只触发一次；多次献祭不叠加。Hooded Acolyte 替代献祭仍然计数。
+- **裁定**：
+  - 祭坛只要求“在场且未被封印”，不要求献祭发生在现场；但“不触发理智反噬”只适用于 **现场** 的献祭。
+  - 若第一次献祭被某种效果取消（v1 无取消），不触发；若献祭实际完成，则触发。
+  - 被献祭的卡本身已离场，不吃加成。
+  - 该加成是玩家光环，不是单位能力；被封印的单位仍然享受。
+
+### 7.3 中立（neutral）
+
+- 中立没有阵营被动。
+- 中立卡由玩家控制时，正常享受控制者的阵营被动。
+
+---
+
+## 8. 领袖主动技
+
+领袖不进入牌堆/手牌，放在场外领袖区。主动技 **每夜一次**，使用后本回合结束（视为一次行动）。
+
+### 8.1 哈罗德·阿什比（Harold Ashby，学会）
+
+- **次数**：每夜 1 次。
+- **行动**：消耗本回合行动。
+- **目标**：1 张敌方 **场上正面** 卡（单位/装备/地点/环境）。不能选领袖、盖牌、手牌、牌堆、弃牌堆。
+- **效果**：
+  1. 封印目标，直到下一夜开始；
+  2. 回复 1 点理智（上限 6）。
+- **顺序**：先封印，再回复理智；之后检查理智。
+- **限制**：
+  - 必须有合法目标才能使用；没有合法目标时不能空放。
+  - 领袖被封印时不能使用。
+  - 不能封印敌方领袖；领袖封印只来自明确写“领袖”的效果（千瞳）。
+
+### 8.2 伊莱亚斯·索恩（Elias Thorne，教团）
+
+- **次数**：每夜 1 次。
+- **行动**：消耗本回合行动。
+- **目标/代价**：
+  1. 献祭 1 张己方场上单位（Hooded Acolyte 可替代）；
+  2. 从己方牌堆选择 1 个 **异怪单位**，直接打出到合法地点。
+- **异怪单位定义（v1）**：`cult` 阵营的 `unit`（非领袖），以及 `neutral` 阵营的 `oldgod`。不含 society 单位、neutral 普通单位、领袖、事件/仪式/环境/地点/装备。
+- **效果**：
+  1. 完成献祭（进深渊、触发理智反噬/祭坛/教团被动）；
+  2. 从牌堆查看并选择 1 个异怪单位；
+  3. 将其正面打出到合法地点，**不支付 `sanityCost`**；
+  4. 其入场效果正常结算；若以疯狂面入场且带理智反噬，正常触发。
+- **限制**：
+  - 必须同时满足：有可献祭的己方单位、牌堆中有异怪单位、有合法放置地点；否则不能使用。
+  - 必须遵守该单位的地点亲和、梦境准入、槽位上限；由效果放入梦境不占“每夜 2 张”手牌入场上限。
+  - 该单位的面由当前理智决定；理智 ≤3 时为疯狂面。
+  - 若牌堆中没有异怪单位，不能使用，不会只献祭不拉人。
+  - 领袖被封印时不能使用。
+
+---
+
+## 9. 全局结算顺序
+
+本节是引擎必须实现的严格顺序。任何卡牌效果都不得跳步或改变顺序，除非卡面明确写出例外。
+
+### 9.1 比赛建立
+
+1. 双方选择预设牌组与领袖。
+2. 洗 19 张非领袖牌，抽 8 张起始手牌。
+3. 换牌：各弃至多 2 张，洗回，补抽同数量。
+4. 双方理智设为 6。
+5. 决定第一夜先手（硬币/种子）。
+6. 进入第一夜开始。
+
+### 9.2 夜晚开始（第 N 夜）
+
+按以下顺序执行：
+
+1. **过期**：清除上一夜的“直到下一夜”封印、Tide Ritual 的 +3、以及其他“下夜复原”的临时修正。
+2. **重置每夜计数**：领袖技使用次数、旧图书馆减费、教团首次献祭、梦境每夜 2 张入场计数、其他“每夜一次”标记。
+3. **确定本夜先手**：
+   - 第一夜：开局硬币结果；
+   - 第二/三夜：上一夜败方；
+   - 上一夜平夜：上一夜先手方。
+4. **夜开始触发**（按先手方先、后手方后的顺序；同一玩家内按以下固定顺序）：
+   1. 腐化累计：每个腐化标记使宿主 -1 战力；
+   2. 强制失去理智：沉睡之主每夜 -1，以及其他“每夜”失去理智；
+   3. 学会被动：若理智 <6，回复 1；
+   4. 其他夜开始效果（v1 无）。
+5. **理智检查**：若一方为 0，立即判负；双方同时 0 判平局。
+6. **抽牌**：第二/三夜双方各抽 2 张；不足则抽可用数量。
+7. **进入行动阶段**。
+
+### 9.3 行动阶段
+
+- 当前行动方选择以下之一：
+  1. 从手牌打出 1 张卡；
+  2. 使用领袖主动技（每夜 1 次）；
+  3. Pass。
+- 每次行动后，行动权交给对方。
+- 已 Pass 的一方本夜不能再行动；另一方可以连续行动，直到其也 Pass 或无法行动。
+- 双方都 Pass 时，进入夜晚结束。
+- 若当前方没有任何合法行动（无牌可打、领袖不可用/已用），自动 Pass。
+- 手牌为 0 且领袖不可用时自动 Pass。
+- 领袖技使用后本回合立即结束，行动权交给对方。
+
+#### 回合开始时的免费翻牌
+
+- 在你回合开始时、选择行动之前，可以免费翻开任意张己方盖牌。
+- 翻牌不是行动，不消耗行动次数。
+- 翻开的“翻开时”效果按你选择的顺序逐张结算。
+- 翻牌批次结束后检查理智；若归零，立即判负，不能再行动。
+
+### 9.4 打出一张卡
+
+1. 从手牌选择卡牌；根据当前理智锁定其面（理性/疯狂）。
+2. 选择合法地点/槽位/目标/附属宿主。
+3. 合法性检查：
+   - 地点亲和；
+   - 梦境准入与每夜 2 张上限；
+   - 槽位是否已满；
+   - 目标是否合法（正面、非英雄/非领袖限制等）；
+   - 装备宿主是否合法；
+   - 理智是否足够支付 `sanityCost`。
+4. 计算并支付理智代价（旧图书馆减费在此应用）。
+5. 放置/结算：
+   - **单位/旧神**：放入槽位。若选择盖牌，则不结算入场效果；若正面，立即结算入场效果。
+   - **事件/仪式**：结算效果；卡牌进入普通弃牌堆；持续效果单独记录。
+   - **环境**：放入全局环境区；效果立即生效；本夜夜分结算后进普通弃牌堆。
+   - **装备**：附属到宿主；加成立即生效。
+   - **地点**：放入对应地点的地点效果位；效果立即生效。
+6. 重算持续效果（连锁、光环、腐化等）。
+7. 若正面单位以疯狂面入场且带理智反噬，触发失去 1 理智。
+8. 结算该卡的其他“结算后”效果。
+9. 理智检查。
+10. 本回合结束，行动权交给对方。
+
+### 9.5 使用领袖技
+
+1. 声明使用；检查每夜次数、是否被封印。
+2. 选择目标/支付献祭等代价。
+3. 按卡面顺序结算。
+4. 标记本夜已使用。
+5. 理智检查。
+6. 本回合结束，行动权交给对方。
+
+### 9.6 夜晚结束
+
+双方都 Pass 后，按以下顺序结算：
+
+1. **翻开所有盖牌**：
+   - 本夜先手方先翻开其全部盖牌，顺序自选；
+   - 然后后手方翻开其全部盖牌，顺序自选；
+   - 每张翻开的“翻开时”效果立即结算；
+   - 翻牌批次结束后检查理智。
+2. **结算夜末触发**：v1 无额外夜末触发；环境卡仍在场，直到夜分结算完成。
+3. **计算夜分**：按 §9.7 的顺序逐单位计算，汇总三个地点。
+4. **比较夜分**：
+   - 高者获得 1 个夜胜；
+   - 相同则剩余理智高者获得夜胜；
+   - 仍相同则平夜。
+5. **胜负检查**：
+   - 若一方达到 2 个夜胜，比赛结束；
+   - 若理智为 0（理论上已在前面检查），立即判负。
+6. **清理本夜**：
+   - 所有“本夜”临时加成失效；
+   - 所有环境卡进入普通弃牌堆；
+   - Tide Ritual 等“下夜复原”的临时值记录为待过期（下一夜开始清除）。
+7. **进入下一夜**：不清场，不弃置单位、地点、装备；保留手牌、牌堆、弃牌堆、深渊、理智。
+8. 若已打完第三夜仍未分胜负，按 §1.3 的 tiebreak 判定。
+
+### 9.7 战力计算顺序（严格）
+
+对每个正面单位，按以下顺序计算当前战力：
+
+1. **面与基础战力**：
+   - 理性面：`reasonPower`；
+   - 疯狂面：`madnessPower`；
+   - 盖牌：战力 0，跳过后续步骤。
+2. **永久修正**：
+   - Bell-Claw 吞噬获得的永久战力；
+   - Unexpected Aid 的永久 +3；
+   - 其他“永久”修正。
+3. **腐化损失**：减去该卡所有腐化标记累计的 `corruptionLoss`。
+4. **装备加成**：加上附属装备的 +2 等（被封印的装备不加）。
+5. **本夜加减**：
+   - Tide Ritual：梦境己方卡 +3；
+   - Warding Rite：目标地点己方卡 +1；
+   - Lunar Eclipse：理性面 -1 / 疯狂面 +1；
+   - Stormy Night：现场双方卡 -2；
+   - 教团被动：己方全部正面单位 +2/+3；
+   - 其他“本夜”效果。
+6. **连锁加成**：按 §6.5 计算，加到当前战力。
+7. **下限钳制**：当前战力最低为 0。
+8. **汇总**：先按地点求和，再求三地点总和，得到夜分。
+
+补充：
+
+- 被封印的单位：其自身持续能力（含连锁）为 0，但基础战力、永久修正、装备、其他来源的本夜加减仍然生效。
+- 被封印的装备：其加成不生效。
+- 被封印的地点/环境：其效果不生效。
+- 盖牌在翻开前不参与上述计算；夜末翻开后按正面单位计算。
+- 战力没有上限；下限为 0。
+- v1 没有战力乘法；所有修正都是加算/减算。
+
+### 9.8 同时触发与批次
+
+- 同一玩家的多个同时触发：由该玩家选择结算顺序。
+- 双方同时触发：按本夜先手方先、后手方后的顺序。
+- 一个卡牌/领袖技效果产生的多个子效果视为 **一个批次**：批次内全部结算完，再检查理智归零。
+- 批次内若一方理智已降到 0，仍继续完成该批次，然后判负；不会中途截断。
+- 不同动作之间分别检查；前一个动作导致归零时，后一个动作不再发生。
+
+### 9.9 替代效果
+
+- **Hooded Acolyte**：在献祭目标确定前替代；替代后原目标不被献祭。忽略相邻等位置要求。
+- **Silver Lantern**：在“摧毁/封印”事件发生前替代；替代后该次摧毁/封印取消，银灯进普通弃牌堆。
+- 同一事件有多个替代时，由受影响卡的控制者选择 1 个适用；不能同时适用多个。
+- 替代效果不改变事件的其他部分（例如封印被银灯替代后，封印来源的其他效果仍结算）。
+
+### 9.10 隐藏信息
+
+| 信息 | 可见性 |
+|---|---|
+| 手牌内容 | 仅持有者 |
+| 牌堆顺序/内容 | 不可见；只公开数量 |
+| 盖牌身份/战力/关键词 | 仅控制者；对手只看到“盖牌” |
+| 场上正面卡 | 双方可见 |
+| 普通弃牌堆/深渊 | 双方可见 |
+| 理智、夜胜、地点槽位 | 双方可见 |
+| Nora 查看的手牌 | 仅 Nora 控制者私密查看 |
+| Arthur 展示的手牌 | 双方公开 |
+
+- AI 只能读取自己的 view：不得读取对手手牌、牌堆顺序、盖牌身份。
+- 公开计数效果不统计隐藏信息（见 §6.1 千瞳裁定）。
+
+---
+
 <!-- APPEND -->

> build · deepseek-v4.1-flash-free
Part 5: preset deck lists, per-card rulings, and data audit contract.
← Edit docs/GREYHARBOR_RULES_V1.md
Index: docs/GREYHARBOR_RULES_V1.md
===================================================================
--- docs/GREYHARBOR_RULES_V1.md
+++ docs/GREYHARBOR_RULES_V1.md
@@ -760,5 +760,192 @@
 - 公开计数效果不统计隐藏信息（见 §6.1 千瞳裁定）。
 
 ---
 
-<!-- APPEND -->
+## 10. 预设牌组（v1 唯一合法牌组）
+
+> v1 不做组牌器。以下两套为唯一可用预设，均为 20 张（含 1 领袖）。
+> 非领袖卡最多 2 份；只能使用本阵营 + 中立。
+
+### 10.1 学会预设（Society）
+
+领袖：**Harold Ashby 哈罗德·阿什比 ×1**
+
+| 卡牌 | 份数 |
+|---|---:|
+| Nora Wells 诺拉·威尔斯 | 2 |
+| Dr. Samuel Pike 派克医生 | 2 |
+| Edith Barrow 伊迪丝·巴罗 | 1 |
+| Walter Morse 沃尔特·莫斯 | 1 |
+| Lucia Vaughn 露西娅·沃恩 | 1 |
+| Capt. Frank Holt 霍尔特上尉 | 1 |
+| Arthur Pendleton 亚瑟·彭德尔顿 | 1 |
+| Abjuration 驱魔咒 | 1 |
+| Warding Rite 结界术 | 1 |
+| The Silver Lantern 银灯 | 1 |
+| The Old Library 旧图书馆 | 1 |
+| Finn Calloway 芬恩·卡洛威 | 1 |
+| Silas Gold 赛拉斯·戈尔德 | 2 |
+| Thousand Eyes 千瞳 | 1 |
+| Unexpected Aid 意外援手 | 1 |
+| Stormy Night 暴雨夜 | 1 |
+
+合计：1 领袖 + 19 非领袖 = **20**。
+
+### 10.2 教团预设（Cult）
+
+领袖：**Elias Thorne 伊莱亚斯·索恩 ×1**
+
+| 卡牌 | 份数 |
+|---|---:|
+| Hooded Acolyte 蒙面信徒 | 2 |
+| Zealot 狂信徒 | 2 |
+| Sea Priestess 海祭司 | 1 |
+| Gravedigger 掘墓人 | 1 |
+| The Whisperer 低语者 | 1 |
+| Deep One 深潜者 | 1 |
+| Bell-Claw 钟爪怪 | 1 |
+| Séance 降灵会 | 1 |
+| Tide Ritual 潮汐仪式 | 1 |
+| Lunar Eclipse 月食 | 1 |
+| Drowned Bell Altar 溺钟祭坛 | 1 |
+| Finn Calloway 芬恩·卡洛威 | 1 |
+| Silas Gold 赛拉斯·戈尔德 | 1 |
+| The Sleeper 沉睡之主 | 1 |
+| Thousand Eyes 千瞳 | 1 |
+| Stormy Night 暴雨夜 | 1 |
+| Unexpected Aid 意外援手 | 1 |
+
+合计：1 领袖 + 19 非领袖 = **20**。
+
+---
+
+## 11. 卡牌裁定表
+
+本表补齐卡面文本的 v1 解释；与关键词总则冲突时，以本表明确写出的例外为准。
+
+### 11.1 学会
+
+| 卡 | v1 裁定 |
+|---|---|
+| **Harold Ashby 哈罗德·阿什比**（领袖） | 每夜一次，消耗行动：封印 1 张敌方正面场上卡直到下一夜，并回复 1 理智。必须有合法目标；不能封领袖/盖牌。 |
+| **Nora Wells 诺拉·威尔斯**（现场 2/4，隐秘） | 可盖牌。翻开时私密查看对手 1 张随机手牌；不向对手展示。 |
+| **Dr. Samuel Pike 派克医生**（现场 4/4，封印） | 入场二选一：移除场上 1 个腐化标记；或封印 1 张当前战力 ≤4 的敌方正面单位直到下一夜。不能封领袖/盖牌。 |
+| **Edith Barrow 伊迪丝·巴罗**（档案 2/3，连锁） | 持续：档案地点每有 1 张 **其他** 己方卡，自身 +1；无卡面上限（5 槽位实际最高 +4）。 |
+| **Walter Morse 沃尔特·莫斯**（档案 3/6，理智反噬） | 理性面 3；疯狂面 6，入场后失去 1 理智。被封印时反噬失效。 |
+| **Lucia Vaughn 露西娅·沃恩**（梦境 1/7，隐秘） | 梦境原生；在梦境必须盖牌进入。无额外翻开效果；卡面文本是梦境准入提示。 |
+| **Capt. Frank Holt 霍尔特上尉**（现场 5/5，连锁） | 持续：每有 1 张相邻己方卡 +1，上限 +3。盖牌/被封印卡仍可被计数。 |
+| **Arthur Pendleton 亚瑟·彭德尔顿**（档案 3/4，隐秘） | 可盖牌。翻开时随机展示对手 1 张手牌，双方可见。 |
+| **Abjuration 驱魔咒**（事件，any） | 二选一：移除场上 1 个腐化标记（可敌方可友方）；或移除 1 张环境卡（进普通弃牌堆）。不能移除封印。 |
+| **Warding Rite 结界术**（事件，row） | 选择一个己方地点；该地点己方卡本夜 +1，并免疫 **新的** 封印与腐化。已有标记/封印不清除。目标地点卡也受保护。 |
+| **The Silver Lantern 银灯**（装备，attach） | 附属单位 +2。宿主将被摧毁/封印时，弃银灯替代该次事件。不能替代献祭/吞噬/理智归零。被封印时失效。 |
+| **The Old Library 旧图书馆**（地点，archive） | 档案己方卡免疫新腐化；每夜一次，己方在档案打出的卡理智代价 -1（最低 0）。被封印时失效。 |
+
+### 11.2 教团
+
+| 卡 | v1 裁定 |
+|---|---|
+| **Elias Thorne 伊莱亚斯·索恩**（领袖） | 每夜一次，消耗行动：献祭 1 张己方单位，然后从牌堆直接打出 1 个异怪单位（cult unit 或 neutral oldgod），不付理智代价。必须三条件齐全（可献祭、牌堆有异怪、有合法地点）。 |
+| **Hooded Acolyte 蒙面信徒**（现场 2/3，献祭） | 可替代任意己方单位被献祭，忽略相邻等位置要求；替代后视为献祭已满足。自身被正常献祭时无额外效果。 |
+| **Zealot 狂信徒**（现场 3/6，理智反噬） | 理性面 3；疯狂面基础 6 + 3 = 9；疯狂面入场后失去 1 理智。 |
+| **Sea Priestess 海祭司**（档案 4/5，腐化） | 入场：给 1 张合法敌方正面单位放置 1 个腐化标记；默认选当前战力最高者，并列由你选。若最高者免疫，选下一个。 |
+| **Gravedigger 掘墓人**（档案 3/4，献祭） | 入场：若可献祭，必须献祭 1 张己方单位；然后从深渊取回 1 张单位入手牌。不能取本次献祭的卡，也不能取自己；无可献祭单位则不取回。 |
+| **The Whisperer 低语者**（梦境 2/7，隐秘） | 梦境原生；在梦境必须盖牌。翻开时对手失去 1 理智。 |
+| **Deep One 深潜者**（梦境 5/8，理智反噬，代价 1） | 理性面 5；疯狂面基础 8 + 3 = 11；疯狂面入场后失去 1 理智；打出支付 1 理智。 |
+| **Bell-Claw 钟爪怪**（现场 6/6，献祭，代价 1） | 入场可选：吞噬 1 张相邻己方单位，永久获得其当前战力，并视为一次献祭。无相邻单位则不吞噬，正常入场。 |
+| **Séance 降灵会**（仪式，any） | 必须献祭 1 张己方单位；然后从深渊取回最多 2 张单位入手牌。不能取本次献祭的卡。无可献祭单位时不能打出。 |
+| **Tide Ritual 潮汐仪式**（仪式，dream） | 本夜己方梦境单位 +3；下一夜开始清除。卡本身结算后进普通弃牌堆。 |
+| **Lunar Eclipse 月食**（环境，all） | 本夜双方所有正面单位：理性面 -1、疯狂面 +1。夜分结算后进普通弃牌堆。 |
+| **Drowned Bell Altar 溺钟祭坛**（地点，scene） | 现场献祭/吞噬不触发理智反噬；只要祭坛在场且未被封印，教团被动加成改为 +3。被封印时两条都失效。 |
+
+### 11.3 中立
+
+| 卡 | v1 裁定 |
+|---|---|
+| **Finn Calloway 芬恩·卡洛威**（any 3/4，连锁） | 可放现场/档案；因不带隐秘，不能主动进梦境。每有 1 张相邻己方卡 +1，上限 +2。 |
+| **Silas Gold 赛拉斯·戈尔德**（档案 2/3，隐秘） | 可盖牌。翻开时：若手牌非空，弃 1 张手牌；展示牌堆顶 3 张，选 1 张入手，其余洗回牌堆。牌堆不足 3 张则展示全部。 |
+| **The Sleeper 沉睡之主**（梦境 oldgod 8/12，理智反噬，代价 2） | 不能被任何效果封印。入场失去 2 理智；此后每夜开始再失去 1。疯狂面入场时理智反噬再 -1。梦境原生，可正面进入。 |
+| **Thousand Eyes 千瞳**（档案 oldgod 7/10，封印，代价 2） | 入场：封印敌方领袖能力一夜。持续：对手每有 1 张 **正面** 隐秘卡，自身 +1。不能封盖牌。 |
+| **Stormy Night 暴雨夜**（环境，all） | 本夜双方现场所有正面单位 -2。夜分结算后进普通弃牌堆。 |
+| **Unexpected Aid 意外援手**（事件，any） | 目标己方正面单位：永久 +3；移除其身上全部封印与全部腐化（腐化累计损失一并移除）。不能选盖牌。 |
+
+---
+
+## 12. 数据字段与审计口径
+
+### 12.1 规范化输出
+
+导入器：`scripts/import-card-table.mjs`
+输入：`card-table-v1.csv`
+输出：`src/data/card-table.normalized.json`
+
+每个卡对象字段：
+
+| 字段 | 类型 | 说明 |
+|---|---|---|
+| `id` | string | 小写 kebab-case，唯一 |
+| `nameZh` | string | 中文名 |
+| `nameEn` | string | 英文名 |
+| `faction` | enum | `society` / `cult` / `neutral` |
+| `type` | enum | `leader` / `unit` / `oldgod` / `event` / `equipment` / `location` / `ritual` / `environment` |
+| `location` | enum/null | `scene` / `archive` / `dream` / `any` / `row` / `attach` / `all`；领袖为 `null` |
+| `reasonPower` | number/null | 理性面战力；非单位/旧神为 `null` |
+| `madnessPower` | number/null | 疯狂面战力；非单位/旧神为 `null` |
+| `keywords` | string[] | 六个关键词的子集；空数组表示无关键词 |
+| `sanityCost` | number | 0..6 |
+| `copies` | number | 收藏份数 1..3；领袖必须 1 |
+| `effect` | string | 卡牌效果文本 |
+| `flavor` | string | 风味文本 |
+
+### 12.2 校验规则
+
+- CSV：真正的状态机解析，支持引号、字段内逗号、换行、空字段、`""` 转义。
+- 表头：必须与 13 列预期完全一致；按表头映射，不按列号硬读。
+- 结构性修复：若某行字段数 = 14 且删除某个空字段后可得到合法 13 列，则自动修复并记录 warning/repair；无法修复则 error。
+- 枚举：faction / type / location / keywords 全部校验。
+- 类型-地点兼容：领袖空地点；单位/旧神只能 scene/archive/dream/any；装备 attach；环境 all；地点 scene/archive/dream；事件/仪式按目标模式。
+- 数值范围：reasonPower 0..12、madnessPower 0..15、sanityCost 0..6、copies 1..3。
+- 引用完整性：
+  - id 唯一；
+  - society / cult 各恰好 1 位领袖，neutral 无领袖；
+  - 预设牌组恰好 20 张、1 领袖、引用 id 存在、只能本阵营 + 中立、非领袖最多 2 份；
+  - 六个关键词在卡池中至少出现一次。
+- 文本完整性：30/30 `effect` 非空、`flavor` 非空。
+- 关键词提示：效果文本提到关键词但 `keywords` 未标注时输出 warning，不自动改数据（关键词是设计标签，不等同于文本提及）。
+- 牌池提示：严格按 `copies` 收藏不足 20 张时输出 warning；v1 预设使用独立预设份数规则。
+
+### 12.3 本次导入审计结果
+
+- 原始数据行：30
+- 成功规范化：30
+- 自动修复行：0（当前 CSV 已是 13 列，无结构性错位）
+- **ERROR：0**
+- WARNING：17
+  - 15 条“效果文本提到关键词但未标注”的提示；
+  - 2 条“严格 copies 收藏不足 20 张”的牌池提示。
+- 预设牌组：society 20/20、cult 20/20，均通过引用/阵营/份数校验。
+
+### 12.4 运行方式
+
+```bash
+node scripts/import-card-table.mjs
+```
+
+退出码：0 = 0 error；1 = 存在 error。warning 不阻塞导入。
+
+---
+
+## 13. v1 明确不做的事
+
+- 不做组牌器/收藏编辑/自由构筑。
+- 不做联机、账号、战绩。
+- 不做单位普通移动动作。
+- 不做战力乘法/护甲/反击等多层战斗系统。
+- 不做“摧毁”类卡牌（v1 卡池没有直接摧毁效果；银灯替代是为未来预留）。
+- 不做牌堆洗回、疲劳伤害。
+- 不做第四夜；三夜是硬上限。
+- 不自动从文本解析效果；引擎只读结构化数据。
+
+---
+
+**规则冻结。** 后续引擎/UI/AI 不得临时新增未写入本文件的裁定；如需变更，先更新本文件并提升版本号。
+

> build · deepseek-v4.1-flash-free
Now validating the parser, JSON output, and document completeness.
$ node -e "const d=require('./src/data/card-table.normalized.json'); const ids=new Set(d.map(c=>c.id)); console.log('cards',d.length,'unique',ids.size); console.log('fields',Object.keys(d[0]).join(',')); console.log('errors',d.filter(c=>!c.id||!c.nameZh||!c.nameEn||!c.faction||!c.type||!c.effect||!c.flavor).length); console.log('leaders',d.filter(c=>c.type==='leader').map(c=>c.id));"
cards 30 unique 30
fields id,nameZh,nameEn,faction,type,location,reasonPower,madnessPower,keywords,sanityCost,copies,effect,flavor
errors 0
leaders [ 'harold-ashby', 'elias-thorne' ]
$ node --check scripts/import-card-table.mjs
(no output)
$ node --input-type=module -e "import {parseCsv} from './scripts/import-card-table.mjs'; const rows=parseCsv('a,b,c\r\n\"x,y\",\"he said \"\"hi\"\"\",\"line1\nline2\"\r\n,,\r\n'); console.log(JSON.stringify(rows));"
file:///D:/Games/greyharbor/[eval1]:1
import {parseCsv} from './scripts/import-card-table.mjs'; const rows=parseCsv('a,b,c\r\n\
                                                                              ^^^^^^^^^^^

SyntaxError: Invalid or unexpected token
    at compileSourceTextModule (node:internal/modules/esm/utils:346:16)
    at ModuleLoader.createModuleWrap (node:internal/modules/esm/loader:266:12)
    at ModuleLoader.eval (node:internal/modules/esm/loader:306:23)
    at node:internal/process/execution:73:24
    at asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:11)
    at Object.runEntryPointWithESMLoader (node:internal/modules/run_main:139:19)
    at evalModuleEntryPoint (node:internal/process/execution:72:47)
    at node:internal/main/eval_string:38:3

Node.js v22.23.2
$ Select-String -Path docs\GREYHARBOR_RULES_V1.md -Pattern 'APPEND|TBD|TODO' -SimpleMatch; (Get-Content docs\GREYHARBOR_RULES_V1.md | Measure-Object -Line).Lines
743
> build · deepseek-v4.1-flash-free
✱ Grep "^## |^### 6\.|三夜两胜|理智归零|梦境准入|全局结算顺序|献祭回响|理性防线" in docs/GREYHARBOR_RULES_V1.md · 42 matches
$ Get-ChildItem scripts\import-card-table.mjs, docs\GREYHARBOR_RULES_V1.md, src\data\card-table.normalized.json | Select-Object FullName,Length,LastWriteTime | Format-Table -AutoSize
FullName                                                Length LastWriteTime
--------                                                ------ -------------
D:\Games\greyharbor\scripts\import-card-table.mjs        25004 2026/11/24 22:19:37
D:\Games\greyharbor\docs\GREYHARBOR_RULES_V1.md          51441 2026/11/24 22:24:52
D:\Games\greyharbor\src\data\card-table.normalized.json  12234 2026/11/24 22:19:44
$ node scripts/import-card-table.mjs | Select-String -Pattern '成功规范化|自动修复|ERROR|WARNING|结果:|预设牌组'
ERROR (0)
    �?0 error
  WARNING (17)
  结果: PASS�? error�?========================================================================
> build · deepseek-v4.1-flash-free
$ node -e "const fs=require('fs');const lines=fs.readFileSync('card-table-v1.csv','utf8').split(/\r?\n/); for (const i of [9,21,29]) { const c=lines[i].split(','); console.log(i+1, c.length, JSON.stringify(c)); }"
10 13 ["abjuration","驱魔咒","Abjuration","society","event","any","","","","0","1","移除一个腐化或环境效果","退回去这里不欢迎你"]
22 13 ["seance","降灵会","Séance","cult","ritual","any","","","","0","1","献祭一张己方卡从深渊拉回最多2张单位入手牌","桌子震了三下然后多了一个人的呼吸"]
30 13 ["stormy-night","暴雨夜","Stormy Night","neutral","environment","all","","","","0","1","本夜双方现场位置卡全体-2","雨冲掉了脚印也冲掉了理智"]
> build · deepseek-v4.1-flash-free
$ Get-ChildItem src\engine,src\ui -Recurse -File | Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-2) } | Select-Object FullName,LastWriteTime
(no output)
> build · deepseek-v4.1-flash-free
阶段一（数据层）已完成，未修改 `src/engine` 与 `src/ui` 下任何文件。

## 交付文件

| 文件 | 说明 |
|---|---|
| `scripts/import-card-table.mjs` | CSV 状态机解析、字段校验、预设牌组校验、规范化输出、审计报告 |
| `src/data/card-table.normalized.json` | 30 张卡规范化数据，字段严格为 `id/nameZh/nameEn/faction/type/location/reasonPower/madnessPower/keywords/sanityCost/copies/effect/flavor` |
| `docs/GREYHARBOR_RULES_V1.md` | v1 规则冻结文档，743 行 |

运行方式：

```bash
node scripts/import-card-table.mjs
```

## 导入审计结果

```text
原始数据行: 30
成功规范化: 30
自动修复行: 0
ERROR: 0
WARNING: 17
结果: PASS（0 error）
```

### 阵营与类型

| 阵营 | 数量 | 类型分布 |
|---|---:|---|
| society | 12 | leader 1 / unit 7 / event 2 / equipment 1 / location 1 |
| cult | 12 | leader 1 / unit 7 / ritual 2 / environment 1 / location 1 |
| neutral | 6 | unit 2 / oldgod 2 / environment 1 / event 1 |

全局类型：`unit 16 / leader 2 / event 3 / ritual 2 / environment 2 / location 2 / oldgod 2 / equipment 1`。

### 关键词、代价、份数

- 关键词：隐秘 5 / 腐化 1 / 封印 2 / 连锁 3 / 献祭 3 / 理智反噬 4。
- 理智代价：0 费 26 张、1 费 2 张、2 费 2 张。
- 份数：1 份 29 张、2 份 1 张（蒙面信徒）。
- 预设牌组：society 20/20、cult 20/20，均通过“1 领袖 + 19 非领袖、非领袖最多 2 份、仅本阵营 + 中立”的引用校验。

### 17 条 warning

- 15 条：效果文本提到关键词、但 `keywords` 列未标注（关键词是设计标签，不自动从文本推断）。
- 2 条：严格按 `copies` 收藏只能组成 society 18 / cult 19 张（含领袖），不足 20 张。v1 预设因此采用独立的“预设份数”规则：非领袖每卡最多 2 份，不直接套用收藏 `copies`。

> 当前 `card-table-v1.csv` 已是 13 列，因此本次自动修复为 0 行；导入器仍保留了针对历史“14 列多一个空字段”缺陷的检测与修复路径。

## 规则文档覆盖

`docs/GREYHARBOR_RULES_V1.md` 已写清：

- 三夜两胜、夜分与平夜/tiebreak、理智归零判负优先级；
- 预设牌组 20 张（含 1 领袖 + 19 非领袖）、起手 8 张、最多换 2 张、v1 不做组牌器；
- 理智初始 6、上限 6、≤3 时手牌翻面、面在离手时锁定；
- 现场/档案/梦境三地点、槽位/相邻、梦境准入限制；
- 六个关键词各自的触发/目标/效果/持续/叠加/清除/结算顺序；
- 学会“理性防线”、教团“献祭回响”两个阵营被动；
- Harold 与 Elias 两个领袖主动技；
- 完整全局结算顺序、战力计算顺序、同时触发批次、替代效果、隐藏信息；
- 两套 20 张预设牌组清单与 30 张卡的逐卡裁定表。
