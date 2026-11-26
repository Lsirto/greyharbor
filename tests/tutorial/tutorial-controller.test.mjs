import test from 'node:test';
import assert from 'node:assert/strict';

import { createTutorialController } from '../../src/ui-v2/tutorial/tutorial-controller.mjs';
import { TUTORIAL_STEPS } from '../../src/ui-v2/tutorial/tutorial-steps.mjs';

/** Minimal fake DOM node: just enough surface for the tutorial controller. */
function makeNode() {
  const node = {
    className: '',
    innerHTML: '',
    dataset: {},
    offsetWidth: 10,
    parentNode: null,
    _bubbleHost: null,
    _listeners: {},
    classList: new Set(),
    children: [],
    appendChild(child) {
      child.parentNode = node;
      node.children.push(child);
      return child;
    },
    removeChild(child) {
      node.children = node.children.filter((c) => c !== child);
      child.parentNode = null;
    },
    querySelector(selector) {
      if (selector.includes('bubble-host')) return node._bubbleHost;
      return null;
    },
    addEventListener(type, fn) { node._listeners[type] = fn; },
    removeEventListener(type) { delete node._listeners[type]; },
  };
  node.classList.add = (c) => Set.prototype.add.call(node.classList, c);
  node.classList.remove = (c) => Set.prototype.delete.call(node.classList, c);
  return node;
}

function makeFakeDoc() {
  const listeners = { click: [], keydown: [] };
  const body = makeNode();
  const ringRegistry = {};
  const doc = {
    body,
    createElement() {
      const el = makeNode();
      el._bubbleHost = makeNode();
      return el;
    },
    querySelectorAll(selector) {
      if (!ringRegistry[selector]) ringRegistry[selector] = [];
      return ringRegistry[selector];
    },
    addEventListener(type, fn, capture) { listeners[type].push({ fn, capture }); },
    removeEventListener(type, fn) {
      listeners[type] = listeners[type].filter((entry) => entry.fn !== fn);
    },
  };
  return { doc, listeners, ringRegistry };
}

function fakeGame(phase = 'mulligan') {
  return {
    phase,
    getView() { return { phase: this.phase, night: 0, current: 0 }; },
    getUiState() { return { selectedUid: null, modal: null }; },
    destroy() { this.destroyed = true; },
  };
}

function clickEvent(closestResult) {
  const calls = { prevented: false, stopped: false };
  return {
    target: { closest: () => closestResult },
    preventDefault() { calls.prevented = true; },
    stopPropagation() { calls.stopped = true; },
    calls,
  };
}

function bubbleHostOf(doc) {
  return doc.body.children[0]._bubbleHost;
}

function pressBubble(doc, tut) {
  const handler = bubbleHostOf(doc)._listeners.click;
  handler({
    target: { closest: (sel) => (sel === '[data-tut]' ? { dataset: { tut } } : null) },
  });
}

test('controller mounts the overlay at step 0 and appends it to the body', () => {
  const { doc } = makeFakeDoc();
  const tutorial = createTutorialController({ document: doc, gameController: fakeGame() });
  assert.equal(tutorial.getStep(), 0);
  assert.equal(doc.body.children[0].className, 'gh2-tutorial');
  tutorial.destroy();
});

test('gate blocks a non-target click and allows the prompted target', () => {
  const { doc, listeners } = makeFakeDoc();
  const tutorial = createTutorialController({ document: doc, gameController: fakeGame() });
  const gate = listeners.click.find((l) => l.capture === true).fn;

  const blocked = clickEvent(null);
  gate(blocked);
  assert.equal(blocked.calls.prevented, true);
  assert.equal(blocked.calls.stopped, true);

  const allowed = clickEvent({});
  gate(allowed);
  assert.equal(allowed.calls.prevented, false);
  tutorial.destroy();
});

test('bubble "next" advances the step index', () => {
  const { doc } = makeFakeDoc();
  const tutorial = createTutorialController({ document: doc, gameController: fakeGame() });
  assert.equal(tutorial.getStep(), 0);
  pressBubble(doc, 'next');
  assert.equal(tutorial.getStep(), 1);
  pressBubble(doc, 'next');
  assert.equal(tutorial.getStep(), 2);
});

