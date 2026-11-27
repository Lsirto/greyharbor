/**
 * src/save/backup.mjs — pure save-game backup (collect / parse / restore).
 *
 * Collects the persisted match-economy, history, achievements, daily record,
 * custom decks and difficulty keys into one plain object; parses an imported
 * backup file with version / shape validation; restores known keys back into
 * the injected storage wrapper. No DOM, no file access here — the download /
 * file-picker plumbing lives in the UI layer.
 */

import { ECONOMY_KEY } from '../economy/economy.mjs';
import { HISTORY_KEY } from '../history/match-history.mjs';
import { ACHIEVEMENT_UNLOCK_KEY } from '../achievements/achievements.mjs';
import { DAILY_RECORD_KEY } from '../daily/daily.mjs';
import { CUSTOM_DECKS_KEY } from '../deck/decks-store.mjs';
import { DIFFICULTY_STORAGE_KEY } from '../ai/v2/difficulty.mjs';

/** Backup file schema version; bump when the persisted shapes change. */
export const BACKUP_VERSION = 1;

/** Persisted keys covered by backup, in a stable order. */
export const BACKUP_KEYS = Object.freeze([
  ECONOMY_KEY,
  HISTORY_KEY,
  ACHIEVEMENT_UNLOCK_KEY,
  DAILY_RECORD_KEY,
  CUSTOM_DECKS_KEY,
  DIFFICULTY_STORAGE_KEY,
]);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/**
 * Snapshot the known persisted keys into a plain backup object.
 * @param {object} storage injected storage wrapper (createStorage)
 * @param {{now?: number}} [context]
 */
export function collectBackup(storage, context = {}) {
  const ctx = asObject(context);
  const keys = {};
  for (const key of BACKUP_KEYS) {
    const raw = typeof storage?.getRaw === 'function' ? storage.getRaw(key) : null;
    if (typeof raw === 'string' && raw.length > 0) keys[key] = raw;
  }
  const now = Number(ctx.now);
  return Object.freeze({
    app: 'greyharbor',
    version: BACKUP_VERSION,
    exportedAt: Number.isFinite(now) && now > 0 ? now : Date.now(),
    keys,
  });
}

/**
 * Validate and normalise an imported backup file's text.
 * @param {string} text raw file text
 * @returns {{version: number, keys: object}}
 * @throws {Error} with a Chinese message when the file is not a valid backup
 */
export function parseBackup(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('存档文件为空');
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error('存档文件格式不正确');
  }
  const root = asObject(data);
  if (root.app !== 'greyharbor') throw new Error('不是本游戏的存档文件');
  if (root.version !== BACKUP_VERSION) throw new Error('存档版本不兼容');
  const rawKeys = asObject(root.keys);
  const keys = {};
  for (const key of BACKUP_KEYS) {
    if (typeof rawKeys[key] === 'string') keys[key] = rawKeys[key];
  }
  if (Object.keys(keys).length === 0) throw new Error('存档中没有可恢复的数据');
  return Object.freeze({ version: BACKUP_VERSION, keys });
}

/**
 * Restore known keys from a parsed backup into the storage wrapper.
 * @param {object} storage injected storage wrapper
 * @param {{keys?: object}} backup parsed backup from parseBackup
 * @returns {number} number of keys written
 */
export function restoreBackup(storage, backup) {
  const keys = asObject(asObject(backup).keys);
  let count = 0;
  for (const key of BACKUP_KEYS) {
    if (typeof keys[key] !== 'string') continue;
    if (typeof storage?.setRaw === 'function' && storage.setRaw(key, keys[key])) count += 1;
  }
  return count;
}

export default collectBackup;
