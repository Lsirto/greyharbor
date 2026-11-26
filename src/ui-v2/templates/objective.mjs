/**
 * templates/objective.mjs — faction objective track (Society clue / Cult doom).
 * Pure string output; reads only player-shaped view data, no engine imports.
 */

import { asObject, clamp, escapeHtml, safeInt } from '../utils.mjs';
import { icon } from './icons.mjs';

const OBJECTIVE_ICONS = Object.freeze({ clue: 'archive', doom: 'sacrifice' });
const OBJECTIVE_LABELS = Object.freeze({ clue: '线索', doom: '末日' });

export function renderObjectiveTrack(player, options = {}) {
  const opts = asObject(options);
  const data = asObject(player);
  const type = data.objectiveType === 'doom' ? 'doom' : 'clue';
  const threshold = Math.max(1, safeInt(data.objectiveThreshold, 7));
  const value = clamp(safeInt(data.objective, 0), 0, threshold);
  const compact = opts.compact === true ? ' gh2-objective--compact' : '';

  const pips = Array.from({ length: threshold }, (_, index) => {
    const lit = index < value;
    return `<span class="gh2-objective__pip${lit ? ' is-lit' : ''}" data-index="${index}" aria-hidden="true"></span>`;
  }).join('');

  return `<div class="gh2-objective gh2-objective--${type}${compact}" data-objective="${value}" data-type="${type}" aria-label="${OBJECTIVE_LABELS[type]} ${value} / ${threshold}">
    <span class="gh2-objective__label">${icon(OBJECTIVE_ICONS[type])}<span>${escapeHtml(OBJECTIVE_LABELS[type])}</span></span>
    <div class="gh2-objective__pips">${pips}</div>
    <span class="gh2-objective__value">${escapeHtml(value)}/${threshold}</span>
  </div>`;
}

export default renderObjectiveTrack;
