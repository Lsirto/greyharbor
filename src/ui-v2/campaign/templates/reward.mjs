/**
 * src/ui-v2/campaign/templates/reward.mjs — pure templates for card and relic
 * reward steps.  Card choices reuse the compressed card art; relic choices
 * show the frozen relic description.  Each screen offers an explicit skip.
 */

import { escapeHtml } from '../../utils.mjs';
import { CARDS } from '../../../engine/v2/cards.js';
import { getRelic } from '../../../campaign/data/relics.mjs';

const TYPE_LABEL = Object.freeze({
  unit: '单位',
  ritual: '仪式',
  environment: '环境',
  location: '地点',
  leader: '领袖',
});

export function renderCardReward(run) {
  const options = run.pending.cardOptions;
  const cards = options.map((id, index) => {
    const card = CARDS[id] ?? { id, nameZh: id, name: id };
    return `<div class="gh2-creward-card" data-card-choice="${index}" role="button" tabindex="0">
      <img class="gh2-creward-card__art" src="./assets/art/${encodeURIComponent(id)}.jpg"
        alt="" loading="lazy" onerror="this.style.display='none'">
      <div class="gh2-creward-card__plate">
        <b>${escapeHtml(card.nameZh ?? id)}</b>
        <small>${escapeHtml(card.name ?? id)}</small>
        <span class="gh2-creward-card__type">${escapeHtml(TYPE_LABEL[card.type] ?? card.type ?? '')}</span>
      </div>
    </div>`;
  }).join('');

  return `<section class="gh2-creward" aria-label="卡牌奖励">
    <header class="gh2-creward-head">
      <span class="gh2-creward-kicker">战斗胜利</span>
      <h2>选择一张卡牌加入牌组</h2>
    </header>
    <div class="gh2-creward-grid">${cards}</div>
    <button type="button" class="gh2-creward-skip" data-card-skip>跳过，不加入卡牌</button>
  </section>`;
}

export function renderRelicReward(run) {
  const options = run.pending.relicOptions;
  const relics = options.map((id, index) => {
    const relic = getRelic(id) ?? { id, nameZh: id, description: '' };
    return `<div class="gh2-creward-relic" data-relic-choice="${index}" role="button" tabindex="0">
      <span class="gh2-creward-relic__glyph" aria-hidden="true">⚜</span>
      <div class="gh2-creward-relic__body">
        <b>${escapeHtml(relic.nameZh ?? id)}</b>
        <p>${escapeHtml(relic.description ?? '')}</p>
      </div>
    </div>`;
  }).join('');

  return `<section class="gh2-creward" aria-label="遗物奖励">
    <header class="gh2-creward-head">
      <span class="gh2-creward-kicker">遗物</span>
      <h2>选择一件遗物</h2>
    </header>
    <div class="gh2-creward-relics">${relics}</div>
    <button type="button" class="gh2-creward-skip" data-relic-skip>跳过，不获取遗物</button>
  </section>`;
}
