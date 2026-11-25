/**
 * src/ui-v2/menu/app-shell.mjs — player-facing screen router for app.html.
 *
 * Screens: menu → faction-select → in-game.  The menu and the board never
 * coexist in the DOM tree at the same time: starting a match mounts a fresh
 * game controller into the in-game containers; returning to the menu destroys
 * that controller (timers + listeners) before switching screens.
 *
 * The controller is still the only writer of game state; this shell only
 * routes screens, forwards menu choices into `matchConfig`, and wraps the
 * controller's gameOver callback with a result panel.
 */

import { createGameController } from '../game-controller.mjs';
import {
  FACTION_CARDS,
  renderFactionSelect,
  renderMainMenu,
  renderResultPanel,
  renderStartButton,
} from './templates/index.mjs';

export const SCREENS = Object.freeze(['menu', 'faction-select', 'in-game']);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function createAppShell(options = {}) {
  const opts = asObject(options);
  const root = opts.root ?? (typeof document !== 'undefined' ? document.body : null);
  if (typeof document === 'undefined' || !root || typeof root.appendChild !== 'function') {
    throw new TypeError('createAppShell needs a DOM root');
  }

  let selectedFaction = FACTION_CARDS[opts.humanFaction] ? opts.humanFaction : 'society';
  let seedMode = opts.seedMode === 'random' ? 'random' : 'fixed';
  let currentScreen = 'menu';
  let controller = null;

  const el = document.createElement('div');
  el.className = 'gh2-app-shell';
  el.innerHTML = `
    <section class="gh2-screen gh2-screen--menu is-active" data-screen="menu">
      ${renderMainMenu()}
    </section>
    <section class="gh2-screen gh2-screen--faction" data-screen="faction-select" hidden>
      <div data-role="faction"></div>
    </section>
    <section class="gh2-screen gh2-screen--game" data-screen="in-game" hidden>
      <header class="gh2-game-top">
        <button type="button" class="gh2-back-btn" data-app="menu">← 返回主菜单</button>
        <span class="gh2-game-top__tag">灰港三夜 · 人机对战</span>
      </header>
      <div class="gh2-play-controls-host" data-app="controls"></div>
      <main class="gh2-board" data-app="board" aria-label="灰港三夜人机对战棋盘"></main>
      <div class="gh2-result-layer" data-app="result" hidden></div>
    </section>`;
  root.appendChild(el);

  const screenNodes = Object.fromEntries(SCREENS.map((name) => [
    name,
    el.querySelector(`[data-screen="${name}"]`),
  ]));
  const factionHost = el.querySelector('[data-role="faction"]');
  const boardRoot = el.querySelector('[data-app="board"]');
  const controlsRoot = el.querySelector('[data-app="controls"]');
  const resultLayer = el.querySelector('[data-app="result"]');
  const gameScreen = screenNodes['in-game'];

  function renderFactionScreen() {
    factionHost.innerHTML = renderFactionSelect({ selected: selectedFaction, seedMode });
  }

  function showScreen(name) {
    if (!SCREENS.includes(name)) return false;
    currentScreen = name;
    for (const screen of SCREENS) {
      const node = screenNodes[screen];
      if (!node) continue;
      const active = screen === name;
      node.hidden = !active;
      node.classList.toggle('is-active', active);
    }
    if (name === 'faction-select') renderFactionScreen();
    if (name !== 'in-game') hideResult();
    return true;
  }

  function hideResult() {
    if (!resultLayer) return;
    resultLayer.hidden = true;
    resultLayer.innerHTML = '';
    if (gameScreen) gameScreen.classList.remove('is-over');
  }

  function showResult(info) {
    if (!resultLayer) return;
    resultLayer.innerHTML = renderResultPanel(info);
    resultLayer.hidden = false;
    if (gameScreen) gameScreen.classList.add('is-over');
  }

  function destroyController() {
    hideResult();
    if (!controller) return;
    const old = controller;
    controller = null;
    try { old.destroy(); } catch (_) { /* a half-built controller must not block routing */ }
    if (typeof window !== 'undefined' && window.__greyharborGame === old) {
      window.__greyharborGame = null;
    }
    if (boardRoot) boardRoot.innerHTML = '';
    if (controlsRoot) controlsRoot.innerHTML = '';
  }

  function startMatch() {
    destroyController();
    controller = createGameController({
      boardRoot,
      controlsRoot,
      aiDelay: Number.isFinite(opts.aiDelay) ? opts.aiDelay : undefined,
      baseSeed: opts.baseSeed,
      seedGenerator: opts.seedGenerator,
      matchConfig: { humanFaction: selectedFaction, seedMode },
      onGameOver: (info) => showResult(info),
    });
    if (typeof window !== 'undefined') window.__greyharborGame = controller;
    hideResult();
    showScreen('in-game');
    return controller;
  }

  function handleClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    const modeButton = target.closest('[data-seed-mode]');
    if (modeButton) {
      seedMode = modeButton.dataset.seedMode === 'random' ? 'random' : 'fixed';
      for (const button of factionHost.querySelectorAll('[data-seed-mode]')) {
        const active = button.dataset.seedMode === seedMode;
        button.classList.toggle('is-selected', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
      return;
    }
    const factionButton = target.closest('[data-faction]');
    if (factionButton) {
      const faction = factionButton.dataset.faction;
      if (!FACTION_CARDS[faction]) return;
      selectedFaction = faction;
      for (const card of factionHost.querySelectorAll('[data-faction]')) {
        const active = card.dataset.faction === faction;
        card.classList.toggle('is-selected', active);
        card.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
      const startHost = factionHost.querySelector('[data-role="start"]');
      if (startHost) startHost.innerHTML = renderStartButton(selectedFaction);
      return;
    }
    const appButton = target.closest('[data-app="menu"]');
    if (appButton) {
      destroyController();
      showScreen('menu');
      return;
    }
    const action = target.closest('[data-menu-action]')?.dataset.menuAction;
    if (action === 'start') showScreen('faction-select');
    else if (action === 'back') showScreen('menu');
    else if (action === 'start-match') startMatch();
    else if (action === 'rematch') {
      hideResult();
      if (controller) controller.restart();
    } else if (action === 'menu') {
      destroyController();
      showScreen('menu');
    }
  }

  el.addEventListener('click', handleClick);

  return {
    el,
    showScreen,
    startMatch,
    getController: () => controller,
    getScreen: () => currentScreen,
    getSelection: () => ({ humanFaction: selectedFaction, seedMode }),
    destroy() {
      destroyController();
      el.removeEventListener('click', handleClick);
      el.remove();
    },
  };
}

export default createAppShell;
