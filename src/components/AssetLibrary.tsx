import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor } from '../state/store';
import { SHAPES, SHAPES_BY_ID, type LayerId } from '../data/shapes';
import { LAYER_INFO } from '../state/types';
import { grayTileCanvas } from '../lib/render';
import {
  IconCollapseLeft,
  IconCollapseRight,
  IconRotateLeft,
  IconRotateRight,
} from './icons';
import { useT } from '../i18n/useT';
import './AssetLibrary.css';

const PREVIEW_PX = 56;

const AssetCard = ({
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
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const src = grayTileCanvas(shapeId, PREVIEW_PX);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0);
  }, [shapeId]);

  return (
    <button
      type="button"
      className="asset-card"
      data-active={active}
      onClick={onPick}
      title={name}
    >
      <div className="asset-card-thumb">
        <canvas
          ref={ref}
          width={PREVIEW_PX}
          height={PREVIEW_PX}
          style={{ width: PREVIEW_PX, height: PREVIEW_PX, imageRendering: 'pixelated' }}
        />
      </div>
      <div className="asset-card-name">{name}</div>
    </button>
  );
};

const LAYER_TAB_INFO: Array<{ id: LayerId; idx: 0 | 1 | 2 }> = [
  { id: 'floor', idx: 0 },
  { id: 'ground', idx: 1 },
  { id: 'roof', idx: 2 },
];

export const AssetLibrary = () => {
  const t = useT();
  const collapsed = useEditor((s) => s.leftCollapsed);
  const setCollapsed = useEditor((s) => s.setLeftCollapsed);
  const currentShape = useEditor((s) => s.currentShape);
  const setShape = useEditor((s) => s.setShape);
  const currentLayer = useEditor((s) => s.currentLayer);

  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<LayerId | 'all'>('all');

  // sync tab to current layer for convenience
  useEffect(() => {
    setTab(LAYER_TAB_INFO[currentLayer].id);
  }, [currentLayer]);

  const shapes = useMemo(() => {
    const lower = filter.toLowerCase();
    return SHAPES.filter((s) => (tab === 'all' ? true : s.layer === tab)).filter(
      (s) => {
        if (!filter) return true;
        const localized = t(`shape.${s.id}`);
        return (
          localized.toLowerCase().includes(lower) ||
          s.id.toLowerCase().includes(lower)
        );
      },
    );
  }, [tab, filter, t]);

  const groupedByLayer = useMemo(() => {
    const out: Record<LayerId, typeof SHAPES> = { floor: [], ground: [], roof: [] };
    for (const s of shapes) out[s.layer].push(s);
    return out;
  }, [shapes]);

  if (collapsed) {
    return (
      <aside className="asset-library collapsed">
        <button
          className="al-collapse-btn"
          onClick={() => setCollapsed(false)}
          title={t('assets.expand')}
        >
          <IconCollapseRight />
        </button>
        <div className="al-collapsed-label">{t('assets.collapsedLabel')}</div>
      </aside>
    );
  }

  return (
    <aside className="asset-library">
      <div className="al-header">
        <div className="al-title">
          <span className="al-title-main">{t('assets.title')}</span>
          <span className="al-title-sub">
            {t('assets.titleSub')} · {SHAPES.length}
          </span>
        </div>
        <button
          className="al-collapse-btn"
          onClick={() => setCollapsed(true)}
          title={t('assets.collapse')}
        >
          <IconCollapseLeft />
        </button>
      </div>

      <div className="al-controls">
        <input
          className="pxl-input al-search"
          placeholder={t('assets.search')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="al-tabs">
          <button
            className="al-tab"
            data-active={tab === 'all'}
            onClick={() => setTab('all')}
          >
            {t('assets.tab.all')}
          </button>
          {LAYER_TAB_INFO.map((l) => (
            <button
              key={l.id}
              className="al-tab"
              data-active={tab === l.id}
              onClick={() => setTab(l.id)}
            >
              {t(`layers.short.${l.id}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="al-body">
        {(['floor', 'ground', 'roof'] as LayerId[]).map((lid) => {
          const items = groupedByLayer[lid];
          if (!items.length) return null;
          const meta = LAYER_INFO[LAYER_TAB_INFO.find((l) => l.id === lid)!.idx];
          return (
            <section key={lid} className="al-section">
              <header className="al-section-h">
                <span
                  className="al-section-dot"
                  style={{ background: meta.color }}
                />
                <span className="al-section-name">{t(`layers.${meta.key}`)}</span>
                <span className="al-section-count">{items.length}</span>
              </header>
              <div className="al-grid">
                {items.map((s) => (
                  <AssetCard
                    key={s.id}
                    shapeId={s.id}
                    name={t(`shape.${s.id}`)}
                    active={currentShape === s.id}
                    onPick={() => setShape(s.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
        {!shapes.length && <div className="al-empty">{t('assets.empty')}</div>}
      </div>

      <footer className="al-footer">
        <div className="al-footer-row">
          <span className="pxl-label">{t('assets.currentShape')}</span>
          <span className="al-footer-value">
            {currentShape
              ? t(`shape.${currentShape}`) ||
                SHAPES_BY_ID[currentShape]?.name ||
                '—'
              : t('assets.none')}
          </span>
        </div>
        <BrushRotationRow />
        <div className="al-footer-hint">{t('assets.hint')}</div>
      </footer>
    </aside>
  );
};

const BrushRotationRow = () => {
  const t = useT();
  const rot = useEditor((s) => s.currentRotation);
  const rotateBy = useEditor((s) => s.rotateBrushBy);
  const setRot = useEditor((s) => s.setRotation);
  return (
    <div className="al-rot-row">
      <span className="pxl-label">{t('assets.brushRotation')}</span>
      <div className="al-rot-controls">
        <button
          className="al-rot-icon"
          onClick={() => rotateBy(-1)}
          title={t('assets.rotateLeft')}
        >
          <IconRotateLeft />
        </button>
        <div className="al-rot-segment">
          {[0, 1, 2, 3].map((r) => (
            <button
              key={r}
              className="al-rot-cell"
              data-active={rot === r}
              onClick={() => setRot(r as 0 | 1 | 2 | 3)}
            >
              {r * 90}°
            </button>
          ))}
        </div>
        <button
          className="al-rot-icon"
          onClick={() => rotateBy(1)}
          title={t('assets.rotateRight')}
        >
          <IconRotateRight />
        </button>
      </div>
    </div>
  );
};
