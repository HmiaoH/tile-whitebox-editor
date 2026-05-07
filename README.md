# Tile Whitebox Editor

A dark, pixel-styled 2D top-down whitebox tile map editor for prototyping indoor and architectural maps. Edit a configurable tile grid (default 64×64) across three layers — Floor, Ground, and Roof — then export the result as a PNG image or share it as a portable project file.

> 🌐 [中文文档 / Chinese README](./README.zh.md)

---

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Project file format](#project-file-format)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Browser support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

---

## Features

![preview](Images/preview_en.png)

- **30 procedurally drawn pixel tiles** — floors, walls, doors, windows, furniture, foliage, ceiling fixtures, and more.
- **Three editing layers** — Floor, Ground, and Roof, each independently visible / hidden / dimmed.
- **Three tools** — Brush (Pencil + Rectangle), Eraser, and Color Picker.
- **Fixed color palette** — 36 curated swatches across 7 groups; no free color picker, by design.
- **Per-tile rotation** — 0°, 90°, 180°, 270° applied to brush strokes and selected tiles.
- **Undo / redo** — up to 20 steps, batched per stroke.
- **Viewport** — mouse-wheel zoom, space / middle-click pan, recenter shortcut.
- **Tile swap** — `Alt`-drag from one cell to another to swap their contents on the current layer.
- **Save / load** — portable `*.tilewb.json` project files.
- **Export PNG** — choose layers, bounding-box vs. full-map region, ×1 to ×4 scale, optional gridlines, optional transparent background.
- **Bilingual UI** — Chinese / English, persisted to `localStorage`, with sensible default based on the browser locale.

---


## Quick start

### Prerequisites

- [Node.js](https://nodejs.org) **≥ 18** (Node 20.x LTS recommended). npm ships with Node.

```bash
node -v && npm -v
```

### Install & run

```bash
git clone https://github.com/HmiaoH/tile-whitebox-editor.git
cd <your-repo>
npm install
npm run dev
```

Open <http://127.0.0.1:5173> in your browser.

### Available scripts

| Script            | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Start the Vite dev server with hot reload.             |
| `npm run build`   | Type-check and produce a static build under `dist/`.   |
| `npm run preview` | Preview the production build at `http://127.0.0.1:4173`. |

---

## Keyboard shortcuts

| Action                          | Keys                          |
| ------------------------------- | ----------------------------- |
| Brush / Eraser / Picker         | `B` / `E` / `I`               |
| Toggle Pencil / Rectangle mode  | `R`                           |
| Switch active layer             | `1` / `2` / `3`               |
| Undo / Redo                     | `Z` / `X`                     |
| Rotate selection or brush       | `,` / `.`                     |
| Reset view                      | `0`                           |
| Toggle asset library            | `[`                           |
| Pan                             | `Space` + drag, or middle-click drag |
| Zoom                            | Mouse wheel                   |
| Swap two tiles                  | `Alt` + drag                  |

---

## Project file format

Saving a project produces a JSON file you can share or load on any other machine. The shape is intentionally simple:

```jsonc
{
  "kind": "tile-map-whitebox",
  "version": 1,
  "name": "My Map",
  "width": 64,
  "height": 64,
  "createdAt": "2026-05-07T12:34:56.789Z",
  "layers": [
    /* layer 0 — Floor   */ [/* row */ [/* cell */ { "shape": "wood_floor", "color": "wood", "rotation": 0 } /* or null */ ]],
    /* layer 1 — Ground  */ [ /* … */ ],
    /* layer 2 — Roof    */ [ /* … */ ]
  ]
}
```

- `layers` is always a 3-element array, indexed `[Floor, Ground, Roof]`.
- Each layer is `height` rows × `width` columns. A cell is either `null` (empty) or `{ shape, color, rotation }`.
- `shape` references a built-in shape id (see `src/data/shapes.ts`).
- `color` references a palette swatch id (see `src/data/palette.ts`).
- `rotation` is `0 | 1 | 2 | 3` (×90° clockwise).
- Files saved by older versions without `rotation` are upgraded transparently on load.

---

## Project structure

```
.
├── index.html
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── App.tsx                 # app shell
    ├── main.tsx                # entry
    ├── styles/                 # design tokens + global pixel UI
    ├── data/
    │   ├── shapes.ts           # 30 procedurally drawn tile shapes
    │   └── palette.ts          # 36-swatch fixed color palette
    ├── lib/
    │   ├── render.ts           # tile renderer with offscreen cache
    │   ├── projectFile.ts      # save / load JSON projects
    │   └── exportPng.ts        # PNG exporter
    ├── state/
    │   ├── store.ts            # Zustand editor state + undo / redo
    │   └── types.ts
    ├── i18n/
    │   ├── dict.ts             # zh / en string dictionaries
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

## Tech stack

- **React 18** + **Vite 5** + **TypeScript**
- **Zustand** for editor state
- Pure **Canvas 2D** for tile rendering — no graphics or UI libraries
- **Pixelify Sans** + **JetBrains Mono** via Google Fonts (gracefully fall back to system monospace fonts when offline)

---

## Browser support

Tested on the latest Chrome, Edge, Firefox, and Safari. The editor relies on:

- ES2022, ES modules
- Canvas 2D with `imageSmoothingEnabled = false`
- Pointer Events
- `localStorage` for language and onboarding hint persistence

There are no service workers, no telemetry, and no network calls beyond loading the static assets and Google Fonts.

---

## Contributing

Issues and pull requests are welcome. If you are adding a new shape:

1. Add a draw function and a registry entry in `src/data/shapes.ts`.
2. Add Chinese and English names under `shape.<id>` in `src/i18n/dict.ts`.
3. Verify the shape preview renders correctly in the Asset Library.

For UI changes, please keep with the dark pixel-editor visual language already established in `src/styles/tokens.css`.

---

## License

[MIT](./LICENSE)
