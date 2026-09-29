# 像素版素材说明

像素版试玩是 [`prototype/pixel.html`](../prototype/pixel.html)，保留了原试玩的剧情与选项，独立使用 `assets/pixel/` 下的素材。原插画版仍是 [`prototype/index.html`](../prototype/index.html)。所有图片使用内置 ImageGen 生成，整张原始 PNG 保留，人物与道具图带透明通道。

| 文件 | 用途 |
| --- | --- |
| `office-day.png` | 17:42 办公室 |
| `office-night.png` | 18:00 办公室 |
| `hallway-title.png` | 标题画面 |
| `characters.png` | 原比例立绘：林棠、周主管、主角、陈序 |
| `characters-chibi.png` | 新增 Q 版立绘，头高约占全身 40%；试玩默认使用 |
| `clues.png` | 八件线索道具 |
| `meeting-room.png` | 后续场景：会议室 |
| `break-room.png` | 后续场景：茶水间 |
| `records-room.png` | 后续场景：档案室 |

## 生成提示词

共同风格要求：**TRUE 16-bit pixel art, deliberately chunky hard square pixels, limited 24-color navy teal and amber palette, clean readable silhouettes, no painterly strokes, no smooth gradients, no anti-aliasing, no photorealism, no text, no UI, no watermark**。

1. 白天办公室：Empty Chinese office at 5:42 PM, strict side-on orthographic 2D adventure game view, four workstations, orange sunset skyline, bulletin board, wall clock.
2. 夜间办公室：Same office at 6 PM, purple night skyline, flickering fluorescent lights, eerie shadow near empty workstation.
3. 人物：Four separate full-body standing sprites in one horizontal row: Lin Tang in cream cardigan, supervisor Zhou in dark suit, young employee in blue shirt, ghostly Chen Xu in gray; transparent background.
4. 道具：Eight isolated inventory sprites in a 2 × 4 grid: folded note, scratched badge, form, keycard, stamped envelope, desk drawer, analog clock, pen; transparent background.
5. 标题走廊：Empty office hallway in one-point perspective at dusk, one warm open door, lost employee badge on floor, dark space for title.
6. 会议室：Empty meeting room at sunset, side-on composition, long table, chairs, blank projector, glass wall.
7. 茶水间：Empty office tea room at night, side-on composition, vending machine, water cooler, mugs, small table, red-lit doorway.
8. 档案室：Records archive at night, side-on composition, filing cabinets, boxes, one open drawer, warm desk lamp illuminating one folder.
9. Q 版人物：Four separate front-facing chibi office worker sprites in one row; head height to body-below-head height 1:1.5, oversized heads, short compact bodies, cute expressive faces; Lin Tang, supervisor Zhou, new employee, ghostly Chen Xu; transparent background.

当前是视觉方向稿。若要正式制作角色行走动画与逐格交互，下一步应建立固定网格、统一角色像素尺寸，并人工清理每帧轮廓。

## 惊悚版统一夜景

`game.html` 的惊悚版从进入场景起使用夜景：工位使用已有的 `office-night.png`；会议室使用新增的 `meeting-room-night.png`；天台和楼下大堂分别使用 `expansion-01/rooftop-night.png`、`expansion-01/lobby-night.png`。三张新增图由对应夕阳原图编辑而来，原始夕阳图均保留；认真版和娱乐版继续沿用原场景时间规则。
