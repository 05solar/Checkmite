export type TabId = 'detection' | 'density' | 'vitality' | 'models';
export type Theme = 'light' | 'dark';
export type PhaseId = 'idle' | 'file' | 'proc' | 'result';

export interface Version {
  id: string;
  tag: string;
  note: string;
  metric: string;
  date: string;
  beta?: boolean;
}

export interface ModelData {
  activeId: string;
  versions: Version[];
}

export interface Registry {
  detection: ModelData;
  density: ModelData;
  vitality: ModelData;
}

export type ModelKey = keyof Registry;

export interface DetectionBox {
  id: number;
  cls: 'predator' | 'prey';
  conf: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
