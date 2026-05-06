import { useState } from 'react';
import { Modal } from './Modal';
import { useEditor } from '../state/store';
import { useT } from '../i18n/useT';
import './NewMapModal.css';

const PRESETS = [
  { w: 32, h: 32, key: 's' as const },
  { w: 64, h: 64, key: 'm' as const },
  { w: 100, h: 100, key: 'l' as const },
];

export const NewMapModal = ({ onClose }: { onClose: () => void }) => {
  const t = useT();
  const newMap = useEditor((s) => s.newMap);
  const defaultName = t('common.untitled');
  const [w, setW] = useState(64);
  const [h, setH] = useState(64);
  const [name, setName] = useState(defaultName);

  const safeW = Math.max(8, Math.min(256, Math.round(w)));
  const safeH = Math.max(8, Math.min(256, Math.round(h)));

  return (
    <Modal
      title={t('new.title')}
      subtitle={t('new.titleSub')}
      onClose={onClose}
      width={460}
      footer={
        <>
          <button className="pxl-btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="pxl-btn tb-btn-primary"
            onClick={() => {
              newMap(safeW, safeH, name.trim() || defaultName);
              onClose();
            }}
          >
            {t('new.create')}
          </button>
        </>
      }
    >
      <div className="nm-row">
        <label className="pxl-label">{t('new.name')}</label>
        <input
          className="pxl-input nm-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
        />
      </div>

      <div className="nm-row">
        <label className="pxl-label">{t('new.sizePresets')}</label>
        <div className="nm-presets">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className="nm-preset"
              data-active={w === p.w && h === p.h}
              onClick={() => {
                setW(p.w);
                setH(p.h);
              }}
            >
              {t(`new.preset.${p.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="nm-grid">
        <div className="nm-cell">
          <label className="pxl-label">{t('new.width')}</label>
          <input
            className="pxl-input"
            type="number"
            min={8}
            max={256}
            value={w}
            onChange={(e) => setW(Number(e.target.value))}
          />
        </div>
        <div className="nm-cell">
          <label className="pxl-label">{t('new.height')}</label>
          <input
            className="pxl-input"
            type="number"
            min={8}
            max={256}
            value={h}
            onChange={(e) => setH(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="nm-summary">
        {t('new.summary.before')}{' '}
        <b>
          {safeW} × {safeH}
        </b>{' '}
        {t('new.summary.after')} {safeW * safeH} {t('new.summary.tilesSuffix')}
      </div>
    </Modal>
  );
};
