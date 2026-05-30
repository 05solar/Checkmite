import { useState, useEffect } from 'react';
import './App.css';
import { Nav } from './components/Nav';
import { DetectionPage } from './tabs/DetectionPage';
import { DensityPage } from './tabs/DensityPage';
import { VitalityPage } from './tabs/VitalityPage';
import { GrowthPage } from './tabs/GrowthPage';
import { TrashPage } from './tabs/TrashPage';
import { CULTURE_BOXES, INITIAL_MEASUREMENTS } from './data/culture';
import type { CultureBox, Measurement, TabId, Theme, TrashedCultureBox } from './types';

const isTabId = (value: string | null): value is TabId =>
  value === 'detection' || value === 'density' || value === 'vitality' || value === 'growth' || value === 'trash';

const loadCultureBoxes = () => {
  try {
    const saved = localStorage.getItem('cm-culture-boxes');
    if (!saved) return CULTURE_BOXES;
    const parsed = JSON.parse(saved) as CultureBox[];
    return parsed.length > 0 ? parsed : CULTURE_BOXES;
  } catch {
    return CULTURE_BOXES;
  }
};

const loadTrashDb = () => {
  try {
    const saved = localStorage.getItem('cm-trash-db');
    if (!saved) return [];
    return JSON.parse(saved) as TrashedCultureBox[];
  } catch {
    return [];
  }
};

export function App() {
  const [boxes, setBoxes] = useState<CultureBox[]>(loadCultureBoxes);
  const [trashDb, setTrashDb] = useState<TrashedCultureBox[]>(loadTrashDb);
  const [tab, setTab] = useState<TabId>(
    () => {
      const saved = localStorage.getItem('cm-tab');
      return isTabId(saved) ? saved : 'detection';
    },
  );
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('cm-theme') as Theme) || 'light',
  );
  const [selectedBoxId, setSelectedBoxId] = useState(
    () => {
      const saved = localStorage.getItem('cm-box-id');
      const initialBoxes = loadCultureBoxes();
      return initialBoxes.some((box) => box.id === saved) ? saved as string : initialBoxes[0].id;
    },
  );
  const [measurements, setMeasurements] = useState<Measurement[]>(INITIAL_MEASUREMENTS);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cm-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cm-tab', tab);
  }, [tab]);

  useEffect(() => {
    localStorage.setItem('cm-culture-boxes', JSON.stringify(boxes));
    if (!boxes.some((box) => box.id === selectedBoxId)) {
      setSelectedBoxId(boxes[0]?.id ?? '');
    }
  }, [boxes, selectedBoxId]);

  useEffect(() => {
    localStorage.setItem('cm-trash-db', JSON.stringify(trashDb));
  }, [trashDb]);

  useEffect(() => {
    localStorage.setItem('cm-box-id', selectedBoxId);
  }, [selectedBoxId]);

  const addCultureBox = (box: Omit<CultureBox, 'id'>) => {
    const id = `box-${Date.now().toString(36)}`;
    const next = { ...box, id };
    setBoxes((items) => [...items, next]);
    setSelectedBoxId(id);
  };

  const deleteCultureBox = (id: string) => {
    if (boxes.length <= 1) return;
    const target = boxes.find((box) => box.id === id);
    if (!target) return;
    const deletedMeasurements = measurements.filter((item) => item.boxId === id);
    const nextBoxes = boxes.filter((box) => box.id !== id);
    setTrashDb((items) => [
      {
        box: target,
        measurements: deletedMeasurements,
        deletedAt: new Date().toISOString(),
      },
      ...items,
    ]);
    setBoxes(nextBoxes);
    setMeasurements((items) => items.filter((item) => item.boxId !== id));
    if (selectedBoxId === id) {
      setSelectedBoxId(nextBoxes[0].id);
    }
  };

  const restoreCultureBox = (id: string) => {
    const target = trashDb.find((item) => item.box.id === id);
    if (!target) return;
    setBoxes((items) => {
      const restoredId = items.some((box) => box.id === target.box.id)
        ? `${target.box.id}-restored-${Date.now().toString(36)}`
        : target.box.id;
      const restoredBox = { ...target.box, id: restoredId };
      setSelectedBoxId(restoredId);
      setMeasurements((current) => [
        ...current,
        ...target.measurements.map((measurement) => ({ ...measurement, boxId: restoredId })),
      ]);
      return [...items, restoredBox];
    });
    setTrashDb((items) => items.filter((item) => item.box.id !== id));
  };

  const addMeasurement = (measurement: Omit<Measurement, 'id' | 'measuredAt'>) => {
    setMeasurements((items) => [
      ...items,
      {
        ...measurement,
        id: `${measurement.type}-${Date.now()}`,
        measuredAt: new Date().toISOString(),
      },
    ]);
  };

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
          onBoxChange={setSelectedBoxId}
          onMeasurementAdd={addMeasurement}
        />
      )}
      {tab === 'density' && (
        <DensityPage
          boxes={boxes}
          selectedBoxId={selectedBoxId}
          onBoxChange={setSelectedBoxId}
          onMeasurementAdd={addMeasurement}
        />
      )}
      {tab === 'vitality' && (
        <VitalityPage
          boxes={boxes}
          selectedBoxId={selectedBoxId}
          onBoxChange={setSelectedBoxId}
          onMeasurementAdd={addMeasurement}
        />
      )}
      {tab === 'growth' && (
        <GrowthPage
          boxes={boxes}
          measurements={measurements}
          selectedBoxId={selectedBoxId}
          onBoxChange={setSelectedBoxId}
          onBoxAdd={addCultureBox}
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
