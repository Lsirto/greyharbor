/**
 * src/ui-v2/menu/templates/faction-select.mjs — faction cards, mode switch
 * and the start button.  Static card metadata is read from the engine's
 * canonical CARDS / PRESET_DECKS tables (no duplicated card text); live game
 * state is never touched here.
 */

import { CARDS, PRESET_DECKS } from '../../../engine/v2/cards.js';
import { escapeHtml } from '../../utils.mjs';
import { renderModeToggle } from './mode-toggle.mjs';

export const FACTION_IDS = Object.freeze(['society', 'cult']);

const FACTION_STYLE = Object.freeze({
  society: Object.freeze({
    nameZh: '学会',
    crest: '⚜',
    tagline: '灯火、档案与守夜人的秩序。',
    role: '风格定位 · 稳健阵地 / 封印 / 理智回复',
    accent: 'society',
  }),
  cult: Object.freeze({
    nameZh: '教团',
    crest: '☠',
    tagline: '钟声、深海与不应被呼唤的名字。',
    role: '风格定位 · 献祭节奏 / 异怪空降 / 腐化压制',
    accent: 'cult',
  }),
});

/** Display metadata for one faction card, sourced from the canonical tables. */
export function getFactionCard(id) {
  const style = FACTION_STYLE[id];
  const preset = PRESET_DECKS[id];
  const leader = preset ? CARDS[preset.leader] : null;
  const opponent = id === 'society' ? 'cult' : 'society';
  return {
    id,
    nameZh: style?.nameZh ?? id,
    name: preset?.name ?? id,
    crest: style?.crest ?? '✦',
    tagline: style?.tagline ?? '',
    role: style?.role ?? '',
    accent: style?.accent ?? 'neutral',
    leaderId: preset?.leader ?? null,
    leaderNameZh: leader?.nameZh ?? preset?.leader ?? '',
    leaderName: leader?.name ?? '',
    effect: leader?.effect ?? '',
    flavor: leader?.flavor ?? '',
    deckSize: preset ? (preset.cards?.length ?? 0) + 1 : 0,
    opponent,
    opponentNameZh: FACTION_STYLE[opponent]?.nameZh ?? opponent,
  };
}

export const FACTION_CARDS = Object.freeze(Object.fromEntries(
  FACTION_IDS.map((id) => [id, Object.freeze(getFactionCard(id))]),
));

export function renderFactionCard(id, selected = false) {
  const card = FACTION_CARDS[id] ?? getFactionCard(String(id));
  const active = selected === true;
  return `<button type="button"
      class="gh2-faction-card gh2-faction-card--${escapeHtml(card.accent)}${active ? ' is-selected' : ''}"
      data-faction="${escapeHtml(card.id)}"
      aria-pressed="${active ? 'true' : 'false'}">
    <span class="gh2-faction-card__crest" aria-hidden="true">${escapeHtml(card.crest)}</span>
    <span class="gh2-faction-card__name">${escapeHtml(card.nameZh)}</span>
    <span class="gh2-faction-card__en">${escapeHtml(card.name)}</span>
    <span class="gh2-faction-card__tagline">${escapeHtml(card.tagline)}</span>
    <span class="gh2-faction-card__role">${escapeHtml(card.role)}</span>
    <span class="gh2-faction-card__leader">
      <b>领袖 · ${escapeHtml(card.leaderNameZh)}</b>
      <small>${escapeHtml(card.leaderName)} · ${escapeHtml(card.leaderId ?? '')}</small>
    </span>
    <span class="gh2-faction-card__effect">${escapeHtml(card.effect)}</span>
    <span class="gh2-faction-card__flavor">“${escapeHtml(card.flavor)}”</span>
    <span class="gh2-faction-card__meta">预组 ${card.deckSize} 张 · 对手：${escapeHtml(card.opponentNameZh)}</span>
  </button>`;
}

export function renderStartButton(selected = 'society') {
  const faction = FACTION_CARDS[selected] ?? FACTION_CARDS.society;
  return `<button type="button" class="gh2-menu-btn gh2-menu-btn--primary gh2-start-btn" data-menu-action="start-match">
    <span class="gh2-menu-btn__icon" aria-hidden="true">⚔</span>
    <span class="gh2-menu-btn__body"><b>开始对局</b><small>你执掌${escapeHtml(faction.nameZh)} · 对手为${escapeHtml(faction.opponentNameZh)}</small></span>
  </button>`;
}

/**
 * @param {{selected?: string, seedMode?: string}} options
 */
export function renderFactionSelect(options = {}) {
  const input = options && typeof options === 'object' ? options : {};
  const selected = FACTION_CARDS[input.selected] ? input.selected : 'society';
  const cards = FACTION_IDS.map((id) => renderFactionCard(id, id === selected)).join('');
  return `<section class="gh2-faction-select" aria-label="阵营选择">
    <header class="gh2-faction-select__head">
      <button type="button" class="gh2-back-btn" data-menu-action="back" aria-label="返回主菜单">← 返回</button>
      <div><h2>选择你的阵营</h2><p>对手自动成为另一阵营 · 人类固定坐在先手席</p></div>
    </header>
    <div class="gh2-faction-select__grid">${cards}</div>
    <footer class="gh2-faction-select__foot">
      ${renderModeToggle({ seedMode: input.seedMode })}
      <div class="gh2-faction-select__start" data-role="start">${renderStartButton(selected)}</div>
    </footer>
  </section>`;
}

export default renderFactionSelect;
