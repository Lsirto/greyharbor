/**
 * templates/card.mjs — pure HTML template for a single card.
 *
 * Input: a buildView() card fragment (or a minimal object in tests).
 * Output: an HTML string.  No DOM access, no event handlers, no engine imports.
 */

import {
  cardClasses,
  displayPower,
  isUnitType,
  keywordBadges,
  normalizeCardView,
  statusBadges,
  typeLabel,
} from '../card-view.mjs';
import { asObject, escapeHtml } from '../utils.mjs';
import { hasIcon, icon } from './icons.mjs';

function keywordIcon(id) {
  return hasIcon(id) ? icon(id) : icon('corruption');
}

function renderPrintedPower(view) {
  if (view.reasonPower == null && view.madnessPower == null) return '';
  const reason = view.reasonPower == null ? '—' : view.reasonPower;
  const madness = view.madnessPower == null ? '—' : view.madnessPower;
  return `<div class="gh2-card__printed" aria-label="双面基础战力">
    <span class="gh2-card__printed-face gh2-card__printed-face--reason">${icon('sun')}理 ${escapeHtml(reason)}</span>
    <span class="gh2-card__printed-face gh2-card__printed-face--madness">${icon('moon')}狂 ${escapeHtml(madness)}</span>
  </div>`;
}

function renderPower(view) {
  if (!isUnitType(view.type)) {
    return `<div class="gh2-card__power gh2-card__power--none" aria-label="非单位卡无战力">${escapeHtml(typeLabel(view))}</div>`;
  }
  return `<div class="gh2-card__power" aria-label="当前战力 ${escapeHtml(displayPower(view))}">
    ${icon('sword')}<span class="gh2-card__power-value">${escapeHtml(displayPower(view))}</span>
  </div>`;
}

function renderKeywords(view) {
  const badges = keywordBadges(view);
  if (!badges.length) return '';
  return `<div class="gh2-card__keywords">${badges.map((entry) =>
    `<span class="gh2-keyword" data-keyword="${escapeHtml(entry.id)}" title="${escapeHtml(entry.label)}">${keywordIcon(entry.id)}<span>${escapeHtml(entry.label)}</span></span>`,
  ).join('')}</div>`;
}

function renderStatuses(view) {
  const badges = statusBadges(view);
  if (!badges.length) return '';
  return `<div class="gh2-card__statuses">${badges.map((entry) =>
    `<span class="gh2-status gh2-status--${escapeHtml(entry.id)}">${icon(entry.icon)}<span>${escapeHtml(entry.label)}</span></span>`,
  ).join('')}</div>`;
}

/** The one and only face-down rendering: no uid, name, power or keywords. */
export function renderCardBack(options = {}) {
  const size = asObject(options).size;
  const safeSize = ['xs', 'sm', 'board', 'env', 'hand', 'leader'].includes(size) ? size : 'board';
  return `<div class="gh2-card gh2-card--hidden gh2-card--back gh2-card--size-${safeSize}" data-hidden="true" aria-label="盖牌" role="img">
    <div class="gh2-card__back-frame">
      <div class="gh2-card__back-sigil">${icon('back')}</div>
      <span class="gh2-card__back-label">盖牌 · FACE DOWN</span>
    </div>
  </div>`;
}

export function renderCard(card, options = {}) {
  const opts = asObject(options);
  const view = normalizeCardView(card, opts);
  if (view.hidden) return renderCardBack(opts);

  const classes = cardClasses(view, opts).join(' ');
  const nameZh = view.nameZh || view.name || '未知卡牌';
  const nameEn = view.name || view.nameZh;
  const slotAttr = view.slot === null ? '' : ` data-slot="${escapeHtml(view.slot)}"`;
  const costBadge = view.sanityCost > 0
    ? `<span class="gh2-card__cost" title="理智代价">${icon('eye')}${escapeHtml(view.sanityCost)}</span>`
    : '';
  const artIcon = hasIcon(`art-${view.type}`) ? icon(`art-${view.type}`) : icon('art-unit');
  const locationTag = view.boardLocation && view.slot !== null
    ? `<span class="gh2-card__location">${escapeHtml(view.boardLocation)} #${escapeHtml(view.slot + 1)}</span>`
    : '';

  return `<div class="${classes}"
    data-card-id="${escapeHtml(view.cardId)}"
    data-uid="${escapeHtml(view.uid)}"
    data-type="${escapeHtml(view.type)}"
    data-faction="${escapeHtml(view.faction)}"
    data-face="${escapeHtml(view.face)}"
    data-power="${escapeHtml(displayPower(view))}"${slotAttr}>
    <div class="gh2-card__surface">
      <div class="gh2-card__header">
        ${renderPower(view)}
        ${costBadge}
      </div>
      <div class="gh2-card__art">
        ${artIcon}
        <span class="gh2-card__sigil">${escapeHtml(String(nameZh).slice(0, 1) || '灰')}</span>
      </div>
      <div class="gh2-card__plate">
        <span class="gh2-card__name-zh">${escapeHtml(nameZh)}</span>
        <span class="gh2-card__name-en">${escapeHtml(nameEn)}</span>
      </div>
      ${renderPrintedPower(view)}
      ${renderKeywords(view)}
      ${renderStatuses(view)}
      <div class="gh2-card__footer">
        <span class="gh2-card__type-badge">${escapeHtml(typeLabel(view))}</span>
        ${locationTag}
      </div>
    </div>
  </div>`;
}

export default renderCard;
