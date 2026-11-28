# 战役 v3 设计：叙事事件 + Roguelike 战役（CAMPAIGN_V3）

> 本文档是战役模块的**唯一规则事实源**。单局《灰港夜谭》（`src/engine/v2`，三夜两胜 / 理智归零 /
> 线索末日双目标）的规则保持不变；战役是**架在单局之上的元层（meta-layer）**，负责把一系列
> 节点串成一次可重复的 Roguelike 调查之旅，并在节点之间让牌组与遗物成长。
>
> 纪律沿用：新代码独立目录（`src/campaign/`），不改动单局引擎的既有行为；纯数据 / 纯函数优先，
> 确定性随机，先测试后接 UI。叙事文案全部原创，不出现 Lovecraft 原作神名与受版权角色。

## 1. 范围与边界（v1 锁定）

一次 run（调查之旅）= 沿一张分层节点地图从起点推进到 Boss，途中经历战斗、叙事事件、休整与宝藏。

**纳入 v1：**

- 3 个 act（对应地图的三段），节点类型 6 种：`battle` / `elite` / `event` / `rest` / `treasure` / `boss`。
- 牌组成长：战斗/事件后向牌组**加卡**，休整/事件可**移除卡**；起始牌组为阵营预设 19 张非领袖。
- 遗物（relic）系统：被动修正，部分作用于 run 层，部分翻译为单局 `createGame` 的既有配置。
- 单一货币 `supplies`（物资）：战斗获得，事件/休整消费。
- 确定性：给定 run seed，地图、事件随机结果、奖励池、各战斗种子全部可复现。

**不纳入 v1（明确排除，避免范围蔓延）：**

- 商店（shop）、卡牌升级/升星、跨 run 的永久 meta 进度、解锁系统、多结局分支。
- 不新增卡牌（复用现有 30 张），不新增单局美术；Boss 与精英通过**配置修正**制造难度，而非新规则。
- 不做组牌器：战役内的牌组改动只通过结构化奖励/事件操作发生。

## 2. 节点类型

| id | 含义 | 进入后行为 | 结算/奖励 |
|---|---|---|---|
| `battle` | 普通战斗 | 开一局完整单局对战 | 物资 + 卡牌奖励（3 选 1，可跳过） |
| `elite` | 精英战斗 | 带**负面配置**的单局（见 §7） | 更多物资 + 卡牌奖励 + 遗物（2 选 1） |
| `event` | 叙事事件 | 展示标题/正文 + 2–3 个选择 | 按选择的操作 DSL 改 run 状态 |
| `rest` | 休整点 | 二选一：移除一张牌 / 获得物资 | 无战斗 |
| `treasure` | 宝藏 | 直接获得遗物（2 选 1）+ 少量物资 | 遗物 |
| `boss` | 最终战斗 | 带最强负面配置的单局 | 胜利 → run `status='won'`；失败 → `status='lost'` |

**战斗失败（含精英/Boss）**：该次 run 立即 `status='lost'`，不进入奖励。v1 不做复活/重试。

## 3. 地图生成（纯函数，seeded）

- 地图由若干 **tier（层）** 组成，tier 0 为固定起点，最后一 tier 为固定 Boss；中间每个 tier 含
  2–4 个节点，节点带类型权重（战斗为主，事件/休整/精英/宝藏按层分布，Boss 前不出现休整）。
- 边（edge）只指向**下一 tier**：每个非末层节点至少 1 条出边，每个非首节点至少 1 条入边；
  生成后做连通性校验，保证所有节点可达、Boss 必可达。
- 玩家每个 tier 只能选择**当前节点有边相连**的一个下游节点，不可回退、不可跨层。
- 地图与 run 随机使用战役自己的 `rngState`（由 run seed 经 `hashSeed` 初始化），与单局 rng 分离。

## 4. run 状态形状

```js
{
  version: '3.0',
  seed: '<run seed>',
  faction: 'society' | 'cult',
  leaderId: '<preset leader id>',
  deck: ['<cardId>', ...],          // 起始 = 阵营预设 19 张；加/移除卡只改这里
  relics: ['<relicId>', ...],
  supplies: 0,
  status: 'active' | 'won' | 'lost',
  rngState: <uint32>,
  map: { tiers: [ [ {id, type, ...} ], ... ], edges: [ {from, to} ] },
  currentTier: 0,
  currentNodeId: '<node id>' | null,
  pending: null | { kind: 'battle' | 'event' | 'reward' | 'treasure' | 'rest', ... },
  log: [ { tier, nodeId, text } ],
}
```

