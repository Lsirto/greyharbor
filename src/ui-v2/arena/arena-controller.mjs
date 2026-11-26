/**
 * src/ui-v2/arena/arena-controller.mjs — DOM orchestration for one Arena run.
 *
 * Owns the draft state and renders the draft screen into a host. Every pick is
 * a pure draft operation; once 19 cards are drafted, the validated
 * battleOptions are handed to onComplete so the app shell can mount the
 * existing human-vs-AI game-controller (its driving loop and AI are unchanged).
 * No engine rules live here.
 */

import {
  buildArenaBattleOptions,
  createDraft,
  getOffers,
  isComplete,
  pickCard,
} from '../../arena/draft.mjs';
import { asObject } from '../utils.mjs';
import { renderArenaScreen } from './templates/index.mjs';

export function createArenaController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createArenaController needs a DOM host');
  }
  if (typeof opts.leader !== 'string' || !opts.leader.length) {
    throw new TypeError('createArenaController needs a leader id');
  }

  const draft = createDraft({ faction: opts.faction, seed: opts.seed });
  let destroyed = false;

  function render() {
    host.innerHTML = renderArenaScreen(draft, {
      offers: [...getOffers(draft)],
      leaderName: typeof opts.leaderName === 'string' ? opts.leaderName : undefined,
    });
  }

  function handleClick(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;

    if (target.closest('[data-arena-exit]')) {
      if (typeof opts.onExit === 'function') opts.onExit();
      return;
    }

    const pick = target.closest('[data-arena-pick]');
    if (!pick) return;
    pickCard(draft, pick.dataset.arenaPick);
    if (isComplete(draft)) {
      const battleOptions = buildArenaBattleOptions(draft, opts.leader);
      if (typeof opts.onComplete === 'function') opts.onComplete(battleOptions);
      return;
    }
    render();
  }

  host.addEventListener('click', handleClick);
  render();

  return {
    el: host,
    getDraft: () => draft,
    destroy() {
      destroyed = true;
      host.removeEventListener('click', handleClick);
    },
  };
}

export default createArenaController;
