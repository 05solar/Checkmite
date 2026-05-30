import type { CultureBox, Measurement } from '../types';

export const CULTURE_BOXES: CultureBox[] = [
  {
    id: 'box-A01',
    name: 'A동 1번 사육박스',
    startedAt: '2026-05-01',
    memo: '기본 배양 조건',
  },
  {
    id: 'box-A02',
    name: 'A동 2번 사육박스',
    startedAt: '2026-05-03',
    memo: '고습도 조건',
  },
  {
    id: 'box-B01',
    name: 'B동 1번 사육박스',
    startedAt: '2026-05-05',
    memo: '비교군',
  },
];

export const INITIAL_MEASUREMENTS: Measurement[] = [
  { id: 'm-A01-den-01', boxId: 'box-A01', type: 'density', measuredAt: '2026-05-01T09:00:00.000Z', countValue: 50, densityPerCm2: 0.9 },
  { id: 'm-A01-vit-01', boxId: 'box-A01', type: 'vitality', measuredAt: '2026-05-01T09:20:00.000Z', vitalityScore: 72, activeRatio: 0.78 },
  { id: 'm-A01-den-02', boxId: 'box-A01', type: 'density', measuredAt: '2026-05-10T09:00:00.000Z', countValue: 118, densityPerCm2: 2.1 },
  { id: 'm-A01-vit-02', boxId: 'box-A01', type: 'vitality', measuredAt: '2026-05-10T09:20:00.000Z', vitalityScore: 76, activeRatio: 0.82 },
  { id: 'm-A01-den-03', boxId: 'box-A01', type: 'density', measuredAt: '2026-05-20T09:00:00.000Z', countValue: 184, densityPerCm2: 3.4 },
  { id: 'm-A01-vit-03', boxId: 'box-A01', type: 'vitality', measuredAt: '2026-05-20T09:20:00.000Z', vitalityScore: 79, activeRatio: 0.86 },
  { id: 'm-A02-den-01', boxId: 'box-A02', type: 'density', measuredAt: '2026-05-03T10:00:00.000Z', countValue: 42, densityPerCm2: 0.8 },
  { id: 'm-A02-vit-01', boxId: 'box-A02', type: 'vitality', measuredAt: '2026-05-03T10:20:00.000Z', vitalityScore: 68, activeRatio: 0.74 },
  { id: 'm-A02-den-02', boxId: 'box-A02', type: 'density', measuredAt: '2026-05-14T10:00:00.000Z', countValue: 96, densityPerCm2: 1.9 },
  { id: 'm-A02-vit-02', boxId: 'box-A02', type: 'vitality', measuredAt: '2026-05-14T10:20:00.000Z', vitalityScore: 73, activeRatio: 0.8 },
  { id: 'm-B01-den-01', boxId: 'box-B01', type: 'density', measuredAt: '2026-05-05T11:00:00.000Z', countValue: 60, densityPerCm2: 1.1 },
  { id: 'm-B01-vit-01', boxId: 'box-B01', type: 'vitality', measuredAt: '2026-05-05T11:20:00.000Z', vitalityScore: 70, activeRatio: 0.76 },
  { id: 'm-B01-den-02', boxId: 'box-B01', type: 'density', measuredAt: '2026-05-18T11:00:00.000Z', countValue: 132, densityPerCm2: 2.5 },
  { id: 'm-B01-vit-02', boxId: 'box-B01', type: 'vitality', measuredAt: '2026-05-18T11:20:00.000Z', vitalityScore: 75, activeRatio: 0.81 },
];
