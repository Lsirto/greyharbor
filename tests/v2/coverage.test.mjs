import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  EFFECT_REGISTRY,
  KEYWORD_ONLY_CARDS,
  effectsFor,
  isRegistered,
} from '../../src/engine/v2/index.js';

const cardTable = JSON.parse(
  readFileSync(new URL('../../src/data/card-table.normalized.json', import.meta.url), 'utf8'),
);
const cardIds = cardTable.map((entry) => entry.id);

/**
 * Explicit null whitelist.  A card's printed text is *already completely
 * covered* by an engine primitive, so a DSL effect array would only duplicate
 * the shared implementation.
 *
 * - frank-holt: 引擎原语已完整覆盖——「每有 1 张相邻己方卡 +1，上限 +3」完全
 *   由共享的 KEYWORD_SPECS.chain + scoring.chainCount 原语实现（§6.5、§11.1）。
 * - the-sleeper: 单位夜末清空后跨夜扣费永不触发，理智代价已前置为卡牌
 *   sanityCost（3），封印免疫由 KEYWORD_SPECS.sealImmune 原语实现，整卡无 DSL 效果。
 *
 * v1.3 note: lucia-vaughn and finn-calloway now register a Discover effect;
 * their chain/stealth engine rules remain active.
 */
const NULL_WHITELIST = Object.freeze({
  'frank-holt': '引擎原语已完整覆盖：相邻己方卡连锁 +1 上限 +3 由 KEYWORD_SPECS.chain + scoring.chainCount 共享原语实现（§6.5/§11.1）',
  'the-sleeper': '引擎原语已完整覆盖：封印免疫由 KEYWORD_SPECS.sealImmune 实现，理智代价前置为 sanityCost 3，跨夜扣费随每夜清空移除',
});

test('card table declares exactly 37 unique card ids', () => {
  assert.equal(cardIds.length, 37, 'the normalized card table has 37 cards');
  assert.equal(new Set(cardIds).size, 37, 'card ids are unique');
});

test('all 37 cards are covered by a non-empty effect array or the explicit null whitelist', () => {
  for (const id of cardIds) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(EFFECT_REGISTRY, id),
      `${id} must have an EFFECT_REGISTRY entry (do not ship a new card without implementation)`,
    );
    const registered = EFFECT_REGISTRY[id];
    if (registered === null) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(NULL_WHITELIST, id),
        `${id} is null only when its whole text is covered by an engine primitive`,
      );
      assert.equal(effectsFor(id), null, `${id}: effectsFor mirrors the null registration`);
      assert.equal(isRegistered(id), false, `${id}: a null card is not a registered effect card`);
    } else {
      assert.ok(
        Array.isArray(registered) && registered.length > 0,
        `${id} must register a non-empty effect array (or an explicitly justified null)`,
      );
      assert.equal(effectsFor(id), registered, `${id}: effectsFor mirrors EFFECT_REGISTRY`);
      assert.equal(isRegistered(id), true, `${id}: a non-empty array is registered`);
    }
  }
});

test('the null whitelist is exactly the documented engine-primitive cards', () => {
  assert.deepEqual(
    Object.keys(NULL_WHITELIST).sort(),
    ['frank-holt', 'the-sleeper'].sort(),
    'only these cards may be registered as null',
  );
  assert.deepEqual(
    Object.keys(NULL_WHITELIST).sort(),
    Object.keys(KEYWORD_ONLY_CARDS).sort(),
    'the test whitelist and the registry keyword-only note must agree',
  );
  for (const id of Object.keys(NULL_WHITELIST)) {
    assert.equal(EFFECT_REGISTRY[id], null, `${id} is actually registered null`);
    assert.ok(NULL_WHITELIST[id].length > 0, `${id} documents why engine primitives fully cover it`);
  }
});

test('EFFECT_REGISTRY has no orphan ids outside the card table', () => {
  for (const id of Object.keys(EFFECT_REGISTRY)) {
    assert.ok(cardIds.includes(id), `${id} is a card-table id, not a stale registry entry`);
  }
});
