/**
 * src/ui-v2/tutorial/tutorial-steps.mjs — pure, deterministic tutorial script.
 *
 * Each step is plain data: an instruction (title/body), the board role the
 * player is allowed to touch (`target`), and how the step advances — either a
 * bubble button (`advance: 'continue'`) or automatically once a wait condition
 * is met (`advance: 'auto'` + `wait`). No DOM, no functions, fully serialisable.
 */

/** Allowed board roles; mapped to CSS selectors by TARGET_SELECTORS. */
export const TARGETS = Object.freeze({
  NONE: 'none',
  HAND: 'hand',
  MULLIGAN_CONFIRM: 'mulligan-confirm',
  UNIT_PLAY: 'unit-play',
  ENV_PLAY: 'env-play',
  EQUIP_PLAY: 'equip-play',
  PASS: 'pass',
});

/** Wait conditions evaluated by the pure conditionMet() in this module. */
export const WAITS = Object.freeze({
  PHASE_PLAY: 'phase-play',
  HUMAN_PLAY: 'human-play',
  HUMAN_PASS: 'human-pass',
});

/**
 * CSS selectors that count as "the prompted target" for the input gate.
 * Each play step permits the matching hand card, the highlighted legal drop and
 * the confirm button, plus modal options so a facedown / choice prompt works.
 */
export const TARGET_SELECTORS = Object.freeze({
  [TARGETS.NONE]: [],
  [TARGETS.HAND]: ['.gh2-hand--viewer .gh2-card'],
  [TARGETS.MULLIGAN_CONFIRM]: ['[data-gh2="mulligan-confirm"]'],
  [TARGETS.UNIT_PLAY]: [
    '.gh2-hand--viewer [data-type="unit"]',
    '.gh2-hand--viewer [data-type="oldgod"]',
    '.gh2-legal',
    '[data-gh2="play-confirm"]',
    '[data-gh2-choice]',
    '.gh2-modal__option',
  ],
  [TARGETS.ENV_PLAY]: [
    '.gh2-hand--viewer [data-type="environment"]',
    '[data-gh2="play-confirm"]',
    '[data-gh2-choice]',
    '.gh2-modal__option',
  ],
  [TARGETS.EQUIP_PLAY]: [
    '.gh2-hand--viewer [data-type="equipment"]',
    '.gh2-legal',
    '[data-gh2="play-confirm"]',
    '[data-gh2-choice]',
    '.gh2-modal__option',
  ],
  [TARGETS.PASS]: ['[data-gh2="pass"]'],
});

export const TUTORIAL_SEED = 'tutorial-fixed';

/**
 * Teaching-specific fixed decks. The human deck is arranged so the seeded
 * shuffle deals every key card type (environment, equipment, location, units)
 * into the opening hand, letting the steps drive real hands-on play.
 */
export const TUTORIAL_DECK = Object.freeze({
  human: {
    faction: 'society',
    leader: 'harold-ashby',
    cards: Object.freeze([
      'old-library', 'frank-holt', 'samuel-pike', 'nora-wells',
      'walter-morse', 'finn-calloway', 'silas-gold', 'stormy-night',
      'silver-lantern', 'abjuration', 'thousand-eyes', 'unexpected-aid',
    ]),
  },
  ai: {
    faction: 'cult',
    leader: 'elias-thorne',
    cards: Object.freeze(['zealot', 'deep-one', 'bell-claw', 'whisperer', 'gravedigger']),
  },
});

