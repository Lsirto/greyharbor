# 灰港三夜 · THREE NIGHTS IN GREYHARBOR

> 原创设定：雾锁的灰港，三夜牌局。学会（Society）与教团（Cult）在灯火与深渊之间轮番落子；
> 理智耗尽者坠入疯狂，先赢两夜者带走港口，而学会追查线索求「真相大白」、教团累积末日召「旧神降临」。
> 双面卡牌在「理 / 狂」之间翻转，封印、腐化、献祭、地点结算与双目标竞速共同构成一套
> **独立于《昆特牌》规则的原创玩法**。

**《灰港三夜》是本项目的新版正式入口（`index.html`）。** 旧版《昆特牌》网页复刻完整保留在
`gwent.html`，作为参考实现与遗留套件，不参与新版规则。

## 技术栈

- 原生 **ES Modules** + HTML + CSS，**零运行时依赖、零构建步骤、零外部 CDN**。
- 测试只用 Node 内置 `node:test` / `node:assert`，浏览器侧无 jsdom、无 Playwright 运行依赖。
- 引擎确定性：所有随机走注入式 rng，无 `Math.random`；30 张卡面插画与背景为本地美术资源（`assets/`，加载失败自动降级为内联 SVG），音效为 WebAudio 实时合成。
- 对局界面为一屏式布局：对手、棋盘、手牌与操作台全部容纳在 `100dvh` 内，无需页面滚动。
- 静态服务器 `server.mjs` 仅用 Node 内置模块；默认监听 `127.0.0.1:8788`。

## 运行与入口

```bat
启动游戏.bat        :: 启动 server.mjs 并打开 http://127.0.0.1:8788/
```

或命令行：

```bash
npm start                        # node server.mjs → http://127.0.0.1:8788/
```

| 地址 | 内容 |
|---|---|
| `/` 或 `/index.html` | **v2 正式入口**：主菜单 → 阵营选择 → 人机对战（含氛围层） |
| `/app.html` | 同款 app shell（阶段 3.3 入口，保留兼容） |
| `/play.html` | 阶段 3.2 人机对战直入（固定种子） |
| `/game.html` | 阶段 3.1 自动棋盘演示 |
| `/gwent.html` | **旧版昆特牌**（原 `index.html`，路径相对引用保持可用） |

> 页面必须通过本地服务器打开（`file://` 下模块与 fetch 会被浏览器拦截）。

## 目录地图

```
index.html / app.html / play.html / game.html / gwent.html
server.mjs · 启动游戏.bat · README.md · LICENSE
assets/
├─ art/             30 张卡面插画（JPG，按 card-id 命名）
└─ bg/              页面背景图
src/
├─ engine/v2/       新版规则引擎：确定性状态机、效果 DSL、buildView、计分、anomalies、chaos-bag、objectives
├─ ai/v2/           新版 AI（合法动作 + 启发式评估，注入式随机）
├─ data/            卡表 / 领袖 / 阵营 / 预设牌组（唯一数值事实源）
├─ ui-v2/           新版 UI
│  ├─ menu/         app shell、菜单 / 阵营 / 结果模板
│  ├─ templates/    纯字符串模板（data-uid / data-card-id / data-faction）
│  ├─ fx/           view-diff、DOM 动画、粒子池、fx-controller
│  ├─ audio/        WebAudio 合成引擎与事件→音色映射
│  └─ shims/        浏览器侧 node:fs 兼容层
├─ styles-v2/       theme / card / board / layout / interaction / menu / screens / fx
├─ engine/, ai/, ui/, styles/   旧版昆特牌参考实现（保留，勿改）
└─ app.js / main.js 旧版入口（由 gwent.html 加载）
tests/
├─ v2/, ai-v2/      新版引擎 / AI 套件
├─ ui-v2/           新版 UI、控制器、氛围层套件（注入假对象，无外部依赖）
└─ *.test.mjs       旧版引擎 / 数据 / AI / E2E 遗留套件
scripts/            自对弈、实验台、消融、E2E 等工具（零外部依赖）
docs/               规则、架构、美术方向、平衡实验报告
research/           来源数据、QA 记录与审计产物
```

## 操作

