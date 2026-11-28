#!/usr/bin/env node
/**
 * 《灰港夜谭》卡表导入器 / Greyharbor card-table importer
 *
 * 输入 : card-table-v1.csv（根目录，UTF-8）
 * 输出 : src/data/card-table.normalized.json
 *
 * 目标：
 *   1. 使用真正的 CSV 状态机解析（引号、字段内逗号、换行、空字段、"" 转义）。
 *   2. 按表头映射字段，不按列号硬读。
 *   3. 修复已知的“多一个空字段”结构性缺陷，并保留修复记录。
 *   4. 校验枚举、数值范围、类型/地点兼容性、引用完整性、份数。
 *   5. 输出 JSON 与控制台审计报告；存在 error 时以退出码 1 结束。
 *
 * 运行：node scripts/import-card-table.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "card-table-v1.csv");
const OUT_PATH = path.join(ROOT, "src", "data", "card-table.normalized.json");

const EXPECTED_HEADER = [
  "id",
  "nameZh",
  "nameEn",
  "faction",
  "type",
  "location",
  "reasonPower",
  "madnessPower",
  "keywords",
  "sanityCost",
  "copies",
  "effect",
  "flavor",
];

const FACTIONS = ["society", "cult", "neutral"];
const TYPES = ["leader", "unit", "oldgod", "event", "equipment", "location", "ritual", "environment"];
const LOCATIONS = ["scene", "archive", "dream", "any", "row", "attach", "all"];
const KEYWORDS = ["隐秘", "腐化", "封印", "连锁", "献祭", "理智反噬"];

const TYPE_LOCATIONS = {
  leader: new Set([""]),
  unit: new Set(["scene", "archive", "dream", "any"]),
  oldgod: new Set(["scene", "archive", "dream", "any"]),
  event: new Set(["any", "row", "all", "scene", "archive", "dream"]),
  ritual: new Set(["any", "row", "all", "scene", "archive", "dream"]),
  equipment: new Set(["attach"]),
  location: new Set(["scene", "archive", "dream", "all"]),
  environment: new Set(["all"]),
};

const NUMERIC_LIMITS = {
  reasonPower: { min: 0, max: 12 },
  madnessPower: { min: 0, max: 15 },
  sanityCost: { min: 0, max: 6 },
  copies: { min: 1, max: 3 },
};

/**
 * v1 锁定的预设牌组（20 张，含 1 领袖）。
 * v1 不做组牌器，因此预设牌组使用独立的“预设份数”上限：
 *   - 领袖恰好 1 张；
 *   - 非领袖卡每张最多 2 份；
 *   - 只能使用本阵营 + 中立卡。
 * 收藏字段 copies 仍按 CSV 审计，但不约束 v1 预设列表。
 */
const PRESET_DECKS = {
  society: [
    "harold-ashby",
    "nora-wells", "nora-wells",
    "samuel-pike", "samuel-pike",
    "edith-barrow",
    "walter-morse",
    "lucia-vaughn",
    "frank-holt",
    "arthur-pendleton",
    "abjuration",
    "warding-rite",
    "silver-lantern",
    "old-library",
    "finn-calloway",
    "silas-gold", "silas-gold",
    "thousand-eyes",
    "unexpected-aid",
    "stormy-night",
  ],
  cult: [
    "elias-thorne",
    "hooded-acolyte", "hooded-acolyte",
    "zealot", "zealot",
    "sea-priestess",
    "gravedigger",
    "whisperer",
    "deep-one",
    "bell-claw",
    "seance",
    "tide-ritual",
    "lunar-eclipse",
    "drowned-altar",
    "finn-calloway",
    "silas-gold",
    "the-sleeper",
    "thousand-eyes",
    "stormy-night",
    "unexpected-aid",
  ],
};

const errors = [];
const warnings = [];
const repairs = [];

function addError(code, message, context = {}) {
  errors.push({ code, message, ...context });
}

function addWarning(code, message, context = {}) {
  warnings.push({ code, message, ...context });
}

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

/**
 * RFC 4180 风格的状态机解析器。
 * - 支持 "..." 包裹的字段
 * - 支持字段内逗号 / 换行
 * - 支持 "" 转义双引号
 * - 支持 CRLF / LF
 * - 返回 { fields: string[], line: number }，line 为该记录起始行号
 */
