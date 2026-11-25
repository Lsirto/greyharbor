/**
 * src/ui-v2/audio/sound-map.mjs — pure engine-event → synth-voice mapping.
 *
 * No WebAudio, no DOM, no storage.  The audio engine consumes the voice ids
 * returned here; tests can verify complete event coverage and mute behaviour
 * without a browser.
 */

import { asObject } from '../utils.mjs';

/** Every voice the v2 WebAudio recipe table can synthesise. */
export const SOUND_VOICES = Object.freeze([
  'play', 'reveal', 'seal', 'corruption', 'sacrifice', 'nightEnd',
  'sanity', 'sanityZero', 'pass', 'leader', 'draw', 'gameOver',
  'nightStart', 'buff', 'ui-click', 'ui-hover', 'error',
]);

const V = Object.freeze(Object.fromEntries(SOUND_VOICES.map((name) => [name, name])));

/**
 * Every event type src/engine/v2 is able to emit, plus `sanityZero`, which the
 * atmosphere layer synthesises from a zero sanity value / gameOver reason.
 * Keeping the list here (rather than importing the engine) makes the mapping
 * a contract that a test can audit independently.
 */
export const ENGINE_EVENT_TYPES = Object.freeze([
  'gameStart', 'deal', 'firstPlayerCompensation', 'mulligan', 'handFlip',
  'play', 'playFromDeck', 'reveal', 'environmentPlay', 'locationPlay',
  'attach', 'leaderSkill', 'seal', 'sealLeader', 'sealRemoved', 'sealExpire',
  'sealBlocked', 'silverLanternReplace', 'leaderUnsealed', 'corruption',
  'corruptionRemoved', 'corruptionTick', 'sacrifice', 'cultEcho', 'backlash',
  'draw', 'sanityChange', 'sanityZero', 'nightStart', 'nightEnd', 'gameOver',
  'pass', 'peek', 'discard', 'abyssToHand', 'deckToHand', 'revealDeckTop',
  'shuffleDeck', 'auraAdded', 'auraExpired', 'buff', 'destroy', 'devour',
]);

/** One voice per event type; unknown types deliberately stay silent. */
export const EVENT_VOICE = Object.freeze({
  gameStart: V.nightStart,
  deal: V.draw,
  firstPlayerCompensation: V.draw,
  mulligan: V.draw,
  handFlip: V.reveal,
  play: V.play,
  playFromDeck: V.play,
  reveal: V.reveal,
  environmentPlay: V.play,
  locationPlay: V.play,
  attach: V.play,
  leaderSkill: V.leader,
  seal: V.seal,
  sealLeader: V.seal,
  sealRemoved: V.nightEnd,
  sealExpire: V.nightEnd,
  sealBlocked: V.error,
  silverLanternReplace: V.seal,
  leaderUnsealed: V.nightEnd,
  corruption: V.corruption,
  corruptionRemoved: V.nightEnd,
  corruptionTick: V.corruption,
  sacrifice: V.sacrifice,
  cultEcho: V.sacrifice,
  backlash: V.corruption,
  draw: V.draw,
  sanityChange: V.sanity,
  sanityZero: V.sanityZero,
  nightStart: V.nightStart,
  nightEnd: V.nightEnd,
  gameOver: V.gameOver,
  pass: V.pass,
  peek: V.reveal,
  discard: V.draw,
  abyssToHand: V.draw,
  deckToHand: V.draw,
  revealDeckTop: V.reveal,
  shuffleDeck: V.draw,
  auraAdded: V.buff,
  auraExpired: V.nightEnd,
  buff: V.buff,
  destroy: V.sacrifice,
  devour: V.sacrifice,
});

export const UI_SOUND_MAP = Object.freeze({ click: V['ui-click'], hover: V['ui-hover'] });

export const DEFAULT_AUDIO_SETTINGS = Object.freeze({
  enabled: true,
  muted: false,
  volume: 0.7,
});

/** Guard against a burst of events producing a wall of overlapping voices. */
export const MAX_VOICES_PER_BATCH = 4;

export function isMuted(settings) {
  const data = asObject(settings);
  return data.enabled === false || data.muted === true;
}

/** Map one typed event to a voice id, or null when it has no sound. */
export function voiceForEvent(event) {
  const data = asObject(event);
  if (typeof data.type !== 'string') return null;
  if (data.type === 'gameOver' && data.reason === 'sanity') return V.sanityZero;
  if (data.type === 'sanityChange') {
    const to = Number(data.to);
    if (Number.isFinite(to) && to <= 0) return V.sanityZero;
  }
  const voice = EVENT_VOICE[data.type];
  return SOUND_VOICES.includes(voice) ? voice : null;
}

export function voiceForUi(action) {
  const voice = UI_SOUND_MAP[action];
  return voice ?? null;
}

/**
 * De-duplicated, ordered voices for a batch of engine events.  Returns an
 * empty array when muted/disabled, before any audio object is consulted.
 */
export function resolveVoices(events, settings = DEFAULT_AUDIO_SETTINGS) {
  if (isMuted(settings)) return [];
  const voices = [];
  for (const event of Array.isArray(events) ? events : []) {
    const voice = voiceForEvent(event);
    if (voice && !voices.includes(voice)) voices.push(voice);
    if (voices.length >= MAX_VOICES_PER_BATCH) break;
  }
  return voices;
}

export default voiceForEvent;
