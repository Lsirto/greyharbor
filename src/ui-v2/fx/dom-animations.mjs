/**
 * src/ui-v2/fx/dom-animations.mjs — class-based DOM atmosphere.
 *
 * The renderer repaints the whole board with innerHTML, so animations are
 * applied *after* paint against the fresh elements.  Every mutation is a
 * temporary CSS class: no layout measurement, no awaited promise, no change
 * to pointer-events, and every class is removed by a tracked timer.  Failures
 * are swallowed; the game must remain playable if an animation cannot run.
 *
 * With prefers-reduced-motion the layer degrades to a short fade (or no op).
 */

import { asArray, asObject } from '../utils.mjs';

export const FX_CLASSES = Object.freeze({
  enter: 'gh2-fx-enter',
  flip: 'gh2-fx-flip',
  sanity: 'gh2-fx-sanity',
  seal: 'gh2-fx-seal',
  corrupt: 'gh2-fx-corrupt',
  night: 'gh2-fx-night',
  banner: 'gh2-fx-banner',
  fade: 'gh2-fx-fade',
});

export const ANIMATION_MS = Object.freeze({
  enter: 620,
  flip: 760,
  sanity: 900,
  seal: 1400,
  corrupt: 1200,
  night: 1100,
  banner: 2600,
  fade: 260,
});

function cssValue(value) {
  return String(value).replace(/["\\]/g, '\\$&');
}

function asDuration(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function createDomAnimations(options = {}) {
  const opts = asObject(options);
  const root = opts.root && typeof opts.root.querySelectorAll === 'function' ? opts.root : null;
  const doc = opts.document ?? (typeof document !== 'undefined' ? document : null);
  const schedule = typeof opts.schedule === 'function'
    ? opts.schedule
    : (fn, ms) => setTimeout(fn, ms);
  const cancelTimer = typeof opts.cancel === 'function'
    ? opts.cancel
    : (token) => clearTimeout(token);
  const durations = { ...ANIMATION_MS, ...asObject(opts.durations) };
  const reduced = () => typeof opts.isReducedMotion === 'function' && opts.isReducedMotion() === true;

  const timers = new Set();
  let banner = null;
  let stats = { classes: 0, banners: 0, failures: 0 };

  function addClass(element, className, ms) {
    if (!element || !element.classList || typeof element.classList.add !== 'function') return;
    try {
      element.classList.add(className);
      stats.classes += 1;
      const token = schedule(() => {
        timers.delete(token);
        try { element.classList.remove(className); } catch (_) { /* element already gone */ }
      }, asDuration(ms, 300));
      timers.add(token);
    } catch (_) {
      stats.failures += 1;
    }
  }

  function query(selector) {
    if (!root) return [];
    try { return Array.from(root.querySelectorAll(selector)); } catch (_) { return []; }
  }

  function byUid(uid) {
    if (typeof uid !== 'string' || uid.length === 0) return [];
    return query(`[data-uid="${cssValue(uid)}"]`);
  }

  function pulsePlayer(player, className, ms) {
    if (!Number.isInteger(player)) return;
    const targets = query(`[data-player="${player}"] [data-sanity], [data-player="${player}"] .gh2-player-bar`);
    for (const element of targets) addClass(element, className, ms);
  }

  function showBanner(text) {
    if (!doc || !root || typeof root.appendChild !== 'function') return;
    try {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      banner = doc.createElement('div');
      banner.className = `${FX_CLASSES.banner}${reduced() ? ` ${FX_CLASSES.fade}` : ''}`;
      banner.setAttribute('aria-hidden', 'true');
      banner.textContent = String(text ?? '对局结束');
      root.appendChild(banner);
      stats.banners += 1;
      const token = schedule(() => {
        timers.delete(token);
        if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
        banner = null;
      }, asDuration(reduced() ? durations.fade : durations.banner, 400));
      timers.add(token);
    } catch (_) {
      stats.failures += 1;
    }
  }

  function apply(diff) {
    const data = asObject(diff);
    try {
      if (data.gameOver === true) showBanner('对局结束 · 灰港归于沉寂');

      if (reduced()) {
        // Instant / fade-only degradation: no 3D flips, pulses or particles.
        for (const uid of asArray(data.entered)) {
          for (const element of byUid(uid)) addClass(element, FX_CLASSES.fade, durations.fade);
        }
        if (data.nightChanged === true || data.gameOver === true) {
          for (const element of query('[data-night], .gh2-shell')) {
            addClass(element, FX_CLASSES.fade, durations.fade);
          }
        }
        return;
      }

      for (const uid of asArray(data.entered)) {
        for (const element of byUid(uid)) addClass(element, FX_CLASSES.enter, durations.enter);
      }
      for (const change of asArray(data.flipped)) {
        for (const element of byUid(asObject(change).uid)) {
          addClass(element, FX_CLASSES.flip, durations.flip);
        }
      }
      for (const change of asArray(data.sanity)) {
        pulsePlayer(asObject(change).player, FX_CLASSES.sanity, durations.sanity);
      }
      for (const uid of asArray(data.sealed)) {
        for (const element of byUid(uid)) addClass(element, FX_CLASSES.seal, durations.seal);
      }
      for (const change of asArray(data.corrupted)) {
        for (const element of byUid(asObject(change).uid)) {
          addClass(element, FX_CLASSES.corrupt, durations.corrupt);
        }
      }
      if (data.nightChanged === true) {
        for (const element of query('[data-night], .gh2-shell')) {
          addClass(element, FX_CLASSES.night, durations.night);
        }
      }
    } catch (_) {
      stats.failures += 1;
    }
  }

  function clear() {
    for (const token of timers) {
      try { cancelTimer(token); } catch (_) { /* already fired */ }
    }
    timers.clear();
    if (banner && banner.parentNode) {
      try { banner.parentNode.removeChild(banner); } catch (_) { /* already gone */ }
    }
    banner = null;
    if (root) {
      for (const element of query(Object.values(FX_CLASSES).map((name) => `.${name}`).join(', '))) {
        try {
          element.classList.remove(...Object.values(FX_CLASSES));
        } catch (_) { /* ignore detached nodes */ }
      }
    }
  }

  return {
    apply,
    clear,
    destroy: clear,
    stats: () => ({ ...stats, timers: timers.size }),
  };
}

export default createDomAnimations;
