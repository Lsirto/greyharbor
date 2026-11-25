/**
 * scripts/balance-ablation.mjs — per-card "blank substitute" ablation sweep.
 *
 * HISTORICAL HARNESS. It relied on the temporary `cardOverrides` engine hook,
 * which has been removed at finalization. The recorded sweep is frozen in
 * docs/v12-ablation.json; re-running now only replays the shipped JSON.
 *
 * For every suspect card, replace it (same type/location/sanity-cost, keywords
 * and effect removed, power floored to 2 for units) with a synthetic card and
 * replay the SAME seed set. Delta in P1 (Cult) win rate vs baseline is the
 * card's measured contribution. Experiment-only overrides: the shipped JSON
 * is never touched.
 *
 *   node scripts/balance-ablation.mjs --games=1000 --seed=balance-v1.2 --out=docs/v12-ablation.json
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { CARDS, PRESET_DECKS } from '../src/engine/v2/index.js';
import { runExperiment } from './balance-experiment.mjs';

const DECK_SIZE = 19;

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

function blankCard(id) {
  const c = CARDS[id];
  if (!c) throw new Error(`unknown card ${id}`);
  const isUnit = c.type === 'unit' || c.type === 'oldgod';
  const blankId = `__blank_${id}`;
  return {
    id: blankId,
    name: `Blank ${id}`,
    nameEn: `Blank ${id}`,
    nameZh: `替代-${id}`,
    faction: c.faction,
    type: c.type,
    location: c.location,
    reasonPower: isUnit ? 2 : null,
    madnessPower: isUnit ? 2 : null,
    keywords: [],
    sanityCost: c.sanityCost,
    copies: 1,
    effect: '',
    flavor: '',
  };
}

function withBlank(preset, targetId) {
  const blank = blankCard(targetId);
  let replaced = 0;
  const cards = preset.cards.map((id) => {
    if (id === targetId && replaced === 0) {
      replaced += 1;
      return blank.id;
    }
    return id;
  });
  if (replaced !== 1) throw new Error(`ablation: ${targetId} not found once in preset`);
  if (cards.length !== DECK_SIZE) throw new Error(`ablation deck size ${cards.length}`);
  return {
    id: `${preset.id}-ablated-${targetId}`,
    name: `${preset.name} (-${targetId})`,
    faction: preset.faction,
    leader: preset.leader,
    cards,
  };
}

const games = Math.max(1, Number(arg('games', 1000)) || 1000);
const seedPrefix = arg('seed', 'balance-v1.2');
const overridesPath = arg('overrides', undefined);
const baseOverrides = overridesPath ? JSON.parse(readFileSync(overridesPath, 'utf8')) : {};
const common = { games, seedPrefix, ...baseOverrides };

function run(decks, extra = {}) {
  const summary = runExperiment({ ...common, decks, ...extra });
  return {
    p0Wins: summary.wins.p0,
    p1Wins: summary.wins.p1,
    p0WinRate: summary.p0WinRate,
    p1WinRate: summary.p1WinRate,
    firstPlayerWinRate: summary.firstPlayerWinRate,
    firstIsP0Rate: summary.firstPlayerIsP0Rate,
    sanityEndingRatio: summary.sanityEndingRatio,
    reasons: summary.reasons,
    endingNight: summary.endingNight,
    avgActionsPerGame: summary.avgActionsPerGame,
    conservation: summary.conservation,
  };
}

const baseline = run([PRESET_DECKS.society, PRESET_DECKS.cult]);
const baselineP1 = baseline.p1WinRate;
const results = [];

function add(label, summary) {
  results.push({
    label,
    ...summary,
    deltaP1pp: Number(((summary.p1WinRate - baselineP1) * 100).toFixed(2)),
  });
}

// Cult suspect cards (one copy each; the 2-copy zealot/acolyte entries ablate
// one copy to measure per-copy marginal value).
const cultIds = [
  'deep-one', 'zealot', 'the-sleeper', 'bell-claw', 'gravedigger', 'seance',
  'hooded-acolyte', 'sea-priestess', 'whisperer', 'drowned-altar',
  'tide-ritual', 'lunar-eclipse', 'thousand-eyes', 'stormy-night',
  'unexpected-aid', 'finn-calloway', 'silas-gold',
];
for (const id of cultIds) {
  const blank = blankCard(id);
  add(`cult:-${id}`, run([PRESET_DECKS.society, withBlank(PRESET_DECKS.cult, id)], {
    cardOverrides: { ...(baseOverrides.cardOverrides ?? {}), [blank.id]: blank },
  }));
}

// Society suspect cards.
const societyIds = [
  'abjuration', 'warding-rite', 'stormy-night', 'silver-lantern',
  'old-library', 'lucia-vaughn', 'nora-wells', 'samuel-pike', 'frank-holt',
  'edith-barrow', 'walter-morse', 'arthur-pendleton', 'thousand-eyes',
  'unexpected-aid', 'finn-calloway', 'silas-gold',
];
for (const id of societyIds) {
  const blank = blankCard(id);
  add(`society:-${id}`, run([withBlank(PRESET_DECKS.society, id), PRESET_DECKS.cult], {
    cardOverrides: { ...(baseOverrides.cardOverrides ?? {}), [blank.id]: blank },
  }));
}

// Faction-passive ablations (rule overrides, no card change).
add('rule:cultPassive=0', run([PRESET_DECKS.society, PRESET_DECKS.cult], {
  ruleOverrides: { ...(baseOverrides.ruleOverrides ?? {}), cultSacrificeBonus: 0, cultAltarBonus: 0 },
}));
add('rule:cultAltarBonus=2', run([PRESET_DECKS.society, PRESET_DECKS.cult], {
  ruleOverrides: { ...(baseOverrides.ruleOverrides ?? {}), cultAltarBonus: 2 },
}));

const out = {
  ok: true,
  games,
  seedPrefix,
  baseline,
  baselineP1WinRate: baselineP1,
  results: results.sort((a, b) => a.deltaP1pp - b.deltaP1pp),
};
const json = JSON.stringify(out, null, 2);
const outPath = arg('out', undefined);
if (outPath) writeFileSync(outPath, `${json}\n`, 'utf8');
console.log(JSON.stringify({
  ok: true,
  games,
  baselineP1WinRate: baselineP1,
  results: out.results.map((r) => ({
    label: r.label,
    p1WinRate: r.p1WinRate,
    deltaP1pp: r.deltaP1pp,
    sanity: r.sanityEndingRatio,
  })),
}, null, 2));
