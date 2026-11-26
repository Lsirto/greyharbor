/**
 * src/ui-v2/daily/templates/daily.mjs — pure HTML for the Daily Challenge intro.
 *
 * Shows the fixed calendar-day match (faction + leader portrait) and whether it
 * has already been completed today. No DOM access; the controller supplies the
 * config and the leader display metadata, all dynamic text is escaped.
 */

import { escapeHtml } from '../../utils.mjs';
import { FACTIONS_ZH } from '../../card-view.mjs';

function statusTag(record) {
  if (!record) {
    return `<span class="gh2-daily-status gh2-daily-status--open">今日尚未完成</span>`;
  }
  const won = record.won === true;
  return `<span class="gh2-daily-status ${won ? 'gh2-daily-status--win' : 'gh2-daily-status--loss'}">
    今日已挑战 · ${won ? '胜利' : '失利'}
  </span>`;
}

const EMPTY_STATS = Object.freeze({
  total: 0, wins: 0, losses: 0, winRate: null,
  currentStreak: 0, bestStreak: 0, recent: [],
});

function renderStats(stats) {
  const winRateText = stats.winRate === null ? '—' : `${Math.round(stats.winRate * 100)}%`;
  const metrics = [
    { value: String(stats.currentStreak), label: '当前连续' },
    { value: String(stats.bestStreak), label: '最长连续' },
    { value: String(stats.total), label: '累计场次' },
    { value: winRateText, label: '胜率' },
  ];
  const tiles = metrics.map((metric) => `
    <div class="gh2-daily-stat">
      <b>${escapeHtml(metric.value)}</b><span>${escapeHtml(metric.label)}</span>
    </div>`).join('');

  const history = stats.recent.length === 0
    ? `<p class="gh2-daily-history__empty">还没有战绩，开始今日挑战累积连续打卡。</p>`
    : `<ul class="gh2-daily-history">${stats.recent.map((entry) => `
        <li>
          <span class="gh2-daily-history__date">${escapeHtml(entry.dateKey)}</span>
          <span class="gh2-daily-history__mark ${entry.won ? 'is-win' : 'is-loss'}">${entry.won ? '胜' : '负'}</span>
        </li>`).join('')}
      </ul>`;

  return `<div class="gh2-daily-stats">
    <div class="gh2-daily-stat-grid">${tiles}</div>
    <div class="gh2-daily-history-wrap">
      <h3>最近战绩</h3>
      ${history}
    </div>
  </div>`;
}

/**
 * @param {{config: object, leader: object, record: object|null, stats: object}} input
 */
export function renderDailyIntro(input = {}) {
  const config = input.config ?? {};
  const leader = input.leader ?? {};
  const record = input.record ?? null;
  const stats = input.stats ?? EMPTY_STATS;
  const factionName = FACTIONS_ZH[config.faction] ?? config.faction;
  return `<section class="gh2-daily" aria-label="每日挑战">
    <header class="gh2-daily__head">
      <button type="button" class="gh2-back-btn" data-daily-exit>← 返回主菜单</button>
      <div class="gh2-daily__heading">
        <h2>每日挑战</h2>
        <p>${escapeHtml(config.dateKey ?? '')} · 当天所有玩家面对完全相同的一局</p>
      </div>
    </header>

    <div class="gh2-daily-card gh2-daily-card--${escapeHtml(config.faction ?? '')}">
      <span class="gh2-daily-card__media">
        <img class="gh2-daily-card__portrait"
          src="./assets/art/${encodeURIComponent(leader.id ?? '')}.jpg"
          alt="" onerror="this.style.display='none'">
        <span class="gh2-daily-card__icon" aria-hidden="true">${escapeHtml(leader.icon ?? '')}</span>
      </span>
      <span class="gh2-daily-card__body">
        <span class="gh2-daily-card__faction">${escapeHtml(factionName)}阵营</span>
        <span class="gh2-daily-card__title">${escapeHtml(leader.title ?? '')}</span>
        <span class="gh2-daily-card__name">${escapeHtml(leader.nameZh ?? '')}</span>
        <span class="gh2-daily-card__archetype">${escapeHtml(leader.archetype ?? '')}</span>
        ${statusTag(record)}
      </span>
    </div>

    ${renderStats(stats)}

    <footer class="gh2-daily__foot">
      <button type="button" class="gh2-menu-btn gh2-menu-btn--primary" data-daily-start>
        <span class="gh2-menu-btn__icon" aria-hidden="true">⚔</span>
        <span class="gh2-menu-btn__body">
          <b>${record ? '再次挑战今日对局' : '开始今日挑战'}</b>
          <small>当天固定牌局 · 所有人同场对局，结果记录到今日</small>
        </span>
      </button>
    </footer>
  </section>`;
}

export default renderDailyIntro;
