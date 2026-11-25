/**
 * src/ui-v2/fx/fx-controller.mjs — one coordinator for the v2 atmosphere.
 *
 * It exposes a small `hooks` object that is passed to createGameController:
 *   afterPaint({view, mode, seed})  → view diff → DOM classes + particles
 *   onEvents({events, who})         → engine events → synth voices + shatter
 *   getAudioStatus()/onMuteToggle() → the operation-console mute button
 *   onDestroy()                     → tidy up timers / listeners
 *
 * Nothing here writes game state.  Every DOM/audio call is guarded so a
 * missing or broken browser API can never break the match itself.
 */

import { asArray, asObject } from '../utils.mjs';
import { audio as defaultAudio } from '../audio/audio-engine.mjs';
import { resolveVoices, voiceForUi } from '../audio/sound-map.mjs';
import { createDomAnimations } from './dom-animations.mjs';
import { createParticles } from './particles.mjs';
import { diffViews } from './view-diff.mjs';

const EVENT_PARTICLES = Object.freeze({
  sanityChange: 'sanityZero',
  gameOver: 'sanityZero',
});

function cssValue(value) {
  return String(value).replace(/["\\]/g, '\\$&');
}

export function createFxController(options = {}) {
  const opts = asObject(options);
  const doc = opts.document ?? (typeof document !== 'undefined' ? document : null);
  const win = opts.window ?? (typeof window !== 'undefined' ? window : null);
  const boardRoot = opts.boardRoot && typeof opts.boardRoot.querySelector === 'function' ? opts.boardRoot : null;
  const controlsRoot = opts.controlsRoot && typeof opts.controlsRoot.addEventListener === 'function' ? opts.controlsRoot : null;
  const audio = opts.audio ?? defaultAudio;
  const prefersReduced = typeof opts.isReducedMotion === 'function'
    ? opts.isReducedMotion
    : () => {
      try {
        return typeof win?.matchMedia === 'function'
          && win.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
      } catch (_) { return false; }
    };

  const animations = createDomAnimations({
    root: boardRoot,
    document: doc,
    isReducedMotion: prefersReduced,
    schedule: opts.schedule,
    cancel: opts.cancel,
  });
  const particles = createParticles({
    root: doc?.body ?? null,
    document: doc,
    window: win,
    canvas: opts.canvas,
    rng: opts.rng,
    seed: opts.seed,
    maxParticles: opts.maxParticles,
    isReducedMotion: prefersReduced,
    requestAnimationFrame: opts.requestAnimationFrame,
    cancelAnimationFrame: opts.cancelAnimationFrame,
  });
  particles.mount();
  try { audio?.installUnlock?.(win); } catch (_) { /* audio unlock is best-effort */ }

  let lastView = null;
  let disposed = false;
  const listeners = [];

  function listen(target, type, handler) {
    if (!target || typeof target.addEventListener !== 'function') return;
    try {
      target.addEventListener(type, handler);
      listeners.push(() => { try { target.removeEventListener(type, handler); } catch (_) { /* ignore */ } });
    } catch (_) { /* ignore */ }
  }

  function rectFor(uid) {
    if (!boardRoot || typeof uid !== 'string') return null;
    try {
      const element = boardRoot.querySelector(`[data-uid="${cssValue(uid)}"]`);
      if (!element || typeof element.getBoundingClientRect !== 'function') return null;
      const rect = element.getBoundingClientRect();
      if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top)) return null;
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    } catch (_) { return null; }
  }

  function playerPoint(player) {
    if (boardRoot) {
      try {
        const element = boardRoot.querySelector(`[data-player="${player}"] [data-sanity], [data-player="${player}"] .gh2-player-bar`);
        if (element && typeof element.getBoundingClientRect === 'function') {
          const rect = element.getBoundingClientRect();
          if (Number.isFinite(rect.left)) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
      } catch (_) { /* fall through to viewport centre */ }
    }
    return {
      x: Number(win?.innerWidth) / 2 || 400,
      y: Number(win?.innerHeight) / 2 || 300,
    };
  }

  function handleView(view) {
    if (disposed || !view || typeof view !== 'object') return;
    const diff = diffViews(lastView, view);
    lastView = view;
    animations.apply(diff);

    for (const uid of asArray(diff.entered)) particles.emit('play', rectFor(uid));
    for (const uid of asArray(diff.sealed)) particles.emit('seal', rectFor(uid), { count: 22 });
    for (const entry of asArray(diff.corrupted)) {
      particles.emit('corruption', rectFor(asObject(entry).uid), { count: 14 });
    }
    for (const change of asArray(diff.sanity)) {
      const data = asObject(change);
      if (Number(data.to) <= 0) particles.emit('sanityZero', playerPoint(data.player), { count: 80 });
    }
  }

  function handleEvents(events, context = {}) {
    if (disposed) return;
    const voices = resolveVoices(events, audio?.getSettings?.() ?? undefined);
    for (const voice of voices) {
      try { audio?.play?.(voice); } catch (_) { /* audio is optional */ }
    }
    for (const event of asArray(events)) {
      const data = asObject(event);
      const kind = EVENT_PARTICLES[data.type];
      if (!kind) continue;
      const isZero = data.type === 'sanityChange'
        ? Number(data.to) <= 0
        : asObject(data).reason === 'sanity';
      if (!isZero) continue;
      const point = Number.isInteger(data.player)
        ? playerPoint(data.player)
        : playerPoint(0);
      particles.emit(kind, point, { count: 80 });
    }
    void context;
  }

  function handleUiClick(event) {
    if (disposed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    if (!target.closest('button, [data-gh2], .gh2-card, a')) return;
    const voice = voiceForUi('click');
    if (voice) { try { audio?.play?.(voice); } catch (_) { /* ignore */ } }
  }

  function handleUiHover(event) {
    if (disposed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    if (!target.closest('button, [data-gh2], a')) return;
    const voice = voiceForUi('hover');
    if (voice) { try { audio?.play?.(voice); } catch (_) { /* ignore */ } }
  }

  listen(controlsRoot, 'click', handleUiClick);
  listen(boardRoot, 'click', handleUiClick);
  listen(controlsRoot, 'mouseover', handleUiHover);

  const hooks = {
    afterPaint(payload) {
      try { handleView(asObject(payload).view ?? payload); } catch (_) { /* atmosphere is best-effort */ }
    },
    onEvents(payload) {
      try {
        const data = asObject(payload);
        handleEvents(asArray(data.events), data);
      } catch (_) { /* ignore */ }
    },
    getAudioStatus() {
      const settings = audio?.getSettings?.() ?? {};
      const muted = settings.muted === true || settings.enabled === false;
      return { muted, label: muted ? '♪ 已静音' : '♪ 音效' };
    },
    onMuteToggle(nextMuted) {
      try { audio?.setMuted?.(nextMuted === true); } catch (_) { /* ignore */ }
    },
    onDestroy() {
      // The shell owns this controller's lifetime; nothing extra to do here.
    },
  };

  return {
    hooks,
    animations,
    particles,
    handleView,
    handleEvents,
    stats: () => ({
      animations: animations.stats(),
      particles: particles.stats(),
      audio: audio?.stats?.() ?? null,
      lastNight: asObject(lastView).night ?? null,
    }),
    destroy() {
      if (disposed) return;
      disposed = true;
      for (const off of listeners) off();
      listeners.length = 0;
      animations.destroy();
      particles.destroy();
      lastView = null;
    },
  };
}

export default createFxController;
