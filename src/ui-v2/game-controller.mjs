/**
 * src/ui-v2/game-controller.mjs — human-vs-AI game driver for play.html / app.html.
 *
 * The human is always seat 0 and the AI seat 1; `matchConfig.humanFaction`
 * decides which preset deck each seat receives (society → cult, or the
 * reverse).  Both sides are driven exclusively through `buildView`
 * (`engine.viewFor(pov)`) and `engine.apply(action)`:
 *
 *   - the human picks one of the exact objects in buildView(0).actions via
 *     action-matcher (click context → action reference);
 *   - the AI picks one of the exact objects in buildView(1).actions via
 *     chooseAction(), and is stepped through injectable timers so the whole
 *     match is observable in the browser.
 *
 * Harold's single-target skill keeps its original flow.  When the human sits
 * with the cult, Elias' four-field action is driven by `leader-composer.mjs`.
 *
 * Every imperative method used by the DOM handlers is public, which makes a
 * complete headless human-vs-AI match scriptable with a fake renderer and a
 * queued `schedule` function (see tests/ui-v2/game-controller.test.mjs).
 * No Math.random: match randomness is the engine's injected seed; only a
 * `random` seed mode generates a fresh seed, via injected generator or
 * `crypto.randomUUID` in the browser.
 */

import { createGame, CARDS, PRESET_DECKS } from '../engine/v2/index.js';
import { chooseAction } from '../ai/v2/ai.mjs';
import { DEFAULT_DIFFICULTY, isDifficulty } from '../ai/v2/difficulty.mjs';
import { createBoardRenderer } from './board-render.mjs';
import { publicActionLabel } from './demo-controller.mjs';
import { findMatchingActions, matchAction } from './action-matcher.mjs';
import { createSelection } from './selection.mjs';
import { createLeaderComposer, LEADER_STEPS, LEADER_STEP_LABELS } from './leader-composer.mjs';
import { asArray, asObject, escapeHtml, safeInt } from './utils.mjs';

export const DEFAULT_PLAY_SEED = 'greyharbor-seed-1';
export const DEFAULT_AI_DELAY_MS = 460;
export const HUMAN_SEAT = 0;
export const AI_SEAT = 1;

/** A seat-0 faction maps to the ordered deck pair handed to createGame(). */
export const FACTION_DECK_ORDER = Object.freeze({
  society: Object.freeze(['society', 'cult']),
  cult: Object.freeze(['cult', 'society']),
});

const FACTION_NAMES_ZH = Object.freeze({ society: '学会', cult: '教团' });

export const DEFAULT_MATCH_CONFIG = Object.freeze({
  humanFaction: 'society',
  humanLeader: 'harold-ashby',
  seedMode: 'fixed',
  baseSeed: DEFAULT_PLAY_SEED,
});

const HUMAN = HUMAN_SEAT;
const AI = AI_SEAT;

/**
 * Normalise the public match configuration.  The legacy top-level `seed`
 * option is accepted as a base seed so play.html and older scripts keep
 * working unchanged.
 */
/** Resolve a requested leader id for a faction, falling back to its preset. */
function resolveLeader(faction, requested) {
  const fallback = PRESET_DECKS[faction]?.leader ?? null;
  if (typeof requested !== 'string' || requested.length === 0) return fallback;
  const card = CARDS[requested];
  // A character must be a leader card of the same faction; otherwise the
  // preset leader is used so a bad value can never start a broken match.
  if (!card || card.type !== 'leader' || card.faction !== faction) return fallback;
  return requested;
}

export function normalizeMatchConfig(raw = {}, legacySeed) {
  const input = asObject(raw);
  const humanFaction = input.humanFaction === 'cult' ? 'cult' : 'society';
  const seedMode = input.seedMode === 'random' ? 'random' : 'fixed';
  const candidate = input.baseSeed ?? legacySeed ?? DEFAULT_PLAY_SEED;
  const baseSeed = typeof candidate === 'string' && candidate.length > 0
    ? candidate
    : DEFAULT_PLAY_SEED;
  const humanLeader = resolveLeader(humanFaction, input.humanLeader);
  return Object.freeze({ humanFaction, humanLeader, seedMode, baseSeed });
}

function isNodeRuntime() {
  return typeof process !== 'undefined' && !!asObject(process.versions).node;
}

/** Browser: crypto.randomUUID.  Node: an injected generator is mandatory. */
function resolveSeedGenerator(options, seedMode) {
  if (seedMode !== 'random') return null;
  if (typeof options.seedGenerator === 'function') return options.seedGenerator;
  if (typeof options.randomSeed === 'function') return options.randomSeed;
  const webCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  if (!isNodeRuntime() && webCrypto && typeof webCrypto.randomUUID === 'function') {
    return () => webCrypto.randomUUID();
  }
  throw new TypeError('random seed mode needs an injected seedGenerator in Node');
}

const EVENT_NAMES_ZH = Object.freeze({
  gameStart: '开局',
  deal: '发牌',
  mulligan: '换牌',
  handFlip: '手牌翻面',
  play: '出牌',
  playFromDeck: '牌堆入场',
  reveal: '盖牌翻开',
  environmentPlay: '环境入场',
  locationPlay: '地点入场',
  attach: '装备附属',
  leaderSkill: '领袖技',
  seal: '封印',
  corruption: '腐化',
  sacrifice: '献祭',
  draw: '抽牌',
  sanityChange: '理智变化',
  nightStart: '夜开始',
  nightEnd: '夜结算',
  gameOver: '对局结束',
});

const RESULT_REASON_ZH = Object.freeze({
  sanity: '理智归零',
  nightWins: '两夜取胜',
  tiebreak: '终局判定',
});

const LOCATION_ZH = Object.freeze({ scene: '现场', archive: '档案', dream: '梦境' });

