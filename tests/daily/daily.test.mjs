/**
 * tests/daily/daily.test.mjs — pure Daily Challenge logic contract.
 * No DOM; fixed dates keep every assertion deterministic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAILY_RECORD_KEY,
  buildDailyBattleOptions,
  formatDate,
  getDailyConfig,
  leadersForFaction,
  readDailyResult,
  writeDailyResult,
} from '../../src/daily/daily.mjs';
import { CARDS } from '../../src/engine/v2/cards.js';
import { createStorage } from '../../src/ui-v2/storage.mjs';
import { createGame } from '../../src/engine/v2/index.js';
import { chooseAction } from '../../src/ai/v2/ai.mjs';

function memStorage() {
  const map = new Map();
  return createStorage({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  });
}

test('formatDate：本地时间 YYYY-MM-DD，非法日期抛错', () => {
  assert.equal(formatDate(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(formatDate('2026-11-26'), '2026-11-26');
  assert.throws(() => formatDate('not-a-date'), /valid date/);
});

test('leadersForFaction：仅返回该阵营领袖', () => {
  for (const faction of ['society', 'cult']) {
    const ids = leadersForFaction(faction);
    assert.ok(ids.length >= 1);
    for (const id of ids) {
      assert.equal(CARDS[id].type, 'leader');
      assert.equal(CARDS[id].faction, faction);
    }
  }
});

test('getDailyConfig：日期→确定性种子+阵营+合法领袖，同日期完全一致', () => {
  const c = getDailyConfig('2026-11-26');
  assert.equal(c.dateKey, '2026-11-26');
  assert.equal(c.seed, 'greyharbor-daily-2026-11-26');
  assert.ok(['society', 'cult'].includes(c.faction));
  assert.equal(CARDS[c.leader].faction, c.faction);
  assert.equal(CARDS[c.leader].type, 'leader');

  const again = getDailyConfig(new Date(2026, 10, 26));
  assert.deepEqual({ ...again }, { ...c });
});

test('不同日期：配置会变化（覆盖到阵营/领袖轮换）', () => {
  const keys = new Set();
  for (let day = 1; day <= 14; day += 1) {
    const c = getDailyConfig(`2026-12-${String(day).padStart(2, '0')}`);
    keys.add(`${c.faction}:${c.leader}`);
  }
  assert.ok(keys.size > 1, '连续日期应出现不同的阵营/领袖组合');
});

test('buildDailyBattleOptions：座位0为人类阵营+领袖，座位1为对手预设', () => {
  const c = getDailyConfig('2026-11-26');
  const opts = buildDailyBattleOptions(c);
  assert.equal(opts.seed, c.seed);
  assert.equal(opts.decks.length, 2);
  assert.equal(opts.decks[0].faction, c.faction);
  assert.equal(opts.decks[0].leader, c.leader);
  assert.equal(opts.decks[0].cards.length, 19);
  const opponent = c.faction === 'society' ? 'cult' : 'society';
  assert.equal(opts.decks[1].faction, opponent);
});

test('每日结果：未记录为 null，写入后可读取且能区分胜负', () => {
  const storage = memStorage();
  assert.equal(readDailyResult(storage, '2026-11-26'), null);
  assert.equal(writeDailyResult(storage, '2026-11-26', true), true);
  assert.deepEqual(readDailyResult(storage, '2026-11-26'), { won: true });
  writeDailyResult(storage, '2026-11-27', false);
  assert.deepEqual(readDailyResult(storage, '2026-11-27'), { won: false });
  // Different days are independent.
  assert.equal(readDailyResult(storage, '2026-11-28'), null);
  assert.ok(DAILY_RECORD_KEY.length > 0);
});

test('坏记录容错：存档被污染时 readDailyResult 返回 null 而非抛出', () => {
  const storage = memStorage();
  storage.setJson(DAILY_RECORD_KEY, ['unexpected', 'array']);
  assert.equal(readDailyResult(storage, '2026-11-26'), null);
});

test('headless 验收：每日 battleOptions 可直接 createGame 并由 AI 打完', () => {
  const c = getDailyConfig('2026-11-26');
  const opts = buildDailyBattleOptions(c);
  const game = createGame(opts);
  let steps = 0;
  while (game.phase !== 'gameOver') {
    const player = game.phase === 'mulligan' ? game.pending.players[0] : game.current;
    const action = chooseAction(game.viewFor(player), { seed: `${opts.seed}#ai-${player}` });
    const outcome = game.apply(action);
    assert.equal(outcome.ok, true, outcome.error);
    steps += 1;
    if (steps > 400) throw new Error('daily battle deadlocked');
  }
  assert.ok([0, 1].includes(game.result().winner));
});
