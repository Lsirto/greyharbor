/**
 * src/ui-v2/campaign/templates/result.mjs — pure template for the run result.
 * Distinct copy for won (boss defeated) and lost (investigation ended).
 */

import { escapeHtml } from '../../utils.mjs';

export function renderRunResult(run) {
  const won = run.status === 'won';
  const title = won ? '调查成功' : '调查终止';
  const kicker = won ? 'VICTORY' : 'DEFEAT';
  const detail = won
    ? '你撑过了灰港的三夜，Boss 已被击败，真相得以封存。'
    : '你倒在了灰港的夜里。下一次调查，或许会有不同的路线与抉择。';

  return `<section class="gh2-cresult is-${escapeHtml(run.status)}" aria-label="战役结果">
    <span class="gh2-cresult__sigil" aria-hidden="true">${won ? '⚜' : '☠'}</span>
    <span class="gh2-cresult__kicker">${escapeHtml(kicker)}</span>
    <h2>${escapeHtml(title)}</h2>
    <p class="gh2-cresult__detail">${escapeHtml(detail)}</p>
    <ul class="gh2-cresult-stats">
      <li><b>${escapeHtml(run.completedNodes.length)}</b><small>完成节点</small></li>
      <li><b>${escapeHtml(run.relics.length)}</b><small>遗物</small></li>
      <li><b>${escapeHtml(run.supplies)}</b><small>剩余物资</small></li>
    </ul>
    <button type="button" class="gh2-menu-btn gh2-menu-btn--primary" data-run-exit>返回主菜单</button>
  </section>`;
}
