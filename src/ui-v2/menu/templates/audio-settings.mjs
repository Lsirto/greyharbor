/**
 * src/ui-v2/menu/templates/audio-settings.mjs — 声音设置浮层（纯模板，无 DOM）。
 * 音效与背景音乐各自独立开关、独立音量；数值由调用方传入。
 */

import { escapeHtml } from '../../utils.mjs';

function toPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 70;
  return Math.max(0, Math.min(100, Math.round(num * 100)));
}

function renderRow({ kind, title, hint, enabled, volume }) {
  const percent = toPercent(volume);
  return `
      <div class="gh2-audio__row">
        <div class="gh2-audio__row-head">
          <span class="gh2-audio__label">${escapeHtml(title)}</span>
          <button type="button" class="gh2-audio__toggle${enabled ? ' is-on' : ''}"
                  data-audio-toggle="${kind}" aria-pressed="${enabled ? 'true' : 'false'}">
            ${enabled ? '已开启' : '已关闭'}
          </button>
        </div>
        <input type="range" class="gh2-audio__slider" min="0" max="100" step="1"
               value="${percent}" data-audio-volume="${kind}"
               aria-label="${escapeHtml(title)}音量"${enabled ? '' : ' disabled'}>
        <p class="gh2-audio__hint">${escapeHtml(hint)}</p>
      </div>`;
}

/** @param {{muted?: boolean, enabled?: boolean, sfxEnabled?: boolean, volume?: number, bgmEnabled?: boolean, bgmVolume?: number}} settings */
export function renderAudioSettings(settings = {}) {
  const s = settings && typeof settings === 'object' ? settings : {};
  const allMuted = s.muted === true || s.enabled === false;
  const sfxEnabled = !allMuted && s.sfxEnabled !== false;
  const bgmEnabled = !allMuted && s.bgmEnabled !== false;
  return `<div class="gh2-audio-overlay" data-audio-layer>
    <div class="gh2-audio-modal" role="dialog" aria-modal="true" aria-label="声音设置">
      <header class="gh2-audio__top">
        <h2>声音设置</h2>
        <button type="button" class="gh2-audio__close" data-audio-close aria-label="关闭设置">✕</button>
      </header>${renderRow({
        kind: 'sfx',
        title: '音效',
        hint: '出牌、攻击与界面操作的提示音',
        enabled: sfxEnabled,
        volume: s.volume,
      })}${renderRow({
        kind: 'bgm',
        title: '背景音乐',
        hint: '循环播放的暗黑氛围配乐',
        enabled: bgmEnabled,
        volume: s.bgmVolume,
      })}
    </div>
  </div>`;
}

export default renderAudioSettings;
