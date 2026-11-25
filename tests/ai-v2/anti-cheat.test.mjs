/**
 * 防作弊测试（核心）：
 *  1. 源码审计：src/ai/v2 下所有 import 白名单（自身目录 + src/engine/rng.js）；
 *  2. 隐藏信息无关性：可见信息相同、隐藏信息不同的局面，buildView 后 AI 选择一致。
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildView, createGame } from '../../src/engine/v2/index.js';
import { chooseAction } from '../../src/ai/v2/ai.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const AI_DIR = resolve(fileURLToPath(new URL('../../src/ai/v2/', import.meta.url)));
const RNG_FILE = resolve(join(ROOT, 'src', 'engine', 'rng.js'));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.mjs') || name.endsWith('.js')) out.push(full);
  }
  return out;
}

function importsOf(code) {
  const specifiers = [];
  const patterns = [
    /(?:^|\n)\s*import\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) specifiers.push(match[1]);
  }
  return specifiers;
}

test('源码审计：src/ai/v2 只允许 import 自身目录与 src/engine/rng.js', () => {
  const files = walk(AI_DIR);
  assert.ok(files.length >= 3, `expected AI module files, found ${files.length}`);
  let checked = 0;
  for (const file of files) {
    const code = readFileSync(file, 'utf8');
    assert.ok(!/\bMath\.random\b/.test(code), `${file} uses Math.random`);
    for (const specifier of importsOf(code)) {
      checked += 1;
      const target = resolve(dirname(file), specifier);
      const inAiDir = target === AI_DIR || target.startsWith(AI_DIR + sep);
      assert.ok(
        inAiDir || target === RNG_FILE,
        `${file} imports forbidden module: ${specifier} -> ${target}`,
      );
      assert.ok(
        !/engine\.js|view\.js|scoring\.js|index\.js|effects|deck\.js/i.test(specifier)
          || target === RNG_FILE,
        `${file} imports engine/state module: ${specifier}`,
      );
    }
  }
  assert.ok(checked >= 2, 'expected at least relative imports in the AI module');
});

function readyEngine(seed) {
  const engine = createGame({ seed });
  for (const p of [0, 1]) {
    const actions = engine.getActions(p);
    assert.ok(actions.length > 0);
    assert.equal(engine.apply(actions[0]).ok, true);
  }
  assert.equal(engine.phase, 'play');
  return engine;
}

/** 两局只在对手盖牌身份上不同；其余公开/私有结构完全一致。 */
function faceDownPair(engine, opp, swapped) {
  const state = engine.clone().state;
  const player = state.players[opp];
  const [a, b] = player.hand.splice(0, 2);
  player.board.dream[0] = {
    ...a,
    uid: 'hidden-a',
    cardId: swapped ? 'lucia-vaughn' : 'nora-wells',
    face: swapped ? 'madness' : 'reason',
    faceDown: true,
    location: 'dream',
    slot: 0,
    zone: 'board',
  };
  player.board.dream[1] = {
    ...b,
    uid: 'hidden-b',
    cardId: swapped ? 'nora-wells' : 'lucia-vaughn',
    face: swapped ? 'reason' : 'madness',
    faceDown: true,
    location: 'dream',
    slot: 1,
    zone: 'board',
  };
  const clone = engine.clone();
  clone.state = state;
  return clone;
}

test('隐藏信息无关性：对手牌堆顺序、手牌顺序/内容、盖牌身份均不影响选择', () => {
  const base = readyEngine('anti-cheat-hidden-base');
  const pov = base.current ?? 0;
  const opp = 1 - pov;
  const options = { seed: 'hidden-invariant' };

  const scenarios = [
    {
      name: 'opponent deck order',
      left: () => base.clone(),
      right: () => {
        const engine = base.clone();
        engine.state.players[opp].deck.reverse();
        return engine;
      },
    },
    {
      name: 'opponent hand order',
      left: () => base.clone(),
      right: () => {
        const engine = base.clone();
        engine.state.players[opp].hand.reverse();
        return engine;
      },
    },
    {
      name: 'opponent hidden hand/deck swap',
      left: () => base.clone(),
      right: () => {
        const engine = base.clone();
        const player = engine.state.players[opp];
        const handCard = player.hand[0];
        const deckIndex = player.deck.findIndex((inst) => inst.cardId !== handCard.cardId);
        assert.ok(deckIndex >= 0, 'need a different card in opponent deck for this scenario');
        const deckCard = player.deck.splice(deckIndex, 1)[0];
        player.hand.splice(player.hand.indexOf(handCard), 1, deckCard);
        player.deck.push(handCard);
        return engine;
      },
    },
    {
      name: 'opponent face-down identities swapped',
      left: () => faceDownPair(base, opp, false),
      right: () => faceDownPair(base, opp, true),
    },
  ];

  for (const scenario of scenarios) {
    const left = buildView(scenario.left(), pov);
    const right = buildView(scenario.right(), pov);
    assert.ok(left.actions.length > 0, 'need legal actions for the invariant check');
    // 先证明隐藏信息被 buildView 脱敏：两个视角必须完全一致。
    assert.deepStrictEqual(left, right, `${scenario.name} leaked hidden info`);

    const a = chooseAction(left, options);
    const b = chooseAction(right, options);
    assert.ok(left.actions.includes(a));
    assert.ok(right.actions.includes(b));
    assert.equal(
      left.actions.indexOf(a),
      right.actions.indexOf(b),
      `${scenario.name} changed the AI decision`,
    );
    assert.deepStrictEqual(a, b);
  }
});
