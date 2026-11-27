/**
 * tests/save/backup.test.mjs — backup collect / parse / restore contract.
 * In-memory storage; no DOM, no file access.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createStorage } from '../../src/ui-v2/storage.mjs';
import {
  BACKUP_KEYS,
  BACKUP_VERSION,
  collectBackup,
  parseBackup,
  restoreBackup,
} from '../../src/save/backup.mjs';
import { ECONOMY_KEY } from '../../src/economy/economy.mjs';
import { HISTORY_KEY } from '../../src/history/match-history.mjs';

function memStorage() {
  const map = new Map();
  const backend = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
  return { storage: createStorage(backend), map };
}

test('收集：只收录已知存档键与原始字符串', () => {
  const { storage, map } = memStorage();
  storage.setJson(ECONOMY_KEY, { coins: 120, skins: ['default'] });
  storage.setJson(HISTORY_KEY, [{ winner: 0 }]);
  storage.setRaw('unknown.key', 'should-not-export');

  const backup = collectBackup(storage, { now: 1700000000000 });
  assert.equal(backup.app, 'greyharbor');
  assert.equal(backup.version, BACKUP_VERSION);
  assert.equal(backup.exportedAt, 1700000000000);
  assert.ok(ECONOMY_KEY in backup.keys);
  assert.ok(HISTORY_KEY in backup.keys);
  assert.equal('unknown.key' in backup.keys, false);
  assert.equal(Object.keys(backup.keys).length, 2);
  assert.ok(backup.keys[ECONOMY_KEY].includes('"coins"'));
});

test('空存储：收集得到空 keys，不抛错', () => {
  const { storage } = memStorage();
  const backup = collectBackup(storage, { now: 1 });
  assert.deepEqual(backup.keys, {});
});

test('解析：合法备份往返，只保留已知键', () => {
  const { storage } = memStorage();
  storage.setJson(ECONOMY_KEY, { coins: 88 });
  const backup = collectBackup(storage, { now: 2 });
  const text = JSON.stringify(backup);

  const parsed = parseBackup(text);
  assert.equal(parsed.version, BACKUP_VERSION);
  assert.ok(ECONOMY_KEY in parsed.keys);

  const fresh = memStorage();
  const count = restoreBackup(fresh.storage, parsed);
  assert.equal(count, 1);
  assert.deepEqual(fresh.storage.getJson(ECONOMY_KEY), { coins: 88 });
});

test('解析：坏文件逐一抛出中文错误', () => {
  assert.throws(() => parseBackup(''), /存档文件为空/);
  assert.throws(() => parseBackup('{not json'), /格式不正确/);
  assert.throws(() => parseBackup(JSON.stringify({ app: 'other', keys: {} })), /不是本游戏/);
  assert.throws(() => parseBackup(JSON.stringify({ app: 'greyharbor', version: 99, keys: {} })), /版本不兼容/);
  assert.throws(() => parseBackup(JSON.stringify({ app: 'greyharbor', version: BACKUP_VERSION, keys: {} })), /没有可恢复/);
});

test('恢复：未知键被忽略，返回实际写入数', () => {
  const target = memStorage();
  const parsed = parseBackup(JSON.stringify({
    app: 'greyharbor',
    version: BACKUP_VERSION,
    keys: { [ECONOMY_KEY]: '{"coins":5}', 'evil.key': 'x' },
  }));
  const count = restoreBackup(target.storage, parsed);
  assert.equal(count, 1);
  assert.equal(target.map.has('evil.key'), false);
  assert.deepEqual(target.storage.getJson(ECONOMY_KEY), { coins: 5 });
});

test('已知存档键清单稳定，覆盖经济/战绩/成就/每日/牌组/难度', () => {
  assert.equal(BACKUP_KEYS.length, 6);
  assert.ok(BACKUP_KEYS.includes(ECONOMY_KEY));
  assert.ok(BACKUP_KEYS.includes(HISTORY_KEY));
});
