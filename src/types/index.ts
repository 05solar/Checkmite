export type TabId = 'detection' | 'density' | 'growth' | 'boxes' | 'trash';
export type Theme = 'light' | 'dark';
export type PhaseId = 'idle' | 'file' | 'proc' | 'result';

export interface CultureBox {
  id: string;
  name: string;
  startedAt: string;
  memo?: string;
}

export type MeasurementType = 'detection' | 'density' | 'vitality';

export interface Measurement {
  id: string;
  boxId: string;
  type: MeasurementType;
  measuredAt: string;
  countValue?: number;
  densityPerCm2?: number;
  densityPerLiter?: number;
  vitalityScore?: number;
  activeRatio?: number;
  resultJson?: Record<string, unknown>;
}

export interface TrashedCultureBox {
  box: CultureBox;
  measurements: Measurement[];
  deletedAt: string;
}

export interface DetectionBox {
  id: number;
  cls: 'predator' | 'prey';
  conf: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
