import type { CultureBox, Measurement, TrashedCultureBox } from '../types';

const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface DetectionResult {
  measurementId: string;
  boxId: string;
  type: 'detection';
  measuredAt: string;
  detection: {
    countValue: number;
    boxes: Array<{ className: string; confidence: number; x: number; y: number; width: number; height: number }>;
  };
  measurement: Partial<Measurement>;
}

export interface DensityResult {
  measurementId: string;
  boxId: string;
  type: 'density';
  measuredAt: string;
  density: {
    currentDensityPerCm2: number;
    measuredAreaCm2: number;
    peakCount: number;
    averageCount: number;
  };
  measurement: Partial<Measurement>;
}

export interface VitalityResult {
  measurementId: string;
  boxId: string;
  type: 'vitality';
  measuredAt: string;
  vitality: {
    score: number;
    activeRatio: number;
    trend: number[];
  };
  measurement: Partial<Measurement>;
}

export interface GrowthResult {
  boxId: string;
  from: string;
  to: string;
  days: number;
  currentDensityPerCm2: number;
  firstDensityPerCm2: number;
  densityChangePerCm2: number;
  densityChangeRatePercent: number;
  densityGrowthPerDay: number;
  logDensityGrowthPerDay: number;
  growthLabel: string;
  densityTrend: Array<{ date: string; densityPerCm2: number }>;
  vitalityTrend: Array<{ date: string; score: number }>;
}

export const api = {
  listBoxes: () => req<CultureBox[]>('/culture-boxes'),
  createBox: (data: Omit<CultureBox, 'id'>) =>
    req<CultureBox>('/culture-boxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateBox: (id: string, data: Partial<Omit<CultureBox, 'id'>>) =>
    req<CultureBox>(`/culture-boxes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteBox: (id: string) =>
    req<{ box: CultureBox; measurements: Measurement[] }>(`/culture-boxes/${id}`, { method: 'DELETE' }),

  listTrash: () => req<TrashedCultureBox[]>('/trash/culture-boxes'),
  restoreBox: (id: string) =>
    req<{ box: CultureBox; measurements: Measurement[] }>(`/trash/culture-boxes/${id}/restore`, { method: 'POST' }),

  listMeasurements: (boxId: string) =>
    req<Measurement[]>(`/culture-boxes/${boxId}/measurements`),
  getGrowth: (boxId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return req<GrowthResult>(`/culture-boxes/${boxId}/growth${qs ? `?${qs}` : ''}`);
  },

  analyzeDetection: (boxId: string, file: File) => {
    const form = new FormData();
    form.append('boxId', boxId);
    form.append('file', file);
    return req<DetectionResult>('/analysis/detection', { method: 'POST', body: form });
  },
  analyzeDensity: (boxId: string, file: File, measuredAreaCm2: number) => {
    const form = new FormData();
    form.append('boxId', boxId);
    form.append('measuredAreaCm2', String(measuredAreaCm2));
    form.append('file', file);
    return req<DensityResult>('/analysis/density', { method: 'POST', body: form });
  },
  analyzeVitality: (boxId: string, file: File) => {
    const form = new FormData();
    form.append('boxId', boxId);
    form.append('file', file);
    return req<VitalityResult>('/analysis/vitality', { method: 'POST', body: form });
  },
};
