/**
 * src/campaign/data/relics.mjs — pure relic definitions for the Roguelike run.
 *
 * scope 'battle': `battle` is translated into createGame() options by the run
 *   controller (existing config only — compensation / startingSanity / mechanics).
 * scope 'run': `run` flags are read directly by the campaign controller.
 * No DOM, no engine imports; frozen data.
 */

export const RELICS = Object.freeze([
  {
    id: 'silver-pocket-watch',
    nameZh: '银怀表',
    nameEn: 'Silver Pocket Watch',
    scope: 'battle',
    description: '每场战斗第一夜额外换牌上限 +1（2 → 3）。',
    flavor: '表针倒走，仿佛总在提醒你还来得及。',
    battle: { compensation: { extraMulligan: 3 } },
  },
  {
    id: 'warded-lantern',
    nameZh: '守护提灯',
    nameEn: 'Warded Lantern',
    scope: 'battle',
    description: '战斗起始理智不低于 6，抵消精英/Boss 的理智削减。',
    flavor: '灯焰在最浓的雾里也不熄灭。',
    battle: { startingSanityFloor: 6 },
  },
  {
    id: 'salt-ward',
    nameZh: '盐之结界',
    nameEn: 'Salt Ward',
    scope: 'battle',
    description: '关闭该场战斗的混沌袋检定，消除代币波动。',
    flavor: '一圈粗盐，挡住了夜里所有的低语。',
    battle: { mechanics: { chaosBag: false } },
  },
  {
    id: 'harbor-seal',
    nameZh: '港湾封印',
    nameEn: 'Harbor Seal',
    scope: 'battle',
    description: '关闭该场战斗的地点异变，使地点保持中性。',
    flavor: '蜡封上的锚形印记已经磨损。',
    battle: { mechanics: { anomaly: false } },
  },
  {
    id: 'brass-key',
    nameZh: '黄铜钥匙',
    nameEn: 'Brass Key',
    scope: 'run',
    description: '每次战斗结算的物资 +1。',
    flavor: '它能打开的，也许不只是门。',
    run: { battleSuppliesBonus: 1 },
  },
  {
    id: 'moth-eaten-journal',
    nameZh: '虫蛀日记',
    nameEn: 'Moth-eaten Journal',
    scope: 'run',
    description: '卡牌奖励选项 +1（3 → 4）。',
    flavor: '缺页之间，夹着几行陌生的坐标。',
    run: { cardChoicesBonus: 1 },
  },
  {
    id: 'abyssal-compass',
    nameZh: '深渊罗盘',
    nameEn: 'Abyssal Compass',
    scope: 'run',
    description: '遗物奖励选项 +1（2 → 3），并可预览地图连通。',
    flavor: '指针永远指向海的方向。',
    run: { relicChoicesBonus: 1 },
  },
  {
    id: 'grave-candle',
    nameZh: '墓畔蜡烛',
    nameEn: 'Grave Candle',
    scope: 'run',
    description: '休整点额外获得 2 物资。',
    flavor: '烛火发青，却让人安心。',
    run: { restSuppliesBonus: 2 },
  },
]);

const RELIC_INDEX = Object.freeze(Object.fromEntries(RELICS.map((relic) => [relic.id, relic])));

export function getRelic(id) {
  return RELIC_INDEX[id] ?? null;
}

export default RELICS;
