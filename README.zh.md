# 地图白盒编辑器 · Tile Whitebox Editor

一个深色像素风的 2D 俯视角白盒地图编辑工具，用于快速搭建室内 / 建筑类地图原型。在可配置的瓦片网格（默认 64×64）上分三层（地板 / 地面 / 屋顶）逐格编辑，再以 PNG 图像或工程文件分享出去。

> 🌐 [English README](./README.md)

---

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [键盘快捷键](#键盘快捷键)
- [工程文件格式](#工程文件格式)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [浏览器兼容性](#浏览器兼容性)
- [参与贡献](#参与贡献)
- [开源许可](#开源许可)

---

## 功能特性

![preview](Images/preview_zh.png)

- **30 个程序化绘制的像素图块** —— 地砖、墙壁、门窗、家具、植物、屋顶灯具与管线等。
- **三个编辑层** —— 地板、地面、屋顶，可分别显示 / 隐藏 / 半透明。
- **三种工具** —— 画笔（铅笔 + 矩形）、橡皮、选色。
- **固定色卡** —— 36 个色样，分 7 组；不提供自由取色器，刻意保持一致性。
- **瓦片旋转** —— 0° / 90° / 180° / 270°，画笔与已选瓦片均支持。
- **撤销 / 重做** —— 最多 20 步，按笔画批处理。
- **视口控制** —— 滚轮缩放、空格 / 中键拖拽平移、快捷键复位。
- **互换瓦片** —— `Alt` 拖拽：在当前层把两个格子的内容互换。
- **保存 / 加载** —— 通用 `*.tilewb.json` 工程文件。
- **导出 PNG** —— 可勾选导出层级、包围盒 / 完整地图、×1～×4、可选网格线、可选透明背景。
- **中英双语 UI** —— 自动跟随浏览器语言，并写入 `localStorage` 持久化。

---


## 快速开始

### 前置依赖

- [Node.js](https://nodejs.org) **≥ 18**（推荐 20.x LTS，自带 npm）

```bash
node -v && npm -v
```

### 安装并运行

```bash
git clone https://github.com/HmiaoH/tile-whitebox-editor.git
cd <你的仓库>
npm install
npm run dev
```

浏览器打开 <http://127.0.0.1:5173> 即可使用。

### 可用脚本

| 脚本                | 说明                                              |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | 启动 Vite 开发服务器，支持热更新。                |
| `npm run build`     | 类型检查并产出 `dist/` 静态构建。                 |
| `npm run preview`   | 在 `http://127.0.0.1:4173` 本地预览构建产物。     |

---

## 键盘快捷键

| 操作                          | 按键                              |
| ----------------------------- | --------------------------------- |
| 画笔 / 橡皮 / 选色            | `B` / `E` / `I`                   |
| 切换 铅笔 / 矩形 模式          | `R`                               |
| 切换当前层                    | `1` / `2` / `3`                   |
| 撤销 / 重做                   | `Z` / `X`                         |
| 旋转选中瓦片或画笔             | `,` / `.`                         |
| 重置视图                      | `0`                               |
| 折叠 / 展开素材栏              | `[`                               |
| 平移                          | `空格` + 拖拽，或鼠标中键拖拽     |
| 缩放                          | 鼠标滚轮                          |
| 互换两个瓦片                  | `Alt` + 拖拽                      |

---

## 工程文件格式

保存工程会得到一个简单结构的 JSON 文件，可在任意机器上加载：

```jsonc
{
  "kind": "tile-map-whitebox",
  "version": 1,
  "name": "我的地图",
  "width": 64,
  "height": 64,
  "createdAt": "2026-05-07T12:34:56.789Z",
  "layers": [
    /* 0 — 地板层 */ [/* 行 */ [/* 单元格 */ { "shape": "wood_floor", "color": "wood", "rotation": 0 } /* 或 null */ ]],
    /* 1 — 地面层 */ [ /* … */ ],
    /* 2 — 屋顶层 */ [ /* … */ ]
  ]
}
```

- `layers` 永远是 3 元素数组：`[地板, 地面, 屋顶]`。
- 每层都是 `height` 行 × `width` 列。单元格要么是 `null`（空），要么是 `{ shape, color, rotation }`。
- `shape` 引用一个内置形状 id（见 `src/data/shapes.ts`）。
- `color` 引用一个色卡 id（见 `src/data/palette.ts`）。
- `rotation` 取值 `0 | 1 | 2 | 3`（顺时针 ×90°）。
- 旧版本中没有 `rotation` 字段的工程文件加载时会自动补 `0`，无需手动迁移。

---

## 项目结构

```
.
├── index.html
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── App.tsx                 # 应用外壳
    ├── main.tsx                # 入口
    ├── styles/                 # 设计 tokens 与全局像素 UI 样式
    ├── data/
    │   ├── shapes.ts           # 30 个程序化绘制的像素图块
    │   └── palette.ts          # 36 色固定色卡
    ├── lib/
    │   ├── render.ts           # 瓦片渲染器（含离屏缓存）
    │   ├── projectFile.ts      # 工程文件保存 / 加载
    │   └── exportPng.ts        # PNG 导出
    ├── state/
    │   ├── store.ts            # Zustand 编辑器状态 + 撤销 / 重做
    │   └── types.ts
    ├── i18n/
    │   ├── dict.ts             # 中英文字典
    │   └── useT.ts
    ├── hooks/
    │   └── useGlobalKeys.ts
    └── components/
        ├── Toolbar.tsx
        ├── AssetLibrary.tsx
        ├── Canvas.tsx
        ├── Inspector.tsx
        ├── ColorPalette.tsx
        ├── StatusBar.tsx
        ├── Modal.tsx
        ├── NewMapModal.tsx
        ├── ExportModal.tsx
        └── icons.tsx
```

---

## 技术栈

- **React 18** + **Vite 5** + **TypeScript**
- **Zustand** 管理编辑器状态
- 全程 **Canvas 2D** 自绘瓦片，不依赖任何图形 / UI 库
- **Pixelify Sans** + **JetBrains Mono**（来自 Google Fonts，离线时回退到系统等宽字体，不影响功能）

---

## 浏览器兼容性

已在最新版 Chrome / Edge / Firefox / Safari 上测试。运行时依赖：

- ES2022 与 ES Modules
- 关闭图像平滑的 Canvas 2D（`imageSmoothingEnabled = false`）
- Pointer Events
- `localStorage`（用于保存语言偏好与首次提示状态）

不会启用 Service Worker，不发任何遥测，也不会发起静态资源与 Google Fonts 之外的任何网络请求。

---

## 参与贡献

欢迎提 Issue 和 PR。如果你想新增一个图块：

1. 在 `src/data/shapes.ts` 中新增绘制函数，并在 `SHAPES` 注册表中登记。
2. 在 `src/i18n/dict.ts` 中以 `shape.<id>` 为键添加中英文名。
3. 验证素材库中的预览能正确渲染。

UI 修改请尽量贴合 `src/styles/tokens.css` 中已有的深色像素编辑器视觉语言。

---

## 开源许可

[MIT](./LICENSE)
