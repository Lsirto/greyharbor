/**
 * src/ui-v2/shop/templates/shop.mjs — pure HTML for the gacha shop.
 * Renders two independent banners: the card back summon (single pull) and the
 * character skin summon (single + ten-pull with a guaranteed rare+), each with
 * probability disclosure, pity and an equip-able collection. All dynamic text
 * is escaped; the controller wires the data attributes.
 */

import { escapeHtml } from '../../utils.mjs';
import { RARITIES, TOTAL_RARITY_WEIGHT } from '../../../economy/card-backs.mjs';
import {
  EPIC_PITY,
  GACHA_COST,
  RARE_PITY,
  SKIN_GACHA_COST,
  SKIN_TEN_COST,
} from '../../../economy/economy.mjs';
import { resolvePortrait } from '../../../economy/skins.mjs';
import { getCharacterCard } from '../../menu/templates/character-select.mjs';

const RARITY_ORDER = ['common', 'rare', 'epic'];

function rarityPct(rarity) {
  return Math.round((RARITIES[rarity].weight / TOTAL_RARITY_WEIGHT) * 100);
}

function renderRates() {
  return `<ul class="gh2-shop__rates">
    ${RARITY_ORDER.map((rarity) =>
      `<li><span>${RARITIES[rarity].label}</span><b>${rarityPct(rarity)}%</b></li>`).join('')}
  </ul>`;
}

function renderLastResult(result) {
  if (!result) return '';
  if (result.ok === false) {
    return `<div class="gh2-shop__result gh2-shop__result--warn">理智币不足，完成每日挑战或对局即可赚取。</div>`;
  }
  const detail = result.isNew
    ? `获得新卡背「${escapeHtml(result.name)}」（${RARITIES[result.rarity].label}）`
    : `重复卡背，已返还 ${result.duplicateCoins} 理智币`;
  return `<div class="gh2-shop__result gh2-shop__result--${result.rarity}">${detail}</div>`;
}

function renderCollectionItem(item) {
  const rarityLabel = RARITIES[item.rarity]?.label ?? item.rarity;
  const stateClass = item.equipped ? 'is-equipped' : item.owned ? 'is-owned' : 'is-locked';
  let action;
  if (item.equipped) {
    action = '<span class="gh2-shop__equipped-tag">已装备</span>';
  } else if (item.owned) {
    action = `<button type="button" class="gh2-shop__equip" data-shop="equip" data-card-back="${escapeHtml(item.id)}">装备</button>`;
  } else {
    action = '<span class="gh2-shop__locked-tag">未获得</span>';
  }
  return `<li class="gh2-shop__item ${stateClass}" data-rarity="${escapeHtml(item.rarity)}">
    <span class="gh2-shop__item-icon" aria-hidden="true">${item.owned ? escapeHtml(item.icon) : '🔒'}</span>
    <b class="gh2-shop__item-name">${escapeHtml(item.name)}</b>
    <small class="gh2-shop__item-rarity">${rarityLabel}</small>
    <small class="gh2-shop__item-desc">${escapeHtml(item.description)}</small>
    ${action}
  </li>`;
}

function renderSkinResult(result) {
  if (!result) return '';
  if (result.ok === false) {
    return `<div class="gh2-shop__result gh2-shop__result--warn">理智币不足，完成每日挑战或对局即可赚取。</div>`;
  }
  if (Array.isArray(result.items)) {
    const chips = result.items.map((item) =>
      `<span class="gh2-skin-result__chip gh2-skin-result__chip--${item.rarity}" title="${escapeHtml(item.name)}">
        <span aria-hidden="true">${escapeHtml(item.icon ?? '🎁')}</span>
        ${item.isNew ? '<i class="gh2-skin-result__new">新</i>' : ''}
      </span>`).join('');
    const summary = `十连召唤完成：${result.newCount} 款新皮肤`
      + (result.duplicateCoins ? `，重复返还 ${result.duplicateCoins} 理智币` : '')
      + (result.guaranteed ? '，已触发保底' : '');
    return `<div class="gh2-shop__result gh2-shop__result--ten">
      <p>${summary}</p>
      <div class="gh2-skin-result__chips">${chips}</div>
    </div>`;
  }
  const detail = result.isNew
    ? `获得新皮肤「${escapeHtml(result.name)}」（${RARITIES[result.rarity].label}）`
    : `重复皮肤，已返还 ${result.duplicateCoins} 理智币`;
  return `<div class="gh2-shop__result gh2-shop__result--${result.rarity}">${detail}</div>`;
}

