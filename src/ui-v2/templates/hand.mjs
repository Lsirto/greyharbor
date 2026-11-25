/**
 * templates/hand.mjs — hand zones.
 *
 * Viewer's hand: real cards from the view.  Opponent's hand: ONLY the public
 * count — card names / uids are never emitted even if a malformed view leaks
 * a `hand` array into the opponent slot.
 */

import { asArray, asObject, escapeHtml, safeInt } from '../utils.mjs';
import { icon } from './icons.mjs';
import { renderCard, renderCardBack } from './card.mjs';

export function renderHandZone(options = {}) {
  const opts = asObject(options);
  const visible = opts.visible === true;
  const cards = asArray(opts.cards);
  const count = Math.max(0, safeInt(opts.count ?? cards.length, 0));
  const label = opts.label ?? (visible ? '己方手牌' : '对手手牌');
  const hint = opts.hint ?? (visible ? '理智 ≤3 时手牌显示疯狂面' : '仅公开数量');

  if (!visible) {
    const stack = renderCardBack({ size: 'xs' }) + renderCardBack({ size: 'xs' }) + renderCardBack({ size: 'xs' });
    return `<section class="gh2-hand gh2-hand--opponent" data-hand-visible="false" data-hand-count="${count}">
      <div class="gh2-hand__head"><h3>${escapeHtml(label)}</h3><span class="gh2-hand__hint">${escapeHtml(hint)}</span></div>
      <div class="gh2-hand__stack" aria-label="对手手牌 ${count} 张">${stack}<span class="gh2-hand__count">${icon('hand')}${escapeHtml(count)}</span></div>
    </section>`;
  }

  const items = cards.map((card) => renderCard(card, { size: 'hand' })).join('');
  return `<section class="gh2-hand gh2-hand--viewer" data-hand-visible="true" data-hand-count="${count}">
    <div class="gh2-hand__head"><h3>${escapeHtml(label)}</h3><span class="gh2-hand__hint">${escapeHtml(hint)}</span></div>
    <div class="gh2-hand__cards">${items || '<span class="gh2-hand__empty">手牌已空</span>'}</div>
  </section>`;
}

export default renderHandZone;
