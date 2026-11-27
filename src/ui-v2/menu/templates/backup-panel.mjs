/**
 * src/ui-v2/menu/templates/backup-panel.mjs — 存档备份浮层（纯模板，无 DOM）。
 * 导出 / 导入本地存档文件；提示文案由调用方传入。
 */

import { escapeHtml } from '../../utils.mjs';

/**
 * @param {{message?: string, messageKind?: 'ok'|'warn'|''}} [options]
 */
export function renderBackupPanel(options = {}) {
  const opts = options && typeof options === 'object' ? options : {};
  const message = typeof opts.message === 'string' ? opts.message : '';
  const kind = opts.messageKind === 'ok' || opts.messageKind === 'warn' ? opts.messageKind : '';
  const messageHtml = message
    ? `<p class="gh2-backup__message${kind ? ` gh2-backup__message--${kind}` : ''}">${escapeHtml(message)}</p>`
    : '';
  return `<div class="gh2-audio-overlay" data-backup-layer>
    <div class="gh2-audio-modal" role="dialog" aria-modal="true" aria-label="存档备份">
      <header class="gh2-audio__top">
        <h2>存档备份</h2>
        <button type="button" class="gh2-audio__close" data-backup-close aria-label="关闭">✕</button>
      </header>
      <p class="gh2-backup__hint">金币、抽卡库存、皮肤装备、战绩与成就都保存在本机。导出存档可存成文件，重装或换设备后导入即可恢复。</p>
      <div class="gh2-backup__actions">
        <button type="button" class="gh2-menu-btn gh2-menu-btn--primary" data-backup-export>
          <b>导出存档</b><small>把当前进度存成备份文件</small>
        </button>
        <button type="button" class="gh2-menu-btn" data-backup-import>
          <b>导入存档</b><small>从备份文件恢复进度</small>
        </button>
      </div>
      <input type="file" class="gh2-backup__file" data-backup-file accept=".json,application/json" hidden>
      ${messageHtml}
    </div>
  </div>`;
}

export default renderBackupPanel;