function renderSkinCard(item) {
  const portrait = resolvePortrait(item.characterId, item.id);
  const stateClass = item.equipped ? 'is-equipped' : item.owned ? 'is-owned' : 'is-locked';
  const filterStyle = portrait.filter ? ` style="filter:${escapeHtml(portrait.filter)}"` : '';
  let action;
  if (item.equipped) {
    action = '<span class="gh2-shop__equipped-tag">已装备</span>';
  } else if (item.owned) {
    action = `<button type="button" class="gh2-shop__equip" data-shop="equip-skin"
      data-skin-id="${escapeHtml(item.id)}" data-character-id="${escapeHtml(item.characterId)}">装备</button>`;
  } else {
    action = '<span class="gh2-shop__locked-tag">未获得</span>';
  }
  const kindTag = item.kind === 'art' ? '新立绘' : '调色';
  return `<div class="gh2-skin-card ${stateClass}" data-rarity="${escapeHtml(item.rarity)}">
    <span class="gh2-skin-card__media">
      <img src="${escapeHtml(portrait.src)}"${filterStyle} alt="" onerror="this.style.display='none'">
      <span class="gh2-skin-card__kind">${kindTag}</span>
      ${item.owned ? '' : '<span class="gh2-skin-card__lock">🔒</span>'}
    </span>
    <b class="gh2-skin-card__name">${escapeHtml(item.name)}</b>
    <small class="gh2-skin-card__rarity">${RARITIES[item.rarity].label} · ${escapeHtml(item.theme)}</small>
    <small class="gh2-skin-card__desc">${escapeHtml(item.description)}</small>
    ${action}
  </div>`;
}

function renderSkinGroups(skinCollection) {
  const groups = new Map();
  for (const item of skinCollection) {
    if (!groups.has(item.characterId)) groups.set(item.characterId, []);
    groups.get(item.characterId).push(item);
  }
  return [...groups.entries()].map(([characterId, items]) => {
    const character = getCharacterCard(characterId);
    const header = character ? `${character.title} · ${character.nameZh}` : characterId;
    return `<div class="gh2-skin-group">
      <h4 class="gh2-skin-group__title">${escapeHtml(header)}</h4>
      <div class="gh2-skin-group__cards">${items.map(renderSkinCard).join('')}</div>
    </div>`;
  }).join('');
}

/**
 * @param {{coins:number, pulls:number, pity:number, lastResult:object,
 *          collection:Array, skinPulls:number, skinPity:number,
 *          skinResult:object, skinCollection:Array}} input
 */
