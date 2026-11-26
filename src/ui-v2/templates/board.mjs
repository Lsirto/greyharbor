/**
 * templates/board.mjs — composes the whole board from buildView() data.
 * Pure: takes a view fragment + options, returns one HTML string.
 *
 * Compact one-screen layout: masthead → opponent row → midline → viewer row,
 * with the viewer's hand docked at the bottom so no page scrolling is needed.
 */

import { asArray, asObject, escapeHtml, safeInt } from '../utils.mjs';
import { icon } from './icons.mjs';
import { renderPlayerBar } from './player-bar.mjs';
import { renderLeaderZone } from './leader.mjs';
import { renderLocationGrid } from './location-column.mjs';
import { renderEnvironmentRow } from './environment.mjs';
import { renderHandZone } from './hand.mjs';

const PHASE_ZH = Object.freeze({
  mulligan: '换牌阶段',
  play: '行动阶段',
  gameOver: '对局结束',
});

const RESULT_REASON_ZH = Object.freeze({
  sanity: '理智归零',
  nightWins: '两夜取胜',
  tiebreak: '终局判定',
});

function renderHistory(history, pov) {
  const entries = asArray(history).slice(-3);
  if (!entries.length) return '<li class="gh2-history__empty">尚无夜结算记录</li>';
  return entries.map((entry) => {
    const data = asObject(entry);
    const scores = asArray(data.scores);
    const me = safeInt(scores[pov]?.total, 0);
    const foe = safeInt(scores[1 - pov]?.total, 0);
    const winner = data.winner;
    const outcome = winner === null || winner === undefined
      ? '平夜'
      : `${winner === pov ? '你' : '对手'}胜`;
    return `<li>第 ${escapeHtml(safeInt(data.night, 0))} 夜 · ${escapeHtml(me)} : ${escapeHtml(foe)} · ${escapeHtml(outcome)}</li>`;
  }).join('');
}

function renderStatusNotes(view, pov) {
  const data = asObject(view);
  const notes = [];
  if (data.phase === 'mulligan') {
    const done = asArray(data.mulliganDone);
    const me = done[pov] === true;
    const foe = done[1 - pov] === true;
    notes.push(`换牌中 · 你${me ? '已完成' : '待确认'} / 对手${foe ? '已完成' : '待确认'}`);
  }
  if (data.phase === 'play') {
    if (data.current === pov) notes.push('当前由你行动');
    else if (data.current === 1 - pov) notes.push('当前由对手行动');
  }
  const passed = asArray(data.passed);
  if (passed[pov] === true) notes.push('你已过牌');
  if (passed[1 - pov] === true) notes.push('对手已过牌');

  const result = asObject(data.result);
  if (data.phase === 'gameOver' || result.winner !== undefined) {
    const winner = result.winner;
    const outcome = winner === null || winner === undefined
      ? '平局'
      : winner === pov ? '你获胜' : '对手获胜';
    const reason = RESULT_REASON_ZH[result.reason] ?? result.reason ?? '对局结束';
    notes.push(`对局结束 · ${outcome} · ${reason}`);
  }
  if (!notes.length) notes.push('棋盘为只读演示 · 操作由演示控制器自动执行');

  return `<div class="gh2-status-notes">${notes.map((note) =>
    `<span class="gh2-status-note">${escapeHtml(note)}</span>`,
  ).join('')}</div>`;
}

function renderDemoBanner(demo) {
  if (!demo || demo.enabled !== true) return '';
  return `<div class="gh2-demo-banner" data-demo-banner="true">
    <span class="gh2-demo-banner__mark">${icon('night')} 演示模式 · DEMO</span>
    <span class="gh2-demo-banner__meta">固定种子 <b>${escapeHtml(demo.seed ?? 'greyharbor')}</b></span>
    <span class="gh2-demo-banner__meta">第 ${escapeHtml(safeInt(demo.step, 0))} 步</span>
    <span class="gh2-demo-banner__meta">${escapeHtml(demo.running === true ? '自动播放中' : demo.running === false ? '已暂停' : '待开始')}</span>
    <span class="gh2-demo-banner__meta gh2-demo-banner__last">${escapeHtml(demo.lastAction ?? '等待首个合法动作')}</span>
  </div>`;
}

