import { useState, useEffect } from 'react';
import './App.css';
import { Nav } from './components/Nav';
import { DetectionPage } from './tabs/DetectionPage';
import { DensityPage } from './tabs/DensityPage';
import { VitalityPage } from './tabs/VitalityPage';
import type { TabId, Theme } from './types';

const isTabId = (value: string | null): value is TabId =>
  value === 'detection' || value === 'density' || value === 'vitality';

export function App() {
  const [tab, setTab] = useState<TabId>(
    () => {
      const saved = localStorage.getItem('cm-tab');
      return isTabId(saved) ? saved : 'detection';
    },
  );
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('cm-theme') as Theme) || 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cm-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cm-tab', tab);
  }, [tab]);

  return (
    <>
      <Nav
        tab={tab}
        onTab={setTab}
        theme={theme}
        onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />
      {tab === 'detection' && <DetectionPage />}
      {tab === 'density'   && <DensityPage />}
      {tab === 'vitality'  && <VitalityPage />}
    </>
  );
}
