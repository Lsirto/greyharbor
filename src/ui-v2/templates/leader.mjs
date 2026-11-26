/**
 * templates/leader.mjs — compact horizontal leader strip.
 * A single row: small portrait + name + one Chinese status pill.
 * Pure string output; no engine imports.
 */

import { asObject, escapeHtml } from '../utils.mjs';
import { icon } from './icons.mjs';

export function renderLeaderZone(leader, options = {}) {
  const opts = asObject(options);
  const data = asObject(leader);
  const index = opts.playerIndex === 1 ? 1 : 0;
  const label = opts.label ?? (index === 0 ? '己方领袖' : '对手领袖');

  if (!leader || typeof leader !== 'object' || (!data.nameZh && !data.name)) {
    return `<section class="gh2-leader-zone" data-player="${index}">
      <span class="gh2-leader-zone__title">${escapeHtml(label)}</span>
      <div class="gh2-leader-zone__empty">无领袖</div>
    </section>`;
  }

  const name = data.nameZh || data.name;
  const used = data.usedThisNight === true;
  const sealed = data.sealed === true;
  const status = sealed ? '已被封印' : used ? '本夜已使用' : '本夜可用';
  const tone = sealed ? 'sealed' : used ? 'used' : 'ready';

  const portrait = asObject(opts.leaderPortrait);
  const portraitHtml = typeof portrait.src === 'string'
    ? `<img class="gh2-leader-zone__portrait-img" src="${escapeHtml(portrait.src)}"${portrait.filter ? ` style="filter:${escapeHtml(portrait.filter)}"` : ''} alt="" onerror="this.style.display='none'">`
    : `<span class="gh2-leader-zone__portrait-mark">${icon('crown')}</span>`;

  return `<section class="gh2-leader-zone gh2-leader-zone--${tone}" data-player="${index}">
    <span class="gh2-leader-zone__portrait">${portraitHtml}</span>
    <span class="gh2-leader-zone__info">
      <span class="gh2-leader-zone__name">${escapeHtml(name)}</span>
      <span class="gh2-leader-zone__status gh2-leader-zone__status--${tone}">${icon(sealed ? 'seal' : 'crown')}${escapeHtml(status)}</span>
    </span>
  </section>`;
}

export default renderLeaderZone;
