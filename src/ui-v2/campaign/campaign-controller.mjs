/**
 * src/ui-v2/campaign/campaign-controller.mjs — orchestrates one Roguelike run.
 *
 * Owns the run state machine and renders the map / event / reward / rest /
 * result screens into a view host. Battle nodes mount the existing human-vs-AI
 * game-controller (with the campaign battleOptions) into a separate battle
 * host; when that fight ends, its real result is fed back into the run via
 * applyBattleOutcome. No engine rules are changed here.
 */

import {
  createRun,
  availableNextNodes,
  enterNode,
  resolveEvent,
  resolveTreasure,
  chooseCardReward,
  chooseRelicReward,
  chooseRestSupplies,
  chooseRestRemove,
  applyBattleOutcome,
  eventChoiceAvailable,
} from '../../campaign/run-state.mjs';
import { getEvent } from '../../campaign/data/events.mjs';
import { buildBattleConfig } from '../../campaign/battle.mjs';
import { createGameController } from '../game-controller.mjs';
import {
  renderMapScreen,
  renderEventScreen,
  renderCardReward,
  renderRelicReward,
  renderRestScreen,
  renderRestRemoveList,
  renderRunResult,
} from './templates/index.mjs';

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function createCampaignController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createCampaignController needs a DOM host');
  }

  const run = createRun({ seed: opts.seed, faction: opts.faction });
  let battleController = null;

  host.innerHTML = `
    <div class="gh2-campaign-view" data-cv="view"></div>
    <div class="gh2-campaign-battle" data-cv="battle" hidden>
      <header class="gh2-campaign-battle-top">
        <span class="gh2-game-top__tag">灰港三夜 · 战役战斗</span>
      </header>
      <div class="gh2-play-controls-host" data-cv="battle-controls"></div>
      <main class="gh2-board" data-cv="battle-board" aria-label="战役战斗棋盘"></main>
    </div>`;

  const viewHost = host.querySelector('[data-cv="view"]');
  const battleHost = host.querySelector('[data-cv="battle"]');
  const battleBoard = host.querySelector('[data-cv="battle-board"]');
  const battleControls = host.querySelector('[data-cv="battle-controls"]');

  function showView() {
    battleHost.hidden = true;
    viewHost.hidden = false;
  }

  function showBattle() {
    viewHost.hidden = true;
    battleHost.hidden = false;
  }

  function mountBattle() {
    const node = run.map.nodeById[run.currentNodeId];
    const battleOptions = buildBattleConfig(run, node);
    battleController = createGameController({
      boardRoot: battleBoard,
      controlsRoot: battleControls,
      battleOptions,
      matchConfig: {
        humanFaction: run.faction,
        humanLeader: run.leaderId,
        seedMode: 'fixed',
      },
      aiDelay: opts.aiDelay,
      aiDifficulty: opts.aiDifficulty,
      hooks: opts.hooks,
      onGameOver: handleBattleOver,
    });
    showBattle();
  }

  function handleBattleOver(info) {
    if (typeof opts.onBattleOver === 'function') opts.onBattleOver(info);
    const result = asObject(info).result;
    const old = battleController;
    battleController = null;
    if (old) old.destroy();
    battleBoard.innerHTML = '';
    battleControls.innerHTML = '';
    applyBattleOutcome(run, result);
    render();
  }

  function render() {
    if (run.status !== 'active') {
      viewHost.innerHTML = renderRunResult(run);
      showView();
      return;
    }
    if (!run.pending) {
      viewHost.innerHTML = renderMapScreen(run, availableNextNodes(run));
      showView();
      return;
    }

    switch (run.pending.kind) {
      case 'event': {
        const event = getEvent(run.pending.eventId);
        const availability = event.choices.map((choice) => eventChoiceAvailable(run, choice));
        viewHost.innerHTML = renderEventScreen(run, event, availability);
        break;
      }
      case 'cardReward':
        viewHost.innerHTML = renderCardReward(run);
        break;
      case 'relicReward':
        viewHost.innerHTML = renderRelicReward(run);
        break;
      case 'rest':
        viewHost.innerHTML = renderRestScreen(run);
        break;
      case 'treasure':
        resolveTreasure(run);
        viewHost.innerHTML = renderRelicReward(run);
        break;
      case 'battle':
        mountBattle();
        return;
      default:
        return;
    }
    showView();
  }

  function handleClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;

    const go = target.closest('[data-go]');
    if (go) { enterNode(run, go.dataset.go); render(); return; }

    const eventChoice = target.closest('[data-event-choice]');
    if (eventChoice) { resolveEvent(run, Number(eventChoice.dataset.eventChoice)); render(); return; }

    const cardChoice = target.closest('[data-card-choice]');
    if (cardChoice) { chooseCardReward(run, Number(cardChoice.dataset.cardChoice)); render(); return; }
    if (target.closest('[data-card-skip]')) { chooseCardReward(run, -1); render(); return; }

    const relicChoice = target.closest('[data-relic-choice]');
    if (relicChoice) { chooseRelicReward(run, Number(relicChoice.dataset.relicChoice)); render(); return; }
    if (target.closest('[data-relic-skip]')) { chooseRelicReward(run, -1); render(); return; }

    if (target.closest('[data-rest-supplies]')) { chooseRestSupplies(run); render(); return; }
    if (target.closest('[data-rest-remove]')) {
      viewHost.innerHTML = renderRestRemoveList(run);
      return;
    }
    const removeIndex = target.closest('[data-remove-index]');
    if (removeIndex) { chooseRestRemove(run, Number(removeIndex.dataset.removeIndex)); render(); return; }
    if (target.closest('[data-rest-back]')) { render(); return; }

    if (target.closest('[data-run-exit]')) {
      if (typeof opts.onExit === 'function') opts.onExit();
    }
  }

  function handleKey(event) {
    if (event?.key !== 'Enter') return;
    const element = event.target;
    if (element?.hasAttribute?.('data-go')) {
      enterNode(run, element.dataset.go);
      render();
    }
  }

  viewHost.addEventListener('click', handleClick);
  viewHost.addEventListener('keydown', handleKey);

  render();

  return {
    el: host,
    getRun: () => run,
    destroy() {
      viewHost.removeEventListener('click', handleClick);
      viewHost.removeEventListener('keydown', handleKey);
      if (battleController) {
        battleController.destroy();
        battleController = null;
      }
    },
  };
}

export default createCampaignController;
