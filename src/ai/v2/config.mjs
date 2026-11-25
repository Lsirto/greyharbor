/**
 * src/ai/v2/config.mjs — 评估型 AI 的全部可调参数与静态牌张知识。
 *
 * 设计契约：
 *  - 这里集中所有启发式权重/阈值/牌张数值；evaluate.mjs 与 ai.mjs 不得散落
 *    用于决策的魔法数字（结构性下标 0/1、循环上下界除外）。
 *  - 牌张知识只允许来自 buildView 已公开的字段（cardId / type / keywords /
 *    power / sanityCost / face 等）或规则书里的公开数值；不得读取引擎状态。
 *  - 分组与任务书要求的覆盖项一一对应：夜分/夜胜、理智、夜胜局数与 Pass、
 *    手牌资源、三地点/关键词协同、盖牌与隐秘的信息价值。
 */

const deepFreeze = (obj) => {
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') deepFreeze(value);
  }
  return Object.freeze(obj);
};

export const CONFIG = deepFreeze({
  /** 注入式 RNG：只用于完全同分时的并列裁决。 */
  rng: {
    defaultSeed: 'greyharbor-ai-v2',
    tieEpsilon: 1e-9,
  },

  /** 当前夜分差 + 夜胜价值（规则 §1.2 / §1.3）。 */
  night: {
    leadWeight: 1.15,         // 每 1 点投影夜分的价值
    winBonus: 15,             // 领先即赢下本夜（含理智 tiebreak 的期望价值）
    finalNightWinBonus: 20,   // 第三夜夜胜同时决定最终排名，权重更高
    nightWinsDiffWeight: 40,  // 已获夜胜数差（先到 2 夜胜直接赢比赛）
    matchWinBonus: 1500,
    matchLossPenalty: -1500,
  },

  /** 双方理智压力（规则 §3 / §1.1）：归零立即判负，输夜也 -1 理智。 */
  sanity: {
    selfWeight: 3.0,            // 己方每点理智
    oppWeight: 2.0,             // 对方每点理智（略低，避免无脑拖平）
    lowSanityThreshold: 3,      // §3.3：理智 ≤3 手牌翻疯狂面，也是危险区
    lowSanityExtraWeight: 4.0,  // 理智低于阈值时每点的追加压力（再乘阵营系数）
    oppLowSanityExtraWeight: 3.0, // 对方逼近归零时的追加收益
    /** 学会每夜回 1 理智（§7.1），教团没有；据此调整理智的主观价值。 */
    factionWeight: {
      societySelf: 2.5,
      cultSelf: 6.0,
      societyOpp: 2.0,
      cultOpp: 3.0,
    },
    zeroMatchLossPenalty: -3000,
    zeroMatchWinBonus: 3000,
    losingNightToZeroPenalty: -2200, // 若本夜输掉导致归零
    winningNightToZeroBonus: 2200,   // 若本夜赢下导致对方归零
    costWeight: 1.8,            // 打出卡牌支付的理智代价
    backlashLoss: 1,            // 规则 §6.6：反噬实际失去 1 理智
    backlashPenalty: 12,        // 疯狂面反噬的基础风险
    lowSanityBacklashExtra: 4,  // 理智 ≤3 时反噬风险追加（已翻疯狂面）
    madnessThreshold: 3,        // 规则 §3.3
    madnessHandUnlockBonus: 1.2,// 理智 ≤3 时手牌疯狂面高战力的期权价值
  },

  /** 夜胜局数与 Pass 时机（规则 §9.3 / §9.6）。 */
  pass: {
    futureCardThreat: 4.2,      // 我方 Pass 后对方每剩余手牌可追加的夜分
    leaderThreat: 3.5,          // 我方 Pass 后对方领袖技的追加威胁
    opponentPassedAheadBonus: 12, // 对方已 Pass 且我方领先时立刻 Pass 的锁定价值
    concedeThreshold: -18,      // 分差低于此值时不再浪费高质量手牌追分
  },

  /** 手牌资源折算与换牌（旧 AI 的“手牌价值”思路，按 v2 规则重做）。 */
  hand: {
    valueWeight: 0.3,           // 手牌资源在局面评估中的权重
    opponentThreatWeight: 0.85, // 对方手牌数的威胁权重
    tempoGapWeight: 2.5,        // 手数落后时的节奏惩罚：先耗完手牌会让对手免费出牌
    powerWeight: 0.72,          // 手牌战力折算为未来夜分的比例
    unitBase: 1.2,              // 单位牌的固有期权价值
    specialBase: 1.6,           // 非单位牌的固有期权价值
    costWeight: 2.4,            // 手牌理智代价的负价值
    backlashPenalty: 3.5,       // 疯狂面反噬牌在手牌中的折价
    mulliganExpectedRatio: 0.92,// 换到未知牌的期望折扣（避免无脑全换）
    effectBonus: {
      'old-library': 3.0,
      'drowned-altar': 2.6,
      'silver-lantern': 2.4,
      'warding-rite': 2.2,
      'unexpected-aid': 2.6,
      'abjuration': 1.8,
      'tide-ritual': 2.0,
      'lunar-eclipse': 2.0,
      'stormy-night': 2.0,
      seance: 2.2,
      'elias-thorne': 3.0,
      'harold-ashby': 2.5,
      'thousand-eyes': 3.5,
      'the-sleeper': 3.0,
      'deep-one': 1.5,
      zealot: 1.0,
      'bell-claw': 1.0,
      'frank-holt': 1.5,
      'edith-barrow': 1.0,
      'lucia-vaughn': 1.2,
      'nora-wells': 0.8,
      'arthur-pendleton': 0.6,
      'silas-gold': 0.8,
    },
  },

  /** 三地点（scene/archive/dream）协同与关键词联动（规则 §4 / §6）。 */
  locations: {
    chainWeight: 1.0,           // 连锁关键词折算
    adjacencyBonus: 0.6,        // 相邻槽位价值（连锁计数/献祭目标）
    equipmentBonus: 2,          // 银灯 +2（规则 §5.6）
    conditionalStealthBonus: 1, // 千瞳每正面隐秘 +1（规则 §11.3）
    dreamHiddenBonus: 0.8,      // 梦境隐秘盖牌的翻面爆发价值
    scenePressureBonus: 0.5,    // 现场单位面临献祭/环境压力的补偿
    archiveSynergyBonus: 0.5,   // 档案卡密度（伊迪丝/旧图书馆）
    centerSlotBonus: 0.35,      // 槽位靠中间，给后续连锁单位留出相邻位置
    capacity: { scene: 5, archive: 5, dream: 3 }, // 规则 §4.1
  },

  /** 盖牌与隐秘的信息价值（规则 §6.1 / §9.10）。 */
  hidden: {
    opponentFaceDownEstimate: 4.5, // 对手盖牌数量的公开期望战力（不读身份）
    ownFaceDownInfoBonus: 0.5,     // 己方盖牌不可被对手选中的保护价值
    stealthFaceDownValue: 0.6,     // 隐秘选盖牌时的额外信息价值
  },

  /** 卡牌效果的一次性近似估值；只使用 view 中公开的目标信息。 */
  effects: {
    sealUnit: 2.5,
    removeCorruption: 1.4,
    removeEnvironment: 2.0,
    warding: 1.0,
    tide: 3,
    lunar: 1,
    stormy: -2,
    unexpectedAid: 3,
    corruptionImmediate: 0.4,
    harold: 1.5,
    sealLeader: 6,              // 千瞳封印敌方领袖（阻止 Elias/Harold 的主动技）
    cultEcho: 2,
    cultEchoWithAltar: 3,
    whispererDrain: 1,
    silasDraw: 2.5,
    infoPeek: 0.3,
    oldLibrary: 1.5,
    drownedAltar: 1.2,
  },

  /** v1.3 新机制：地点异变与混沌袋的期望参数（只使用 view 公开字段）。 */
  mechanics: {
    anomaly: {
      entrySanityWeight: 3.0,   // 入场理智变化的折算（乘 delta）
      entryCorruptionPenalty: 1.0, // 入场即腐化的未来惩罚
    },
    chaos: {
      // 抽后放回：旧神之印仅 −3 战力（v1.3 平衡后不再扣理智，否则该伤害
      // 对无法回理智的教团不对称）；战力期望修正 ≈ 0。
      elderSignProbability: 1 / 19,
      elderSignSanity: 0,
      expectedPower: 0,
    },
  },

  /** v1.4 双目标：学会线索 / 教团末日（只使用 view 公开字段）。 */
  objectives: {
    progressWeight: 6,            // 每个已积累目标点相对对手的基础价值
    nearThresholdExtraWeight: 4, // 临近阈值时每个目标点的追加价值
    nearThresholdWindow: 2,     // 距阈值在此范围内视为"临近"
    /** Cult 仪式卡（type==='ritual' 的卡，公开信息）。 */
    ritualCardIds: ['seance', 'tide-ritual'],
  },

  /** 规则书/卡面公开的数值表（非启发式权重）。 */
  power: {
    madnessBonus: {
      zealot: 3,
      'deep-one': 3,
    },
    chainCap: {
      'frank-holt': 3,
      'finn-calloway': 2,
    },
    equipment: {
      'silver-lantern': 2,
    },
    /** 带理智反噬关键词的卡（规则/卡面公开信息）。 */
    backlash: ['walter-morse', 'zealot', 'deep-one', 'the-sleeper'],
    /** Elias 从牌堆直接打出的异怪（规则 §8.2），[理性面, 疯狂面]。 */
    eliasSummon: {
      'hooded-acolyte': [2, 3],
      zealot: [3, 9],
      'sea-priestess': [4, 5],
      gravedigger: [3, 4],
      whisperer: [2, 7],
      'deep-one': [5, 11],
      'bell-claw': [6, 6],
      'the-sleeper': [8, 12],
      'thousand-eyes': [7, 10],
    },
  },
});
