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
const changeRate = (first, current) => (first > 0 ? ((current - first) / first) * 100 : 0);
const logGrowth = (first, current, days) => (
  first > 0 && current > 0 ? (Math.log(current) - Math.log(first)) / days : 0
);
const RECENT_DROP_THRESHOLD_PERCENT = -20;

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
      .filter((item) => item.type === 'density' && item.densityPerLiter !== undefined)
      .map((item) => ({
        date: dateOnly(item.measuredAt),
        densityPerLiter: item.densityPerLiter,
      }));

    const countTrend = inRange
      .filter((item) => item.type === 'density' && item.densityPerLiter !== undefined)
      .map((item) => ({
        date: dateOnly(item.measuredAt),
        countValue: item.densityPerLiter,
      }));

    const vitalityTrend = inRange
      .filter((item) => item.type === 'vitality' && item.vitalityScore !== undefined)
      .map((item) => ({
        date: dateOnly(item.measuredAt),
        score: item.vitalityScore,
      }));

    const firstCountPoint = countTrend[0];
    const latestCountPoint = countTrend[countTrend.length - 1];
    const previousCountPoint = countTrend[countTrend.length - 2];
    const firstDensityPoint = densityTrend[0];
    const latestDensityPoint = densityTrend[densityTrend.length - 1];
    const firstVitalityPoint = vitalityTrend[0];
    const latestVitalityPoint = vitalityTrend[vitalityTrend.length - 1];
    const previousVitalityPoint = vitalityTrend[vitalityTrend.length - 2];
    const days = firstCountPoint && latestCountPoint
      ? daysBetween(firstCountPoint.date, latestCountPoint.date)
      : daysBetween(from, to);

    const firstCount = firstCountPoint?.countValue || 0;
    const currentCount = latestCountPoint?.countValue || 0;
    const countChange = currentCount - firstCount;
    const countChangeRate = changeRate(firstCount, currentCount);
    const countGrowthPerDay = countChange / days;
    const logCountGrowth = logGrowth(firstCount, currentCount, days);
    const previousCount = previousCountPoint?.countValue || 0;
    const recentCountChange = currentCount - previousCount;
    const recentCountChangeRate = previousCountPoint
      ? changeRate(previousCount, currentCount)
      : 0;

    const firstDensity = firstDensityPoint?.densityPerLiter || 0;
    const currentDensity = latestDensityPoint?.densityPerLiter || 0;
    const densityChange = currentDensity - firstDensity;
    const densityChangeRate = changeRate(firstDensity, currentDensity);
    const densityGrowthPerDay = densityChange / days;
    const logDensityGrowth = logGrowth(firstDensity, currentDensity, days);

    const firstVitalityScore = firstVitalityPoint?.score || 0;
    const latestVitalityScore = latestVitalityPoint?.score || 0;
    const vitalityChange = latestVitalityScore - firstVitalityScore;
    const vitalityChangeRate = changeRate(firstVitalityScore, latestVitalityScore);
    const previousVitalityScore = previousVitalityPoint?.score || 0;
    const recentVitalityChange = latestVitalityScore - previousVitalityScore;
    const recentVitalityChangeRate = previousVitalityPoint
      ? changeRate(previousVitalityScore, latestVitalityScore)
      : 0;
    const averageVitalityScore = vitalityTrend.length
      ? vitalityTrend.reduce((sum, item) => sum + item.score, 0) / vitalityTrend.length
      : 0;
    const weightedGrowthRatePercent = (countChangeRate * 0.75) + (vitalityChangeRate * 0.25);
    const recentWeightedGrowthRatePercent = (recentCountChangeRate * 0.75) + (recentVitalityChangeRate * 0.25);
    const recentDropDetected =
      recentCountChangeRate <= RECENT_DROP_THRESHOLD_PERCENT
      || recentVitalityChangeRate <= RECENT_DROP_THRESHOLD_PERCENT;
    const growthLabel = recentDropDetected
      ? '주의 관찰'
      : weightedGrowthRatePercent > 20
        ? '증식 활발'
        : weightedGrowthRatePercent < -10
          ? '감소 추세'
          : '유지 관찰';

    return {
      boxId,
      from,
      to,
      days,
      currentCount,
      firstCount,
      countChange,
      countChangeRatePercent: round(countChangeRate, 1),
      countGrowthPerDay: round(countGrowthPerDay, 4),
      logCountGrowthPerDay: round(logCountGrowth, 6),
      previousCount: round(previousCount),
      recentCountChange: round(recentCountChange),
      recentCountChangeRatePercent: round(recentCountChangeRate, 1),
      currentDensityPerLiter: round(currentDensity),
      firstDensityPerLiter: round(firstDensity),
      densityChangePerLiter: round(densityChange),
      densityChangeRatePercent: round(densityChangeRate, 1),
      densityGrowthPerDay: round(densityGrowthPerDay, 4),
      logDensityGrowthPerDay: round(logDensityGrowth, 6),
      latestVitalityScore: round(latestVitalityScore, 2),
      firstVitalityScore: round(firstVitalityScore, 2),
      averageVitalityScore: round(averageVitalityScore, 2),
      vitalityChange: round(vitalityChange, 2),
      vitalityChangeRatePercent: round(vitalityChangeRate, 1),
      previousVitalityScore: round(previousVitalityScore, 2),
      recentVitalityChange: round(recentVitalityChange, 2),
      recentVitalityChangeRatePercent: round(recentVitalityChangeRate, 1),
      weightedGrowthRatePercent: round(weightedGrowthRatePercent, 1),
      recentWeightedGrowthRatePercent: round(recentWeightedGrowthRatePercent, 1),
      recentDropDetected,
      recentDropThresholdPercent: RECENT_DROP_THRESHOLD_PERCENT,
      countWeight: 0.75,
      vitalityWeight: 0.25,
      growthLabel,
      countTrend,
      densityTrend,
      vitalityTrend,
    };
  },
};
