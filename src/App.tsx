import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { AssetLibrary } from './components/AssetLibrary';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { ColorPalette } from './components/ColorPalette';
import { StatusBar } from './components/StatusBar';
import { useEditor } from './state/store';
import { useGlobalKeys } from './hooks/useGlobalKeys';
import { useT } from './i18n/useT';
import './App.css';

export default function App() {
  const dirty = useEditor((s) => s.dirty);
  const projectName = useEditor((s) => s.projectName);
  const language = useEditor((s) => s.language);
  const t = useT();

  useGlobalKeys();

  useEffect(() => {
    document.title = `${dirty ? '● ' : ''}${projectName} · ${t('app.title.suffix')}`;
  }, [dirty, projectName, t]);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  return (
    <div className="app">
      <Toolbar />
      <AssetLibrary />
      <main className="app-center">
        <div className="canvas-host">
          <Canvas />
          <Inspector />
        </div>
        <ColorPalette />
      </main>
      <StatusBar />
    </div>
  );
}
