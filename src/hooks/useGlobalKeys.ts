import { useEffect } from 'react';
import { useEditor } from '../state/store';

const isEditingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
};

export const useGlobalKeys = () => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditingTarget(e.target)) return;
      const k = e.key.toLowerCase();
      const s = useEditor.getState();
      if (k === 'z' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        s.undo();
        return;
      }
      if (k === 'x' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        s.redo();
        return;
      }
      if (k === 'b') {
        s.setTool('brush');
      } else if (k === 'e') {
        s.setTool('eraser');
      } else if (k === 'i') {
        s.setTool('picker');
      } else if (k === 'r') {
        s.setBrushMode(s.brushMode === 'rect' ? 'pencil' : 'rect');
      } else if (k === '1') {
        s.setLayer(0);
      } else if (k === '2') {
        s.setLayer(1);
      } else if (k === '3') {
        s.setLayer(2);
      } else if (k === '0') {
        s.resetView();
      } else if (k === '[') {
        s.setLeftCollapsed(!s.leftCollapsed);
      } else if (e.key === ',' || e.key === '<') {
        e.preventDefault();
        if (s.selected) s.rotateSelectedBy(-1);
        else s.rotateBrushBy(-1);
      } else if (e.key === '.' || e.key === '>') {
        e.preventDefault();
        if (s.selected) s.rotateSelectedBy(1);
        else s.rotateBrushBy(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};
