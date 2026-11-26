/**
 * src/ui-v2/demo-controller.mjs — deterministic self-playing demo.
 *
 * Creates a real v2 game with a fixed seed, reads ONLY buildView(pov) output,
 * picks one of `view.actions` with an injected, seeded mulberry32 RNG (the
 * host's non-deterministic RNG is never used), applies it through the engine's
 * public apply(), and re-renders
 * the whole board.  Purely a display driver: no player interaction logic.
 */

import { createGame } from '../engine/v2/index.js';
import { hashSeed, nextRandom } from '../engine/rng.js';
import { createBoardRenderer } from './board-render.mjs';
import { escapeHtml, asArray, asObject, safeInt } from './utils.mjs';

export const DEFAULT_SEED = 'greyharbor-three-nights-demo';

export const SPEED_OPTIONS = Object.freeze([
  { value: 1200, label: '慢速 1.2s' },
  { value: 700, label: '标准 0.7s' },
  { value: 350, label: '快速 0.35s' },
  { value: 140, label: '极快 0.14s' },
]);

const EVENT_LABELS = Object.freeze({
  gameStart: '开局',
  deal: '发牌',
  mulligan: '换牌',
  handFlip: '手牌翻面',
  play: '出牌',
  playFromDeck: '牌堆直接入场',
  reveal: '盖牌翻开',
  environmentPlay: '环境入场',
  locationPlay: '地点入场',
  attach: '装备附属',
  leaderSkill: '领袖技',
  seal: '封印',
  corruption: '腐化',
  sacrifice: '献祭',
  nightEnd: '夜结算',
  gameOver: '对局结束',
});

const SPECIAL_TYPES = new Set(['equipment', 'location', 'environment', 'event', 'ritual', 'oldgod']);
const LOCATION_LABELS_ZH = Object.freeze({ front: '对峙线' });

/**
 * An action chosen from the opponent's own view carries their card name in
 * `label`.  The POV banner must not reveal hidden hand information, so only
 * public facts (type, location, slot) are kept.
 */
export function publicActionLabel(action) {
  const data = asObject(action);
  switch (data.type) {
    case 'mulligan': return '对手换牌';
    case 'playCard': {
      const place = data.location
        ? ` → ${LOCATION_LABELS_ZH[data.location] ?? data.location}#${safeInt(data.slot, 0) + 1}`
        : '';
      return `对手出牌${place}`;
    }
    case 'reveal': return '对手翻开盖牌';
    case 'useLeader': return '对手使用领袖技';
    case 'pass': return '对手过牌';
    default: return '对手行动';
  }
}

/** Injected RNG.  Same seed + same view => same choice. */
function makeDemoRng(seed) {
  const state = { rngState: hashSeed(seed) };
  return {
    next: () => nextRandom(state),
    int: (n) => (n <= 0 ? 0 : Math.floor(nextRandom(state) * n)),
  };
}

