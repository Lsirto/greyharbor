/**
 * src/ui-v2/menu/templates/character-select.mjs — character (investigator)
 * roster and the character-select screen rendered after a faction is chosen.
 *
 * A character is one of the leader cards in the canonical CARDS table. The
 * roster only adds display metadata (title/icon/archetype); the active and
 * passive text come straight from the card so the engine and the menu never
 * duplicate ability wording.
 */

import { CARDS, PRESET_GROUPS } from '../../../engine/v2/cards.js';
import { escapeHtml } from '../../utils.mjs';
import { DEFAULT_DIFFICULTY, DIFFICULTY_LIST, isDifficulty } from '../../../ai/v2/difficulty.mjs';
import { FACTION_CARDS } from './faction-select.mjs';
import { RARITIES } from '../../../economy/card-backs.mjs';
import { getSkinsForCharacter, resolvePortrait } from '../../../economy/skins.mjs';

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
    Object.freeze({ id: 'madeline-hale', title: '灯塔学者', icon: '🏮', archetype: '净化 · 群体增益' }),
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
    title: meta.title,
    icon: meta.icon,
    archetype: meta.archetype,
    effect: card.effect,
    flavor: card.flavor,
  });
}

export function renderCharacterCard(id, selected = false, portrait = null) {
  const card = getCharacterCard(id);
  if (!card) return '';
  const active = selected === true;
  const portraitSrc = portrait && typeof portrait.src === 'string'
    ? portrait.src
    : `./assets/art/${encodeURIComponent(card.id)}.jpg`;
  const filterStyle = portrait && portrait.filter
    ? ` style="filter:${escapeHtml(portrait.filter)}"`
    : '';
  return `<button type="button"
      class="gh2-character-card gh2-character-card--${escapeHtml(card.faction)}${active ? ' is-selected' : ''}"
      data-character="${escapeHtml(card.id)}"
      aria-pressed="${active ? 'true' : 'false'}">
    <span class="gh2-character-card__media">
      <img class="gh2-character-card__portrait" src="${escapeHtml(portraitSrc)}"${filterStyle}
        alt="" onerror="this.style.display='none'">
      <span class="gh2-character-card__icon" aria-hidden="true">${escapeHtml(card.icon)}</span>
    </span>
    <span class="gh2-character-card__title">${escapeHtml(card.title)}</span>
    <span class="gh2-character-card__name">${escapeHtml(card.nameZh)}</span>
    <span class="gh2-character-card__archetype">${escapeHtml(card.archetype)}</span>
    <span class="gh2-character-card__effect">${escapeHtml(card.effect)}</span>
    <span class="gh2-character-card__flavor">“${escapeHtml(card.flavor)}”</span>
  </button>`;
}

/**
 * Build the selectable looks for one character: the always-owned base portrait
 * first, then that character's two skins. Ownership and the equipped look come
 * from the economy state; everything else is derived from the catalogue so the
 * template stays data-driven with no per-character branches.
 */
function buildSkinOptions(characterId, state) {
  const ownedIds = state && Array.isArray(state.ownedIds) ? state.ownedIds : [];
  const equippedId = state && typeof state.equippedId === 'string' ? state.equippedId : null;
  const owned = new Set(ownedIds);
  const base = {
    previewKey: 'default',
    skinId: null,
    name: '初始形象',
    rarity: null,
    kind: 'default',
    theme: '初始',
    icon: '🎴',
    description: '调查员初到灰港时的模样',
    owned: true,
    equipped: equippedId === null,
    portrait: resolvePortrait(characterId, null),
  };
  const skins = getSkinsForCharacter(characterId).map((skin) => ({
    previewKey: skin.id,
    skinId: skin.id,
    name: skin.name,
    rarity: skin.rarity,
    kind: skin.kind,
    theme: skin.theme,
    icon: skin.icon,
    description: skin.description,
    owned: owned.has(skin.id),
    equipped: equippedId === skin.id,
    portrait: resolvePortrait(characterId, skin.id),
  }));
  return [base, ...skins];
}

function renderSkinThumb(option, active) {
  const filterStyle = option.portrait.filter
    ? ` style="filter:${escapeHtml(option.portrait.filter)}"`
    : '';
  const stateClass = option.equipped ? 'is-equipped' : option.owned ? 'is-owned' : 'is-locked';
  return `<button type="button"
      class="gh2-skin-switcher__thumb ${stateClass}${active ? ' is-selected' : ''}"
      data-skin-preview="${escapeHtml(option.previewKey)}"
      aria-pressed="${active ? 'true' : 'false'}" aria-label="${escapeHtml(option.name)}">
    <img src="${escapeHtml(option.portrait.src)}"${filterStyle} alt="" onerror="this.style.display='none'">
    ${option.owned ? '' : '<span class="gh2-skin-switcher__thumb-lock">🔒</span>'}
  </button>`;
}

