import { HttpError } from '../utils/http-error.js';

export const parseCultureBoxInput = (body) => {
  const name = String(body.name || '').trim();
  const startedAt = String(body.startedAt || body.started_at || '').trim();
  const memo = body.memo === undefined ? undefined : String(body.memo).trim();

  if (!name) {
    throw new HttpError(400, '사육박스 이름은 필수입니다.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startedAt)) {
    throw new HttpError(400, 'startedAt은 YYYY-MM-DD 형식이어야 합니다.');
  }

  return { name, startedAt, memo };
};
