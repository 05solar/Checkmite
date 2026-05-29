import type { Registry } from '../types';

export const INITIAL_REGISTRY: Registry = {
  detection: {
    activeId: 'd-240',
    versions: [
      { id: 'd-240',  tag: 'v2.4.0', note: '고해상도 데이터 재학습',         metric: '0.947', date: '2026.05.12' },
      { id: 'd-231',  tag: 'v2.3.1', note: '소형 개체 인식 개선',            metric: '0.931', date: '2026.03.28' },
      { id: 'd-220',  tag: 'v2.2.0', note: '천적/해충 분류 안정화',           metric: '0.918', date: '2026.01.15' },
      { id: 'd-250b', tag: 'v2.5.0', note: 'Transformer 백본 실험',          metric: '0.952', date: '2026.05.25', beta: true },
    ],
  },
  density: {
    activeId: 'den-180',
    versions: [
      { id: 'den-180', tag: 'v1.8.0', note: 'ByteTrack 트래커 적용', metric: '0.864', date: '2026.05.02' },
      { id: 'den-172', tag: 'v1.7.2', note: 'ID 스위칭 감소',        metric: '0.842', date: '2026.03.10' },
      { id: 'den-160', tag: 'v1.6.0', note: '프레임 보간 추가',      metric: '0.818', date: '2026.01.22' },
    ],
  },
  vitality: {
    activeId: 'v-130',
    versions: [
      { id: 'v-130', tag: 'v1.3.0', note: 'Optical flow 정밀화',   metric: '0.901', date: '2026.04.18' },
      { id: 'v-121', tag: 'v1.2.1', note: '정지 개체 판별 개선',   metric: '0.887', date: '2026.02.27' },
      { id: 'v-110', tag: 'v1.1.0', note: '히트맵 해상도 향상',    metric: '0.872', date: '2026.01.08' },
    ],
  },
};

export const MODEL_LABELS: Record<string, string> = {
  detection: '객체 탐지',
  density:   '밀도 측정',
  vitality:  '활력도 측정',
};

export const TAB_TO_MODEL: Record<string, keyof Registry> = {
  detection: 'detection',
  density:   'density',
  vitality:  'vitality',
  models:    'detection',
};

export const DEFAULT_METRIC: Record<keyof Registry, string> = {
  detection: '0.94',
  density:   '0.85',
  vitality:  '0.89',
};
