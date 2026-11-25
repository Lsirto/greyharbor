/**
 * scripts/balance-diagnose.mjs — phase-1 diagnostics for the v1.2 balance patch.
 *
 * HISTORICAL HARNESS. It was run during the experiment phase with the temporary
 * `cardOverrides` / `ruleOverrides` engine hooks, which have been removed at
 * finalization. Output from that phase is frozen in docs/v12-diagnose.json.
 * Re-running now uses the shipped JSON only (no hook is honoured), so it acts
 * as a final-state per-card report rather than a reproduction of the baseline.
 *
 *   node scripts/balance-diagnose.mjs --games=1000 --seed=balance-v1.2 --out=docs/v12-diagnose.json
 *
 * Reads engine v2 + AI v2 only; never modifies AI. Random stays injected
 * (engine rng + per-player AI seed). No Math.random, no external deps.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import {
  createGame, countCards, PRESET_DECKS, CARDS, currentUnitPower,
} from '../src/engine/v2/index.js';
import { findInstanceByUid } from '../src/engine/v2/scoring.js';
import { chooseAction } from '../src/ai/v2/ai.mjs';

const DECK_SIZE = 19;
const MAX_ACTIONS = 400;

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

/** Expand a deck spec (preset id or {cards:[...]}) into a flat card-id list. */
function deckSpecIds(spec) {
  const preset = typeof spec === 'string' ? PRESET_DECKS[spec] : spec;
  const entries = preset.cards ?? preset.deck ?? preset;
  const ids = [];
  for (const entry of entries) {
    if (typeof entry === 'string') ids.push(entry);
    else if (entry && typeof entry.id === 'string') {
      for (let i = 0; i < (entry.count ?? 1); i += 1) ids.push(entry.id);
    }
  }
  return ids;
}

/** One game with full event/hand instrumentation. */
function playGame(options) {
  const seed = options.seed;
  const aiSeed = (p) => `${options.aiSeedPrefix ?? 'ai-match-ai'}:${p}:${seed}`;
  const engine = createGame({
    seed,
    cardOverrides: options.cardOverrides,
    ruleOverrides: options.ruleOverrides,
    decks: options.decks,
  });

  const decks = options.decks.map(deckSpecIds);
  const playEvents = [];
  const seenInHand = [new Set(), new Set()];
  let firstPlayer = null;
  let actions = 0;

  while (engine.phase !== 'gameOver') {
    if (actions >= MAX_ACTIONS) throw new Error(`deadlock in ${seed}`);
    if (firstPlayer === null && engine.state.night >= 1) firstPlayer = engine.state.firstPlayer;

    const p = engine.phase === 'mulligan'
      ? engine.pending?.players?.[0]
      : engine.current;
    if (p !== 0 && p !== 1) throw new Error(`no actor in ${seed}`);
    // Sample both hands before the action: the mulligan/next-night draws are
    // visible here, so "seen in hand" means actually drawn at some point.
    // (We only use public-information card ids, never hidden opponent data.)
    for (const player of [0, 1]) {
      for (const inst of engine.state.players[player].hand) seenInHand[player].add(inst.cardId);
    }

    const before = engine.state.events.length;
    const view = engine.viewFor(p);
    const action = chooseAction(view, { seed: aiSeed(p) });
    if (!action || !view.actions.includes(action)) throw new Error(`illegal AI action in ${seed}`);
    const outcome = engine.apply(action);
    if (!outcome.ok) throw new Error(`engine rejected action in ${seed}: ${outcome.error}`);

    for (const event of engine.state.events.slice(before)) {
      if (['play', 'attach', 'locationPlay', 'environmentPlay'].includes(event.type)) {
        const entry = {
          type: event.type,
          player: event.player,
          cardId: event.cardId,
          face: event.face ?? null,
          faceDown: !!event.faceDown,
          night: engine.state.night,
          power: null,
        };
        if (event.type === 'play' && !entry.faceDown) {
          const found = findInstanceByUid(engine.state, event.uid);
          if (found) {
            entry.power = currentUnitPower(
              engine.state, found.player, found.inst, found.location, found.slot,
            );
            entry.location = found.location;
          }
        }
        playEvents.push(entry);
      }
    }
    for (const player of [0, 1]) {
      const count = countCards(engine.state, player);
      if (count !== DECK_SIZE) throw new Error(`conservation broken in ${seed}: P${player} ${count}`);
    }
    actions += 1;
  }
  if (firstPlayer === null) throw new Error(`no first player in ${seed}`);
  return {
    result: engine.result(),
    firstPlayer,
    decks,
    playEvents,
    seenInHand,
    history: engine.state.history.map((h) => ({
      night: h.night,
      scores: h.scores.map((s) => s.total),
      winner: h.winner,
    })),
    events: engine.state.events.map((e) => ({ type: e.type, player: e.player, reason: e.reason })),
  };
}

const rate = (n, d) => (d ? Number((n / d).toFixed(4)) : null);

