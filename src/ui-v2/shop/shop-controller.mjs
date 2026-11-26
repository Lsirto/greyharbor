/**
 * src/ui-v2/shop/shop-controller.mjs — DOM orchestration for the gacha shop.
 * Reads the wallet/collection, runs pulls and equip actions through the pure
 * economy module, then re-renders. No game logic lives here.
 */

import {
  equipCardBack,
  getCollection,
  pullGacha,
  readEconomy,
} from '../../economy/economy.mjs';
import { asObject } from '../utils.mjs';
import { renderShop } from './templates/index.mjs';

export function createShopController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createShopController needs a DOM host');
  }
  if (!opts.storage) throw new TypeError('createShopController needs storage');

  let destroyed = false;
  let lastResult = null;

  function buildView() {
    const state = readEconomy(opts.storage);
    return renderShop({
      coins: state.coins,
      pulls: state.pulls,
      pity: state.pity,
      lastResult,
      collection: getCollection(opts.storage),
    });
  }

  function render() {
    host.innerHTML = buildView();
  }

  function handleClick(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;

    const exit = target.closest('[data-shop="exit"]');
    if (exit) {
      if (typeof opts.onExit === 'function') opts.onExit();
      return;
    }
    const pull = target.closest('[data-shop="pull"]');
    if (pull && pull.getAttribute('aria-disabled') !== 'true') {
      lastResult = pullGacha(opts.storage);
      render();
      return;
    }
    const equip = target.closest('[data-shop="equip"]');
    if (equip) {
      const id = equip.dataset.cardBack;
      const result = equipCardBack(opts.storage, id);
      if (result.ok) lastResult = null;
      render();
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

export default createShopController;
