/**
 * src/ui-v2/history/history-controller.mjs — DOM orchestration for the match
 * history page. Reads the aggregated cross-mode record and renders it; no game
 * logic here.
 */

import { readHistorySummary } from '../../history/match-history.mjs';
import { asObject } from '../utils.mjs';
import { renderHistory } from './templates/history.mjs';

export function createHistoryController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createHistoryController needs a DOM host');
  }

  let destroyed = false;

  function render() {
    const summary = readHistorySummary(opts.storage);
    host.innerHTML = renderHistory({ summary });
  }

  function handleClick(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('[data-history-exit]')) {
      if (typeof opts.onExit === 'function') opts.onExit();
    }
  }

  host.addEventListener('click', handleClick);
  render();

  return {
    el: host,
    refresh: render,
    destroy() {
      destroyed = true;
      host.removeEventListener('click', handleClick);
    },
  };
}

export default createHistoryController;
