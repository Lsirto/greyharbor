/**
 * src/ui-v2/achievements/achievements-controller.mjs — DOM orchestration for
 * the achievement wall. Evaluates the data-driven catalogue against the stored
 * profile, persists any new unlocks, and renders the wall. No game logic here.
 */

import { buildAchievementWall } from '../../achievements/achievements.mjs';
import { asObject } from '../utils.mjs';
import { renderAchievements } from './templates/index.mjs';

export function createAchievementsController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createAchievementsController needs a DOM host');
  }

  const date = opts.date ?? new Date();
  let destroyed = false;

  function buildView() {
    // Format the reference day the same way the daily feature does.
    const todayKey = date instanceof Date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : String(date);
    const wall = buildAchievementWall(opts.storage, todayKey, opts.now);
    return renderAchievements({ wall });
  }

  function render() {
    host.innerHTML = buildView();
  }

  function handleClick(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('[data-ach-exit]')) {
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

export default createAchievementsController;
