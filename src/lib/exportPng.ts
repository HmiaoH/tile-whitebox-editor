import type { Layers, MapDoc } from '../state/types';
import { tileCanvas } from './render';

const SOURCE = 16;

export interface ExportOptions {
  layers: [boolean, boolean, boolean];
  /** 'fit' = bounding box of placed tiles; 'full' = whole map */
  region: 'fit' | 'full';
  /** scale multiplier (applied to 16px source) */
  scale: number;
  /** include subtle grid lines in export */
  showGrid: boolean;
  /** render a transparent background instead of dark canvas color */
  transparent: boolean;
}

const computeBounds = (
  doc: MapDoc,
  layers: [boolean, boolean, boolean],
): { x0: number; y0: number; x1: number; y1: number } | null => {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -1,
    y1 = -1;
  for (let li = 0; li < 3; li++) {
    if (!layers[li]) continue;
    const L = doc.layers[li];
    for (let y = 0; y < doc.height; y++) {
      for (let x = 0; x < doc.width; x++) {
        if (L[y][x]) {
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        }
      }
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1, y1 };
};

export const renderExport = (doc: MapDoc, opt: ExportOptions): HTMLCanvasElement => {
  let bounds = { x0: 0, y0: 0, x1: doc.width - 1, y1: doc.height - 1 };
  if (opt.region === 'fit') {
    const b = computeBounds(doc, opt.layers);
    if (b) bounds = b;
  }
  const w = bounds.x1 - bounds.x0 + 1;
  const h = bounds.y1 - bounds.y0 + 1;
  const tilePx = SOURCE * opt.scale;
  const out = document.createElement('canvas');
  out.width = w * tilePx;
  out.height = h * tilePx;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  if (!opt.transparent) {
    ctx.fillStyle = '#2e343d';
    ctx.fillRect(0, 0, out.width, out.height);
  }

  const visible = ([0, 1, 2] as const).filter((i) => opt.layers[i]);
  for (const li of visible) {
    const L = (doc.layers as Layers)[li];
    for (let y = bounds.y0; y <= bounds.y1; y++) {
      for (let x = bounds.x0; x <= bounds.x1; x++) {
        const t = L[y][x];
        if (!t) continue;
        const src = tileCanvas(t.shape, t.color, SOURCE);
        const dx = (x - bounds.x0) * tilePx;
        const dy = (y - bounds.y0) * tilePx;
        const rot = t.rotation ?? 0;
        if (rot === 0) {
          ctx.drawImage(src, 0, 0, SOURCE, SOURCE, dx, dy, tilePx, tilePx);
        } else {
          ctx.save();
          ctx.translate(dx + tilePx / 2, dy + tilePx / 2);
          ctx.rotate((rot * Math.PI) / 2);
          ctx.drawImage(
            src,
            0,
            0,
            SOURCE,
            SOURCE,
            -tilePx / 2,
            -tilePx / 2,
            tilePx,
            tilePx,
          );
          ctx.restore();
        }
      }
    }
  }

  if (opt.showGrid && tilePx >= 4) {
    ctx.strokeStyle = 'rgba(20,24,29,0.55)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x++) {
      const sx = x * tilePx + 0.5;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, out.height);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y++) {
      const sy = y * tilePx + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(out.width, sy);
      ctx.stroke();
    }
  }
  return out;
};

export const downloadPng = (canvas: HTMLCanvasElement, filename: string) => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
};
