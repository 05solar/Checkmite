import { measurementRepository } from '../repositories/measurement.repository.js';
import { cultureBoxRepository } from '../repositories/culture-box.repository.js';
import { notFound } from '../utils/http-error.js';

const dateOnly = (iso) => iso.slice(0, 10);
const daysBetween = (from, to) => {
  const start = new Date(from);
  const end = new Date(to);
  const diff = Math.round((end - start) / 86_400_000);
  return Math.max(diff, 1);
};

const round = (value, digits = 3) => Number(value.toFixed(digits));

export const growthService = {
  async getGrowth(boxId, query) {
    const box = await cultureBoxRepository.findById(boxId);
    if (!box) throw notFound('사육박스를 찾을 수 없습니다.');

    const measurements = await measurementRepository.findByBoxId(boxId);
    const from = query.from || box.startedAt;
    const to = query.to || dateOnly(new Date().toISOString());

    const inRange = measurements.filter((item) => {
      const date = dateOnly(item.measuredAt);
      return date >= from && date <= to;
    });

    const densityTrend = inRange
      .filter((item) => item.type === 'density' && item.densityPerCm2 !== undefined)
      .map((item) => ({
        date: dateOnly(item.measuredAt),
        densityPerCm2: item.densityPerCm2,
      }));

    const vitalityTrend = inRange
      .filter((item) => item.type === 'vitality' && item.vitalityScore !== undefined)
      .map((item) => ({
        date: dateOnly(item.measuredAt),
        score: item.vitalityScore,
      }));

    const first = densityTrend[0];
    const latest = densityTrend[densityTrend.length - 1];
    const days = first && latest ? daysBetween(first.date, latest.date) : daysBetween(from, to);
    const firstDensity = first?.densityPerCm2 || 0;
    const currentDensity = latest?.densityPerCm2 || 0;
    const densityChange = currentDensity - firstDensity;
    const densityChangeRate = firstDensity > 0 ? (densityChange / firstDensity) * 100 : 0;
    const densityGrowthPerDay = densityChange / days;
    const logDensityGrowth = firstDensity > 0 && currentDensity > 0
      ? (Math.log(currentDensity) - Math.log(firstDensity)) / days
      : 0;

    return {
      boxId,
      from,
      to,
      days,
      currentDensityPerCm2: round(currentDensity),
      firstDensityPerCm2: round(firstDensity),
      densityChangePerCm2: round(densityChange),
      densityChangeRatePercent: round(densityChangeRate, 1),
      densityGrowthPerDay: round(densityGrowthPerDay, 4),
      logDensityGrowthPerDay: round(logDensityGrowth, 6),
      growthLabel: densityChangeRate > 20 ? '증식 활발' : densityChangeRate < -10 ? '감소 추세' : '유지 관찰',
      densityTrend,
      vitalityTrend,
    };
  },
};
