/**
 * tests/ui-v2/menu-templates.test.mjs — pure menu template contract.
 * No DOM is required; every assertion is against escaped HTML strings.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FACTION_CARDS,
  FACTION_IDS,
  getFactionCard,
  renderFactionCard,
  renderFactionSelect,
  renderMainMenu,
  renderModeToggle,
  renderResultPanel,
  renderStartButton,
} from '../../src/ui-v2/menu/templates/index.mjs';

test('主菜单：标题 / 开始对局 / 各模式入口 / 折叠规则简介', () => {
  const html = renderMainMenu();
  assert.match(html, /灰港三夜/);
  assert.match(html, /data-menu-action="start"/);
  // The self-play demo entry was removed; the menu must no longer link to it.
  assert.ok(!html.includes('game.html'));
  assert.match(html, /<details class="gh2-rules">/);
  assert.match(html, /summary>\s*规则简介/);
  assert.match(html, /理智归零/);
});

test('阵营卡：两张卡含领袖卡字段、effect 技能文本、flavor 警句与风格定位', () => {
  assert.deepEqual([...FACTION_IDS], ['society', 'cult']);
  for (const id of FACTION_IDS) {
    const card = FACTION_CARDS[id];
    assert.ok(card.nameZh && card.name, `${id} 需要中英文名称`);
    assert.equal(card.leaderId, id === 'society' ? 'harold-ashby' : 'elias-thorne');
    assert.ok(card.leaderNameZh && card.leaderName, `${id} 需要领袖名称`);
    assert.ok(card.effect.length > 0, `${id} 需要 effect 技能文本`);
    assert.ok(card.flavor.length > 0, `${id} 需要 flavor 警句`);
    assert.ok(card.role.includes('风格定位'), `${id} 需要风格定位文案`);
    assert.equal(card.opponent, id === 'society' ? 'cult' : 'society');
    assert.equal(card.opponentNameZh, id === 'society' ? '教团' : '学会');
    assert.ok(card.deckSize >= 20);

    const html = renderFactionCard(id, id === 'cult');
    assert.match(html, new RegExp(`data-faction="${id}"`));
    assert.match(html, /aria-pressed="(true|false)"/);
    assert.ok(html.includes(card.effect), '技能文本必须出现在阵营卡上');
    assert.ok(html.includes(card.flavor), 'flavor 必须出现在阵营卡上');
    assert.ok(html.includes(card.role), '风格定位必须出现在阵营卡上');
  }
  assert.match(renderFactionCard('cult', true), /aria-pressed="true"/);
  assert.match(renderFactionCard('society', false), /aria-pressed="false"/);
  assert.equal(getFactionCard('society').leaderId, 'harold-ashby');
});

test('阵营选择：选中后对手为另一阵营，开始按钮文案随选择变化', () => {
  const html = renderFactionSelect({ selected: 'cult', seedMode: 'random' });
  assert.match(html, /你执掌教团 · 对手为学会/);
  assert.match(html, /data-faction="cult"[^>]*aria-pressed="true"/);
  assert.match(html, /data-faction="society"[^>]*aria-pressed="false"/);
  assert.match(html, /data-seed-mode="random"[^>]*aria-pressed="true"/);
  assert.match(html, /data-menu-action="start-match"/);
  assert.match(renderStartButton('society'), /你执掌学会 · 对手为教团/);
});

test('牌局模式：固定种子 / 随机牌局互斥切换，非法值回退 fixed', () => {
  const fixed = renderModeToggle();
  assert.match(fixed, /data-seed-mode="fixed"[^>]*aria-pressed="true"/);
  assert.match(fixed, /data-seed-mode="random"[^>]*aria-pressed="false"/);
  const random = renderModeToggle({ seedMode: 'random' });
  assert.match(random, /data-seed-mode="random"[^>]*aria-pressed="true"/);
  assert.match(random, /全新牌局/);
  assert.match(renderModeToggle({ seedMode: 'nonsense' }), /data-seed-mode="fixed"[^>]*aria-pressed="true"/);
});

test('终局面板：胜负原因、夜分历史、再来一局与返回主菜单', () => {
  const html = renderResultPanel({
    result: { winner: 0, reason: 'nightWins' },
    nightHistory: [
      { night: 1, scores: [{ total: 7 }, { total: 4 }], winner: 0 },
      { night: 2, scores: [{ total: 3 }, { total: 9 }], winner: 1 },
    ],
    seed: 'abc&123',
    matchConfig: { seedMode: 'random' },
  });
  assert.match(html, /你获胜/);
  assert.match(html, /胜负原因 · 两夜取胜/);
  assert.match(html, /第 1 夜/);
  assert.match(html, /7 : 4/);
  assert.match(html, /<code>abc&amp;123<\/code>/);
  assert.match(html, /换一颗新种子/);
  assert.match(html, /data-menu-action="rematch"/);
  assert.match(html, /data-menu-action="menu"/);
  assert.match(renderResultPanel({ matchConfig: { seedMode: 'fixed' } }), /沿用同一固定种子/);
});

test('终局面板：目标胜利按阵营显示真相大白/旧神降临', () => {
  const clue = renderResultPanel({ result: { winner: 0, reason: 'objective', objectiveType: 'clue' } });
  assert.match(clue, /你获胜/);
  assert.match(clue, /真相大白/);
  assert.ok(!clue.includes('旧神降临'));

  const doom = renderResultPanel({ result: { winner: 1, reason: 'objective', objectiveType: 'doom' } });
  assert.match(doom, /对手获胜/);
  assert.match(doom, /旧神降临/);
  assert.ok(!doom.includes('真相大白'));

  // Unknown objective type still falls back to a readable generic reason.
  assert.match(renderResultPanel({ result: { winner: 0, reason: 'objective' } }), /目标达成/);
});

test('HTML 转义：动态文本中的标签与引号不能进入 DOM 结构', () => {
  const injected = '<img src=x onerror="alert(1)">';
  const menu = renderMainMenu({ title: injected });
  assert.ok(!menu.includes('<img'));
  assert.ok(menu.includes('&lt;img'));
  assert.ok(menu.includes('&quot;alert(1)&quot;'));

  const card = renderFactionCard(injected, true);
  assert.ok(!card.includes('<img'));
  assert.ok(card.includes('&lt;img'));

  const result = renderResultPanel({
    result: { winner: 1, reason: injected },
    seed: injected,
  });
  assert.ok(!result.includes('<img'));
  assert.ok(result.includes('&lt;img'));
});
