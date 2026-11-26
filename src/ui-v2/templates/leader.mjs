/**
 * templates/leader.mjs — off-board leader zone.  Pure string output.
 */

import { leaderAsCard, normalizeCardView } from '../card-view.mjs';
import { asObject, escapeHtml } from '../utils.mjs';
import { icon } from './icons.mjs';
import { renderCard } from './card.mjs';

export function renderLeaderZone(leader, options = {}) {
  const opts = asObject(options);
  const data = asObject(leader);
  const index = opts.playerIndex === 1 ? 1 : 0;
  const label = opts.label ?? (index === 0 ? '己方领袖' : '对手领袖');

  if (!leader || typeof leader !== 'object' || !data.nameZh && !data.name) {
    return `<section class="gh2-leader-zone" data-player="${index}">
      <h3 class="gh2-leader-zone__title">${escapeHtml(label)}</h3>
      <div class="gh2-leader-zone__empty">无领袖</div>
    </section>`;
  }

  const cardView = normalizeCardView(leaderAsCard(data));
  const used = data.usedThisNight === true;
  const sealed = cardView.sealed;
  const status = sealed ? '已被封印' : used ? '本夜已使用' : '本夜可用';
  const tone = sealed ? 'sealed' : used ? 'used' : 'ready';

  const portrait = asObject(opts.leaderPortrait);
  const cardOptions = { size: 'leader' };
  if (typeof portrait.src === 'string') {
    cardOptions.artSrc = portrait.src;
    if (portrait.filter) cardOptions.artFilter = portrait.filter;
  }

  return `<section class="gh2-leader-zone" data-player="${index}">
    <h3 class="gh2-leader-zone__title">${escapeHtml(label)}</h3>
    ${renderCard(leaderAsCard(data), cardOptions)}
    <div class="gh2-leader-zone__status gh2-leader-zone__status--${tone}">${icon(sealed ? 'seal' : 'crown')}${escapeHtml(status)}</div>
  </section>`;
}

export default renderLeaderZone;
