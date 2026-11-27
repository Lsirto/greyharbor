/**
 * src/ui-v2/audio/audio-engine.mjs — zero-asset WebAudio synthesis for v2.
 *
 * Design contract:
 *   - no audio files, no fetch, no Math.random (noise uses a seeded LCG);
 *   - nothing is audible before unlock(), which is driven by a user gesture;
 *   - master volume + DynamicsCompressor limiter keep peaks under control;
 *   - settings (muted / volume) persist in localStorage with a safe fallback;
 *   - every method tolerates a missing AudioContext and silently degrades.
 *
 * createAudioEngine({...}) accepts injected contextFactory/storage/window so
 * the whole graph is testable in Node without a browser.
 */

import { clamp, safeInt } from '../utils.mjs';
import { DEFAULT_AUDIO_SETTINGS, SOUND_VOICES } from './sound-map.mjs';

export const STORAGE_KEY = 'greyharbor.audio.settings.v2';

const RATE_LIMIT_MS = Object.freeze({
  'ui-hover': 70,
  'ui-click': 35,
  draw: 90,
  sanity: 90,
  play: 45,
});

/**
 * Declarative recipes: {kind:'tone'|'noise', ...}.  All gains are deliberately
 * small; the limiter catches the few overlapping cases that remain.
 */
const RECIPES = Object.freeze({
  'ui-click': [{ kind: 'tone', type: 'sine', from: 880, to: 620, dur: 0.08, gain: 0.1 }],
  'ui-hover': [{ kind: 'tone', type: 'sine', from: 1180, to: 1080, dur: 0.045, gain: 0.045 }],
  play: [
    { kind: 'tone', type: 'triangle', from: 240, to: 155, dur: 0.2, gain: 0.14 },
    { kind: 'tone', type: 'sine', from: 120, to: 78, dur: 0.22, gain: 0.07 },
    { kind: 'noise', dur: 0.14, gain: 0.05, filter: 1400 },
  ],
  reveal: [
    { kind: 'tone', type: 'sine', from: 660, to: 920, dur: 0.26, gain: 0.13 },
    { kind: 'tone', type: 'sine', from: 990, to: 1380, dur: 0.22, gain: 0.05, delay: 0.03 },
    { kind: 'noise', dur: 0.06, gain: 0.035, filter: 3600 },
  ],
  seal: [
    { kind: 'tone', type: 'sine', from: 440, to: 440, dur: 0.55, gain: 0.1 },
    { kind: 'tone', type: 'sine', from: 660, to: 660, dur: 0.42, gain: 0.075, delay: 0.05 },
    { kind: 'tone', type: 'sine', from: 220, to: 220, dur: 0.5, gain: 0.06 },
  ],
  corruption: [
    { kind: 'tone', type: 'sawtooth', from: 95, to: 62, dur: 0.42, gain: 0.08 },
    { kind: 'tone', type: 'sawtooth', from: 101, to: 66, dur: 0.42, gain: 0.04 },
    { kind: 'noise', dur: 0.3, gain: 0.06, filter: 520 },
  ],
  sacrifice: [
    { kind: 'tone', type: 'sine', from: 150, to: 68, dur: 0.5, gain: 0.14 },
    { kind: 'noise', dur: 0.4, gain: 0.05, filter: 900 },
  ],
  nightEnd: [
    { kind: 'tone', type: 'sine', from: 196, to: 196, dur: 0.5, gain: 0.06 },
    { kind: 'tone', type: 'sine', from: 392, to: 392, dur: 0.5, gain: 0.09 },
    { kind: 'tone', type: 'sine', from: 523, to: 523, dur: 0.5, gain: 0.08, delay: 0.07 },
    { kind: 'tone', type: 'sine', from: 659, to: 659, dur: 0.6, gain: 0.07, delay: 0.14 },
  ],
  nightStart: [{ kind: 'tone', type: 'sine', from: 523, to: 784, dur: 0.34, gain: 0.1 }],
  sanity: [{ kind: 'tone', type: 'sine', from: 720, to: 480, dur: 0.2, gain: 0.09 }],
  sanityZero: [
    { kind: 'noise', dur: 0.55, gain: 0.13, filter: 5200, highpass: true },
    { kind: 'tone', type: 'triangle', from: 900, to: 80, dur: 0.62, gain: 0.12 },
  ],
  pass: [{ kind: 'tone', type: 'triangle', from: 300, to: 175, dur: 0.11, gain: 0.1 }],
  leader: [
    { kind: 'tone', type: 'sawtooth', from: 175, to: 235, dur: 0.42, gain: 0.08 },
    { kind: 'tone', type: 'sine', from: 523, to: 784, dur: 0.5, gain: 0.07, delay: 0.08 },
  ],
  draw: [
    { kind: 'noise', dur: 0.1, gain: 0.05, filter: 2600, highpass: true },
    { kind: 'tone', type: 'sine', from: 880, to: 1100, dur: 0.08, gain: 0.035 },
  ],
  gameOver: [
    { kind: 'tone', type: 'sine', from: 196, to: 196, dur: 1.1, gain: 0.1 },
    { kind: 'tone', type: 'sine', from: 247, to: 247, dur: 1.0, gain: 0.08, delay: 0.09 },
    { kind: 'tone', type: 'sine', from: 294, to: 294, dur: 1.2, gain: 0.07, delay: 0.18 },
  ],
  buff: [
    { kind: 'tone', type: 'sine', from: 330, to: 660, dur: 0.3, gain: 0.08 },
    { kind: 'tone', type: 'sine', from: 495, to: 990, dur: 0.3, gain: 0.04, delay: 0.04 },
  ],
  error: [{ kind: 'tone', type: 'square', from: 165, to: 110, dur: 0.16, gain: 0.05 }],
});

