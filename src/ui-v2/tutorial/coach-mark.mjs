/**
 * src/ui-v2/tutorial/coach-mark.mjs — pure template for the tutorial bubble.
 *
 * The dim layer and target ring are static elements; this template renders the
 * instruction bubble with the step counter and the appropriate buttons. All
 * interpolated text is HTML-escaped.
 */

import { escapeHtml } from '../utils.mjs';

function bubbleButtons(step, index, total) {
  const progress = `第 ${index + 1} / ${total} 步`;

  if (step.advance === 'finish') {
    return `<div class="gh2-tut-bubble__foot">
      <span class="gh2-tut-bubble__progress">${escapeHtml(progress)}</span>
      <span class="gh2-tut-bubble__actions">
        <button type="button" class="gh2-tut-btn gh2-tut-btn--primary" data-tut="play">开始对局</button>
        <button type="button" class="gh2-tut-btn" data-tut="menu">返回菜单</button>
      </span>
    </div>`;
  }

  if (step.advance === 'continue') {
    return `<div class="gh2-tut-bubble__foot">
      <span class="gh2-tut-bubble__progress">${escapeHtml(progress)}</span>
      <span class="gh2-tut-bubble__actions">
        <button type="button" class="gh2-tut-btn gh2-tut-btn--primary" data-tut="next">继续</button>
      </span>
    </div>`;
  }

  // Auto step: no continue button; show the counter and a hint that it advances
  // once the prompted action is done.
  return `<div class="gh2-tut-bubble__foot">
    <span class="gh2-tut-bubble__progress">${escapeHtml(progress)}</span>
    <span class="gh2-tut-bubble__hint">完成上面的操作后自动继续</span>
  </div>`;
}

/**
 * @param {object} step current step definition
 * @param {number} index current step index
 * @param {number} total total step count
 */
export function renderCoachBubble(step, index, total) {
  return `<div class="gh2-tut-bubble" role="dialog" aria-modal="false" aria-labelledby="gh2-tut-title">
    <h3 class="gh2-tut-bubble__title" id="gh2-tut-title">${escapeHtml(step.title)}</h3>
    <p class="gh2-tut-bubble__body">${escapeHtml(step.body)}</p>
    ${bubbleButtons(step, index, total)}
    <button type="button" class="gh2-tut-bubble__skip" data-tut="skip" title="跳过教程">跳过教程</button>
  </div>`;
}

/** Static wrapper: dim layer + target ring host + bubble host. */
export function renderTutorialOverlay() {
  return `<div class="gh2-tut-dim" aria-hidden="true"></div>
    <div class="gh2-tut-bubble-host" data-tut="bubble-host"></div>`;
}

export default renderCoachBubble;