/**
 * King-of-glory-style skin switcher for the selected character. Arrows and
 * thumbnails change the preview; the action button equips an owned look, marks
 * the active one as in use, or routes locked looks to the shop.
 *
 * @param {string} characterId
 * @param {{ownedIds?: string[], equippedId?: string|null}} state
 * @param {string|null} previewId currently previewed skin id (null = base)
 */
export function renderSkinSwitcher(characterId, state, previewId = undefined) {
  const options = buildSkinOptions(characterId, state);
  const equippedIndex = Math.max(0, options.findIndex((option) => option.equipped));
  let previewIndex;
  if (previewId === undefined) {
    // No explicit preview: open on the look currently equipped.
    previewIndex = equippedIndex;
  } else {
    const wantedSkin = previewId === 'default' ? null : previewId;
    previewIndex = options.findIndex((option) => option.skinId === wantedSkin);
    if (previewIndex < 0) previewIndex = equippedIndex;
  }
  const current = options[previewIndex];

  const filterStyle = current.portrait.filter
    ? ` style="filter:${escapeHtml(current.portrait.filter)}"`
    : '';
  const rarityKey = current.rarity ?? 'default';
  const kindTag = current.kind === 'art' ? '新立绘' : current.kind === 'palette' ? '调色' : '初始';
  const rarityBadge = current.rarity
    ? RARITIES[current.rarity]?.label ?? current.rarity
    : '初始';

  let action;
  if (current.equipped) {
    action = '<span class="gh2-skin-switcher__using">使用中</span>';
  } else if (current.owned) {
    action = `<button type="button" class="gh2-skin-switcher__use"
      data-skin-action="equip" data-skin-id="${escapeHtml(current.skinId)}">使用</button>`;
  } else {
    action = `<button type="button" class="gh2-skin-switcher__get"
      data-skin-action="go-shop">去获取</button>`;
  }

  const thumbs = options
    .map((option) => renderSkinThumb(option, option.previewKey === current.previewKey))
    .join('');

  return `<div class="gh2-skin-switcher" data-role="skin-switcher" data-rarity="${escapeHtml(rarityKey)}">
    <div class="gh2-skin-switcher__head">
      <span class="gh2-skin-switcher__heading">外观</span>
      <span class="gh2-skin-switcher__count">${previewIndex + 1} / ${options.length}</span>
    </div>
    <div class="gh2-skin-switcher__body">
      <button type="button" class="gh2-skin-switcher__arrow" data-skin-nav="prev" aria-label="上一款">‹</button>
      <span class="gh2-skin-switcher__media">
        <img src="${escapeHtml(current.portrait.src)}"${filterStyle} alt="" onerror="this.style.display='none'">
        <span class="gh2-skin-switcher__kind">${kindTag}</span>
        ${current.owned ? '' : '<span class="gh2-skin-switcher__lock">🔒</span>'}
      </span>
      <span class="gh2-skin-switcher__info">
        <span class="gh2-skin-switcher__name-row">
          <b class="gh2-skin-switcher__name">${escapeHtml(current.icon)} ${escapeHtml(current.name)}</b>
          <span class="gh2-skin-switcher__badge gh2-skin-switcher__badge--${escapeHtml(rarityKey)}">${escapeHtml(rarityBadge)}</span>
        </span>
        <small class="gh2-skin-switcher__meta">${escapeHtml(rarityBadge)} · ${escapeHtml(current.theme)}</small>
        <p class="gh2-skin-switcher__desc">${escapeHtml(current.description)}</p>
        <span class="gh2-skin-switcher__action">${action}</span>
      </span>
      <button type="button" class="gh2-skin-switcher__arrow" data-skin-nav="next" aria-label="下一款">›</button>
    </div>
    <div class="gh2-skin-switcher__thumbs">${thumbs}</div>
  </div>`;
}

