// Pixel-art tile shape library.
// Each shape is a 16x16 logical grid of "tones": 0 transparent, 1 dark, 2 mid, 3 light.
// At runtime tones are mapped to either grayscale (asset preview) or a tinted
// palette derived from the user-selected color (map tile).

export type Tone = 0 | 1 | 2 | 3;
export type Grid = Tone[][];
export type LayerId = 'floor' | 'ground' | 'roof';

export const SHAPE_GRID = 16;

export interface ShapeDef {
  id: string;
  name: string;
  layer: LayerId;
  draw: (g: Grid) => void;
  /** Default suggested color from the palette (paletteId). */
  defaultColor?: string;
  /** Whether the shape fully covers the tile (affects roof transparency overlay). */
  fillsTile?: boolean;
}

// —— grid primitives ——————————————————————————————————————————————

const blank = (): Grid =>
  Array.from({ length: SHAPE_GRID }, () =>
    Array.from({ length: SHAPE_GRID }, () => 0 as Tone),
  );

const px = (g: Grid, x: number, y: number, t: Tone) => {
  if (x >= 0 && x < SHAPE_GRID && y >= 0 && y < SHAPE_GRID) g[y][x] = t;
};

const fill = (g: Grid, x: number, y: number, w: number, h: number, t: Tone) => {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) px(g, xx, yy, t);
};

const rect = (g: Grid, x: number, y: number, w: number, h: number, t: Tone) => {
  fill(g, x, y, w, 1, t);
  fill(g, x, y + h - 1, w, 1, t);
  fill(g, x, y, 1, h, t);
  fill(g, x + w - 1, y, 1, h, t);
};

const disk = (g: Grid, cx: number, cy: number, r: number, t: Tone) => {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r + r * 0.4) px(g, cx + x, cy + y, t);
};

const ring = (g: Grid, cx: number, cy: number, r: number, t: Tone) => {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= r * r + r && d >= (r - 1) * (r - 1)) px(g, cx + x, cy + y, t);
    }
};

const dots = (
  g: Grid,
  pts: ReadonlyArray<readonly [number, number]>,
  t: Tone,
) => {
  for (const [x, y] of pts) px(g, x, y, t);
};

// —— FLOOR layer shapes ——————————————————————————————————————————

const wood_floor = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  for (let py = 0; py < 16; py += 4) {
    fill(g, 0, py, 16, 1, 3);
    fill(g, 0, py + 3, 16, 1, 1);
  }
  // wood knots
  dots(g, [[5, 1], [6, 2], [11, 9], [12, 10], [2, 13]], 1);
};

const stone_tile = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  // grout
  fill(g, 7, 0, 2, 16, 1);
  fill(g, 0, 7, 16, 2, 1);
  // each quadrant corner highlight
  for (const [ox, oy] of [
    [0, 0],
    [9, 0],
    [0, 9],
    [9, 9],
  ] as const) {
    fill(g, ox, oy, 7, 1, 3);
    fill(g, ox, oy, 1, 7, 3);
  }
};

const stone_brick = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  for (let row = 0; row < 4; row++) {
    const y = row * 4;
    fill(g, 0, y, 16, 1, 1);
    if (row % 2 === 0) {
      fill(g, 7, y, 2, 4, 1);
    } else {
      fill(g, 3, y, 1, 4, 1);
      fill(g, 11, y, 2, 4, 1);
    }
    // brick highlight on top of each brick
    fill(g, 0, y + 1, 16, 1, 3);
  }
};

const carpet = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  rect(g, 0, 0, 16, 16, 1);
  rect(g, 2, 2, 12, 12, 3);
  // diamond pattern interior
  for (let i = 0; i < 3; i++) {
    const cx = 4 + i * 4;
    px(g, cx, 7, 3);
    px(g, cx, 8, 3);
    px(g, cx - 1, 7, 1);
    px(g, cx + 1, 8, 1);
  }
};

const road = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  fill(g, 0, 0, 16, 1, 1);
  fill(g, 0, 15, 16, 1, 1);
  fill(g, 0, 1, 16, 1, 3);
  // dashed center line
  for (let x = 1; x < 16; x += 4) fill(g, x, 7, 2, 2, 3);
};

const dirt = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  // speckles
  dots(
    g,
    [
      [1, 2], [4, 5], [9, 1], [13, 4], [3, 9], [6, 12], [10, 13], [14, 10],
      [2, 14], [11, 7], [7, 5], [12, 2], [8, 9],
    ],
    3,
  );
  dots(
    g,
    [
      [2, 3], [5, 6], [10, 2], [14, 5], [4, 10], [7, 13], [11, 14], [13, 11],
      [3, 15], [12, 8], [8, 6], [11, 3], [9, 10],
    ],
    1,
  );
};

