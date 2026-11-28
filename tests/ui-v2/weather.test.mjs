/**
 * tests/ui-v2/weather.test.mjs — full-screen ambient weather tests.
 *
 * Covers the persistent ambient layer (rain / fog / corruption) that shares
 * the particle canvas and rAF loop: particle counts, mode switching,
 * reduced-motion suppression, edge wrapping and the view → mode mapping.
 *
 * Self-contained injectable doubles; no jsdom, no external dependencies.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createParticles, WEATHER_MODES } from '../../src/ui-v2/fx/particles.mjs';
import {
  createFxController,
  weatherForView,
  countCorruption,
  WEATHER_CORRUPTION_FOG,
  WEATHER_CORRUPTION_HEAVY,
} from '../../src/ui-v2/fx/fx-controller.mjs';

// ── injectable doubles ─────────────────────────────────────────────────

function fakeCtx() {
  return {
    globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1,
    setTransform() {}, clearRect() {}, beginPath() {}, arc() {}, fill() {},
    save() {}, restore() {}, translate() {}, rotate() {},
    fillRect() {}, strokeRect() {}, moveTo() {}, lineTo() {}, stroke() {},
  };
}

function fakeCanvas() {
  return { width: 0, height: 0, style: {}, parentNode: null, getContext: () => fakeCtx(), setAttribute() {} };
}

function fakeWindow(overrides = {}) {
  return {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {},
    matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} }; },
    ...overrides,
  };
}

function fakeDocument() {
  return {
    hidden: false,
    body: { appendChild() {}, removeChild() {} },
    createElement: () => fakeCanvas(),
    addEventListener() {},
    removeEventListener() {},
  };
}

function fakeRoot() {
  return {
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
}

// ── mode switching and ambient counts ──────────────────────────────────

test('setWeather 构建对应数量的持续粒子，stats 与 getWeather 反映模式', () => {
  const particles = createParticles({
    document: fakeDocument(),
    window: fakeWindow(),
    canvas: fakeCanvas(),
    rng: () => 0.4,
  });
  particles.mount();

  assert.deepEqual(WEATHER_MODES, ['rain', 'fog', 'corruption']);

  particles.setWeather('rain');
  assert.equal(particles.getWeather(), 'rain');
  assert.equal(particles.stats().weather, 'rain');
  assert.equal(particles.stats().ambient, 70);

  particles.setWeather('fog');
  assert.equal(particles.getWeather(), 'fog');
  assert.equal(particles.stats().ambient, 26);

  particles.setWeather('corruption');
  assert.equal(particles.getWeather(), 'corruption');
  assert.equal(particles.stats().ambient, 46);

  particles.destroy();
});

test('null 与非法模式停止天气，重复设置同一模式为幂等 no-op', () => {
  const particles = createParticles({
    document: fakeDocument(),
    window: fakeWindow(),
    canvas: fakeCanvas(),
    rng: () => 0.3,
  });
  particles.mount();

  particles.setWeather('rain');
  assert.equal(particles.stats().ambient, 70);

  particles.setWeather('hail');
  assert.equal(particles.getWeather(), null);
  assert.equal(particles.stats().ambient, 0);

  particles.setWeather('fog');
  const before = particles.stats().frames;
  particles.setWeather('fog');
  assert.equal(particles.stats().frames, before, '相同模式不应重建或额外推进');

  particles.setWeather(null);
  assert.equal(particles.getWeather(), null);
  particles.destroy();
});

test('reduced-motion 下天气不激活（不产生 ambient 粒子）', () => {
  const particles = createParticles({
    document: fakeDocument(),
    window: fakeWindow(),
    canvas: fakeCanvas(),
    isReducedMotion: () => true,
  });
  particles.mount();

  assert.equal(particles.setWeather('rain'), null);
  assert.equal(particles.getWeather(), null);
  assert.equal(particles.stats().ambient, 0);
  assert.equal(particles.stats().reducedMotion, true);
  particles.destroy();
});

// ── rAF-driven drawing and edge wrapping ───────────────────────────────

test('雨丝持续绘制，飞出底边后回绕到顶部且不抛错', () => {
  let frameCb = null;
  const win = fakeWindow({
    requestAnimationFrame: (cb) => { frameCb = cb; return 1; },
    cancelAnimationFrame: () => {},
  });
  const particles = createParticles({
    document: fakeDocument(),
    window: win,
    canvas: fakeCanvas(),
    rng: () => 0.35,
  });
  particles.mount();
  particles.setWeather('rain');
  assert.equal(typeof frameCb, 'function');

  // Drive enough frames for the fastest drops to cross the 600px viewport and
  // wrap back to the top. Each frame advances the timestamp by 16ms.
  let ts = 16;
  assert.doesNotThrow(() => {
    for (let i = 0; i < 120; i += 1) {
      const cb = frameCb;
      frameCb = null;
      cb(ts);
      ts += 16;
    }
  });
  assert.ok(particles.stats().frames > 0);
  assert.equal(particles.getWeather(), 'rain', '回绕后天气层依然存活');
  assert.equal(particles.stats().ambient, 70);
  particles.destroy();
});

// ── view → weather mapping (pure function) ─────────────────────────────

function makeView(corruption) {
  const unit = { uid: 'u1', corruption };
  return {
    phase: 'play',
    night: 1,
    players: [
      { board: { scene: [unit], archive: [] } },
      { board: { scene: [], archive: [] } },
    ],
  };
}

test('countCorruption 汇总全场腐化 token，weatherForView 按阈值分档', () => {
  assert.equal(countCorruption(makeView(0)), 0);
  assert.equal(countCorruption(makeView(3)), 3);
  assert.equal(WEATHER_CORRUPTION_FOG, 1);
  assert.equal(WEATHER_CORRUPTION_HEAVY, 4);

  assert.equal(weatherForView(makeView(0)), 'rain');
  assert.equal(weatherForView(makeView(1)), 'fog');
  assert.equal(weatherForView(makeView(3)), 'fog');
  assert.equal(weatherForView(makeView(4)), 'corruption');
  assert.equal(weatherForView(makeView(9)), 'corruption');
});

test('weatherForView 对空/无玩家 view 返回 null', () => {
  assert.equal(weatherForView(null), null);
  assert.equal(weatherForView({}), null);
  assert.equal(weatherForView({ players: [] }), null);
});

// ── controller integration ─────────────────────────────────────────────

test('fx-controller 每次渲染后把天气同步到当前腐化程度', () => {
  const fx = createFxController({
    boardRoot: fakeRoot(),
    controlsRoot: fakeRoot(),
    document: fakeDocument(),
    window: fakeWindow(),
    canvas: fakeCanvas(),
    rng: () => 0.4,
  });

  fx.handleView(makeView(0));
  assert.equal(fx.particles.getWeather(), 'rain');

  fx.handleView(makeView(2));
  assert.equal(fx.particles.getWeather(), 'fog');

  fx.handleView(makeView(5));
  assert.equal(fx.particles.getWeather(), 'corruption');

  fx.destroy();
  assert.equal(fx.particles.getWeather(), null);
});
