/**
 * src/ui-v2/arena/templates/arena.mjs — pure HTML for the Arena Draft screen.
 *
 * No DOM access: the controller passes the draft state plus the current offers
 * and this returns one escaped HTML string. Candidate cards reuse the canonical
 * card art; labels come from the shared card-view dictionaries so the arena
 * never duplicates type / keyword / faction wording.
 */

import { ARENA_RULES, copiesOf, roundIndex } from '../../../arena/draft.mjs';
import { CARDS } from '../../../engine/v2/cards.js';
import { icon } from '../../templates/icons.mjs';
import { FACTIONS_ZH, KEYWORDS_ZH, TYPES_ZH } from '../../card-view.mjs';
import { escapeHtml } from '../../utils.mjs';

const UNIT_TYPES = new Set(['unit', 'oldgod']);

function renderPower(card) {
  if (!UNIT_TYPES.has(card.type)) return '';
  const reason = card.reasonPower == null ? '—' : card.reasonPower;
  const madness = card.madnessPower == null ? '—' : card.madnessPower;
  return `<span class="gh2-arena-card__power">
    <span>${icon('sun')}${escapeHtml(reason)}</span>
    <span>${icon('moon')}${escapeHtml(madness)}</span>
  </span>`;
}

function renderCost(card) {
  if (!(card.sanityCost > 0)) return '';
  return `<span class="gh2-arena-card__cost" title="理智代价">${icon('eye')}${escapeHtml(card.sanityCost)}</span>`;
}

function renderKeywords(card) {
  if (!card.keywords.length) return '';
  const badges = card.keywords
    .map((id) => `<span>${icon(id)}${escapeHtml(KEYWORDS_ZH[id] ?? id)}</span>`)
    .join('');
  return `<span class="gh2-arena-card__kw">${badges}</span>`;
}

function renderCandidate(cardId, owned) {
  const card = CARDS[cardId];
  if (!card) return '';
  const willMax = owned + 1 >= ARENA_RULES.maxCopies;
  const ownedTag = owned > 0
    ? `<span class="gh2-arena-card__owned">已选 ×${escapeHtml(owned)}</span>`
    : '';
  return `<button type="button" class="gh2-arena-card gh2-arena-card--${escapeHtml(card.faction)}"
      data-arena-pick="${escapeHtml(cardId)}">
    <span class="gh2-arena-card__media">
      <img class="gh2-arena-card__img" src="./assets/art/${encodeURIComponent(cardId)}.jpg"
        alt="" onerror="this.style.display='none'">
      ${ownedTag}
    </span>
    <span class="gh2-arena-card__name">${escapeHtml(card.nameZh)}</span>
    <span class="gh2-arena-card__meta">
      <span class="gh2-arena-card__type">${escapeHtml(TYPES_ZH[card.type] ?? card.type)}</span>
      ${renderCost(card)}
    </span>
    ${renderPower(card)}
    ${renderKeywords(card)}
    <span class="gh2-arena-card__hint">${willMax ? '选后达到份数上限' : '点击加入牌组'}</span>
  </button>`;
}

function renderTray(draft) {
  const counts = new Map();
  for (const id of draft.picks) counts.set(id, (counts.get(id) ?? 0) + 1);
  const items = [...counts.entries()]
    .map(([id, n]) => `<li class="gh2-arena-tray__item">
      <span>${escapeHtml(CARDS[id]?.nameZh ?? id)}</span><b>×${escapeHtml(n)}</b>
    </li>`)
    .join('');
  return `<div class="gh2-arena-tray">
    <h3 class="gh2-arena-tray__title">已选牌组
      <small>${escapeHtml(draft.picks.length)} / ${escapeHtml(ARENA_RULES.deckSize)}</small>
    </h3>
    <ul class="gh2-arena-tray__list">${items || '<li class="gh2-arena-tray__empty">尚未选择卡牌</li>'}</ul>
  </div>`;
}

/**
 * @param {object} draft current draft state
 * @param {{offers?: string[], leaderName?: string}} options
 */
export function renderArenaScreen(draft, options = {}) {
  const opts = options && typeof options === 'object' ? options : {};
  const offers = Array.isArray(opts.offers) ? opts.offers : [];
  const round = Math.min(roundIndex(draft) + 1, ARENA_RULES.deckSize);
  const pct = Math.round((draft.picks.length / ARENA_RULES.deckSize) * 100);
  const leaderLine = opts.leaderName ? `以 ${escapeHtml(opts.leaderName)} 出战 · ` : '';
  const cards = offers
    .map((id) => renderCandidate(id, copiesOf(draft, id)))
    .join('');
  return `<section class="gh2-arena" aria-label="竞技场选牌">
    <header class="gh2-arena__head">
      <button type="button" class="gh2-back-btn" data-arena-exit>← 返回主菜单</button>
      <div class="gh2-arena__heading">
        <h2>竞技场选牌</h2>
        <p>${leaderLine}${escapeHtml(FACTIONS_ZH[draft.faction] ?? draft.faction)}
          · 第 ${escapeHtml(round)} / ${escapeHtml(ARENA_RULES.deckSize)} 轮
          · 三选一，单卡最多 ${escapeHtml(ARENA_RULES.maxCopies)} 份</p>
      </div>
    </header>
    <div class="gh2-arena__progress" aria-hidden="true"><span style="width:${escapeHtml(pct)}%"></span></div>
    <div class="gh2-arena__choices">${cards}</div>
    ${renderTray(draft)}
  </section>`;
}

export default renderArenaScreen;
