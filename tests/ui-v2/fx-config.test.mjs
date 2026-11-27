/**
 * tests/ui-v2/fx-config.test.mjs — injected fake DOM / fake AudioContext tests
 * for the atmosphere configuration: particle cap, reduced-motion switch,
 * animation timeout fallback, audio unlock/mute and the controller hooks.
 *
 * No jsdom, no browser APIs at module scope, no external dependencies.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createDomAnimations, FX_CLASSES } from '../../src/ui-v2/fx/dom-animations.mjs';
import { createParticles, PARTICLE_LIMIT } from '../../src/ui-v2/fx/particles.mjs';
import { createFxController } from '../../src/ui-v2/fx/fx-controller.mjs';
import { createAudioEngine, STORAGE_KEY } from '../../src/ui-v2/audio/audio-engine.mjs';

// ── minimal injectable doubles ─────────────────────────────────────────

function fakeClassList() {
  const set = new Set();
  return {
    set,
    add(...names) { for (const name of names) set.add(name); },
    remove(...names) { for (const name of names) set.delete(name); },
    contains(name) { return set.has(name); },
  };
}

function fakeElement(attrs = {}) {
  const classList = fakeClassList();
  return {
    classList,
    dataset: attrs,
    style: {},
    textContent: '',
    parentNode: null,
    get classes() { return classList.set; },
    getAttribute(name) { return attrs[name] ?? null; },
    setAttribute(name, value) { attrs[name] = value; },
    getBoundingClientRect() { return { left: 12, top: 34, width: 60, height: 80 }; },
    appendChild(child) { child.parentNode = this; },
    removeChild(child) { child.parentNode = null; },
  };
}

function fakeRoot(elements = []) {
  return {
    elements,
    querySelectorAll(selector) {
      const uid = /^\[data-uid="(.+)"\]$/.exec(selector)?.[1];
      if (uid !== undefined) return elements.filter((el) => el.dataset.uid === uid);
      if (selector.includes('[data-night]')) return elements.filter((el) => el.dataset.night !== undefined);
      const player = /\[data-player="(\d+)"\]/.exec(selector)?.[1];
      if (player !== undefined) {
        return elements.filter((el) => String(el.dataset.player) === player
          && (el.dataset.sanity !== undefined
            || el.classList.contains('gh2-player-bar')
            || el.classList.contains('gh2-objective')));
      }
      const cls = /^\.([\w-]+)$/.exec(selector)?.[1];
      if (cls) return elements.filter((el) => el.classList.contains(cls));
      return [];
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
    appendChild(el) { elements.push(el); el.parentNode = this; },
    removeChild(el) {
      const index = elements.indexOf(el);
      if (index >= 0) elements.splice(index, 1);
      el.parentNode = null;
    },
    addEventListener() {},
    removeEventListener() {},
  };
}

function fakeCtx() {
  return {
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    setTransform() {}, clearRect() {}, beginPath() {}, arc() {}, fill() {},
    save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {}, strokeRect() {},
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
  const body = { appendChild() {}, removeChild() {} };
  return {
    hidden: false,
    body,
    createElement(tag) {
      return tag === 'canvas' ? fakeCanvas() : fakeElement();
    },
    addEventListener() {},
    removeEventListener() {},
  };
}

// ── particles ──────────────────────────────────────────────────────────

test('粒子池上限为 300，发射不会溢出（无 Math.random，rng 可注入）', () => {
  const particles = createParticles({
    document: fakeDocument(),
    window: fakeWindow(),
    canvas: fakeCanvas(),
    rng: () => 0.42,
  });
  particles.mount();
  assert.equal(PARTICLE_LIMIT, 300);
  assert.equal(particles.stats().capacity, 300);
  const spawned = particles.emit('play', { x: 40, y: 40 }, { count: 1000 });
  assert.ok(spawned > 0 && spawned <= PARTICLE_LIMIT);
  assert.equal(particles.emit('play', { x: 40, y: 40 }, { count: 10 }), 0);
  assert.ok(particles.stats().active <= PARTICLE_LIMIT);
  assert.ok(particles.stats().emitted <= PARTICLE_LIMIT);
  particles.destroy();
});

test('reduced-motion 与页面隐藏时粒子零发射', () => {
  const doc = fakeDocument();
  const reduced = createParticles({
    document: doc,
    window: fakeWindow(),
    canvas: fakeCanvas(),
    isReducedMotion: () => true,
  });
  reduced.mount();
  assert.equal(reduced.emit('sanityZero', { x: 10, y: 10 }, { count: 40 }), 0);
  assert.ok(reduced.stats().skipped > 0);
  assert.equal(reduced.stats().active, 0);

  doc.hidden = true;
  const hidden = createParticles({
    document: doc,
    window: fakeWindow(),
    canvas: fakeCanvas(),
    rng: () => 0.5,
  });
  hidden.mount();
  assert.equal(hidden.emit('seal', { x: 10, y: 10 }), 0);
  assert.equal(hidden.stats().hidden, true);
  reduced.destroy();
  hidden.destroy();
});

// ── dom animations ─────────────────────────────────────────────────────

test('DOM 动画加临时类，并由定时器兜底清理', () => {
  const card = fakeElement({ uid: 'u1' });
  const night = fakeElement({ night: '1' });
  const root = fakeRoot([card, night]);
  const timers = [];
  const animations = createDomAnimations({
    root,
    document: fakeDocument(),
    schedule(fn) { timers.push(fn); return timers.length; },
    cancel() {},
    isReducedMotion: () => false,
  });
  animations.apply({
    entered: ['u1'], flipped: [{ uid: 'u1', from: 'reason', to: 'madness' }],
    sealed: ['u1'], corrupted: [{ uid: 'u1', added: 1 }],
    sanity: [{ player: 0, to: 2 }], nightChanged: true, gameOver: true,
  });
  for (const name of [FX_CLASSES.enter, FX_CLASSES.flip, FX_CLASSES.seal, FX_CLASSES.corrupt]) {
    assert.ok(card.classList.contains(name), `缺少动画类：${name}`);
  }
  assert.ok(night.classList.contains(FX_CLASSES.night));
  assert.ok(root.elements.some((el) => String(el.className ?? '').includes(FX_CLASSES.banner)));

  for (const timer of timers) timer();
  for (const name of Object.values(FX_CLASSES)) assert.equal(card.classList.contains(name), false);
  animations.destroy();
});

test('目标增益在非降级模式施加 is-gained 脉冲类，定时器兜底清理', () => {
  const objective = fakeElement({ player: 0 });
  objective.classList.add('gh2-objective');
  const root = fakeRoot([objective]);
  const timers = [];
  const animations = createDomAnimations({
    root,
    document: fakeDocument(),
    schedule(fn) { timers.push(fn); return timers.length; },
    cancel() {},
    isReducedMotion: () => false,
  });
  animations.apply({ objectives: [{ player: 0, from: 0, to: 1, delta: 1 }] });
  assert.ok(objective.classList.contains(FX_CLASSES.objective), '缺少目标脉冲类 is-gained');

  for (const timer of timers) timer();
  assert.equal(objective.classList.contains(FX_CLASSES.objective), false);
  animations.destroy();
});

test('reduced-motion 降级为淡入，不施加翻面/脉冲/符文类', () => {
  const card = fakeElement({ uid: 'u1' });
  const objective = fakeElement({ player: 0 });
  objective.classList.add('gh2-objective');
  const root = fakeRoot([card, objective]);
  const animations = createDomAnimations({
    root,
    document: fakeDocument(),
    schedule(fn) { fn(); return 1; },
    cancel() {},
    isReducedMotion: () => true,
  });
  animations.apply({
    entered: ['u1'], flipped: [{ uid: 'u1' }], sealed: ['u1'],
    corrupted: [{ uid: 'u1' }], sanity: [{ player: 0 }],
    objectives: [{ player: 0, from: 0, to: 1 }],
    nightChanged: true, gameOver: false,
  });
  assert.equal(card.classList.contains(FX_CLASSES.enter), false);
  assert.equal(card.classList.contains(FX_CLASSES.flip), false);
  assert.equal(card.classList.contains(FX_CLASSES.seal), false);
  assert.equal(card.classList.contains(FX_CLASSES.corrupt), false);
  assert.equal(objective.classList.contains(FX_CLASSES.objective), false, '降级时不施加目标脉冲');
  animations.destroy();
});

// ── audio engine ────────────────────────────────────────────────────────

class FakeParam {
  constructor() { this.value = 0; }
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
}

class FakeContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = { connect() {} };
    this.oscillators = 0;
  }
  createGain() { return { gain: new FakeParam(), connect() {} }; }
  createDynamicsCompressor() {
    return {
      threshold: new FakeParam(), knee: new FakeParam(), ratio: new FakeParam(),
      attack: new FakeParam(), release: new FakeParam(), connect() {},
    };
  }
  createOscillator() {
    this.oscillators += 1;
    return { type: 'sine', frequency: new FakeParam(), connect() {}, start() {}, stop() {} };
  }
  createBiquadFilter() { return { type: '', frequency: new FakeParam(), connect() {} }; }
  createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {} }; }
  createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    map,
  };
}

test('音频默认静默：unlock 前不发声，unlock 后可合成，静音持久化', () => {
  const storage = fakeStorage();
  let clock = 1000;
  const audio = createAudioEngine({
    contextFactory: FakeContext,
    storage,
    window: null,
    now: () => clock,
  });
  assert.equal(audio.play('play'), false, '首次手势前必须静默');
  assert.equal(audio.unlock(), true);
  assert.equal(audio.isUnlocked(), true);
  assert.equal(audio.stats().bgm, true, 'unlock 后启动循环背景音乐');
  assert.equal(audio.play('play'), true);
  assert.equal(audio.play('play'), false, '同一音色的限流应生效');
  clock += 200;
  assert.equal(audio.play('play'), true);

  assert.equal(audio.setMuted(true), true);
  assert.equal(audio.play('play'), false);
  assert.equal(audio.getSettings().muted, true);
  assert.ok(JSON.parse(storage.map.get(STORAGE_KEY)).muted === true);
  assert.equal(audio.setVolume(3), 1);
  assert.equal(audio.setVolume(-1), 0);
  audio.destroy();
  assert.equal(audio.play('play'), false);
  assert.equal(audio.stats().bgm, false, 'destroy 后停止背景音乐并清理定时器');
});

test('无 AudioContext 时音频降级为静默而不抛异常', () => {
  const audio = createAudioEngine({ contextFactory: undefined, storage: fakeStorage(), window: null });
  assert.doesNotThrow(() => audio.unlock());
  assert.equal(audio.play('play'), false);
  assert.equal(audio.isUnlocked(), false);
  audio.destroy();
});

// ── fx controller hooks ────────────────────────────────────────────────

function fakeAudio() {
  const played = [];
  let muted = false;
  return {
    played,
    installUnlock() { return () => {}; },
    getSettings: () => ({ muted, enabled: true, volume: 0.7 }),
    setMuted(value) { muted = value === true; return muted; },
    play(voice) { played.push(voice); return true; },
    stats: () => ({ unlocked: true, muted }),
  };
}

function view(cardFace = 'reason') {
  const card = { uid: 'u1', face: cardFace, sealed: false, corruption: 0 };
  return {
    phase: 'play', night: 1,
    players: [
      { sanity: 6, hand: [{ ...card, face: cardFace }], board: { scene: [card], archive: [], dream: [] } },
      { sanity: 6, hand: [], board: { scene: [], archive: [], dream: [] } },
    ],
    environments: [],
  };
}

test('fx-controller 的 hooks 串起视图 diff 与事件音色', () => {
  const card = fakeElement({ uid: 'u1', player: 0, sanity: '6' });
  const root = fakeRoot([card]);
  const controls = fakeRoot([]);
  const audio = fakeAudio();
  const fx = createFxController({
    boardRoot: root,
    controlsRoot: controls,
    document: fakeDocument(),
    window: fakeWindow(),
    canvas: fakeCanvas(),
    audio,
    rng: () => 0.5,
  });
  fx.hooks.afterPaint({ view: view('reason') });
  fx.hooks.afterPaint({ view: view('madness') });
  assert.ok(card.classList.contains(FX_CLASSES.flip));
  assert.ok(fx.stats().animations.classes > 0);

  fx.hooks.onEvents({ events: [
    { type: 'play', uid: 'u1' }, { type: 'play', uid: 'u1' },
    { type: 'seal', uid: 'u1' }, { type: 'nightEnd', night: 1 },
  ], who: '你' });
  assert.deepEqual(audio.played, ['play', 'seal', 'nightEnd']);

  fx.hooks.onMuteToggle(true);
  assert.equal(fx.hooks.getAudioStatus().muted, true);
  assert.doesNotThrow(() => fx.destroy());
  assert.equal(audio.getSettings().muted, true);
});

test('钩子中的异常不会向外抛出', () => {
  const fx = createFxController({
    boardRoot: fakeRoot([]),
    controlsRoot: fakeRoot([]),
    document: fakeDocument(),
    window: fakeWindow(),
    canvas: fakeCanvas(),
    audio: {
      installUnlock() { throw new Error('boom'); },
      getSettings() { throw new Error('boom'); },
      play() { throw new Error('boom'); },
      setMuted() { throw new Error('boom'); },
    },
  });
  assert.doesNotThrow(() => fx.hooks.afterPaint({ view: view() }));
  assert.doesNotThrow(() => fx.hooks.onEvents({ events: [{ type: 'play' }] }));
  assert.doesNotThrow(() => fx.hooks.onMuteToggle(true));
  fx.destroy();
});
