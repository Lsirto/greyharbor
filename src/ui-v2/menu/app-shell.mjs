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
import { createArenaController } from '../arena/arena-controller.mjs';
import { createDailyController } from '../daily/daily-controller.mjs';
import { createAchievementsController } from '../achievements/achievements-controller.mjs';
import { createShopController } from '../shop/shop-controller.mjs';
import { createDeckController } from '../deck/deck-controller.mjs';
import { createCodexController } from '../codex/codex-controller.mjs';
import { buildDeckBattleOptions } from '../../deck/battle.mjs';
import { createStorage } from '../storage.mjs';
import { readDifficulty, writeDifficulty } from '../../ai/v2/difficulty.mjs';
import {
  DAILY_COMPLETION_REWARD,
  DAILY_FIRST_WIN_REWARD,
  addCoins,
  getEquippedCardBack,
  getEquippedPortrait,
  grantReward,
} from '../../economy/economy.mjs';
import { writeDailyResult } from '../../daily/daily.mjs';
import { createTutorialController } from '../tutorial/tutorial-controller.mjs';
import {
  FACTION_CARDS,
  characterIdsFor,
  getCharacterCard,
  renderCharacterSelect,
  renderFactionSelect,
  renderMainMenu,
  renderResultPanel,
  renderStartButton,
} from './templates/index.mjs';

