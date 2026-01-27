# 职业图标说明

## 📋 概述

职业选择器需要将职业图标放置在此目录下。

## 📁 需要的图标文件

共需要 **21个** PNG 图标文件（使用职业短ID命名）：

### 坦克职业（4个）
- `pld.png` - 骑士 (Paladin)
- `war.png` - 战士 (Warrior)
- `drk.png` - 暗骑 (Dark Knight)
- `gnb.png` - 绝枪 (Gunbreaker)

### 治疗职业（4个）
- `whm.png` - 白魔 (White Mage)
- `sch.png` - 学者 (Scholar)
- `ast.png` - 占星 (Astrologian)
- `sge.png` - 贤者 (Sage)

### 近战DPS（6个）
- `mnk.png` - 武僧 (Monk)
- `drg.png` - 龙骑 (Dragoon)
- `nin.png` - 忍者 (Ninja)
- `sam.png` - 武士 (Samurai)
- `rpr.png` - 镰刀 (Reaper)
- `vpr.png` - 蝰蛇 (Viper)

### 远程物理DPS（3个）
- `brd.png` - 诗人 (Bard)
- `mch.png` - 机工 (Machinist)
- `dnc.png` - 舞者 (Dancer)

### 魔法DPS（4个）
- `blm.png` - 黑魔 (Black Mage)
- `smn.png` - 召唤 (Summoner)
- `rdm.png` - 赤魔 (Red Mage)
- `pct.png` - 绘魔 (Pictomancer)

## 🎨 图标要求

- **格式**: PNG
- **尺寸**: 建议 64x64 或 128x128（会自动缩放到 28x28px）
- **背景**: 透明背景
- **命名**: 必须使用上述的短ID格式（如 `pld.png`）
- **大小**: 建议不超过 50KB

## 📥 图标来源建议

### 官方资源
- FF14 Lodestone 官方图标
- 游戏内资源提取
- XIVAPI (https://xivapi.com)

### 社区资源
- FFXIV Collect (https://ffxivcollect.com)
- Gamer Escape 图标库

### 自制图标
- 可以使用纯色块 + 首字母文字
- 或使用简单的 SVG 图标转换成 PNG

## ⚠️ 注意事项

1. 如果图标不存在，会显示文字版的 SVG fallback
2. 文件名必须使用小写短ID（如 `pld.png`，而不是 `paladin.png`）
3. 必须是 PNG 格式
4. 图标会被自动缩放到 28x28px 以匹配减伤图标样式

## 🔄 占位符

目前使用文字 SVG 作为占位符，直到实际图标被添加。示例：
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y=".9em" font-size="50" fill="#4a5568">骑</text>
</svg>
```
