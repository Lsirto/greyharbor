/**
 * src/ui-v2/campaign/templates/event.mjs — pure template for a narrative event.
 *
 * Availability is computed by the controller (one boolean per choice) so the
 * template stays free of run-state imports. Legal choices carry
 * data-event-choice; unmet-condition choices are rendered disabled.
 */

import { escapeHtml } from '../../utils.mjs';

export function renderEventScreen(run, event, availability = []) {
  const choices = event.choices.map((choice, index) => {
    const enabled = availability[index] !== false;
    const attr = enabled ? ` data-event-choice="${index}" role="button" tabindex="0"` : ' aria-disabled="true"';
    return `<li class="gh2-cevent-choice${enabled ? '' : ' is-disabled'}"${attr}>
      ${escapeHtml(choice.label)}
    </li>`;
  }).join('');

  return `<section class="gh2-cevent" aria-label="叙事事件">
    <header class="gh2-cevent-head">
      <span class="gh2-cevent-kicker">叙事事件</span>
      <h2>${escapeHtml(event.title)}</h2>
    </header>
    <p class="gh2-cevent-flavor">${escapeHtml(event.flavor)}</p>
    <ul class="gh2-cevent-choices">${choices}</ul>
  </section>`;
}

export default renderEventScreen;
