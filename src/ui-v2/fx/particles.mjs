/**
 * src/ui-v2/fx/particles.mjs — one rAF loop, one fixed pool, one full-screen
 * canvas.  No external assets and no Math.random: every particle is seeded by
 * an injected rng (a deterministic LCG by default).
 *
 * Only four bursts exist: sanityZero (shatter), corruption (motes), seal
 * (rune expansion) and play (dust).  The canvas is pointer-events:none, the
 * loop pauses on visibilitychange, and reduced-motion disables emission.
 */

import { asObject, clamp, safeInt } from '../utils.mjs';

export const PARTICLE_LIMIT = 300;
export const PARTICLE_KINDS = Object.freeze(['sanityZero', 'corruption', 'seal', 'play']);
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
      else if (activeCount > 0) ensureLoop();
    });
    const mq = typeof win?.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq) {
      const onChange = () => { if (mq.matches === true) clear(); };
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
    if (hidden || activeCount === 0) return;
    const dt = lastTs > 0 ? clamp((timestamp - lastTs) / 1000, 0.001, 0.05) : 0.016;
    lastTs = timestamp;
    try {
      const width = Number(win?.innerWidth) || canvas?.width || 0;
      const height = Number(win?.innerHeight) || canvas?.height || 0;
      ctx.clearRect(0, 0, width, height);
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
    if (frameId !== null || hidden || activeCount === 0 || reducedFlag() || !ctx) return;
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
    if (ctx) {
      try { ctx.clearRect(0, 0, Number(win?.innerWidth) || 0, Number(win?.innerHeight) || 0); } catch (_) { /* ignore */ }
    }
  }

  return {
    mount,
    emit,
    clear,
    resize,
    getCanvas: () => canvas,
    stats: () => ({ ...stats, active: activeCount, capacity: maxParticles, reducedMotion: reducedFlag(), hidden }),
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
