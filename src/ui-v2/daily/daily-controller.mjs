/**
 * src/ui-v2/daily/daily-controller.mjs — DOM orchestration for the Daily
 * Challenge intro.
 *
 * Derives the fixed match for the current date, reads any recorded result, and
 * renders the intro screen. Starting the match hands the deterministic
 * battleOptions to onComplete (the app shell mounts the existing game
 * controller); the result is recorded separately by the shell on game over.
 */

import {
  buildDailyBattleOptions,
  getDailyConfig,
  readDailyResult,
} from '../../daily/daily.mjs';
import { readDailyStats } from '../../daily/stats.mjs';
import { getCharacterCard } from '../menu/templates/character-select.mjs';
import { asObject } from '../utils.mjs';
import { renderDailyIntro } from './templates/index.mjs';

export function createDailyController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createDailyController needs a DOM host');
  }

  const date = opts.date ?? new Date();
  const config = getDailyConfig(date);
  let destroyed = false;

  function buildView() {
    const record = readDailyResult(opts.storage, config.dateKey);
    const stats = readDailyStats(opts.storage, config.dateKey);
    const leader = getCharacterCard(config.leader) ?? { id: config.leader };
    return renderDailyIntro({ config, leader, record, stats });
  }

  function render() {
    host.innerHTML = buildView();
  }

  function handleClick(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;

    if (target.closest('[data-daily-exit]')) {
      if (typeof opts.onExit === 'function') opts.onExit();
      return;
    }
    if (target.closest('[data-daily-start]')) {
      const battleOptions = buildDailyBattleOptions(config);
      if (typeof opts.onComplete === 'function') opts.onComplete(battleOptions, config);
    }
  }

  host.addEventListener('click', handleClick);
  render();

  return {
    el: host,
    getConfig: () => config,
    refresh: render,
    destroy() {
      destroyed = true;
      host.removeEventListener('click', handleClick);
    },
  };
}

export default createDailyController;
