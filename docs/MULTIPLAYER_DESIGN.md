# 多人对战设计 · MULTIPLAYER DESIGN

> 状态：**接口与协议层已落地并通过无头测试，真实网络通道待接入。**
> 本文档记录《灰港夜谭》从单机人机对战扩展到真人在线对战的架构决策。

## 1. 目标与范围

把单局牌局从“人类 vs 本地 AI”扩展为“人类 vs 真人”，同时不破坏现有纯静态、零运行时依赖、确定性的工程基线。

分两阶段交付：

| 阶段 | 内容 | 状态 |
|---|---|---|
| 阶段一（本次） | 可插拔座位驱动、与传输无关的线协议、确定性锁步会话、内存假传输测试、大厅占位 | 已完成 |
| 阶段二（后续） | 接入 WebSocket 中转、握手/房间号、断线重连、匹配，打通真实双人对局 | 待开始 |

阶段一不引入任何后端或外部依赖，所有新代码可在 Node 中用注入式假传输完整测试。

## 2. 为什么选择确定性锁步

引擎本身满足锁步（deterministic lockstep）的前提条件：

1. **完全确定性**：所有随机数走注入式 rng（`src/engine/rng.js`，mulberry32），引擎内无 `Math.random`；相同种子 + 相同动作序列必然得到相同结果。
2. **座位对称**：`engine.viewFor(seat)` 对任意座位给出合法动作，`engine.apply(action)` 统一提交；人类与 AI 只是动作来源不同。
3. **动作即意图**：一回合的决策是一个可序列化的纯数据对象，体积小、字段固定。

因此双方**只交换初始配置（种子/牌组）与动作意图，从不同步整个局面**：各自本地运行同一引擎，按相同顺序应用相同动作，结果天然一致。这也让断线重连只需补传缺失动作，而不必传输完整状态。

## 3. 模块结构

```
src/multiplayer/
├─ protocol.mjs       线协议：信封/版本、消息工厂、编解码与校验、动作规则字段裁剪
├─ transport.mjs      传输契约 + createMemoryTransportPair（内存双通道，测试用）
├─ seat-drivers.mjs   可插拔驱动：deferred / scripted / ai / remote
└─ lockstep.mjs       createLockstepMatch（编排器）+ createNetworkClient（双端接线）
tests/multiplayer/
├─ protocol.test.mjs  协议编解码与错误分支（5 项）
└─ lockstep.test.mjs  锁步/网络客户端/非法动作/认输（6 项）
```

## 4. 座位驱动接口

编排器不关心某座位如何决策，只调用：

```js
const action = await driver.requestAction({ seat, view, actions });
```

四种实现：

| 驱动 | 动作来源 | 用途 |
|---|---|---|
| `deferred` | 外部 `submit(action)` 兑现 | 真实 UI 中的本地人类，DOM 点击后提交 |
| `scripted` | `(view, seat) => action` 纯函数 | 无头确定性测试 |
| `ai` | 包装现有 `chooseAction` | 复用评估型 AI |
| `remote` | 等待并缓冲对端帧 | 真人对手 |

`remote` 驱动维护**入站队列**：网络帧可能在消费者重新订阅前到达，先入队、按序消费，避免早期帧被丢弃。

## 5. 线协议

每条消息是一个 JSON 信封：

```json
{ "v": 1, "t": "<type>", "...": "..." }
```

| 类型 `t` | 含义 |
|---|---|
| `hello` / `welcome` | 客户端自我介绍 / 服务端分配座位与房间 |
| `start` | 下发对局配置（种子、牌组等），引导双方构建一致引擎 |
| `action` | 一回合动作（`s` 座位、`a` 动作） |
| `resign` | 认输 |
| `ping` / `pong` | 保活与往返时延 |
| `error` | 协议/校验错误 |

- `PROTOCOL_VERSION` 随信封下发，版本不匹配直接拒绝，便于以后演进。
- 动作序列化时移除 `label` 等纯展示字段，只保留规则字段；解码后必须含字符串 `type`。
- 所有解码错误抛出 `ProtocolError`，携带机器可读 `code`（`bad-frame`、`version-mismatch`、`illegal-action`、`wrong-seat`、`peer-resigned` 等）。

## 6. 合法性校验与防作弊

编排器在 `engine.apply` 前调用 `resolveLegalAction(legalActions, returned)`：

1. 若返回值就是本地合法动作列表中的对象，直接使用；
2. 若是解码后的纯对象，用 `action-matcher` 做严格结构匹配，**唯一命中**才采纳；
3. 匹配不到或存在歧义（命中 0 或多个）一律抛出 `illegal-action`，动作不会进入引擎。

因此对端篡改、过期重放或字段不符的动作都无法影响本地状态。引擎本身的 `apply` 也会再次返回 `{ok,error}`，形成双重校验。

## 7. 传输通道：WebSocket 中转

阶段二采用 **WebSocket 房间制中转服务器**，而非 WebRTC 点对点：

- 回合制卡牌对延迟/带宽不敏感，P2P 的优势用不上；
- WebRTC 仍需一个 WebSocket 信令服务器，并额外处理 NAT 穿透、ICE/TURN、重连，复杂度更高；
- WebSocket 走 443，穿透性好，结构简单，且便于以后加入权威校验、匹配、观战。

中转服务只负责在房间内转发帧（约百行规模），客户端保持静态托管，服务端可部署在支持常驻连接的平台。传输接口已抽象，未来切换 WebRTC 仅需替换实现，上层协议与编排不变。

## 8. 后续工作

- 握手与房间号：`hello/welcome/start` 端到端流程，房间号生成与校验。
- 断线重连：基于动作序号补传缺失帧，必要时再做一次状态快照兜底。
- 匹配与房间管理：好友房、快速匹配、超时托管。
- 可选权威服务器：服务端持有一份引擎做最终仲裁，进一步防作弊。
- 观战与回放：确定性引擎天然支持按动作序列回放。
