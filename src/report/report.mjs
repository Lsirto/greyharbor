/**
 * src/report/report.mjs — shareable match-report view model (pure, no DOM).
 *
 * Turns one completed-match `info` (the onGameOver payload) plus a small
 * context (mode, injected clock, optional history summary) into a plain,
 * display-ready object the canvas renderer draws from. All labels are
 * resolved to Chinese here; unknown ids fall back to neutral placeholders.
 */

import { MODES } from '../history/match-history.mjs';
import { reasonText } from '../ui-v2/menu/templates/result-panel.mjs';
import {
  FACTION_CARDS,
  getCharacterCard,
} from '../ui-v2/menu/templates/index.mjs';
import { asObject, asArray, safeInt } from '../ui-v2/utils.mjs';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDate(at) {
  const ts = Number(at);
  if (!Number.isFinite(ts) || ts <= 0) return '—';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} `
    + `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function factionLabel(faction) {
  return FACTION_CARDS[faction]?.nameZh ?? '未知阵营';
}

function leaderLabel(leader) {
  if (!leader) return '未选择';
  return getCharacterCard(leader)?.nameZh ?? '未知领袖';
}

function modeLabel(mode) {
  return MODES[mode] ?? '人机对战';
}

function outcomeOf(result) {
  const winner = asObject(result).winner;
  if (winner === null || winner === undefined) {
    return { winner: null, tone: 'draw', label: '平局' };
  }
  return winner === 0
    ? { winner: 0, tone: 'win', label: '你获胜' }
    : { winner: 1, tone: 'loss', label: '对手获胜' };
}

/** Last night's score "you : opponent", or '—' when no night was settled. */
function lastNightScore(history) {
  const rows = asArray(history);
  if (rows.length === 0) return '—';
  const last = asObject(rows[rows.length - 1]);
  const scores = asArray(last.scores).map((s) => safeInt(asObject(s).total, 0));
  if (scores.length < 2) return '—';
  return `${scores[0]} : ${scores[1]}`;
}

function formatWinRate(winRate) {
  if (winRate === null || winRate === undefined) return '—';
  return `${Math.round(winRate * 100)}%`;
}

/**
 * Build the report view model.
 *
 * @param {object} info onGameOver payload
 * @param {{mode?: string, now?: number, summary?: object}} [context]
 */
export function buildReport(info = {}, context = {}) {
  const data = asObject(info);
  const ctx = asObject(context);
  const result = asObject(data.result);
  const matchConfig = asObject(data.matchConfig);
  const outcome = outcomeOf(result);

  const leader = matchConfig.humanLeader ?? result.leader ?? null;
  const faction = matchConfig.humanFaction;
  const seedMode = matchConfig.seedMode === 'random' ? 'random' : 'fixed';
  const summary = asObject(ctx.summary);

  const record = summary.total
    ? {
      total: safeInt(summary.total, 0),
      winRateLabel: formatWinRate(summary.winRate),
      currentStreak: safeInt(summary.currentStreak, 0),
    }
    : null;

  return Object.freeze({
    title: '灰港三夜',
    subtitle: '对局战报',
    outcome,
    reason: reasonText(result),
    modeLabel: modeLabel(ctx.mode),
    factionLabel: factionLabel(faction),
    leaderLabel: leaderLabel(typeof leader === 'string' ? leader : null),
    nights: asArray(data.nightHistory).length,
    nightScore: lastNightScore(data.nightHistory),
    seedModeLabel: seedMode === 'random' ? '随机牌局' : '固定牌局',
    seed: typeof data.seed === 'string' && data.seed.length > 0 ? data.seed : '—',
    dateLabel: formatDate(ctx.now),
    record,
  });
}

export default buildReport;