const water = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  // wave lines
  for (let row = 0; row < 4; row++) {
    const y = 1 + row * 4;
    for (let i = 0; i < 16; i += 4) {
      const off = (row % 2) * 2;
      px(g, (i + off) % 16, y, 3);
      px(g, (i + off + 1) % 16, y, 3);
      px(g, (i + off + 2) % 16, y + 1, 1);
      px(g, (i + off + 3) % 16, y + 1, 1);
    }
  }
};

const grass = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  // tufts: vertical 2-pixel highlights
  const tufts: Array<[number, number]> = [
    [1, 1], [4, 3], [7, 1], [10, 4], [13, 2],
    [2, 7], [5, 9], [8, 6], [11, 9], [14, 7],
    [1, 12], [4, 14], [7, 12], [10, 13], [13, 14],
  ];
  for (const [x, y] of tufts) {
    px(g, x, y, 3);
    px(g, x, y + 1, 3);
    px(g, x + 1, y + 1, 1);
  }
};

// —— GROUND layer shapes —————————————————————————————————————————

const wall_h = (g: Grid) => {
  fill(g, 0, 5, 16, 6, 2);
  fill(g, 0, 5, 16, 1, 1);
  fill(g, 0, 6, 16, 1, 3);
  fill(g, 0, 10, 16, 1, 1);
  // small bricks separations
  for (let i = 4; i < 16; i += 4) {
    fill(g, i, 7, 1, 3, 1);
  }
};

const wall_v = (g: Grid) => {
  fill(g, 5, 0, 6, 16, 2);
  fill(g, 5, 0, 1, 16, 1);
  fill(g, 6, 0, 1, 16, 3);
  fill(g, 10, 0, 1, 16, 1);
  for (let i = 4; i < 16; i += 4) {
    fill(g, 7, i, 3, 1, 1);
  }
};

const wall_corner = (g: Grid) => {
  // top-left L
  fill(g, 0, 5, 11, 6, 2);
  fill(g, 5, 0, 6, 11, 2);
  // outer/inner edges
  fill(g, 0, 5, 11, 1, 1);
  fill(g, 5, 0, 1, 11, 1);
  fill(g, 0, 10, 11, 1, 1);
  fill(g, 10, 0, 1, 11, 1);
  fill(g, 0, 6, 5, 1, 3);
  fill(g, 6, 0, 1, 5, 3);
};

const door = (g: Grid) => {
  // wall stub on each side
  fill(g, 0, 5, 3, 6, 1);
  fill(g, 13, 5, 3, 6, 1);
  // door frame
  fill(g, 3, 4, 10, 8, 3);
  rect(g, 3, 4, 10, 8, 1);
  // door panel
  fill(g, 5, 5, 6, 6, 2);
  rect(g, 5, 5, 6, 6, 1);
  // handle
  px(g, 9, 8, 3);
};

const window = (g: Grid) => {
  // wall above and below window opening
  fill(g, 0, 5, 16, 6, 1);
  // window inset
  fill(g, 2, 5, 12, 6, 3);
  rect(g, 2, 5, 12, 6, 1);
  // mullions
  fill(g, 7, 5, 2, 6, 1);
  fill(g, 2, 7, 12, 2, 1);
};

const table_round = (g: Grid) => {
  disk(g, 7, 7, 6, 1);
  disk(g, 7, 7, 5, 2);
  disk(g, 7, 7, 3, 3);
  // shadow underline
  fill(g, 4, 13, 8, 1, 1);
};

const table_square = (g: Grid) => {
  fill(g, 2, 3, 12, 10, 1);
  fill(g, 3, 4, 10, 8, 2);
  fill(g, 3, 4, 10, 1, 3);
  fill(g, 3, 4, 1, 8, 3);
  // legs
  px(g, 2, 13, 1);
  px(g, 13, 13, 1);
  px(g, 2, 2, 1);
  px(g, 13, 2, 1);
};

const chair = (g: Grid) => {
  fill(g, 5, 5, 6, 6, 1);
  fill(g, 6, 6, 4, 4, 2);
  // backrest (top edge thicker)
  fill(g, 5, 4, 6, 1, 3);
  fill(g, 5, 5, 6, 1, 1);
};

const sofa = (g: Grid) => {
  fill(g, 1, 4, 14, 8, 1);
  fill(g, 2, 5, 12, 6, 2);
  // back cushion
  fill(g, 2, 5, 12, 2, 3);
  fill(g, 2, 6, 12, 1, 1);
  // armrests
  fill(g, 1, 4, 2, 8, 1);
  fill(g, 13, 4, 2, 8, 1);
  // seat divisions
  fill(g, 7, 7, 1, 4, 1);
  fill(g, 9, 7, 1, 4, 1);
};

