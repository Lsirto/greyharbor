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

  const cards = Array.from({ length: slots }, (_, index) => {
    const entry = board[index];
    if (!entry) {
      return `<div class="gh2-location__slot gh2-location__slot--empty" data-slot="${index}"><span>${index + 1}</span></div>`;
    }
    return `<div class="gh2-location__slot" data-slot="${index}">${renderCard(entry, { size: 'board' })}</div>`;
  }).join('');

  return `<section class="gh2-location gh2-location--${location}" data-location="${location}" data-player="${playerIndex}" data-subtotal="${escapeHtml(subtotal)}">
    <header class="gh2-location__head">
      <span class="gh2-location__icon">${icon(location)}</span>
      <h4 class="gh2-location__name">${escapeHtml(label)}<small>${escapeHtml(location.toUpperCase())}</small></h4>
      <span class="gh2-location__capacity">${escapeHtml(slots)} 槽</span>
    </header>
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
  })).join('');

  return `<div class="gh2-location-grid" data-player="${playerIndex}">${columns}</div>`;
}

export default renderLocationColumn;