export function parseCsv(text) {
  const src = String(text).replace(/^\uFEFF/, "");
  const records = [];
  let fields = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;
  let sawAnyChar = false;

  const endField = () => {
    fields.push(field);
    field = "";
  };

  const endRecord = () => {
    endField();
    records.push({ fields, line: recordLine });
    fields = [];
    recordLine = line + 1;
  };

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    sawAnyChar = true;

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else if (ch === "\n") {
        field += ch;
        line += 1;
      } else if (ch === "\r") {
        if (src[i + 1] === "\n") i += 1;
        field += "\n";
        line += 1;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      endField();
    } else if (ch === "\n") {
      endRecord();
      line += 1;
      recordLine = line;
    } else if (ch === "\r") {
      if (src[i + 1] === "\n") i += 1;
      endRecord();
      line += 1;
      recordLine = line;
    } else {
      field += ch;
    }
  }

  if (inQuotes) {
    throw new Error("CSV 解析失败：文件结束时仍处于引号字段内。");
  }

  // 最后一条记录（文件不以换行结尾时）
  if (sawAnyChar && (field.length > 0 || fields.length > 0)) {
    endRecord();
  }

  return records;
}

/** 启动时自检：确保解析器不是“按逗号 split”。 */
function assertCsvParser() {
  const sample = 'a,b,c\r\n"x,y","he said ""hi""","line1\nline2"\r\n,,\r\n';
  const rows = parseCsv(sample);
  const got = rows.map((r) => r.fields);
  const want = [
    ["a", "b", "c"],
    ["x,y", 'he said "hi"', "line1\nline2"],
    ["", "", ""],
  ];
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`CSV 解析器自检失败。\n期望: ${JSON.stringify(want)}\n实际: ${JSON.stringify(got)}`);
  }
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

const isBlank = (v) => v == null || String(v).trim() === "";
const clean = (v) => (v == null ? "" : String(v).trim());

function parseIntField(raw, field, rowContext, { allowBlank = false } = {}) {
  const s = clean(raw);
  if (s === "") {
    if (allowBlank) return null;
    addError("EMPTY_NUMBER", `${field} 为空，但该字段要求整数。`, rowContext);
    return null;
  }
  if (!/^-?\d+$/.test(s)) {
    addError("BAD_NUMBER", `${field} 不是整数：${JSON.stringify(s)}`, rowContext);
    return null;
  }
  const n = Number(s);
  const limit = NUMERIC_LIMITS[field];
  if (limit && (n < limit.min || n > limit.max)) {
    addError(
      "OUT_OF_RANGE",
      `${field}=${n} 超出允许范围 ${limit.min}..${limit.max}。`,
      rowContext,
    );
  }
  return n;
}

function splitKeywords(raw, rowContext) {
  const s = clean(raw);
  if (s === "") return [];
  const parts = s
    .split(/[,，、/／|;；]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const kw of parts) {
    if (!KEYWORDS.includes(kw)) {
      addError("BAD_KEYWORD", `未知关键词：${JSON.stringify(kw)}。合法值：${KEYWORDS.join("/")}`, rowContext);
      continue;
    }
    if (!seen.has(kw)) {
      seen.add(kw);
      out.push(kw);
    }
  }
  return out;
}

/**
 * 已知缺陷修复：10 张非单位牌在 sanityCost 前多了一个空字段。
 * 仅当“删掉某个空字段后，sanityCost/copies 为整数且 effect/flavor 非空”才修复，
 * 避免把未来真正含空字段的合法行误删。
 */
