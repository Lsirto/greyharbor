/**
 * templates/sanity.mjs — 6-cell sanity meter.  Pure string output.
 */

import { asObject, clamp, escapeHtml, safeInt } from '../utils.mjs';
import { icon } from './icons.mjs';

export const SANITY_CELLS = 6;

export function renderSanityMeter(sanity, options = {}) {
  const opts = asObject(options);
  const value = clamp(safeInt(sanity, 0), 0, SANITY_CELLS);
  const cells = Array.from({ length: SANITY_CELLS }, (_, index) => {
    const lit = index < value;
    return `<span class="gh2-sanity__cell${lit ? ' is-lit' : ''}" data-index="${index}" aria-hidden="true"></span>`;
  }).join('');
  const madness = value <= 3 ? ' is-madness' : '';
  const compact = opts.compact === true ? ' gh2-sanity--compact' : '';

  return `<div class="gh2-sanity${madness}${compact}" data-sanity="${value}" aria-label="理智 ${value} / ${SANITY_CELLS}">
    <span class="gh2-sanity__label">${icon('eye')}<span>理智</span></span>
    <div class="gh2-sanity__cells">${cells}</div>
    <span class="gh2-sanity__value">${escapeHtml(value)}/${SANITY_CELLS}</span>
  </div>`;
}

export default renderSanityMeter;
