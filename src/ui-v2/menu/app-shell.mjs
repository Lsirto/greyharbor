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
import { createFxController } from '../fx/fx-controller.mjs';
import { createCampaignController } from '../campaign/campaign-controller.mjs';
import { createTutorialController } from '../tutorial/tutorial-controller.mjs';
import {
  FACTION_CARDS,
  renderFactionSelect,
  renderMainMenu,
  renderResultPanel,
  renderStartButton,
} from './templates/index.mjs';

export const SCREENS = Object.freeze(['menu', 'faction-select', 'in-game', 'campaign', 'tutorial']);

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
  let entryMode = 'skirmish';
  let currentScreen = 'menu';
  let controller = null;
  let campaign = null;
  let tutorial = null;
  let fx = null;

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
    </section>
    <section class="gh2-screen gh2-screen--campaign" data-screen="campaign" hidden>
      <header class="gh2-game-top">
        <button type="button" class="gh2-back-btn" data-app="campaign-menu">← 返回主菜单</button>
        <span class="gh2-game-top__tag">灰港三夜 · 战役模式</span>
      </header>
      <div class="gh2-campaign-host" data-app="campaign"></div>
    </section>
    <section class="gh2-screen gh2-screen--tutorial" data-screen="tutorial" hidden>
      <header class="gh2-game-top">
        <button type="button" class="gh2-back-btn" data-app="tutorial-menu">← 返回主菜单</button>
        <span class="gh2-game-top__tag">灰港三夜 · 新手教程</span>
      </header>
      <div class="gh2-play-controls-host" data-app="tutorial-controls"></div>
      <main class="gh2-board" data-app="tutorial-board" aria-label="新手教程棋盘"></main>
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
  const campaignHost = el.querySelector('[data-app="campaign"]');
  const tutorialBoard = el.querySelector('[data-app="tutorial-board"]');
  const tutorialControls = el.querySelector('[data-app="tutorial-controls"]');
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
    if (fx) {
      try { fx.destroy(); } catch (_) { /* a half-built FX layer must not block routing */ }
      fx = null;
    }
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
    fx = createFxController({ boardRoot, controlsRoot });
    controller = createGameController({
      boardRoot,
      controlsRoot,
      aiDelay: Number.isFinite(opts.aiDelay) ? opts.aiDelay : undefined,
      baseSeed: opts.baseSeed,
      seedGenerator: opts.seedGenerator,
      matchConfig: { humanFaction: selectedFaction, seedMode },
      hooks: fx.hooks,
      onGameOver: (info) => showResult(info),
    });
    if (typeof window !== 'undefined') window.__greyharborGame = controller;
    hideResult();
    showScreen('in-game');
    return controller;
  }

  function destroyCampaign() {
    if (!campaign) return;
    const old = campaign;
    campaign = null;
    try { old.destroy(); } catch (_) { /* a half-built campaign must not block routing */ }
    if (campaignHost) campaignHost.innerHTML = '';
  }

  function startCampaign() {
    destroyController();
    destroyCampaign();
    campaign = createCampaignController({
      host: campaignHost,
      faction: selectedFaction,
      seed: opts.campaignSeed,
      aiDelay: Number.isFinite(opts.aiDelay) ? opts.aiDelay : undefined,
      hooks: fx ? fx.hooks : undefined,
      onExit: () => {
        destroyCampaign();
        showScreen('menu');
      },
    });
    showScreen('campaign');
    return campaign;
  }

  function destroyTutorial() {
    if (!tutorial) return;
    const old = tutorial;
    tutorial = null;
    try { old.destroy(); } catch (_) { /* a half-built tutorial must not block routing */ }
    if (tutorialBoard) tutorialBoard.innerHTML = '';
    if (tutorialControls) tutorialControls.innerHTML = '';
  }

  function startTutorial() {
    destroyController();
    destroyCampaign();
    destroyTutorial();
    tutorial = createTutorialController({
      boardRoot: tutorialBoard,
      controlsRoot: tutorialControls,
      parent: el,
      aiDelay: Number.isFinite(opts.aiDelay) ? opts.aiDelay : undefined,
      // Finish → "开始对局": drop into a normal match.
      onPlay: () => {
        destroyTutorial();
        startMatch();
      },
      // Skip / 返回菜单.
      onExit: () => {
        destroyTutorial();
        showScreen('menu');
      },
    });
    showScreen('tutorial');
    return tutorial;
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
    const campaignBack = target.closest('[data-app="campaign-menu"]');
    if (campaignBack) {
      destroyCampaign();
      showScreen('menu');
      return;
    }
    const tutorialBack = target.closest('[data-app="tutorial-menu"]');
    if (tutorialBack) {
      destroyTutorial();
      showScreen('menu');
      return;
    }
    const appButton = target.closest('[data-app="menu"]');
    if (appButton) {
      destroyController();
      showScreen('menu');
      return;
    }
    const action = target.closest('[data-menu-action]')?.dataset.menuAction;
    if (action === 'start') {
      entryMode = 'skirmish';
      showScreen('faction-select');
    } else if (action === 'start-campaign') {
      entryMode = 'campaign';
      showScreen('faction-select');
    } else if (action === 'start-tutorial') {
      startTutorial();
    } else if (action === 'back') showScreen('menu');
    else if (action === 'start-match') {
      if (entryMode === 'campaign') startCampaign();
      else startMatch();
    } else if (action === 'rematch') {
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
    startCampaign,
    startTutorial,
    getController: () => controller,
    getCampaign: () => campaign,
    getTutorial: () => tutorial,
    getScreen: () => currentScreen,
    getSelection: () => ({ humanFaction: selectedFaction, seedMode }),
    destroy() {
      destroyController();
      destroyCampaign();
      destroyTutorial();
      el.removeEventListener('click', handleClick);
      el.remove();
    },
  };
}

export default createAppShell;
