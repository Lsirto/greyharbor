/**
 * tests/ui-v2/night-summary.test.mjs — end-of-night breakdown contract.
 * No DOM; assertions against the structured summary and escaped HTML.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildNightSummary,
  renderNightSummary,
} from '../../src/ui-v2/templates/night-summary.mjs';

const base = {
  night: 1,
  scores: [{ total: 12 }, { total: 9 }],
  sanityBefore: [5, 5],
  sanityAfter: [5, 4],
  winner: 0,
  tie: false,
  decidedBy: 'score',
  nightWins: [1, 0],
};

test('点数决胜：说明点数更高者赢，负方理智 -1', () => {
  const summary = buildNightSummary(base);
  assert.equal(summary.title, '第 1 夜结算');
  assert.match(summary.rows[0], /你 12 点，AI 9 点/);
  assert.match(summary.result, /你的总点数更高/);
  assert.match(summary.rows[2], /负方 −1/);
  assert.match(summary.winsText, /你 1 夜，AI 0 夜/);
});

test('理智决胜：点数相同，理智更高者赢', () => {
  const data = {
    ...base,
    scores: [{ total: 10 }, { total: 10 }],
    winner: 1,
    decidedBy: 'sanity',
  };
  const summary = buildNightSummary(data);
  assert.match(summary.result, /点数相同，AI理智更高/);
});

test('平局：双方理智各 -1', () => {
  const data = {
    ...base,
    scores: [{ total: 8 }, { total: 8 }],
    winner: null,
    tie: true,
    decidedBy: 'tie',
    sanityAfter: [4, 4],
  };
  const summary = buildNightSummary(data);
  assert.match(summary.result, /本夜平局/);
  assert.match(summary.rows[2], /双方 −1/);
});

test('渲染：含继续按钮与全部条目，且无脚本注入', () => {
  const html = renderNightSummary(base);
  assert.match(html, /data-gh2="night-continue"/);
  assert.match(html, /继续/);
  assert.match(html, /第 1 夜结算/);
  assert.ok(!/<script/i.test(html));
});
