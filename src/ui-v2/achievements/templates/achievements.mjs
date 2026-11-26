/**
 * src/ui-v2/achievements/templates/achievements.mjs — pure HTML for the
 * achievement wall. The controller supplies the evaluated wall (items with live
 * progress and unlock timestamps); all dynamic text is escaped.
 */

import { escapeHtml } from '../../../ui-v2/utils.mjs';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatUnlockDate(unlockedAt) {
  if (!Number.isFinite(unlockedAt)) return '';
  const date = new Date(unlockedAt);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function renderItem(item) {
  const def = item.def ?? {};
  const satisfied = item.satisfied === true;
  const current = Number(item.current) || 0;
  const target = Number(item.target) || 1;
  const widthPct = Math.max(0, Math.min(100, Math.round((current / target) * 100)));

  let caption;
  if (satisfied) {
    caption = `已解锁 · ${formatUnlockDate(item.unlockedAt)}`;
  } else if (item.gatePassed === false) {
    caption = '需先满足前置条件';
  } else {
    caption = `${Math.min(current, target)} / ${target}`;
  }

  return `<li class="gh2-ach ${satisfied ? 'is-unlocked' : 'is-locked'}">
    <span class="gh2-ach__icon" aria-hidden="true">${escapeHtml(def.icon ?? '🔒')}</span>
    <div class="gh2-ach__body">
      <b>${escapeHtml(def.name ?? '')}</b>
      <small>${escapeHtml(def.description ?? '')}</small>
      <span class="gh2-ach__progress"><span style="width:${widthPct}%"></span></span>
      <em>${escapeHtml(caption)}</em>
    </div>
  </li>`;
}

/**
 * @param {{wall: object}} input
 */
export function renderAchievements(input = {}) {
  const wall = input.wall ?? {};
  const items = Array.isArray(wall.items) ? wall.items : [];
  const unlockedCount = Number(wall.unlockedCount) || 0;
  const total = Number(wall.total) || items.length;

  return `<section class="gh2-achievements" aria-label="成就墙">
    <header class="gh2-achievements__head">
      <button type="button" class="gh2-back-btn" data-ach-exit>← 返回主菜单</button>
      <div class="gh2-achievements__heading">
        <h2>成就墙</h2>
        <p>已解锁 ${unlockedCount} / ${total}</p>
      </div>
    </header>
    <ul class="gh2-ach-grid">
      ${items.map(renderItem).join('')}
    </ul>
  </section>`;
}

export default renderAchievements;
