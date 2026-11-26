/**
 * src/ui-v2/codex/codex-controller.mjs — DOM orchestration for the card codex.
 *
 * Holds the plain filter state, runs every change through the pure codex module
 * and re-renders.  No game rules or card data live here.
 */

import { DEFAULT_FILTERS, selectCodex } from '../../codex/codex.mjs';
import { asObject } from '../utils.mjs';
import { renderCodex, renderCodexResults } from './templates/index.mjs';

export function createCodexController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createCodexController needs a DOM host');
  }

  let destroyed = false;
  let filters = { ...DEFAULT_FILTERS };

  /** Full re-render for chip changes (no focus is held in the filter bar). */
  function render() {
    host.innerHTML = renderCodex(selectCodex(filters));
  }

  /**
   * Keystroke path: keep the search input mounted (preserving focus, cursor and
   * IME composition) and swap only the result region beneath it.
   */
  function renderResults() {
    const region = host.querySelector('[data-role="codex-results"]');
    if (region) region.innerHTML = renderCodexResults(selectCodex(filters));
  }

  function handleClick(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    const source = target.closest('[data-codex]');
    if (!source) return;
    const action = source.dataset.codex;

    if (action === 'exit') {
      if (typeof opts.onExit === 'function') opts.onExit();
      return;
    }
    if (action === 'reset') {
      filters = { ...DEFAULT_FILTERS };
    } else if (action === 'filter') {
      const dim = source.dataset.dim;
      const value = source.dataset.value;
      if (dim === 'faction' || dim === 'type' || dim === 'location') {
        filters = { ...filters, [dim]: value };
      }
    }
    render();
  }

  function handleInput(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || target.matches?.('[data-codex="search"]') !== true) return;
    filters = { ...filters, query: target.value };
    renderResults();
  }

  host.addEventListener('click', handleClick);
  host.addEventListener('input', handleInput);
  render();

  return {
    el: host,
    getFilters: () => ({ ...filters }),
    refresh: () => render(),
    destroy() {
      destroyed = true;
      host.removeEventListener('click', handleClick);
      host.removeEventListener('input', handleInput);
    },
  };
}

export default createCodexController;
