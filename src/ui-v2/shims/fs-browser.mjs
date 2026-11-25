/**
 * Browser shim for the single `node:fs` import used by src/engine/v2/cards.js.
 *
 * game.html installs an import map: "node:fs" -> this module.  The engine
 * remains untouched; its card table is fetched once from the same URL it
 * would read in Node.  Only `readFileSync(path, 'utf8')` is implemented.
 *
 * This file is browser-only.  Node tests never import it.
 */

const CARD_TABLE_URL = new URL('../../data/card-table.normalized.json', import.meta.url);

let tableText = null;
try {
  const response = await fetch(CARD_TABLE_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  tableText = await response.text();
} catch (error) {
  tableText = null;
  // The module still loads so the page can show a readable error instead of
  // a blank screen when opened via file:// (ES modules also require HTTP).
  console.error('[greyharbor-v2] 无法加载卡表：请用 npm start 后访问 http://127.0.0.1:8788/game.html', error);
}

export function readFileSync(filePath, encoding) {
  if (tableText === null) {
    throw new Error('卡表尚未加载：请通过本地服务器打开 game.html（npm start）');
  }
  const path = String(filePath ?? '');
  if (!path.includes('card-table.normalized.json')) {
    throw new Error(`browser fs shim only supports card-table.normalized.json: ${path}`);
  }
  void encoding;
  return tableText;
}

export default { readFileSync };
