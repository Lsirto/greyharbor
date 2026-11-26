/**
 * src/ui-v2/campaign/templates/map.mjs — pure template for the run map.
 *
 * Renders the 7 tiers as compact rows; each node is a pill with a type glyph
 * and state classes (current / completed / reachable / locked). Reachable
 * nodes carry data-go and are the only clickable elements.
 */

import { escapeHtml } from '../../utils.mjs';

const NODE_GLYPH = Object.freeze({
  start: '◈',
  battle: '⚔',
  elite: '✦',
  event: '❖',
  rest: '☾',
  treasure: '⚜',
  boss: '☠',
});

const NODE_LABEL = Object.freeze({
  start: '起点',
  battle: '战斗',
  elite: '精英',
  event: '事件',
  rest: '休整',
  treasure: '宝藏',
  boss: 'Boss',
});

export function renderMapScreen(run, reachableIds) {
  const reachable = new Set(reachableIds);
  const completed = new Set(run.completedNodes);

  const tiers = run.map.tiers.map((nodes, tier) => {
    const pills = nodes.map((node) => {
      const states = [`is-${node.type}`];
      if (node.id === run.currentNodeId) states.push('is-current');
      if (completed.has(node.id)) states.push('is-completed');
      if (reachable.has(node.id)) states.push('is-reachable');
      const go = reachable.has(node.id) ? ` data-go="${escapeHtml(node.id)}" role="button" tabindex="0"` : '';
      return `<div class="gh2-cmap-node ${states.join(' ')}"${go}
          title="${escapeHtml(NODE_LABEL[node.type] ?? node.type)}">
        <span class="gh2-cmap-node__glyph" aria-hidden="true">${escapeHtml(NODE_GLYPH[node.type] ?? '•')}</span>
        <span class="gh2-cmap-node__label">${escapeHtml(NODE_LABEL[node.type] ?? node.type)}</span>
      </div>`;
    }).join('');
    return `<div class="gh2-cmap-tier" data-tier="${tier}">
      <span class="gh2-cmap-tier__num">${tier === 0 ? '起' : tier === run.map.tiers.length - 1 ? '王' : tier}</span>
      <div class="gh2-cmap-tier__nodes">${pills}</div>
    </div>`;
  }).join('');

  return `<section class="gh2-cmap" aria-label="战役地图">
    <header class="gh2-cmap-head">
      <h2>灰港调查之旅</h2>
      <ul class="gh2-cmap-stats">
        <li><b>${escapeHtml(run.supplies)}</b><small>物资</small></li>
        <li><b>${escapeHtml(run.deck.length)}</b><small>牌组</small></li>
        <li><b>${escapeHtml(run.relics.length)}</b><small>遗物</small></li>
      </ul>
    </header>
    <div class="gh2-cmap-body">${tiers}</div>
    <p class="gh2-cmap-hint">点击发光的可达节点继续；路线只能前进，不可回退。</p>
  </section>`;
}

export default renderMapScreen;
