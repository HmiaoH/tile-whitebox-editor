import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../state/store';
import { LAYER_INFO } from '../state/types';
import { SHAPES, SHAPES_BY_ID } from '../data/shapes';
import { PALETTE, PALETTE_GROUPS, SWATCH_BY_ID, colorOf } from '../data/palette';
import { grayTileCanvas, tileCanvas } from '../lib/render';
import {
  IconClose,
  IconRotateLeft,
  IconRotateRight,
  IconTrash,
} from './icons';
import type { Rotation } from '../state/types';
import { useT } from '../i18n/useT';
import './Inspector.css';

const InspectorEmpty = ({ onClose }: { onClose: () => void }) => {
  const t = useT();
  return (
    <div className="insp-empty">
      <div className="insp-empty-bracket" />
      <div className="insp-empty-title">{t('inspector.empty.title')}</div>
      <div className="insp-empty-hint">{t('inspector.empty.hint1')}</div>
      <div className="insp-empty-hint" style={{ marginTop: 8 }}>
        <span className="pxl-kbd">Alt</span> {t('inspector.empty.hint2')}
      </div>
      <button className="insp-empty-close" onClick={onClose}>
        <IconClose /> {t('inspector.empty.close')}
      </button>
    </div>
  );
};

const ShapePreview = ({
  shapeId,
  color,
  rotation = 0,
  size = 64,
}: {
  shapeId: string | null;
  color?: string;
  rotation?: number;
  size?: number;
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);
    if (!shapeId) return;
    const src = color
      ? tileCanvas(shapeId, color, size)
      : grayTileCanvas(shapeId, size);
    ctx.imageSmoothingEnabled = false;
    if (rotation % 4 === 0) {
      ctx.drawImage(src, 0, 0);
    } else {
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate(((rotation % 4) * Math.PI) / 2);
      ctx.drawImage(src, -size / 2, -size / 2);
      ctx.restore();
    }
  }, [shapeId, color, rotation, size]);
  return (
    <div className="insp-preview">
      <canvas
        ref={ref}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

export const Inspector = () => {
  const t = useT();
  const selected = useEditor((s) => s.selected);
  const doc = useEditor((s) => s.doc);
  const updateSelectedTile = useEditor((s) => s.updateSelectedTile);
  const setTileExplicit = useEditor((s) => s.setTileExplicit);
  const clearSelection = useEditor((s) => s.clearSelection);

  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="inspector inspector-collapsed">
        <button
          className="insp-tab"
          onClick={() => setCollapsed(false)}
          title={t('inspector.expand')}
        >
          <span>{t('inspector.tab')}</span>
        </button>
      </div>
    );
  }

  const tile = selected ? doc.layers[selected.layer][selected.y]?.[selected.x] : null;
  const shapeDef = tile ? SHAPES_BY_ID[tile.shape] : null;
  const swatch = tile ? SWATCH_BY_ID[tile.color] : null;

  return (
    <aside className="inspector">
      <header className="insp-header">
        <div className="insp-title">
          <span className="insp-title-main">{t('inspector.title')}</span>
          <span className="insp-title-sub">{t('inspector.titleSub')}</span>
        </div>
        <div className="insp-actions">
          <button
            className="pxl-iconbtn"
            onClick={() => {
              setCollapsed(true);
            }}
            title={t('inspector.collapse')}
          >
            <IconClose />
          </button>
        </div>
      </header>

      {!selected || !tile ? (
        <InspectorEmpty onClose={() => clearSelection()} />
      ) : (
        <div className="insp-body">
          {/* —— summary —— */}
          <section className="insp-section">
            <div className="insp-summary">
              <ShapePreview
                shapeId={tile.shape}
                color={tile.color}
                rotation={tile.rotation ?? 0}
                size={80}
              />
              <div className="insp-summary-text">
                <div className="insp-coord">
                  <span className="pxl-label">{t('inspector.coords')}</span>
                  <span className="insp-coord-val">
                    ({selected.x}, {selected.y})
                  </span>
                </div>
                <div className="insp-rowmeta">
                  <span className="pxl-label">{t('inspector.shape')}</span>
                  <span className="insp-meta-val">
                    {shapeDef ? t(`shape.${shapeDef.id}`) : '—'}
                  </span>
                </div>
                <div className="insp-rowmeta">
                  <span className="pxl-label">{t('inspector.color')}</span>
                  <span className="insp-color-tag">
                    <span
                      className="insp-color-dot"
                      style={{ background: colorOf(tile.color) }}
                    />
                    {swatch ? t(`sw.${swatch.id}`) : tile.color}
                  </span>
                </div>
                <div className="insp-rowmeta">
                  <span className="pxl-label">{t('inspector.rotation')}</span>
                  <span className="insp-meta-val">
                    {((tile.rotation ?? 0) * 90)}°
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* —— layer —— */}
          <section className="insp-section">
            <div className="insp-section-h">
              <span className="pxl-label">{t('inspector.layer')}</span>
            </div>
            <div className="insp-layer-row">
              {LAYER_INFO.map((li) => (
                <button
                  key={li.id}
                  className="insp-layer-chip"
                  data-active={selected.layer === li.id}
                  onClick={() => {
                    if (selected.layer === li.id) return;
                    const old = tile;
                    const s = useEditor.getState();
                    s.beginStroke();
                    setTileExplicit(selected.x, selected.y, selected.layer, null);
                    setTileExplicit(selected.x, selected.y, li.id, old);
                    s.endStroke();
                    s.selectCell(selected.x, selected.y, li.id);
                  }}
                  style={{ ['--layer-tag' as never]: li.color }}
                >
                  <span className="insp-layer-chip-dot" />
                  {t(`layers.${li.key}`)}
                </button>
              ))}
            </div>
          </section>

          {/* —— rotation —— */}
          <section className="insp-section">
            <div className="insp-section-h">
              <span className="pxl-label">{t('inspector.rotation')}</span>
              <span className="insp-section-hint">
                <span className="pxl-kbd">,</span>
                <span className="pxl-kbd">.</span> {t('inspector.rotateHint')}
              </span>
            </div>
            <div className="insp-rot-row">
              <button
                className="insp-rot-icon"
                onClick={() => useEditor.getState().rotateSelectedBy(-1)}
                title={t('inspector.rotateLeft')}
              >
                <IconRotateLeft />
              </button>
              <div className="insp-rot-segment">
                {[0, 1, 2, 3].map((r) => (
                  <button
                    key={r}
                    className="insp-rot-cell"
                    data-active={(tile.rotation ?? 0) === r}
                    onClick={() =>
                      updateSelectedTile({ rotation: r as Rotation })
                    }
                  >
                    <ShapePreview
                      shapeId={tile.shape}
                      color={tile.color}
                      rotation={r}
                      size={28}
                    />
                    <span className="insp-rot-deg">{r * 90}°</span>
                  </button>
                ))}
              </div>
              <button
                className="insp-rot-icon"
                onClick={() => useEditor.getState().rotateSelectedBy(1)}
                title={t('inspector.rotateRight')}
              >
                <IconRotateRight />
              </button>
            </div>
          </section>

          {/* —— shape —— */}
          <section className="insp-section">
            <div className="insp-section-h">
              <span className="pxl-label">{t('inspector.shape')}</span>
              <span className="insp-section-hint">{t('inspector.shapeFilter')}</span>
            </div>
            <div className="insp-shape-grid">
              {SHAPES.filter((s) => {
                const layerName = ['floor', 'ground', 'roof'][selected.layer];
                return s.layer === layerName;
              }).map((s) => (
                <ShapePickerCard
                  key={s.id}
                  shapeId={s.id}
                  name={t(`shape.${s.id}`)}
                  active={tile.shape === s.id}
                  onPick={() => updateSelectedTile({ shape: s.id })}
                />
              ))}
            </div>
          </section>

          {/* —— color —— */}
          <section className="insp-section">
            <div className="insp-section-h">
              <span className="pxl-label">{t('inspector.colorTitle')}</span>
            </div>
            {PALETTE_GROUPS.map((g) => (
              <div key={g.id} className="insp-color-group">
                <div className="insp-color-group-name">
                  {t(`palette.group.${g.id}`)}
                </div>
                <div className="insp-color-grid">
                  {PALETTE.filter((s) => s.group === g.id).map((s) => (
                    <button
                      key={s.id}
                      className="insp-swatch"
                      data-active={tile.color === s.id}
                      onClick={() => updateSelectedTile({ color: s.id })}
                      title={t(`sw.${s.id}`)}
                      style={{ background: s.hex }}
                    >
                      <span className="insp-swatch-check" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="insp-section">
            <button
              className="pxl-btn insp-delete"
              data-warn="true"
              onClick={() => {
                setTileExplicit(selected.x, selected.y, selected.layer, null);
              }}
            >
              <IconTrash /> {t('inspector.delete')}
            </button>
          </section>
        </div>
      )}
    </aside>
  );
};

const ShapePickerCard = ({
  shapeId,
  name,
  active,
  onPick,
}: {
  shapeId: string;
  name: string;
  active: boolean;
  onPick: () => void;
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const SIZE = 36;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const src = grayTileCanvas(shapeId, SIZE);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0);
  }, [shapeId]);
  return (
    <button
      className="insp-shape-card"
      data-active={active}
      onClick={onPick}
      title={name}
    >
      <canvas
        ref={ref}
        width={SIZE}
        height={SIZE}
        style={{ width: SIZE, height: SIZE, imageRendering: 'pixelated' }}
      />
    </button>
  );
};
