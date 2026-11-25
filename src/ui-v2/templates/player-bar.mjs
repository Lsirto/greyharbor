/**
 * templates/player-bar.mjs — one player's information strip.
 * Reads only view.player-shaped data; no engine imports, no DOM.
 */

import { FACTIONS_ZH } from '../card-view.mjs';
import { asObject, escapeHtml, safeInt } from '../utils.mjs';

import { icon } from './icons.mjs';
import { renderSanityMeter } from './sanity.mjs';

function pile(label, kind, count) {
  return `<span class="gh2-pile" title="${escapeHtml(label)}">${icon(kind)}<span class="gh2-pile__num">${escapeHtml(Math.max(0, safeInt(count, 0)))}</span></span>`;
}

export function renderPlayerBar(player, options = {}) {
  const opts = asObject(options);
  const data = asObject(player);
  const name = typeof data.name === 'string' && data.name ? data.name : `P${safeInt(data.id, 0)}`;
  const faction = typeof data.faction === 'string' ? data.faction : 'neutral';
  const factionText = FACTIONS_ZH[faction] ?? faction;
  const role = opts.role ?? '玩家';
  const score = data.score && typeof data.score === 'object'
    ? safeInt(data.score.total, 0)
    : safeInt(opts.score, 0);
  const nightWins = Math.max(0, safeInt(data.nightWins, 0));
  const current = opts.current === true;
  const passed = opts.passed === true;
  const leaderName = data.leader
    ? (data.leader.nameZh || data.leader.name || '')
    : '';

  return `<div class="gh2-player-bar${current ? ' is-current' : ''}${passed ? ' is-passed' : ''}" data-player="${escapeHtml(safeInt(data.id, 0))}">
    <div class="gh2-player-bar__identity">
      <span class="gh2-player-bar__role">${escapeHtml(role)}</span>
      <span class="gh2-player-bar__name">${escapeHtml(name)}</span>
      <span class="gh2-player-bar__faction gh2-faction--${escapeHtml(faction)}">${escapeHtml(factionText)}</span>
      ${leaderName ? `<span class="gh2-player-bar__leader">${icon('crown')}${escapeHtml(leaderName)}</span>` : ''}
      ${passed ? '<span class="gh2-player-bar__pass">已过牌 · PASSED</span>' : ''}
    </div>
    <div class="gh2-player-bar__resources">
      ${pile('手牌', 'hand', opts.handCount ?? data.handCount)}
      ${pile('牌堆', 'deck', data.deckCount)}
      <span class="gh2-player-bar__wins" title="夜胜场">${icon('moon')}<span>${escapeHtml(nightWins)} 胜</span></span>
      ${renderSanityMeter(data.sanity, { compact: true })}
    </div>
    <div class="gh2-player-bar__score" aria-label="当前夜分">
      <span class="gh2-player-bar__score-label">夜分 SCORE</span>
      <span class="gh2-player-bar__score-value">${escapeHtml(score)}</span>
    </div>
  </div>`;
}

export default renderPlayerBar;
