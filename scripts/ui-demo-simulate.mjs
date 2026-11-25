/**
 * scripts/ui-demo-simulate.mjs — headless smoke check for the v2 demo driver.
 *
 *   node scripts/ui-demo-simulate.mjs
 *
 * Uses the real engine + demo controller with a stub renderer (no DOM), then
 * reports which view states were rendered.  This is a development aid, not a
 * test: it proves the same data path used by game.html reaches midgame.
 */

import { createDemoController } from '../src/ui-v2/demo-controller.mjs';
import { renderBoardMarkup } from '../src/ui-v2/templates/board.mjs';

const seen = {
  renders: 0,
  phases: new Set(),
  nights: new Set(),
  eventTypes: new Set(),
  faces: new Set(),
  hiddenCards: 0,
  equipped: 0,
  sealed: 0,
  corrupted: 0,
  htmlLength: 0,
};

const renderer = {
  render(view, options = {}) {
    seen.renders += 1;
    seen.phases.add(view.phase);
    seen.nights.add(view.night);
    for (const event of view.events ?? []) {
      if (event?.type) seen.eventTypes.add(event.type);
    }
    for (const player of view.players ?? []) {
      for (const card of player.hand ?? []) seen.faces.add(card.face);
      for (const row of Object.values(player.board ?? {})) {
        for (const card of row ?? []) {
          if (!card) continue;
          if (card.hidden) seen.hiddenCards += 1;
          if (card.sealed) seen.sealed += 1;
          if (card.equipment) seen.equipped += 1;
          if ((card.corruption ?? 0) > 0) seen.corrupted += 1;
        }
      }
    }
    const html = renderBoardMarkup(view, { pov: 0, demo: options.demo });
    seen.htmlLength = html.length;
  },
};

const demo = createDemoController({
  renderer,
  seed: 'greyharbor-three-nights-demo',
  pov: 0,
  speed: 700,
});

let steps = 0;
while (steps < 160 && demo.getEngine().phase !== 'gameOver') {
  demo.step();
  steps += 1;
}

const report = {
  steps,
  renders: seen.renders,
  phases: [...seen.phases],
  nights: [...seen.nights].sort((a, b) => a - b),
  eventTypes: [...seen.eventTypes].sort(),
  faces: [...seen.faces],
  hiddenCardRenders: seen.hiddenCards,
  sealedRenders: seen.sealed,
  equippedRenders: seen.equipped,
  corruptedRenders: seen.corrupted,
  lastHtmlLength: seen.htmlLength,
  state: demo.getState(),
};
console.log(JSON.stringify(report, null, 2));

const required = ['mulligan', 'play', 'gameOver'];
const missingPhases = required.filter((phase) => !seen.phases.has(phase));
if (missingPhases.length) {
  console.error('状态覆盖不足：', missingPhases.join(', '));
  process.exitCode = 1;
}
demo.destroy();
