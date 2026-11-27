/**
 * tests/ui-v2/app-shell.test.mjs — 屏幕路由 app-shell 的注入式测试。
 *
 * app-shell 强依赖全局 document 与 DOM 根，这里用最小假 DOM 驱动，
 * 不引 jsdom、不触发真实对局控制器，聚焦：屏幕路由、菜单点击、
 * 声音设置浮层（开关/滑块）、选项注入与销毁清理。
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createAppShell, SCREENS } from '../../src/ui-v2/menu/app-shell.mjs';
import { FACTION_CARDS } from '../../src/ui-v2/menu/templates/index.mjs';

// ── 最小假 DOM ─────────────────────────────────────────────────────────

function makeClassList() {
  const set = new Set();
  return {
    add(...names) { names.forEach((n) => set.add(n)); },
    remove(...names) { names.forEach((n) => set.delete(n)); },
    toggle(name, force) {
      const on = force === undefined ? !set.has(name) : !!force;
      if (on) set.add(name); else set.delete(name);
      return on;
    },
    contains(name) { return set.has(name); },
  };
}

let nodeSeq = 0;
function makeNode(tag = 'div') {
  const node = {
    _id: ++nodeSeq,
    tagName: String(tag).toUpperCase(),
    className: '',
    hidden: false,
    dataset: {},
    style: {},
    innerHTML: '',
    textContent: '',
    children: [],
    parentNode: null,
    classList: makeClassList(),
    _cache: new Map(),
    _listeners: {},
    getAttribute(name) { return name in this.dataset ? this.dataset[name] : null; },
    setAttribute(name, value) { this.dataset[name] = value; },
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    removeChild(child) {
      const i = this.children.indexOf(child);
      if (i >= 0) this.children.splice(i, 1);
      child.parentNode = null;
      return child;
    },
    remove() { this.parentNode?.removeChild(this); },
    // 同一选择器稳定返回同一假节点，保证 screenNodes/host 可被断言复用。
    querySelector(selector) {
      if (!this._cache.has(selector)) this._cache.set(selector, makeNode());
      return this._cache.get(selector);
    },
    querySelectorAll(selector) { return [this.querySelector(selector)]; },
    closest() { return null; },
    addEventListener(type, handler) {
      (this._listeners[type] ??= []).push(handler);
    },
    removeEventListener(type, handler) {
      const arr = this._listeners[type];
      if (!arr) return;
      const i = arr.indexOf(handler);
      if (i >= 0) arr.splice(i, 1);
    },
  };
  return node;
}

function makeDocument() {
  return {
    body: makeNode('body'),
    createElement: (tag) => makeNode(tag),
    addEventListener() {},
    removeEventListener() {},
  };
}

function makeFakeAudio() {
  const calls = [];
  const settings = {
    muted: false, enabled: true, sfxEnabled: true, volume: 0.7,
    bgmEnabled: true, bgmVolume: 0.6,
  };
  return {
    calls,
    getSettings: () => ({ ...settings }),
    setSfxEnabled(v) { calls.push(['sfx', v]); settings.sfxEnabled = v; return v; },
    setBgmEnabled(v) { calls.push(['bgm', v]); settings.bgmEnabled = v; return v; },
    setVolume(v) { calls.push(['volume', v]); settings.volume = v; return v; },
    setBgmVolume(v) { calls.push(['bgmVolume', v]); settings.bgmVolume = v; return v; },
  };
}

/** 装好全局 document 并构造 shell；测试结束自动清理全局变量。 */
function makeShell(t, options = {}) {
  const doc = makeDocument();
  const root = makeNode('root');
  globalThis.document = doc;
  t.after(() => { delete globalThis.document; });
  const shell = createAppShell({ root, ...options });
  return { doc, root, shell };
}

function emit(el, type, event) {
  for (const handler of el._listeners[type] ?? []) handler(event);
}

/** 构造一个只在指定 selector 上命中的点击 target。 */
function targetHitting(map) {
  const target = makeNode();
  target.closest = (selector) => map[selector] ?? null;
  return target;
}

function menuActionTarget(action) {
  const actionNode = makeNode();
  actionNode.dataset.menuAction = action;
  return targetHitting({ '[data-menu-action]': actionNode });
}

// ── 测试 ───────────────────────────────────────────────────────────────

test('缺少 DOM 根或 document 时抛 TypeError', () => {
  const root = makeNode();
  assert.throws(() => createAppShell({ root }), TypeError);
  globalThis.document = makeDocument();
  const badRoot = makeNode();
  delete badRoot.appendChild;
  assert.throws(() => createAppShell({ root: badRoot }), TypeError);
  delete globalThis.document;
});

test('构造后停留在主菜单，默认阵营 society、固定牌局', (t) => {
  const { shell, root } = makeShell(t);
  assert.equal(shell.getScreen(), 'menu');
  const selection = shell.getSelection();
  assert.equal(selection.humanFaction, 'society');
  assert.equal(selection.seedMode, 'fixed');
  assert.ok(root.children.includes(shell.el), '外壳应挂载到根节点');
  assert.equal(SCREENS.length, 14);
});

