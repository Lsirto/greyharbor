/** 动作合法性：随机 200 局中 AI 每次返回的动作都属于 view.actions 且可直接 apply。 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { runMatches } from '../../scripts/ai-match.mjs';

test('AI 在 200 局中的每一步动作都来自 view.actions 且 apply ok', () => {
  let decisions = 0;
  let aiDecisions = 0;
  const summary = runMatches({
    mode: 'ai-vs-random',
    games: 200,
    seedPrefix: 'ai-legality',
    validate: ({ player, view, action, engine }) => {
      decisions += 1;
      assert.ok(view.actions.includes(action), `step ${decisions}: action object not from view.actions`);
      assert.ok(['mulligan', 'playCard', 'reveal', 'useLeader', 'pass'].includes(action.type));
      assert.equal(action.player, player, 'action player must match the acting view');
      void engine;
      if (player === 0 || player === 1) aiDecisions += 1;
    },
  });
  assert.equal(summary.games, 200);
  assert.equal(summary.conservation, 'ok');
  assert.ok(decisions > 1000, `expected many decisions, got ${decisions}`);
  assert.ok(aiDecisions === decisions);
});
