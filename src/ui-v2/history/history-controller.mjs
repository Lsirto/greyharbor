/**
 * src/ui-v2/history/history-controller.mjs — DOM orchestration for the career
 * page. Reads the aggregated cross-module career view and renders it; no game
 * logic here.
 */

import { buildCareerSummary } from '../../history/career.mjs';
import { asObject } from '../utils.mjs';
import { renderHistory } from './templates/history.mjs';

function formatTodayKey(date) {
  const source = date instanceof Date
    ? date
    : (typeof date === 'string' && date.length > 0 ? date : new Date());
  if (source instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${source.getFullYear()}-${pad(source.getMonth() + 1)}-${pad(source.getDate())}`;
  }
  return String(source);
}

export function createHistoryController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createHistoryController needs a DOM host');
  }

  let destroyed = false;

  function render() {
    const todayKey = formatTodayKey(opts.date);
    const career = buildCareerSummary(opts.storage, { todayKey, now: opts.now });
    host.innerHTML = renderHistory({ career });
  }

  function handleClick(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('[data-history-exit]')) {
      if (typeof opts.onExit === 'function') opts.onExit();
      return;
    }
    const nav = target.closest('[data-career-nav]');
    if (nav && typeof opts.onNavigate === 'function') {
      opts.onNavigate(nav.dataset.careerNav);
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
