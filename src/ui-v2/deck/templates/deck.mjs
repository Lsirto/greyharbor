/**
 * src/ui-v2/deck/templates/deck.mjs — pure HTML for the deck editor.
 * Reads the editor through the pure deck helpers and canonical CARDS; no DOM,
 * all dynamic text escaped. The controller wires the data-deck actions.
 */

import { CARDS } from '../../../engine/v2/cards.js';
import {
  copiesOf,
  leadersFor,
  poolFor,
  totalCount,
  typeBreakdown,
  validateEditor,
} from '../../../deck/editor.mjs';
import { FACTIONS_ZH, KEYWORDS_ZH, TYPES_ZH } from '../../card-view.mjs';
import { escapeHtml } from '../../utils.mjs';
import { icon } from '../../templates/icons.mjs';

// Data-driven Chinese labels keyed by validateDeck error codes (no per-id logic).
const ERROR_LABELS_ZH = Object.freeze({
  MALFORMED_INPUT: '牌组数据格式有误',
  UNKNOWN_CARD: '存在未知卡牌',
  FACTION_MISMATCH: '包含不属于本阵营或中立的卡牌',
  LEADER_INVALID: '领袖选择无效',
  LEADER_IN_ENTRIES: '领袖不能放入非领袖牌堆',
  NON_LEADER_COUNT: '非领袖卡必须恰好 19 张',
  COPY_LIMIT: '单张卡牌最多 2 份',
  TOTAL_COUNT: '含领袖在内必须恰好 20 张',
});

function errorText(error) {
  const label = ERROR_LABELS_ZH[error.code] ?? error.message;
  if (error.cardId && CARDS[error.cardId]) return `${label}：${CARDS[error.cardId].nameZh}`;
  return label;
}

function powerText(card) {
  if (card.reasonPower == null && card.madnessPower == null) return '';
  const reason = card.reasonPower ?? '—';
  const madness = card.madnessPower ?? '—';
  return `<small class="gh2-deck-card__power">${reason}/${madness}</small>`;
}

function costText(card) {
  if (!(card.sanityCost > 0)) return '';
  return `<small class="gh2-deck-card__cost">${icon('eye')}${card.sanityCost}</small>`;
}

function keywordText(card) {
  if (!card.keywords.length) return '';
  const labels = card.keywords.map((id) => KEYWORDS_ZH[id] ?? id).join('·');
  return `<small class="gh2-deck-card__kw">${escapeHtml(labels)}</small>`;
}

function renderPoolRow(editor, card) {
  const count = copiesOf(editor, card.id);
  const total = totalCount(editor);
  const atCap = count >= 2 || total >= 19;
  return `<li class="gh2-deck-card gh2-deck-card--${card.faction}">
    <div class="gh2-deck-card__main">
      <b>${escapeHtml(card.nameZh)}</b>
      <small class="gh2-deck-card__type">${TYPES_ZH[card.type] ?? card.type}</small>
      ${powerText(card)}${costText(card)}${keywordText(card)}
    </div>
    <span class="gh2-deck-card__count">${count}</span>
    <button type="button" class="gh2-deck-card__add" data-deck="add" data-card="${escapeHtml(card.id)}"
      ${atCap ? 'disabled aria-disabled="true"' : ''} title="加入牌组">＋</button>
  </li>`;
}

function renderDeckRow(editor, card) {
  const count = copiesOf(editor, card.id);
  if (!count) return '';
  return `<li class="gh2-deck-list__row">
    <b>${escapeHtml(card.nameZh)}</b>
    <small>${TYPES_ZH[card.type] ?? card.type}</small>
    <span class="gh2-deck-list__count">×${count}</span>
    <button type="button" class="gh2-deck-list__remove" data-deck="remove" data-card="${escapeHtml(card.id)}" title="移除">－</button>
  </li>`;
}

function renderValidation(editor) {
  const validation = validateEditor(editor);
  if (validation.ok) {
    return `<div class="gh2-deck-valid">牌组合法 · 非领袖 ${validation.summary.nonLeaderCount}/19</div>`;
  }
  const items = validation.errors.map((error) =>
    `<li>${escapeHtml(errorText(error))}</li>`).join('');
  return `<div class="gh2-deck-invalid"><b>牌组尚未完成</b><ul>${items}</ul></div>`;
}

function renderBreakdown(editor) {
  const breakdown = typeBreakdown(editor);
  return Object.entries(breakdown).map(([type, count]) =>
    `<span>${TYPES_ZH[type] ?? type} <b>${count}</b></span>`).join('');
}

/**
 * @param {object} editor
 * @param {{saved?: boolean}} [extra]
 */
export function renderDeckEditor(editor, extra = {}) {
  const saved = extra.saved === true;
  const total = totalCount(editor);
  const validation = validateEditor(editor);
  const pool = poolFor(editor.faction);
  const leaders = leadersFor(editor.faction);

  return `<section class="gh2-deck-editor" aria-label="卡组编辑器">
    <header class="gh2-deck-editor__head">
      <button type="button" class="gh2-back-btn" data-deck="exit">← 返回主菜单</button>
      <h2>卡组编辑器</h2>
      <span class="gh2-deck-editor__faction">${FACTIONS_ZH[editor.faction] ?? editor.faction}</span>
    </header>

    <div class="gh2-deck-faction" role="group" aria-label="选择阵营">
      ${['society', 'cult'].map((faction) =>
        `<button type="button" class="gh2-deck-faction__btn ${editor.faction === faction ? 'is-selected' : ''}"
          data-deck="faction" data-faction="${faction}" aria-pressed="${editor.faction === faction}">
          ${FACTIONS_ZH[faction]}</button>`).join('')}
    </div>

    <div class="gh2-deck-leaders" role="group" aria-label="选择领袖">
      ${leaders.map((leader) =>
        `<button type="button" class="gh2-deck-leader ${editor.leader === leader.id ? 'is-selected' : ''}"
          data-deck="leader" data-leader="${escapeHtml(leader.id)}" aria-pressed="${editor.leader === leader.id}">
          ${escapeHtml(leader.nameZh)}</button>`).join('')}
    </div>

    <div class="gh2-deck-body">
      <div class="gh2-deck-pool">
        <h3>可选卡池（${escapeHtml(editor.faction)} + 中立）</h3>
        <ul class="gh2-deck-pool__list">${pool.map((card) => renderPoolRow(editor, card)).join('')}</ul>
      </div>
      <div class="gh2-deck-current">
        <h3>当前牌组（${total}/19）</h3>
        <ul class="gh2-deck-list">${pool.map((card) => renderDeckRow(editor, card)).join('') ||
          '<li class="gh2-deck-list__empty">尚未加入任何卡牌</li>'}</ul>
        <div class="gh2-deck-breakdown">${renderBreakdown(editor)}</div>
        ${renderValidation(editor)}
      </div>
    </div>

    <footer class="gh2-deck-actions">
      <button type="button" class="gh2-deck-save" data-deck="save">${saved ? '已保存 ✓' : '保存牌组'}</button>
      <button type="button" class="gh2-deck-start ${validation.ok ? '' : 'is-disabled'}" data-deck="start"
        ${validation.ok ? '' : 'disabled aria-disabled="true"'}>使用该牌组出战</button>
    </footer>
  </section>`;
}

export default renderDeckEditor;
