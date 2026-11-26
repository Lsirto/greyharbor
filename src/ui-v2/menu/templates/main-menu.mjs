/**
 * src/ui-v2/menu/templates/main-menu.mjs — pure HTML template for the title screen.
 * No DOM, no engine state, no external assets.  All dynamic text is escaped.
 */

import { escapeHtml } from '../../utils.mjs';

export const MAIN_MENU_TEXT = Object.freeze({
  title: '灰港三夜',
  subtitle: 'THREE NIGHTS AT GREYHARBOR',
  tagline: '三夜牌局，两族明暗；灯火与深渊之间，由你落子。',
  startLabel: '开始对局',
  startHint: '选择阵营与牌局模式，进入人机对战',
  campaignLabel: '战役模式',
  campaignHint: 'Roguelike 调查之旅，节点间成长牌组与遗物',
  arenaLabel: '竞技场选牌',
  arenaHint: '随机候选池三选一构筑牌组，再与人机对战',
  dailyLabel: '每日挑战',
  dailyHint: '当天固定一局，所有人同场对局',
  achievementsLabel: '成就墙',
  achievementsHint: '解锁长期目标，记录调查员生涯',
  tutorialLabel: '新手教程',
  tutorialHint: '交互式引导，几分钟学会换牌、出牌与理智规则',
  multiplayerLabel: '多人对战',
  multiplayerHint: '与真人在线对战，房间号加入（开发中）',
  rulesLabel: '规则简介',
});

/** @param {{title?: string, subtitle?: string, tagline?: string}} options */
export function renderMainMenu(options = {}) {
  const input = options && typeof options === 'object' ? options : {};
  const title = input.title ?? MAIN_MENU_TEXT.title;
  const subtitle = input.subtitle ?? MAIN_MENU_TEXT.subtitle;
  const tagline = input.tagline ?? MAIN_MENU_TEXT.tagline;
  return `<section class="gh2-main-menu" aria-label="主菜单">
    <div class="gh2-main-menu__sigil" aria-hidden="true"><span>⚜</span><span>☠</span></div>
    <p class="gh2-main-menu__eyebrow">${escapeHtml(subtitle)}</p>
    <h1 class="gh2-main-menu__title">${escapeHtml(title)}</h1>
    <p class="gh2-main-menu__tagline">${escapeHtml(tagline)}</p>
    <div class="gh2-main-menu__actions">
      <button type="button" class="gh2-menu-btn gh2-menu-btn--primary" data-menu-action="start">
        <span class="gh2-menu-btn__icon" aria-hidden="true">⚔</span>
        <span class="gh2-menu-btn__body"><b>${escapeHtml(MAIN_MENU_TEXT.startLabel)}</b><small>${escapeHtml(MAIN_MENU_TEXT.startHint)}</small></span>
      </button>
      <button type="button" class="gh2-menu-btn" data-menu-action="start-campaign">
        <span class="gh2-menu-btn__icon" aria-hidden="true">❖</span>
        <span class="gh2-menu-btn__body"><b>${escapeHtml(MAIN_MENU_TEXT.campaignLabel)}</b><small>${escapeHtml(MAIN_MENU_TEXT.campaignHint)}</small></span>
      </button>
      <button type="button" class="gh2-menu-btn" data-menu-action="start-arena">
        <span class="gh2-menu-btn__icon" aria-hidden="true">🎲</span>
        <span class="gh2-menu-btn__body"><b>${escapeHtml(MAIN_MENU_TEXT.arenaLabel)}</b><small>${escapeHtml(MAIN_MENU_TEXT.arenaHint)}</small></span>
      </button>
      <button type="button" class="gh2-menu-btn" data-menu-action="start-daily">
        <span class="gh2-menu-btn__icon" aria-hidden="true">☀</span>
        <span class="gh2-menu-btn__body"><b>${escapeHtml(MAIN_MENU_TEXT.dailyLabel)}</b><small>${escapeHtml(MAIN_MENU_TEXT.dailyHint)}</small></span>
      </button>
      <button type="button" class="gh2-menu-btn" data-menu-action="start-achievements">
        <span class="gh2-menu-btn__icon" aria-hidden="true">🏆</span>
        <span class="gh2-menu-btn__body"><b>${escapeHtml(MAIN_MENU_TEXT.achievementsLabel)}</b><small>${escapeHtml(MAIN_MENU_TEXT.achievementsHint)}</small></span>
      </button>
      <button type="button" class="gh2-menu-btn" data-menu-action="start-tutorial">
        <span class="gh2-menu-btn__icon" aria-hidden="true">✦</span>
        <span class="gh2-menu-btn__body"><b>${escapeHtml(MAIN_MENU_TEXT.tutorialLabel)}</b><small>${escapeHtml(MAIN_MENU_TEXT.tutorialHint)}</small></span>
      </button>
      <button type="button" class="gh2-menu-btn" data-menu-action="start-multiplayer">
        <span class="gh2-menu-btn__icon" aria-hidden="true">⚑</span>
        <span class="gh2-menu-btn__body"><b>${escapeHtml(MAIN_MENU_TEXT.multiplayerLabel)} <em class="gh2-menu-btn__badge" aria-label="功能开发中">开发中</em></b><small>${escapeHtml(MAIN_MENU_TEXT.multiplayerHint)}</small></span>
      </button>
    </div>
    <details class="gh2-rules">
      <summary>${escapeHtml(MAIN_MENU_TEXT.rulesLabel)}</summary>
      <div class="gh2-rules__body">
        <p>每局最多三夜。每夜双方依次出牌、使用领袖技或过牌；现场 / 档案 / 梦境三个地点分别结算。</p>
        <p>任意一方理智归零立刻落败；先赢两夜者取胜。学会领袖哈罗德可封印敌方单位并回复理智，教团领袖伊莱亚斯可献祭己方单位、从牌堆直接召唤异怪。</p>
        <p>界面只读取引擎提供的合法动作，所有写入均经引擎校验；固定种子可复现，随机牌局每局生成新种子。</p>
      </div>
    </details>
  </section>`;
}

export default renderMainMenu;
