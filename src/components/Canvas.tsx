import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEditor } from '../state/store';
import { tileCanvas } from '../lib/render';
import { SHAPES_BY_ID } from '../data/shapes';
import { colorOf } from '../data/palette';
import { useT } from '../i18n/useT';
import './Canvas.css';

const BASE_TILE = 24; // world px per tile at zoom=1
const SHAPE_SOURCE_PX = 16; // tile source canvas size

const drawCheckerBg = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  size: number,
) => {
  ctx.fillStyle = '#262c33';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2c333b';
  for (let yy = 0; yy < h; yy += size) {
    for (let xx = (Math.floor(yy / size) % 2) * size; xx < w; xx += size * 2) {
      ctx.fillRect(x + xx, y + yy, size, size);
    }
  }
};

const cellAt = (
  sx: number,
  sy: number,
  panX: number,
  panY: number,
  tileSize: number,
) => ({
  x: Math.floor((sx - panX) / tileSize),
  y: Math.floor((sy - panY) / tileSize),
});

const inMap = (x: number, y: number, w: number, h: number) =>
  x >= 0 && y >= 0 && x < w && y < h;

export const Canvas = () => {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const doc = useEditor((s) => s.doc);
  const visibleLayers = useEditor((s) => s.visibleLayers);
  const currentLayer = useEditor((s) => s.currentLayer);
  const zoom = useEditor((s) => s.zoom);
  const panX = useEditor((s) => s.panX);
  const panY = useEditor((s) => s.panY);
  const hover = useEditor((s) => s.hoverCell);
  const selected = useEditor((s) => s.selected);
  const rectPreview = useEditor((s) => s.rectPreview);
  const swapSource = useEditor((s) => s.swapSource);
  const tool = useEditor((s) => s.currentTool);
  const mode = useEditor((s) => s.brushMode);
  const currentShape = useEditor((s) => s.currentShape);
  const currentColor = useEditor((s) => s.currentColor);

  const setHover = useEditor((s) => s.setHover);
  const setRectPreview = useEditor((s) => s.setRectPreview);
  const setSwapSource = useEditor((s) => s.setSwapSource);
  const beginStroke = useEditor((s) => s.beginStroke);
  const endStroke = useEditor((s) => s.endStroke);
  const paintAt = useEditor((s) => s.paintAt);
  const paintRect = useEditor((s) => s.paintRect);
  const swapTiles = useEditor((s) => s.swapTiles);
  const selectCell = useEditor((s) => s.selectCell);
  const setColor = useEditor((s) => s.setColor);
  const zoomBy = useEditor((s) => s.zoomBy);
  const panBy = useEditor((s) => s.panBy);

  // —— track container size ——
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      const cr = e.contentRect;
      setSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // center map initially / after newMap
  const initialCenteredFor = useRef('');
  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;
    const key = `${doc.width}x${doc.height}@${size.w}x${size.h}`;
    if (initialCenteredFor.current === key) return;
    initialCenteredFor.current = key;
    const tile = BASE_TILE * zoom;
    const mapW = doc.width * tile;
    const mapH = doc.height * tile;
    useEditor.setState({
      panX: Math.round((size.w - mapW) / 2),
      panY: Math.round((size.h - mapH) / 2),
    });
  }, [doc.width, doc.height, size.w, size.h, zoom]);

  // —— track Space key for panning ——
  const spaceDownRef = useRef(false);
  useEffect(() => {
    const onKD = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        spaceDownRef.current = true;
      }
    };
    const onKU = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDownRef.current = false;
    };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    return () => {
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
    };
  }, []);

  // —— main draw ——
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const tileSize = BASE_TILE * zoom;
    const mapW = doc.width * tileSize;
    const mapH = doc.height * tileSize;

    // Background outside map
    ctx.fillStyle = '#1a1f25';
    ctx.fillRect(0, 0, size.w, size.h);

    // Subtle vignette inside the canvas area (purely cosmetic)
    const grad = ctx.createRadialGradient(
      size.w / 2,
      size.h / 2,
      Math.min(size.w, size.h) * 0.3,
      size.w / 2,
      size.h / 2,
      Math.max(size.w, size.h) * 0.7,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size.w, size.h);

    // Map base
    drawCheckerBg(ctx, panX, panY, mapW, mapH, Math.max(8, tileSize));
    ctx.fillStyle = '#2e343d';
    ctx.fillRect(panX, panY, mapW, mapH);

    // —— grid ——
    if (tileSize >= 6) {
      ctx.strokeStyle = '#3f4650';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // vertical lines
      for (let x = 0; x <= doc.width; x++) {
        const sx = Math.round(panX + x * tileSize) + 0.5;
        ctx.moveTo(sx, panY);
        ctx.lineTo(sx, panY + mapH);
      }
      for (let y = 0; y <= doc.height; y++) {
        const sy = Math.round(panY + y * tileSize) + 0.5;
        ctx.moveTo(panX, sy);
        ctx.lineTo(panX + mapW, sy);
      }
      ctx.stroke();
    }

    // —— tiles ——
    // visible range
    const x0 = Math.max(0, Math.floor(-panX / tileSize));
    const y0 = Math.max(0, Math.floor(-panY / tileSize));
    const x1 = Math.min(doc.width, Math.ceil((size.w - panX) / tileSize));
    const y1 = Math.min(doc.height, Math.ceil((size.h - panY) / tileSize));

    const drawLayer = (layerIdx: 0 | 1 | 2, alpha: number) => {
      ctx.globalAlpha = alpha;
      const layer = doc.layers[layerIdx];
      for (let y = y0; y < y1; y++) {
        const row = layer[y];
        for (let x = x0; x < x1; x++) {
          const t = row[x];
          if (!t) continue;
          const src = tileCanvas(t.shape, t.color, SHAPE_SOURCE_PX);
          const dx = Math.round(panX + x * tileSize);
          const dy = Math.round(panY + y * tileSize);
          const dw = Math.round(panX + (x + 1) * tileSize) - dx;
          const dh = Math.round(panY + (y + 1) * tileSize) - dy;
          const rot = t.rotation ?? 0;
          if (rot === 0) {
            ctx.drawImage(src, 0, 0, SHAPE_SOURCE_PX, SHAPE_SOURCE_PX, dx, dy, dw, dh);
          } else {
            ctx.save();
            ctx.translate(dx + dw / 2, dy + dh / 2);
            ctx.rotate((rot * Math.PI) / 2);
            ctx.drawImage(
              src,
              0,
              0,
              SHAPE_SOURCE_PX,
              SHAPE_SOURCE_PX,
              -dw / 2,
              -dh / 2,
              dw,
              dh,
            );
            ctx.restore();
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    // draw layers in order, dimming non-current
    ([0, 1, 2] as const).forEach((li) => {
      if (!visibleLayers[li]) return;
      const isCurrent = li === currentLayer;
      const alpha = isCurrent ? 1 : li === 2 ? 0.55 : 0.55;
      drawLayer(li, alpha);
    });

    // —— map outer border ——
    ctx.strokeStyle = '#5b6370';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.round(panX) + 0.5,
      Math.round(panY) + 0.5,
      Math.round(mapW) - 1,
      Math.round(mapH) - 1,
    );

    // —— hover highlight ——
    if (hover && inMap(hover.x, hover.y, doc.width, doc.height)) {
      const dx = Math.round(panX + hover.x * tileSize);
      const dy = Math.round(panY + hover.y * tileSize);
      const dw = Math.round(panX + (hover.x + 1) * tileSize) - dx;
      const dh = Math.round(panY + (hover.y + 1) * tileSize) - dy;
      ctx.strokeStyle = '#4FD1C5';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx + 1, dy + 1, dw - 2, dh - 2);
    }

    // —— rect preview ——
    if (rectPreview) {
      const lx = Math.min(rectPreview.x0, rectPreview.x1);
      const hx = Math.max(rectPreview.x0, rectPreview.x1);
      const ly = Math.min(rectPreview.y0, rectPreview.y1);
      const hy = Math.max(rectPreview.y0, rectPreview.y1);
      const dx = Math.round(panX + lx * tileSize);
      const dy = Math.round(panY + ly * tileSize);
      const dw = Math.round(panX + (hx + 1) * tileSize) - dx;
      const dh = Math.round(panY + (hy + 1) * tileSize) - dy;
      const stroke = tool === 'eraser' ? '#E06C75' : '#F2C94C';
      ctx.fillStyle = `${stroke}28`;
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = stroke;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.strokeRect(dx + 1, dy + 1, dw - 2, dh - 2);
      ctx.setLineDash([]);
    }

    // —— swap source highlight & line ——
    if (swapSource) {
      const dx = Math.round(panX + swapSource.x * tileSize);
      const dy = Math.round(panY + swapSource.y * tileSize);
      const dw = Math.round(panX + (swapSource.x + 1) * tileSize) - dx;
      const dh = Math.round(panY + (swapSource.y + 1) * tileSize) - dy;
      ctx.strokeStyle = '#B098D2';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(dx + 1, dy + 1, dw - 2, dh - 2);
      ctx.setLineDash([]);
      if (hover && inMap(hover.x, hover.y, doc.width, doc.height)) {
        const cx0 = dx + dw / 2;
        const cy0 = dy + dh / 2;
        const cx1 = Math.round(panX + hover.x * tileSize) + tileSize / 2;
        const cy1 = Math.round(panY + hover.y * tileSize) + tileSize / 2;
        ctx.strokeStyle = '#B098D2';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx0, cy0);
        ctx.lineTo(cx1, cy1);
        ctx.stroke();
      }
    }

    // —— selection highlight ——
    if (selected && inMap(selected.x, selected.y, doc.width, doc.height)) {
      const dx = Math.round(panX + selected.x * tileSize);
      const dy = Math.round(panY + selected.y * tileSize);
      const dw = Math.round(panX + (selected.x + 1) * tileSize) - dx;
      const dh = Math.round(panY + (selected.y + 1) * tileSize) - dy;
      ctx.strokeStyle = '#F2C94C';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
      // pixel "tabs" at corners
      ctx.fillStyle = '#F2C94C';
      const t = 3;
      ctx.fillRect(dx, dy, t, t);
      ctx.fillRect(dx + dw - t, dy, t, t);
      ctx.fillRect(dx, dy + dh - t, t, t);
      ctx.fillRect(dx + dw - t, dy + dh - t, t, t);
    }
  }, [
    doc,
    visibleLayers,
    currentLayer,
    zoom,
    panX,
    panY,
    hover,
    selected,
    rectPreview,
    swapSource,
    size,
  ]);

  // —— pointer interaction ——
  const dragState = useRef<
    | { kind: 'idle' }
    | { kind: 'pan'; lastX: number; lastY: number }
    | { kind: 'paint'; lastCellX: number; lastCellY: number }
    | { kind: 'rect'; startX: number; startY: number }
    | { kind: 'swap'; startX: number; startY: number }
  >({ kind: 'idle' });

  const localPos = (e: PointerEvent | React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const tileSize = BASE_TILE * zoom;
    const { x: sx, y: sy } = localPos(e);
    const cell = cellAt(sx, sy, panX, panY, tileSize);

    // pan: middle button or Space-held
    if (e.button === 1 || (e.button === 0 && spaceDownRef.current)) {
      dragState.current = { kind: 'pan', lastX: e.clientX, lastY: e.clientY };
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
      return;
    }

    if (e.button !== 0) return;

    // swap: Alt-held
    if (e.altKey) {
      if (!inMap(cell.x, cell.y, doc.width, doc.height)) return;
      dragState.current = { kind: 'swap', startX: cell.x, startY: cell.y };
      setSwapSource({ x: cell.x, y: cell.y });
      selectCell(cell.x, cell.y);
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
      return;
    }

    // selection always updates
    if (inMap(cell.x, cell.y, doc.width, doc.height)) {
      selectCell(cell.x, cell.y);
    }

    // picker: single op, also sets color
    if (tool === 'picker') {
      if (!inMap(cell.x, cell.y, doc.width, doc.height)) return;
      const t = doc.layers[currentLayer][cell.y][cell.x];
      if (t) setColor(t.color);
      return;
    }

    // brush/eraser
    if (mode === 'rect') {
      if (!inMap(cell.x, cell.y, doc.width, doc.height)) return;
      dragState.current = { kind: 'rect', startX: cell.x, startY: cell.y };
      setRectPreview({ x0: cell.x, y0: cell.y, x1: cell.x, y1: cell.y });
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
      return;
    }

    // pencil
    if (!inMap(cell.x, cell.y, doc.width, doc.height)) return;
    beginStroke();
    paintAt(cell.x, cell.y);
    dragState.current = { kind: 'paint', lastCellX: cell.x, lastCellY: cell.y };
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const tileSize = BASE_TILE * zoom;
    const { x: sx, y: sy } = localPos(e);
    const cell = cellAt(sx, sy, panX, panY, tileSize);
    setHover(
      inMap(cell.x, cell.y, doc.width, doc.height)
        ? { x: cell.x, y: cell.y }
        : null,
    );

    const ds = dragState.current;
    if (ds.kind === 'pan') {
      const dx = e.clientX - ds.lastX;
      const dy = e.clientY - ds.lastY;
      panBy(dx, dy);
      dragState.current = { kind: 'pan', lastX: e.clientX, lastY: e.clientY };
      return;
    }
    if (ds.kind === 'paint') {
      if (cell.x !== ds.lastCellX || cell.y !== ds.lastCellY) {
        // Bresenham-like line for fast drag
        const dx = Math.abs(cell.x - ds.lastCellX);
        const dy = Math.abs(cell.y - ds.lastCellY);
        const sx0 = ds.lastCellX < cell.x ? 1 : -1;
        const sy0 = ds.lastCellY < cell.y ? 1 : -1;
        let err = dx - dy;
        let cx = ds.lastCellX;
        let cy = ds.lastCellY;
        let safety = 0;
        while ((cx !== cell.x || cy !== cell.y) && safety++ < 200) {
          const e2 = 2 * err;
          if (e2 > -dy) {
            err -= dy;
            cx += sx0;
          }
          if (e2 < dx) {
            err += dx;
            cy += sy0;
          }
          if (inMap(cx, cy, doc.width, doc.height)) paintAt(cx, cy);
        }
        dragState.current = {
          kind: 'paint',
          lastCellX: cell.x,
          lastCellY: cell.y,
        };
      }
      return;
    }
    if (ds.kind === 'rect') {
      setRectPreview({ x0: ds.startX, y0: ds.startY, x1: cell.x, y1: cell.y });
      return;
    }
    if (ds.kind === 'swap') {
      // hover already updated; nothing else needed
      return;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragState.current;
    const tileSize = BASE_TILE * zoom;
    const { x: sx, y: sy } = localPos(e);
    const cell = cellAt(sx, sy, panX, panY, tileSize);
    if (ds.kind === 'rect') {
      beginStroke();
      paintRect(ds.startX, ds.startY, cell.x, cell.y);
      endStroke();
      setRectPreview(null);
    } else if (ds.kind === 'paint') {
      endStroke();
    } else if (ds.kind === 'swap') {
      if (inMap(cell.x, cell.y, doc.width, doc.height)) {
        useEditor.getState().beginStroke();
        swapTiles({ x: ds.startX, y: ds.startY }, { x: cell.x, y: cell.y });
        useEditor.getState().endStroke();
      }
      setSwapSource(null);
    }
    dragState.current = { kind: 'idle' };
  };

  const onPointerLeave = () => {
    setHover(null);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fx = e.clientX - rect.left;
    const fy = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    zoomBy(delta, { x: fx, y: fy });
  };

  // —— overlay status text ——
  const empty =
    doc.layers[0].every((row) => row.every((c) => !c)) &&
    doc.layers[1].every((row) => row.every((c) => !c)) &&
    doc.layers[2].every((row) => row.every((c) => !c));

  const HINT_KEY = 'tilewb.welcomeHintDismissed';
  const [hintAllowed, setHintAllowed] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) !== '1';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!empty && hintAllowed) {
      setHintAllowed(false);
      try {
        localStorage.setItem(HINT_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, [empty, hintAllowed]);

  return (
    <div
      ref={containerRef}
      className="map-canvas-wrap"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()}
      data-tool={tool}
      data-mode={mode}
    >
      <canvas ref={canvasRef} className="map-canvas" />
      {empty && hintAllowed && (
        <div className="map-empty-hint">
          <div className="map-empty-frame">
            <div className="map-empty-title">{t('canvas.hint.title')}</div>
            <div className="map-empty-rows">
              <div>
                <span className="pxl-kbd">B</span> {t('canvas.hint.tools')} ·{' '}
                <span className="pxl-kbd">E</span> {t('canvas.hint.eraser')} ·{' '}
                <span className="pxl-kbd">I</span> {t('canvas.hint.picker')}
              </div>
              <div>
                <span className="pxl-kbd">R</span> {t('canvas.hint.modes')} ·{' '}
                <span className="pxl-kbd">1</span>
                <span className="pxl-kbd">2</span>
                <span className="pxl-kbd">3</span> {t('canvas.hint.layers')}
              </div>
              <div>
                <span className="pxl-kbd">Z</span> {t('canvas.hint.undoRedo')}{' '}
                <span className="pxl-kbd">X</span>{' '}
                {t('canvas.hint.undoRedoSuffix')}
              </div>
              <div>
                <span className="pxl-kbd">{t('status.hint.zoom')}</span>{' '}
                {t('canvas.hint.zoomLabel')} ·{' '}
                <span className="pxl-kbd">{t('status.hint.pan')}</span>{' '}
                {t('canvas.hint.panLabel')} ·{' '}
                <span className="pxl-kbd">{t('status.hint.swap')}</span>{' '}
                {t('canvas.hint.swapLabel')}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* corner viewport indicators */}
      <div className="map-zoom-pill">
        <span>{Math.round(zoom * 100)}%</span>
      </div>
      <div className="map-shape-chip">
        {currentShape ? (
          <>
            <span className="map-shape-chip-name">
              {t(`shape.${currentShape}`) || SHAPES_BY_ID[currentShape]?.name || ''}
            </span>
            <span
              className="map-shape-chip-color"
              style={{ background: colorOf(currentColor) }}
            />
          </>
        ) : (
          <span style={{ color: 'var(--fg-mute)' }}>
            {t('canvas.unselectedShape')}
          </span>
        )}
      </div>
    </div>
  );
};
