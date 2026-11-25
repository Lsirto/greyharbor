/** 强度测试：AI 对随机策略（左右座位轮换）胜率必须显著高于 65%。 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { runMatches } from '../../scripts/ai-match.mjs';

const THRESHOLD = 0.65;

test('AI vs random 400 局胜率 > 65%', () => {
  const summary = runMatches({ mode: 'ai-vs-random', games: 400, seedPrefix: 'ai-strength' });
  console.log('AI vs random strength:', JSON.stringify(summary));
  assert.equal(summary.games, 400);
  assert.ok(
    summary.aiWinRate > THRESHOLD,
    `AI win rate ${summary.aiWinRate} must exceed ${THRESHOLD}`,
  );
});
