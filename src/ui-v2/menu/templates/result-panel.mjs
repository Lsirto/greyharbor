/**
 * src/ui-v2/menu/templates/result-panel.mjs — end-of-match wrapper.
 * Shows the win/loss reason, night-by-night score history, a rematch button
 * (new seed in random mode) and a return-to-menu button.  Pure HTML.
 */

import { escapeHtml, asArray, asObject, safeInt } from '../../utils.mjs';

export const RESULT_REASON_ZH = Object.freeze({
  sanity: '理智归零',
  nightWins: '两夜取胜',
  tiebreak: '终局判定',
  objective: '目标达成',
});

export const OBJECTIVE_WIN_ZH = Object.freeze({ clue: '真相大白', doom: '旧神降临' });

/** Human-readable reason; objective wins name the faction-specific ending. */
function reasonText(result) {
  const base = asObject(result);
  if (base.reason === 'objective') {
    return OBJECTIVE_WIN_ZH[base.objectiveType] ?? RESULT_REASON_ZH.objective;
  }
  return RESULT_REASON_ZH[base.reason] ?? base.reason ?? '对局结束';
}

function outcomeText(result) {
  const winner = asObject(result).winner;
  if (winner === null || winner === undefined) return '平局';
  return winner === 0 ? '你获胜' : '对手获胜';
}

function nightRows(history) {
  const rows = asArray(history).map((entry, index) => {
    const data = asObject(entry);
    const night = safeInt(data.night, index + 1);
    const scores = asArray(data.scores).map((score) => safeInt(asObject(score).total, 0));
    const winner = data.winner === 0 ? '你' : data.winner === 1 ? '对手' : data.tie === true ? '平夜' : '—';
    return `<tr><td>第 ${night} 夜</td><td>${safeInt(scores[0], 0)} : ${safeInt(scores[1], 0)}</td><td>${escapeHtml(winner)}</td></tr>`;
  }).join('');
  return rows || '<tr><td colspan="3">本局未完成夜结算</td></tr>';
}

/**
 * @param {{result?: object, nightHistory?: Array, seed?: string, matchConfig?: object}} info
 */
export function renderResultPanel(info = {}) {
  const data = asObject(info);
  const result = asObject(data.result);
  const reason = reasonText(result);
  const random = asObject(data.matchConfig).seedMode === 'random';
  return `<div class="gh2-result-panel" role="dialog" aria-modal="true" aria-label="对局结算">
    <div class="gh2-result-panel__seal" aria-hidden="true">${escapeHtml(outcomeText(result))}</div>
    <h2 class="gh2-result-panel__title">${escapeHtml(outcomeText(result))}</h2>
    <p class="gh2-result-panel__reason">胜负原因 · ${escapeHtml(String(reason))}</p>
    <table class="gh2-result-panel__history">
      <caption>夜分历史</caption>
      <thead><tr><th>夜次</th><th>比分（你 : 对手）</th><th>胜方</th></tr></thead>
      <tbody>${nightRows(data.nightHistory)}</tbody>
    </table>
    <p class="gh2-result-panel__seed">${random ? '随机牌局' : '固定牌局'}</p>
    <div class="gh2-result-panel__actions">
      <button type="button" class="gh2-menu-btn gh2-menu-btn--primary" data-menu-action="rematch">
        <b>再来一局</b><small>${random ? '开一局全新牌局' : '再来一局相同牌局'}</small>
      </button>
      <button type="button" class="gh2-menu-btn" data-menu-action="menu"><b>返回主菜单</b><small>重新选择阵营与模式</small></button>
    </div>
  </div>`;
}

export default renderResultPanel;