const bed = (g: Grid) => {
  // mattress
  fill(g, 2, 1, 12, 14, 1);
  fill(g, 3, 2, 10, 12, 2);
  fill(g, 3, 2, 10, 1, 3);
  // pillow
  fill(g, 4, 3, 8, 3, 3);
  rect(g, 4, 3, 8, 3, 1);
  // blanket fold
  fill(g, 3, 11, 10, 1, 1);
  fill(g, 3, 12, 10, 2, 3);
};

const cabinet = (g: Grid) => {
  fill(g, 1, 2, 14, 12, 1);
  fill(g, 2, 3, 12, 10, 2);
  fill(g, 2, 3, 12, 1, 3);
  // doors split
  fill(g, 7, 3, 2, 10, 1);
  // handles
  px(g, 6, 8, 3);
  px(g, 9, 8, 3);
};

const floor_lamp = (g: Grid) => {
  // base
  disk(g, 7, 12, 3, 1);
  fill(g, 6, 12, 4, 1, 3);
  // pole
  fill(g, 7, 6, 2, 6, 1);
  // shade
  fill(g, 4, 3, 8, 3, 2);
  fill(g, 5, 2, 6, 1, 3);
  fill(g, 4, 6, 8, 1, 1);
  rect(g, 4, 3, 8, 3, 1);
};

const tree = (g: Grid) => {
  // canopy
  disk(g, 7, 7, 7, 1);
  disk(g, 7, 7, 6, 2);
  // highlights tufts
  disk(g, 5, 5, 2, 3);
  disk(g, 9, 8, 2, 3);
  // trunk hint
  fill(g, 7, 13, 2, 2, 1);
};

const rock = (g: Grid) => {
  disk(g, 7, 8, 5, 1);
  disk(g, 7, 8, 4, 2);
  // top highlight
  fill(g, 5, 5, 5, 1, 3);
  px(g, 4, 6, 3);
  // crack
  px(g, 8, 9, 1);
  px(g, 9, 10, 1);
};

const statue = (g: Grid) => {
  // pedestal
  fill(g, 3, 12, 10, 3, 1);
  fill(g, 4, 13, 8, 1, 3);
  // body
  fill(g, 6, 5, 4, 8, 2);
  rect(g, 6, 5, 4, 8, 1);
  // head
  disk(g, 7, 4, 2, 2);
  ring(g, 7, 4, 2, 1);
  // shoulders
  px(g, 5, 7, 2);
  px(g, 10, 7, 2);
  px(g, 5, 7, 1);
};

const pool = (g: Grid) => {
  // pool basin
  rect(g, 1, 1, 14, 14, 1);
  fill(g, 2, 2, 12, 12, 2);
  // ripples
  for (let i = 0; i < 3; i++) {
    const y = 4 + i * 4;
    fill(g, 4, y, 8, 1, 3);
    fill(g, 5, y + 1, 6, 1, 1);
  }
};

const plant_pot = (g: Grid) => {
  // pot
  fill(g, 4, 9, 8, 5, 1);
  fill(g, 5, 10, 6, 4, 2);
  fill(g, 5, 10, 6, 1, 3);
  // foliage
  disk(g, 7, 5, 4, 1);
  disk(g, 7, 5, 3, 2);
  px(g, 6, 4, 3);
  px(g, 8, 5, 3);
};

// —— ROOF layer shapes —————————————————————————————————————————

const ceiling_light = (g: Grid) => {
  // mounting
  ring(g, 7, 7, 6, 1);
  disk(g, 7, 7, 5, 2);
  disk(g, 7, 7, 3, 3);
  // glow center
  px(g, 7, 6, 3);
  px(g, 8, 7, 3);
};

const pipe_h = (g: Grid) => {
  fill(g, 0, 6, 16, 4, 1);
  fill(g, 0, 7, 16, 1, 3);
  fill(g, 0, 8, 16, 1, 2);
  // joint flanges
  fill(g, 4, 5, 1, 6, 1);
  fill(g, 11, 5, 1, 6, 1);
};

const pipe_v = (g: Grid) => {
  fill(g, 6, 0, 4, 16, 1);
  fill(g, 7, 0, 1, 16, 3);
  fill(g, 8, 0, 1, 16, 2);
  fill(g, 5, 4, 6, 1, 1);
  fill(g, 5, 11, 6, 1, 1);
};

const ceiling_panel = (g: Grid) => {
  fill(g, 0, 0, 16, 16, 2);
  rect(g, 0, 0, 16, 16, 1);
  // T-grid
  fill(g, 7, 0, 2, 16, 1);
  fill(g, 0, 7, 16, 2, 1);
  // each panel inner highlights
  for (const [ox, oy] of [
    [1, 1], [9, 1], [1, 9], [9, 9],
  ] as const) {
    fill(g, ox, oy, 6, 1, 3);
  }
};

