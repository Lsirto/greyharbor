/**
 * src/ui-v2/card-view.mjs — pure card component logic.
 *
 * This module never touches `document`.  It normalizes a fragment coming from
 * buildView() into display data: dual faces (reason / madness), printed and
 * current power, Chinese keyword labels, faction / type classes and the
 * sealed / corruption / equipment status markers.  The HTML itself lives in
 * templates/card.mjs.
 */

import { asObject, safeInt, safeNumber } from './utils.mjs';

/** §6 关键词中文名与英文 id 的对应（引擎 view 使用英文 id）。 */
export const KEYWORDS_ZH = Object.freeze({
  stealth: '隐秘',
  seal: '封印',
  chain: '连锁',
  backlash: '理智反噬',
  corruption: '腐化',
  sacrifice: '献祭',
});

/** §5 卡牌类型。 */
export const TYPES_ZH = Object.freeze({
  unit: '单位',
  oldgod: '旧神',
  event: '事件',
  ritual: '仪式',
  equipment: '装备',
  location: '地点',
  environment: '环境',
  leader: '领袖',
});

export const FACTIONS_ZH = Object.freeze({
  society: '学会',
  cult: '教团',
  neutral: '中立',
});

export const FACES_ZH = Object.freeze({
  reason: '理性面',
  madness: '疯狂面',
});

export const LOCATIONS_ZH = Object.freeze({
  scene: '现场',
  archive: '档案',
  dream: '梦境',
});

export const LOCATION_ORDER = Object.freeze(['scene', 'archive', 'dream']);
export const LOCATION_CAPACITY_FALLBACK = Object.freeze({ scene: 5, archive: 5, dream: 3 });

const UNIT_TYPES = new Set(['unit', 'oldgod']);
const KNOWN_FACTIONS = new Set(['society', 'cult', 'neutral']);
const KNOWN_TYPES = new Set(Object.keys(TYPES_ZH));
const SIZES = new Set(['xs', 'sm', 'board', 'env', 'hand', 'leader']);

function cleanString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Normalize any (possibly broken) buildView card fragment.
 * A face-down / hidden fragment is deliberately reduced to a *back* descriptor:
 * name, uid, power, keywords and status are dropped so nothing can leak.
 */
export function normalizeCardView(raw, options = {}) {
  const card = asObject(raw);
  const hidden = card.hidden === true || card.faceDown === true;
  const face = card.face === 'madness' ? 'madness' : 'reason';
  const rawType = cleanString(card.type).toLowerCase();
  const rawFaction = cleanString(card.faction).toLowerCase();
  const type = KNOWN_TYPES.has(rawType) ? rawType : UNIT_TYPES.has(rawType) ? rawType : 'unit';
  const faction = KNOWN_FACTIONS.has(rawFaction) ? rawFaction : 'neutral';
  const slot = Number.isInteger(card.slot) ? card.slot : null;
  const rawEquipment = asObject(card.equipment);
  const equipmentName = cleanString(rawEquipment.nameZh)
    || cleanString(rawEquipment.name)
    || cleanString(rawEquipment.cardId);
  const rawChaos = asObject(card.chaos);
  const chaos = !hidden && rawChaos.id && Number.isFinite(rawChaos.modifier)
    ? { id: cleanString(rawChaos.id), modifier: safeInt(rawChaos.modifier, 0) }
    : null;

  return {
    hidden,
    face,
    type,
    faction,
    uid: hidden ? '' : cleanString(card.uid),
    cardId: hidden ? '' : cleanString(card.cardId),
    name: hidden ? '' : cleanString(card.name),
    nameZh: hidden ? '' : cleanString(card.nameZh),
    cardLocation: hidden ? '' : cleanString(card.cardLocation),
    boardLocation: hidden ? '' : cleanString(card.boardLocation),
    slot: hidden ? null : slot,
    power: hidden ? 0 : safeNumber(card.power, 0),
    reasonPower: hidden ? null : (card.reasonPower == null ? null : safeNumber(card.reasonPower, 0)),
    madnessPower: hidden ? null : (card.madnessPower == null ? null : safeNumber(card.madnessPower, 0)),
    sanityCost: hidden ? 0 : Math.max(0, safeInt(card.sanityCost, 0)),
    keywords: hidden ? [] : (Array.isArray(card.keywords) ? card.keywords.filter((k) => typeof k === 'string') : []),
    sealed: !hidden && card.sealed === true,
    corruption: hidden ? 0 : Math.max(0, safeInt(card.corruption, 0)),
    corruptionLoss: hidden ? 0 : Math.max(0, safeInt(card.corruptionLoss, 0)),
    permanentPower: hidden ? 0 : safeInt(card.permanentPower, 0),
    thisNightPower: hidden ? 0 : safeInt(card.thisNightPower, 0),
    equipment: hidden || !equipmentName ? null : { name: equipmentName },
    chaos,
    size: SIZES.has(options.size) ? options.size : 'board',
  };
}

