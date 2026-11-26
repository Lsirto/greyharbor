/**
 * src/ui-v2/shop/templates/shop.mjs — pure HTML for the gacha shop.
 * Renders the coin balance, single-pull gacha with probability disclosure and
 * pity, and the card back collection with equip actions. All dynamic text is
 * escaped; the controller wires the data attributes.
 */

import { escapeHtml } from '../../utils.mjs';
import { RARITIES, TOTAL_RARITY_WEIGHT } from '../../../economy/card-backs.mjs';
import { EPIC_PITY, GACHA_COST, RARE_PITY } from '../../../economy/economy.mjs';

const RARITY_ORDER = ['common', 'rare', 'epic'];

function rarityPct(rarity) {
  return Math.round((RARITIES[rarity].weight / TOTAL_RARITY_WEIGHT) * 100);
}

function renderLastResult(result) {
  if (!result) return '';
  if (result.ok === false) {
    return `<div class="gh2-shop__result gh2-shop__result--warn">理智币不足，完成每日挑战或对局即可赚取。</div>`;
  }
  const rarityLabel = RARITIES[result.rarity].label;
  const detail = result.isNew
    ? `获得新卡背「${escapeHtml(result.name)}」（${rarityLabel}）`
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

/**
 * @param {{coins:number, pulls:number, pity:number, lastResult:object,
 *          collection:Array}} input
 */
export function renderShop(input = {}) {
  const coins = Number(input.coins) || 0;
  const pulls = Number(input.pulls) || 0;
  const pity = Number(input.pity) || 0;
  const collection = Array.isArray(input.collection) ? input.collection : [];
  const canAfford = coins >= GACHA_COST;

  return `<section class="gh2-shop" aria-label="理智币商店">
    <header class="gh2-shop__head">
      <button type="button" class="gh2-back-btn" data-shop="exit">← 返回主菜单</button>
      <div class="gh2-shop__heading">
        <h2>神秘商店</h2>
        <p>抽取并装备卡背 · 纯外观，不影响平衡</p>
      </div>
      <span class="gh2-shop__balance" title="理智币">🪙 ${coins}</span>
    </header>

    <div class="gh2-shop__gacha">
      <div class="gh2-shop__gacha-info">
        <h3>卡背召唤</h3>
        <p>单次抽取消耗 <b>${GACHA_COST}</b> 理智币，概率公示如下：</p>
        <ul class="gh2-shop__rates">
          ${RARITY_ORDER.map((rarity) =>
            `<li><span>${RARITIES[rarity].label}</span><b>${rarityPct(rarity)}%</b></li>`).join('')}
        </ul>
        <p class="gh2-shop__pity">
          保底：连续 <b>${RARE_PITY}</b> 次未出稀有必得稀有及以上；每 <b>${EPIC_PITY}</b> 次必得史诗。
          当前距稀有保底还差 <b>${Math.max(0, RARE_PITY - pity)}</b> 次（已召唤 ${pulls} 次）。
        </p>
      </div>
      <button type="button" class="gh2-shop__pull ${canAfford ? '' : 'is-disabled'}" data-shop="pull"
        ${canAfford ? '' : 'aria-disabled="true"'}>
        <span class="gh2-shop__pull-icon">🎴</span>
        <span class="gh2-shop__pull-label">召唤一次</span>
        <small>消耗 ${GACHA_COST} 🪙</small>
      </button>
    </div>

    ${renderLastResult(input.lastResult)}

    <h3 class="gh2-shop__collection-title">卡背收藏（${collection.filter((i) => i.owned).length} / ${collection.length}）</h3>
    <ul class="gh2-shop__grid">
      ${collection.map(renderCollectionItem).join('')}
    </ul>
  </section>`;
}

export default renderShop;