/** Segmented AI difficulty selector used on the pre-battle screen. */
export function renderDifficultySelect(selected = DEFAULT_DIFFICULTY) {
  const current = isDifficulty(selected) ? selected : DEFAULT_DIFFICULTY;
  const buttons = DIFFICULTY_LIST.map((profile) => {
    const active = profile.id === current;
    return `<button type="button"
        class="gh2-difficulty__option${active ? ' is-selected' : ''}"
        data-difficulty="${escapeHtml(profile.id)}"
        aria-pressed="${active ? 'true' : 'false'}">
      <b>${escapeHtml(profile.label)}</b>
      <small>${escapeHtml(profile.description)}</small>
    </button>`;
  }).join('');
  return `<div class="gh2-difficulty" role="group" aria-label="AI 难度">
    <div class="gh2-difficulty__head">
      <span class="gh2-difficulty__mark">AI 难度</span>
      <span class="gh2-difficulty__hint">选择对手的决策强度</span>
    </div>
    <div class="gh2-difficulty__options">${buttons}</div>
  </div>`;
}

/** Pre-battle recommended preset selector; hidden in arena draft mode. */
export function renderPresetSelect(faction, selectedId = null) {
  const group = PRESET_GROUPS[faction] ?? PRESET_GROUPS.society;
  const activeId = group.some((preset) => preset.id === selectedId) ? selectedId : group[0].id;
  const options = group.map((preset) => {
    const active = preset.id === activeId;
    return `<button type="button"
        class="gh2-preset__option${active ? ' is-selected' : ''}"
        data-deck-preset="${escapeHtml(preset.id)}"
        aria-pressed="${active ? 'true' : 'false'}">
      <b>${escapeHtml(preset.nameZh)}</b>
      <small>${escapeHtml(preset.descZh)}</small>
    </button>`;
  }).join('');
  return `<div class="gh2-preset" role="group" aria-label="推荐牌组">
    <div class="gh2-preset__head">
      <span class="gh2-preset__mark">推荐牌组</span>
      <span class="gh2-preset__hint">选一套直接出战，也可以去卡组编辑器自己组</span>
    </div>
    <div class="gh2-preset__options">${options}</div>
  </div>`;
}

/**
 * @param {{faction?: string, selected?: string, arena?: boolean, difficulty?:
 *          string, portraits?: Object, skinState?: Object, previewId?: string|null}} options
 */
export function renderCharacterSelect(options = {}) {
  const input = options && typeof options === 'object' ? options : {};
  const arena = input.arena === true;
  const faction = CHARACTER_ROSTER[input.faction] ? input.faction : 'society';
  const ids = characterIdsFor(faction);
  const selected = ids.includes(input.selected) ? input.selected : ids[0];
  const selectedCard = getCharacterCard(selected);
  const factionName = FACTION_CARDS[faction]?.nameZh ?? faction;
  const portraits = input.portraits && typeof input.portraits === 'object' ? input.portraits : {};
  const skinState = input.skinState && typeof input.skinState === 'object' ? input.skinState : {};
  const cards = ids
    .map((id) => renderCharacterCard(id, id === selected, portraits[id] ?? null))
    .join('');
  const switcher = renderSkinSwitcher(selected, skinState[selected] ?? null, input.previewId);
  const buttonTitle = arena ? '进入竞技场选牌' : '开始对局';
  const buttonHint = arena
    ? `以 ${selectedCard?.title ?? ''} · ${selectedCard?.nameZh ?? ''} 进入随机三选一`
    : `以 ${selectedCard?.title ?? ''} · ${selectedCard?.nameZh ?? ''} 出战`;
  return `<section class="gh2-character-select" aria-label="角色选择">
    <header class="gh2-character-select__head">
      <button type="button" class="gh2-back-btn" data-menu-action="character-back">← 返回</button>
      <div><h2>选择你的调查员</h2><p>${escapeHtml(factionName)}阵营 · 每名角色拥有不同的主动技与被动技</p></div>
    </header>
    <div class="gh2-character-select__grid">${cards}</div>
    <div class="gh2-skin-switcher-host" data-role="skin-switcher-host">${switcher}</div>
    ${arena ? '' : renderPresetSelect(faction, input.selectedDeckId ?? null)}
    ${renderDifficultySelect(input.difficulty)}
    <footer class="gh2-character-select__foot">
      <button type="button" class="gh2-menu-btn gh2-menu-btn--primary gh2-character-start" data-menu-action="start-character-match">
        <span class="gh2-menu-btn__icon" aria-hidden="true">⚔</span>
        <span class="gh2-menu-btn__body">
          <b>${escapeHtml(buttonTitle)}</b>
          <small>${escapeHtml(buttonHint)}</small>
        </span>
      </button>
    </footer>
  </section>`;
}

export default renderCharacterSelect;