export function isHiddenCard(card) {
  return normalizeCardView(card).hidden;
}

export function isUnitType(type) {
  return UNIT_TYPES.has(cleanString(type).toLowerCase());
}

/** Current (engine-calculated) power.  Hidden cards always read 0. */
export function displayPower(card) {
  const view = normalizeCardView(card);
  return isUnitType(view.type) ? view.power : 0;
}

/** Printed power for one face; falls back to the other face when absent. */
export function printedPowerForFace(card, face) {
  const view = normalizeCardView(card);
  const value = face === 'madness'
    ? (view.madnessPower ?? view.reasonPower)
    : (view.reasonPower ?? view.madnessPower);
  return value == null ? null : value;
}

export function typeLabel(card) {
  const view = normalizeCardView(card);
  return TYPES_ZH[view.type] ?? view.type;
}

export function factionLabel(card) {
  const view = normalizeCardView(card);
  return FACTIONS_ZH[view.faction] ?? view.faction;
}

export function faceLabel(card) {
  return FACES_ZH[normalizeCardView(card).face] ?? '';
}

/** Keywords rendered as Chinese badges, preserving unknown ids verbatim. */
export function keywordBadges(card) {
  const view = normalizeCardView(card);
  const seen = new Set();
  const out = [];
  for (const id of view.keywords) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label: KEYWORDS_ZH[id] ?? id });
  }
  return out;
}

/** Sealed / corruption / equipment / modifiers shown as small status chips. */
export function statusBadges(card) {
  const view = normalizeCardView(card);
  const out = [];
  if (view.hidden) return out;
  if (view.sealed) out.push({ id: 'sealed', icon: 'seal', label: '封印' });
  if (view.corruption > 0) {
    const loss = view.corruptionLoss > 0 ? ` −${view.corruptionLoss}` : '';
    out.push({ id: 'corruption', icon: 'corruption', label: `腐化 ×${view.corruption}${loss}` });
  }
  if (view.equipment) out.push({ id: 'equipment', icon: 'equipment', label: `装备·${view.equipment.name}` });
  if (view.chaos) {
    const mod = view.chaos.modifier;
    const sign = mod > 0 ? `+${mod}` : `${mod}`;
    out.push({ id: 'chaos', icon: 'moon', label: `代币 ${sign}` });
  }
  if (view.permanentPower > 0) out.push({ id: 'permanent', icon: 'plus', label: `永久 +${view.permanentPower}` });
  if (view.thisNightPower !== 0) {
    out.push({
      id: 'night',
      icon: view.thisNightPower > 0 ? 'plus' : 'minus',
      label: `本夜 ${view.thisNightPower > 0 ? '+' : ''}${view.thisNightPower}`,
    });
  }
  return out;
}

/** Deterministic class list for the card element. */
export function cardClasses(card, options = {}) {
  const view = normalizeCardView(card, options);
  const size = SIZES.has(options.size) ? options.size : view.size;
  const classes = [
    'gh2-card',
    `gh2-card--size-${size}`,
    `gh2-card--type-${view.type}`,
    `gh2-card--faction-${view.faction}`,
    `gh2-card--face-${view.face}`,
  ];
  if (view.hidden) {
    classes.push('gh2-card--hidden', 'gh2-card--back');
  } else {
    classes.push('gh2-card--front');
    if (view.sealed) classes.push('is-sealed');
    if (view.corruption > 0) classes.push('is-corrupted');
    if (view.equipment) classes.push('is-equipped');
  }
  return classes;
}

/** Card-like view used by the leader zone (buildView leader has no power fields). */
export function leaderAsCard(leader) {
  const data = asObject(leader);
  return {
    uid: '',
    cardId: data.cardId ?? data.leaderId ?? '',
    nameZh: cleanString(data.nameZh, '未知领袖'),
    name: cleanString(data.name),
    faction: cleanString(data.faction, 'neutral'),
    type: 'leader',
    face: 'reason',
    faceDown: false,
    power: 0,
    reasonPower: null,
    madnessPower: null,
    keywords: [],
    sanityCost: 0,
    sealed: data.sealed === true,
  };
}
