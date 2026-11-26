/**
 * src/deck/battle.mjs — translate a validated editor into createGame options.
 * The human custom deck faces the opposing faction's preset; the game-controller
 * receives this through its battleOptions path, so the driving loop is unchanged.
 */

import { toDeckSpec, validateEditor } from './editor.mjs';

export function buildDeckBattleOptions(editor, seed) {
  const validation = validateEditor(editor);
  if (!validation.ok) {
    throw new Error(`custom deck failed validation: ${validation.errors[0]?.message ?? 'unknown'}`);
  }
  const deckSpec = toDeckSpec(editor);
  const opponentFaction = editor.faction === 'society' ? 'cult' : 'society';
  return {
    seed: typeof seed === 'string' && seed.length ? seed : `custom-${editor.faction}`,
    names: ['你 · 自定义牌组', 'AI · 对手'],
    decks: [deckSpec, opponentFaction],
  };
}
