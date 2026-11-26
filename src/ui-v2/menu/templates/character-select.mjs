/**
 * src/ui-v2/menu/templates/character-select.mjs — character (investigator)
 * roster and the character-select screen rendered after a faction is chosen.
 *
 * A character is one of the leader cards in the canonical CARDS table. The
 * roster only adds display metadata (title/icon/archetype); the active and
 * passive text come straight from the card so the engine and the menu never
 * duplicate ability wording.
 */

import { CARDS } from '../../../engine/v2/cards.js';
import { escapeHtml } from '../../utils.mjs';
import { FACTION_CARDS } from './faction-select.mjs';

/**
 * Per-character display metadata, grouped by faction. The order here is the
 * display order. The active/passive rules themselves live in the engine's
 * effect registry and the card's `effect` text.
 */
export const CHARACTER_ROSTER = Object.freeze({
  society: Object.freeze([
    Object.freeze({ id: 'harold-ashby', title: '守夜督察', icon: '🕯', archetype: '稳健 · 封印回复' }),
    Object.freeze({ id: 'enid-halloway', title: '档案召唤师', icon: '📜', archetype: '铺场 · 召唤过牌' }),
    Object.freeze({ id: 'augustus-wayne', title: '驱魔审判官', icon: '⚔', archetype: '进攻 · 群体增益' }),
  ]),
  cult: Object.freeze([
    Object.freeze({ id: 'elias-thorne', title: '深海祭司', icon: '🔔', archetype: '献祭 · 召唤连招' }),
    Object.freeze({ id: 'vera-crowe', title: '唤灵者', icon: '🚪', archetype: '空降 · 风险召唤' }),
    Object.freeze({ id: 'gregor-pestilence', title: '腐化使徒', icon: '☣', archetype: '压制 · 腐化削弱' }),
  ]),
});

const META_BY_ID = Object.freeze(
  Object.fromEntries(
    Object.values(CHARACTER_ROSTER)
      .flat()
      .map((meta) => [meta.id, meta]),
  ),
);

/** Character ids for one faction, in display order. */
export function characterIdsFor(faction) {
  const roster = CHARACTER_ROSTER[faction];
  return roster ? roster.map((meta) => meta.id) : [];
}

/** Display metadata for one character id, merged with its canonical card. */
export function getCharacterCard(id) {
  const meta = META_BY_ID[id];
  const card = CARDS[id];
  if (!meta || !card) return null;
  return Object.freeze({
    id,
    faction: card.faction,
    nameZh: card.nameZh,
    nameEn: card.nameEn,
    title: meta.title,
    icon: meta.icon,
    archetype: meta.archetype,
    effect: card.effect,
    flavor: card.flavor,
  });
}

export function renderCharacterCard(id, selected = false) {
  const card = getCharacterCard(id);
  if (!card) return '';
  const active = selected === true;
  return `<button type="button"
      class="gh2-character-card gh2-character-card--${escapeHtml(card.faction)}${active ? ' is-selected' : ''}"
      data-character="${escapeHtml(card.id)}"
      aria-pressed="${active ? 'true' : 'false'}">
    <span class="gh2-character-card__media">
      <img class="gh2-character-card__portrait" src="./assets/art/${encodeURIComponent(card.id)}.jpg"
        alt="" onerror="this.style.display='none'">
      <span class="gh2-character-card__icon" aria-hidden="true">${escapeHtml(card.icon)}</span>
    </span>
    <span class="gh2-character-card__title">${escapeHtml(card.title)}</span>
    <span class="gh2-character-card__name">${escapeHtml(card.nameZh)}</span>
    <span class="gh2-character-card__en">${escapeHtml(card.nameEn)}</span>
    <span class="gh2-character-card__archetype">${escapeHtml(card.archetype)}</span>
    <span class="gh2-character-card__effect">${escapeHtml(card.effect)}</span>
    <span class="gh2-character-card__flavor">“${escapeHtml(card.flavor)}”</span>
  </button>`;
}

/**
 * @param {{faction?: string, selected?: string}} options
 */
export function renderCharacterSelect(options = {}) {
  const input = options && typeof options === 'object' ? options : {};
  const faction = CHARACTER_ROSTER[input.faction] ? input.faction : 'society';
  const ids = characterIdsFor(faction);
  const selected = ids.includes(input.selected) ? input.selected : ids[0];
  const selectedCard = getCharacterCard(selected);
  const factionName = FACTION_CARDS[faction]?.nameZh ?? faction;
  const cards = ids.map((id) => renderCharacterCard(id, id === selected)).join('');
  return `<section class="gh2-character-select" aria-label="角色选择">
    <header class="gh2-character-select__head">
      <button type="button" class="gh2-back-btn" data-menu-action="character-back">← 返回</button>
      <div><h2>选择你的调查员</h2><p>${escapeHtml(factionName)}阵营 · 每名角色拥有不同的主动技与被动技</p></div>
    </header>
    <div class="gh2-character-select__grid">${cards}</div>
    <footer class="gh2-character-select__foot">
      <button type="button" class="gh2-menu-btn gh2-menu-btn--primary gh2-character-start" data-menu-action="start-character-match">
        <span class="gh2-menu-btn__icon" aria-hidden="true">⚔</span>
        <span class="gh2-menu-btn__body">
          <b>开始对局</b>
          <small>以 ${escapeHtml(selectedCard?.title ?? '')} · ${escapeHtml(selectedCard?.nameZh ?? '')} 出战</small>
        </span>
      </button>
    </footer>
  </section>`;
}

export default renderCharacterSelect;
