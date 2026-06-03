import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Nav } from './components/Nav';
import { DetectionPage } from './tabs/DetectionPage';
import { DensityPage } from './tabs/DensityPage';
import { GrowthPage } from './tabs/GrowthPage';
import { CultureBoxesPage } from './tabs/CultureBoxesPage';
import { TrashPage } from './tabs/TrashPage';
import { api } from './api/client';
import type { CultureBox, TabId, Theme, TrashedCultureBox } from './types';

const isTabId = (value: string | null): value is TabId =>
  value === 'detection' || value === 'density' || value === 'growth' || value === 'boxes' || value === 'trash';

const savedTab = (): TabId => {
  const saved = localStorage.getItem('cm-tab');
  if (saved === 'vitality') return 'density';
  return isTabId(saved) ? saved : 'detection';
};

export function App() {
  const [boxes, setBoxes] = useState<CultureBox[]>([]);
  const [trashDb, setTrashDb] = useState<TrashedCultureBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>(
    savedTab,
  );
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('cm-theme') as Theme) || 'light',
  );
  const [selectedBoxId, setSelectedBoxId] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cm-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cm-tab', tab);
  }, [tab]);

  useEffect(() => {
    Promise.all([api.listBoxes(), api.listTrash()])
      .then(([fetchedBoxes, fetchedTrash]) => {
        setBoxes(fetchedBoxes);
        setTrashDb(fetchedTrash);
        const saved = localStorage.getItem('cm-box-id');
        setSelectedBoxId(
          saved && fetchedBoxes.some((b) => b.id === saved) ? saved : (fetchedBoxes[0]?.id ?? ''),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBoxId) localStorage.setItem('cm-box-id', selectedBoxId);
  }, [selectedBoxId]);

  const handleBoxChange = useCallback((id: string) => {
    setSelectedBoxId(id);
  }, []);

  const addCultureBox = useCallback(async (data: Omit<CultureBox, 'id'>) => {
    try {
      const created = await api.createBox(data);
      setBoxes((prev) => [...prev, created]);
      setSelectedBoxId(created.id);
    } catch (e) {
      console.error('사육박스 추가 실패', e);
      throw e;
    }
  }, []);

  const updateCultureBox = useCallback(async (id: string, data: Partial<Omit<CultureBox, 'id'>>) => {
    try {
      const updated = await api.updateBox(id, data);
      setBoxes((prev) => prev.map((box) => (box.id === id ? updated : box)));
      setSelectedBoxId(updated.id);
    } catch (e) {
      console.error('사육박스 수정 실패', e);
      throw e;
    }
  }, []);

  const deleteCultureBox = useCallback(async (id: string) => {
    if (boxes.length <= 1) return;
    try {
      const result = await api.deleteBox(id);
      const now = new Date().toISOString();
      setBoxes((prev) => {
        const next = prev.filter((b) => b.id !== id);
        if (selectedBoxId === id) setSelectedBoxId(next[0]?.id ?? '');
        return next;
      });
      setTrashDb((prev) => [
        { box: result.box, measurements: [], deletedAt: now },
        ...prev,
      ]);
    } catch (e) {
      console.error('사육박스 삭제 실패', e);
    }
  }, [boxes.length, selectedBoxId]);

  const restoreCultureBox = useCallback(async (id: string) => {
    try {
      const { box } = await api.restoreBox(id);
      setBoxes((prev) => [...prev, box]);
      setTrashDb((prev) => prev.filter((item) => item.box.id !== id));
      setSelectedBoxId(box.id);
    } catch (e) {
      console.error('사육박스 복구 실패', e);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-2)' }}>
        서버 연결 중...
      </div>
    );
  }

  return (
    <>
      <Nav
        tab={tab}
        onTab={setTab}
        theme={theme}
        onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />
      {tab === 'detection' && (
        <DetectionPage
          boxes={boxes}
          selectedBoxId={selectedBoxId}
          onBoxChange={handleBoxChange}
          onBoxCreate={addCultureBox}
        />
      )}
      {tab === 'density' && (
        <DensityPage
          boxes={boxes}
          selectedBoxId={selectedBoxId}
          onBoxChange={handleBoxChange}
          onBoxCreate={addCultureBox}
        />
      )}
      {tab === 'growth' && (
        <GrowthPage
          boxes={boxes}
          selectedBoxId={selectedBoxId}
          onBoxChange={handleBoxChange}
          onBoxCreate={addCultureBox}
        />
      )}
      {tab === 'boxes' && (
        <CultureBoxesPage
          boxes={boxes}
          selectedBoxId={selectedBoxId}
          onBoxChange={handleBoxChange}
          onBoxCreate={addCultureBox}
          onBoxUpdate={updateCultureBox}
          onBoxDelete={deleteCultureBox}
        />
      )}
      {tab === 'trash' && (
        <TrashPage
          items={trashDb}
          onRestore={restoreCultureBox}
        />
      )}
    </>
  );
}
