# 像素扩展包 01

新增 14 张 PNG，位于 [`assets/pixel/expansion-01/`](../assets/pixel/expansion-01/)，可在 [`pixel-expansion.html`](pixel-expansion.html) 预览。原插画版 8 张、原像素版 9 张均保留，未覆盖。

| 类别 | 文件 | 内容 |
| --- | --- | --- |
| 场景 | `lobby.png` | 公司大堂 |
| 场景 | `elevator.png` | 夜间电梯间 |
| 场景 | `manager-office.png` | 主管办公室 |
| 场景 | `stairwell.png` | 消防楼梯 |
| 场景 | `rooftop.png` | 天台 |
| 人物 | `npc-chibi.png` | 前台、IT、HR、夜班保安，四位 Q 版配角 |
| 人物 | `lin-expressions.png` | 林棠八种表情 |
| 人物 | `zhou-expressions.png` | 周主管八种表情 |
| 人物 | `chen-expressions.png` | 陈序八种表情 |
| 物件 | `furniture.png` | 八件办公室家具 |
| 线索 | `evidence.png` | 八件剧情证物 |
| 界面 | `ui-icons.png` | 十二枚功能图标 |
| 特效 | `effects.png` | 八种异常提示与效果 |
| 界面 | `computer-screens.png` | 员工目录、监控、门禁日志、损坏的恢复界面 |

## 生成提示词

使用内置 ImageGen。共同风格要求：**TRUE 16-bit pixel art, chunky hard square pixels, limited navy teal amber palette, crisp readable silhouettes, no painterly strokes, no smooth gradients, no anti-aliasing, no readable text, no watermark**。

1. `lobby.png` — Empty corporate lobby after work; reception desk, turnstiles, visitor sofa, plants, twilight glass entrance, abandoned badge.
2. `elevator.png` — Night elevator lobby; three elevator doors, one slightly ajar with red light, wall clock, fire cabinet.
3. `manager-office.png` — Empty supervisor office at night; large desk, visitor chairs, filing cabinet, blinds, city lights, glowing locked drawer.
4. `stairwell.png` — Concrete emergency stairwell at night; steel stairs, landing, red emergency lamp, exit door, long shadows.
5. `rooftop.png` — Office rooftop at blue hour; safety fence, HVAC units, city skyline, sunset, one empty chair.
6. `npc-chibi.png` — Four separate full-body front-facing chibi NPCs, head 40% of total height: cheerful receptionist, tired IT technician, stern HR woman, older night guard; transparent background.
7. `lin-expressions.png` — Eight consistent Lin Tang chibi busts in a 2 × 4 grid: neutral, smile, suspicious, worried, surprised, angry, exhausted, blank stare; transparent background.
8. `furniture.png` — Eight isolated office objects in a 2 × 4 grid: desk, chair, filing cabinet, plant, water dispenser, vending machine, bulletin board, floor lamp; transparent background.
9. `evidence.png` — Eight isolated clues in a 2 × 4 grid: torn photo, access log, cracked phone, cassette, personnel folder, clock hand, CCTV still, brass key; transparent background.
10. `ui-icons.png` — Twelve simple game UI icons in a 3 × 4 grid: dialogue, investigation, trust, memory, clock, locked door, save, settings, backpack, map, evidence, exit; transparent background.
11. `zhou-expressions.png` — Eight consistent Zhou supervisor chibi busts: polite smile, neutral, skeptical, irritated, surprised, angry, frightened, unnaturally blank; transparent background.
12. `chen-expressions.png` — Eight consistent ghostly Chen Xu chibi busts: neutral, faint smile, confused, worried, shocked, pleading, exhausted, glitching; transparent background.
13. `effects.png` — Eight pixel VFX motifs: exclamation, question mark, alarm bell, light spark, warning pulse, memory fragments, disappearance pixels, impact starburst; transparent background.
14. `computer-screens.png` — Four rectangular terminal views: redacted employee directory, empty-office CCTV, anomalous access log, corrupted file recovery; transparent background.

这些是可选择的视觉素材，尚未制作固定像素网格的精确切片或逐帧动画。对实际游戏开发，建议选定角色和场景后再统一网格、清理边缘、补动作帧。
