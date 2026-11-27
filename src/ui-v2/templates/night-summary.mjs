/**
 * templates/night-summary.mjs — human-readable end-of-night breakdown.
 * Pure string / object output, no DOM and no engine imports. The data is the
 * engine's `nightEnd` event payload (scores / sanity / winner / decidedBy).
 */

import { escapeHtml } from '../utils.mjs';

const HUMAN = 0;
const AI = 1;

/**
 * Build a structured Chinese summary of one night.
 * @returns {{ title: string, rows: string[], result: string, winsText: string }}
 */
export function buildNightSummary(data = {}) {
  const night = Number.isFinite(data.night) ? data.night : 0;
  const humanTotal = data.scores?.[HUMAN]?.total ?? 0;
  const aiTotal = data.scores?.[AI]?.total ?? 0;
  const sanityAfter = Array.isArray(data.sanityAfter) ? data.sanityAfter : [0, 0];
  const nightWins = Array.isArray(data.nightWins) ? data.nightWins : [0, 0];

  let result;
  if (data.tie === true) {
    result = '点数完全相同，本夜平局，双方理智各 −1';
  } else if (data.decidedBy === 'sanity') {
    const who = data.winner === HUMAN ? '你' : 'AI';
    result = `点数相同，${who}理智更高，因此赢得本夜`;
  } else {
    const who = data.winner === HUMAN ? '你' : 'AI';
    result = `${who}的总点数更高，赢得本夜`;
  }

  const lossLine = data.tie === true
    ? `理智变化：双方 −1（你剩 ${sanityAfter[HUMAN]}，AI 剩 ${sanityAfter[AI]}）`
    : `理智变化：负方 −1（你剩 ${sanityAfter[HUMAN]}，AI 剩 ${sanityAfter[AI]}）`;

  const rows = [
    `本夜点数：你 ${humanTotal} 点，AI ${aiTotal} 点`,
    result,
    lossLine,
  ];

  const winsText = `累计夜胜：你 ${nightWins[HUMAN] ?? 0} 夜，AI ${nightWins[AI] ?? 0} 夜（先赢 2 夜者胜）`;

  return { title: `第 ${night} 夜结算`, rows, result, winsText };
}

export function renderNightSummary(data = {}) {
  const summary = buildNightSummary(data);
  const rows = summary.rows.map((row) =>
    `<li>${escapeHtml(row)}</li>`).join('');
  return `<div class="gh2-modal__panel gh2-modal__panel--night" role="dialog" aria-modal="true">
    <h3 class="gh2-modal__title">${escapeHtml(summary.title)}</h3>
    <ul class="gh2-night-summary__rows">${rows}</ul>
    <p class="gh2-night-summary__wins">${escapeHtml(summary.winsText)}</p>
    <div class="gh2-modal__foot">
      <button type="button" class="gh2-modal__continue" data-gh2="night-continue">继续</button>
    </div>
  </div>`;
}

export default renderNightSummary;
