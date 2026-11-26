/**
 * tests/ui-v2/character-select.test.mjs — character-select template contract.
 * No DOM is required; every assertion is against escaped HTML strings.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { CARDS } from '../../src/engine/v2/cards.js';
import {
  CHARACTER_ROSTER,
  characterIdsFor,
  getCharacterCard,
  renderCharacterCard,
  renderCharacterSelect,
} from '../../src/ui-v2/menu/templates/index.mjs';

test('角色名册：每阵营 3 名，共 6 个，且均为同阵营领袖卡', () => {
  assert.deepEqual(characterIdsFor('society'), [
    'harold-ashby', 'enid-halloway', 'augustus-wayne',
  ]);
  assert.deepEqual(characterIdsFor('cult'), [
    'elias-thorne', 'vera-crowe', 'gregor-pestilence',
  ]);
  const all = Object.values(CHARACTER_ROSTER).flat();
  assert.equal(all.length, 6);
  for (const meta of all) {
    const card = CARDS[meta.id];
    assert.ok(card, `${meta.id} must exist in the card table`);
    assert.equal(card.type, 'leader');
    // The roster grouping always matches the card's own faction.
    const group = CHARACTER_ROSTER[card.faction].some((entry) => entry.id === meta.id);
    assert.ok(group, `${meta.id} is grouped under the wrong faction`);
    assert.ok(meta.icon && meta.title && meta.archetype);
  }
  assert.deepEqual(characterIdsFor('nonsense'), []);
});

test('角色卡：含 data-character、技能文本，选中态与 aria-pressed 联动', () => {
  const card = getCharacterCard('enid-halloway');
  assert.ok(card);
  assert.equal(card.faction, 'society');
  assert.equal(getCharacterCard('no-such-id'), null);

  const plain = renderCharacterCard('enid-halloway', false);
  assert.match(plain, /data-character="enid-halloway"/);
  assert.match(plain, /aria-pressed="false"/);
  assert.ok(!plain.includes('is-selected'));
  assert.ok(plain.includes(card.effect), 'active/passive text appears on the card');
  // The character portrait is wired through the same assets/art convention.
  assert.match(plain, /class="gh2-character-card__portrait"/);
  assert.match(plain, /src="\.\/assets\/art\/enid-halloway\.jpg"/);
  assert.match(plain, /gh2-character-card__media/);

  const selected = renderCharacterCard('enid-halloway', true);
  assert.match(selected, /aria-pressed="true"/);
  assert.match(selected, /is-selected/);
  // Cult card gets the cult modifier.
  assert.match(renderCharacterCard('vera-crowe'), /gh2-character-card--cult/);
});

test('角色选择屏：渲染同阵营全部角色卡，含返回与开始按钮，默认选中第一名', () => {
  const html = renderCharacterSelect({ faction: 'cult' });
  for (const id of characterIdsFor('cult')) {
    assert.match(html, new RegExp(`data-character="${id}"`));
  }
  assert.match(html, /data-menu-action="character-back"/);
  assert.match(html, /data-menu-action="start-character-match"/);
  // Default selection is the first roster entry (elias-thorne).
  assert.match(html, /data-character="elias-thorne"[^>]*aria-pressed="true"/);
  // No society character leaks onto a cult screen.
  assert.ok(!html.includes('data-character="harold-ashby"'));

  const picked = renderCharacterSelect({ faction: 'society', selected: 'augustus-wayne' });
  assert.match(picked, /data-character="augustus-wayne"[^>]*aria-pressed="true"/);
  // An invalid selection falls back to the first roster entry.
  const fallback = renderCharacterSelect({ faction: 'society', selected: 'elias-thorne' });
  assert.match(fallback, /data-character="harold-ashby"[^>]*aria-pressed="true"/);
});

test('角色卡结构：唯一 img 为立绘，且无脚本注入', () => {
  const html = renderCharacterCard('enid-halloway');
  const imgs = html.match(/<img/gi) ?? [];
  assert.equal(imgs.length, 1);
  assert.ok(!/<script/i.test(html));
});
