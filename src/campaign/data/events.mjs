/**
 * src/campaign/data/events.mjs — pure narrative event definitions.
 *
 * Each event: { id, title, flavor, choices: [{ label, condition?, operations }] }.
 * Operations are resolved deterministically by the run state machine; random
 * operations consume the run's own rng.  No DOM, no engine imports.
 */

export const EVENTS = Object.freeze([
  {
    id: 'the-fogged-tavern',
    title: '雾中旅店',
    flavor: '旅店的窗户蒙上一层雾气。一个看不清脸的陌生人推过来一副旧牌，又拍了拍腰间的钱袋。',
    choices: [
      { label: '接过他的牌', operations: [{ op: 'addCard', pool: 'faction' }] },
      { label: '摸走他的钱袋', operations: [{ op: 'supplies', amount: 3 }] },
      { label: '转身离开', operations: [] },
    ],
  },
  {
    id: 'the-drowned-shrine',
    title: '溺水神龛',
    flavor: '潮水退去，礁石间露出一座挂满海藻的小神龛，龛前供着几件发亮的器物。',
    choices: [
      {
        label: '献上 3 物资，取走供品',
        condition: { supplies: 3 },
        operations: [{ op: 'supplies', amount: -3 }, { op: 'addRelic', pool: 'relic' }],
      },
      { label: '砸毁神龛，弃置一张牌', operations: [{ op: 'removeCard' }] },
      { label: '转身离开', operations: [] },
    ],
  },
  {
    id: 'the-night-market',
    title: '夜市',
    flavor: '灯笼下的摊贩只在午夜出现。他铺开一张写满名字的羊皮纸，朝你伸出手。',
    choices: [
      {
        label: '花 4 物资买下情报',
        condition: { supplies: 4 },
        operations: [{ op: 'supplies', amount: -4 }, { op: 'addCard', pool: 'faction' }],
      },
      { label: '卖掉多余的东西', operations: [{ op: 'supplies', amount: 2 }] },
      { label: '转身离开', operations: [] },
    ],
  },
  {
    id: 'the-whispering-crypt',
    title: '低语墓穴',
    flavor: '墓穴深处传来整齐的低语。下去或许能找到陪葬的古物，也可能把自己留在那里。',
    choices: [
      {
        label: '深入墓穴（听天由命）',
        operations: [{
          op: 'random',
          outcomes: [
            { weight: 1, operations: [{ op: 'addRelic', pool: 'relic' }] },
            { weight: 1, operations: [{ op: 'removeCard' }] },
          ],
        }],
      },
      { label: '封死墓穴', operations: [{ op: 'supplies', amount: 1 }] },
      { label: '转身离开', operations: [] },
    ],
  },
  {
    id: 'the-asylum-ward',
    title: '疯人院',
    flavor: '走廊尽头的病人在墙上反复画着同一个符号。护士说，他清醒时曾是个学者。',
    choices: [
      {
        label: '花 2 物资安抚他',
        condition: { supplies: 2 },
        operations: [{ op: 'supplies', amount: -2 }, { op: 'addCard', pool: 'faction' }],
      },
      { label: '记录他的证言', operations: [{ op: 'supplies', amount: 2 }] },
      { label: '转身离开', operations: [] },
    ],
  },
  {
    id: 'the-lighthouse-keeper',
    title: '灯塔守望人',
    flavor: '老守望人独自守着灯塔。他说今晚的海不太对劲，需要一个帮手，也愿意付报酬。',
    choices: [
      { label: '帮他守夜', operations: [{ op: 'addCard', pool: 'faction' }] },
      { label: '接受他的谢礼', operations: [{ op: 'supplies', amount: 3 }] },
      { label: '转身离开', operations: [] },
    ],
  },
]);

const EVENT_INDEX = Object.freeze(Object.fromEntries(EVENTS.map((event) => [event.id, event])));

export function getEvent(id) {
  return EVENT_INDEX[id] ?? null;
}

export default EVENTS;
