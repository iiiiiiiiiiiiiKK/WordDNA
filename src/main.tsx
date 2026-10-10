import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initStorage } from './lib/storage/db';
import { initTheme } from './lib/theme';
import { useSettingsStore } from './store/useSettingsStore';
import { useLearningStore } from './store/useLearningStore';
import { useCollectionStore } from './store/useCollectionStore';
import './index.css';

async function bootstrap() {
  initTheme();
  await initStorage();
  await Promise.all([
    useSettingsStore.getState().hydrate(),
    useLearningStore.getState().hydrate(),
    useCollectionStore.getState().hydrate(),
  ]);

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* 忽略 SW 注册失败 */
      });
    });
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