- 主菜单选择「开始对局」→ 阵营 + 固定/随机种子 → 进入对局。
- 点击手牌 → 点击高亮落点出牌；可点击己方领袖、盖牌翻开、过牌；`Esc` 取消。
- 换牌阶段点击手牌标记，再点「确认换牌」。教团领袖伊莱亚斯会打开步骤式编排弹层。
- 操作台「♪ 音效 / ♪ 已静音」按钮切换声音；设置存 `localStorage`，首次用户手势才解锁音频。
- `prefers-reduced-motion: reduce` 时粒子关闭、翻面/脉冲降级为瞬时淡入；静音按钮可完全关闭声音。

## v1.3 新机制（动态地点 · 混沌袋 · 发掘）

规则事实源：`docs/EXPANSION_V1_DESIGN.md`。旧规则全部保留，三个机制均为增量，且可通过
`createGame({ mechanics: { anomaly, chaosBag } })` 单独开关。

1. **动态地点（地点异变）**：每夜开始随机抽取 1 个异变（共 12 个），作用于某一地点列或全局，
   提供战力修正、入场腐化/理智、免疫封印、领袖禁入、环境禁用等单一效果，让每夜的地点价值不同。
2. **混沌袋检定**：6 类共 19 枚代币（抽后放回）。明放单位入场、盖牌翻开时各抽 1 枚，按代币
   修正该实例战力（期望修正 ≈ 0，只增加波动）。平衡定稿移除了旧神之印原本的 −1 理智，仅保留 −3 战力。
3. **发掘（Discover）**：芬恩·卡洛威（出牌时）与露西娅·沃恩（翻开时）查看牌堆顶 3 张，选 1 张入手，
   其余原序放回；空牌堆为 no-op。玩家通过选择弹窗三选一，AI 按评估价值自动选择。

每个新机制都同步更新了 AI 启发式（`src/ai/v2/config.mjs`、`evaluate.mjs`）并新增专项测试
（`tests/v2/mechanics-v13.test.mjs`）。`scripts/balance-v13-ablation.mjs` 用机制开关做消融，
定稿 2000 局双向胜率 49.6–50.4%、理智结束占比 33–34%（与 v1.2 一致）、0 崩溃、牌数守恒。

## v1.4 双目标（线索 · 末日）

规则事实源：`docs/EXPANSION_V2_OBJECTIVES_DESIGN.md`。在「三夜两胜 / 理智归零」之外新增第三条
胜利路径，且两个阵营的目标类型与达成方式真正分化；可通过 `createGame({ mechanics: { objectives } })`
单独开关，与 v1.3 机制正交。

1. **学会 · 线索（Clue）**：己方单位明放进入档案列、以及夜结算时档案列战力严格高于对手，各积累线索。
2. **教团 · 末日（Doom）**：打出仪式卡（降灵会 / 潮汐仪式）、以及己方单位因献祭真正进入深渊（含吞噬），
   各积累末日。
3. 目标进度只增不减、全程公开，达到阈值（**定稿 7**）立即获胜，胜利原因 `reason='objective'`；
   学会结局「真相大白」、教团结局「旧神降临」。理智归零的判定始终优先于目标胜利。

玩家栏新增目标进度轨（`templates/objective.mjs`，线索古金 / 末日暗红菱形 pips，窄屏随玩家栏自适应隐藏），
结果面板按阵营显示对应结局文案，fx 层在增益时施加脉冲（`prefers-reduced-motion` 下降级）。AI 评估新增
目标竞速评分（`config.mjs`、`evaluate.mjs`），并在模拟出牌/献祭时同步进度。专项测试
`tests/v2/objectives-v14.test.mjs`（13 项）。阈值扫描显示存在明显悬崖（5→85.8%、7→31.5%、8→4.5% 的
目标结束占比），定稿阈值 7；`scripts/balance-objectives-final.mjs` 同种子 6400 局复核：交叉胜率
46.95–53.05%、目标结束约 28.5%、理智约 27%、夜胜约 44%，0 崩溃、牌数守恒。

## 氛围层（阶段 3.4）

- `fx/view-diff.mjs` 纯函数比较前后 `buildView`：入场 uid、理↔狂翻面、理智变化、新封印/腐化、夜切换、终局。
- `fx/dom-animations.mjs` 只加临时 CSS 类，带超时清理与异常兜底，不阻塞交互。
- `fx/particles.mjs` 单 rAF + ≤300 固定粒子池的全屏 canvas；页面隐藏暂停，禁用时零发射，确定性 rng。
- `fx/fx-controller.mjs` 经 `hooks.afterPaint` / `hooks.onEvents` 接入控制器，不写游戏状态。
- `audio/audio-engine.mjs` 零音频资源、主音量/静音、首次手势 unlock、峰值压缩；`audio/sound-map.mjs` 纯映射事件→音色。

