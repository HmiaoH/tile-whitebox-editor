import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './Modal';
import { useEditor } from '../state/store';
import { LAYER_INFO } from '../state/types';
import { downloadPng, renderExport, type ExportOptions } from '../lib/exportPng';
import { useT } from '../i18n/useT';
import './ExportModal.css';

const SCALE_OPTS = [
  { v: 1, label: '×1' },
  { v: 2, label: '×2' },
  { v: 3, label: '×3' },
  { v: 4, label: '×4' },
];

export const ExportModal = ({ onClose }: { onClose: () => void }) => {
  const t = useT();
  const doc = useEditor((s) => s.doc);
  const projectName = useEditor((s) => s.projectName);
  const [layers, setLayers] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [region, setRegion] = useState<'fit' | 'full'>('fit');
  const [scale, setScale] = useState(2);
  const [showGrid, setShowGrid] = useState(false);
  const [transparent, setTransparent] = useState(false);

  const opts: ExportOptions = useMemo(
    () => ({ layers, region, scale, showGrid, transparent }),
    [layers, region, scale, showGrid, transparent],
  );

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // render preview onto a small container; clamp to fit
    const out = renderExport(doc, opts);
    const dst = previewRef.current;
    const wrap = previewWrapRef.current;
    if (!dst || !wrap) return;
    const wrapW = wrap.clientWidth;
    const wrapH = wrap.clientHeight;
    const ratio = Math.min(wrapW / out.width, wrapH / out.height, 1);
    dst.width = out.width;
    dst.height = out.height;
    dst.style.width = `${out.width * ratio}px`;
    dst.style.height = `${out.height * ratio}px`;
    const ctx = dst.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(out, 0, 0);
  }, [doc, opts]);

  const onExport = () => {
    const out = renderExport(doc, opts);
    const filename = `${projectName.replace(/\s+/g, '_')}_${
      region === 'fit' ? 'fit' : 'full'
    }_x${scale}.png`;
    downloadPng(out, filename);
  };

  return (
    <Modal
      title={t('export.title')}
      subtitle={t('export.titleSub')}
      onClose={onClose}
      width={760}
      footer={
        <>
          <button className="pxl-btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="pxl-btn tb-btn-primary" onClick={onExport}>
            {t('export.download')}
          </button>
        </>
      }
    >
      <div className="ex-grid">
        <div className="ex-form">
          <div className="ex-row">
            <label className="pxl-label">{t('export.layers')}</label>
            <div className="ex-layers">
              {LAYER_INFO.map((li) => (
                <label key={li.id} className="ex-checkbox">
                  <input
                    className="pxl-checkbox"
                    type="checkbox"
                    checked={layers[li.id]}
                    onChange={(e) => {
                      const v = [...layers] as [boolean, boolean, boolean];
                      v[li.id] = e.target.checked;
                      setLayers(v);
                    }}
                  />
                  <span
                    className="ex-layer-dot"
                    style={{ background: li.color }}
                  />
                  {t(`layers.${li.key}`)}
                </label>
              ))}
            </div>
          </div>

          <div className="ex-row">
            <label className="pxl-label">{t('export.region')}</label>
            <div className="ex-segment">
              <button
                className="ex-seg"
                data-active={region === 'fit'}
                onClick={() => setRegion('fit')}
              >
                {t('export.region.fit')}
              </button>
              <button
                className="ex-seg"
                data-active={region === 'full'}
                onClick={() => setRegion('full')}
              >
                {t('export.region.full')}
              </button>
            </div>
            <div className="ex-hint">
              {region === 'fit'
                ? t('export.region.fitHint')
                : `${t('export.region.fullHintBefore')} ${doc.width}×${doc.height} ${t('export.region.fullHintAfter')}`}
            </div>
          </div>

          <div className="ex-row">
            <label className="pxl-label">{t('export.scale')}</label>
            <div className="ex-segment">
              {SCALE_OPTS.map((s) => (
                <button
                  key={s.v}
                  className="ex-seg"
                  data-active={scale === s.v}
                  onClick={() => setScale(s.v)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ex-row ex-row-inline">
            <label className="ex-checkbox">
              <input
                className="pxl-checkbox"
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              {t('export.showGrid')}
            </label>
            <label className="ex-checkbox">
              <input
                className="pxl-checkbox"
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
              />
              {t('export.transparent')}
            </label>
          </div>
        </div>

        <div className="ex-preview">
          <div className="ex-preview-h">
            <span className="pxl-label">{t('export.preview')}</span>
          </div>
          <div className="ex-preview-wrap" ref={previewWrapRef}>
            <canvas
              ref={previewRef}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
