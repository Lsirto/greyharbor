/** Public template barrel for the phase 3.3 menu screens. */

export { renderMainMenu, MAIN_MENU_TEXT } from './main-menu.mjs';
export {
  FACTION_IDS,
  FACTION_CARDS,
  getFactionCard,
  renderFactionCard,
  renderStartButton,
  renderFactionSelect,
} from './faction-select.mjs';
export { SEED_MODES, renderModeToggle } from './mode-toggle.mjs';
export { RESULT_REASON_ZH, renderResultPanel } from './result-panel.mjs';
export {
  CHARACTER_ROSTER,
  characterIdsFor,
  getCharacterCard,
  renderCharacterCard,
  renderCharacterSelect,
  renderDifficultySelect,
} from './character-select.mjs';
