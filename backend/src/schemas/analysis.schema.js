import { HttpError } from '../utils/http-error.js';

export const parseAnalysisInput = (body) => {
  const boxId = String(body.boxId || body.cultureBoxId || '').trim();
  const measuredAt = body.measuredAt ? new Date(body.measuredAt) : new Date();
  const measuredAreaCm2 = body.measuredAreaCm2 === undefined ? undefined : Number(body.measuredAreaCm2);

  if (!boxId) {
    throw new HttpError(400, 'boxId는 필수입니다.');
  }

  if (Number.isNaN(measuredAt.getTime())) {
    throw new HttpError(400, 'measuredAt이 올바른 날짜가 아닙니다.');
  }

  if (body.measuredAreaCm2 !== undefined && (!Number.isFinite(measuredAreaCm2) || measuredAreaCm2 <= 0)) {
    throw new HttpError(400, 'measuredAreaCm2는 0보다 큰 숫자여야 합니다.');
  }

  return { boxId, measuredAt: measuredAt.toISOString(), measuredAreaCm2 };
};
