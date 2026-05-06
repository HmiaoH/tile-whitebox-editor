import { useEditor } from '../state/store';
import { LAYER_INFO } from '../state/types';
import { useT } from '../i18n/useT';
import './StatusBar.css';

export const StatusBar = () => {
  const t = useT();
  const hover = useEditor((s) => s.hoverCell);
  const doc = useEditor((s) => s.doc);
  const currentLayer = useEditor((s) => s.currentLayer);
  const tool = useEditor((s) => s.currentTool);
  const mode = useEditor((s) => s.brushMode);
  const undoStack = useEditor((s) => s.undoStack.length);
  const redoStack = useEditor((s) => s.redoStack.length);
  const dirty = useEditor((s) => s.dirty);
  const zoom = useEditor((s) => s.zoom);

  const tilesPlaced =
    doc.layers[0].reduce(
      (sum, row) => sum + row.reduce((c, x) => c + (x ? 1 : 0), 0),
      0,
    ) +
    doc.layers[1].reduce(
      (sum, row) => sum + row.reduce((c, x) => c + (x ? 1 : 0), 0),
      0,
    ) +
    doc.layers[2].reduce(
      (sum, row) => sum + row.reduce((c, x) => c + (x ? 1 : 0), 0),
      0,
    );

  const toolName = t(`toolbar.${tool}`);
  const modeName = t(`toolbar.${mode}`);
  const layerInfo = LAYER_INFO[currentLayer];

  return (
    <footer className="statusbar">
      <div className="sb-cell">
        <span className="pxl-label">{t('status.size')}</span>
        <span className="sb-val">
          {doc.width} × {doc.height}
        </span>
      </div>
      <div className="sb-cell">
        <span className="pxl-label">{t('status.zoom')}</span>
        <span className="sb-val">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="sb-cell">
        <span className="pxl-label">{t('status.coords')}</span>
        <span className="sb-val">
          {hover ? `${hover.x}, ${hover.y}` : '— , —'}
        </span>
      </div>
      <div className="sb-cell">
        <span className="pxl-label">{t('status.layer')}</span>
        <span className="sb-val sb-layer">
          <span
            className="sb-layer-dot"
            style={{ background: layerInfo.color }}
          />
          {t(`layers.${layerInfo.key}`)}
        </span>
      </div>
      <div className="sb-cell">
        <span className="pxl-label">{t('status.tool')}</span>
        <span className="sb-val">
          {toolName} · {modeName}
        </span>
      </div>
      <div className="sb-cell">
        <span className="pxl-label">{t('status.placed')}</span>
        <span className="sb-val">
          {tilesPlaced} {t('status.tiles')}
        </span>
      </div>

      <div className="sb-spacer" />

      <div className="sb-hints">
        <span>
          <span className="pxl-kbd">Z</span> {t('status.hint.undo')} ({undoStack})
        </span>
        <span>
          <span className="pxl-kbd">X</span> {t('status.hint.redo')} ({redoStack})
        </span>
        <span>
          <span className="pxl-kbd">{t('status.hint.pan')}</span>{' '}
          {t('status.hint.panLabel')}
        </span>
        <span>
          <span className="pxl-kbd">{t('status.hint.zoom')}</span>{' '}
          {t('status.hint.zoomLabel')}
        </span>
        <span>
          <span className="pxl-kbd">{t('status.hint.swap')}</span>{' '}
          {t('status.hint.swapLabel')}
        </span>
      </div>

      <div className={`sb-dirty ${dirty ? 'on' : ''}`}>
        {dirty ? t('status.dirtyOn') : t('status.dirtyOff')}
      </div>
    </footer>
  );
};