export const TUTORIAL_STEPS = Object.freeze([
  {
    id: 'intro',
    title: '欢迎来到灰港',
    body: '你将在三夜牌局中与对手较量，赢下两夜即可获胜。本教程会带你亲手操作换牌、出牌、环境、装备与过牌，再讲清理智与胜负目标。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'mulligan-mark',
    title: '第一步：换牌',
    body: '现在是换牌阶段。点击任意一张手牌可标记或取消它，再点「确认换牌」就能换掉；不想换也可以直接继续。',
    target: TARGETS.HAND,
    advance: 'continue',
  },
  {
    id: 'mulligan-confirm',
    title: '确认换牌',
    body: '点击「确认换牌」进入第一夜，标记的牌会被洗回并重新抽补。',
    target: TARGETS.MULLIGAN_CONFIRM,
    advance: 'auto',
    wait: WAITS.PHASE_PLAY,
  },
  {
    id: 'dual-face',
    title: '认识双面卡',
    body: '每张单位卡都有理性面与疯狂面两个战力，卡面上分别标出。当前用哪一面，由你的理智决定：理智高时显示理性面，理智降到 3 以下会强制翻到疯狂面。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'battleline',
    title: '认识对峙线与据点',
    body: '你和对手在同一条对峙线各占 6 个槽位，单位都打在这里。每夜结束时单位会清空、下一夜重新铺场；据点则会留在场上持续生效。带「隐秘」的单位还能盖牌打出，对手暂时看不到它的身份。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'play-unit',
    title: '第二步：打出一个单位',
    body: '点一张单位手牌选中它，场上会亮起合法落点，再点亮起的槽位或「确认出牌」即可打出。若弹出选择框，在框内选一个。',
    target: TARGETS.UNIT_PLAY,
    advance: 'auto',
    wait: WAITS.HUMAN_PLAY,
  },
  {
    id: 'play-environment',
    title: '第三步：打出环境牌',
    body: '找到「暴雨夜」并打出。环境牌会持续整夜、敌我不对称地削弱单位：敌方单位-2、己方单位-1。受影响的卡牌会出现变色边框和修正徽章。手里的「驱魔咒」可以移除环境卡，作为反制。',
    target: TARGETS.ENV_PLAY,
    advance: 'auto',
    wait: WAITS.HUMAN_PLAY,
  },
  {
    id: 'play-equipment',
    title: '第四步：装备银灯',
    body: '点「银灯」，再点你场上的一个单位把它附属上去，该单位战力+2。银灯还能在单位将被摧毁或封印时代替它受损；夜末单位离场时，银灯会返回你的手牌，下一夜继续使用。',
    target: TARGETS.EQUIP_PLAY,
    advance: 'auto',
    wait: WAITS.HUMAN_PLAY,
  },
  {
    id: 'leader',
    title: '领袖技能',
    body: '每名领袖每夜可发动一次技能，效果写在领袖区。哈罗德·阿什比的技能是封印一张敌方卡直到下一夜，并回复 1 点理智。本夜不用也没关系，正式对局里按需发动即可。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'pass',
    title: '第五步：过牌',
    body: '轮到你时若不想再出牌，可点「过牌」结束本夜行动。现在点击「过牌」试试。',
    target: TARGETS.PASS,
    advance: 'auto',
    wait: WAITS.HUMAN_PASS,
  },
  {
    id: 'sanity',
    title: '理智规则',
    body: '输掉一夜会扣除理智；理智越低，手牌越偏向疯狂面，一旦理智归零立即判负。出牌时若卡面标有理智代价，也会消耗对应理智。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'objective',
    title: '另一条胜利路线',
    body: '除了赢下两夜，还能靠达成目标立即获胜：学会阵营积攒线索、教团阵营积攒末日，达到阈值就当场结束对局。所以夜分落后时也别放弃，凑目标同样能赢。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'finish',
    title: '准备就绪',
    body: '核心规则与特色玩法你已经亲手练过。混沌袋、关键词等更多内容会在实战中出现轻提示。现在去赢下属于你的第一局吧。',
    target: TARGETS.NONE,
    advance: 'finish',
  },
]);

/** Normalised, DOM-free snapshot the wait conditions read from. */
export function buildTutorialSnapshot(view, uiState) {
  const v = view && typeof view === 'object' ? view : {};
  const ui = uiState && typeof uiState === 'object' ? uiState : {};
  return {
    phase: typeof v.phase === 'string' ? v.phase : null,
    night: Number.isFinite(v.night) ? v.night : 0,
    current: Number.isFinite(v.current) ? v.current : null,
    modalKind: ui.modal?.kind ?? null,
  };
}

/** Pure predicate for auto-advancing steps. */
export function conditionMet(wait, snapshot, eventFlags) {
  const snap = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const flags = eventFlags && typeof eventFlags === 'object' ? eventFlags : {};
  switch (wait) {
    case WAITS.PHASE_PLAY: return snap.phase === 'play';
    case WAITS.HUMAN_PLAY: return flags.humanPlayed === true;
    case WAITS.HUMAN_PASS: return flags.humanPassed === true;
    default: return false;
  }
}

export default TUTORIAL_STEPS;