export function renderShop(input = {}) {
  const coins = Number(input.coins) || 0;
  const pulls = Number(input.pulls) || 0;
  const pity = Number(input.pity) || 0;
  const collection = Array.isArray(input.collection) ? input.collection : [];
  const skinPulls = Number(input.skinPulls) || 0;
  const skinPity = Number(input.skinPity) || 0;
  const skinCollection = Array.isArray(input.skinCollection) ? input.skinCollection : [];
  const canAffordBack = coins >= GACHA_COST;
  const canAffordSkin = coins >= SKIN_GACHA_COST;
  const canAffordTen = coins >= SKIN_TEN_COST;

  return `<section class="gh2-shop" aria-label="理智币商店">
    <header class="gh2-shop__head">
      <button type="button" class="gh2-back-btn" data-shop="exit">← 返回主菜单</button>
      <div class="gh2-shop__heading">
        <h2>神秘商店</h2>
        <p>召唤卡背与角色皮肤</p>
      </div>
      <span class="gh2-shop__balance" title="理智币">🪙 ${coins}</span>
    </header>

    <div class="gh2-shop__banner">
      <div class="gh2-shop__gacha">
        <div class="gh2-shop__gacha-info">
          <h3>卡背召唤</h3>
          <p>单次抽取消耗 <b>${GACHA_COST}</b> 理智币，概率公示如下：</p>
          ${renderRates()}
          <p class="gh2-shop__pity">
            保底：连续 <b>${RARE_PITY}</b> 次未出稀有必得稀有及以上；每 <b>${EPIC_PITY}</b> 次必得史诗。
            当前距稀有保底还差 <b>${Math.max(0, RARE_PITY - pity)}</b> 次（已召唤 ${pulls} 次）。
          </p>
        </div>
        <button type="button" class="gh2-shop__pull ${canAffordBack ? '' : 'is-disabled'}" data-shop="pull"
          ${canAffordBack ? '' : 'aria-disabled="true"'}>
          <span class="gh2-shop__pull-icon">🎴</span>
          <span class="gh2-shop__pull-label">召唤一次</span>
          <small>消耗 ${GACHA_COST} 🪙</small>
        </button>
      </div>
      ${renderLastResult(input.lastResult)}
      <h3 class="gh2-shop__collection-title">卡背收藏（${collection.filter((i) => i.owned).length} / ${collection.length}）</h3>
      <ul class="gh2-shop__grid">${collection.map(renderCollectionItem).join('')}</ul>
    </div>

    <div class="gh2-shop__banner">
      <div class="gh2-shop__gacha">
        <div class="gh2-shop__gacha-info">
          <h3>皮肤召唤</h3>
          <p>单抽 <b>${SKIN_GACHA_COST}</b>、十连 <b>${SKIN_TEN_COST}</b> 理智币，概率公示如下：</p>
          ${renderRates()}
          <p class="gh2-shop__pity">
            保底：连续 <b>${RARE_PITY}</b> 次未出稀有必得稀有及以上；每 <b>${EPIC_PITY}</b> 次必得史诗。
            十连必定至少 1 个稀有及以上。当前距稀有保底还差
            <b>${Math.max(0, RARE_PITY - skinPity)}</b> 次（已召唤 ${skinPulls} 次）。
          </p>
        </div>
        <div class="gh2-shop__pulls">
          <button type="button" class="gh2-shop__pull ${canAffordSkin ? '' : 'is-disabled'}" data-shop="pull-skin"
            ${canAffordSkin ? '' : 'aria-disabled="true"'}>
            <span class="gh2-shop__pull-icon">✨</span>
            <span class="gh2-shop__pull-label">召唤一次</span>
            <small>消耗 ${SKIN_GACHA_COST} 🪙</small>
          </button>
          <button type="button" class="gh2-shop__pull gh2-shop__pull--ten ${canAffordTen ? '' : 'is-disabled'}"
            data-shop="pull-skin-ten" ${canAffordTen ? '' : 'aria-disabled="true"'}>
            <span class="gh2-shop__pull-icon">🌟</span>
            <span class="gh2-shop__pull-label">十连召唤</span>
            <small>消耗 ${SKIN_TEN_COST} 🪙 · 保底稀有</small>
          </button>
        </div>
      </div>
      ${renderSkinResult(input.skinResult)}
      <h3 class="gh2-shop__collection-title">皮肤收藏（${skinCollection.filter((i) => i.owned).length} / ${skinCollection.length}）</h3>
      ${renderSkinGroups(skinCollection)}
    </div>
  </section>`;
}

export default renderShop;