export function renderBoardMarkup(view, options = {}) {
  const opts = asObject(options);
  const data = asObject(view);
  const pov = opts.pov === 1 ? 1 : 0;
  const players = asArray(data.players);
  const me = asObject(players[pov]);
  const foe = asObject(players[1 - pov]);
  const night = Math.max(0, safeInt(data.night, 1));
  const maxNights = Math.max(1, safeInt(data.maxNights, 3));
  const phase = typeof data.phase === 'string' ? data.phase : '';
  const phaseText = PHASE_ZH[phase] ?? phase ?? '未知阶段';
  const scores = asArray(data.scores);
  const scoreMe = Number.isFinite(scores[pov]) ? scores[pov] : me.score?.total ?? 0;
  const scoreFoe = Number.isFinite(scores[1 - pov]) ? scores[1 - pov] : foe.score?.total ?? 0;
  const nightWins = asArray(data.nightWins);
  const result = asObject(data.result);

  return `<section class="gh2-shell gh2-shell--compact" data-phase="${escapeHtml(phase)}" data-night="${night}" data-pov="${pov}">
    <header class="gh2-masthead gh2-masthead--compact">
      <div class="gh2-masthead__brand">
        <span class="gh2-masthead__seal">${icon('night')}</span>
        <div><h1>灰港三夜</h1><p>THREE NIGHTS IN GREYHARBOR</p></div>
      </div>
      <div class="gh2-masthead__round">
        <span class="gh2-masthead__night">第 ${escapeHtml(night)} 夜 <small>/ ${escapeHtml(maxNights)}</small></span>
        <span class="gh2-masthead__phase">${escapeHtml(phaseText)}</span>
        <span class="gh2-masthead__wins">夜胜 ${escapeHtml(safeInt(nightWins[pov], 0))} : ${escapeHtml(safeInt(nightWins[1 - pov], 0))}</span>
      </div>
      ${renderDemoBanner(opts.demo)}
    </header>

    ${renderStatusNotes(data, pov)}

    <div class="gh2-table">
      <div class="gh2-table__side gh2-table__side--opponent" data-side="opponent">
        <div class="gh2-table__main">
          ${renderLocationGrid(foe, { playerIndex: 1 - pov, anomaly: data.anomaly })}
        </div>
        <aside class="gh2-table__rail">
          ${renderPlayerBar(foe, {
            role: '对手 · AI',
            current: data.current === 1 - pov,
            passed: asArray(data.passed)[1 - pov] === true,
            handCount: foe.handCount,
            score: scoreFoe,
          })}
          ${renderLeaderZone(foe.leader, { playerIndex: 1 - pov, label: '对手领袖' })}
          ${renderHandZone({ visible: false, count: foe.handCount, label: '对手手牌' })}
        </aside>
      </div>

      <div class="gh2-midline gh2-midline--compact">
        <div class="gh2-midline__dial">
          <span>${icon('moon')} NIGHT ${escapeHtml(night)}</span>
          <strong>${escapeHtml(scoreMe)} <em>:</em> ${escapeHtml(scoreFoe)}</strong>
          <span>当前夜分 · LIVE SCORE</span>
        </div>
        ${renderEnvironmentRow(data.environments)}
        <div class="gh2-history">
          <h3>${icon('archive')} 夜结算记录</h3>
          <ul>${renderHistory(data.history, pov)}</ul>
        </div>
      </div>

      <div class="gh2-table__side gh2-table__side--viewer" data-side="viewer">
        <aside class="gh2-table__rail">
          ${renderPlayerBar(me, {
            role: '你 · P' + pov,
            current: data.current === pov,
            passed: asArray(data.passed)[pov] === true,
            handCount: me.handCount,
            score: scoreMe,
          })}
          ${renderLeaderZone(me.leader, {
            playerIndex: pov,
            label: '己方领袖',
            leaderPortrait: opts.leaderPortrait,
          })}
        </aside>
        <div class="gh2-table__main">
          ${renderLocationGrid(me, { playerIndex: pov, anomaly: data.anomaly, cardBackId: opts.cardBackId })}
        </div>
      </div>
    </div>

    <div class="gh2-hand-dock">
      ${renderHandZone({ visible: true, cards: me.hand, count: me.handCount, label: '己方手牌' })}
    </div>

    ${result.winner !== undefined ? `<div class="gh2-legend__result">结果：${escapeHtml(result.reason ?? '对局结束')}</div>` : ''}
  </section>`;
}

export default renderBoardMarkup;
