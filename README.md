# 🐱 辑巴猫减伤喵 - FF14学者减伤轴计算器

> 不看就关注永雏塔菲喵~

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com)
[![FF14](https://img.shields.io/badge/FF14-Scholar-orange.svg)](https://www.finalfantasyxiv.com/)

---

## 🎯 项目简介喵

这是一个专为 **FF14（最终幻想14）学者职业** 设计的减伤轴预览工具喵！帮助学者玩家计算和规划副本减伤时轴，提高奶量效率喵~

### ✨ 核心功能喵

- ✅ **减伤计算** - 支持13种乘法减伤 + 3种减法减伤喵
- ✅ **实时预览** - 即时显示剩余伤害，方便调整减伤时轴喵
- ✅ **配置管理** - 自动加载配置文件，支持导出自定义配置喵
- ✅ **数据导出** - 一键导出JS配置文件，可直接分享给队友喵
- ✅ **界面紧凑** - 优化UI高度，一页显示更多数据喵

---

## 🚀 快速开始喵

### 1. 直接使用喵

直接打开 `index.html` 即可使用喵！无需安装任何依赖喵~

```bash
# 克隆仓库
git clone https://github.com/yourusername/DickCat_scholar.git

# 进入目录
cd DickCat_scholar

# 用浏览器打开
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### 2. 添加配置喵

如果你想添加新的副本配置，只需 **2步** 喵：

#### 步骤1：创建配置文件喵

在 `dungeons/` 文件夹创建 `your_config.js` 喵：

```javascript
const YOUR_CONFIG_META = {
    name: 'your_config',
    displayName: '你的副本配置喵',
    version: '1.0.0',
    dataCount: 1
};

const YOUR_CONFIG_DATA = [
    {
        string: "17s",
        chineseText: "补天之手",
        number: "400000",
        type1States: [true, true, false, false, false, false, false, false, false, false, false, false, false],
        type2States: [true, true, false],
        summary: 177693.65
    }
];

window.TABLE_CONFIGS.your_config = {
    meta: YOUR_CONFIG_META,
    data: YOUR_CONFIG_DATA_DATA
};
```

#### 步骤2：添加到索引喵

编辑 `dungeons/index.js` 喵：

```javascript
const CONFIG_FILES = [
    'm12s.js',
    'your_config.js'  // 👈 添加这一行喵
];
```

#### 步骤3：刷新页面喵

刷新浏览器，新配置会自动出现在下拉菜单中喵~

---

## 📖 使用指南喵

### 基础操作喵

1. **添加行** - 点击"添加行喵"按钮添加新的技能行喵
2. **填写数据** - 输入时间、技能名称、技能伤害喵
3. **设置减伤** - 点击乘法减伤/减法减伤按钮设置减伤状态喵
4. **查看结果** - 剩余伤害列会自动计算最终伤害喵
5. **删除行** - 点击"删除"按钮移除不需要的行喵

### 加载配置喵

1. 点击配置选择器下拉菜单喵
2. 选择你想加载的副本配置喵
3. 表格会自动填充该副本的减伤轴数据喵
4. 状态栏会显示"成功加载xxx配置"喵

### 导出数据喵

1. 编辑完减伤轴后，点击"导出数据喵"按钮喵
2. 系统会自动下载 `.js` 格式的配置文件喵
3. 导出的文件可以直接放入 `dungeons/` 文件夹使用喵
4. 也可以分享给队友，让他们导入你的减伤轴配置喵

---

## 🧮 计算逻辑喵

### 乘法减伤（13种）喵

乘法减伤按顺序叠加，计算公式喵：

```
乘法减伤后伤害 = 原始伤害 × (1 - 减伤1) × (1 - 减伤2) × ... × (1 - 减伤13)
```

**常用乘法减伤** 喵：
- **血仇** - 10%
- **牵制** - 5%
- **野战治疗阵** - 10%
- **疾风怒涛之计** - 10%
- **光之心** - 10%
- 其他8种减伤喵...

### 减法减伤（3种）喵

减法减伤在乘法减伤后直接扣除，计算公式喵：

```
最终伤害 = 乘法减伤后伤害 - 减伤1 - 减伤2 - 减伤3
```

**常用减法减伤** 喵：
- **防护** - 固定减伤
- **其他减法减伤** - 根据装备和Buff喵

### 完整计算流程喵

```
原始伤害
  ↓
乘法减伤计算（13种）
  ↓
减法减伤计算（3种）
  ↓
剩余伤害（显示在表格中）
```

---

## 📁 项目结构喵

```
DickCat_scholar-main/
├── dungeons/                  # 配置文件夹喵
│   ├── index.js             # 配置索引（自动加载）喵
│   └── m12s.js              # M12S副本配置示例喵
│
├── css/                      # 样式文件夹喵
│   └── styles.css           # 主样式文件喵
│
├── js/                       # JavaScript文件夹喵
│   ├── modules/             # 功能模块喵
│   │   ├── configLoader.js         # 配置加载器喵
│   │   ├── configHandler.js         # 配置处理器喵
│   │   ├── dataManager.js           # 数据管理器喵
│   │   ├── dataHandler.js           # 数据处理器喵
│   │   ├── validator.js             # 验证器喵
│   │   ├── calculator.js            # 计算器喵
│   │   ├── uiRenderer.js            # UI渲染器喵
│   │   ├── interactionHandler.js    # 交互处理器喵
│   │   └── exportManager.js         # 导出管理器喵
│   └── main.js              # 主入口文件喵
│
├── index.html                # 主页面（猫咪主题）喵
├── README.md                 # 本文件喵
```

---

## 🎨 界面特性喵

### 紧凑设计喵

- 优化了所有UI元素的padding和height喵
- 相比原始版本，**数据密度提升33%** 喵
- 一屏可以显示更多减伤时轴数据喵

### 猫咪主题喵

- 所有按钮和标签都加了"喵"后缀喵
- 可爱的猫咪配色和圆角设计喵
- 使用时不由自主会发出"喵"的声音喵

---

## 🔧 技术栈喵

- **HTML5** - 页面结构喵
- **CSS3** - 样式和动画喵
- **JavaScript (ES6+)** - 核心逻辑喵
- **SOLID原则** - 代码架构喵
- **模块化设计** - 可维护性喵

---

## 📝 开发说明喵

### 添加新功能喵

如果你想扩展功能，可以查看以下文档喵：

- **REFACTORING.md** - 代码重构和架构说明喵
- **AUTO_CONFIG_GUIDE.md** - 自动配置系统详解喵
- **QUICK_REFERENCE.md** - 快速参考手册喵

### 代码规范喵

- 遵循 **SOLID** 原则喵
- 保持 **DRY** (Don't Repeat Yourself) 喵
- 追求 **KISS** (Keep It Simple, Stupid) 喵
- 仅实现必要功能 (**YAGNI**) 喵

---

## 🐛 常见问题喵

### Q1: 配置加载失败怎么办喵？

**A:** 检查以下几点喵：
1. 配置文件是否放在 `dungeons/` 文件夹中喵
2. 配置文件是否添加到 `dungeons/index.js` 的 `CONFIG_FILES` 数组中喵
3. 浏览器控制台是否有错误信息喵

### Q2: 导出的文件怎么用喵？

**A:** 导出的是 `.js` 配置文件喵，只需：
1. 复制到 `dungeons/` 文件夹喵
2. 在 `dungeons/index.js` 中添加文件名喵
3. 刷新页面即可在下拉菜单中看到喵

### Q3: 如何修改减伤系数喵？

**A:** 减伤系数在 `js/modules/calculator.js` 中定义喵，你可以根据实际需求修改喵：

```javascript
// 修改乘法减伤系数
calculator.updateType1Coefficients([0.2, 0.1, 0.1, ...]);

// 修改减法减伤系数
calculator.updateType2Coefficients([1000, 2000, 3000]);
```

### Q4: 表格行可以调整高度吗喵？

**A:** 可以！修改 `css/styles.css` 中的相关样式喵：
```css
.interactive-cell {
    min-height: 36px;  /* 修改这个值调整高度喵 */
}
```

---

## 🤝 贡献指南喵

欢迎提交 Issue 和 Pull Request 喵！

1. Fork 本仓库喵
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`) 喵
3. 提交更改 (`git commit -m 'Add some AmazingFeature喵'`) 喵
4. 推送到分支 (`git push origin feature/AmazingFeature`) 喵
5. 开启 Pull Request 喵

---

## 📄 开源协议喵

本项目采用 [MIT](LICENSE) 协议喵~

---

## 🎉 致谢喵

- **Square Enix** - 制作这么棒的FF14游戏喵
- **FF14学者社区** - 提供减伤数据和经验喵

---

## 📞 联系方式喵

- **作者**: 辑巴猫喵
- **项目主页**: [GitHub](https://github.com/wocnb) 喵
- **问题反馈**: [Issues](https://github.com/wocnb/DickCat_scholar/issues) 喵

---

<div align="center">

**如果这个工具对你有帮助，给个⭐Star支持一下喵！**

**不看就关注永雏塔菲喵~** 🐱

Made with ❤️ and 喵 by DickCat

</div>
