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
import { audio as defaultAudio } from '../audio/audio-engine.mjs';
import { createCampaignController } from '../campaign/campaign-controller.mjs';
import { createArenaController } from '../arena/arena-controller.mjs';
import { createDailyController } from '../daily/daily-controller.mjs';
import { createAchievementsController } from '../achievements/achievements-controller.mjs';
import { createHistoryController } from '../history/history-controller.mjs';
import { createShopController } from '../shop/shop-controller.mjs';
import { createDeckController } from '../deck/deck-controller.mjs';
import { createCodexController } from '../codex/codex-controller.mjs';
import { buildDeckBattleOptions } from '../../deck/battle.mjs';
import { PRESET_DECKS } from '../../engine/v2/index.js';
import { createStorage } from '../storage.mjs';
import { readDifficulty, writeDifficulty } from '../../ai/v2/difficulty.mjs';
import {
  DAILY_COMPLETION_REWARD,
  DAILY_FIRST_WIN_REWARD,
  addCoins,
  equipSkin,
  getEquippedCardBack,
  getEquippedPortrait,
  getEquippedSkin,
  getSkinCollection,
  grantReward,
  unequipSkin,
} from '../../economy/economy.mjs';
import { writeDailyResult } from '../../daily/daily.mjs';
import { recordMatch, readHistorySummary } from '../../history/match-history.mjs';
import { buildReport } from '../../report/report.mjs';
import { createReportCanvas, downloadReport } from '../report/report-canvas.mjs';
import { collectBackup, parseBackup, restoreBackup } from '../../save/backup.mjs';
import { renderBackupPanel } from './templates/backup-panel.mjs';
import { createTutorialController } from '../tutorial/tutorial-controller.mjs';
import {
  FACTION_CARDS,
  characterIdsFor,
  getCharacterCard,
  renderAudioSettings,
  renderCharacterSelect,
  renderFactionSelect,
  renderMainMenu,
  renderResultPanel,
  renderSkinSwitcher,
  renderStartButton,
} from './templates/index.mjs';

