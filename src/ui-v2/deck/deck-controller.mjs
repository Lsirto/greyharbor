/**
 * src/ui-v2/deck/deck-controller.mjs — DOM orchestration for the deck editor.
 * Holds the editor state and storage, runs every mutation through the pure
 * deck module, then re-renders. No game rules live here.
 */

import {
  addCard,
  createEditor,
  removeCard,
  setLeader,
} from '../../deck/editor.mjs';
import { hasSavedDeck, loadDeck, saveDeck } from '../../deck/decks-store.mjs';
import { asObject } from '../utils.mjs';
import { renderDeckEditor } from './templates/index.mjs';

export function createDeckController(options = {}) {
  const opts = asObject(options);
  const host = opts.host && typeof opts.host.appendChild === 'function' ? opts.host : null;
  if (!host || typeof document === 'undefined') {
    throw new TypeError('createDeckController needs a DOM host');
  }
  if (!opts.storage) throw new TypeError('createDeckController needs storage');

  let destroyed = false;
  let saved = false;
  const faction = typeof opts.faction === 'string' ? opts.faction : 'society';
  let editor = hasSavedDeck(opts.storage, faction)
    ? (saved = true, loadDeck(opts.storage, faction))
    : createEditor({ faction });

  function render() {
    host.innerHTML = renderDeckEditor(editor, { saved });
  }

  function handleClick(event) {
    if (destroyed) return;
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return;
    const source = target.closest('[data-deck]');
    if (!source) return;
    const action = source.dataset.deck;

    if (action === 'exit') {
      if (typeof opts.onExit === 'function') opts.onExit();
      return;
    }
    if (action === 'faction') {
      const nextFaction = source.dataset.faction;
      if (nextFaction !== editor.faction) {
        // Switching faction loads its saved deck when one exists, else a fresh one.
        editor = hasSavedDeck(opts.storage, nextFaction)
          ? loadDeck(opts.storage, nextFaction)
          : createEditor({ faction: nextFaction });
        saved = hasSavedDeck(opts.storage, nextFaction);
      }
    } else if (action === 'leader') {
      if (setLeader(editor, source.dataset.leader).ok) saved = false;
    } else if (action === 'add') {
      if (addCard(editor, source.dataset.card).ok) saved = false;
    } else if (action === 'remove') {
      if (removeCard(editor, source.dataset.card).ok) saved = false;
    } else if (action === 'save') {
      saveDeck(opts.storage, editor);
      saved = true;
    } else if (action === 'start') {
      if (source.disabled || source.getAttribute('aria-disabled') === 'true') return;
      if (typeof opts.onBattle === 'function') opts.onBattle(editor);
      return;
    }
    render();
  }

  host.addEventListener('click', handleClick);
  render();

  return {
    el: host,
    getEditor: () => editor,
    refresh: render,
    destroy() {
      destroyed = true;
      host.removeEventListener('click', handleClick);
    },
  };
}

export default createDeckController;
