import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRun, availableNextNodes } from '../../src/campaign/run-state.mjs';
import {
  renderMapScreen,
  renderEventScreen,
  renderCardReward,
  renderRelicReward,
  renderRestScreen,
  renderRestRemoveList,
  renderRunResult,
} from '../../src/ui-v2/campaign/templates/index.mjs';
import { getEvent } from '../../src/campaign/data/events.mjs';
import { getRelic } from '../../src/campaign/data/relics.mjs';

test('map renders stats and marks current / reachable nodes', () => {
  const run = createRun({ seed: 'tpl-map' });
  const reachable = availableNextNodes(run);
  const html = renderMapScreen(run, reachable);

  assert.ok(html.includes(`<b>${run.supplies}</b>`));
  assert.ok(html.includes(`<b>${run.deck.length}</b>`));
  assert.ok(html.includes(`<b>${run.relics.length}</b>`));
  assert.ok(html.includes('is-current'));
  for (const id of reachable) {
    assert.ok(html.includes(`data-go="${id}"`));
  }
  // Locked (non-reachable, non-current) nodes must not carry data-go.
  const locked = Object.keys(run.map.nodeById)
    .filter((id) => !reachable.includes(id) && id !== run.currentNodeId);
  assert.ok(locked.length > 0);
  for (const id of locked) assert.ok(!html.includes(`data-go="${id}"`));
});

test('event renders choices and reflects availability', () => {
  const run = createRun({ seed: 'tpl-event' });
  const event = getEvent('the-drowned-shrine'); // first choice needs supplies:3
  run.pending = { kind: 'event', eventId: event.id };
  const html = renderEventScreen(run, event, [false, true, true]);

  assert.ok(html.includes(event.title));
  assert.ok(html.includes(event.flavor));
  assert.ok(html.includes('is-disabled'));
  assert.ok(!html.includes('data-event-choice="0"'));
  assert.ok(html.includes('data-event-choice="1"'));
  assert.ok(html.includes('data-event-choice="2"'));
});

test('card reward lists every option with art and a skip', () => {
  const run = createRun({ seed: 'tpl-card' });
  run.pending = { kind: 'cardReward', cardOptions: ['nora-wells', 'finn-calloway', 'stormy-night'] };
  const html = renderCardReward(run);

  for (let i = 0; i < 3; i += 1) assert.ok(html.includes(`data-card-choice="${i}"`));
  assert.ok(html.includes('assets/art/nora-wells.jpg'));
  assert.ok(html.includes('data-card-skip'));
});

test('relic reward lists relic names and a skip', () => {
  const run = createRun({ seed: 'tpl-relic' });
  run.pending = { kind: 'relicReward', relicOptions: ['brass-key', 'salt-ward'] };
  const html = renderRelicReward(run);

  assert.ok(html.includes(getRelic('brass-key').nameZh));
  assert.ok(html.includes(getRelic('salt-ward').nameZh));
  assert.ok(html.includes('data-relic-choice="0"'));
  assert.ok(html.includes('data-relic-choice="1"'));
  assert.ok(html.includes('data-relic-skip'));
});

test('rest screen offers supplies and trim; trim lists deck indices', () => {
  const run = createRun({ seed: 'tpl-rest' });
  run.pending = { kind: 'rest' };
  const screen = renderRestScreen(run);
  assert.ok(screen.includes('data-rest-supplies'));
  assert.ok(screen.includes('data-rest-remove'));

  const list = renderRestRemoveList(run);
  for (let i = 0; i < run.deck.length; i += 1) assert.ok(list.includes(`data-remove-index="${i}"`));
  assert.ok(list.includes('data-rest-back'));
});

test('run result renders distinct won/lost copy and an exit button', () => {
  const won = createRun({ seed: 'tpl-won' });
  won.status = 'won';
  const wonHtml = renderRunResult(won);
  assert.ok(wonHtml.includes('调查成功'));
  assert.ok(wonHtml.includes('data-run-exit'));

  const lost = createRun({ seed: 'tpl-lost' });
  lost.status = 'lost';
  const lostHtml = renderRunResult(lost);
  assert.ok(lostHtml.includes('调查终止'));
  assert.ok(lostHtml.includes('data-run-exit'));
});

test('templates escape hostile text instead of injecting markup', () => {
  const hostile = '<img src=x onerror=alert(1)>';
  const run = {
    ...createRun({ seed: 'tpl-escape' }),
    supplies: 0,
    deck: [hostile],
    relics: [],
    pending: { kind: 'rest' },
  };
  const list = renderRestRemoveList(run);
  assert.ok(!list.includes(hostile));
  assert.ok(list.includes('&lt;img src=x onerror=alert(1)&gt;'));
});