export const SCREENS = Object.freeze(['menu', 'faction-select', 'character-select', 'in-game', 'campaign', 'arena', 'daily', 'achievements', 'history', 'shop', 'deck', 'codex', 'tutorial', 'multiplayer']);

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
  // The chosen recommended preset deck id; defaults to the faction's default preset.
  let selectedDeckId = PRESET_DECKS[selectedFaction]?.id ?? null;
  // Transient skin-switcher preview (skin id, or 'default' for the base look).
  let previewSkinId = undefined;
  // Chosen AI difficulty; lazily loaded from storage on first use.
  let aiDifficulty = null;
  let entryMode = 'skirmish';
  let currentScreen = 'menu';
  let controller = null;
  let campaign = null;
  let arena = null;
  let daily = null;
  let achievements = null;
  let history = null;
  let lastReport = null;
  let shop = null;
  let deck = null;
  let codex = null;
  let storage = null;
  let tutorial = null;
  let fx = null;
  const audioEngine = opts.audio ?? defaultAudio;
  let audioLayer = null;
  let backupLayer = null;

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
        <span class="gh2-game-top__tag">灰港夜谭 · 人机对战</span>
      </header>
      <div class="gh2-play-controls-host" data-app="controls"></div>
      <main class="gh2-board" data-app="board" aria-label="灰港夜谭人机对战棋盘"></main>
      <div class="gh2-result-layer" data-app="result" hidden></div>
    </section>
    <section class="gh2-screen gh2-screen--campaign" data-screen="campaign" hidden>
      <header class="gh2-game-top">
        <button type="button" class="gh2-back-btn" data-app="campaign-menu">← 返回主菜单</button>
        <span class="gh2-game-top__tag">灰港夜谭 · 战役模式</span>
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
    <section class="gh2-screen gh2-screen--history" data-screen="history" hidden>
      <div class="gh2-history-host" data-app="history"></div>
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
        <span class="gh2-game-top__tag">灰港夜谭 · 新手教程</span>
      </header>
      <div class="gh2-play-controls-host" data-app="tutorial-controls"></div>
      <main class="gh2-board" data-app="tutorial-board" aria-label="新手教程棋盘"></main>
    </section>
    <section class="gh2-screen gh2-screen--multiplayer" data-screen="multiplayer" hidden>
      <header class="gh2-game-top">
        <button type="button" class="gh2-back-btn" data-app="multiplayer-menu">← 返回主菜单</button>
        <span class="gh2-game-top__tag">灰港夜谭 · 多人对战</span>
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
  const historyHost = el.querySelector('[data-app="history"]');
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

  // Ownership and the equipped look for every character in the faction.
  function readSkinState() {
    const persistence = getStorage();
    const collection = getSkinCollection(persistence);
    const result = {};
    for (const id of characterIdsFor(selectedFaction)) {
      const ownedIds = collection
        .filter((item) => item.characterId === id && item.owned)
        .map((item) => item.id);
      result[id] = { ownedIds, equippedId: getEquippedSkin(persistence, id) };
    }
    return result;
  }

  function renderCharacterScreen() {
    const persistence = getStorage();
    const portraits = {};
    for (const id of characterIdsFor(selectedFaction)) {
      portraits[id] = getEquippedPortrait(persistence, id);
    }
    // A fresh screen opens on the equipped look; an in-progress preview survives.
    if (previewSkinId === undefined) {
      previewSkinId = getEquippedSkin(persistence, selectedCharacter) ?? 'default';
    }
    characterHost.innerHTML = renderCharacterSelect({
      faction: selectedFaction,
      selected: selectedCharacter,
      selectedDeckId,
      arena: entryMode === 'arena',
      difficulty: getAiDifficulty(),
      portraits,
      skinState: readSkinState(),
      previewId: previewSkinId,
    });
  }

  // Re-render just the switcher after preview/equip changes (no full re-render).
  function refreshSkinPanel() {
    const host = characterHost.querySelector('[data-role="skin-switcher-host"]');
    if (!host) return;
    const state = readSkinState();
    host.innerHTML = renderSkinSwitcher(
      selectedCharacter,
      state[selectedCharacter] ?? null,
      previewSkinId,
    );
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
    if (name === 'character-select') {
      previewSkinId = undefined;
      renderCharacterScreen();
    }
    if (name !== 'in-game') hideResult();
    return true;
  }

  function hideResult() {
    if (!resultLayer) return;
    lastReport = null;
    resultLayer.hidden = true;
    resultLayer.innerHTML = '';
    if (gameScreen) gameScreen.classList.remove('is-over');
  }

  function showResult(info, mode) {
    if (!resultLayer) return;
    lastReport = { info, mode: mode ?? entryMode ?? 'skirmish' };
    resultLayer.innerHTML = renderResultPanel(info);
    resultLayer.hidden = false;
    if (gameScreen) gameScreen.classList.add('is-over');
  }

  function generateReport() {
    if (!lastReport) return;
    const persistence = getStorage();
    const summary = readHistorySummary(persistence);
    const vm = buildReport(lastReport.info, {
      mode: lastReport.mode,
      now: opts.now ?? Date.now(),
      summary,
    });
    try {
      const canvas = createReportCanvas(vm);
      const stamp = typeof opts.now === 'number' && Number.isFinite(opts.now) ? opts.now : Date.now();
      downloadReport(canvas, `灰港夜谭战报-${stamp}`);
    } catch (error) {
      // 出图失败不应阻断再来一局 / 返回菜单。
    }
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
        humanDeckId: selectedDeckId,
      },
      hooks: fx.hooks,
      onGameOver: (info) => {
        recordMatch(persistence, info, { mode: 'skirmish', now: opts.now ?? Date.now() });
        grantMatchWinReward(info, persistence);
        showResult(info, 'skirmish');
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
      onBattleOver: (info) => {
        recordMatch(getStorage(), info, { mode: 'campaign', now: opts.now ?? Date.now() });
      },
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
      onComplete: (battleOptions) => mountBattleOptions(battleOptions, undefined, 'arena'),
    });
    showScreen('arena');
    return arena;
  }

  /**
   * Generic mount for any injected battleOptions (arena draft, daily challenge).
   * The driving loop, AI and result panel are unchanged; an optional custom
   * gameOver callback lets the caller record the outcome before it is shown.
   */
  function mountBattleOptions(battleOptions, handleGameOver, mode) {
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
        const humanDeck = Array.isArray(battleOptions?.decks) ? battleOptions.decks[0] : null;
        recordMatch(persistence, info, {
          mode,
          faction: humanDeck && typeof humanDeck === 'object' ? humanDeck.faction : undefined,
          leader: humanDeck && typeof humanDeck === 'object' ? humanDeck.leader : undefined,
          now: opts.now ?? Date.now(),
        });
        if (typeof handleGameOver === 'function') handleGameOver(info);
        grantMatchWinReward(info, persistence);
        showResult(info, mode);
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
        }, 'daily');
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

  function destroyHistory() {
    if (!history) return;
    const old = history;
    history = null;
    try { old.destroy(); } catch (_) { /* a half-built controller must not block routing */ }
    if (historyHost) historyHost.innerHTML = '';
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

  function navigateFromHistory(action) {
    destroyHistory();
    if (action === 'achievements') startAchievements();
    else if (action === 'shop') startShop();
    else if (action === 'daily') startDaily();
    else showScreen('menu');
  }

  function startHistory() {
    destroyController();
    destroyCampaign();
    destroyArena();
    destroyDaily();
    destroyAchievements();
    destroyShop();
    destroyDeck();
    destroyCodex();
    destroyHistory();
    history = createHistoryController({
      host: historyHost,
      storage: getStorage(),
      date: opts.date,
      now: opts.now,
      onExit: () => {
        destroyHistory();
        showScreen('menu');
      },
      onNavigate: navigateFromHistory,
    });
    showScreen('history');
    return history;
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
        mountBattleOptions(buildDeckBattleOptions(editor, makeArenaSeed()), undefined, 'deck');
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

  function closeAudioSettings() {
    if (!audioLayer) return;
    const old = audioLayer;
    audioLayer = null;
    try { old.remove(); } catch (_) { /* ignore */ }
  }

  function openAudioSettings() {
    closeAudioSettings();
    const layer = document.createElement('div');
    layer.className = 'gh2-audio-layer-host';
    layer.innerHTML = renderAudioSettings(audioEngine.getSettings());
    el.appendChild(layer);
    audioLayer = layer;
  }

  function refreshAudioSettings() {
    if (!audioLayer) return;
    audioLayer.innerHTML = renderAudioSettings(audioEngine.getSettings());
  }

  function closeBackupPanel() {
    if (!backupLayer) return;
    const old = backupLayer;
    backupLayer = null;
    try { old.remove(); } catch (_) { /* ignore */ }
  }

  function openBackupPanel() {
    closeBackupPanel();
    const layer = document.createElement('div');
    layer.innerHTML = renderBackupPanel({ message: '' });
    el.appendChild(layer);
    backupLayer = layer;
  }

  function refreshBackupPanel(message, messageKind) {
    if (!backupLayer) return;
    backupLayer.innerHTML = renderBackupPanel({ message, messageKind });
  }

  function stampDate(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function exportBackup() {
    try {
      const backup = collectBackup(getStorage(), { now: opts.now ?? Date.now() });
      const text = JSON.stringify(backup, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `灰港夜谭存档-${stampDate(opts.now ?? Date.now())}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      refreshBackupPanel('存档已导出，请妥善保存备份文件。', 'ok');
    } catch (_) {
      refreshBackupPanel('导出失败，请重试。', 'warn');
    }
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackup(String(reader.result ?? ''));
        const count = restoreBackup(getStorage(), parsed);
        refreshBackupPanel(`已恢复 ${count} 项存档，返回主菜单后生效。`, 'ok');
      } catch (error) {
        refreshBackupPanel(error?.message || '导入失败，存档文件无法识别。', 'warn');
      }
    };
    reader.onerror = () => refreshBackupPanel('读取文件失败，请重试。', 'warn');
    reader.readAsText(file);
  }

  function handleBackupChange(event) {
    const input = event?.target;
    const file = input && typeof input.closest === 'function'
      ? input.closest('[data-backup-file]')
      : null;
    if (!file) return;
    importBackup(file.files?.[0]);
  }

  function handleAudioToggle(button) {
    const turningOn = button.getAttribute('aria-pressed') !== 'true';
    if (button.dataset.audioToggle === 'sfx') audioEngine.setSfxEnabled(turningOn);
    else if (button.dataset.audioToggle === 'bgm') audioEngine.setBgmEnabled(turningOn);
    else return;
    refreshAudioSettings();
  }

  // 滑块拖动：实时把 0–100 换算成 0–1 写入对应总线。
  function handleAudioInput(event) {
    const source = event?.target;
    const slider = source && typeof source.closest === 'function'
      ? source.closest('[data-audio-volume]')
      : null;
    if (!slider) return;
    const value = Number(slider.value) / 100;
    if (slider.dataset.audioVolume === 'sfx') audioEngine.setVolume(value);
    else if (slider.dataset.audioVolume === 'bgm') audioEngine.setBgmVolume(value);
  }

  function handleClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    const backupClose = target.closest('[data-backup-close]');
    if (backupClose) {
      closeBackupPanel();
      return;
    }
    const backupExport = target.closest('[data-backup-export]');
    if (backupExport) {
      exportBackup();
      return;
    }
    const backupImport = target.closest('[data-backup-import]');
    if (backupImport) {
      const fileInput = backupLayer?.querySelector?.('[data-backup-file]');
      fileInput?.click();
      return;
    }
    if (target.closest('[data-backup-layer]') && !target.closest('.gh2-audio-modal')) {
      closeBackupPanel();
      return;
    }
    const audioClose = target.closest('[data-audio-close]');
    if (audioClose) {
      closeAudioSettings();
      return;
    }
    const audioToggle = target.closest('[data-audio-toggle]');
    if (audioToggle) {
      handleAudioToggle(audioToggle);
      return;
    }
    // 点遮罩空白处（浮层根节点本身）关闭，点面板内部不关闭。
    if (target.closest('[data-audio-layer]') && !target.closest('.gh2-audio-modal')) {
      closeAudioSettings();
      return;
    }
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
      selectedDeckId = PRESET_DECKS[faction]?.id ?? null;
      for (const card of factionHost.querySelectorAll('[data-faction]')) {
        const active = card.dataset.faction === faction;
        card.classList.toggle('is-selected', active);
        card.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
      const startHost = factionHost.querySelector('[data-role="start"]');
      if (startHost) startHost.innerHTML = renderStartButton(selectedFaction);
      return;
    }
    // ── In-screen skin switcher (character-select) ──
    const skinActionEl = target.closest('[data-skin-action]');
    if (skinActionEl) {
      const skinAction = skinActionEl.dataset.skinAction;
      if (skinAction === 'go-shop') {
        startShop();
        return;
      }
      if (skinAction === 'equip') {
        const skinId = skinActionEl.dataset.skinId;
        const persistence = getStorage();
        // An empty skin id means the base look: clear the equipped skin.
        const result = skinId
          ? equipSkin(persistence, selectedCharacter, skinId)
          : unequipSkin(persistence, selectedCharacter);
        if (result.ok) {
          previewSkinId = result.equipped ?? 'default';
          renderCharacterScreen();
        }
        return;
      }
      return;
    }
    const skinNavEl = target.closest('[data-skin-nav]');
    if (skinNavEl) {
      const host = characterHost.querySelector('[data-role="skin-switcher-host"]');
      const thumbs = host ? [...host.querySelectorAll('[data-skin-preview]')] : [];
      if (thumbs.length) {
        const activeIndex = thumbs.findIndex(
          (button) => button.getAttribute('aria-pressed') === 'true',
        );
        const delta = skinNavEl.dataset.skinNav === 'prev' ? -1 : 1;
        const nextIndex = (activeIndex + delta + thumbs.length) % thumbs.length;
        previewSkinId = thumbs[nextIndex].dataset.skinPreview;
        refreshSkinPanel();
      }
      return;
    }
    const skinPreviewEl = target.closest('[data-skin-preview]');
    if (skinPreviewEl) {
      previewSkinId = skinPreviewEl.dataset.skinPreview;
      refreshSkinPanel();
      return;
    }
    // ── Recommended preset picker (character-select) ──
    const presetEl = target.closest('[data-deck-preset]');
    if (presetEl) {
      const deckId = presetEl.dataset.deckPreset;
      selectedDeckId = deckId;
      for (const option of characterHost.querySelectorAll('[data-deck-preset]')) {
        const active = option.dataset.deckPreset === deckId;
        option.classList.toggle('is-selected', active);
        option.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
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
      // Switching character resets the switcher to that character's equipped look.
      previewSkinId = getEquippedSkin(getStorage(), character) ?? 'default';
      refreshSkinPanel();
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
    } else if (action === 'start-history') {
      startHistory();
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
    } else if (action === 'audio-settings') {
      openAudioSettings();
    } else if (action === 'start-backup') {
      openBackupPanel();
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
    } else if (action === 'share-report') {
      generateReport();
    } else if (action === 'menu') {
      destroyController();
      showScreen('menu');
    }
  }

  el.addEventListener('click', handleClick);
  el.addEventListener('input', handleAudioInput);
  el.addEventListener('change', handleBackupChange);

  return {
    el,
    showScreen,
    startMatch,
    startCampaign,
    startArenaDraft,
    startDaily,
    startAchievements,
    startHistory,
    startShop,
    startDeck,
    startCodex,
    startTutorial,
    getController: () => controller,
    getCampaign: () => campaign,
    getArena: () => arena,
    getDaily: () => daily,
    getAchievements: () => achievements,
    getHistory: () => history,
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
      destroyHistory();
      destroyShop();
      destroyDeck();
      destroyCodex();
      destroyTutorial();
      closeAudioSettings();
      closeBackupPanel();
      el.removeEventListener('click', handleClick);
      el.removeEventListener('input', handleAudioInput);
      el.removeEventListener('change', handleBackupChange);
      el.remove();
    },
  };
}

export default createAppShell;