/** Slow, dark pad chords for the synthesized background drone (Hz). */
const BGM_CHORDS = Object.freeze([
  [110.0, 130.81, 164.81],
  [98.0, 116.54, 146.83],
  [87.31, 103.83, 130.81],
  [103.83, 123.47, 155.56],
]);
const BGM_DRONE = Object.freeze([55.0, 82.41]);
const BGM_INTERVAL_MS = 8000;
const BGM_BUS_GAIN = 0.16;

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeStorage(provided) {
  if (provided !== undefined) return provided;
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) { return null; }
}

function readSettings(storage) {
  const base = { ...DEFAULT_AUDIO_SETTINGS };
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (typeof raw !== 'string') return base;
    const parsed = asObject(JSON.parse(raw));
    return {
      enabled: parsed.enabled !== false,
      muted: parsed.muted === true,
      volume: clamp(Number.isFinite(Number(parsed.volume)) ? Number(parsed.volume) : base.volume, 0, 1),
    };
  } catch (_) {
    return base;
  }
}

export function createAudioEngine(options = {}) {
  const opts = asObject(options);
  const storage = safeStorage(opts.storage);
  const win = opts.window ?? (typeof window !== 'undefined' ? window : null);
  let settings = readSettings(storage);
  let ctx = null;
  let master = null;
  let bus = null;
  let limiter = null;
  let noiseBuffer = null;
  let unlocked = false;
  let failed = false;
  let destroyed = false;
  let bgmBus = null;
  let bgmNodes = [];
  let bgmTimer = null;
  let bgmStarted = false;
  let bgmChordIndex = 0;
  let padNodes = [];
  const lastPlayed = new Map();
  const listeners = [];
  const now = typeof opts.now === 'function' ? opts.now : () => Date.now();
  let rngState = (safeInt(opts.seed, 0x5eed1234) >>> 0) || 0x9e3779b9;

  function nextRandom() {
    rngState = (Math.imul(1664525, rngState) + 1013904223) >>> 0;
    return rngState / 4294967296;
  }

  function persist() {
    try { storage?.setItem?.(STORAGE_KEY, JSON.stringify(settings)); } catch (_) { /* private mode */ }
  }

  function ensureContext() {
    if (ctx || failed || destroyed) return ctx;
    const Ctor = opts.contextFactory
      ?? globalThis.AudioContext
      ?? globalThis.webkitAudioContext
      ?? null;
    if (typeof Ctor !== 'function') {
      failed = true;
      return null;
    }
    try {
      ctx = new Ctor({ latencyHint: 'interactive' });
      bus = ctx.createGain();
      master = ctx.createGain();
      if (typeof ctx.createDynamicsCompressor === 'function') {
        limiter = ctx.createDynamicsCompressor();
        if (limiter.threshold) limiter.threshold.value = -14;
        if (limiter.knee) limiter.knee.value = 8;
        if (limiter.ratio) limiter.ratio.value = 8;
        if (limiter.attack) limiter.attack.value = 0.004;
        if (limiter.release) limiter.release.value = 0.16;
        master.connect(limiter);
        limiter.connect(ctx.destination);
      } else {
        master.connect(ctx.destination);
      }
      bus.connect(master);
      applyVolume();
    } catch (_) {
      failed = true;
      ctx = null;
      bus = null;
      master = null;
      limiter = null;
    }
    return ctx;
  }

  function applyVolume() {
    if (!master?.gain) return;
    const value = settings.muted ? 0 : clamp(settings.volume, 0, 1) * 0.8;
    try {
      master.gain.setValueAtTime(value, ctx?.currentTime ?? 0);
    } catch (_) {
      try { master.gain.value = value; } catch (__) { /* ignore */ }
    }
  }

  function getNoiseBuffer(context) {
    if (noiseBuffer) return noiseBuffer;
    if (typeof context.createBuffer !== 'function') return null;
    try {
      const rate = Number(context.sampleRate) || 44100;
      noiseBuffer = context.createBuffer(1, Math.max(1, Math.floor(rate * 0.8)), rate);
      const channel = noiseBuffer.getChannelData?.(0);
      if (channel) {
        for (let i = 0; i < channel.length; i += 1) channel[i] = nextRandom() * 2 - 1;
      }
    } catch (_) {
      noiseBuffer = null;
    }
    return noiseBuffer;
  }

  function envelope(gain, start, peak, duration) {
    if (!gain?.setValueAtTime) return;
    gain.setValueAtTime(0.0001, start);
    if (gain.linearRampToValueAtTime) gain.linearRampToValueAtTime(Math.max(0.0002, peak), start + 0.012);
    if (gain.exponentialRampToValueAtTime) {
      gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.02, duration));
    } else if (gain.linearRampToValueAtTime) {
      gain.linearRampToValueAtTime(0.0001, start + Math.max(0.02, duration));
    }
  }

  function renderStep(step, t0) {
    if (!ctx || !bus) return;
    const start = t0 + clamp(Number(step.delay) || 0, 0, 2);
    const duration = clamp(Number(step.dur) || 0.1, 0.02, 2);
    const peak = clamp(Number(step.gain) || 0.05, 0, 0.2);
    if (step.kind === 'tone') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = step.type || 'sine';
      osc.frequency.setValueAtTime(Math.max(20, Number(step.from) || 440), start);
      if (osc.frequency.exponentialRampToValueAtTime) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, Number(step.to) || step.from || 440), start + duration);
      }
      envelope(gain.gain, start, peak, duration);
      osc.connect(gain);
      gain.connect(bus);
      osc.start(start);
      osc.stop(start + duration + 0.03);
    } else if (step.kind === 'noise') {
      const buffer = getNoiseBuffer(ctx);
      if (!buffer) return;
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = buffer;
      filter.type = step.highpass ? 'highpass' : 'lowpass';
      filter.frequency.setValueAtTime(Math.max(60, Number(step.filter) || 1200), start);
      envelope(gain.gain, start, peak, duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      source.start(start);
      source.stop(start + duration + 0.03);
    }
  }

  function silentTick() {
    if (!ctx || typeof ctx.createBuffer !== 'function') return;
    try {
      const buffer = ctx.createBuffer(1, 1, Number(ctx.sampleRate) || 44100);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (_) { /* some fakes only implement the graph, not buffers */ }
  }

  function stopPad() {
    for (const node of padNodes) {
      try { node.osc?.stop?.(); } catch (_) { /* already stopped */ }
      try { node.gain?.disconnect?.(); } catch (_) { /* ignore */ }
    }
    padNodes = [];
  }

  function playBgmChord() {
    if (!ctx || !bgmBus) return;
    const chord = BGM_CHORDS[bgmChordIndex % BGM_CHORDS.length];
    bgmChordIndex += 1;
    const t0 = Number(ctx.currentTime) || 0;
    stopPad();
    for (const freq of chord) {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(0.05, t0 + 2.5);
        gain.gain.linearRampToValueAtTime(0.0001, t0 + 7.5);
        osc.connect(gain);
        gain.connect(bgmBus);
        osc.start(t0);
        osc.stop(t0 + 8);
        padNodes.push({ osc, gain });
      } catch (_) { /* fake context may lack a node */ }
    }
  }

  function stopBgm() {
    try { if (bgmTimer !== null) clearInterval(bgmTimer); } catch (_) { /* ignore */ }
    bgmTimer = null;
    stopPad();
    for (const node of bgmNodes) {
      try { node.osc?.stop?.(); } catch (_) { /* ignore */ }
      try { node.gain?.disconnect?.(); } catch (_) { /* ignore */ }
    }
    bgmNodes = [];
    try { bgmBus?.disconnect?.(); } catch (_) { /* ignore */ }
    bgmBus = null;
    bgmStarted = false;
  }

  function startBgm() {
    if (bgmStarted || destroyed || !ctx || failed) return;
    try {
      bgmBus = ctx.createGain();
      bgmBus.gain.value = BGM_BUS_GAIN;
      bgmBus.connect(master);
      for (const freq of BGM_DRONE) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, Number(ctx.currentTime) || 0);
        gain.gain.setValueAtTime(0.035, Number(ctx.currentTime) || 0);
        osc.connect(gain);
        gain.connect(bgmBus);
        osc.start();
        bgmNodes.push({ osc, gain });
      }
      playBgmChord();
      bgmTimer = setInterval(playBgmChord, BGM_INTERVAL_MS);
      bgmStarted = true;
    } catch (_) {
      stopBgm();
    }
  }

  function isReady() {
    return !destroyed && unlocked && !!ctx && ctx.state !== 'suspended' && ctx.state !== 'closed';
  }

  function unlock() {
    if (destroyed || failed) return false;
    const context = ensureContext();
    if (!context) return false;
    try {
      const result = context.resume?.();
      if (result && typeof result.then === 'function') result.catch?.(() => { failed = true; });
    } catch (_) { /* an already-running context may reject resume */ }
    unlocked = true;
    silentTick();
    startBgm();
    return true;
  }

  function play(voice, config = {}) {
    if (!isReady() || settings.muted || settings.enabled === false) return false;
    if (!SOUND_VOICES.includes(voice)) return false;
    const recipe = RECIPES[voice] ?? RECIPES['ui-click'];
    const t = now();
    const limit = RATE_LIMIT_MS[voice] ?? 0;
    if (t - (lastPlayed.get(voice) ?? -Infinity) < limit) return false;
    try {
      const t0 = (ctx.currentTime ?? 0) + 0.002;
      for (const step of recipe) renderStep(step, t0);
      lastPlayed.set(voice, t);
      return true;
    } catch (_) {
      return false;
    }
  }

  function listen(target, type, handler) {
    if (!target || typeof target.addEventListener !== 'function') return;
    try {
      target.addEventListener(type, handler);
      listeners.push(() => { try { target.removeEventListener(type, handler); } catch (_) { /* ignore */ } });
    } catch (_) { /* ignore */ }
  }

  function installUnlock(target = win) {
    if (!target || typeof target.addEventListener !== 'function') return () => {};
    const events = ['pointerdown', 'keydown', 'touchstart'];
    const handler = () => {
      if (unlock()) remove();
    };
    const remove = () => {
      for (const type of events) {
        try { target.removeEventListener(type, handler, true); } catch (_) { /* ignore */ }
      }
    };
    for (const type of events) {
      try { target.addEventListener(type, handler, true); } catch (_) { /* ignore */ }
    }
    listeners.push(remove);
    return remove;
  }

  if (win) {
    listen(win, 'blur', () => { try { ctx?.suspend?.(); } catch (_) { /* ignore */ } });
    listen(win, 'focus', () => {
      if (unlocked) { try { ctx?.resume?.(); } catch (_) { /* ignore */ } }
    });
  }

  return {
    init: unlock,
    unlock,
    installUnlock,
    play,
    getSettings: () => ({ ...settings }),
    isUnlocked: () => unlocked && !failed,
    isMuted: () => settings.muted || settings.enabled === false,
    setMuted(value) {
      settings = { ...settings, muted: value === true };
      applyVolume();
      persist();
      return settings.muted;
    },
    setVolume(value) {
      settings = { ...settings, volume: clamp(Number(value), 0, 1) };
      applyVolume();
      persist();
      return settings.volume;
    },
    stats: () => ({ unlocked, failed, destroyed, voices: SOUND_VOICES.length, recipes: Object.keys(RECIPES).length, bgm: bgmStarted }),
    destroy() {
      destroyed = true;
      stopBgm();
      for (const off of listeners) off();
      listeners.length = 0;
      try { ctx?.close?.(); } catch (_) { /* ignore */ }
      ctx = null;
      bus = null;
      master = null;
      limiter = null;
      noiseBuffer = null;
    },
  };
}

/** Browser singleton.  Creating it never touches audio hardware. */
export const audio = createAudioEngine();

export default audio;
