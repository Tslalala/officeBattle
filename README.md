# 职场神话（officeBattle）

大模型驱动的办公室文字游戏。三个版本共享一套引擎：

- **认真版 · 浮沉记** —— 升职加薪、勾心斗角，10 天季度考核定结局。
- **娱乐版 · 奇幻办公室** —— 领导宝可梦对战（PPT 暴龙…），热血搞笑。
- **惊悚版 · 请于下班前离开** —— 规则怪谈剧本（`horror.js`）：七条守则、五份证据、一条真正的出口。

## 快速开始

```
python serve.py            # 启动本地服务器（默认 http://127.0.0.1:8787）
python serve.py 9000       # 自定义端口
```

浏览器打开 `http://127.0.0.1:8787/game.html`。
`serve.py` 同时把 `/v1/*` 反代到内网大模型（Qwen），绕开浏览器跨域；完全离线时游戏自动降级为内置剧本，依然可完整通关。进度自动保存在浏览器 localStorage。

## 目录结构

```
officeBattle/
├── game.html            # 主游戏：三版本入口（认真/娱乐 + 惊悚版 UI）
├── horror.js            # 惊悚版《请于下班前离开》剧本模块（守则/证据/理智/逃生判定）
├── serve.py             # 静态托管 + 大模型反代（唯一启动入口）
├── README.md
├── assets/              # 全部像素美术素材（场景 / 人物表情 / 道具 / UI 图标）
│   ├── *.png            #   原插画与像素场景（office-day/night、hallway-title…）
│   ├── pixel/           #   像素版素材与 characters-20 六表情人物表
│   │   ├── expansion-01/ expansion-02/ weather-01/
│   └── characters-20/
├── prototype/           # 早期剧情原型（保留可玩）
│   ├── index.html       #   《请于下班前离开》5 分钟剧情原型（插画版）
│   └── pixel.html       #   像素版原型
├── docs/                # 美术素材清单、生成提示词、玩法文档
│   ├── GAME.md          #   玩法总说明（三版本机制 / 大模型接入 / UI 架构）
│   └── PIXEL_*.md 等
└── preview/             # 素材预览页（浏览器直接打开即可）
    ├── assets.html  pixel-assets.html  pixel-expansion.html
    ├── pixel-expansion-02.html  pixel-characters-20.html  weather-gallery.html
```

## 大模型接入

- 端点：`http://10.133.72.161:20133/v1/chat/completions`（vLLM），模型 `Qwen3.8-27B-BF16`，`enable_thinking:false`。
- 用途：随机事件生成（JSON）、NPC 人设对话、政治行动演播、对战解说、惊悚版自由输入意图解析。
- 所有调用带超时与降级：失败不阻塞游戏，仅右上角状态灯转红（离线内置模式）。
