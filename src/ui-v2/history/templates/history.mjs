/**
 * src/ui-v2/history/templates/history.mjs — pure HTML for the career page.
 * The controller supplies the aggregated career view model; ids are resolved
 * to Chinese labels here. All dynamic text is escaped.
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

function factionCrest(faction) {
  return FACTION_CARDS[faction]?.crest ?? '✦';
}

function leaderCard(leader) {
  if (!leader) return null;
  return getCharacterCard(leader);
}

function leaderName(leader) {
  const card = leaderCard(leader);
  return card ? card.nameZh : '未选择';
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

function statCell(label, value) {
  return `<div class="gh2-career__stat"><b>${escapeHtml(String(value))}</b><small>${escapeHtml(label)}</small></div>`;
}

function renderOverview(m) {
  const cells = [
    { label: '总场次', value: m.total ?? 0 },
    { label: '胜', value: m.wins ?? 0 },
    { label: '负', value: m.losses ?? 0 },
    { label: '平', value: m.draws ?? 0 },
    { label: '胜率', value: formatWinRate(m.winRate) },
    { label: '当前连胜', value: m.currentStreak ?? 0 },
    { label: '最佳连胜', value: m.bestStreak ?? 0 },
    { label: '游玩天数', value: m.playDays ?? 0 },
    { label: '最早开局', value: formatTime(m.firstMatchAt) },
  ];
  return `<div class="gh2-career__overview">
    ${cells.map((cell) => statCell(cell.label, cell.value)).join('')}
  </div>`;
}

function renderFactionRow(group) {
  return `
    <li class="gh2-career__row">
      <span class="gh2-career__row-crest" aria-hidden="true">${escapeHtml(factionCrest(group.key))}</span>
      <span class="gh2-career__row-name">${escapeHtml(factionName(group.key))}</span>
      <span class="gh2-career__row-meta">${group.wins} 胜 / ${group.total} 局</span>
      <span class="gh2-career__row-rate">${escapeHtml(formatWinRate(group.winRate))}</span>
    </li>`;
}

function renderLeaderRow(group) {
  const card = leaderCard(group.key);
  const portrait = card
    ? `<img class="gh2-career__portrait" src="./assets/art/${encodeURIComponent(card.id)}.jpg" alt="" onerror="this.style.display='none'">`
    : '';
  const icon = card?.icon ?? '✦';
  return `
    <li class="gh2-career__row">
      <span class="gh2-career__row-portrait">${portrait}<span class="gh2-career__row-icon" aria-hidden="true">${escapeHtml(icon)}</span></span>
      <span class="gh2-career__row-name">${escapeHtml(leaderName(group.key))}</span>
      <span class="gh2-career__row-meta">${group.wins} 胜 / ${group.total} 局</span>
      <span class="gh2-career__row-rate">${escapeHtml(formatWinRate(group.winRate))}</span>
    </li>`;
}

function renderGroup(title, groups, rowOf) {
  if (!Array.isArray(groups) || groups.length === 0) return '';
  const rows = groups.map(rowOf).join('');
  return `<section class="gh2-career__group">
    <h3>${escapeHtml(title)}</h3>
    <ul class="gh2-career__rows">${rows}</ul>
  </section>`;
}

function renderCollection(col) {
  const cells = [
    { label: '理智币', value: col.coins ?? 0 },
    { label: '卡背收藏', value: `${col.backOwned ?? 0}/${col.backTotal ?? 0}` },
    { label: '皮肤收藏', value: `${col.skinOwned ?? 0}/${col.skinTotal ?? 0}` },
    { label: '卡背抽卡', value: col.backPulls ?? 0 },
    { label: '皮肤抽卡', value: col.skinPulls ?? 0 },
  ];
  return `<section class="gh2-career__group">
    <h3>收藏与资产</h3>
    <div class="gh2-career__mini-grid">
      ${cells.map((cell) => statCell(cell.label, cell.value)).join('')}
    </div>
  </section>`;
}

function renderAchievementSummary(ach, daily) {
  const cells = [
    { label: '成就解锁', value: `${ach.unlockedCount ?? 0}/${ach.total ?? 0}` },
    { label: '打卡天数', value: daily.total ?? 0 },
    { label: '当前连续', value: daily.currentStreak ?? 0 },
    { label: '最佳连续', value: daily.bestStreak ?? 0 },
  ];
  return `<section class="gh2-career__group">
    <h3>成就与打卡</h3>
    <div class="gh2-career__mini-grid">
      ${cells.map((cell) => statCell(cell.label, cell.value)).join('')}
    </div>
    <div class="gh2-career__links">
      <button type="button" class="gh2-career__link" data-career-nav="achievements">成就墙</button>
      <button type="button" class="gh2-career__link" data-career-nav="shop">神秘商店</button>
      <button type="button" class="gh2-career__link" data-career-nav="daily">每日挑战</button>
    </div>
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
 * @param {{career?: object}} input
 */
export function renderHistory(input = {}) {
  const career = input.career ?? {};
  const m = career.matches ?? {};
  const col = career.collection ?? {};
  const ach = career.achievements ?? {};
  const daily = career.daily ?? {};
  const recent = Array.isArray(m.recent) ? m.recent : [];
  const empty = (m.total ?? 0) === 0;

  const recentBlock = empty
    ? `<div class="gh2-history__empty">还没有对局记录。打完一局人机、竞技场或每日挑战后，这里会自动统计胜败、胜率与擅长阵营领袖。</div>`
    : `<ul class="gh2-history__recent">${recent.map(renderRecent).join('')}</ul>`;

  return `<section class="gh2-history" aria-label="调查员生涯">
    <header class="gh2-history__head">
      <button type="button" class="gh2-back-btn" data-history-exit>← 返回主菜单</button>
      <div class="gh2-history__heading">
        <h2>调查员生涯</h2>
        <p>汇总对局胜负、擅长阵营领袖、收藏资产与长期成就</p>
      </div>
    </header>
    ${renderOverview(m)}
    <div class="gh2-career__duo">
      ${renderGroup('擅长阵营', m.byFaction, renderFactionRow)}
      ${renderGroup('擅长领袖', m.byLeader, renderLeaderRow)}
    </div>
    <div class="gh2-career__duo">
      ${renderCollection(col)}
      ${renderAchievementSummary(ach, daily)}
    </div>
    ${renderGroup('按模式', m.byMode, (group) => `
      <li class="gh2-career__row">
        <span class="gh2-career__row-name">${escapeHtml(modeName(group.key))}</span>
        <span class="gh2-career__row-meta">${group.wins} 胜 / ${group.total} 局</span>
        <span class="gh2-career__row-rate">${escapeHtml(formatWinRate(group.winRate))}</span>
      </li>`)}
    ${recentBlock}
  </section>`;
}

export default renderHistory;