function pickWeighted(items, weights, rng) {
  if (!items.length) return null;
  let total = 0;
  for (const weight of weights) total += Math.max(0, weight);
  if (total <= 0) return items[0];
  let roll = rng.next() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= Math.max(0, weights[i]);
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

function weightForAction(action, view, pov) {
  switch (action?.type) {
    case 'reveal': return 60;
    case 'useLeader': return 18;
    case 'pass': return 9;
    case 'playCard': {
      const hand = asArray(asObject(asArray(view?.players)[pov]).hand);
      const card = hand.find((entry) => entry?.uid === action.uid);
      return SPECIAL_TYPES.has(card?.type) ? 34 : 26;
    }
    default: return 6;
  }
}

/**
 * Pick one of the legal actions supplied by buildView().
 * @param {object} view buildView(pov) output
 * @param {{next:()=>number,int:(n:number)=>number}} rng injected RNG
 * @returns {object|null} the exact action object from view.actions
 */
export function chooseDemoAction(view, rng) {
  const data = asObject(view);
  const actions = asArray(data.actions);
  const chosenRng = rng && typeof rng.next === 'function' ? rng : makeDemoRng(DEFAULT_SEED);
  if (!actions.length) return null;

  if (data.phase === 'mulligan') {
    const done = asArray(data.mulliganDone);
    const pending = [0, 1].filter((p) => done[p] !== true);
    const target = pending.length
      ? pending[chosenRng.int(pending.length)]
      : safeInt(asObject(actions[0]).player, 0);
    const pool = actions.filter((action) => action?.type === 'mulligan' && action.player === target);
    if (!pool.length) return actions[chosenRng.int(actions.length)];
    const weights = pool.map((action) => {
      const size = asArray(action.uids).length;
      if (size === 0) return 2; // demonstrate "keep hand" too
      return size <= 2 ? 16 : 2;
    });
    return pickWeighted(pool, weights, chosenRng);
  }

  const pov = data.current === 1 ? 1 : 0;
  const pool = actions.filter((action) => action?.player === undefined || action.player === pov);
  const usable = pool.length ? pool : actions;
  const weights = usable.map((action) => weightForAction(action, data, pov));
  return pickWeighted(usable, weights, chosenRng);
}

function controlMarkup(speed) {
  const options = SPEED_OPTIONS.map((entry) =>
    `<option value="${entry.value}"${entry.value === speed ? ' selected' : ''}>${escapeHtml(entry.label)}</option>`,
  ).join('');
  return `<div class="gh2-demo-controls__title">
      <span class="gh2-demo-controls__mark">AUTO · 演示</span>
      <span>演示控制 <small>DEMO CONTROLS</small></span>
    </div>
    <div class="gh2-demo-controls__body">
      <button type="button" data-demo="toggle" class="gh2-demo-btn gh2-demo-btn--primary">暂停</button>
      <button type="button" data-demo="step" class="gh2-demo-btn">单步</button>
      <button type="button" data-demo="mid" class="gh2-demo-btn">快进中盘</button>
      <button type="button" data-demo="restart" class="gh2-demo-btn">重开</button>
      <label class="gh2-demo-speed">速度 <select data-demo="speed">${options}</select></label>
    </div>
    <div class="gh2-demo-controls__status" data-demo="status" aria-live="polite">初始化中…</div>`;
}

export function createDemoController(options = {}) {
  const seed = options.seed ?? DEFAULT_SEED;
  const pov = options.pov === 1 ? 1 : 0;
  let speed = SPEED_OPTIONS.some((entry) => entry.value === options.speed)
    ? options.speed
    : 700;
  const renderer = options.renderer ?? (options.boardRoot
    ? createBoardRenderer(options.boardRoot, { pov })
    : null);
  if (!renderer || typeof renderer.render !== 'function') {
    throw new TypeError('createDemoController needs a renderer or a boardRoot');
  }
  const controlsRoot = options.controlsRoot ?? null;
  if (controlsRoot) controlsRoot.innerHTML = controlMarkup(speed);

  const rng = makeDemoRng(seed);
  let engine = null;
  let steps = 0;
  let lastAction = '等待首个合法动作';
  let running = false;
  let timer = null;
  let overTicks = 0;

  function newEngine() {
    engine = createGame({
      seed,
      names: ['学会 · 玩家', '教团 · 时序'],
    });
    steps = 0;
    lastAction = '等待首个合法动作';
    overTicks = 0;
  }

  function renderCurrent() {
    const view = engine.viewFor(pov);
    renderer.render(view, {
      demo: {
        enabled: true,
        seed,
        step: steps,
        speed,
        running,
        lastAction,
      },
    });
    updateControls(view);
    return view;
  }

  function updateControls(view) {
    if (!controlsRoot) return;
    const statusEl = controlsRoot.querySelector('[data-demo="status"]');
    const toggleEl = controlsRoot.querySelector('[data-demo="toggle"]');
    if (toggleEl) toggleEl.textContent = running ? '暂停' : '继续';
    if (!statusEl) return;
    const current = view?.current;
    const side = current === null || current === undefined ? '—' : current === pov ? '你' : '对手';
    const phase = view?.phase ?? '—';
    statusEl.textContent = `第 ${steps} 步 · 第 ${view?.night ?? 0} 夜 · ${phase} · 行动方 ${side} · 上次动作：${lastAction} · 种子 ${seed}`;
  }

  /**
   * buildView(pov) only hands the viewer their own legal actions.  To let both
   * sides act we ask buildView for the *acting* player's view when it is not
   * our turn (or when the opponent still has to mulligan).  That secondary
   * view is used solely to pick an action; the rendered view stays pov-only.
   */
  function actionViewFor(base) {
    if (base.phase === 'mulligan') {
      const done = asArray(base.mulliganDone);
      if (done[pov] === true && done[1 - pov] !== true) return engine.viewFor(1 - pov);
      return base;
    }
    if (base.phase === 'play' && (base.current === 0 || base.current === 1) && base.current !== pov) {
      return engine.viewFor(base.current);
    }
    return base;
  }

  function advanceOnce(doRender = true) {
    if (!engine || engine.phase === 'gameOver') return false;
    const view = engine.viewFor(pov);
    const decision = actionViewFor(view);
    const action = chooseDemoAction(decision, rng);
    if (!action) {
      lastAction = '无合法动作，演示暂停';
      if (doRender) renderCurrent();
      return false;
    }
    const outcome = engine.apply(action);
    if (!outcome.ok) {
      lastAction = `动作被拒绝：${outcome.error}`;
      if (doRender) renderCurrent();
      return false;
    }
    steps += 1;
    lastAction = decision === view ? (action.label || action.type) : publicActionLabel(action);
    const notable = asArray(outcome.events)
      .map((event) => EVENT_LABELS[event?.type])
      .filter(Boolean);
    if (notable.length) lastAction += ` [${[...new Set(notable)].join(' / ')}]`;
    if (doRender) renderCurrent();
    return true;
  }

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function tick() {
    if (engine.phase === 'gameOver') {
      overTicks += 1;
      if (overTicks >= 12) {
        newEngine();
        lastAction = '演示重开（相同固定种子）';
      }
      renderCurrent();
      return;
    }
    advanceOnce(true);
  }

  function startTimer() {
    clearTimer();
    if (running) timer = setInterval(tick, speed);
  }

  function pause() {
    running = false;
    clearTimer();
    renderCurrent();
  }

  function start() {
    if (running) return;
    running = true;
    renderCurrent();
    startTimer();
  }

  function step() {
    running = false;
    clearTimer();
    if (engine.phase === 'gameOver') newEngine();
    advanceOnce(true);
  }

  function fastForwardToMidgame() {
    if (engine.phase === 'gameOver') newEngine();
    let guard = 0;
    while (engine.night < 2 && engine.phase !== 'gameOver' && guard < 800) {
      if (!advanceOnce(false)) break;
      guard += 1;
    }
    lastAction = `快进至第 ${engine.night} 夜（${guard} 步）· ${lastAction}`;
    renderCurrent();
    return guard;
  }

  function restart() {
    newEngine();
    renderCurrent();
  }

  function setSpeed(nextSpeed) {
    if (!SPEED_OPTIONS.some((entry) => entry.value === nextSpeed)) return;
    speed = nextSpeed;
    const select = controlsRoot?.querySelector('[data-demo="speed"]');
    if (select) select.value = String(speed);
    startTimer();
    renderCurrent();
  }

  function onClick(event) {
    const button = event.target?.closest?.('[data-demo]');
    if (!button) return;
    switch (button.dataset.demo) {
      case 'toggle': if (running) pause(); else start(); break;
      case 'step': step(); break;
      case 'mid': fastForwardToMidgame(); break;
      case 'restart': restart(); break;
      default: break;
    }
  }

  function onChange(event) {
    if (event.target?.dataset?.demo !== 'speed') return;
    setSpeed(Number(event.target.value));
  }

  if (controlsRoot) {
    controlsRoot.addEventListener('click', onClick);
    controlsRoot.addEventListener('change', onChange);
  }

  function destroy() {
    clearTimer();
    running = false;
    if (controlsRoot) {
      controlsRoot.removeEventListener('click', onClick);
      controlsRoot.removeEventListener('change', onChange);
    }
  }

  newEngine();
  renderCurrent();

  return {
    start,
    resume: start,
    pause,
    step,
    fastForwardToMidgame,
    restart,
    setSpeed,
    destroy,
    getEngine: () => engine,
    getState: () => ({ seed, pov, steps, lastAction, running, speed, phase: engine.phase, night: engine.night }),
  };
}

export default createDemoController;
