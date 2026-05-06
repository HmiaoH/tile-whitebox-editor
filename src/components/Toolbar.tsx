import { useRef, useState } from 'react';
import { useEditor } from '../state/store';
import { LAYER_INFO } from '../state/types';
import {
  IconBrush,
  IconEraser,
  IconExport,
  IconEye,
  IconEyeOff,
  IconNew,
  IconOpen,
  IconPencil,
  IconPicker,
  IconRect,
  IconRedo,
  IconSave,
  IconUndo,
} from './icons';
import { NewMapModal } from './NewMapModal';
import { ExportModal } from './ExportModal';
import { saveProjectFile, openProjectFile } from '../lib/projectFile';
import { useT } from '../i18n/useT';
import './Toolbar.css';

export const Toolbar = () => {
  const t = useT();
  const tool = useEditor((s) => s.currentTool);
  const setTool = useEditor((s) => s.setTool);
  const mode = useEditor((s) => s.brushMode);
  const setMode = useEditor((s) => s.setBrushMode);
  const layer = useEditor((s) => s.currentLayer);
  const setLayer = useEditor((s) => s.setLayer);
  const visibleLayers = useEditor((s) => s.visibleLayers);
  const toggleLayerVisible = useEditor((s) => s.toggleLayerVisible);
  const undoStack = useEditor((s) => s.undoStack.length);
  const redoStack = useEditor((s) => s.redoStack.length);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const projectName = useEditor((s) => s.projectName);
  const setProjectName = useEditor((s) => s.setProjectName);
  const dirty = useEditor((s) => s.dirty);
  const language = useEditor((s) => s.language);
  const setLanguage = useEditor((s) => s.setLanguage);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const onSave = () => {
    const file = useEditor.getState().toProjectFile();
    saveProjectFile(file);
    useEditor.getState().markClean();
  };

  const onOpen = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (dirty) {
      const ok = window.confirm(t('toolbar.confirmDiscardOpen'));
      if (!ok) return;
    }
    try {
      const file = await openProjectFile(f);
      useEditor.getState().loadDoc(file);
    } catch (err) {
      window.alert(`${t('toolbar.openFail')}${(err as Error).message}`);
    }
  };

  const onNew = () => {
    if (dirty) {
      const ok = window.confirm(t('toolbar.confirmDiscardNew'));
      if (!ok) return;
    }
    setNewOpen(true);
  };

  return (
    <header className="toolbar">
      <div className="tb-brand">
        <div className="tb-brand-mark" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="tb-brand-text">
          <div className="tb-app-name">{t('brand.name')}</div>
          <div className="tb-app-sub">{t('brand.sub')}</div>
        </div>
      </div>

      <div className="tb-lang-switch" title={t('toolbar.lang.tip')}>
        <button
          className="tb-lang-btn"
          data-active={language === 'zh'}
          onClick={() => setLanguage('zh')}
        >
          中
        </button>
        <button
          className="tb-lang-btn"
          data-active={language === 'en'}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>
      </div>

      <div className="tb-divider" />

      <div className="tb-group">
        <span className="pxl-label">{t('toolbar.project')}</span>
        {editingName ? (
          <input
            className="pxl-input tb-name-input"
            autoFocus
            defaultValue={projectName}
            onBlur={(e) => {
              setProjectName(e.target.value || t('common.untitled'));
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setEditingName(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="tb-name"
            onClick={() => setEditingName(true)}
            title={t('toolbar.projectEditTip')}
          >
            {dirty && <i className="tb-dirty-dot" />}
            {projectName}
          </button>
        )}
      </div>

      <div className="tb-divider" />

      <div className="tb-group">
        <span className="pxl-label">{t('toolbar.tools')}</span>
        <button
          className="pxl-iconbtn"
          data-active={tool === 'brush'}
          onClick={() => setTool('brush')}
          title={`${t('toolbar.brush')} (B)`}
        >
          <IconBrush />
        </button>
        <button
          className="pxl-iconbtn"
          data-active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          title={`${t('toolbar.eraser')} (E)`}
        >
          <IconEraser />
        </button>
        <button
          className="pxl-iconbtn"
          data-active={tool === 'picker'}
          onClick={() => setTool('picker')}
          title={`${t('toolbar.picker')} (I)`}
        >
          <IconPicker />
        </button>
      </div>

      <div className="tb-divider" />

      <div className="tb-group">
        <span className="pxl-label">{t('toolbar.mode')}</span>
        <button
          className="pxl-iconbtn"
          data-active={mode === 'pencil'}
          onClick={() => setMode('pencil')}
          title={`${t('toolbar.pencil')} (R)`}
        >
          <IconPencil />
        </button>
        <button
          className="pxl-iconbtn"
          data-active={mode === 'rect'}
          onClick={() => setMode('rect')}
          title={`${t('toolbar.rect')} (R)`}
        >
          <IconRect />
        </button>
      </div>

      <div className="tb-divider" />

      <div className="tb-group">
        <span className="pxl-label">{t('toolbar.layer')}</span>
        <div className="tb-layer-segment">
          {LAYER_INFO.map((li) => {
            const name = t(`layers.${li.key}`);
            return (
              <div key={li.id} className="tb-layer-cell">
                <button
                  className="tb-layer-btn"
                  data-active={layer === li.id}
                  onClick={() => setLayer(li.id)}
                  title={`${name} (${li.id + 1})`}
                  style={{ ['--layer-tag' as never]: li.color }}
                >
                  <span className="tb-layer-dot" />
                  <span className="tb-layer-name">{name}</span>
                  <span className="pxl-kbd">{li.id + 1}</span>
                </button>
                <button
                  className="tb-layer-eye"
                  data-on={visibleLayers[li.id]}
                  onClick={() => toggleLayerVisible(li.id)}
                  title={
                    visibleLayers[li.id]
                      ? t('toolbar.layerVisHide')
                      : t('toolbar.layerVisShow')
                  }
                >
                  {visibleLayers[li.id] ? <IconEye /> : <IconEyeOff />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="tb-spacer" />

      <div className="tb-group">
        <span className="pxl-label">{t('toolbar.history')}</span>
        <button
          className="pxl-iconbtn"
          onClick={undo}
          disabled={undoStack === 0}
          title={`${t('toolbar.undo')} (Z)`}
        >
          <IconUndo />
        </button>
        <span className="pxl-kbd">Z</span>
        <button
          className="pxl-iconbtn"
          onClick={redo}
          disabled={redoStack === 0}
          title={`${t('toolbar.redo')} (X)`}
        >
          <IconRedo />
        </button>
        <span className="pxl-kbd">X</span>
      </div>

      <div className="tb-divider" />

      <div className="tb-group">
        <span className="pxl-label">{t('toolbar.file')}</span>
        <button className="pxl-btn" onClick={onNew} title={t('toolbar.new')}>
          <IconNew /> {t('toolbar.new')}
        </button>
        <button className="pxl-btn" onClick={onOpen} title={t('toolbar.open')}>
          <IconOpen /> {t('toolbar.open')}
        </button>
        <button className="pxl-btn" onClick={onSave} title={t('toolbar.save')}>
          <IconSave /> {t('toolbar.save')}
        </button>
        <button
          className="pxl-btn tb-btn-primary"
          onClick={() => setExportOpen(true)}
          title={t('toolbar.export')}
        >
          <IconExport /> {t('toolbar.export')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".tilewb,.json,application/json"
          onChange={onFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {newOpen && <NewMapModal onClose={() => setNewOpen(false)} />}
      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
    </header>
  );
};
