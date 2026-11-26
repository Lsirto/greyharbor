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
  renderSkinSwitcher,
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

test('皮肤面板：默认形象 + 2 款皮肤共 3 项，含左右箭头与计数', () => {
  const html = renderSkinSwitcher('enid-halloway', { ownedIds: [], equippedId: null });
  assert.equal((html.match(/data-skin-preview/g) ?? []).length, 3);
  assert.match(html, /data-skin-nav="prev"/);
  assert.match(html, /data-skin-nav="next"/);
  assert.match(html, /1 \/ 3/);
  assert.match(html, /data-role="skin-switcher"/);
});

test('皮肤面板：未指定预览时定位到已装备皮肤并显示使用中', () => {
  const state = { ownedIds: ['enid-halloway-mist'], equippedId: 'enid-halloway-mist' };
  const html = renderSkinSwitcher('enid-halloway', state);
  assert.match(html, /使用中/);
  assert.match(html, /data-skin-preview="enid-halloway-mist"[^>]*aria-pressed="true"/);
});

test('皮肤面板：显式选基础形象，未装备时显示使用按钮且空 skin-id', () => {
  const html = renderSkinSwitcher(
    'enid-halloway',
    { ownedIds: ['enid-halloway-mist'], equippedId: 'enid-halloway-mist' },
    'default',
  );
  assert.match(html, /src="\.\/assets\/art\/enid-halloway\.jpg"/);
  const btn = html.match(/data-skin-action="equip"[^>]*data-skin-id=""/);
  assert.ok(btn, 'base look equip button carries an empty skin id');
});

test('皮肤面板：已拥有的调色皮肤显示使用按钮，复用原立绘并内联滤镜', () => {
  const html = renderSkinSwitcher(
    'enid-halloway',
    { ownedIds: ['enid-halloway-mist'], equippedId: null },
    'enid-halloway-mist',
  );
  assert.match(html, /data-skin-action="equip"[^>]*data-skin-id="enid-halloway-mist"/);
  assert.match(html, /src="\.\/assets\/art\/enid-halloway\.jpg"/);
  assert.match(html, /filter:/);
  assert.match(html, /gh2-skin-switcher__badge--common/);
});

test('皮肤面板：未获得的新立绘显示锁与去获取，无使用按钮且指向 skins 图', () => {
  const html = renderSkinSwitcher(
    'enid-halloway',
    { ownedIds: ['enid-halloway-mist'], equippedId: 'enid-halloway-mist' },
    'enid-halloway-oracle',
  );
  assert.match(html, /data-skin-action="go-shop"/);
  assert.match(html, /src="\.\/assets\/skins\/enid-halloway-oracle\.jpg"/);
  assert.match(html, /gh2-skin-switcher__lock/);
  assert.ok(!/data-skin-action="equip"/.test(html));
  assert.match(html, /gh2-skin-switcher__badge--rare/);
});

test('皮肤面板：数据驱动，cult 角色与史诗皮肤同样正确渲染', () => {
  const html = renderSkinSwitcher(
    'gregor-pestilence',
    { ownedIds: ['gregor-pestilence-reaper'], equippedId: 'gregor-pestilence-reaper' },
    'gregor-pestilence-reaper',
  );
  assert.match(html, /使用中/);
  assert.match(html, /src="\.\/assets\/skins\/gregor-pestilence-reaper\.jpg"/);
  assert.match(html, /data-rarity="rare"/);
});

test('角色选择屏：接入皮肤状态，网格下方渲染面板且无脚本注入', () => {
  const skinState = {
    'enid-halloway': { ownedIds: ['enid-halloway-mist'], equippedId: 'enid-halloway-mist' },
  };
  const html = renderCharacterSelect({
    faction: 'society',
    selected: 'enid-halloway',
    skinState,
  });
  assert.match(html, /data-role="skin-switcher-host"/);
  assert.match(html, /使用中/);
  assert.ok(!/<script/i.test(html));
});
