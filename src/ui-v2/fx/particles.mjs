/**
 * src/ui-v2/fx/particles.mjs — one rAF loop, one fixed pool, one full-screen
 * canvas.  No external assets and no Math.random: every particle is seeded by
 * an injected rng (a deterministic LCG by default).
 *
 * Two layers share the canvas and the single rAF loop:
 *   1. Burst pool — short-lived particles (sanityZero shatter, corruption
 *      motes, seal rune expansion, play dust) that die when their life runs out.
 *   2. Ambient weather — persistent rain / fog / corruption particles that
 *      wrap around the screen edges instead of dying, giving a full-screen
 *      atmosphere driven by the current scene and corruption level.
 * The canvas is pointer-events:none, the loop pauses on visibilitychange, and
 * reduced-motion disables emission and weather.
 */

import { asObject, clamp, safeInt } from '../utils.mjs';

export const PARTICLE_LIMIT = 300;
export const PARTICLE_KINDS = Object.freeze(['sanityZero', 'corruption', 'seal', 'play']);
export const WEATHER_MODES = Object.freeze(['rain', 'fog', 'corruption']);
export const DPR_CAP = 2;

export const PARTICLE_DEFAULTS = Object.freeze({
  maxParticles: PARTICLE_LIMIT,
  reducedMotion: false,
  dprCap: DPR_CAP,
});

const BURST_SIZE = Object.freeze({
  sanityZero: 90,
  corruption: 18,
  seal: 26,
  play: 12,
});

const STYLE = Object.freeze({
  sanityZero: { color: '#e5a99c', gravity: 220, life: [0.5, 1.15], speed: [70, 250], size: [1.5, 4], shape: 'shard' },
  corruption: { color: '#8b7ab5', gravity: -26, life: [0.7, 1.5], speed: [12, 58], size: [1, 3], shape: 'mote' },
  seal: { color: '#e8c98a', gravity: -8, life: [0.65, 1.3], speed: [55, 145], size: [1.5, 3.5], shape: 'rune' },
  play: { color: '#cabb96', gravity: 95, life: [0.32, 0.72], speed: [18, 78], size: [1, 2.5], shape: 'dust' },
});

/* Persistent ambient layer. Ranges are [min, max] sampled with the seeded rng.
   Rain falls fast on a slant, fog drifts in large soft puffs, and corruption
   spores float upward with a sideways sway.  None of these ever "die": leaving
   one edge wraps the particle back to the opposite edge. */
const WEATHER_STYLE = Object.freeze({
  rain: {
    count: 70, shape: 'rainline', color: '#9fb4c8',
    speedY: [620, 880], speedX: [-130, -60],
    size: [1, 1.6], alpha: [0.22, 0.45], len: [14, 26],
  },
  fog: {
    count: 26, shape: 'fog', color: '#b8c0c8',
    speedX: [18, 42], bob: 8, drift: 0.6,
    size: [46, 110], alpha: [0.05, 0.12],
  },
  corruption: {
    count: 46, shape: 'spore', colors: ['#8b7ab5', '#a78bfa', '#7dd3c0'],
    speedY: [-58, -22], speedX: [-8, 8], swing: 16, drift: 2.2,
    size: [1.6, 4], alpha: [0.3, 0.6],
  },
});