- 单局 `resolveDeckSpec` 只要求卡 id 存在、领袖不在牌组中，**不强制 19 张**，因此战役牌组可增减。
- 加卡时遵守单局口径：提供奖励前过滤掉牌组内已达 2 份的卡（避免无意义地堆超 2 份）。

## 5. 遗物（relic）

遗物为纯数据：`{ id, nameZh, nameEn, flavor, scope: 'run' | 'battle', description, battle?: {...} }`。

- `scope:'run'`：由战役控制器直接处理（如额外物资、额外奖励选项、连通性预览）。
- `scope:'battle'`：在开战斗时由控制器**翻译为 `createGame` 的既有选项**（如 `firstPlayerCompensation`
  的额外换牌、`startingSanity`、`mechanics` 开关）。禁止为单张遗物在引擎里加特殊分支；若确有缺口，
  新增一个**通用、带测试的引擎配置项**，而不是遗物专属钩子。
- 同名遗物唯一，不重复获得。

## 6. 叙事事件与操作 DSL

事件纯数据：`{ id, title, flavor, choices: [{ label, condition?, operations: [...] }] }`。

- `condition`：`{ supplies?: n, relic?: id, card?: id }`，不满足则该选择不出现/不可选。
- `operations`（顺序执行，确定性；随机操作消费 run rng）：
  - `{ op: 'supplies', amount }`
  - `{ op: 'addCard', cardId }` 或 `{ op: 'addCard', pool: 'faction' }`（从合格池随机）
  - `{ op: 'removeCard', cardId? }`（缺省随机移除一张非领袖）
  - `{ op: 'addRelic', relicId }`
  - `{ op: 'random', outcomes: [{ weight, operations }] }`
- 所有文本在渲染层做 HTML 转义；数据层只返回结构化结果。

## 7. 精英 / Boss 的难度配置（不新增规则）

用 `createGame` 既有配置制造压力，而非新机制：

- `startingSanity` 下调（精英 5、Boss 4），配合遗物可抵消；
- `startingHand` 起手手牌下调（精英 7、Boss 6，对手恒 8）。为此引擎把
  `startingHand` 与 `startingSanity` 对齐为可接受双玩家数组的配置泛化，不新增规则；
- 单局 `seed` 由 run 确定性派生：`<run seed>#battle-<nodeId>`。

阶段 4 受控校准（固定基线牌组、同种子、只变节点类型，数据固化于
`docs/campaign-final-check.json`，300 组/类型）显示：单降理智对学会几乎无效
（每夜回血被动抵消，疯狂面反而略增胜率），故加入起手手牌杆这一对两阵营都
对称生效的资源劣势。最终通关率梯度（均仍可通关）：

| 节点 | 学会 Society | 教团 Cult |
| --- | --- | --- |
| 普通 battle | 50.67% | 49.33% |
| 精英 elite | 40.00% | 29.00% |
| Boss | 30.67% | 16.33% |

该数据为无成长基线口径；真实 run 中牌组加卡与遗物会把实际胜率抬高于此。

## 8. 分阶段计划

1. **阶段 1（纯数据 + 地图）**：`relics` / `events` 数据、地图生成纯函数、操作 DSL 数据；单元测试。
2. **阶段 2（run 状态机 + 战斗接入）**：进入节点、事件选择、战斗结算、奖励/遗物、遗物→单局配置翻译；
   全自动 run 自对弈浸泡（多 seed，0 崩溃、状态守恒）。
3. **阶段 3（战役 UI）**：地图 / 事件 / 奖励 / 遗物屏幕，接入 app-shell 路由与 CSS，浏览器一屏实测。
4. **阶段 4（平衡 + 收尾）**：全量测试、精英/Boss 胜率校准与数据固化、README、commit。

## 9. 验收标准

- 单局引擎既有测试与行为**零回归**；战役新增独立测试目录。
- 任意固定 run seed 下，整段 run（含所有战斗与随机事件）确定可复现；随机浸泡 0 崩溃、牌组/遗物状态守恒。
- 战役各屏幕在 514×676 与 1280×720 下一屏不滚动、无控制台报错。
- 普通/精英/Boss 战斗的通关率有可解释的梯度；奖励与事件操作均有测试覆盖。