export const SCREENS = Object.freeze(['menu', 'faction-select', 'character-select', 'in-game', 'campaign', 'arena', 'daily', 'achievements', 'shop', 'deck', 'codex', 'tutorial', 'multiplayer']);

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
  // The chosen character (leader id); defaults to the faction's first character.
  let selectedCharacter = characterIdsFor(selectedFaction)[0] ?? null;
  // Chosen AI difficulty; lazily loaded from storage on first use.
  let aiDifficulty = null;
  let entryMode = 'skirmish';
  let currentScreen = 'menu';
  let controller = null;
  let campaign = null;
  let arena = null;
  let daily = null;
  let achievements = null;
  let shop = null;
  let deck = null;
  let codex = null;
  let storage = null;
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
    <section class="gh2-screen gh2-screen--character" data-screen="character-select" hidden>
      <div data-role="character"></div>
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
    <section class="gh2-screen gh2-screen--arena" data-screen="arena" hidden>
      <div class="gh2-arena-host" data-app="arena"></div>
    </section>
    <section class="gh2-screen gh2-screen--daily" data-screen="daily" hidden>
      <div class="gh2-daily-host" data-app="daily"></div>
    </section>
    <section class="gh2-screen gh2-screen--achievements" data-screen="achievements" hidden>
      <div class="gh2-achievements-host" data-app="achievements"></div>
    </section>
    <section class="gh2-screen gh2-screen--shop" data-screen="shop" hidden>
      <div class="gh2-shop-host" data-app="shop"></div>
    </section>
    <section class="gh2-screen gh2-screen--deck" data-screen="deck" hidden>
      <div class="gh2-deck-host" data-app="deck"></div>
    </section>
    <section class="gh2-screen gh2-screen--codex" data-screen="codex" hidden>
      <div class="gh2-codex-host" data-app="codex"></div>
    </section>
    <section class="gh2-screen gh2-screen--tutorial" data-screen="tutorial" hidden>
      <header class="gh2-game-top">
        <button type="button" class="gh2-back-btn" data-app="tutorial-menu">← 返回主菜单</button>
        <span class="gh2-game-top__tag">灰港三夜 · 新手教程</span>
      </header>
      <div class="gh2-play-controls-host" data-app="tutorial-controls"></div>
      <main class="gh2-board" data-app="tutorial-board" aria-label="新手教程棋盘"></main>
    </section>
    <section class="gh2-screen gh2-screen--multiplayer" data-screen="multiplayer" hidden>
      <header class="gh2-game-top">
        <button type="button" class="gh2-back-btn" data-app="multiplayer-menu">← 返回主菜单</button>
        <span class="gh2-game-top__tag">灰港三夜 · 多人对战</span>
      </header>
      <div class="gh2-mp-lobby">
        <h2 class="gh2-mp-lobby__title">多人对战大厅</h2>
        <p class="gh2-mp-lobby__note">真人在线对战正在开发中。底层已预留确定性锁步接口与房间号协议，待接入 WebSocket 通道即可开局。</p>
        <label class="gh2-mp-lobby__field">
          <span>房间号</span>
          <input type="text" placeholder="输入 6 位房间号" disabled aria-disabled="true">
        </label>
        <div class="gh2-mp-lobby__actions">
          <button type="button" class="gh2-menu-btn gh2-menu-btn--primary" disabled aria-disabled="true">创建房间</button>
          <button type="button" class="gh2-menu-btn" disabled aria-disabled="true">加入房间</button>
        </div>
      </div>
    </section>`;
  root.appendChild(el);

  const screenNodes = Object.fromEntries(SCREENS.map((name) => [
    name,
    el.querySelector(`[data-screen="${name}"]`),
  ]));
  const factionHost = el.querySelector('[data-role="faction"]');
  const characterHost = el.querySelector('[data-role="character"]');
  const boardRoot = el.querySelector('[data-app="board"]');
  const controlsRoot = el.querySelector('[data-app="controls"]');
  const resultLayer = el.querySelector('[data-app="result"]');
  const campaignHost = el.querySelector('[data-app="campaign"]');
  const arenaHost = el.querySelector('[data-app="arena"]');
  const dailyHost = el.querySelector('[data-app="daily"]');
  const achievementsHost = el.querySelector('[data-app="achievements"]');
  const shopHost = el.querySelector('[data-app="shop"]');
  const deckHost = el.querySelector('[data-app="deck"]');
  const codexHost = el.querySelector('[data-app="codex"]');
  const tutorialBoard = el.querySelector('[data-app="tutorial-board"]');
  const tutorialControls = el.querySelector('[data-app="tutorial-controls"]');
  const gameScreen = screenNodes['in-game'];

  function renderFactionScreen() {
    factionHost.innerHTML = renderFactionSelect({
      selected: selectedFaction,
      seedMode,
      arena: entryMode === 'arena',
    });
  }

  function renderCharacterScreen() {
    const persistence = getStorage();
    const portraits = {};
    for (const id of characterIdsFor(selectedFaction)) {
      portraits[id] = getEquippedPortrait(persistence, id);
    }
    characterHost.innerHTML = renderCharacterSelect({
      faction: selectedFaction,
      selected: selectedCharacter,
      arena: entryMode === 'arena',
      difficulty: getAiDifficulty(),
      portraits,
    });
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
    if (name === 'character-select') renderCharacterScreen();
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
    const persistence = getStorage();
    controller = createGameController({
      boardRoot,
      controlsRoot,
      aiDelay: Number.isFinite(opts.aiDelay) ? opts.aiDelay : undefined,
      aiDifficulty: getAiDifficulty(),
      baseSeed: opts.baseSeed,
      seedGenerator: opts.seedGenerator,
      cardBackId: getEquippedCardBack(persistence),
      leaderPortrait: getEquippedPortrait(persistence, selectedCharacter),
      matchConfig: {
        humanFaction: selectedFaction,
        seedMode,
        humanLeader: selectedCharacter,
      },
      hooks: fx.hooks,
      onGameOver: (info) => {
        grantMatchWinReward(info, persistence);
        showResult(info);
      },
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
      aiDifficulty: getAiDifficulty(),
      hooks: fx ? fx.hooks : undefined,
      onExit: () => {
        destroyCampaign();
        showScreen('menu');
      },
    });
    showScreen('campaign');
    return campaign;
  }

  function destroyArena() {
    if (!arena) return;
    const old = arena;
    arena = null;
    try { old.destroy(); } catch (_) { /* a half-built arena must not block routing */ }
    if (arenaHost) arenaHost.innerHTML = '';
  }

  /** Fresh arena seed: injected generator, then browser crypto, then a local fallback. */
  function makeArenaSeed() {
    if (typeof opts.seedGenerator === 'function') return String(opts.seedGenerator());
    const webCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (webCrypto && typeof webCrypto.randomUUID === 'function') return webCrypto.randomUUID();
    return `arena-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }

  function startArenaDraft() {
    destroyController();
    destroyCampaign();
    destroyArena();
    const meta = getCharacterCard(selectedCharacter);
    arena = createArenaController({
      host: arenaHost,
      faction: selectedFaction,
      leader: selectedCharacter,
      leaderName: meta ? `${meta.title} · ${meta.nameZh}` : selectedCharacter,
      seed: makeArenaSeed(),
      onExit: () => {
        destroyArena();
        showScreen('menu');
      },
      onComplete: (battleOptions) => mountBattleOptions(battleOptions),
    });
    showScreen('arena');
    return arena;
  }

  /**
   * Generic mount for any injected battleOptions (arena draft, daily challenge).
   * The driving loop, AI and result panel are unchanged; an optional custom
   * gameOver callback lets the caller record the outcome before it is shown.
   */
  function mountBattleOptions(battleOptions, handleGameOver) {
    destroyArena();
    destroyDaily();
    destroyController();
    const persistence = getStorage();
    fx = createFxController({ boardRoot, controlsRoot });
    const humanLeaderId = battleOptions?.decks?.[0]?.leader ?? null;
    controller = createGameController({
      boardRoot,
      controlsRoot,
      battleOptions,
      cardBackId: getEquippedCardBack(persistence),
      leaderPortrait: humanLeaderId ? getEquippedPortrait(persistence, humanLeaderId) : null,
      aiDelay: Number.isFinite(opts.aiDelay) ? opts.aiDelay : undefined,
      aiDifficulty: getAiDifficulty(),
      hooks: fx.hooks,
      onGameOver: (info) => {
        if (typeof handleGameOver === 'function') handleGameOver(info);
        grantMatchWinReward(info, persistence);
        showResult(info);
      },
    });
    if (typeof window !== 'undefined') window.__greyharborGame = controller;
    hideResult();
    showScreen('in-game');
    return controller;
  }

  /** Lazily create the shared storage wrapper (safe no-op when unavailable). */
  function getStorage() {
    if (!storage) storage = createStorage(opts.storage);
    return storage;
  }

  /** Resolve the current difficulty, loading the persisted choice once. */
  function getAiDifficulty() {
    if (aiDifficulty === null) aiDifficulty = readDifficulty(getStorage());
    return aiDifficulty;
  }

  /** Store a new difficulty choice and persist it across sessions. */
  function setAiDifficulty(id) {
    if (writeDifficulty(getStorage(), id)) {
      aiDifficulty = id;
      return true;
    }
    return false;
  }

  // Non-daily matches (skirmish / arena / campaign) pay a small per-win amount.
  const MATCH_WIN_REWARD = 25;
  function grantMatchWinReward(info, persistence) {
    if (info?.result?.winner === 0) addCoins(persistence, MATCH_WIN_REWARD);
  }

  function destroyDaily() {
    if (!daily) return;
    const old = daily;
    daily = null;
    try { old.destroy(); } catch (_) { /* a half-built daily controller must not block routing */ }
    if (dailyHost) dailyHost.innerHTML = '';
  }

  function startDaily() {
    destroyController();
    destroyCampaign();
    destroyArena();
    destroyDaily();
    const persistence = getStorage();
    daily = createDailyController({
      host: dailyHost,
      storage: persistence,
      date: opts.date,
      aiDelay: Number.isFinite(opts.aiDelay) ? opts.aiDelay : undefined,
      onExit: () => {
        destroyDaily();
        showScreen('menu');
      },
      onComplete: (battleOptions, config) => {
        // Record the real outcome, then let the generic result panel render.
        mountBattleOptions(battleOptions, (info) => {
          const winner = info?.result?.winner;
          if (winner === 0 || winner === 1) {
            writeDailyResult(persistence, config.dateKey, winner === 0);
            grantReward(persistence, `daily:${config.dateKey}:completion`, DAILY_COMPLETION_REWARD);
            if (winner === 0) {
              grantReward(persistence, `daily:${config.dateKey}:firstwin`, DAILY_FIRST_WIN_REWARD);
            }
          }
        });
      },
    });
    showScreen('daily');
    return daily;
  }

  function destroyAchievements() {
    if (!achievements) return;
    const old = achievements;
    achievements = null;
    try { old.destroy(); } catch (_) { /* a half-built controller must not block routing */ }
    if (achievementsHost) achievementsHost.innerHTML = '';
  }

  function startAchievements() {
    destroyController();
    destroyCampaign();
    destroyArena();
    destroyDaily();
    destroyAchievements();
    achievements = createAchievementsController({
      host: achievementsHost,
      storage: getStorage(),
      date: opts.date,
      now: opts.now,
      onExit: () => {
        destroyAchievements();
        showScreen('menu');
      },
    });
    showScreen('achievements');
    return achievements;
  }

  function destroyShop() {
    if (!shop) return;
    const old = shop;
    shop = null;
    try { old.destroy(); } catch (_) { /* a half-built shop must not block routing */ }
    if (shopHost) shopHost.innerHTML = '';
  }

  function startShop() {
    destroyController();
    destroyCampaign();
    destroyArena();
    destroyDaily();
    destroyAchievements();
    destroyShop();
    shop = createShopController({
      host: shopHost,
      storage: getStorage(),
      onExit: () => {
        destroyShop();
        showScreen('menu');
      },
    });
    showScreen('shop');
    return shop;
  }

  function destroyDeck() {
    if (!deck) return;
    const old = deck;
    deck = null;
    try { old.destroy(); } catch (_) { /* a half-built deck editor must not block routing */ }
    if (deckHost) deckHost.innerHTML = '';
  }

  function startDeck() {
    destroyController();
    destroyCampaign();
    destroyArena();
    destroyDaily();
    destroyAchievements();
    destroyShop();
    destroyDeck();
    deck = createDeckController({
      host: deckHost,
      storage: getStorage(),
      onExit: () => {
        destroyDeck();
        showScreen('menu');
      },
      onBattle: (editor) => {
        mountBattleOptions(buildDeckBattleOptions(editor, makeArenaSeed()));
      },
    });
    showScreen('deck');
    return deck;
  }

  function destroyCodex() {
    if (!codex) return;
    const old = codex;
    codex = null;
    try { old.destroy(); } catch (_) { /* a half-built codex must not block routing */ }
    if (codexHost) codexHost.innerHTML = '';
  }

  function startCodex() {
    destroyController();
    destroyCampaign();
    destroyArena();
    destroyDaily();
    destroyAchievements();
    destroyShop();
    destroyCodex();
    codex = createCodexController({
      host: codexHost,
      onExit: () => {
        destroyCodex();
        showScreen('menu');
      },
    });
    showScreen('codex');
    return codex;
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
    const difficultyButton = target.closest('[data-difficulty]');
    if (difficultyButton) {
      const id = difficultyButton.dataset.difficulty;
      if (!setAiDifficulty(id)) return;
      const group = difficultyButton.closest('.gh2-difficulty');
      if (group) {
        for (const button of group.querySelectorAll('[data-difficulty]')) {
          const active = button.dataset.difficulty === id;
          button.classList.toggle('is-selected', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        }
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
    const characterButton = target.closest('[data-character]');
    if (characterButton) {
      const character = characterButton.dataset.character;
      if (!getCharacterCard(character)) return;
      selectedCharacter = character;
      for (const card of characterHost.querySelectorAll('[data-character]')) {
        const active = card.dataset.character === character;
        card.classList.toggle('is-selected', active);
        card.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
      const startButton = characterHost.querySelector('[data-menu-action="start-character-match"]');
      if (startButton) {
        const meta = getCharacterCard(character);
        startButton.querySelector('.gh2-menu-btn__body small').textContent =
          `以 ${meta.title} · ${meta.nameZh} 出战`;
      }
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
    const multiplayerBack = target.closest('[data-app="multiplayer-menu"]');
    if (multiplayerBack) {
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
    } else if (action === 'start-arena') {
      entryMode = 'arena';
      showScreen('faction-select');
    } else if (action === 'start-daily') {
      startDaily();
    } else if (action === 'start-achievements') {
      startAchievements();
    } else if (action === 'start-shop') {
      startShop();
    } else if (action === 'start-deck') {
      startDeck();
    } else if (action === 'start-codex') {
      startCodex();
    } else if (action === 'start-tutorial') {
      startTutorial();
    } else if (action === 'start-multiplayer') {
      showScreen('multiplayer');
    } else if (action === 'back') showScreen('menu');
    else if (action === 'start-match') {
      if (entryMode === 'campaign') {
        startCampaign();
      } else {
        // Skirmish / arena: default the character to the faction's first
        // character, then let the player pick one before proceeding.
        const ids = characterIdsFor(selectedFaction);
        if (!ids.includes(selectedCharacter)) selectedCharacter = ids[0] ?? null;
        showScreen('character-select');
      }
    } else if (action === 'character-back') {
      showScreen('faction-select');
    } else if (action === 'start-character-match') {
      if (entryMode === 'arena') startArenaDraft();
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
    startArenaDraft,
    startDaily,
    startAchievements,
    startShop,
    startDeck,
    startCodex,
    startTutorial,
    getController: () => controller,
    getCampaign: () => campaign,
    getArena: () => arena,
    getDaily: () => daily,
    getAchievements: () => achievements,
    getShop: () => shop,
    getDeck: () => deck,
    getCodex: () => codex,
    getTutorial: () => tutorial,
    getScreen: () => currentScreen,
    getSelection: () => ({
      humanFaction: selectedFaction,
      humanLeader: selectedCharacter,
      seedMode,
      aiDifficulty: getAiDifficulty(),
    }),
    destroy() {
      destroyController();
      destroyCampaign();
      destroyArena();
      destroyDaily();
      destroyAchievements();
      destroyShop();
      destroyDeck();
      destroyCodex();
      destroyTutorial();
      el.removeEventListener('click', handleClick);
      el.remove();
    },
  };
}

export default createAppShell;
