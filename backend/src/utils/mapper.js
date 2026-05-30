const toNumber = (value) => (value === null || value === undefined ? undefined : Number(value));
const toIso = (value) => (value ? new Date(value).toISOString() : undefined);
const toDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : undefined);

export const mapCultureBox = (row) => ({
  id: row.id,
  name: row.name,
  startedAt: toDate(row.started_at),
  memo: row.memo || undefined,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
  deletedAt: toIso(row.deleted_at),
});

export const mapMeasurement = (row) => ({
  id: row.id,
  boxId: row.culture_box_id,
  type: row.type,
  measuredAt: toIso(row.measured_at),
  countValue: toNumber(row.count_value),
  densityPerCm2: toNumber(row.density_per_cm2),
  densityPerLiter: toNumber(row.density_per_liter),
  vitalityScore: toNumber(row.vitality_score),
  activeRatio: toNumber(row.active_ratio),
  resultJson: row.result_summary || undefined,
});