/** Small deterministic LCG; two draws give an angle + speed without bias. */
export function createSeededRng(seed = 0x1a2b3c4d) {
  let state = (Number.isFinite(seed) ? seed >>> 0 : 0x1a2b3c4d) || 0x9e3779b9;
  return function next() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function asPoint(value) {
  const point = asObject(value);
  const x = Number(point.x);
  const y = Number(point.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

export function createParticles(options = {}) {
  const opts = asObject(options);
  const doc = opts.document ?? (typeof document !== 'undefined' ? document : null);
  const win = opts.window ?? (typeof window !== 'undefined' ? window : null);
  const root = opts.root ?? doc?.body ?? null;
  const rng = typeof opts.rng === 'function' ? opts.rng : createSeededRng(opts.seed);
  const cap = clamp(safeInt(opts.dprCap, DPR_CAP), 1, DPR_CAP);
  const maxParticles = clamp(safeInt(opts.maxParticles, PARTICLE_LIMIT), 1, PARTICLE_LIMIT);
  const reducedFlag = () => typeof opts.isReducedMotion === 'function'
    ? opts.isReducedMotion() === true
    : opts.reducedMotion === true;

  const requestFrame = typeof opts.requestAnimationFrame === 'function'
    ? opts.requestAnimationFrame
    : (fn) => win?.requestAnimationFrame?.(fn) ?? null;
  const cancelFrame = typeof opts.cancelAnimationFrame === 'function'
    ? opts.cancelAnimationFrame
    : (id) => { if (id !== null && id !== undefined && typeof win?.cancelAnimationFrame === 'function') win.cancelAnimationFrame(id); };

  const pool = Array.from({ length: maxParticles }, () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
    size: 1, color: '#fff', gravity: 0, spin: 0, angle: 0, shape: 'mote',
  }));

  let canvas = opts.canvas && typeof opts.canvas.getContext === 'function' ? opts.canvas : null;
  let ctx = null;
  let cursor = 0;
  let activeCount = 0;
  let frameId = null;
  let lastTs = 0;
  let hidden = false;
  let mounted = false;
  let listeners = [];
  let stats = { emitted: 0, skipped: 0, frames: 0, peak: 0 };

  // Ambient weather state. `requestedWeather` remembers what the controller
  // asked for even while reduced-motion/hidden; `weatherMode` is what is
  // actually being drawn, and `ambient` holds its persistent particles.
  let requestedWeather = null;
  let weatherMode = null;
  let ambient = [];

  function openContext() {
    if (!canvas) return false;
    try { ctx = canvas.getContext('2d') ?? null; } catch (_) { ctx = null; }
    return !!ctx;
  }

  function resize() {
    if (!canvas) return;
    try {
      const dpr = Math.min(cap, Math.max(1, Number(win?.devicePixelRatio) || 1));
      const width = Math.max(1, Number(win?.innerWidth) || (doc?.documentElement?.clientWidth ?? 800));
      const height = Math.max(1, Number(win?.innerHeight) || (doc?.documentElement?.clientHeight ?? 600));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } catch (_) { /* a canvas without style/ctx is simply not drawn */ }
  }

  function viewWidth() {
    return Math.max(1, Number(win?.innerWidth) || Number(doc?.documentElement?.clientWidth) || 800);
  }
  function viewHeight() {
    return Math.max(1, Number(win?.innerHeight) || Number(doc?.documentElement?.clientHeight) || 600);
  }

  function listen(target, type, handler) {
    if (!target || typeof target.addEventListener !== 'function') return;
    try {
      target.addEventListener(type, handler);
      listeners.push(() => { try { target.removeEventListener(type, handler); } catch (_) { /* ignore */ } });
    } catch (_) { /* ignore unsupported event targets */ }
  }

  function mount() {
    if (mounted) return canvas;
    mounted = true;
    if (!canvas && doc && typeof doc.createElement === 'function' && root && typeof root.appendChild === 'function') {
      try {
        canvas = doc.createElement('canvas');
        canvas.className = 'gh2-fx-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        root.appendChild(canvas);
      } catch (_) { canvas = null; }
    }
    openContext();
    resize();
    if (typeof doc?.hidden === 'boolean') hidden = doc.hidden;
    listen(win, 'resize', resize);
    listen(doc, 'visibilitychange', () => {
      hidden = doc.hidden === true;
      if (hidden) stopLoop();
      else { applyWeather(); ensureLoop(); }
    });
    const mq = typeof win?.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq) {
      const onChange = () => { clear(); applyWeather(); };
      if (typeof mq.addEventListener === 'function') listen(mq, 'change', onChange);
      else if (typeof mq.addListener === 'function') listen(mq, 'change', onChange);
    }
    return canvas;
  }

  function takeSlot() {
    for (let i = 0; i < maxParticles; i += 1) {
      const index = (cursor + i) % maxParticles;
      if (!pool[index].active) {
        cursor = (index + 1) % maxParticles;
        return pool[index];
      }
    }
    return null;
  }

  function emit(kind, point, config = {}) {
    const cfg = asObject(config);
    if (reducedFlag() || hidden || !ctx || !PARTICLE_KINDS.includes(kind)) {
      stats.skipped += 1;
      return 0;
    }
    const origin = asPoint(point);
    if (!origin) {
      stats.skipped += 1;
      return 0;
    }
    const style = STYLE[kind];
    const wanted = clamp(safeInt(cfg.count, BURST_SIZE[kind]), 1, maxParticles);
    let spawned = 0;
    for (let i = 0; i < wanted; i += 1) {
      const particle = takeSlot();
      if (!particle) break;
      const angle = rng() * Math.PI * 2;
      const speed = style.speed[0] + rng() * (style.speed[1] - style.speed[0]);
      const life = style.life[0] + rng() * (style.life[1] - style.life[0]);
      particle.active = true;
      particle.x = origin.x + (rng() - 0.5) * 6;
      particle.y = origin.y + (rng() - 0.5) * 6;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      particle.size = style.size[0] + rng() * (style.size[1] - style.size[0]);
      particle.color = style.color;
      particle.gravity = style.gravity;
      particle.spin = (rng() - 0.5) * 8;
      particle.angle = angle;
      particle.shape = style.shape;
      spawned += 1;
    }
    activeCount += spawned;
    stats.emitted += spawned;
    stats.peak = Math.max(stats.peak, activeCount);
    if (spawned > 0) ensureLoop();
    return spawned;
  }

  function canAnimate() { return !reducedFlag() && !hidden && !!ctx; }
  function pick(range) { return range[0] + rng() * (range[1] - range[0]); }

  function buildAmbient(mode) {
    const s = WEATHER_STYLE[mode];
    const width = viewWidth();
    const height = viewHeight();
    const list = [];
    for (let i = 0; i < s.count; i += 1) {
      const item = {
        x: rng() * width,
        y: rng() * height,
        phase: rng() * Math.PI * 2,
        alpha: pick(s.alpha),
        size: pick(s.size),
        shape: s.shape,
        color: s.colors ? s.colors[Math.floor(rng() * s.colors.length)] : s.color,
      };
      if (mode === 'rain') {
        item.vy = pick(s.speedY);
        item.vx = pick(s.speedX);
        item.len = pick(s.len);
      } else if (mode === 'fog') {
        item.vx = pick(s.speedX);
        item.vy = s.bob;
        item.drift = s.drift;
      } else {
        item.vy = pick(s.speedY);
        item.vx = pick(s.speedX);
        item.swing = s.swing;
        item.drift = s.drift;
      }
      list.push(item);
    }
    return list;
  }

  /* Rebuild the ambient layer to match the requested mode and current
     accessibility/visibility state. Idempotent: an unchanged mode is a no-op. */
  function applyWeather() {
    const target = canAnimate() ? requestedWeather : null;
    if (target === weatherMode && (target === null || ambient.length > 0)) return;
    weatherMode = target;
    ambient = target ? buildAmbient(target) : [];
    if (ambient.length > 0) { lastTs = 0; ensureLoop(); }
    else if (activeCount === 0) stopLoop();
  }

  function setWeather(mode) {
    requestedWeather = WEATHER_MODES.includes(mode) ? mode : null;
    applyWeather();
    return weatherMode;
  }

  function updateAndDrawAmbient(dt, width, height) {
    for (const a of ambient) {
      a.phase += dt;
      if (a.shape === 'rainline') {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.y > height + a.len) { a.y = -a.len; a.x = rng() * (width + 80) - 40; }
        if (a.x < -40) a.x = width + 20;
        ctx.globalAlpha = a.alpha;
        ctx.strokeStyle = a.color;
        ctx.lineWidth = a.size;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x - (a.vx / a.vy) * a.len, a.y - a.len);
        ctx.stroke();
      } else if (a.shape === 'fog') {
        a.x += a.vx * dt;
        a.y += Math.sin(a.phase * a.drift) * a.vy * dt;
        if (a.x - a.size > width) a.x = -a.size;
        if (a.x + a.size < 0) a.x = width + a.size;
        ctx.globalAlpha = a.alpha;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        a.y += a.vy * dt;
        a.x += (a.vx + Math.sin(a.phase * a.drift) * a.swing) * dt;
        if (a.y < -12) { a.y = height + 10; a.x = rng() * width; }
        if (a.y > height + 12) a.y = -10;
        if (a.x < -12) a.x = width + 10;
        if (a.x > width + 12) a.x = -10;
        ctx.globalAlpha = a.alpha;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawParticle(p) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    if (p.shape === 'shard') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      ctx.restore();
    } else if (p.shape === 'rune') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.strokeRect(-p.size, -p.size, p.size * 2, p.size * 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(timestamp) {
    frameId = null;
    if (hidden || (activeCount === 0 && ambient.length === 0)) return;
    const dt = lastTs > 0 ? clamp((timestamp - lastTs) / 1000, 0.001, 0.05) : 0.016;
    lastTs = timestamp;
    try {
      const width = viewWidth();
      const height = viewHeight();
      ctx.clearRect(0, 0, width, height);
      updateAndDrawAmbient(dt, width, height);
      for (const particle of pool) {
        if (!particle.active) continue;
        particle.life -= dt;
        if (particle.life <= 0) {
          particle.active = false;
          activeCount -= 1;
          continue;
        }
        particle.vy += particle.gravity * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.angle += particle.spin * dt;
        drawParticle(particle);
      }
      ctx.globalAlpha = 1;
      stats.frames += 1;
    } catch (_) {
      clear();
      return;
    }
    ensureLoop();
  }

  function ensureLoop() {
    if (frameId !== null || hidden || reducedFlag() || !ctx) return;
    if (activeCount === 0 && ambient.length === 0) return;
    try {
      frameId = requestFrame(loop);
      if (frameId === null || frameId === undefined) frameId = 0;
    } catch (_) {
      frameId = null;
    }
  }

  function stopLoop() {
    if (frameId !== null) {
      try { cancelFrame(frameId); } catch (_) { /* ignore */ }
      frameId = null;
    }
    lastTs = 0;
  }

  function clear() {
    stopLoop();
    for (const particle of pool) particle.active = false;
    activeCount = 0;
    weatherMode = null;
    ambient = [];
    if (ctx) {
      try { ctx.clearRect(0, 0, viewWidth(), viewHeight()); } catch (_) { /* ignore */ }
    }
  }

  return {
    mount,
    emit,
    clear,
    resize,
    setWeather,
    getWeather: () => weatherMode,
    getCanvas: () => canvas,
    stats: () => ({
      ...stats,
      active: activeCount,
      capacity: maxParticles,
      reducedMotion: reducedFlag(),
      hidden,
      weather: weatherMode,
      ambient: ambient.length,
    }),
    destroy() {
      clear();
      for (const off of listeners) off();
      listeners = [];
      if (canvas && canvas.parentNode) {
        try { canvas.parentNode.removeChild(canvas); } catch (_) { /* ignore */ }
      }
    },
  };
}

export default createParticles;
