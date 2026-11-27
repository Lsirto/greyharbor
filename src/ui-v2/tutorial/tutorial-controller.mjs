/**
 * src/ui-v2/tutorial/tutorial-controller.mjs — interactive onboarding driver.
 *
 * Wraps a fixed-seed game-controller and adds a coach-mark layer (dim + bubble)
 * plus capture-phase input gating so the player can only touch the element the
 * current step asks for. Advancement is decided purely from buildView / getUiState
 * and the applied-action flags — never from hidden state. DOM access goes through
 * the injected document/roots so the whole controller is headless-testable.
 */

import { createGameController } from '../game-controller.mjs';
import { asObject } from '../utils.mjs';
import {
  TUTORIAL_STEPS, TUTORIAL_SEED, TUTORIAL_DECK, TARGET_SELECTORS,
  buildTutorialSnapshot, conditionMet,
} from './tutorial-steps.mjs';
import { renderCoachBubble, renderTutorialOverlay } from './coach-mark.mjs';

export function createTutorialController(options = {}) {
  const opts = asObject(options);
  const doc = opts.document ?? (typeof document !== 'undefined' ? document : null);
  if (!doc || typeof doc.addEventListener !== 'function') {
    throw new TypeError('createTutorialController needs a document (real or injected)');
  }
  const schedule = opts.schedule ?? ((fn) => setTimeout(fn, 0));
  const cancelScheduled = opts.cancel ?? ((token) => clearTimeout(token));

  const boardRoot = opts.boardRoot ?? null;
  const controlsRoot = opts.controlsRoot ?? null;
  const parent = opts.parent ?? doc.body;

  // Applied-action flags, set from the game-controller onEvents hook.
  let humanPlayed = false;
  let humanPassed = false;
  let stepIndex = 0;
  let destroyed = false;

  const outerHooks = asObject(opts.hooks);
  const tutorialHooks = {
    ...outerHooks,
    onEvents(payload) {
      try { outerHooks.onEvents?.(payload); } catch (_) { /* outer hooks never block tutorial */ }
      // The game-controller currently passes the display label ('你' / 'AI')
      // rather than a seat number; accept both so the flag does not depend on
      // the localised label.
      const isHuman = payload?.who === 0 || payload?.who === '你';
      if (isHuman) {
        if (payload.action?.type === 'playCard') humanPlayed = true;
        if (payload.action?.type === 'pass') humanPassed = true;
      }
    },
    afterPaint(payload) {
      try { outerHooks.afterPaint?.(payload); } catch (_) { /* ignore */ }
      sync();
    },
  };

  const ownsGame = typeof opts.gameController === 'object' && opts.gameController !== null;
  const game = ownsGame
    ? opts.gameController
    : createGameController({
        boardRoot,
        controlsRoot,
        baseSeed: TUTORIAL_SEED,
        matchConfig: { humanFaction: 'society', seedMode: 'fixed', baseSeed: TUTORIAL_SEED },
        battleOptions: {
          seed: TUTORIAL_SEED,
          decks: [TUTORIAL_DECK.human, TUTORIAL_DECK.ai],
          // 固定种子下首夜会抽到「无风之夜」，禁用环境牌会让本教程的
          // 环境牌实操无法进行；教程不讲解异常机制，故在教学局关闭它。
          mechanics: { anomaly: false },
        },
        aiDelay: opts.aiDelay,
        schedule,
        cancel: cancelScheduled,
        hooks: tutorialHooks,
      });

  // ── coach-mark overlay ─────────────────────────────────────────────
  const overlay = doc.createElement('div');
  overlay.className = 'gh2-tutorial';
  overlay.innerHTML = renderTutorialOverlay();
  parent.appendChild(overlay);
  const bubbleHost = overlay.querySelector('[data-tut="bubble-host"]');

  function currentStep() {
    return TUTORIAL_STEPS[stepIndex];
  }

  function clearRings() {
    doc.querySelectorAll('.gh2-tut-target').forEach((el) =>
      el.classList.remove('gh2-tut-target'));
  }

  function applyRings(selectors) {
    for (const selector of selectors) {
      doc.querySelectorAll(selector).forEach((el) =>
        el.classList.add('gh2-tut-target'));
    }
  }

  function renderBubble() {
    bubbleHost.innerHTML = renderCoachBubble(currentStep(), stepIndex, TUTORIAL_STEPS.length);
  }

  function goToStep(next) {
    humanPlayed = false;
    humanPassed = false;
    stepIndex = next;
    sync();
  }

  function sync() {
    if (destroyed) return;
    const step = currentStep();
    clearRings();
    const selectors = TARGET_SELECTORS[step.target] ?? [];
    applyRings(selectors);
    renderBubble();

    if (step.advance === 'auto') {
      const snapshot = buildTutorialSnapshot(game.getView(), game.getUiState());
      const met = conditionMet(step.wait, snapshot, { humanPlayed, humanPassed });
      if (met && stepIndex + 1 < TUTORIAL_STEPS.length) goToStep(stepIndex + 1);
    }
  }

  // ── input gate (capture phase) ─────────────────────────────────────
  function gateClick(event) {
    if (destroyed) return;
    const target = event.target;
    // Anything inside the bubble is handled by the bubble's own listener.
    if (target.closest && target.closest('.gh2-tut-bubble')) return;

    const selectors = TARGET_SELECTORS[currentStep().target] ?? [];
    let allowed = false;
    for (const selector of selectors) {
      if (target.closest && target.closest(selector)) { allowed = true; break; }
    }
    if (!allowed) {
      event.preventDefault();
      event.stopPropagation();
      const bubble = bubbleHost.querySelector('.gh2-tut-bubble');
      if (bubble) {
        bubble.classList.remove('gh2-tut-bubble--nudge');
        void bubble.offsetWidth;
        bubble.classList.add('gh2-tut-bubble--nudge');
      }
    }
  }

  function gateKey(event) {
    // Keep the controller's Escape-cancel from changing state during onboarding.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function bubbleClick(event) {
    const button = event.target.closest && event.target.closest('[data-tut]');
    if (!button) return;
    const kind = button.dataset.tut;
    if (kind === 'next') {
      if (stepIndex + 1 < TUTORIAL_STEPS.length) goToStep(stepIndex + 1);
    } else if (kind === 'play') {
      finishWith(opts.onPlay);
    } else if (kind === 'menu' || kind === 'skip') {
      finishWith(opts.onExit);
    }
  }

  function finishWith(callback) {
    const cb = typeof callback === 'function' ? callback : null;
    destroy();
    if (cb) cb();
  }

  doc.addEventListener('click', gateClick, true);
  doc.addEventListener('keydown', gateKey, true);
  bubbleHost.addEventListener('click', bubbleClick);

  // The game-controller's first afterPaint already ran sync() during its
  // construction (overlay existed first), but run it once to be certain.
  sync();

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    doc.removeEventListener('click', gateClick, true);
    doc.removeEventListener('keydown', gateKey, true);
    bubbleHost.removeEventListener('click', bubbleClick);
    if (!ownsGame && typeof game.destroy === 'function') game.destroy();
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  return {
    destroy,
    // Exposed so external drivers and tests can feed the same hooks the
    // game-controller calls (onEvents / afterPaint).
    hooks: tutorialHooks,
    getStep: () => stepIndex,
    getState: () => ({
      stepIndex,
      stepId: currentStep().id,
      humanPlayed,
      humanPassed,
      destroyed,
    }),
  };
}

export default createTutorialController;