test('auto step advances itself once its wait condition is met', () => {
  const { doc } = makeFakeDoc();
  const game = fakeGame('play'); // phase already play satisfies PHASE_PLAY
  const tutorial = createTutorialController({ document: doc, gameController: game });

  pressBubble(doc, 'next'); // intro -> mulligan-mark
  pressBubble(doc, 'next'); // mulligan-mark -> auto step, which immediately advances
  assert.equal(tutorial.getState().stepId, TUTORIAL_STEPS[3].id);
});

test('skip invokes onExit and removes the overlay and listeners', () => {
  const { doc, listeners } = makeFakeDoc();
  let exited = 0;
  const tutorial = createTutorialController({
    document: doc,
    gameController: fakeGame(),
    onExit: () => { exited += 1; },
  });
  pressBubble(doc, 'skip');
  assert.equal(exited, 1);
  assert.equal(doc.body.children.length, 0);
  assert.equal(listeners.click.length, 0);
  assert.equal(listeners.keydown.length, 0);
});

test('finish "play" invokes onPlay', () => {
  const { doc } = makeFakeDoc();
  let played = 0;
  const tutorial = createTutorialController({
    document: doc,
    gameController: fakeGame('play'),
    onPlay: () => { played += 1; },
  });
  // Jump to the final step.
  for (let i = 0; i < TUTORIAL_STEPS.length - 1; i += 1) pressBubble(doc, 'next');
  assert.equal(tutorial.getState().stepId, TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id);
  pressBubble(doc, 'play');
  assert.equal(played, 1);
});

// Regression: the game-controller passes the display label '你'/'AI' (not a
// numeric seat). The tutorial used to compare who === 0, so the applied-action
// flags never set and the play/pass steps stalled after a real click.
function configurableGame() {
  return {
    phase: 'play',
    selectedUid: 'card-1',
    getView() { return { phase: this.phase, night: 0, current: 0 }; },
    getUiState() { return { selectedUid: this.selectedUid, modal: null }; },
    destroy() { this.destroyed = true; },
  };
}

function reachSlotStep(doc, game) {
  const tutorial = createTutorialController({ document: doc, gameController: game });
  pressBubble(doc, 'next'); // intro -> mulligan-mark
  pressBubble(doc, 'next'); // mulligan-mark -> mulligan-confirm (auto) -> locations
  pressBubble(doc, 'next'); // locations -> play-select (auto, selectedUid set) -> play-slot
  assert.equal(tutorial.getState().stepId, 'play-slot');
  return tutorial;
}

test("onEvents with the human label '你' advances the play step after paint", () => {
  const { doc } = makeFakeDoc();
  const tutorial = reachSlotStep(doc, configurableGame());

  // Mimic the real game-controller sequence: commit fires onEvents then paint.
  tutorial.hooks.onEvents({ who: '你', action: { type: 'playCard' } });
  tutorial.hooks.afterPaint();
  assert.equal(tutorial.getState().stepId, 'pass');
  tutorial.destroy();
});

test("onEvents with the human label '你' advances the pass step; 'AI' never does", () => {
  const { doc } = makeFakeDoc();
  const game = configurableGame();
  const tutorial = reachSlotStep(doc, game);

  // An AI action must not move the human play step.
  tutorial.hooks.onEvents({ who: 'AI', action: { type: 'playCard' } });
  tutorial.hooks.afterPaint();
  assert.equal(tutorial.getState().stepId, 'play-slot');

  // Human play moves to the pass step, then a human pass moves on to sanity.
  tutorial.hooks.onEvents({ who: '你', action: { type: 'playCard' } });
  tutorial.hooks.afterPaint();
  assert.equal(tutorial.getState().stepId, 'pass');
  tutorial.hooks.onEvents({ who: '你', action: { type: 'pass' } });
  tutorial.hooks.afterPaint();
  assert.equal(tutorial.getState().stepId, 'sanity');
  tutorial.destroy();
});
