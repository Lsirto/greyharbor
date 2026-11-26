/**
 * src/deck/decks-store.mjs — persistence for custom decks.
 *
 * Stores one saved deck per faction under the shared storage wrapper. The
 * serialized form is the plain editor shape {faction, leader, counts}, so it
 * survives reloads and is rebuilt through the same add/setLeader rules.
 */

import { addCard, createEditor, setLeader } from './editor.mjs';

export const CUSTOM_DECKS_KEY = 'greyharbor.custom-decks.v1';

function readAll(storage) {
  const raw = storage.getJson(CUSTOM_DECKS_KEY);
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

export function hasSavedDeck(storage, faction) {
  const saved = readAll(storage)[faction];
  return !!(saved && typeof saved === 'object');
}

export function saveDeck(storage, editor) {
  const all = readAll(storage);
  all[editor.faction] = {
    faction: editor.faction,
    leader: editor.leader,
    counts: { ...editor.counts },
  };
  storage.setJson(CUSTOM_DECKS_KEY, all);
  return all;
}

/** Rebuild a clean editor from storage, or null when nothing is saved. */
export function loadDeck(storage, faction) {
  const saved = readAll(storage)[faction];
  if (!saved || typeof saved !== 'object') return null;
  const editor = createEditor({ faction });
  if (typeof saved.leader === 'string') setLeader(editor, saved.leader);
  for (const [id, count] of Object.entries(saved.counts ?? {})) {
    for (let i = 0; i < count; i += 1) addCard(editor, id);
  }
  return editor;
}