function repairExtraField(fields) {
  if (fields.length === EXPECTED_HEADER.length) {
    return { fields, repair: null };
  }

  if (fields.length !== EXPECTED_HEADER.length + 1) {
    return { fields, repair: null };
  }

  const candidates = [];
  for (let i = 0; i < fields.length; i += 1) {
    if (clean(fields[i]) !== "") continue;
    const candidate = fields.slice(0, i).concat(fields.slice(i + 1));
    const looksValid =
      /^\d+$/.test(clean(candidate[9])) &&
      /^\d+$/.test(clean(candidate[10])) &&
      clean(candidate[11]) !== "" &&
      clean(candidate[12]) !== "";
    if (looksValid) candidates.push({ index: i, candidate });
  }

  // 已知缺陷固定发生在 9（sanityCost 前的空字段）；优先选择它。
  candidates.sort((a, b) => Math.abs(a.index - 9) - Math.abs(b.index - 9));
  if (candidates.length === 0) {
    return { fields, repair: null };
  }

  const chosen = candidates[0];
  return {
    fields: chosen.candidate,
    repair: {
      type: "remove-extra-empty-field",
      removedIndex: chosen.index,
      removedValue: fields[chosen.index],
      originalFieldCount: fields.length,
      repairedFieldCount: chosen.candidate.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  assertCsvParser();

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`找不到输入文件：${CSV_PATH}`);
  }

  const text = fs.readFileSync(CSV_PATH, "utf8");
  const records = parseCsv(text);

  if (records.length === 0) {
    throw new Error("CSV 为空。");
  }

  const header = records[0].fields.map(clean);
  const headerOk =
    header.length === EXPECTED_HEADER.length &&
    EXPECTED_HEADER.every((name, i) => header[i] === name);
  if (!headerOk) {
    addError("BAD_HEADER", "表头与预期不一致。", {
      expected: EXPECTED_HEADER,
      actual: header,
    });
    printReport([]);
    process.exitCode = 1;
    return;
  }

  const cards = [];
  const sourceRowById = new Map();
  const rawRowCount = records.length - 1;

  for (const record of records.slice(1)) {
    const rowNo = record.line;
    const rawFields = record.fields;

    // 跳过完全空白行（允许文件末尾空行）
    if (rawFields.length === 1 && clean(rawFields[0]) === "") continue;

    const rowContext = { row: rowNo };

    const { fields, repair } = repairExtraField(rawFields);
    if (repair) {
      repairs.push({ row: rowNo, ...repair });
    }

    if (fields.length !== EXPECTED_HEADER.length) {
      addError(
        "BAD_FIELD_COUNT",
        `字段数 ${fields.length}，期望 ${EXPECTED_HEADER.length}；无法自动修复。`,
        { ...rowContext, fields },
      );
      continue;
    }

    const raw = Object.fromEntries(EXPECTED_HEADER.map((key, i) => [key, fields[i]]));
    const id = clean(raw.id);
    if (id === "") {
      addError("EMPTY_ID", "id 为空。", rowContext);
      continue;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      addError("BAD_ID", `id 格式非法：${JSON.stringify(id)}（要求小写 kebab-case）。`, { ...rowContext, id });
    }
    if (sourceRowById.has(id)) {
      addError("DUPLICATE_ID", `id 重复：${id}（首次出现于第 ${sourceRowById.get(id)} 行）。`, {
        ...rowContext,
        id,
      });
    } else {
      sourceRowById.set(id, rowNo);
    }

    const faction = clean(raw.faction);
    if (!FACTIONS.includes(faction)) {
      addError("BAD_FACTION", `faction 非法：${JSON.stringify(faction)}。合法值：${FACTIONS.join("/")}`, {
        ...rowContext,
        id,
      });
    }

    const type = clean(raw.type);
    if (!TYPES.includes(type)) {
      addError("BAD_TYPE", `type 非法：${JSON.stringify(type)}。合法值：${TYPES.join("/")}`, {
        ...rowContext,
        id,
      });
    }

    const location = clean(raw.location);
    if (!LOCATIONS.includes(location) && location !== "") {
      addError("BAD_LOCATION", `location 非法：${JSON.stringify(location)}。合法值：${LOCATIONS.join("/")} 或空（领袖）。`, {
        ...rowContext,
        id,
      });
    }
    if (TYPE_LOCATIONS[type] && !TYPE_LOCATIONS[type].has(location)) {
      addError(
        "LOCATION_TYPE_MISMATCH",
        `type=${type} 不允许 location=${JSON.stringify(location)}；允许：${[...TYPE_LOCATIONS[type]].map((x) => x || "(空)").join("/")}`,
        { ...rowContext, id },
      );
    }

    const isFighter = type === "unit" || type === "oldgod";
    const reasonPower = parseIntField(raw.reasonPower, "reasonPower", { ...rowContext, id }, {
      allowBlank: !isFighter,
    });
    const madnessPower = parseIntField(raw.madnessPower, "madnessPower", { ...rowContext, id }, {
      allowBlank: !isFighter,
    });

    if (isFighter) {
      if (reasonPower == null) addError("MISSING_POWER", "单位/旧神缺少 reasonPower。", { ...rowContext, id });
      if (madnessPower == null) addError("MISSING_POWER", "单位/旧神缺少 madnessPower。", { ...rowContext, id });
      if (reasonPower != null && madnessPower != null && madnessPower < reasonPower) {
        addWarning(
          "MADNESS_LOWER_THAN_REASON",
          `madnessPower(${madnessPower}) < reasonPower(${reasonPower})，与“疯狂面更高战力”的设计方向不一致。`,
          { ...rowContext, id },
        );
      }
    } else if (reasonPower != null || madnessPower != null) {
      addWarning("POWER_ON_NON_FIGHTER", "非单位/旧神卡带有战力字段，已保留但不应参与计分。", {
        ...rowContext,
        id,
      });
    }

    const keywords = splitKeywords(raw.keywords, { ...rowContext, id });

    const sanityCost = parseIntField(raw.sanityCost, "sanityCost", { ...rowContext, id });
    const copies = parseIntField(raw.copies, "copies", { ...rowContext, id });

    if (type === "leader" && copies != null && copies !== 1) {
      addError("LEADER_COPIES", `领袖 copies 必须为 1，当前为 ${copies}。`, { ...rowContext, id });
    }
    if (type === "leader" && keywords.length > 0) {
      addError("LEADER_KEYWORDS", "领袖不应带有关键词。", { ...rowContext, id, keywords });
    }
    if (type === "leader" && location !== "") {
      addError("LEADER_LOCATION", "领袖 location 必须为空。", { ...rowContext, id, location });
    }

    const effect = clean(raw.effect);
    const flavor = clean(raw.flavor);
    if (effect === "") addError("EMPTY_EFFECT", "effect 为空。", { ...rowContext, id });
    if (flavor === "") addError("EMPTY_FLAVOR", "flavor 为空。", { ...rowContext, id });

    // 关键词引用完整性：效果文本提到关键词、但 keywords 未标注 → warning
    for (const kw of KEYWORDS) {
      if (effect.includes(kw) && !keywords.includes(kw)) {
        addWarning("KEYWORD_MENTIONED_NOT_TAGGED", `效果文本提到“${kw}”，但 keywords 未标注。`, {
          ...rowContext,
          id,
        });
      }
    }

    cards.push({
      id,
      nameZh: clean(raw.nameZh),
      nameEn: clean(raw.nameEn),
      faction,
      type,
      location: location === "" ? null : location,
      reasonPower,
      madnessPower,
      keywords,
      sanityCost: sanityCost == null ? 0 : sanityCost,
      copies: copies == null ? 0 : copies,
      effect,
      flavor,
    });

    if (clean(raw.nameZh) === "") addError("EMPTY_NAME_ZH", "nameZh 为空。", { ...rowContext, id });
    if (clean(raw.nameEn) === "") addError("EMPTY_NAME_EN", "nameEn 为空。", { ...rowContext, id });
  }

  // 引用完整性：每个阵营的领袖齐全
  for (const faction of ["society", "cult"]) {
    const leaders = cards.filter((c) => c.faction === faction && c.type === "leader");
    if (leaders.length === 0) {
      addError("MISSING_LEADER", `阵营 ${faction} 缺少领袖卡。`);
    } else if (leaders.length > 1) {
      addError("MULTIPLE_LEADERS", `阵营 ${faction} 有 ${leaders.length} 位领袖，期望恰好 1 位。`, {
        leaders: leaders.map((c) => c.id),
      });
    }
  }
  if (cards.some((c) => c.faction === "neutral" && c.type === "leader")) {
    addError("NEUTRAL_LEADER", "中立阵营不应有领袖。");
  }

  // 预设牌组引用完整性 / 份数 / 阵营合法性
  const byId = new Map(cards.map((c) => [c.id, c]));
  const presetReport = {};
  for (const [faction, ids] of Object.entries(PRESET_DECKS)) {
    const report = { faction, total: ids.length, leader: 0, nonLeader: 0, duplicates: {}, unknown: [], illegalFaction: [] };
    const counts = new Map();
    for (const id of ids) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    for (const [id, n] of counts) {
      const card = byId.get(id);
      if (!card) {
        report.unknown.push(id);
        addError("PRESET_UNKNOWN_CARD", `预设牌组 ${faction} 引用了不存在的卡：${id}。`, { faction, id });
        continue;
      }
      if (card.type === "leader") {
        report.leader += n;
        if (card.faction !== faction) {
          addError("PRESET_WRONG_LEADER", `预设牌组 ${faction} 的领袖是 ${card.faction} 阵营的 ${id}。`, {
            faction,
            id,
          });
        }
      } else {
        report.nonLeader += n;
        if (n > 2) {
          addError("PRESET_COPIES", `预设牌组 ${faction} 中 ${id} 有 ${n} 份，超过预设上限 2。`, {
            faction,
            id,
            count: n,
          });
        }
        if (!(card.faction === faction || card.faction === "neutral")) {
          report.illegalFaction.push(id);
          addError("PRESET_ILLEGAL_FACTION", `预设牌组 ${faction} 不能使用 ${card.faction} 阵营的卡 ${id}。`, {
            faction,
            id,
          });
        }
        if (n > 1) report.duplicates[id] = n;
      }
    }
    if (ids.length !== 20) {
      addError("PRESET_SIZE", `预设牌组 ${faction} 共 ${ids.length} 张，期望 20 张。`, { faction });
    }
    if (report.leader !== 1) {
      addError("PRESET_LEADER_COUNT", `预设牌组 ${faction} 有 ${report.leader} 张领袖，期望恰好 1 张。`, { faction });
    }
    presetReport[faction] = report;
  }

  // 关键词覆盖（引用完整性的一部分）：六个关键词都应在卡池中出现
  for (const kw of KEYWORDS) {
    if (!cards.some((c) => c.keywords.includes(kw))) {
      addWarning("UNUSED_KEYWORD", `关键词“${kw}”在卡池中没有被任何卡标注。`);
    }
  }

  // 预设有 20 张牌组，但 v1 无组牌器；这里只审计“严格收藏份数”能否凑满 20。
  const deckPool = {};
  for (const faction of ["society", "cult"]) {
    const own = cards.filter((c) => c.faction === faction && c.type !== "leader");
    const neutral = cards.filter((c) => c.faction === "neutral" && c.type !== "leader");
    const ownCopies = own.reduce((s, c) => s + (Number.isFinite(c.copies) ? c.copies : 0), 0);
    const neutralCopies = neutral.reduce((s, c) => s + (Number.isFinite(c.copies) ? c.copies : 0), 0);
    deckPool[faction] = {
      ownUnique: own.length,
      ownCopies,
      neutralUnique: neutral.length,
      neutralCopies,
      strictTotalNonLeaderCopies: ownCopies + neutralCopies,
      strictTotalWithLeader: ownCopies + neutralCopies + 1,
    };
    if (ownCopies + neutralCopies + 1 < 20) {
      addWarning(
        "PRESET_POOL_SHORT",
        `${faction} 严格按 copies 收藏只能组成 ${ownCopies + neutralCopies + 1} 张（含领袖），不足 20 张。v1 预设牌组使用独立的“预设份数”上限（非领袖每卡最多 2 份），不直接套用收藏 copies。`,
        { faction, ...deckPool[faction] },
      );
    }
  }

  if (errors.length === 0) {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, `${JSON.stringify(cards, null, 2)}\n`, "utf8");
  }

  printReport(cards, { rawRowCount, deckPool, presetReport });
  process.exitCode = errors.length === 0 ? 0 : 1;
}

