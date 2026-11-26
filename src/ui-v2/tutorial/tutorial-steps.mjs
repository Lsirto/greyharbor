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
  SLOT: 'slot',
  PASS: 'pass',
});

/** Wait conditions evaluated by the pure conditionMet() in this module. */
export const WAITS = Object.freeze({
  PHASE_PLAY: 'phase-play',
  SELECTED: 'selected',
  HUMAN_PLAY: 'human-play',
  HUMAN_PASS: 'human-pass',
});

/**
 * CSS selectors that count as "the prompted target" for the input gate.
 * Modal option buttons are always allowed while a modal is open so a facedown /
 * choice prompt can be completed during the slot step.
 */
export const TARGET_SELECTORS = Object.freeze({
  [TARGETS.NONE]: [],
  [TARGETS.HAND]: ['.gh2-hand--viewer .gh2-card'],
  [TARGETS.MULLIGAN_CONFIRM]: ['[data-gh2="mulligan-confirm"]'],
  [TARGETS.SLOT]: ['.gh2-legal', '[data-gh2-choice]', '.gh2-modal__option'],
  [TARGETS.PASS]: ['[data-gh2="pass"]'],
});

export const TUTORIAL_SEED = 'tutorial-fixed';

export const TUTORIAL_STEPS = Object.freeze([
  {
    id: 'intro',
    title: '欢迎来到灰港',
    body: '你将在三夜牌局中与对手较量。本教程用约两分钟带你学会换牌、出牌、过牌与理智规则，之后就能自己开局。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'mulligan-mark',
    title: '第一步：换牌',
    body: '现在是换牌阶段。点击任意一张手牌可标记/取消它，再点「确认换牌」就能换掉；不想换也可以直接继续。',
    target: TARGETS.HAND,
    advance: 'continue',
  },
  {
    id: 'mulligan-confirm',
    title: '确认换牌',
    body: '点击「确认换牌」进入第一夜。标记的牌会被洗回并重新抽补。',
    target: TARGETS.MULLIGAN_CONFIRM,
    advance: 'auto',
    wait: WAITS.PHASE_PLAY,
  },
  {
    id: 'locations',
    title: '认识三个地点',
    body: '现场可放 5 张单位，档案 5 张、梦境 3 张。卡牌在不同地点分别结算；梦境只接受疯狂面或带「隐秘」的卡。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'play-select',
    title: '第二步：选一张手牌',
    body: '点击任意一张手牌选中它，场上会亮起它能去的合法落点。再点一次同一张牌可取消。',
    target: TARGETS.HAND,
    advance: 'auto',
    wait: WAITS.SELECTED,
  },
  {
    id: 'play-slot',
    title: '第三步：点高亮落点',
    body: '点击一个发光的落点打出这张牌。若弹出选择框（明放/暗放等），在框内选一个即可。',
    target: TARGETS.SLOT,
    advance: 'auto',
    wait: WAITS.HUMAN_PLAY,
  },
  {
    id: 'pass',
    title: '第四步：过牌',
    body: '轮到你时也可以点「过牌」结束本夜行动。对手行动后，点击「过牌」试试。',
    target: TARGETS.PASS,
    advance: 'auto',
    wait: WAITS.HUMAN_PASS,
  },
  {
    id: 'sanity',
    title: '理智与双面卡',
    body: '输掉一夜会扣理智；理智降到 3 以下，手牌强制翻到疯狂面，归零则直接判负。学会攒线索、教团积末日，达到目标也能立即获胜。',
    target: TARGETS.NONE,
    advance: 'continue',
  },
  {
    id: 'finish',
    title: '准备就绪',
    body: '核心规则你已经掌握。混沌袋、关键词等高级内容会在实战中出现轻提示。现在去赢下属于你的第一局吧。',
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
    selectedUid: ui.selectedUid ?? null,
    modalKind: ui.modal?.kind ?? null,
  };
}

/** Pure predicate for auto-advancing steps. */
export function conditionMet(wait, snapshot, eventFlags) {
  const snap = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const flags = eventFlags && typeof eventFlags === 'object' ? eventFlags : {};
  switch (wait) {
    case WAITS.PHASE_PLAY: return snap.phase === 'play';
    case WAITS.SELECTED: return snap.selectedUid !== null && snap.selectedUid !== undefined;
    case WAITS.HUMAN_PLAY: return flags.humanPlayed === true;
    case WAITS.HUMAN_PASS: return flags.humanPassed === true;
    default: return false;
  }
}

export default TUTORIAL_STEPS;
