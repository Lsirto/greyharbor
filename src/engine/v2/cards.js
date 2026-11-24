/**
 * Greyharbor v2.1 — static card data.
 *
 * Phase 2.1 is a rules skeleton: abilities are intentionally NOT implemented.
 * Only the fields the skeleton needs are kept here.  Power values and deck
 * lists mirror docs/GREYHARBOR_RULES_V1.md §10.
 *
 * Keywords use canonical English ids:
 *   stealth, seal, chain, backlash, corruption, sacrifice
 * The only keyword the skeleton reacts to is `stealth` (face-down entry).
 */

const def = (
  id,
  name,
  faction,
  type,
  location,
  reasonPower,
  madnessPower,
  keywords = [],
  sanityCost = 0,
) => ({
  id,
  name,
  faction,
  type,
  location,
  reasonPower,
  madnessPower,
  keywords,
  sanityCost,
});

export const CARDS = Object.freeze({
  // ── Leaders (never in the 19-card deck) ──────────────────────────────
  'harold-ashby': def('harold-ashby', 'Harold Ashby', 'society', 'leader', null, null, null),
  'elias-thorne': def('elias-thorne', 'Elias Thorne', 'cult', 'leader', null, null, null),

  // ── Society + neutral cards ──────────────────────────────────────────
  'nora-wells': def('nora-wells', 'Nora Wells', 'society', 'unit', 'scene', 2, 4, ['stealth']),
  'samuel-pike': def('samuel-pike', 'Dr. Samuel Pike', 'society', 'unit', 'scene', 4, 4, ['seal']),
  'edith-barrow': def('edith-barrow', 'Edith Barrow', 'society', 'unit', 'archive', 2, 3, ['chain']),
  'walter-morse': def('walter-morse', 'Walter Morse', 'society', 'unit', 'archive', 3, 6, ['backlash']),
  'lucia-vaughn': def('lucia-vaughn', 'Lucia Vaughn', 'society', 'unit', 'dream', 1, 7, ['stealth']),
  'frank-holt': def('frank-holt', 'Capt. Frank Holt', 'society', 'unit', 'scene', 5, 5, ['chain']),
  'arthur-pendleton': def('arthur-pendleton', 'Arthur Pendleton', 'society', 'unit', 'archive', 3, 4, ['stealth']),
  abjuration: def('abjuration', 'Abjuration', 'society', 'event', 'any', null, null),
  'warding-rite': def('warding-rite', 'Warding Rite', 'society', 'event', 'row', null, null),
  'silver-lantern': def('silver-lantern', 'The Silver Lantern', 'society', 'equipment', 'attach', null, null),
  'old-library': def('old-library', 'The Old Library', 'society', 'location', 'archive', null, null),

  // ── Cult + neutral cards ─────────────────────────────────────────────
  'hooded-acolyte': def('hooded-acolyte', 'Hooded Acolyte', 'cult', 'unit', 'scene', 2, 3, ['sacrifice']),
  zealot: def('zealot', 'Zealot', 'cult', 'unit', 'scene', 3, 6, ['backlash']),
  'sea-priestess': def('sea-priestess', 'Sea Priestess', 'cult', 'unit', 'archive', 4, 5, ['corruption']),
  gravedigger: def('gravedigger', 'Gravedigger', 'cult', 'unit', 'archive', 3, 4, ['sacrifice']),
  whisperer: def('whisperer', 'The Whisperer', 'cult', 'unit', 'dream', 2, 7, ['stealth']),
  'deep-one': def('deep-one', 'Deep One', 'cult', 'unit', 'dream', 5, 8, ['backlash'], 1),
  'bell-claw': def('bell-claw', 'Bell-Claw', 'cult', 'unit', 'scene', 6, 6, ['sacrifice'], 1),
  seance: def('seance', 'Séance', 'cult', 'ritual', 'any', null, null),
  'tide-ritual': def('tide-ritual', 'Tide Ritual', 'cult', 'ritual', 'dream', null, null),
  'lunar-eclipse': def('lunar-eclipse', 'Lunar Eclipse', 'cult', 'environment', 'all', null, null),
  'drowned-altar': def('drowned-altar', 'Drowned Bell Altar', 'cult', 'location', 'scene', null, null),
  'finn-calloway': def('finn-calloway', 'Finn Calloway', 'neutral', 'unit', 'any', 3, 4, ['chain']),
  'silas-gold': def('silas-gold', 'Silas Gold', 'neutral', 'unit', 'archive', 2, 3, ['stealth']),
  'the-sleeper': def('the-sleeper', 'The Sleeper', 'neutral', 'oldgod', 'dream', 8, 12, ['backlash'], 2),
  'thousand-eyes': def('thousand-eyes', 'Thousand Eyes', 'neutral', 'oldgod', 'archive', 7, 10, ['seal'], 2),
  'stormy-night': def('stormy-night', 'Stormy Night', 'neutral', 'environment', 'all', null, null),
  'unexpected-aid': def('unexpected-aid', 'Unexpected Aid', 'neutral', 'event', 'any', null, null),
});

const flat = (ids) => ids.flatMap((id) => (Array.isArray(id) ? Array(id[1]).fill(id[0]) : [id]));

/** v1 preset: 1 leader + exactly 19 non-leader cards. */
export const PRESET_DECKS = Object.freeze({
  society: Object.freeze({
    id: 'society',
    name: 'Society',
    leader: 'harold-ashby',
    cards: Object.freeze(flat([
      ['nora-wells', 2],
      ['samuel-pike', 2],
      'edith-barrow',
      'walter-morse',
      'lucia-vaughn',
      'frank-holt',
      'arthur-pendleton',
      'abjuration',
      'warding-rite',
      'silver-lantern',
      'old-library',
      'finn-calloway',
      ['silas-gold', 2],
      'thousand-eyes',
      'unexpected-aid',
      'stormy-night',
    ])),
  }),
  cult: Object.freeze({
    id: 'cult',
    name: 'Cult',
    leader: 'elias-thorne',
    cards: Object.freeze(flat([
      ['hooded-acolyte', 2],
      ['zealot', 2],
      'sea-priestess',
      'gravedigger',
      'whisperer',
      'deep-one',
      'bell-claw',
      'seance',
      'tide-ritual',
      'lunar-eclipse',
      'drowned-altar',
      'finn-calloway',
      'silas-gold',
      'the-sleeper',
      'thousand-eyes',
      'stormy-night',
      'unexpected-aid',
    ])),
  }),
});

export const DEFAULT_DECK_ORDER = Object.freeze(['society', 'cult']);

export function makeCardIndex(pool = CARDS) {
  if (!pool) return { ...CARDS };
  if (Array.isArray(pool)) {
    const out = {};
    for (const card of pool) {
      if (!card || typeof card.id !== 'string') throw new Error('card pool entries need a string id');
      out[card.id] = card;
    }
    return out;
  }
  return { ...pool };
}