// ---------------------------------------------------------------------------
// Audit report
// ---------------------------------------------------------------------------

function countBy(items, fn) {
  const map = new Map();
  for (const item of items) {
    const key = fn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), "zh-CN"));
}

function table(title, entries, label = "项") {
  const lines = [`  ${title}`];
  for (const [key, n] of entries) {
    lines.push(`    ${String(key).padEnd(14, " ")} ${String(n).padStart(4, " ")}`);
  }
  if (entries.length === 0) lines.push(`    (无${label})`);
  return lines.join("\n");
}

function printReport(cards, extra = {}) {
  const out = [];
  out.push("");
  out.push("========================================================================");
  out.push("  《灰港夜谭》卡表导入审计 / Greyharbor Card Table Import Audit");
  out.push("========================================================================");
  out.push(`  输入: ${CSV_PATH}`);
  out.push(`  输出: ${OUT_PATH}`);
  out.push(`  原始数据行: ${extra.rawRowCount ?? "-"}`);
  out.push(`  成功规范化: ${cards.length}`);
  out.push(`  自动修复行: ${repairs.length}`);
  out.push("");

  if (cards.length > 0) {
    out.push(table("按阵营", countBy(cards, (c) => c.faction), "阵营"));
    out.push("");
    out.push(table("按类型", countBy(cards, (c) => c.type), "类型"));
    out.push("");
    out.push("  按阵营 × 类型");
    for (const faction of FACTIONS) {
      const subset = cards.filter((c) => c.faction === faction);
      const byType = countBy(subset, (c) => c.type)
        .map(([t, n]) => `${t} ${n}`)
        .join(" / ");
      out.push(`    ${faction.padEnd(8)} 总 ${String(subset.length).padStart(2)}  ${byType || "(无)"}`);
    }
    out.push("");
    out.push(table("按地点", countBy(cards, (c) => c.location ?? "(空)"), "地点"));
    out.push("");
    out.push("  关键词分布");
    for (const kw of KEYWORDS) {
      const n = cards.filter((c) => c.keywords.includes(kw)).length;
      out.push(`    ${kw.padEnd(8)} ${String(n).padStart(3)}`);
    }
    out.push("");
    out.push("  理智代价分布");
    for (const [key, n] of countBy(cards, (c) => c.sanityCost)) {
      out.push(`    cost=${String(key).padEnd(2)} ${String(n).padStart(3)}`);
    }
    out.push("");
    out.push("  份数分布");
    for (const [key, n] of countBy(cards, (c) => c.copies)) {
      out.push(`    copies=${String(key).padEnd(2)} ${String(n).padStart(3)}`);
    }
    out.push("");
    out.push("  牌池可收集量（不含领袖；society/cult 可加中立）");
    for (const faction of ["society", "cult"]) {
      const p = extra.deckPool?.[faction];
      if (!p) continue;
      out.push(
        `    ${faction.padEnd(8)} 本阵营 ${p.ownUnique} 张/${p.ownCopies} 份 + 中立 ${p.neutralUnique} 张/${p.neutralCopies} 份 = ${p.strictTotalWithLeader} 张（含领袖）`,
      );
    }
    out.push("");
    out.push("  预设牌组（v1 锁定：20 张，含 1 领袖；非领袖每卡最多 2 份）");
    for (const faction of ["society", "cult"]) {
      const p = extra.presetReport?.[faction];
      if (!p) continue;
      const dup = Object.entries(p.duplicates).map(([id, n]) => `${id}×${n}`).join(", ") || "无";
      out.push(
        `    ${faction.padEnd(8)} ${p.total} 张（领袖 ${p.leader} / 非领袖 ${p.nonLeader}）；重复：${dup}`,
      );
    }
    out.push("");
  }

  if (repairs.length > 0) {
    out.push(`  自动修复记录（${repairs.length}）`);
    for (const r of repairs) {
      out.push(
        `    第 ${r.row} 行: 删除第 ${r.removedIndex} 个空字段；${r.originalFieldCount} → ${r.repairedFieldCount} 列`,
      );
    }
    out.push("");
  }

  out.push(`  ERROR (${errors.length})`);
  if (errors.length === 0) {
    out.push("    ✓ 0 error");
  } else {
    for (const e of errors) {
      const ctx = e.id ? ` [${e.id}]` : e.row ? ` [第 ${e.row} 行]` : "";
      out.push(`    ✗ ${e.code}${ctx}: ${e.message}`);
    }
  }
  out.push("");

  out.push(`  WARNING (${warnings.length})`);
  if (warnings.length === 0) {
    out.push("    ✓ 0 warning");
  } else {
    for (const w of warnings) {
      const ctx = w.id ? ` [${w.id}]` : w.row ? ` [第 ${w.row} 行]` : w.faction ? ` [${w.faction}]` : "";
      out.push(`    ! ${w.code}${ctx}: ${w.message}`);
    }
  }
  out.push("");
  out.push("========================================================================");
  out.push(errors.length === 0 ? "  结果: PASS（0 error）" : `  结果: FAIL（${errors.length} error）`);
  out.push("========================================================================");
  out.push("");

  console.log(out.join("\n"));
}

const runDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (runDirectly) main();