test('showScreen 合法切换并同步节点显隐，非法屏幕返回 false', (t) => {
  const { shell } = makeShell(t);
  assert.equal(shell.showScreen('faction-select'), true);
  assert.equal(shell.getScreen(), 'faction-select');
  const factionNode = shell.el.querySelector('[data-screen="faction-select"]');
  const menuNode = shell.el.querySelector('[data-screen="menu"]');
  assert.equal(factionNode.hidden, false);
  assert.ok(factionNode.classList.contains('is-active'));
  assert.equal(menuNode.hidden, true);
  assert.equal(menuNode.classList.contains('is-active'), false);

  assert.equal(shell.showScreen('not-a-real-screen'), false);
  assert.equal(shell.getScreen(), 'faction-select');
});

test('点击开始对局进入阵营选择，返回动作回到主菜单', (t) => {
  const { shell } = makeShell(t);
  emit(shell.el, 'click', { target: menuActionTarget('start') });
  assert.equal(shell.getScreen(), 'faction-select');
  emit(shell.el, 'click', { target: menuActionTarget('back') });
  assert.equal(shell.getScreen(), 'menu');
});

test('点击多人对战进入占位大厅', (t) => {
  const { shell } = makeShell(t);
  emit(shell.el, 'click', { target: menuActionTarget('start-multiplayer') });
  assert.equal(shell.getScreen(), 'multiplayer');
});

test('声音设置浮层可打开、用关闭按钮或点遮罩关闭', (t) => {
  const { shell } = makeShell(t, { audio: makeFakeAudio() });
  assert.equal(shell.el.children.length, 0);
  emit(shell.el, 'click', { target: menuActionTarget('audio-settings') });
  assert.equal(shell.el.children.length, 1);

  // 关闭按钮
  const closeNode = makeNode();
  emit(shell.el, 'click', { target: targetHitting({ '[data-audio-close]': closeNode }) });
  assert.equal(shell.el.children.length, 0);

  // 重新打开，点遮罩空白处（命中 overlay 但不命中 modal）关闭
  emit(shell.el, 'click', { target: menuActionTarget('audio-settings') });
  assert.equal(shell.el.children.length, 1);
  const overlayNode = makeNode();
  const target = makeNode();
  target.closest = (selector) => (selector === '[data-audio-layer]' ? overlayNode : null);
  emit(shell.el, 'click', { target });
  assert.equal(shell.el.children.length, 0);
});

test('浮层开关分别调用音效与背景音乐的开关方法', (t) => {
  const audio = makeFakeAudio();
  const { shell } = makeShell(t, { audio });
  emit(shell.el, 'click', { target: menuActionTarget('audio-settings') });

  const sfxToggle = makeNode();
  sfxToggle.dataset.audioToggle = 'sfx';
  sfxToggle.getAttribute = (name) => (name === 'aria-pressed' ? 'false' : null);
  emit(shell.el, 'click', { target: targetHitting({ '[data-audio-toggle]': sfxToggle }) });
  assert.deepEqual(audio.calls.at(-1), ['sfx', true]);

  const bgmToggle = makeNode();
  bgmToggle.dataset.audioToggle = 'bgm';
  bgmToggle.getAttribute = (name) => (name === 'aria-pressed' ? 'true' : null);
  emit(shell.el, 'click', { target: targetHitting({ '[data-audio-toggle]': bgmToggle }) });
  assert.deepEqual(audio.calls.at(-1), ['bgm', false]);
});

test('拖动滑块把 0–100 换算成 0–1 写入对应音量', (t) => {
  const audio = makeFakeAudio();
  const { shell } = makeShell(t, { audio });
  emit(shell.el, 'click', { target: menuActionTarget('audio-settings') });

  const sfxSlider = makeNode();
  sfxSlider.dataset.audioVolume = 'sfx';
  sfxSlider.value = '40';
  const sfxSource = makeNode();
  sfxSource.closest = (sel) => (sel === '[data-audio-volume]' ? sfxSlider : null);
  emit(shell.el, 'input', { target: sfxSource });
  assert.deepEqual(audio.calls.at(-1), ['volume', 0.4]);

  const bgmSlider = makeNode();
  bgmSlider.dataset.audioVolume = 'bgm';
  bgmSlider.value = '80';
  const bgmSource = makeNode();
  bgmSource.closest = (sel) => (sel === '[data-audio-volume]' ? bgmSlider : null);
  emit(shell.el, 'input', { target: bgmSource });
  assert.deepEqual(audio.calls.at(-1), ['bgmVolume', 0.8]);
});

test('注入的阵营与随机牌局选项生效', (t) => {
  const cultId = Object.keys(FACTION_CARDS).find((id) => id !== 'society');
  const { shell } = makeShell(t, { humanFaction: cultId, seedMode: 'random' });
  const selection = shell.getSelection();
  assert.equal(selection.humanFaction, cultId);
  assert.equal(selection.seedMode, 'random');
});

test('点击生成战报图：无留存对局时静默返回、不抛错', (t) => {
  const { shell } = makeShell(t);
  assert.doesNotThrow(() => emit(shell.el, 'click', { target: menuActionTarget('share-report') }));
});

test('destroy 移除监听与外壳且不抛错', (t) => {
  const { shell, root } = makeShell(t, { audio: makeFakeAudio() });
  emit(shell.el, 'click', { target: menuActionTarget('audio-settings') });
  assert.equal(shell.el.children.length, 1);
  assert.doesNotThrow(() => shell.destroy());
  assert.equal(root.children.includes(shell.el), false);
  assert.equal(shell.el._listeners.click.length, 0);
  assert.equal(shell.el._listeners.input.length, 0);
});
