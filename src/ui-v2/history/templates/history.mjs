/**
 * src/ui-v2/history/templates/history.mjs — pure HTML for the match history page.
 * The controller supplies the aggregated summary; ids are resolved to Chinese
 * labels here. All dynamic text is escaped.
 */

import { escapeHtml } from '../../../ui-v2/utils.mjs';
import { MODES } from '../../../history/match-history.mjs';
import {
  FACTION_CARDS,
  getCharacterCard,
  RESULT_REASON_ZH,
  OBJECTIVE_WIN_ZH,
} from '../../menu/templates/index.mjs';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatTime(at) {
  if (!Number.isFinite(at) || at <= 0) return '—';
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatWinRate(winRate) {
  return winRate === null || winRate === undefined ? '—' : `${Math.round(winRate * 100)}%`;
}

function factionName(faction) {
  return FACTION_CARDS[faction]?.nameZh ?? '未知阵营';
}

function leaderName(leader) {
  if (!leader) return '未选择';
  return getCharacterCard(leader)?.nameZh ?? '未知领袖';
}

function modeName(mode) {
  return MODES[mode] ?? mode ?? '未知模式';
}

function reasonLabel(entry) {
  if (entry.reason === 'objective') {
    return OBJECTIVE_WIN_ZH[entry.objectiveType] ?? RESULT_REASON_ZH.objective;
  }
  if (entry.reason && RESULT_REASON_ZH[entry.reason]) return RESULT_REASON_ZH[entry.reason];
  return entry.reason ?? '对局结束';
}

function outcome(entry) {
  if (entry.winner === 0) return { cls: 'is-win', label: '胜' };
  if (entry.winner === 1) return { cls: 'is-loss', label: '负' };
  return { cls: 'is-draw', label: '平' };
}

function renderOverview(summary) {
  const cells = [
    { label: '总场次', value: summary.total },
    { label: '胜', value: summary.wins },
    { label: '负', value: summary.losses },
    { label: '平', value: summary.draws },
    { label: '胜率', value: formatWinRate(summary.winRate) },
    { label: '当前连胜', value: summary.currentStreak },
  ];
  return `<div class="gh2-history__overview">
    ${cells.map((cell) => `<div class="gh2-history__stat"><b>${escapeHtml(String(cell.value))}</b><small>${escapeHtml(cell.label)}</small></div>`).join('')}
  </div>`;
}

function renderGroup(title, groups, nameOf) {
  if (!Array.isArray(groups) || groups.length === 0) return '';
  const rows = groups.map((group) => `
    <li class="gh2-history__row">
      <span class="gh2-history__row-name">${escapeHtml(nameOf(group.key))}</span>
      <span class="gh2-history__row-meta">${group.wins} 胜 / ${group.total} 局</span>
      <span class="gh2-history__row-rate">${escapeHtml(formatWinRate(group.winRate))}</span>
    </li>`).join('');
  return `<section class="gh2-history__group">
    <h3>${escapeHtml(title)}</h3>
    <ul class="gh2-history__rows">${rows}</ul>
  </section>`;
}

function renderRecent(entry) {
  const o = outcome(entry);
  return `<li class="gh2-history__match ${o.cls}">
    <span class="gh2-history__match-outcome">${escapeHtml(o.label)}</span>
    <div class="gh2-history__match-body">
      <b>${escapeHtml(modeName(entry.mode))} · ${escapeHtml(factionName(entry.faction))} ${escapeHtml(leaderName(entry.leader))}</b>
      <small>${escapeHtml(reasonLabel(entry))} · ${entry.nights} 夜</small>
    </div>
    <span class="gh2-history__match-time">${escapeHtml(formatTime(entry.at))}</span>
  </li>`;
}

/**
 * @param {{summary?: object}} input
 */
export function renderHistory(input = {}) {
  const summary = input.summary ?? {};
  const recent = Array.isArray(summary.recent) ? summary.recent : [];
  const empty = summary.total === 0;

  const recentBlock = empty
    ? `<div class="gh2-history__empty">还没有对局记录。打完一局人机、竞技场或每日挑战后，这里会自动统计胜败与胜率。</div>`
    : `<ul class="gh2-history__recent">${recent.map(renderRecent).join('')}</ul>`;

  return `<section class="gh2-history" aria-label="战绩记录">
    <header class="gh2-history__head">
      <button type="button" class="gh2-back-btn" data-history-exit>← 返回主菜单</button>
      <div class="gh2-history__heading">
        <h2>战绩记录</h2>
        <p>跨模式的对局胜败、胜率与最近战况</p>
      </div>
    </header>
    ${empty ? '' : renderOverview(summary)}
    ${renderGroup('按模式', summary.byMode, modeName)}
    ${renderGroup('按阵营', summary.byFaction, factionName)}
    ${renderGroup('按领袖', summary.byLeader, leaderName)}
    ${recentBlock}
  </section>`;
}

export default renderHistory;
