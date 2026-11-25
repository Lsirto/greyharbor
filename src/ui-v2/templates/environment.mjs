/**
 * templates/environment.mjs — global environment row.  Pure string output.
 */

import { asArray, escapeHtml } from '../utils.mjs';
import { icon } from './icons.mjs';
import { renderCard } from './card.mjs';

export function renderEnvironmentRow(environments) {
  const cards = asArray(environments);
  const items = cards.map((entry) => renderCard(entry, { size: 'env' })).join('');

  return `<section class="gh2-env" data-env-count="${cards.length}">
    <h3 class="gh2-env__title">${icon('night')}<span>环境 · ENVIRONMENT</span><span class="gh2-env__count">${escapeHtml(cards.length)}</span></h3>
    <div class="gh2-env__cards">${items || '<span class="gh2-env__empty">本夜无环境卡</span>'}</div>
  </section>`;
}

export default renderEnvironmentRow;