const vent = (g: Grid) => {
  rect(g, 2, 2, 12, 12, 1);
  fill(g, 3, 3, 10, 10, 2);
  // grille slats
  for (let i = 4; i < 13; i += 2) fill(g, 3, i, 10, 1, 1);
  fill(g, 3, 3, 10, 1, 3);
};

// —— Registry ——————————————————————————————————————————————————

export const SHAPES: ShapeDef[] = [
  // Floor
  { id: 'wood_floor', name: '木地板', layer: 'floor', draw: wood_floor, defaultColor: 'wood', fillsTile: true },
  { id: 'stone_tile', name: '石板地', layer: 'floor', draw: stone_tile, defaultColor: 'stone', fillsTile: true },
  { id: 'stone_brick', name: '石砖地', layer: 'floor', draw: stone_brick, defaultColor: 'stoneWarm', fillsTile: true },
  { id: 'carpet', name: '地毯', layer: 'floor', draw: carpet, defaultColor: 'red', fillsTile: true },
  { id: 'road', name: '道路', layer: 'floor', draw: road, defaultColor: 'asphalt', fillsTile: true },
  { id: 'dirt', name: '泥土', layer: 'floor', draw: dirt, defaultColor: 'earth', fillsTile: true },
  { id: 'water', name: '水面', layer: 'floor', draw: water, defaultColor: 'water', fillsTile: true },
  { id: 'grass', name: '草地', layer: 'floor', draw: grass, defaultColor: 'grass', fillsTile: true },
  // Ground
  { id: 'wall_h', name: '横墙', layer: 'ground', draw: wall_h, defaultColor: 'wall' },
  { id: 'wall_v', name: '竖墙', layer: 'ground', draw: wall_v, defaultColor: 'wall' },
  { id: 'wall_corner', name: '转角墙', layer: 'ground', draw: wall_corner, defaultColor: 'wall' },
  { id: 'door', name: '门', layer: 'ground', draw: door, defaultColor: 'wood' },
  { id: 'window', name: '窗', layer: 'ground', draw: window, defaultColor: 'water' },
  { id: 'table_round', name: '圆桌', layer: 'ground', draw: table_round, defaultColor: 'wood' },
  { id: 'table_square', name: '方桌', layer: 'ground', draw: table_square, defaultColor: 'wood' },
  { id: 'chair', name: '椅子', layer: 'ground', draw: chair, defaultColor: 'wood' },
  { id: 'sofa', name: '沙发', layer: 'ground', draw: sofa, defaultColor: 'teal' },
  { id: 'bed', name: '床', layer: 'ground', draw: bed, defaultColor: 'cream' },
  { id: 'cabinet', name: '柜子', layer: 'ground', draw: cabinet, defaultColor: 'wood' },
  { id: 'floor_lamp', name: '落地灯', layer: 'ground', draw: floor_lamp, defaultColor: 'amber' },
  { id: 'tree', name: '树', layer: 'ground', draw: tree, defaultColor: 'leaf' },
  { id: 'rock', name: '石头', layer: 'ground', draw: rock, defaultColor: 'stone' },
  { id: 'statue', name: '雕像', layer: 'ground', draw: statue, defaultColor: 'stoneWarm' },
  { id: 'pool', name: '水池', layer: 'ground', draw: pool, defaultColor: 'water' },
  { id: 'plant_pot', name: '盆栽', layer: 'ground', draw: plant_pot, defaultColor: 'leaf' },
  // Roof
  { id: 'ceiling_light', name: '吊灯', layer: 'roof', draw: ceiling_light, defaultColor: 'amber' },
  { id: 'pipe_h', name: '横向管线', layer: 'roof', draw: pipe_h, defaultColor: 'metal' },
  { id: 'pipe_v', name: '纵向管线', layer: 'roof', draw: pipe_v, defaultColor: 'metal' },
  { id: 'ceiling_panel', name: '天花板', layer: 'roof', draw: ceiling_panel, defaultColor: 'panel' },
  { id: 'vent', name: '通风口', layer: 'roof', draw: vent, defaultColor: 'metal' },
];

export const SHAPES_BY_ID: Record<string, ShapeDef> = Object.fromEntries(
  SHAPES.map((s) => [s.id, s]),
);

// Build the 16x16 tone grid for a shape (cached).
const gridCache = new Map<string, Grid>();
export const getShapeGrid = (id: string): Grid | null => {
  const cached = gridCache.get(id);
  if (cached) return cached;
  const def = SHAPES_BY_ID[id];
  if (!def) return null;
  const g = blank();
  def.draw(g);
  gridCache.set(id, g);
  return g;
};
