/**
 * src/ui-v2/codex/templates/codex.mjs — pure HTML for the card codex.
 *
 * Renders the filter bars (faction / type / location + text search), the result
 * count and a grid of detailed codex cards straight from the canonical CARDS
 * table.  No DOM access, no event handlers; the controller wires the data-*
 * attributes.
 */

import { escapeHtml } from '../../utils.mjs';
import { icon } from '../../templates/icons.mjs';
import { isDefaultFilters } from '../../../codex/codex.mjs';
import {
  FACTIONS_ZH,
  KEYWORDS_ZH,
  LOCATIONS_ZH,
  TYPES_ZH,
} from '../../card-view.mjs';

const FACTION_LABELS = { all: '全部', ...FACTIONS_ZH };
const TYPE_LABELS = {
  all: '全部',
  unit: '单位',
  event: TYPES_ZH.event,
  ritual: TYPES_ZH.ritual,
  equipment: TYPES_ZH.equipment,
  location: TYPES_ZH.location,
  environment: TYPES_ZH.environment,
  leader: TYPES_ZH.leader,
};
const LOCATION_LABELS = { all: '全部', ...LOCATIONS_ZH };

function filterButton(dim, value, label, active) {
  return `<button type="button" class="gh2-codex-chip${active ? ' is-selected' : ''}"
    data-codex="filter" data-dim="${escapeHtml(dim)}" data-value="${escapeHtml(value)}"
    aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(label)}</button>`;
}

function filterGroup(dim, options, labels, current) {
  return `<div class="gh2-codex-row" role="group" aria-label="${escapeHtml(dim)}">
    ${options.map((value) => filterButton(dim, value, labels[value] ?? value, current === value)).join('')}
  </div>`;
}

function keywordLabel(id) {
  return KEYWORDS_ZH[id] ?? id;
}

function renderCodexCard(card) {
  const isUnit = card.type === 'unit' || card.type === 'oldgod';
  const cost = card.sanityCost > 0
    ? `<span class="gh2-codex-card__cost" title="理智代价">${icon('eye')}${escapeHtml(card.sanityCost)}</span>`
    : '';
  const power = isUnit
    ? `<span class="gh2-codex-card__power" title="战力">${icon('sword')}${escapeHtml(card.reasonPower ?? 0)}</span>`
    : '';
  const printed = isUnit
    ? `<div class="gh2-codex-card__printed">
        <span>${icon('sun')}理 ${escapeHtml(card.reasonPower ?? '—')}</span>
        <span>${icon('moon')}狂 ${escapeHtml(card.madnessPower ?? '—')}</span>
      </div>`
    : '';
  const keywords = Array.isArray(card.keywords) && card.keywords.length
    ? `<div class="gh2-codex-card__keywords">${card.keywords
      .map((id) => `<span class="gh2-codex-card__keyword">${escapeHtml(keywordLabel(id))}</span>`)
      .join('')}</div>`
    : '';
  const effect = card.effect
    ? `<p class="gh2-codex-card__effect">${escapeHtml(card.effect)}</p>`
    : '';
  const flavor = card.flavor
    ? `<p class="gh2-codex-card__flavor">${escapeHtml(card.flavor)}</p>`
    : '';
  const locationLabel = card.location ? (LOCATIONS_ZH[card.location] ?? card.location) : '';

  return `<article class="gh2-codex-card gh2-card--faction-${escapeHtml(card.faction)}" data-card-id="${escapeHtml(card.id)}">
    <div class="gh2-codex-card__top">
      ${power}
      ${cost}
    </div>
    <div class="gh2-codex-card__art">
      <img src="./assets/art/${encodeURIComponent(card.id)}.jpg" alt="" loading="lazy" onerror="this.style.display='none'">
    </div>
    <div class="gh2-codex-card__head">
      <span class="gh2-codex-card__name-zh">${escapeHtml(card.nameZh)}</span>
    </div>
    <div class="gh2-codex-card__tags">
      <span class="gh2-codex-card__tag">${escapeHtml(FACTION_LABELS[card.faction] ?? card.faction)}</span>
      <span class="gh2-codex-card__tag">${escapeHtml(TYPES_ZH[card.type] ?? card.type)}</span>
      ${locationLabel ? `<span class="gh2-codex-card__tag">${escapeHtml(locationLabel)}</span>` : ''}
      <span class="gh2-codex-card__tag">×${escapeHtml(card.copies ?? 1)}</span>
    </div>
    ${printed}
    ${keywords}
    ${effect}
    ${flavor}
  </article>`;
}

/**
 * Dynamic region only: the meta line + grid/empty state.  The controller swaps
 * this on every keystroke so the search input (and focus/IME) is never rebuilt.
 */
export function renderCodexResults(view) {
  const { filters, cards, total, shown } = view;
  const isNarrowed = !isDefaultFilters(filters);
  const body = cards.length
    ? `<div class="gh2-codex-grid">${cards.map(renderCodexCard).join('')}</div>`
    : `<div class="gh2-codex-empty">
        <span class="gh2-codex-empty__icon">${icon('deck')}</span>
        <p>没有符合条件的卡牌</p>
        <button type="button" class="gh2-codex-chip" data-codex="reset">清除筛选</button>
      </div>`;

  return `<div class="gh2-codex__meta">
      <span>显示 ${escapeHtml(shown)} / 共 ${escapeHtml(total)} 张</span>
      ${isNarrowed ? `<button type="button" class="gh2-codex-chip" data-codex="reset">清除筛选</button>` : ''}
    </div>
    ${body}`;
}

export function renderCodex(view) {
  const { filters } = view;

  return `<div class="gh2-codex">
    <header class="gh2-codex__header">
      <button type="button" class="gh2-codex-back" data-codex="exit">${icon('back')}<span>返回</span></button>
      <h2 class="gh2-codex__title">卡牌图鉴</h2>
    </header>
    <div class="gh2-codex__filters">
      <div class="gh2-codex-search">
        ${icon('eye')}
        <input type="search" class="gh2-codex-search__input" data-codex="search"
          value="${escapeHtml(filters.query ?? '')}" placeholder="搜索卡牌名称或效果" aria-label="搜索卡牌">
      </div>
      ${filterGroup('faction', ['all', 'society', 'cult', 'neutral'], FACTION_LABELS, filters.faction)}
      ${filterGroup('type', ['all', 'unit', 'event', 'ritual', 'equipment', 'location', 'environment', 'leader'], TYPE_LABELS, filters.type)}
      ${filterGroup('location', ['all', 'scene', 'archive', 'dream'], LOCATION_LABELS, filters.location)}
    </div>
    <div data-role="codex-results">${renderCodexResults(view)}</div>
  </div>`;
}

export default renderCodex;
