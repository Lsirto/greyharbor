import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TARGETS, WAITS, TARGET_SELECTORS, TUTORIAL_STEPS, TUTORIAL_SEED,
  buildTutorialSnapshot, conditionMet,
} from '../../src/ui-v2/tutorial/tutorial-steps.mjs';
import { renderCoachBubble, renderTutorialOverlay } from '../../src/ui-v2/tutorial/coach-mark.mjs';

test('tutorial steps are well-formed and have unique ids', () => {
  assert.ok(TUTORIAL_STEPS.length >= 8);
  const ids = TUTORIAL_STEPS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  const targetValues = new Set(Object.values(TARGETS));
  for (const step of TUTORIAL_STEPS) {
    assert.ok(targetValues.has(step.target), `${step.id} has valid target`);
    assert.ok(['continue', 'auto', 'finish'].includes(step.advance));
    assert.equal(typeof step.title, 'string');
    assert.equal(typeof step.body, 'string');
    if (step.advance === 'auto') assert.ok(Object.values(WAITS).includes(step.wait));
  }
  assert.equal(typeof TUTORIAL_SEED, 'string');
});

test('target selectors cover every target role', () => {
  for (const role of Object.values(TARGETS)) {
    assert.ok(Array.isArray(TARGET_SELECTORS[role]));
  }
});

test('snapshot normalises malformed inputs without throwing', () => {
  const snap = buildTutorialSnapshot(null, null);
  assert.equal(snap.phase, null);
  assert.equal(snap.modalKind, null);
  const snap2 = buildTutorialSnapshot(
    { phase: 'play', night: 1, current: 0 },
    { modal: { kind: 'facedown' } },
  );
  assert.equal(snap2.phase, 'play');
  assert.equal(snap2.modalKind, 'facedown');
});

test('conditionMet evaluates each wait from pure inputs', () => {
  assert.equal(conditionMet(WAITS.PHASE_PLAY, { phase: 'play' }, {}), true);
  assert.equal(conditionMet(WAITS.PHASE_PLAY, { phase: 'mulligan' }, {}), false);
  assert.equal(conditionMet(WAITS.HUMAN_PLAY, {}, { humanPlayed: true }), true);
  assert.equal(conditionMet(WAITS.HUMAN_PASS, {}, { humanPassed: true }), true);
  assert.equal(conditionMet(WAITS.HUMAN_PASS, {}, { humanPassed: false }), false);
  assert.equal(conditionMet('unknown', {}, {}), false);
});

test('coach bubble renders the right controls per advance type and escapes text', () => {
  const auto = TUTORIAL_STEPS.find((s) => s.advance === 'auto');
  const autoHtml = renderCoachBubble(auto, 5, TUTORIAL_STEPS.length);
  assert.ok(autoHtml.includes('自动继续'));
  assert.ok(!autoHtml.includes('data-tut="next"'));

  const cont = TUTORIAL_STEPS.find((s) => s.advance === 'continue');
  assert.ok(renderCoachBubble(cont, 0, TUTORIAL_STEPS.length).includes('data-tut="next"'));

  const finish = TUTORIAL_STEPS.find((s) => s.advance === 'finish');
  const finishHtml = renderCoachBubble(finish, TUTORIAL_STEPS.length - 1, TUTORIAL_STEPS.length);
  assert.ok(finishHtml.includes('data-tut="play"'));
  assert.ok(finishHtml.includes('data-tut="menu"'));

  const nasty = { id: 'x', title: '<b>x</b>', body: 'a & b', target: 'none', advance: 'continue' };
  const html = renderCoachBubble(nasty, 0, 1);
  assert.ok(html.includes('&lt;b&gt;'));
  assert.ok(html.includes('a &amp; b'));
  assert.ok(!html.includes('<b>x</b>'));
});

test('every bubble exposes a skip link and the overlay provides hosts', () => {
  const html = renderCoachBubble(TUTORIAL_STEPS[0], 0, TUTORIAL_STEPS.length);
  assert.ok(html.includes('data-tut="skip"'));
  const overlay = renderTutorialOverlay();
  assert.ok(overlay.includes('gh2-tut-dim'));
  assert.ok(overlay.includes('data-tut="bubble-host"'));
});
