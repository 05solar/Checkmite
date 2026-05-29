import { useState, useEffect } from 'react';
import './App.css';
import { Nav } from './components/Nav';
import { DetectionPage } from './tabs/DetectionPage';
import { DensityPage } from './tabs/DensityPage';
import { VitalityPage } from './tabs/VitalityPage';
import { ModelsPage } from './tabs/ModelsPage';
import { INITIAL_REGISTRY, MODEL_LABELS, TAB_TO_MODEL, DEFAULT_METRIC } from './data/registry';
import type { TabId, Theme, Registry, ModelKey } from './types';

export function App() {
  const [tab, setTab] = useState<TabId>(
    () => (localStorage.getItem('cm-tab') as TabId) || 'detection',
  );
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('cm-theme') as Theme) || 'light',
  );
  const [registry, setRegistry] = useState<Registry>(INITIAL_REGISTRY);
  const [uploadTarget, setUploadTarget] = useState<ModelKey | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cm-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cm-tab', tab);
  }, [tab]);

  const modelKey = TAB_TO_MODEL[tab];
  const modelData = registry[modelKey];
  const activeVersion = modelData.versions.find((v) => v.id === modelData.activeId) ?? modelData.versions[0];

  const activate = (key: ModelKey, vid: string) =>
    setRegistry((r) => ({ ...r, [key]: { ...r[key], activeId: vid } }));

  const confirmUpload = (key: ModelKey, info: { tag: string; note: string }) => {
    setRegistry((r) => {
      const id = key + '-' + Date.now();
      const v = { id, tag: info.tag, note: info.note, metric: DEFAULT_METRIC[key], date: '2026.05.29' };
      return { ...r, [key]: { ...r[key], versions: [v, ...r[key].versions] } };
    });
    setUploadTarget(null);
  };

  return (
    <>
      <Nav
        tab={tab}
        onTab={setTab}
        theme={theme}
        onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        model={MODEL_LABELS[modelKey] ?? ''}
        versions={modelData.versions}
        activeId={modelData.activeId}
        onSelectVersion={(vid) => activate(modelKey, vid)}
      />
      {tab === 'detection' && <DetectionPage version={activeVersion} key={'det-' + activeVersion?.id} />}
      {tab === 'density'   && <DensityPage   version={activeVersion} key={'den-' + activeVersion?.id} />}
      {tab === 'vitality'  && <VitalityPage  version={activeVersion} key={'vit-' + activeVersion?.id} />}
      {tab === 'models'    && (
        <ModelsPage
          registry={registry}
          onActivate={activate}
          onUpload={(k) => setUploadTarget(k)}
          uploadTarget={uploadTarget}
          onCloseUpload={() => setUploadTarget(null)}
          onConfirmUpload={confirmUpload}
        />
      )}
    </>
  );
}
