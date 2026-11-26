/**
 * src/ui-v2/menu/templates/mode-toggle.mjs — pure HTML for seed-mode selection.
 */

import { escapeHtml } from '../../utils.mjs';

export const SEED_MODES = Object.freeze([
  Object.freeze({ id: 'fixed', label: '固定牌局', hint: '相同牌局，可反复挑战' }),
  Object.freeze({ id: 'random', label: '随机牌局', hint: '每局都是全新牌局，不复现' }),
]);

/** @param {{seedMode?: string}} options */
export function renderModeToggle(options = {}) {
  const input = options && typeof options === 'object' ? options : {};
  const current = input.seedMode === 'random' ? 'random' : 'fixed';
  const buttons = SEED_MODES.map((mode) => `<button type="button"
      class="gh2-mode-btn${mode.id === current ? ' is-selected' : ''}"
      data-seed-mode="${escapeHtml(mode.id)}"
      aria-pressed="${mode.id === current ? 'true' : 'false'}">
      <b>${escapeHtml(mode.label)}</b><small>${escapeHtml(mode.hint)}</small>
    </button>`).join('');
  return `<div class="gh2-mode-toggle" role="group" aria-label="牌局模式">
    <span class="gh2-mode-toggle__label">牌局模式</span>
    <div class="gh2-mode-toggle__options">${buttons}</div>
  </div>`;
}

export default renderModeToggle;
