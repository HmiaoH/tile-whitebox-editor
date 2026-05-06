import { create } from 'zustand';
import {
  type BrushMode,
  type LayerGrid,
  type LayerIndex,
  type Layers,
  type MapDoc,
  type ProjectFile,
  type Rotation,
  type Tile,
  type ToolId,
  PROJECT_FILE_KIND,
  PROJECT_FILE_VERSION,
} from './types';
import { SHAPES_BY_ID } from '../data/shapes';
import { DEFAULT_COLOR_ID } from '../data/palette';
import { translate, type Lang } from '../i18n/dict';

const initialLang = ((): Lang => {
  try {
    const saved = localStorage.getItem('tilewb.lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined') {
    const nl = navigator.language || '';
    if (nl.toLowerCase().startsWith('zh')) return 'zh';
    return 'en';
  }
  return 'zh';
})();

const HISTORY_LIMIT = 20;
const DEFAULT_SIZE = 64;

const emptyLayer = (w: number, h: number): LayerGrid =>
  Array.from({ length: h }, () => Array.from({ length: w }, () => null));

const emptyDoc = (w: number, h: number): MapDoc => ({
  width: w,
  height: h,
  layers: [emptyLayer(w, h), emptyLayer(w, h), emptyLayer(w, h)],
});

const cloneLayer = (l: LayerGrid): LayerGrid => l.map((row) => row.slice());
const cloneLayers = (ls: Layers): Layers => [
  cloneLayer(ls[0]),
  cloneLayer(ls[1]),
  cloneLayer(ls[2]),
];
const cloneDoc = (d: MapDoc): MapDoc => ({
  width: d.width,
  height: d.height,
  layers: cloneLayers(d.layers),
});

interface Snapshot {
  doc: MapDoc;
}

export interface EditorState {
  // doc
  doc: MapDoc;
  projectName: string;
  dirty: boolean;

  // tools / selection
  currentTool: ToolId;
  brushMode: BrushMode;
  currentLayer: LayerIndex;
  visibleLayers: [boolean, boolean, boolean];
  currentShape: string | null;
  currentColor: string;
  currentRotation: Rotation;
  selected: { x: number; y: number; layer: LayerIndex } | null;

  // ui
  language: Lang;
  leftCollapsed: boolean;
  zoom: number;
  panX: number;
  panY: number;
  hoverCell: { x: number; y: number } | null;
  rectPreview: { x0: number; y0: number; x1: number; y1: number } | null;
  swapSource: { x: number; y: number } | null;

  // history
  undoStack: Snapshot[];
  redoStack: Snapshot[];

  // —— actions ——
  setTool: (t: ToolId) => void;
  setBrushMode: (m: BrushMode) => void;
  setLayer: (i: LayerIndex) => void;
  toggleLayerVisible: (i: LayerIndex) => void;
  setVisibleLayers: (v: [boolean, boolean, boolean]) => void;
  setShape: (id: string | null) => void;
  setColor: (id: string) => void;
  setLanguage: (l: Lang) => void;
  setRotation: (r: Rotation) => void;
  rotateBrushBy: (delta: 1 | -1) => void;
  rotateSelectedBy: (delta: 1 | -1) => void;
  setLeftCollapsed: (b: boolean) => void;
  setHover: (c: { x: number; y: number } | null) => void;
  setRectPreview: (r: EditorState['rectPreview']) => void;
  setSwapSource: (c: { x: number; y: number } | null) => void;

  setZoom: (z: number) => void;
  zoomBy: (delta: number, focus?: { x: number; y: number }) => void;
  panBy: (dx: number, dy: number) => void;
  resetView: () => void;

  selectCell: (x: number, y: number, layer?: LayerIndex) => void;
  clearSelection: () => void;

  beginStroke: () => void;
  endStroke: () => void;
  paintAt: (x: number, y: number) => void;
  paintRect: (x0: number, y0: number, x1: number, y1: number) => void;
  swapTiles: (a: { x: number; y: number }, b: { x: number; y: number }) => void;
  updateSelectedTile: (
    patch: Partial<Tile> & { layer?: LayerIndex; rotation?: Rotation },
  ) => void;
  setTileExplicit: (x: number, y: number, layer: LayerIndex, tile: Tile | null) => void;

  undo: () => void;
  redo: () => void;

  newMap: (w: number, h: number, name?: string) => void;
  loadDoc: (file: ProjectFile) => void;
  toProjectFile: () => ProjectFile;

  setProjectName: (n: string) => void;
  markClean: () => void;
}

const inBounds = (doc: MapDoc, x: number, y: number) =>
  x >= 0 && y >= 0 && x < doc.width && y < doc.height;

const pushUndo = (
  set: (fn: (s: EditorState) => Partial<EditorState>) => void,
  get: () => EditorState,
) => {
  const cur = get();
  const snap: Snapshot = { doc: cloneDoc(cur.doc) };
  const next = [...cur.undoStack, snap];
  while (next.length > HISTORY_LIMIT) next.shift();
  set(() => ({ undoStack: next, redoStack: [], dirty: true }));
};

let strokeOpen = false;

export const useEditor = create<EditorState>((set, get) => ({
  doc: emptyDoc(DEFAULT_SIZE, DEFAULT_SIZE),
  projectName: translate(initialLang, 'common.untitled'),
  dirty: false,

  currentTool: 'brush',
  brushMode: 'pencil',
  currentLayer: 0,
  visibleLayers: [true, true, true],
  currentShape: 'wood_floor',
  currentColor: 'wood',
  currentRotation: 0,
  selected: null,

  language: initialLang,
  leftCollapsed: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  hoverCell: null,
  rectPreview: null,
  swapSource: null,

  undoStack: [],
  redoStack: [],

  setTool: (t) => set(() => ({ currentTool: t, rectPreview: null })),
  setBrushMode: (m) => set(() => ({ brushMode: m, rectPreview: null })),
  setLayer: (i) => set(() => ({ currentLayer: i, selected: null })),
  toggleLayerVisible: (i) =>
    set((s) => {
      const v = [...s.visibleLayers] as [boolean, boolean, boolean];
      v[i] = !v[i];
      return { visibleLayers: v };
    }),
  setVisibleLayers: (v) => set(() => ({ visibleLayers: v })),
  setShape: (id) => {
    set((s) => {
      if (!id) return { currentShape: null };
      const def = SHAPES_BY_ID[id];
      if (!def) return s;
      // when picking a shape, also auto-target its layer if user is on a wrong one
      const targetLayer: LayerIndex =
        def.layer === 'floor' ? 0 : def.layer === 'ground' ? 1 : 2;
      return {
        currentShape: id,
        currentLayer: targetLayer,
        currentColor: def.defaultColor ?? s.currentColor ?? DEFAULT_COLOR_ID,
      };
    });
  },
  setColor: (id) => set(() => ({ currentColor: id })),
  setLanguage: (l) => {
    try {
      localStorage.setItem('tilewb.lang', l);
    } catch {
      /* ignore */
    }
    set(() => ({ language: l }));
  },
  setRotation: (r) => set(() => ({ currentRotation: r })),
  rotateBrushBy: (delta) =>
    set((s) => ({
      currentRotation: (((s.currentRotation + delta) % 4) + 4) % 4 as Rotation,
    })),
  rotateSelectedBy: (delta) => {
    const s = get();
    if (!s.selected) return;
    const { x, y, layer } = s.selected;
    const tile = s.doc.layers[layer][y][x];
    if (!tile) return;
    if (!strokeOpen) pushUndo(set, get);
    const layers = cloneLayers(s.doc.layers);
    layers[layer][y][x] = {
      ...tile,
      rotation: ((((tile.rotation ?? 0) + delta) % 4) + 4) % 4 as Rotation,
    };
    set(() => ({ doc: { ...s.doc, layers }, dirty: true }));
  },
  setLeftCollapsed: (b) => set(() => ({ leftCollapsed: b })),
  setHover: (c) => set(() => ({ hoverCell: c })),
  setRectPreview: (r) => set(() => ({ rectPreview: r })),
  setSwapSource: (c) => set(() => ({ swapSource: c })),

  setZoom: (z) => set(() => ({ zoom: Math.max(0.25, Math.min(4, z)) })),
  zoomBy: (delta, focus) =>
    set((s) => {
      const next = Math.max(0.25, Math.min(4, s.zoom * (1 + delta)));
      const ratio = next / s.zoom;
      if (!focus) return { zoom: next };
      // adjust pan so the focal point stays under cursor
      const fx = focus.x;
      const fy = focus.y;
      return {
        zoom: next,
        panX: fx - (fx - s.panX) * ratio,
        panY: fy - (fy - s.panY) * ratio,
      };
    }),
  panBy: (dx, dy) => set((s) => ({ panX: s.panX + dx, panY: s.panY + dy })),
  resetView: () => set(() => ({ zoom: 1, panX: 0, panY: 0 })),

  selectCell: (x, y, layer) =>
    set((s) => ({ selected: { x, y, layer: layer ?? s.currentLayer } })),
  clearSelection: () => set(() => ({ selected: null })),

  beginStroke: () => {
    if (strokeOpen) return;
    strokeOpen = true;
    pushUndo(set, get);
  },
  endStroke: () => {
    strokeOpen = false;
  },

  paintAt: (x, y) => {
    const s = get();
    if (!inBounds(s.doc, x, y)) return;
    const layer = s.currentLayer;
    const layers = cloneLayers(s.doc.layers);
    if (s.currentTool === 'eraser') {
      if (!layers[layer][y][x]) return;
      layers[layer][y][x] = null;
    } else if (s.currentTool === 'brush') {
      if (!s.currentShape) return;
      const def = SHAPES_BY_ID[s.currentShape];
      if (!def) return;
      const useLayer = layer;
      const existing = layers[useLayer][y][x];
      if (
        existing &&
        existing.shape === s.currentShape &&
        existing.color === s.currentColor &&
        (existing.rotation ?? 0) === s.currentRotation
      )
        return;
      layers[useLayer][y][x] = {
        shape: s.currentShape,
        color: s.currentColor,
        rotation: s.currentRotation,
      };
    } else if (s.currentTool === 'picker') {
      const t = layers[layer][y][x];
      if (!t) return;
      const newColor = s.currentColor;
      if (t.color === newColor) return;
      layers[layer][y][x] = { ...t, color: newColor };
    }
    set(() => ({
      doc: { ...s.doc, layers },
      dirty: true,
    }));
  },

  paintRect: (x0, y0, x1, y1) => {
    const s = get();
    const lx = Math.max(0, Math.min(s.doc.width - 1, Math.min(x0, x1)));
    const hx = Math.max(0, Math.min(s.doc.width - 1, Math.max(x0, x1)));
    const ly = Math.max(0, Math.min(s.doc.height - 1, Math.min(y0, y1)));
    const hy = Math.max(0, Math.min(s.doc.height - 1, Math.max(y0, y1)));
    const layer = s.currentLayer;
    const layers = cloneLayers(s.doc.layers);
    let changed = false;
    for (let yy = ly; yy <= hy; yy++) {
      for (let xx = lx; xx <= hx; xx++) {
        if (s.currentTool === 'eraser') {
          if (layers[layer][yy][xx]) {
            layers[layer][yy][xx] = null;
            changed = true;
          }
        } else if (s.currentTool === 'brush') {
          if (!s.currentShape) continue;
          const cur = layers[layer][yy][xx];
          if (
            cur &&
            cur.shape === s.currentShape &&
            cur.color === s.currentColor &&
            (cur.rotation ?? 0) === s.currentRotation
          )
            continue;
          layers[layer][yy][xx] = {
            shape: s.currentShape,
            color: s.currentColor,
            rotation: s.currentRotation,
          };
          changed = true;
        } else if (s.currentTool === 'picker') {
          const cur = layers[layer][yy][xx];
          if (cur && cur.color !== s.currentColor) {
            layers[layer][yy][xx] = { ...cur, color: s.currentColor };
            changed = true;
          }
        }
      }
    }
    if (changed) set(() => ({ doc: { ...s.doc, layers }, dirty: true }));
  },

  swapTiles: (a, b) => {
    const s = get();
    if (!inBounds(s.doc, a.x, a.y) || !inBounds(s.doc, b.x, b.y)) return;
    if (a.x === b.x && a.y === b.y) return;
    const layers = cloneLayers(s.doc.layers);
    const layer = s.currentLayer;
    const tA = layers[layer][a.y][a.x];
    const tB = layers[layer][b.y][b.x];
    layers[layer][a.y][a.x] = tB;
    layers[layer][b.y][b.x] = tA;
    set(() => ({ doc: { ...s.doc, layers }, dirty: true }));
  },

  updateSelectedTile: (patch) => {
    const s = get();
    if (!s.selected) return;
    const { x, y } = s.selected;
    const layer = patch.layer ?? s.selected.layer;
    if (!inBounds(s.doc, x, y)) return;
    if (!strokeOpen) pushUndo(set, get);
    const layers = cloneLayers(s.doc.layers);
    // moving across layers: remove from origin layer first
    if (patch.layer !== undefined && patch.layer !== s.selected.layer) {
      const old = layers[s.selected.layer][y][x];
      layers[s.selected.layer][y][x] = null;
      const merged: Tile | null = old
        ? {
            shape: patch.shape ?? old.shape,
            color: patch.color ?? old.color,
            rotation: patch.rotation ?? old.rotation ?? 0,
          }
        : patch.shape
        ? {
            shape: patch.shape,
            color: patch.color ?? s.currentColor,
            rotation: patch.rotation ?? 0,
          }
        : null;
      layers[layer][y][x] = merged;
    } else {
      const old = layers[layer][y][x];
      const merged: Tile | null =
        patch.shape === undefined &&
        patch.color === undefined &&
        patch.rotation === undefined
          ? old
          : {
              shape: patch.shape ?? old?.shape ?? s.currentShape ?? '',
              color: patch.color ?? old?.color ?? s.currentColor,
              rotation: patch.rotation ?? old?.rotation ?? 0,
            };
      layers[layer][y][x] = merged && merged.shape ? merged : null;
    }
    set(() => ({
      doc: { ...s.doc, layers },
      selected: { x, y, layer },
      dirty: true,
    }));
  },

  setTileExplicit: (x, y, layer, tile) => {
    const s = get();
    if (!inBounds(s.doc, x, y)) return;
    if (!strokeOpen) pushUndo(set, get);
    const layers = cloneLayers(s.doc.layers);
    layers[layer][y][x] = tile;
    set(() => ({ doc: { ...s.doc, layers }, dirty: true }));
  },

  undo: () => {
    const s = get();
    if (!s.undoStack.length) return;
    const prev = s.undoStack[s.undoStack.length - 1];
    const restRedo = [...s.redoStack, { doc: cloneDoc(s.doc) }];
    while (restRedo.length > HISTORY_LIMIT) restRedo.shift();
    set(() => ({
      doc: cloneDoc(prev.doc),
      undoStack: s.undoStack.slice(0, -1),
      redoStack: restRedo,
      dirty: true,
    }));
  },

  redo: () => {
    const s = get();
    if (!s.redoStack.length) return;
    const next = s.redoStack[s.redoStack.length - 1];
    const restUndo = [...s.undoStack, { doc: cloneDoc(s.doc) }];
    while (restUndo.length > HISTORY_LIMIT) restUndo.shift();
    set(() => ({
      doc: cloneDoc(next.doc),
      undoStack: restUndo,
      redoStack: s.redoStack.slice(0, -1),
      dirty: true,
    }));
  },

  newMap: (w, h, name) =>
    set((s) => ({
      doc: emptyDoc(w, h),
      projectName: name ?? translate(s.language, 'common.untitled'),
      undoStack: [],
      redoStack: [],
      selected: null,
      hoverCell: null,
      rectPreview: null,
      panX: 0,
      panY: 0,
      zoom: 1,
      dirty: false,
    })),

  loadDoc: (file) =>
    set(() => ({
      doc: {
        width: file.width,
        height: file.height,
        layers: cloneLayers(file.layers as Layers),
      },
      projectName: file.name,
      undoStack: [],
      redoStack: [],
      selected: null,
      hoverCell: null,
      rectPreview: null,
      panX: 0,
      panY: 0,
      zoom: 1,
      dirty: false,
    })),

  toProjectFile: () => {
    const s = get();
    return {
      kind: PROJECT_FILE_KIND,
      version: PROJECT_FILE_VERSION,
      name: s.projectName,
      width: s.doc.width,
      height: s.doc.height,
      layers: s.doc.layers,
      createdAt: new Date().toISOString(),
    };
  },

  setProjectName: (n) => set(() => ({ projectName: n, dirty: true })),
  markClean: () => set(() => ({ dirty: false })),
}));
