import { SHAPE_GRID, getShapeGrid, type Tone } from '../data/shapes';
import { colorOf } from '../data/palette';

// —— color helpers —————————————————————————————————————————————

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const v = parseInt(
    h.length === 3 ? h.split('').map((c) => c + c).join('') : h,
    16,
  );
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')}`;

const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as [
    number,
    number,
    number,
  ];

/** Build a 4-tone palette from a base color: [_, shadow, base, highlight]. */
export const tonePalette = (base: string): [string, string, string, string] => {
  const rgb = hexToRgb(base);
  const dark = mix(rgb, [0, 0, 0], 0.42);
  const light = mix(rgb, [255, 255, 255], 0.32);
  return [
    'rgba(0,0,0,0)',
    rgbToHex(dark[0], dark[1], dark[2]),
    base,
    rgbToHex(light[0], light[1], light[2]),
  ];
};

/** Grayscale palette used for asset previews. */
export const GRAY_PALETTE: [string, string, string, string] = [
  'rgba(0,0,0,0)',
  '#3F454D',
  '#7B828D',
  '#B7BEC8',
];

// —— offscreen tile cache ———————————————————————————————————————

const tileCache = new Map<string, HTMLCanvasElement>();
const CACHE_LIMIT = 800;

const lru = (key: string, value: HTMLCanvasElement) => {
  tileCache.set(key, value);
  if (tileCache.size > CACHE_LIMIT) {
    const first = tileCache.keys().next().value;
    if (first !== undefined) tileCache.delete(first);
  }
};

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  shapeId: string,
  palette: readonly [string, string, string, string],
  size: number,
) => {
  const grid = getShapeGrid(shapeId);
  if (!grid) return;
  const step = size / SHAPE_GRID;
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < SHAPE_GRID; y++) {
    for (let x = 0; x < SHAPE_GRID; x++) {
      const tone = grid[y][x] as Tone;
      if (tone === 0) continue;
      ctx.fillStyle = palette[tone];
      const px = Math.floor(x * step);
      const py = Math.floor(y * step);
      const pw = Math.ceil((x + 1) * step) - px;
      const ph = Math.ceil((y + 1) * step) - py;
      ctx.fillRect(px, py, pw, ph);
    }
  }
};

/** Render a colored tile to an offscreen canvas (cached). */
export const tileCanvas = (
  shapeId: string,
  colorIdOrHex: string,
  size: number,
): HTMLCanvasElement => {
  const hex = colorOf(colorIdOrHex);
  const key = `c:${shapeId}|${hex}|${size}`;
  const cached = tileCache.get(key);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  drawGrid(ctx, shapeId, tonePalette(hex), size);
  lru(key, c);
  return c;
};

/** Render a grayscale (uncolored) tile preview, cached. */
export const grayTileCanvas = (shapeId: string, size: number): HTMLCanvasElement => {
  const key = `g:${shapeId}|${size}`;
  const cached = tileCache.get(key);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  drawGrid(ctx, shapeId, GRAY_PALETTE, size);
  lru(key, c);
  return c;
};

export const clearTileCache = () => {
  tileCache.clear();
};
