/**
 * templates/location-column.mjs — one location column and a three-column grid.
 * Subtotals are recomputed from the (already redacted) view cards, never from
 * engine internals.  Pure string output.
 */

import {
  LOCATIONS_ZH,
  LOCATION_CAPACITY_FALLBACK,
  LOCATION_ORDER,
  isUnitType,
  normalizeCardView,
} from '../card-view.mjs';
import { asArray, asObject, escapeHtml, safeInt, safeNumber } from '../utils.mjs';
import { icon } from './icons.mjs';
import { renderCard } from './card.mjs';

function sumColumn(board) {
  let total = 0;
  for (const entry of asArray(board)) {
    if (!entry) continue;
    const card = normalizeCardView(entry);
    if (card.hidden || !isUnitType(card.type)) continue;
    total += safeNumber(card.power, 0);
  }
  return Math.max(0, Math.trunc(total));
}

/** Short Chinese effect text for the active anomaly. */
export function describeAnomaly(anomaly) {
  const a = asObject(anomaly);
  if (!a.id) return '';
  if (Number.isFinite(a.power)) return `战力 ${a.power > 0 ? '+' : ''}${a.power}`;
  if (Number.isFinite(a.entryCorruption) && a.entryCorruption) return `入场腐化 +${a.entryCorruption}`;
  if (Number.isFinite(a.entrySanity) && a.entrySanity) return `入场理智 ${a.entrySanity > 0 ? '+' : ''}${a.entrySanity}`;
  if (a.sealImmune) return '免疫封印';
  if (a.leaderBlocked) return '领袖禁入';
  if (a.environmentBlocked) return '环境禁用';
  return '';
}

function renderAnomalyBanner(anomaly, location) {
  const a = asObject(anomaly);
  if (!a.id) return '';
  // Global anomaly (location null) shows on every column; otherwise only on its location.
  if (a.location !== null && a.location !== location) return '';
  const effect = describeAnomaly(a);
  const name = a.nameZh || a.id;
  return `<div class="gh2-anomaly" data-anomaly="${escapeHtml(a.id)}" title="${escapeHtml(a.nameEn || a.id)}">
    <span class="gh2-anomaly__mark">${icon('night')}</span>
    <span class="gh2-anomaly__text"><b>${escapeHtml(name)}</b><i>${escapeHtml(effect)}</i></span>
  </div>`;
}

export function renderLocationColumn(options = {}) {
  const opts = asObject(options);
  const location = LOCATION_ORDER.includes(opts.location) ? opts.location : 'scene';
  const playerIndex = opts.playerIndex === 1 ? 1 : 0;
  const board = asArray(opts.board);
  const capacity = Math.max(0, safeInt(opts.capacity, LOCATION_CAPACITY_FALLBACK[location] ?? 0));
  const slots = Math.max(board.length, capacity);
  const label = LOCATIONS_ZH[location] ?? location;
  const computed = sumColumn(board);
  const subtotal = typeof opts.subtotal === 'number' && Number.isFinite(opts.subtotal)
    ? opts.subtotal
    : computed;
  const locationCard = opts.locationCard && typeof opts.locationCard === 'object'
    ? renderCard(opts.locationCard, { size: 'env' })
    : '<span class="gh2-location__slot-empty">地点位 · 空</span>';
  const anomalyBanner = renderAnomalyBanner(opts.anomaly, location);

  const cards = Array.from({ length: slots }, (_, index) => {
    const entry = board[index];
    if (!entry) {
      return `<div class="gh2-location__slot gh2-location__slot--empty" data-slot="${index}"><span>${index + 1}</span></div>`;
    }
    return `<div class="gh2-location__slot" data-slot="${index}">${renderCard(entry, { size: 'board', cardBackId: opts.cardBackId })}</div>`;
  }).join('');

  return `<section class="gh2-location gh2-location--${location}" data-location="${location}" data-player="${playerIndex}" data-subtotal="${escapeHtml(subtotal)}">
    <header class="gh2-location__head">
      <span class="gh2-location__icon">${icon(location)}</span>
      <h4 class="gh2-location__name">${escapeHtml(label)}<small>${escapeHtml(location.toUpperCase())}</small></h4>
      <span class="gh2-location__capacity">${escapeHtml(slots)} 槽</span>
    </header>
    ${anomalyBanner}
    <div class="gh2-location__card-slot">${locationCard}</div>
    <div class="gh2-location__slots">${cards}</div>
    <footer class="gh2-location__foot"><span>小计 SUBTOTAL</span><strong>${escapeHtml(subtotal)}</strong></footer>
  </section>`;
}

export function renderLocationGrid(player, options = {}) {
  const opts = asObject(options);
  const data = asObject(player);
  const board = asObject(data.board);
  const locations = asObject(data.locations);
  const playerIndex = opts.playerIndex === 1 ? 1 : 0;
  const scoreLocations = asObject(data.score?.locations);
  const columns = LOCATION_ORDER.map((location) => renderLocationColumn({
    location,
    playerIndex,
    board: board[location],
    locationCard: locations[location],
    subtotal: scoreLocations[location],
    anomaly: opts.anomaly ?? null,
    cardBackId: opts.cardBackId,
  })).join('');

  return `<div class="gh2-location-grid" data-player="${playerIndex}">${columns}</div>`;
}

export default renderLocationColumn;
