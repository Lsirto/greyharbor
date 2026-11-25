# 灰港三夜 · THREE NIGHTS IN GREYHARBOR

> 原创设定：雾锁的灰港，三夜牌局。学会（Society）与教团（Cult）在灯火与深渊之间轮番落子；
> 理智耗尽者坠入疯狂，先赢两夜者带走港口。双面卡牌在「理 / 狂」之间翻转，封印、腐化、献祭与
> 地点结算共同构成一套**独立于《昆特牌》规则的原创玩法**。

**《灰港三夜》是本项目的新版正式入口（`index.html`）。** 旧版《昆特牌》网页复刻完整保留在
`gwent.html`，作为参考实现与遗留套件，不参与新版规则。

## 技术栈

- 原生 **ES Modules** + HTML + CSS，**零运行时依赖、零构建步骤、零外部资源**。
- 测试只用 Node 内置 `node:test` / `node:assert`，浏览器侧无 jsdom、无 Playwright 运行依赖。
- 引擎确定性：所有随机走注入式 rng，无 `Math.random`；卡面插画为内联 SVG，音效为 WebAudio 实时合成。
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
src/
├─ engine/v2/       新版规则引擎：确定性状态机、效果 DSL、buildView、计分
├─ ai/v2/           新版 AI（合法动作 + 启发式评估，注入式随机）
├─ data/            卡表 / 领袖 / 阵营 / 预设牌组（唯一数值事实源）
├─ ui-v2/           新版 UI
│  ├─ menu/         app shell、菜单 / 阵营 / 结果模板
│  ├─ templates/    纯字符串模板（data-uid / data-card-id / data-faction）
│  ├─ fx/           view-diff、DOM 动画、粒子池、fx-controller
│  ├─ audio/        WebAudio 合成引擎与事件→音色映射
│  └─ shims/        浏览器侧 node:fs 兼容层
├─ styles-v2/       theme / card / board / interaction / menu / screens / fx
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

## 氛围层（阶段 3.4）

- `fx/view-diff.mjs` 纯函数比较前后 `buildView`：入场 uid、理↔狂翻面、理智变化、新封印/腐化、夜切换、终局。
- `fx/dom-animations.mjs` 只加临时 CSS 类，带超时清理与异常兜底，不阻塞交互。
- `fx/particles.mjs` 单 rAF + ≤300 固定粒子池的全屏 canvas；页面隐藏暂停，禁用时零发射，确定性 rng。
- `fx/fx-controller.mjs` 经 `hooks.afterPaint` / `hooks.onEvents` 接入控制器，不写游戏状态。
- `audio/audio-engine.mjs` 零音频资源、主音量/静音、首次手势 unlock、峰值压缩；`audio/sound-map.mjs` 纯映射事件→音色。

## 测试

```bash
npm test                                            # 旧版遗留套件：106 项（104 通过 / 2 E2E 默认跳过）
node --test 'tests/v2/*.test.mjs' 'tests/ai-v2/*.test.mjs'   # 新版引擎 / AI：92 项
node --test 'tests/ui-v2/*.test.mjs'                # 新版 UI + 氛围层
node --test 'tests/**/*.test.mjs'                   # 全量（含新增项）
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

本阶段**未改动** `src/engine`、`src/ai`、`src/data`、卡面数值与规则；氛围层只读 `buildView` 与事件流。

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
