import { HttpError } from '../utils/http-error.js';

export const parseMeasurementInput = (body) => {
  const boxId = String(body.boxId || body.cultureBoxId || '').trim();
  const type = String(body.type || '').trim();
  const measuredAt = body.measuredAt ? new Date(body.measuredAt) : new Date();

  if (!boxId) {
    throw new HttpError(400, 'boxId는 필수입니다.');
  }

  if (!['detection', 'density', 'vitality'].includes(type)) {
    throw new HttpError(400, 'type은 detection, density, vitality 중 하나여야 합니다.');
  }

  if (Number.isNaN(measuredAt.getTime())) {
    throw new HttpError(400, 'measuredAt이 올바른 날짜가 아닙니다.');
  }

  return {
    boxId,
    type,
    measuredAt: measuredAt.toISOString(),
    countValue: body.countValue === undefined ? undefined : Number(body.countValue),
    densityPerCm2: body.densityPerCm2 === undefined ? undefined : Number(body.densityPerCm2),
    densityPerLiter: body.densityPerLiter === undefined ? undefined : Number(body.densityPerLiter),
    vitalityScore: body.vitalityScore === undefined ? undefined : Number(body.vitalityScore),
    activeRatio: body.activeRatio === undefined ? undefined : Number(body.activeRatio),
    resultJson: body.resultJson || body.resultSummary || {},
  };
};
