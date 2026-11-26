/**
 * tests/ui-v2/storage.test.mjs — storage wrapper contract.
 * Uses an in-memory backend; no browser, no external dependency.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createStorage } from '../../src/ui-v2/storage.mjs';

function memBackend() {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

test('可用后端：getJson/setJson 往返，缺失键返回 fallback', () => {
  const backend = memBackend();
  const storage = createStorage(backend);
  assert.equal(storage.available, true);
  assert.equal(storage.getJson('missing', 42), 42);
  assert.equal(storage.getJson('missing'), null);

  storage.setJson('a', { x: 1, y: [2, 3] });
  assert.deepEqual(storage.getJson('a'), { x: 1, y: [2, 3] });
  assert.ok(backend.map.get('a').includes('"x"'));
});

test('getRaw/setRaw 与 remove', () => {
  const storage = createStorage(memBackend());
  storage.setRaw('k', 'plain');
  assert.equal(storage.getRaw('k'), 'plain');
  storage.remove('k');
  assert.equal(storage.getRaw('k'), null);
});

test('坏 JSON 不抛错，回退 fallback', () => {
  const backend = memBackend();
  backend.map.set('broken', '{not valid json');
  const storage = createStorage(backend);
  assert.equal(storage.getJson('broken', 'fb'), 'fb');
});

test('null / 不可用后端：available=false，写入安全 no-op', () => {
  const storage = createStorage(null);
  assert.equal(storage.available, false);
  assert.equal(storage.setJson('a', 1), false);
  assert.equal(storage.getJson('a', 'd'), 'd');
});

test('后端抛异常（隐私模式/配额）：读写都不抛出', () => {
  const throwing = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('quota'); },
    removeItem() { throw new Error('denied'); },
  };
  const storage = createStorage(throwing);
  assert.equal(storage.getRaw('a'), null);
  assert.equal(storage.setRaw('a', 'v'), false);
  assert.doesNotThrow(() => storage.remove('a'));
});
