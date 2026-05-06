import { useEditor } from '../state/store';
import { PALETTE, PALETTE_GROUPS, SWATCH_BY_ID } from '../data/palette';
import { useT } from '../i18n/useT';
import './ColorPalette.css';

export const ColorPalette = () => {
  const t = useT();
  const currentColor = useEditor((s) => s.currentColor);
  const setColor = useEditor((s) => s.setColor);
  const cur = SWATCH_BY_ID[currentColor];

  return (
    <footer className="palette-strip">
      <div className="palette-current">
        <div className="palette-label">
          <span className="pxl-label">{t('palette.current')}</span>
          <span className="palette-current-name">
            {cur ? t(`sw.${cur.id}`) : '—'}
          </span>
          <span className="palette-current-hex">{cur?.hex ?? ''}</span>
        </div>
        <div
          className="palette-current-swatch"
          style={{ background: cur?.hex }}
          aria-label="current color preview"
        />
      </div>

      <div className="palette-groups">
        {PALETTE_GROUPS.map((g) => (
          <div key={g.id} className="palette-group">
            <div className="palette-group-name">
              {t(`palette.group.${g.id}`)}
            </div>
            <div className="palette-group-swatches">
              {PALETTE.filter((s) => s.group === g.id).map((s) => (
                <button
                  key={s.id}
                  className="palette-sw"
                  data-active={currentColor === s.id}
                  style={{ background: s.hex }}
                  title={`${t(`sw.${s.id}`)} · ${s.hex}`}
                  onClick={() => setColor(s.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
};
