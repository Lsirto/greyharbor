/**
 * src/ui-v2/campaign/templates/rest.mjs — pure templates for the rest node.
 *
 * Two choices (supplies / trim deck). Choosing trim opens the deck list
 * (renderRestRemoveList) so the player can pick a specific card; this is a
 * local UI step, not run state.
 */

import { escapeHtml } from '../../utils.mjs';
import { CARDS } from '../../../engine/v2/cards.js';
import { restSupplies } from '../../../campaign/rewards.mjs';

export function renderRestScreen(run) {
  const amount = restSupplies(run);
  return `<section class="gh2-crest" aria-label="休整点">
    <header class="gh2-crest-head">
      <span class="gh2-crest-kicker">休整</span>
      <h2>稍作喘息</h2>
    </header>
    <div class="gh2-crest-choices">
      <button type="button" class="gh2-crest-option" data-rest-supplies>
        <b>整理补给</b><small>获得 ${escapeHtml(amount)} 物资</small>
      </button>
      <button type="button" class="gh2-crest-option" data-rest-remove>
        <b>整理牌组</b><small>从牌组中移除一张牌</small>
      </button>
    </div>
  </section>`;
}

export function renderRestRemoveList(run) {
  const items = run.deck.map((id, index) => {
    const card = CARDS[id] ?? { nameZh: id, name: id };
    return `<li class="gh2-crest-item" data-remove-index="${index}" role="button" tabindex="0">
      <span class="gh2-crest-item__name">${escapeHtml(card.nameZh ?? id)}</span>
      <small class="gh2-crest-item__en">${escapeHtml(card.name ?? id)}</small>
    </li>`;
  }).join('');

  return `<section class="gh2-crest" aria-label="移除卡牌">
    <header class="gh2-crest-head">
      <h2>选择要移除的牌</h2>
      <p>移除后该牌不再出现在后续战斗中。</p>
    </header>
    <ul class="gh2-crest-list">${items}</ul>
    <button type="button" class="gh2-creward-skip" data-rest-back>返回休整选项</button>
  </section>`;
}
