/**
 * Greyharbor v2.4 — pure, reusable deck validator for the v1 preset format.
 *
 * ── 规则说明（供未来 UI 组牌器复用；事实源 docs/GREYHARBOR_RULES_V1.md） ──
 * §2.1  牌组规模：20 张 = 1 张领袖（场外）+ 19 张非领袖（牌堆）。起手 8 张
 *       只从 19 张非领袖中抽；领袖不进手牌。
 * §2.2  预设份数：领袖恰好 1 张；每张非领袖卡最多 2 份；只能用本阵营卡 +
 *       neutral 中立卡。`card-table` 的 `copies` 是收藏字段，预设份数不套用它。
 * §10   两套官方预设（society / cult）均按上述规则组装，各 20 张。
 *
 * 输入形式（两种等价，同时存在时以 entries 为准）：
 *   { faction, leader, entries: [[id, count], ...] }   // 计数对
 *   { faction, leader, cards:   [id, id, ...] }        // 已展开，每张算 1 份
 *
 * 输出：{ ok, errors, summary }
 *   errors  -> [{ code, message, cardId? }]；坏数据全部进 errors，不抛业务异常。
 *   summary -> { faction, leader, total, leaderCount, nonLeaderCount,
 *                distinctNonLeaders, copies }；始终给出可解析到的数字。
 *
 * 契约：纯函数；不修改 input/cardIndex；无 DOM；无外部依赖；结果确定。
 *       只有程序员级错误才抛（cardIndex 不是对象时抛 TypeError）。
 *       错误码常量见 DECK_ERROR_CODES，便于 UI 做语义化提示。
 */

export const DECK_ERROR_CODES = Object.freeze({
  MALFORMED_INPUT: 'MALFORMED_INPUT',
  UNKNOWN_CARD: 'UNKNOWN_CARD',
  FACTION_MISMATCH: 'FACTION_MISMATCH',
  LEADER_INVALID: 'LEADER_INVALID',
  LEADER_IN_ENTRIES: 'LEADER_IN_ENTRIES',
  NON_LEADER_COUNT: 'NON_LEADER_COUNT',
  COPY_LIMIT: 'COPY_LIMIT',
  TOTAL_COUNT: 'TOTAL_COUNT',
});

/** Alias for callers that prefer the shorter name. */
export const ERROR_CODES = DECK_ERROR_CODES;

/** Stable iteration order, handy for UI error rendering / coverage checks. */
export const DECK_ERROR_CODE_LIST = Object.freeze(Object.values(DECK_ERROR_CODES));

/** The v1 preset numbers, kept here so validators and UI share one source. */
export const DECK_RULES = Object.freeze({
  total: 20,
  leaderCount: 1,
  nonLeaderCount: 19,
  maxCopies: 2,
  factions: Object.freeze(['society', 'cult']),
  neutralFaction: 'neutral',
  leaderType: 'leader',
});

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function emptySummary() {
  return Object.freeze({
    faction: null,
    leader: null,
    total: 0,
    leaderCount: 0,
    nonLeaderCount: 0,
    distinctNonLeaders: 0,
    copies: Object.freeze({}),
  });
}

/** Convert either accepted input form into a fresh list of { id, count }. */
function normalizePairs(input, errors) {
  const { MALFORMED_INPUT } = DECK_ERROR_CODES;
  const fromCards = !hasOwn(input, 'entries') && hasOwn(input, 'cards');
  const source = fromCards ? input.cards : input.entries;

  if (!Array.isArray(source)) {
    errors.push({
      code: MALFORMED_INPUT,
      message: `deck ${fromCards ? 'cards' : 'entries'} must be an array`,
    });
    return [];
  }

  const pairs = [];
  source.forEach((value, index) => {
    if (fromCards) {
      if (typeof value !== 'string' || value.length === 0) {
        errors.push({
          code: MALFORMED_INPUT,
          message: `cards[${index}] must be a non-empty card id string`,
        });
        return;
      }
      pairs.push({ id: value, count: 1 });
      return;
    }

    if (!Array.isArray(value) || value.length !== 2
        || typeof value[0] !== 'string' || value[0].length === 0) {
      errors.push({
        code: MALFORMED_INPUT,
        message: `entries[${index}] must be [cardId, count]`,
      });
      return;
    }
    const count = value[1];
    if (!Number.isInteger(count) || count <= 0) {
      errors.push({
        code: MALFORMED_INPUT,
        message: `entries[${index}] (${value[0]}) has invalid count ${String(count)}`,
        cardId: value[0],
      });
      return;
    }
    pairs.push({ id: value[0], count });
  });
  return pairs;
}

