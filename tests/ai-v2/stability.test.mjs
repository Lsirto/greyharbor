/** 稳定性：AI vs AI 1000 局，0 崩溃、0 卡死、牌数守恒，并输出统计。 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { runMatches } from '../../scripts/ai-match.mjs';

test('AI vs AI 1000 局稳定、守恒并输出统计', () => {
  const summary = runMatches({ mode: 'ai-vs-ai', games: 1000, seedPrefix: 'ai-stability' });
  console.log('AI vs AI stability:', JSON.stringify(summary));
  assert.equal(summary.games, 1000);
  assert.equal(summary.conservation, 'ok');
  assert.ok(summary.maxActionsPerGame <= 400, 'possible deadlock: too many actions in one game');
  assert.ok(summary.totalActions > 0);
  const reasons = Object.values(summary.reasons).reduce((sum, value) => sum + value, 0);
  const nights = Object.values(summary.endingNight).reduce((sum, value) => sum + value, 0);
  assert.equal(reasons, 1000);
  assert.equal(nights, 1000);
  assert.ok(summary.sanityEndingRatio >= 0 && summary.sanityEndingRatio <= 1);
});
