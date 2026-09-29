# 场景天气与光照变体

使用内置 ImageGen 的编辑模式，以现有像素场景为输入，新增 18 张 PNG，保存在 [`assets/pixel/weather-01/`](../assets/pixel/weather-01/)。可在 [`weather-gallery.html`](weather-gallery.html) 按地点切换对比。旧图均保留。

| 地点 | 晴天 | 雨天 | 雪天 | 原版 |
| --- | --- | --- | --- | --- |
| 综合办公室 | `office-day-clear.png` | `office-day-rain.png` | `office-day-snow.png` | `assets/pixel/office-day.png`（夕阳） |
| 公司大堂 | `lobby-day-clear.png` | `lobby-day-rain.png` | `lobby-day-snow.png` | `assets/pixel/expansion-01/lobby.png`（暮色） |
| 电梯间 | `elevator-day-clear.png` | `elevator-day-rain.png` | `elevator-day-snow.png` | `assets/pixel/expansion-01/elevator.png`（夜间） |
| 主管办公室 | `manager-office-day-clear.png` | `manager-office-day-rain.png` | `manager-office-day-snow.png` | `assets/pixel/expansion-01/manager-office.png`（夜间） |
| 消防楼梯 | `stairwell-day-clear.png` | `stairwell-day-rain.png` | `stairwell-day-snow.png` | `assets/pixel/expansion-01/stairwell.png`（夜间） |
| 天台 | `rooftop-day-clear.png` | `rooftop-day-rain.png` | `rooftop-day-snow.png` | `assets/pixel/expansion-01/rooftop.png`（暮色） |

## 编辑提示词

每张图均以同地点上一阶段图为编辑目标，执行以下共同约束：**Keep camera, perspective, walls, doors, windows, furniture, structural objects and their positions and sizes exactly the same. Preserve true 16-bit pixel-art hard square edges and existing pixel scale. No painterly smoothing, no people, no readable text, no UI, no watermark.**

- **晴天**：由该地点原版编辑。将暮色或夜间改为晴朗的上午；窗外蓝天、白云、城市景观，室内换成自然日光与对应反射。电梯右门可从夜间微开状态关上；其他布景保持原位。
- **雨天**：由该地点晴天版编辑。窗外变成灰蓝阴天、落雨与湿地；窗面加雨滴，室内光线更冷更柔，地面反射相应变化。室内保持干燥。天台增加雨线、积水与水面反射。
- **雪天**：由该地点晴天版编辑。窗外飘雪，远处屋顶与室外地面覆雪，室内保持干燥并用更柔和的冬季光线。天台的围栏、机组和椅子上积雪。

主要场景结构已尽量对齐，细小物件与像素边缘仍可能出现生成漂移。若以后要做同机位逐帧淡入或精确碰撞，建议挑定一个底图并对变体做人工像素清理。
