export type TabId = 'detection' | 'density' | 'vitality';
export type Theme = 'light' | 'dark';
export type PhaseId = 'idle' | 'file' | 'proc' | 'result';

export interface DetectionBox {
  id: number;
  cls: 'predator' | 'prey';
  conf: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