/**
 * Validate a v1-style deck.
 *
 * @param {{ faction: string, leader: string,
 *           entries?: Array<[string, number]>, cards?: string[] }} input
 * @param {Record<string, { faction: string, type: string }>} cardIndex
 * @returns {{ ok: boolean,
 *             errors: Array<{ code: string, message: string, cardId?: string }>,
 *             summary: object }}
 */
export function validateDeck(input, cardIndex) {
  if (cardIndex === null || typeof cardIndex !== 'object') {
    throw new TypeError('validateDeck requires a card index object as its second argument');
  }

  const codes = DECK_ERROR_CODES;
  const errors = [];

  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    errors.push({ code: codes.MALFORMED_INPUT, message: 'deck input must be an object' });
    return { ok: false, errors, summary: emptySummary() };
  }

  const faction = typeof input.faction === 'string' ? input.faction : null;
  const leader = typeof input.leader === 'string' && input.leader.length > 0
    ? input.leader
    : null;
  if (faction === null) {
    errors.push({ code: codes.MALFORMED_INPUT, message: 'deck input needs a faction string' });
  }

  // Never read from a mutated input: build our own fresh structures.
  const pairs = normalizePairs(input, errors);
  const counts = Object.create(null);
  for (const { id, count } of pairs) {
    counts[id] = (counts[id] ?? 0) + count;
  }
  const ids = Object.keys(counts);
  const lookup = (id) => (hasOwn(cardIndex, id) ? cardIndex[id] : undefined);

  // Unknown ids and out-of-faction non-leaders (leader-type entries reported below).
  for (const id of ids) {
    const card = lookup(id);
    if (!card || typeof card !== 'object') {
      errors.push({ code: codes.UNKNOWN_CARD, message: `unknown card ${id}`, cardId: id });
      continue;
    }
    if (card.type === DECK_RULES.leaderType) continue;
    if (faction !== null
        && card.faction !== faction
        && card.faction !== DECK_RULES.neutralFaction) {
      errors.push({
        code: codes.FACTION_MISMATCH,
        message: `card ${id} belongs to ${card.faction}, not ${faction} or neutral`,
        cardId: id,
      });
    }
  }

  // Leader slot: exactly one, of the right type and faction.
  if (leader === null) {
    errors.push({ code: codes.LEADER_INVALID, message: 'deck is missing a leader' });
  } else {
    const card = lookup(leader);
    if (!card || typeof card !== 'object') {
      errors.push({
        code: codes.LEADER_INVALID,
        message: `unknown leader ${leader}`,
        cardId: leader,
      });
    } else if (card.type !== DECK_RULES.leaderType) {
      errors.push({
        code: codes.LEADER_INVALID,
        message: `${leader} is not a leader card`,
        cardId: leader,
      });
    } else if (card.faction !== faction) {
      errors.push({
        code: codes.LEADER_INVALID,
        message: `leader ${leader} belongs to ${card.faction}, deck faction is ${faction}`,
        cardId: leader,
      });
    }
  }

  // A leader card smuggled into the 19-card non-leader area.
  for (const id of ids) {
    const card = lookup(id);
    if (card && typeof card === 'object' && card.type === DECK_RULES.leaderType) {
      errors.push({
        code: codes.LEADER_IN_ENTRIES,
        message: `leader ${id} must not appear in the non-leader entries`,
        cardId: id,
      });
    }
  }

  // Preset copy cap (independent of the collection `copies` field).
  for (const id of ids) {
    if (counts[id] > DECK_RULES.maxCopies) {
      errors.push({
        code: codes.COPY_LIMIT,
        message: `card ${id} has ${counts[id]} copies (max ${DECK_RULES.maxCopies})`,
        cardId: id,
      });
    }
  }

  const nonLeaderCount = ids.reduce((sum, id) => sum + counts[id], 0);
  const leaderCount = leader === null ? 0 : 1;
  const total = nonLeaderCount + leaderCount;
  if (nonLeaderCount !== DECK_RULES.nonLeaderCount) {
    errors.push({
      code: codes.NON_LEADER_COUNT,
      message: `deck must contain exactly ${DECK_RULES.nonLeaderCount} non-leader cards, got ${nonLeaderCount}`,
    });
  }
  if (total !== DECK_RULES.total) {
    errors.push({
      code: codes.TOTAL_COUNT,
      message: `deck must contain exactly ${DECK_RULES.total} cards including the leader, got ${total}`,
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      faction,
      leader,
      total,
      leaderCount,
      nonLeaderCount,
      distinctNonLeaders: ids.length,
      copies: { ...counts },
    },
  };
}
