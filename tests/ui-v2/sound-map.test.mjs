/**
 * tests/ui-v2/sound-map.test.mjs — pure event → voice mapping tests.
 * Audits complete engine-event coverage and mute behaviour without WebAudio.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_AUDIO_SETTINGS,
  ENGINE_EVENT_TYPES,
  EVENT_VOICE,
  MAX_VOICES_PER_BATCH,
  SOUND_VOICES,
  isMuted,
  resolveVoices,
  voiceForEvent,
  voiceForUi,
} from '../../src/ui-v2/audio/sound-map.mjs';

const REQUIRED_VOICES = [
  'play', 'reveal', 'seal', 'sacrifice', 'nightEnd', 'sanityZero',
  'pass', 'leader', 'ui-click', 'ui-hover',
];

test('阶段 3.4 要求的音色全部存在', () => {
  for (const voice of REQUIRED_VOICES) {
    assert.ok(SOUND_VOICES.includes(voice), `缺少音色：${voice}`);
  }
});

test('引擎事件全覆盖：每种事件都映射到受支持的音色', () => {
  for (const type of ENGINE_EVENT_TYPES) {
    assert.ok(Object.hasOwn(EVENT_VOICE, type), `事件未登记：${type}`);
    const voice = voiceForEvent({ type });
    assert.ok(voice !== null, `事件无音色：${type}`);
    assert.ok(SOUND_VOICES.includes(voice), `未知音色：${type} → ${voice}`);
  }
});

test('理智归零与理智归零终局映射到碎裂音色', () => {
  assert.equal(voiceForEvent({ type: 'sanityChange', player: 0, from: 1, to: 0 }), 'sanityZero');
  assert.equal(voiceForEvent({ type: 'gameOver', reason: 'sanity', winner: 1 }), 'sanityZero');
  assert.equal(voiceForEvent({ type: 'gameOver', reason: 'nightWins' }), 'gameOver');
  assert.equal(voiceForEvent({ type: 'sanityChange', from: 4, to: 3 }), 'sanity');
});

test('未知事件与畸形数据保持静默', () => {
  assert.equal(voiceForEvent({ type: 'not-a-real-event' }), null);
  assert.equal(voiceForEvent(null), null);
  assert.equal(voiceForEvent({ type: 42 }), null);
});

test('UI 点击/悬停映射固定', () => {
  assert.equal(voiceForUi('click'), 'ui-click');
  assert.equal(voiceForUi('hover'), 'ui-hover');
  assert.equal(voiceForUi('unknown'), null);
});

test('批次映射去重、保序并受上限约束', () => {
  const voices = resolveVoices([
    { type: 'play' }, { type: 'play' }, { type: 'sanityChange', from: 1, to: 0 },
    { type: 'gameOver', reason: 'nightWins' }, { type: 'nightEnd' }, { type: 'pass' },
  ]);
  assert.deepEqual(voices, ['play', 'sanityZero', 'gameOver', 'nightEnd']);
  const many = Array.from({ length: 12 }, (_, i) => ({ type: i === 0 ? 'play' : `e${i}` }));
  assert.equal(resolveVoices(many).length, 1);
  assert.ok(MAX_VOICES_PER_BATCH >= 1);
});

test('静音默认语义：设置默认未静音，但静音/禁用时零声音', () => {
  assert.equal(DEFAULT_AUDIO_SETTINGS.muted, false);
  assert.equal(DEFAULT_AUDIO_SETTINGS.enabled, true);
  assert.equal(isMuted(DEFAULT_AUDIO_SETTINGS), false);
  assert.deepEqual(resolveVoices([{ type: 'play' }], { muted: true }), []);
  assert.deepEqual(resolveVoices([{ type: 'play' }], { enabled: false }), []);
  assert.deepEqual(resolveVoices([{ type: 'play' }], null), ['play']);
});