## 测试

```bash
npm test                                            # 根目录遗留套件：104 通过 / 2 E2E 默认跳过
node --test 'tests/v2/*.test.mjs'                   # 引擎套件：117 项（v1.3 机制 19 项 + v1.4 目标 13 项）
node --test 'tests/ai-v2/*.test.mjs'                # AI 套件：7 项
node --test 'tests/ui-v2/*.test.mjs'                # UI + 氛围层：82 项
node --test 'tests/**/*.test.mjs'                   # 全量：310 通过 + 2 跳过
node scripts/e2e.mjs --mode=smoke                   # 可选：Playwright 浏览器冒烟
```

`npm test` 的脚本只匹配 `tests/*.test.mjs`；子目录套件需按上面的显式 glob 运行。
在 Windows PowerShell 中，npm 脚本里的单引号 glob 可能被原样传给 Node（导致匹配 0 项）；
此时请直接运行不带引号的 `node --test tests/*.test.mjs` 或上面的全量命令。
氛围层测试全部使用可注入的假 DOM / 假 AudioContext / 假调度器，不引入外部依赖。

## 数据驱动的平衡方法

平衡不靠拍脑袋：先用脚本采集，再消融定位，最后用同种子大样本复核。

1. **诊断 / 实验台**：`scripts/balance-diagnose.mjs`、`scripts/balance-experiment.mjs` 采集镜像对局、
   交叉基线、逐卡打出率与入场有效战力（例：`--games=1000 --seed=balance-v1.2`）。
2. **消融**：`scripts/balance-ablation.mjs` 把目标卡替换为同类型空白卡、或把阵营被动置 0，
   同种子重打，用 `Δpp` 量化单卡/被动的真实贡献。
3. **候选矩阵**：`scripts/balance-candidates.mjs` 同时跑 crossAB / crossBA / 两个镜像方向，
   避免只调一个座位导致假平衡。
4. **定稿口径**：`scripts/balance-final-check.mjs` 用 shipped defaults 跑 **同种子 2000 局**，
   要求双方胜率落入 45–55%、镜像接近 50%、理智结束占比 ≥10%、卡牌/实例守恒 ok，且既有测试全绿。
5. 实验期数值通过临时 `cardOverrides` / `ruleOverrides` 注入；定稿后钩子移除，数值只存在于
   `src/data/card-table.normalized.json` 与引擎常量（单一事实源）。详见 `docs/BALANCE_PATCH_V1.1.md` /
   `docs/BALANCE_PATCH_V1.2.md` 与 `docs/v12-*.json`。

氛围层（阶段 3.4）**未改动** `src/engine`、`src/ai`、`src/data`、卡面数值与规则，只读 `buildView` 与事件流；
其后的 v1.3 在引擎与 AI 上增量接入三个新机制，v1.4 再增量加入线索/末日双目标（均见上节）。

## 来源致谢与许可

- 旧版 `gwent.html` 及其引擎/UI/测试源自社区项目 **gwent-web**（原仓库入口 `index.html`），
  用于复刻《巫师 3：狂猎》昆特牌的规则研究与参考实现。感谢该项目与相关社区数据整理者。
- 《巫师》系列、昆特牌的商标、角色与卡牌名称版权归 **CD PROJEKT RED** 所有；本项目为
  **非官方粉丝作品**，与官方无关联，不含官方美术/音频资源。
- 新版《灰港三夜》的规则、设定、文案、卡面程序化图形与音效均为本项目原创实现。
- 代码以 [MIT License](LICENSE) 开源（Copyright © 2026 William XIAO）；第三方参考数据的
  原始副本位于 `research/`，仅作审计与溯源用途。

## 已知限制

- 仅支持单机对 AI，没有联机、账号或战绩系统。
- AI 是启发式评估，不做深度搜索。
- 浏览器自动播放策略要求首次点击/按键后才会有声音；`file://` 直接打开不可用。
- 粒子仅用于四类关键反馈（理智归零 / 腐化 / 封印 / 出牌），非全屏天气系统。