/** Aggregate per-card stats over a list of games. */
function cardStats(games, seat, factionLabel) {
  const stats = new Map();
  for (const game of games) {
    for (const p of [seat]) {
      const deck = game.decks[p];
      const counts = new Map();
      for (const id of deck) counts.set(id, (counts.get(id) ?? 0) + 1);
      for (const [id, copies] of counts) {
        if (!stats.has(id)) {
          stats.set(id, {
            id,
            faction: CARDS[id]?.faction ?? '?',
            copiesPerDeck: copies,
            inDeckGames: 0,
            seenHandGames: 0,
            playedGames: 0,
            plays: 0,
            winWhenInDeck: 0,
            winWhenDrawn: 0,
            winWhenPlayed: 0,
            powerSum: 0,
            powerCount: 0,
            powerFaceMadness: 0,
          });
        }
        const s = stats.get(id);
        s.inDeckGames += 1;
        if (game.result.winner === p) s.winWhenInDeck += 1;
        if (game.seenInHand[p].has(id)) {
          s.seenHandGames += 1;
          if (game.result.winner === p) s.winWhenDrawn += 1;
        }
      }
      const playedThisGame = new Set();
      for (const event of game.playEvents) {
        if (event.player !== p) continue;
        const s = stats.get(event.cardId) ?? stats.set(event.cardId, {
          id: event.cardId, faction: CARDS[event.cardId]?.faction ?? '?', copiesPerDeck: 0,
          inDeckGames: 0, seenHandGames: 0, playedGames: 0, plays: 0,
          winWhenInDeck: 0, winWhenDrawn: 0, winWhenPlayed: 0,
          powerSum: 0, powerCount: 0, powerFaceMadness: 0,
        }).get(event.cardId);
        s.plays += 1;
        playedThisGame.add(event.cardId);
        if (event.power !== null) {
          s.powerSum += event.power;
          s.powerCount += 1;
          if (event.face === 'madness') s.powerFaceMadness += 1;
        }
      }
      for (const id of playedThisGame) {
        const s = stats.get(id);
        s.playedGames += 1;
        if (game.result.winner === p) s.winWhenPlayed += 1;
      }
    }
  }
  return {
    subject: factionLabel,
    games: games.length,
    cards: [...stats.values()]
      .map((s) => ({
        ...s,
        playRatePerGame: rate(s.plays, games.length),
        winRateInDeck: rate(s.winWhenInDeck, s.inDeckGames),
        winRateWhenDrawn: rate(s.winWhenDrawn, s.seenHandGames),
        winRateWhenPlayed: rate(s.winWhenPlayed, s.playedGames),
        avgEntryPower: rate(s.powerSum, s.powerCount),
        madnessEntryShare: rate(s.powerFaceMadness, s.powerCount),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

function summarizeGames(games, label, decks) {
  const wins = [0, 0];
  let draws = 0;
  let fpWins = 0;
  let sanityEnds = 0;
  const reasons = {};
  const endingNight = {};
  let firstIsP0 = 0;
  let totalScore = [0, 0];
  for (const g of games) {
    wins[g.result.winner] += 1;
    if (g.result.winner === g.firstPlayer) fpWins += 1;
    if (g.result.winner === null) draws += 1;
    if (g.result.reason === 'sanity') sanityEnds += 1;
    if (g.firstPlayer === 0) firstIsP0 += 1;
    reasons[g.result.reason] = (reasons[g.result.reason] ?? 0) + 1;
    endingNight[g.result.night] = (endingNight[g.result.night] ?? 0) + 1;
    for (const h of g.history) {
      totalScore[0] += h.scores[0];
      totalScore[1] += h.scores[1];
    }
  }
  return {
    label,
    decks,
    games: games.length,
    p0Wins: wins[0],
    p1Wins: wins[1],
    draws,
    p0WinRate: rate(wins[0], games.length),
    p1WinRate: rate(wins[1], games.length),
    firstPlayerWins: fpWins,
    firstPlayerWinRate: rate(fpWins, games.length),
    firstIsP0Rate: rate(firstIsP0, games.length),
    sanityEndingRatio: rate(sanityEnds, games.length),
    reasons,
    endingNight,
    avgNightScore: totalScore.map((s) => Number((s / games.length).toFixed(2))),
  };
}

function runGames(count, seedPrefix, decks, overrides) {
  const games = [];
  for (let i = 0; i < count; i += 1) {
    games.push(playGame({
      seed: `${seedPrefix}-${i}`,
      decks,
      ...overrides,
    }));
  }
  return games;
}

const games = Math.max(1, Number(arg('games', 1000)) || 1000);
const seedPrefix = arg('seed', 'balance-v1.2');
const overridesPath = arg('overrides', undefined);
const overrides = overridesPath ? JSON.parse(readFileSync(overridesPath, 'utf8')) : {};
const bothCult = [PRESET_DECKS.cult, PRESET_DECKS.cult];
const bothSociety = [PRESET_DECKS.society, PRESET_DECKS.society];
const cross = [PRESET_DECKS.society, PRESET_DECKS.cult];

const cultMirror = runGames(Math.floor(games / 2.5), seedPrefix, bothCult, overrides);
const societyMirror = runGames(Math.floor(games / 2.5), seedPrefix, bothSociety, overrides);
const crossGames = runGames(games, seedPrefix, cross, overrides);

const out = {
  ok: true,
  games,
  seedPrefix,
  overrides,
  groups: [
    summarizeGames(cultMirror, 'cult-vs-cult', 'cult/cult'),
    summarizeGames(societyMirror, 'society-vs-society', 'society/society'),
    summarizeGames(crossGames, 'cross-society-vs-cult', 'society/cult'),
  ],
};

// Per-card diagnostics run on the cross group only (the mirror case has no
// seat signal). Only aggregates leave this script; no hidden info is exposed.
out.cardStats = {
  cult: cardStats(crossGames, 1, 'cult (P1)'),
  society: cardStats(crossGames, 0, 'society (P0)'),
};

const json = JSON.stringify(out, null, 2);
const outPath = arg('out', undefined);
if (outPath) writeFileSync(outPath, `${json}\n`, 'utf8');
console.log(json);