function cssValue(value) {
  return String(value).replace(/["\\]/g, '\\$&');
}

function reasonText(view) {
  const result = asObject(view?.result);
  if (result.winner === null || result.winner === undefined) return '平局';
  return result.winner === HUMAN ? '你获胜' : '对手获胜';
}

export function createGameController(options = {}) {
  const opts = asObject(options);
  const matchConfig = normalizeMatchConfig(opts.matchConfig, opts.seed ?? opts.baseSeed);
  const seedGenerator = resolveSeedGenerator(opts, matchConfig.seedMode);
  let seed = matchConfig.baseSeed;
  const aiDelay = Number.isFinite(opts.aiDelay) && opts.aiDelay >= 0
    ? opts.aiDelay
    : DEFAULT_AI_DELAY_MS;
  const maxAiSteps = Number.isFinite(opts.maxAiSteps) && opts.maxAiSteps > 0
    ? Math.trunc(opts.maxAiSteps)
    : 500;
  // AI decision profile for the whole match; an invalid value can never start
  // a broken match because it falls back to the default difficulty.
  const aiDifficulty = isDifficulty(opts.aiDifficulty) ? opts.aiDifficulty : DEFAULT_DIFFICULTY;
  const schedule = typeof opts.schedule === 'function'
    ? opts.schedule
    : (fn, ms) => setTimeout(fn, ms);
  const cancelScheduled = typeof opts.cancel === 'function'
    ? opts.cancel
    : (token) => clearTimeout(token);

  const boardRoot = opts.boardRoot && typeof opts.boardRoot.querySelector === 'function' ? opts.boardRoot : null;
  const controlsRoot = opts.controlsRoot && typeof opts.controlsRoot.innerHTML === 'string' ? opts.controlsRoot : null;
  const renderer = opts.renderer
    ?? (boardRoot
      ? createBoardRenderer(boardRoot, {
        pov: HUMAN,
        cardBackId: opts.cardBackId,
        leaderPortrait: opts.leaderPortrait,
      })
      : null);
  if (!renderer || typeof renderer.render !== 'function') {
    throw new TypeError('createGameController needs a renderer or a boardRoot');
  }

  let engine = null;
  let view = null;
  let actions = [];
  const selection = createSelection();
  let selectedUid = null;
  let mode = 'mulligan';
  let mulliganPrepared = false;
  let highlights = [];
  let selectionHighlights = [];
  let directConfirm = false;
  let revealAllAction = null;
  let leaderDisabled = false;
  let leaderReason = '';
  let modal = null;
  let aiThinking = false;
  let inputLocked = false;
  let message = '准备开始';
  let lastAction = '等待你的第一个动作';
  let eventLog = [];
  let generation = 0;
  let aiTimer = null;
  let aiScheduled = false;
  let aiSteps = 0;
  let toastStack = opts.toastRoot ?? null;
  let decorated = [];
  const toastTimers = new Set();
  let gameOverNotified = false;
  // Optional atmosphere hooks.  They are best-effort: a broken FX/audio
  // callback must never break an otherwise legal game action.
  const hooks = asObject(opts.hooks);
  let localMuted = false;

  const composer = createLeaderComposer({
    commit: (action) => commit(action),
    labelFor: (stepKey, value, action) => leaderCandidateLabel(stepKey, value, action),
  });

  const toast = typeof opts.toast === 'function'
    ? opts.toast
    : (text, tone = 'info') => defaultToast(text, tone);

  function defaultToast(text, tone) {
    if (typeof document === 'undefined' || !document.body) return;
    if (!toastStack || !toastStack.parentNode) {
      toastStack = document.createElement('div');
      toastStack.className = 'gh2-toast-stack';
      toastStack.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastStack);
    }
    const item = document.createElement('div');
    item.className = `gh2-toast gh2-toast--${['info', 'warn', 'error', 'good'].includes(tone) ? tone : 'info'}`;
    item.textContent = String(text);
    toastStack.appendChild(item);
    while (toastStack.children.length > 5) toastStack.removeChild(toastStack.firstChild);
    const timer = setTimeout(() => {
      toastTimers.delete(timer);
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 3400);
    toastTimers.add(timer);
  }

  function say(text, tone = 'info') {
    message = String(text);
    toast(message, tone);
  }

  /** Invoke an optional atmosphere hook; failures are intentionally ignored. */
  function callHook(name, payload) {
    const fn = hooks[name];
    if (typeof fn !== 'function') return;
    try { fn(payload); } catch (_) { /* FX / audio must never block gameplay */ }
  }

  function audioStatus() {
    if (typeof hooks.getAudioStatus === 'function') {
      try {
        const status = asObject(hooks.getAudioStatus());
        return {
          muted: status.muted === true,
          label: typeof status.label === 'string' ? status.label : (status.muted === true ? '♪ 已静音' : '♪ 音效'),
        };
      } catch (_) { /* fall back to local state */ }
    }
    return { muted: localMuted, label: localMuted ? '♪ 已静音' : '♪ 音效' };
  }

  function newEngine() {
    aiSteps = 0;
    gameOverNotified = false;

    // Generic engine-options override (used by the campaign: run deck + relic
    // translation + difficulty).  The human-vs-AI driving loop is unchanged.
    if (opts.battleOptions && typeof opts.battleOptions === 'object') {
      engine = createGame(opts.battleOptions);
      seed = typeof opts.battleOptions.seed === 'string'
        ? opts.battleOptions.seed
        : matchConfig.baseSeed;
      return;
    }

    seed = matchConfig.seedMode === 'random'
      ? String(seedGenerator())
      : matchConfig.baseSeed;
    const factionOrder = FACTION_DECK_ORDER[matchConfig.humanFaction].slice();
    // Build explicit deck specs so the human seat can override its leader with
    // the chosen character while the 19-card preset list stays unchanged. The
    // AI seat keeps its faction's preset leader.
    const decks = factionOrder.map((faction, seat) => {
      const preset = PRESET_DECKS[faction];
      const leader = seat === HUMAN ? matchConfig.humanLeader : preset.leader;
      return { faction, leader, cards: preset.cards.slice() };
    });
    const myFaction = FACTION_NAMES_ZH[matchConfig.humanFaction];
    const foeFaction = FACTION_NAMES_ZH[factionOrder[AI]];
    engine = createGame({
      seed,
      names: [`你 · ${myFaction}`, `AI · ${foeFaction}`],
      decks,
    });
  }

  /** Display labels come from the human view; candidate values come from actions. */
  function leaderCandidateLabel(stepKey, value, action) {
    const lookup = (uid) => {
      if (!uid || !view) return null;
      for (let player = 0; player < 2; player += 1) {
        const sections = [asArray(view.players[player]?.hand), ...['scene', 'archive', 'dream']
          .map((location) => asArray(asObject(view.players[player]?.board)[location]))];
        for (const list of sections) {
          const card = list.find((entry) => entry?.uid === uid);
          if (card) return card.nameZh || card.name || uid;
        }
      }
      return null;
    };
    if (stepKey === 'sacrifice') return `献祭 ${lookup(value.sacrificeUid) ?? value.sacrificeUid}`;
    if (stepKey === 'aberration') {
      const match = /→\s*([^\s@]+)/.exec(String(asObject(action).label ?? ''));
      return `召唤异怪 ${match?.[1] ?? value.cardUid}`;
    }
    if (stepKey === 'placement') {
      return `${LOCATION_ZH[value.location] ?? value.location} #${value.slot + 1}（明放）`;
    }
    return value.replaceWithUid === null
      ? '不替换 · 跳过'
      : `替代信徒 ${lookup(value.replaceWithUid) ?? value.replaceWithUid}`;
  }

  // ── rendering / decoration ──────────────────────────────────────────

  function clearDecorations() {
    for (const entry of decorated) {
      entry.element.classList.remove('gh2-legal', 'gh2-legal--dual', 'gh2-selected', 'gh2-marked', 'gh2-dim', 'gh2-disabled', 'gh2-targetable');
      entry.element.removeAttribute('data-gh2-target');
      if (entry.title === null) entry.element.removeAttribute('title');
      else entry.element.setAttribute('title', entry.title);
    }
    decorated = [];
  }

  function decorate(element, classes, label, targetIndex) {
    if (!element) return;
    decorated.push({ element, title: element.getAttribute('title') });
    for (const className of classes) element.classList.add(className);
    if (label) element.setAttribute('title', label);
    if (targetIndex !== undefined) element.setAttribute('data-gh2-target', String(targetIndex));
  }

  function findElement(highlight) {
    if (!boardRoot || typeof boardRoot.querySelector !== 'function') return null;
    const h = asObject(highlight);
    const player = h.playerIndex === AI ? AI : HUMAN;
    let selector = '';
    if (h.kind === 'slot' && Number.isInteger(h.slot)) {
      selector = `.gh2-location[data-player="${player}"][data-location="${cssValue(h.location)}"] .gh2-location__slot[data-slot="${h.slot}"]`;
    } else if (h.kind === 'locationCard') {
      selector = `.gh2-location[data-player="${player}"][data-location="${cssValue(h.location)}"] .gh2-location__card-slot`;
    } else if (h.kind === 'hand') {
      selector = `.gh2-hand--viewer .gh2-card[data-uid="${cssValue(h.uid)}"]`;
    } else if (h.kind === 'leader') {
      selector = `.gh2-leader-zone[data-player="${player}"]`;
    } else if (h.kind === 'target') {
      selector = `.gh2-location[data-player="${player}"] .gh2-card[data-uid="${cssValue(h.uid)}"]`;
    }
    if (!selector) return null;
    try {
      return boardRoot.querySelector(selector);
    } catch (_) {
      return null;
    }
  }

  function decorateBoard() {
    if (!boardRoot) return;
    clearDecorations();
    const shell = boardRoot.querySelector('.gh2-shell');
    if (shell) {
      shell.classList.toggle('gh2-ai-thinking', aiThinking);
      shell.classList.toggle('gh2-locked', inputLocked);
    }
    highlights.forEach((highlight, index) => {
      const element = findElement(highlight);
      if (!element) return;
      decorate(element, highlight.dual ? ['gh2-legal', 'gh2-legal--dual'] : ['gh2-legal'], highlight.label, index);
    });
    const marked = selection.markedUids;
    for (const uid of marked) {
      const element = findElement({ kind: 'hand', uid });
      decorate(element, ['gh2-marked'], `已标记换牌：${uid}`);
    }
    if (selectedUid) {
      decorate(findElement({ kind: 'hand', uid: selectedUid }), ['gh2-selected'], `已选中：${selectedUid}`);
    }
    if (mode === 'play' && selectedUid) {
      const legalSlots = new Set(highlights.filter((h) => h.kind === 'slot').map((h) => `${h.playerIndex}:${h.location}:${h.slot}`));
      const ownGrid = boardRoot.querySelector('.gh2-location-grid[data-player="0"]');
      if (ownGrid) {
        for (const slotEl of ownGrid.querySelectorAll('.gh2-location__slot[data-slot]')) {
          const column = slotEl.closest('.gh2-location[data-location]');
          if (!column) continue;
          const key = `0:${column.dataset.location}:${safeInt(slotEl.dataset.slot, -1)}`;
          if (!legalSlots.has(key)) decorate(slotEl, ['gh2-dim'], null);
        }
      }
      for (const cardEl of boardRoot.querySelectorAll('.gh2-hand--viewer .gh2-card[data-uid]')) {
        if (cardEl.dataset.uid !== selectedUid) decorate(cardEl, ['gh2-dim'], null);
      }
    }
    if (leaderDisabled) {
      decorate(findElement({ kind: 'leader', playerIndex: HUMAN }), ['gh2-disabled'], leaderReason || '领袖技不可用');
    } else if (mode === 'leader-target') {
      decorate(findElement({ kind: 'leader', playerIndex: HUMAN }), ['gh2-targetable'], '再次点击可取消目标选择');
    }
  }

  function controlButton(name) {
    if (!controlsRoot || typeof controlsRoot.querySelector !== 'function') return null;
    return controlsRoot.querySelector(`[data-gh2="${name}"]`);
  }

  function setButton(name, enabled) {
    const button = controlButton(name);
    if (!button) return;
    button.disabled = !enabled;
    button.classList.toggle('gh2-disabled', !enabled);
  }

  function updateControls() {
    if (!controlsRoot) return;
    const statusEl = controlButton('status');
    const logEl = controlButton('log');
    const modalEl = controlButton('modal');
    if (statusEl) {
      let status = '';
      if (mode === 'mulligan') {
        status = `换牌阶段 · 已标记 ${selection.size}/${selection.limit} 张 · 点击手牌标记/取消，确认后继续`;
      } else if (mode === 'ai') {
        status = `${aiThinking ? 'AI 思考中…' : '对手行动中'} · 上次动作：${lastAction}`;
      } else if (mode === 'over') {
        const result = asObject(view?.result);
        status = `对局结束 · ${reasonText(view)} · ${RESULT_REASON_ZH[result.reason] ?? result.reason ?? '对局结束'}`;
      } else if (mode === 'leader-target') {
        status = '领袖目标选择中 · 点击高亮的敌方单位，或按取消返回';
      } else if (modal?.kind === 'leader-compose') {
        status = `伊莱亚斯领袖编排 · ${asObject(modal.composerState).stepLabel ?? ''} · 可取消回到选牌态`;
      } else if (selectedUid) {
        status = `已选中手牌 ${selectedUid} · 点击高亮落点${directConfirm ? '，或点击「确认出牌」' : ''}`;
      } else {
        status = '你的回合 · 点击手牌出牌 / 点击己方领袖 / 点击盖牌翻开 / 过牌';
      }
      if (message) status += ` · ${message}`;
      statusEl.textContent = status;
    }
    if (logEl) {
      const recent = eventLog.slice(-5).reverse();
      logEl.innerHTML = recent.length
        ? recent.map((line) => `<li>${escapeHtml(line)}</li>`).join('')
        : '<li>尚无事件</li>';
    }
    setButton('mulligan-confirm', mode === 'mulligan' && !inputLocked);
    setButton('play-confirm', mode === 'play' && !!selectedUid && directConfirm && !inputLocked);
    setButton('pass', mode === 'play' && view?.current === HUMAN && !inputLocked && !modal);
    setButton('reveal-all', mode === 'play' && !!revealAllAction && !inputLocked && !modal);
    setButton('cancel', !!modal || mode === 'leader-target' || !!selectedUid || (mode === 'mulligan' && selection.size > 0));
    setButton('restart', true);
    const muteButton = controlButton('mute');
    if (muteButton) {
      const status = audioStatus();
      muteButton.textContent = status.label;
      muteButton.setAttribute('aria-pressed', status.muted ? 'true' : 'false');
      muteButton.classList.toggle('is-muted', status.muted);
    }

    if (modalEl) {
      if (!modal) {
        modalEl.hidden = true;
        modalEl.innerHTML = '';
      } else {
        modalEl.hidden = false;
        const options = asArray(modal.options).map((option, index) =>
          `<button type="button" class="gh2-modal__option" data-gh2-choice="${index}">${escapeHtml(option.label ?? `选项 ${index + 1}`)}</button>`,
        ).join('');
        if (modal.kind === 'leader-compose') {
          const state = asObject(modal.composerState);
          const steps = LEADER_STEPS.map((key, index) => {
            const cls = index === state.stepIndex ? 'is-active' : index < state.stepIndex ? 'is-done' : '';
            return `<li class="gh2-leader-step ${cls}">${escapeHtml(LEADER_STEP_LABELS[key])}</li>`;
          }).join('');
          const skip = state.step === 'replacement'
            ? '<button type="button" class="gh2-modal__skip" data-gh2="composer-skip">跳过替换</button>'
            : '';
          modalEl.innerHTML = `<div class="gh2-modal__panel gh2-modal__panel--leader" role="dialog" aria-modal="true">
            <h3 class="gh2-modal__title">${escapeHtml(modal.title ?? '领袖编排')}</h3>
            <ol class="gh2-leader-steps">${steps}</ol>
            <p class="gh2-modal__hint">${escapeHtml(modal.hint ?? '')}</p>
            <div class="gh2-modal__options">${options}</div>
            <div class="gh2-modal__foot">${skip}<button type="button" class="gh2-modal__cancel" data-gh2="modal-cancel">取消编排</button></div>
          </div>`;
        } else {
          const restart = modal.kind === 'result'
            ? '<button type="button" class="gh2-modal__restart" data-gh2="restart">再来一局</button>'
            : '<button type="button" class="gh2-modal__cancel" data-gh2="modal-cancel">取消</button>';
          modalEl.innerHTML = `<div class="gh2-modal__panel" role="dialog" aria-modal="true">
            <h3 class="gh2-modal__title">${escapeHtml(modal.title ?? '请选择')}</h3>
            <p class="gh2-modal__hint">${escapeHtml(modal.hint ?? '')}</p>
            <div class="gh2-modal__options">${options}</div>
            <div class="gh2-modal__foot">${restart}</div>
          </div>`;
        }
      }
    }
  }

  function paint() {
    if (!view) return;
    try {
      renderer.render(view, {
        play: true,
        controller: {
          mode,
          seed,
          selectedUid,
          markedUids: selection.markedUids,
          highlights: highlights.slice(),
          aiThinking,
          inputLocked,
          lastAction,
          modalKind: modal?.kind ?? null,
          message,
        },
      });
    } catch (error) {
      say(`渲染失败：${error?.message ?? error}`, 'error');
    }
    decorateBoard();
    updateControls();
    callHook('afterPaint', { view, mode, seed });
  }

  // ── derived UI state ────────────────────────────────────────────────

  function selectedCard() {
    if (!selectedUid || !view) return null;
    return asArray(view.players[HUMAN]?.hand).find((card) => card?.uid === selectedUid) ?? null;
  }

  function boardPositionOfUid(uid) {
    if (!view) return null;
    for (let player = 0; player < 2; player += 1) {
      const board = asObject(view.players[player]?.board);
      for (const location of ['scene', 'archive', 'dream']) {
        const row = asArray(board[location]);
        const slot = row.findIndex((entry) => entry && entry.uid === uid);
        if (slot >= 0) return { player, location, slot };
      }
    }
    return null;
  }

  function leaderDisableReason() {
    const me = asObject(view?.players?.[HUMAN]);
    const leader = asObject(me.leader);
    if (!leader.cardId && !leader.name) return '你还没有领袖';
    if (leader.sealed === true) return '领袖已被封印，本夜无法发动';
    if (leader.usedThisNight === true) return '领袖本夜已使用';
    if (asArray(view?.passed)[HUMAN] === true) return '你已过牌，无法再发动领袖技';
    if (view?.phase === 'play' && view.current !== HUMAN) return '现在不是你的回合';
    if (view?.phase === 'mulligan') return '换牌阶段不能使用领袖技';
    return '当前没有合法的领袖目标';
  }

  function computeHighlightsForSelected(uid) {
    const list = [];
    const slots = new Map();
    directConfirm = false;
    for (let index = 0; index < actions.length; index += 1) {
      const action = asObject(actions[index]);
      if (action.type !== 'playCard' || action.uid !== uid) continue;
      if (action.hostUid) {
        const key = `slot:${action.location}:${action.slot}`;
        if (!slots.has(key)) {
          const entry = {
            kind: 'slot', playerIndex: HUMAN, location: action.location, slot: action.slot,
            uid: action.hostUid, label: action.label, actionIndex: index, dual: false,
          };
          slots.set(key, entry);
          list.push(entry);
        }
      } else if (action.location && Number.isInteger(action.slot)) {
        const key = `slot:${action.location}:${action.slot}`;
        if (slots.has(key)) {
          slots.get(key).dual = slots.get(key).dual || action.faceDown === true;
        } else {
          const entry = {
            kind: 'slot', playerIndex: HUMAN, location: action.location, slot: action.slot,
            label: action.label, actionIndex: index, dual: action.faceDown === true,
          };
          slots.set(key, entry);
          list.push(entry);
        }
      } else if (action.location && action.slot === null) {
        list.push({
          kind: 'locationCard', playerIndex: HUMAN, location: action.location,
          label: action.label, actionIndex: index, dual: false,
        });
      } else if (action.location === null && action.slot === null) {
        directConfirm = true;
      }
    }
    return list;
  }

  function computeRevealHighlights() {
    const list = [];
    revealAllAction = null;
    for (let index = 0; index < actions.length; index += 1) {
      const action = asObject(actions[index]);
      if (action.type !== 'reveal') continue;
      const uids = asArray(action.uids);
      if (uids.length > 1) {
        revealAllAction = action;
        continue;
      }
      const position = boardPositionOfUid(uids[0]);
      if (position && position.player === HUMAN) {
        list.push({
          kind: 'slot', playerIndex: HUMAN, location: position.location, slot: position.slot,
          uid: uids[0], label: action.label, actionIndex: index, dual: false,
        });
      }
    }
    return list;
  }

  function computeLeaderHighlights() {
    const list = [];
    for (let index = 0; index < actions.length; index += 1) {
      const action = asObject(actions[index]);
      if (action.type !== 'useLeader' || !action.targetUid) continue;
      const position = boardPositionOfUid(action.targetUid);
      if (!position) continue;
      list.push({
        kind: position.player === AI ? 'target' : 'slot',
        playerIndex: position.player,
        location: position.location,
        slot: position.slot,
        uid: action.targetUid,
        label: action.label,
        actionIndex: index,
        dual: false,
      });
    }
    return list;
  }

  // ── modal helpers ───────────────────────────────────────────────────

  function optionFromAction(action, fallback) {
    const data = asObject(action);
    return {
      label: typeof data.label === 'string' && data.label ? data.label : fallback,
      action,
      faceDown: data.faceDown === true,
      actionIndex: actions.indexOf(action),
    };
  }

  function openModal(kind, title, hint, options) {
    modal = { kind, title, hint, options: asArray(options) };
    paint();
  }

  function closeModal() {
    if (!modal) return false;
    modal = null;
    highlights = selectionHighlights.slice();
    paint();
    return true;
  }

  function chooseModalOption(index) {
    if (inputLocked) {
      say('AI 思考中，请稍候', 'warn');
      return false;
    }
    if (!modal) return false;
    const options = asArray(modal.options);
    const option = options[safeInt(index, -1)];
    if (!option || !option.action) {
      say('该选项已失效，请重新选择', 'warn');
      closeModal();
      return false;
    }
    if (!actions.includes(option.action)) {
      say('动作已过期，盘面已更新', 'warn');
      closeModal();
      return false;
    }
    return commit(option.action);
  }

  // ── Elias leader composer ───────────────────────────────────────────

  function syncComposerModal() {
    const state = composer.snapshot();
    if (!state.active || modal?.kind !== 'leader-compose') return;
    modal.composerState = state;
    modal.title = `伊莱亚斯领袖编排 · ${state.stepLabel}`;
    modal.hint = '候选均来自当前合法领袖动作；最终只提交唯一匹配的真实动作，随时可取消回到选牌态';
    modal.options = state.candidates.map((candidate) => ({
      label: candidate.label,
      candidateId: candidate.id,
      actionIndex: -1,
    }));
  }

  function beginLeaderComposer(leaderActions) {
    const state = composer.begin(leaderActions);
    if (!state.ok) {
      say(state.error || '领袖编排不可用', 'warn');
      return false;
    }
    selectedUid = null;
    highlights = [];
    selectionHighlights = [];
    directConfirm = false;
    modal = { kind: 'leader-compose', title: '', hint: '', options: [], composerState: state };
    syncComposerModal();
    message = '领袖编排进行中';
    paint();
    return true;
  }

  function composerChoose(index) {
    if (inputLocked) {
      say('AI 思考中，请稍候', 'warn');
      return false;
    }
    if (modal?.kind !== 'leader-compose') return false;
    const state = composer.snapshot();
    const candidate = state.candidates[safeInt(index, -1)];
    if (!candidate) {
      say('该选项已失效，请重新选择', 'warn');
      paint();
      return false;
    }
    const result = composer.choose(candidate.id);
    if (!result.ok) {
      say(result.error, 'warn');
      composerCancel();
      return false;
    }
    if (result.done) {
      // If the commit ended the game (e.g. sanity hit zero), refresh already
      // opened the result modal; keep it instead of wiping it.
      if (view?.phase !== 'gameOver') modal = null;
      message = '领袖技已发动';
      return true;
    }
    syncComposerModal();
    paint();
    return true;
  }

  function composerSkip() {
    if (modal?.kind !== 'leader-compose') return false;
    const result = composer.skip();
    if (!result.ok) {
      say(result.error, 'warn');
      return false;
    }
    if (view?.phase !== 'gameOver') modal = null;
    message = '领袖技已发动（未替换信徒）';
    return true;
  }

  function composerCancel() {
    composer.cancel();
    if (modal?.kind === 'leader-compose') modal = null;
    highlights = selectionHighlights.slice();
    message = '已取消领袖编排，回到选牌';
    paint();
    return true;
  }

  // ── committing actions ──────────────────────────────────────────────

  function recordEvents(events, who) {
    for (const event of asArray(events)) {
      const data = asObject(event);
      const name = EVENT_NAMES_ZH[data.type] ?? data.type ?? '事件';
      if (data.type === 'nightEnd') {
        const winner = data.winner === HUMAN ? '你' : data.winner === AI ? 'AI' : '平夜';
        eventLog.push(`第 ${safeInt(data.night, 0)} 夜结算 · ${winner} · ${safeInt(data.scores?.[HUMAN]?.total, 0)}:${safeInt(data.scores?.[AI]?.total, 0)}`);
        say(`第 ${safeInt(data.night, 0)} 夜结算：${winner}`, 'good');
      } else if (data.type === 'gameOver') {
        eventLog.push(`对局结束 · ${reasonText({ result: data })}`);
      } else {
        eventLog.push(`${who} · ${name}`);
      }
    }
    if (eventLog.length > 16) eventLog = eventLog.slice(-16);
    const notable = asArray(events).filter((event) => ['handFlip', 'reveal', 'sanityChange', 'draw'].includes(event?.type));
    if (notable.length && !asArray(events).some((event) => event?.type === 'nightEnd' || event?.type === 'gameOver')) {
      const names = [...new Set(notable.map((event) => EVENT_NAMES_ZH[event.type] ?? event.type))];
      say(`自动结算：${names.join(' / ')}`, 'info');
    }
  }

  function describeHumanAction(action) {
    const data = asObject(action);
    switch (data.type) {
      case 'mulligan': return `你换牌 ${asArray(data.uids).length} 张`;
      case 'playCard': {
        const place = data.location ? ` → ${LOCATION_ZH[data.location] ?? data.location}${Number.isInteger(data.slot) ? `#${data.slot + 1}` : ''}` : '';
        return `你出牌${place}`;
      }
      case 'reveal': return `你翻开 ${asArray(data.uids).length} 张盖牌`;
      case 'useLeader': return data.sacrificeUid ? '你献祭并召唤异怪' : '你使用领袖技封印';
      case 'pass': return '你过牌';
      default: return '你行动';
    }
  }

  function clearInteraction() {
    selectedUid = null;
    selection.clearSelection();
    highlights = [];
    selectionHighlights = [];
    directConfirm = false;
    revealAllAction = null;
    modal = null;
    leaderDisabled = false;
    leaderReason = '';
  }

  function commit(action) {
    try {
      if (!action || typeof action !== 'object' || !actions.includes(action)) {
        say('动作不在合法动作列表中，已拒绝', 'error');
        paint();
        return false;
      }
      if (inputLocked) {
        say('正在等待对手行动，输入已锁定', 'warn');
        return false;
      }
      const outcome = engine.apply(action);
      if (!outcome.ok) {
        say(`动作被拒绝：${outcome.error ?? '未知原因'}`, 'error');
        paint();
        return false;
      }
      lastAction = describeHumanAction(action);
      recordEvents(outcome.events, '你');
      callHook('onEvents', { events: asArray(outcome.events), who: '你', action });
      clearInteraction();
      mulliganPrepared = false;
      refresh();
      return true;
    } catch (error) {
      say(`操作失败：${error?.message ?? error}`, 'error');
      refresh();
      return false;
    }
  }

  // ── AI loop ─────────────────────────────────────────────────────────

  function scheduleAi() {
    if (aiScheduled || !engine || view?.phase === 'gameOver') return;
    aiScheduled = true;
    const myGeneration = generation;
    aiTimer = schedule(() => {
      aiScheduled = false;
      if (myGeneration !== generation) return;
      aiStep(myGeneration);
    }, aiDelay);
  }

  function aiStep(myGeneration) {
    if (myGeneration !== generation || !engine) return;
    if (view?.phase === 'gameOver') {
      refresh();
      return;
    }
    const aiMulligan = view?.phase === 'mulligan' && asArray(view.mulliganDone)[AI] !== true;
    const aiTurn = view?.phase === 'play' && view.current === AI;
    if (!aiMulligan && !aiTurn) {
      inputLocked = false;
      aiThinking = false;
      refresh();
      return;
    }

    const aiView = engine.viewFor(AI);
    const action = chooseAction(aiView, { seed: `${seed}:p1`, difficulty: aiDifficulty });
    if (!action || !asArray(aiView.actions).includes(action)) {
      say('对手没有合法动作，已停止自动化', 'error');
      inputLocked = false;
      aiThinking = false;
      refresh();
      return;
    }
    const outcome = engine.apply(action);
    if (!outcome.ok) {
      say(`对手动作被拒绝：${outcome.error ?? '未知原因'}`, 'error');
      inputLocked = false;
      aiThinking = false;
      refresh();
      return;
    }
    aiSteps += 1;
    lastAction = publicActionLabel(action);
    recordEvents(outcome.events, 'AI');
    callHook('onEvents', { events: asArray(outcome.events), who: 'AI', action });
    if (aiSteps > maxAiSteps) {
      say(`对手步数超过 ${maxAiSteps}，已停止以防卡死`, 'error');
      inputLocked = false;
      aiThinking = false;
      refresh();
      return;
    }
    refresh();
  }

  // ── central refresh ─────────────────────────────────────────────────

  function refresh() {
    if (!engine) return null;
    view = engine.viewFor(HUMAN);
    actions = asArray(view.actions);
    const phase = view.phase;
    const done = asArray(view.mulliganDone);

    if (phase === 'gameOver') {
      mode = 'over';
      inputLocked = true;
      aiThinking = false;
      clearInteraction();
      const result = asObject(view.result);
      const detail = result.reason === 'nightWins'
        ? `夜胜 ${safeInt(result.nightWins?.[HUMAN], 0)} : ${safeInt(result.nightWins?.[AI], 0)}`
        : result.reason === 'sanity'
          ? `理智 ${safeInt(result.sanity?.[HUMAN], 0)} : ${safeInt(result.sanity?.[AI], 0)}`
          : `终局夜 ${safeInt(result.night, 0)}`;
      const seedHint = matchConfig.seedMode === 'random'
        ? '点击「再来一局」用新随机种子重新开局'
        : '点击「再来一局」用同一固定种子重新开局';
      modal = {
        kind: 'result',
        title: `${reasonText(view)} · ${RESULT_REASON_ZH[result.reason] ?? result.reason ?? '对局结束'}`,
        hint: `${detail} · ${seedHint}`,
        options: [],
      };
      if (!gameOverNotified) {
        gameOverNotified = true;
        if (typeof opts.onGameOver === 'function') {
          try {
            opts.onGameOver({
              view,
              result: result ? { ...result } : null,
              nightHistory: asArray(view.history).map((entry) => asObject(entry)).map((entry) => ({
                night: safeInt(entry.night, 0),
                scores: asArray(entry.scores).map((score) => ({ ...asObject(score) })),
                winner: entry.winner ?? null,
                tie: entry.tie === true,
                nightWins: asArray(entry.nightWins).slice(),
              })),
              seed,
              matchConfig: { ...matchConfig },
            });
          } catch (error) {
            say(`结算回调失败：${error?.message ?? error}`, 'error');
          }
        }
      }
    } else if (phase === 'mulligan' && done[HUMAN] !== true) {
      mode = 'mulligan';
      inputLocked = false;
      aiThinking = false;
      if (!mulliganPrepared) {
        const handUids = asArray(view.players[HUMAN]?.hand).map((card) => card?.uid).filter((uid) => typeof uid === 'string');
        const limit = asArray(actions)
          .filter((action) => action?.type === 'mulligan' && action.player === HUMAN)
          .reduce((max, action) => Math.max(max, asArray(action.uids).length), 0);
        selection.reset({ limit, allowedUids: handUids });
        mulliganPrepared = true;
      }
    } else if (phase === 'mulligan' || (phase === 'play' && view.current === AI)) {
      mode = 'ai';
      inputLocked = true;
      aiThinking = true;
      highlights = [];
      selectionHighlights = [];
      revealAllAction = null;
    } else {
      mode = 'play';
      inputLocked = false;
      aiThinking = false;
      leaderDisabled = findMatchingActions(actions, { type: 'useLeader' }).length === 0;
      leaderReason = leaderDisabled ? leaderDisableReason() : '';
      if (!selectedUid) {
        highlights = computeRevealHighlights();
        selectionHighlights = highlights.slice();
      }
      if (modal?.kind === 'result') modal = null;
    }

    if (phase !== 'play' || view.current !== HUMAN) {
      leaderDisabled = false;
      leaderReason = '';
    }
    paint();
    if (mode === 'ai') scheduleAi();
    return view;
  }

  // ── human interactions (all also available imperatively for scripts) ─

  function ensureHumanTurn() {
    if (!view || view?.phase === 'gameOver') {
      say('对局已结束，请点击「再来一局」', 'warn');
      return false;
    }
    if (view?.phase === 'mulligan') {
      say('请先完成换牌阶段', 'warn');
      return false;
    }
    if (inputLocked || view.current !== HUMAN) {
      say(inputLocked ? 'AI 思考中，请稍候' : '现在不是你的回合', 'warn');
      return false;
    }
    if (modal) {
      say('请先完成或取消当前选择', 'warn');
      return false;
    }
    return true;
  }

  function toggleMark(uid) {
    if (!view || view?.phase !== 'mulligan' || mode !== 'mulligan' || inputLocked) {
      say('现在不能标记换牌', 'warn');
      return false;
    }
    const result = selection.toggleMark(uid);
    if (!result.ok) {
      say(`无法标记该手牌：${result.reason ?? '无效'}`, 'warn');
      paint();
      return false;
    }
    message = result.marked ? `已标记 ${uid}` : `已取消标记 ${uid}`;
    paint();
    return true;
  }

  function confirmMulligan() {
    if (!view || view?.phase !== 'mulligan' || mode !== 'mulligan' || inputLocked) {
      say('现在不能确认换牌', 'warn');
      return false;
    }
    const action = matchAction(actions, { type: 'mulligan', uids: selection.markedUids });
    if (!action) {
      say('换牌选择无效，请重新标记', 'error');
      paint();
      return false;
    }
    return commit(action);
  }

  function selectHandCard(uid) {
    if (!ensureHumanTurn()) return false;
    const cardActions = findMatchingActions(actions, { type: 'playCard', uid });
    if (!cardActions.length) {
      say('这张牌当前没有合法出牌方式', 'warn');
      paint();
      return false;
    }
    if (selectedUid === uid) {
      selectedUid = null;
      highlights = [];
      selectionHighlights = [];
      directConfirm = false;
      message = '已取消选牌';
      paint();
      return true;
    }
    selectedUid = uid;
    highlights = computeHighlightsForSelected(uid);
    selectionHighlights = highlights.slice();
    const card = selectedCard();
    message = `已选中 ${card?.nameZh || card?.name || uid}`;
    paint();
    return true;
  }

  function resolveCandidates(candidates, title) {
    if (!Array.isArray(candidates) || !candidates.length) {
      say('该位置不是合法落点', 'warn');
      paint();
      return false;
    }
    if (candidates.length === 1) return commit(candidates[0]);
    const faceDownValues = new Set(candidates.map((action) => action?.faceDown === true));
    if (faceDownValues.size === 2 && candidates.every((action) => !asObject(action).choice)) {
      const options = candidates.map((action) => optionFromAction(
        action,
        action?.faceDown === true ? '暗放（盖牌入场）' : '明放（公开入场）',
      ));
      openModal('facedown', title || '选择放置方式', '隐秘单位可以选择明放或暗放', options);
      return true;
    }
    const options = candidates.map((action, index) => optionFromAction(action, `选项 ${index + 1}`));
    openModal('choice', title || '选择效果目标', '同一动作有多个合法目标/效果，请选择一个（取消可回到选牌态）', options);
    return true;
  }

  function clickSlot(location, slot, playerIndex = HUMAN) {
    if (!view || view?.phase !== 'play') {
      say('当前不能点击落点', 'warn');
      return false;
    }
    if (mode === 'leader-target') {
      const ownInst = asObject(view.players[playerIndex]?.board)?.[location]?.[safeInt(slot, -1)];
      if (!ownInst?.uid) {
        say('这里没有可选的领袖目标', 'warn');
        paint();
        return false;
      }
      return clickTarget(ownInst.uid);
    }
    if (!ensureHumanTurn()) return false;
    const numericSlot = safeInt(slot, -1);
    const boardCard = asArray(asObject(view.players[HUMAN]?.board)[location])[numericSlot];
    const hostUid = boardCard && !boardCard.hidden && boardCard.uid ? boardCard.uid : undefined;
    if (selectedUid) {
      const context = { type: 'playCard', uid: selectedUid, location, slot: numericSlot };
      if (hostUid) context.hostUid = hostUid;
      const candidates = findMatchingActions(actions, context);
      return resolveCandidates(candidates, `选择 ${LOCATION_ZH[location] ?? location} #${numericSlot + 1} 的放置方式`);
    }
    if (boardCard?.uid) {
      const candidates = findMatchingActions(actions, { type: 'reveal', uids: [boardCard.uid] });
      if (candidates.length) return resolveCandidates(candidates, '选择翻开效果');
    }
    say('请先点击一张手牌；场上盖牌可直接点击翻开', 'warn');
    paint();
    return false;
  }

  function clickLocationCardSlot(location) {
    if (!ensureHumanTurn()) return false;
    if (!selectedUid) {
      say('请先点击一张手牌', 'warn');
      paint();
      return false;
    }
    const candidates = findMatchingActions(actions, {
      type: 'playCard', uid: selectedUid, location, slot: null,
    });
    return resolveCandidates(candidates, '选择地点效果');
  }

  function confirmPlay() {
    if (!ensureHumanTurn()) return false;
    if (!selectedUid) {
      say('请先点击一张手牌', 'warn');
      paint();
      return false;
    }
    const candidates = findMatchingActions(actions, {
      type: 'playCard', uid: selectedUid, location: null, slot: null,
    });
    if (!candidates.length) {
      say('这张牌需要选择落点，或当前无法打出', 'warn');
      paint();
      return false;
    }
    return resolveCandidates(candidates, '确认出牌');
  }

  function clickLeader() {
    if (!ensureHumanTurn()) return false;
    if (mode === 'leader-target') {
      mode = 'play';
      highlights = selectionHighlights.slice();
      message = '已取消领袖目标选择';
      paint();
      return true;
    }
    const leaderActions = findMatchingActions(actions, { type: 'useLeader' });
    if (!leaderActions.length) {
      leaderDisabled = true;
      leaderReason = leaderDisableReason();
      say(leaderReason, 'warn');
      paint();
      return false;
    }
    leaderDisabled = false;
    leaderReason = '';
    selectedUid = null;
    const eliasActions = leaderActions.filter((action) =>
      typeof asObject(action).sacrificeUid === 'string' && typeof asObject(action).cardUid === 'string');
    if (eliasActions.length) return beginLeaderComposer(leaderActions);
    if (leaderActions.every((action) => !!asObject(action).targetUid)) {
      mode = 'leader-target';
      highlights = computeLeaderHighlights();
      selectionHighlights = highlights.slice();
      message = '点击高亮目标发动领袖技';
      paint();
      return true;
    }
    const options = leaderActions.map((action, index) => optionFromAction(action, `领袖技能 ${index + 1}`));
    openModal('leader', '选择领袖技能', '该领袖技需要选择献祭目标与召唤方式', options);
    return true;
  }

  function clickTarget(targetUid) {
    if (!view || view?.phase !== 'play') {
      say('当前不能选择目标', 'warn');
      return false;
    }
    if (mode !== 'leader-target') {
      if (modal?.kind === 'leader-compose') {
        const state = composer.snapshot();
        const index = state.candidates.findIndex((candidate) =>
          candidate.value.sacrificeUid === targetUid || candidate.value.replaceWithUid === targetUid);
        if (index < 0) {
          say('该目标不在当前领袖编排选项中', 'warn');
          paint();
          return false;
        }
        return composerChoose(index);
      }
      if (modal) return chooseModalOptionByUid(targetUid);
      say('请先点击己方领袖', 'warn');
      return false;
    }
    const candidates = findMatchingActions(actions, { type: 'useLeader', targetUid });
    if (!candidates.length) {
      say('该目标不能被领袖技选中', 'warn');
      paint();
      return false;
    }
    return resolveCandidates(candidates, '选择领袖技能目标');
  }

  function chooseModalOptionByUid(targetUid) {
    const index = asArray(modal?.options).findIndex((option) => option?.action?.targetUid === targetUid);
    if (index >= 0) return chooseModalOption(index);
    say('该目标不在当前选项中', 'warn');
    return false;
  }

  function revealAll() {
    if (!ensureHumanTurn()) return false;
    const candidates = findMatchingActions(actions, { type: 'reveal' })
      .filter((action) => asArray(action.uids).length > 1);
    return resolveCandidates(candidates, '全部翻开');
  }

  function pass() {
    if (!ensureHumanTurn()) return false;
    const action = matchAction(actions, { type: 'pass' });
    if (!action) {
      say('当前无法过牌', 'warn');
      paint();
      return false;
    }
    return commit(action);
  }

  function cancel() {
    if (inputLocked && view?.phase !== 'mulligan') {
      say('AI 思考中，无法取消', 'warn');
      return false;
    }
    if (modal?.kind === 'result') return false;
    if (modal?.kind === 'leader-compose') return composerCancel();
    if (modal) return closeModal();
    if (mode === 'leader-target') {
      mode = 'play';
      highlights = selectionHighlights.slice();
      message = '已取消领袖目标选择';
      paint();
      return true;
    }
    if (mode === 'mulligan' && selection.size > 0) {
      selection.clearMarks();
      message = '已清空换牌标记';
      paint();
      return true;
    }
    if (selectedUid) {
      selectedUid = null;
      highlights = [];
      selectionHighlights = [];
      directConfirm = false;
      message = '已取消选牌';
      paint();
      return true;
    }
    return false;
  }

  function restart() {
    generation += 1;
    if (aiTimer !== null) {
      try { cancelScheduled(aiTimer); } catch (_) { /* cancelled timer may already be gone */ }
      aiTimer = null;
    }
    aiScheduled = false;
    mulliganPrepared = false;
    clearInteraction();
    composer.cancel();
    eventLog = [];
    lastAction = '等待你的第一个动作';
    message = '新对局已开始';
    inputLocked = false;
    aiThinking = false;
    mode = 'mulligan';
    newEngine();
    refresh();
    say(matchConfig.seedMode === 'random' ? '已用新随机种子重新开局' : '已用相同固定种子重新开局', 'good');
    return view;
  }

  // ── DOM event wiring ────────────────────────────────────────────────

  function handleBoardClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    if (inputLocked) {
      say('AI 思考中，请稍候', 'warn');
      return;
    }
    if (modal) {
      if (modal.kind === 'leader-compose') {
        const card = target.closest('.gh2-card[data-uid]');
        if (card) {
          clickTarget(card.dataset.uid);
          return;
        }
      }
      say('请先完成或取消当前选择', 'warn');
      return;
    }
    const handCard = target.closest('.gh2-hand--viewer .gh2-card[data-uid]');
    if (handCard) {
      if (mode === 'mulligan') toggleMark(handCard.dataset.uid);
      else selectHandCard(handCard.dataset.uid);
      return;
    }
    const slot = target.closest('.gh2-location__slot[data-slot]');
    if (slot) {
      const column = slot.closest('.gh2-location[data-location][data-player]');
      if (!column) return;
      clickSlot(column.dataset.location, safeInt(slot.dataset.slot, -1), safeInt(column.dataset.player, HUMAN));
      return;
    }
    const locationCardSlot = target.closest('.gh2-location[data-player="0"] .gh2-location__card-slot');
    if (locationCardSlot) {
      const column = locationCardSlot.closest('.gh2-location[data-location]');
      if (column) clickLocationCardSlot(column.dataset.location);
      return;
    }
    const leader = target.closest('.gh2-leader-zone[data-player="0"]');
    if (leader) clickLeader();
  }

  function handleControlClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    const choice = target.closest('[data-gh2-choice]');
    if (choice) {
      if (modal?.kind === 'leader-compose') composerChoose(safeInt(choice.dataset.gh2Choice, -1));
      else chooseModalOption(safeInt(choice.dataset.gh2Choice, -1));
      return;
    }
    const button = target.closest('[data-gh2]');
    if (!button) return;
    switch (button.dataset.gh2) {
      case 'mulligan-confirm': confirmMulligan(); break;
      case 'play-confirm': confirmPlay(); break;
      case 'pass': pass(); break;
      case 'reveal-all': revealAll(); break;
      case 'cancel': cancel(); break;
      case 'restart': restart(); break;
      case 'mute': {
        localMuted = !audioStatus().muted;
        callHook('onMuteToggle', localMuted);
        updateControls();
        break;
      }
      case 'composer-skip': composerSkip(); break;
      case 'modal-cancel':
        if (modal?.kind === 'leader-compose') composerCancel();
        else closeModal();
        break;
      default: break;
    }
  }

  function handleKeyDown(event) {
    if (event?.key === 'Escape') cancel();
  }

  if (controlsRoot) {
    controlsRoot.innerHTML = `<section class="gh2-play-controls" aria-label="人机对战操作台">
      <div class="gh2-play-controls__head"><span class="gh2-play-controls__mark">PLAY · 人机对战</span><span>操作台 <small>CONTROLS</small></span></div>
      <div class="gh2-play-controls__status" data-gh2="status" aria-live="polite">初始化中…</div>
      <div class="gh2-play-controls__buttons">
        <button type="button" data-gh2="mulligan-confirm" class="gh2-play-btn gh2-play-btn--primary">确认换牌</button>
        <button type="button" data-gh2="play-confirm" class="gh2-play-btn gh2-play-btn--primary">确认出牌</button>
        <button type="button" data-gh2="pass" class="gh2-play-btn">过牌</button>
        <button type="button" data-gh2="reveal-all" class="gh2-play-btn">全部翻开</button>
        <button type="button" data-gh2="cancel" class="gh2-play-btn">取消</button>
        <button type="button" data-gh2="restart" class="gh2-play-btn">再来一局</button>
        <button type="button" data-gh2="mute" class="gh2-play-btn gh2-play-btn--mute" aria-pressed="false">♪ 音效</button>
      </div>
      <ul class="gh2-play-controls__log" data-gh2="log"></ul>
      <div class="gh2-modal" data-gh2="modal" hidden></div>
    </section>`;
    controlsRoot.addEventListener('click', handleControlClick);
  }
  if (boardRoot) boardRoot.addEventListener('click', handleBoardClick);
  if (typeof document !== 'undefined') document.addEventListener('keydown', handleKeyDown);

  newEngine();
  refresh();

  function getUiState() {
    return {
      mode,
      seed,
      aiDifficulty,
      selectedUid,
      markedUids: selection.markedUids,
      limit: selection.limit,
      highlights: highlights.map((highlight) => ({ ...highlight })),
      directConfirm,
      revealAllAvailable: !!revealAllAction,
      leaderDisabled,
      leaderReason,
      modal: modal ? {
        kind: modal.kind,
        title: modal.title,
        hint: modal.hint,
        options: asArray(modal.options).map((option) => ({
          label: option.label,
          faceDown: option.faceDown === true,
          actionIndex: option.actionIndex,
          candidateId: option.candidateId ?? null,
        })),
        composerState: modal.kind === 'leader-compose' ? composer.snapshot() : null,
      } : null,
      matchConfig: { ...matchConfig },
      leaderComposer: composer.snapshot(),
      aiThinking,
      inputLocked,
      message,
      lastAction,
      eventLog: eventLog.slice(),
      actionsCount: actions.length,
      aiSteps,
      generation,
    };
  }

  return {
    // board interactions
    toggleMark,
    confirmMulligan,
    selectHandCard,
    clickSlot,
    clickLocationCardSlot,
    clickTarget,
    clickLeader,
    confirmPlay,
    revealAll,
    pass,
    chooseModalOption,
    chooseLeaderCandidate: composerChoose,
    skipLeaderReplacement: composerSkip,
    cancelLeaderComposer: composerCancel,
    cancel,
    restart,
    // lifecycle / introspection
    refresh,
    destroy() {
      generation += 1;
      if (aiTimer !== null) {
        try { cancelScheduled(aiTimer); } catch (_) { /* ignore */ }
        aiTimer = null;
      }
      aiScheduled = false;
      for (const timer of toastTimers) {
        try { clearTimeout(timer); } catch (_) { /* ignore */ }
      }
      toastTimers.clear();
      composer.cancel();
      modal = null;
      callHook('onDestroy', {});
      if (controlsRoot) controlsRoot.removeEventListener('click', handleControlClick);
      if (boardRoot) boardRoot.removeEventListener('click', handleBoardClick);
      if (typeof document !== 'undefined') document.removeEventListener('keydown', handleKeyDown);
    },
    getView: () => view,
    getActions: () => actions.slice(),
    getEngine: () => engine,
    getUiState,
    getMatchConfig: () => ({ ...matchConfig }),
    getState: () => ({
      seed,
      humanFaction: matchConfig.humanFaction,
      seedMode: matchConfig.seedMode,
      mode,
      phase: view?.phase ?? null,
      night: view?.night ?? 0,
      current: view?.current ?? null,
      result: view?.result ? { ...view.result } : null,
      aiThinking,
      inputLocked,
      generation,
      aiSteps,
    }),
  };
}

export default createGameController;
