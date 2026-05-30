import { useState } from 'react';
import type { FormEvent } from 'react';
import './GrowthPage.css';
import { Badge } from '../components/Badge';
import { BoxSelector } from '../components/BoxSelector';
import { Icon } from '../components/Icons';
import { LineChart } from '../components/LineChart';
import type { CultureBox, Measurement } from '../types';

interface GrowthPageProps {
  boxes: CultureBox[];
  measurements: Measurement[];
  selectedBoxId: string;
  onBoxChange: (id: string) => void;
  onBoxAdd: (box: Omit<CultureBox, 'id'>) => void;
  onBoxDelete: (id: string) => void;
}

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const startTime = new Date(`${start}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${end}T00:00:00.000Z`).getTime();
  return Math.max(1, Math.round((endTime - startTime) / 86400000));
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

export function GrowthPage({
  boxes,
  measurements,
  selectedBoxId,
  onBoxChange,
  onBoxAdd,
  onBoxDelete,
}: GrowthPageProps) {
  const box = boxes.find((item) => item.id === selectedBoxId) ?? boxes[0];
  const [name, setName] = useState('');
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CultureBox | null>(null);

  const boxMeasurements = measurements
    .filter((item) => item.boxId === box.id)
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

  const densityMeasurements = boxMeasurements.filter(
    (item) => item.type === 'density' && typeof item.densityPerCm2 === 'number',
  );
  const vitalityMeasurements = boxMeasurements.filter(
    (item) => item.type === 'vitality' && typeof item.vitalityScore === 'number',
  );

  const firstDensity = densityMeasurements[0];
  const latestDensityMeasurement = densityMeasurements[densityMeasurements.length - 1];
  const firstDensityValue = firstDensity?.densityPerCm2 ?? 0;
  const latestDensity = latestDensityMeasurement?.densityPerCm2 ?? 0;
  const startDate = firstDensity ? dateOnly(firstDensity.measuredAt) : box.startedAt;
  const endDate = latestDensityMeasurement ? dateOnly(latestDensityMeasurement.measuredAt) : startDate;
  const days = daysBetween(startDate, endDate);
  const hasDensityBaseline = densityMeasurements.length > 0;
  const densityChange = latestDensity - firstDensityValue;
  const densityChangeRate = firstDensityValue > 0 ? round((densityChange / firstDensityValue) * 100, 1) : 0;
  const densityGrowthPerDay = hasDensityBaseline ? round(densityChange / days, 3) : 0;
  const logDensityGrowth = firstDensityValue > 0 && latestDensity > 0
    ? round((Math.log(latestDensity) - Math.log(firstDensityValue)) / days, 4)
    : 0;
  const latestVitality = vitalityMeasurements[vitalityMeasurements.length - 1]?.vitalityScore ?? 0;
  const densityTrend = densityMeasurements.map((item) => item.densityPerCm2 ?? 0);
  const vitalityTrend = vitalityMeasurements.map((item) => item.vitalityScore ?? 0);
  const growthLabel = densityChangeRate > 20 ? '증식 활발' : densityChangeRate > 0 ? '증식 진행' : '증식 정체';
  const growthBadge = densityChangeRate > 20 ? 'high' : densityChangeRate > 0 ? 'mid' : 'low';

  const submitBox = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onBoxAdd({
      name: trimmedName,
      startedAt,
      memo: memo.trim() || undefined,
    });
    setName('');
    setStartedAt(new Date().toISOString().slice(0, 10));
    setMemo('');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />증식률 분석 · GROWTH</div>
        <h1 className="page-title">밀도 기반 증식률 분석</h1>
        <p className="page-desc">
          측정 count로 산출된 밀도값을 기준으로 현재 밀도량, 밀도 변화율, 활력도 추이, 증식률 결과를 보여줍니다.
        </p>
      </div>

      <div className="grid grid-2 growth-admin">
        <BoxSelector boxes={boxes} value={box.id} onChange={onBoxChange} />
        <form className="card growth-box-form" onSubmit={submitBox}>
          <div className="card-head">
            <div className="card-title"><Icon name="box" />사육박스 관리</div>
            <Badge kind="neutral">{boxes.length}개</Badge>
          </div>
          <div className="growth-form-grid growth-form-grid-compact">
            <label>
              <span>박스 이름</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="예: C동 1번 사육박스" />
            </label>
            <label>
              <span>시작일</span>
              <input type="date" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} />
            </label>
            <label className="growth-form-wide">
              <span>메모</span>
              <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="조건, 위치, 배지 정보" />
            </label>
          </div>
          <div className="growth-form-actions">
            <button className="btn btn-primary" type="submit"><Icon name="check" />추가</button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={boxes.length <= 1}
              onClick={() => setDeleteTarget(box)}
            >
              <Icon name="x" />선택 박스 삭제
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-4">
        <div className="stat">
          <div className="stat-label">현재 밀도량</div>
          <div className="stat-value tnum">{hasDensityBaseline ? round(latestDensity, 1) : '-'}<small>마리/cm2</small></div>
          <div className="stat-sub">{hasDensityBaseline ? endDate : '밀도 측정 필요'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">밀도 변화율</div>
          <div className="stat-value tnum">{hasDensityBaseline ? densityChangeRate : 0}<small>%</small></div>
          <div className="stat-sub">{hasDensityBaseline ? `${startDate} 대비` : '밀도 기반'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">일 밀도 증가량</div>
          <div className="stat-value tnum">{densityGrowthPerDay}<small>/일</small></div>
          <div className="stat-sub">{hasDensityBaseline ? `${days}일 기준` : '밀도 측정 필요'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">증식률 결과</div>
          <div className="stat-value tnum">{logDensityGrowth}</div>
          <div className="stat-sub">로그 밀도 성장률</div>
        </div>
      </div>

      <div className="grid grid-2 growth-main">
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="grid" />밀도 추이</div>
            <span className="card-sub">latest {round(latestDensity, 1)} / cm2</span>
          </div>
          {densityTrend.length > 1 ? <LineChart data={densityTrend} xlabel="측정" /> : <div className="growth-empty">밀도 측정 데이터가 더 필요합니다.</div>}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="pulse" />활력도 추이</div>
            <span className="card-sub">latest {latestVitality}점</span>
          </div>
          {vitalityTrend.length > 1 ? <LineChart data={vitalityTrend} xlabel="측정" /> : <div className="growth-empty">활력도 측정 데이터가 더 필요합니다.</div>}
        </div>

        <div className="card growth-result-card">
          <div className="card-head">
            <div className="card-title"><Icon name="growth" />증식률 분석</div>
            <Badge kind={growthBadge} dot>{growthLabel}</Badge>
          </div>
          <div className="growth-formula">
            <span>density = count / measured_area_cm2</span>
            <span>density_change_rate = (current_density - first_density) / first_density * 100</span>
          </div>
          <div className="metric-row"><span className="mr-k">기준 기간</span><span className="mr-v">{startDate} - {endDate}</span></div>
          <div className="metric-row"><span className="mr-k">밀도 변화량</span><span className="mr-v mono">{round(densityChange, 2)} / cm2</span></div>
          <div className="metric-row"><span className="mr-k">밀도 변화율</span><span className="mr-v mono">{densityChangeRate}%</span></div>
          <div className="metric-row"><span className="mr-k">로그 성장률</span><span className="mr-v mono">{logDensityGrowth}</span></div>
        </div>
      </div>

      <div className="card growth-table-card">
        <div className="card-head">
          <div className="card-title"><Icon name="layers" />측정 이력</div>
          <span className="card-sub">밀도·활력도 결과</span>
        </div>
        <div className="growth-table">
          <div className="growth-row growth-row-head">
            <span>날짜</span>
            <span>유형</span>
            <span>밀도</span>
            <span>활력도</span>
          </div>
          {boxMeasurements.map((item) => (
            <div className="growth-row" key={item.id}>
              <span>{dateOnly(item.measuredAt)}</span>
              <span>{item.type}</span>
              <span className="mono">{item.densityPerCm2 ?? '-'}</span>
              <span className="mono">{item.vitalityScore ?? '-'}</span>
            </div>
          ))}
        </div>
      </div>

      {deleteTarget && (
        <div className="confirm-backdrop" role="presentation">
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-box-title">
            <div className="card-head">
              <div className="card-title" id="delete-box-title"><Icon name="trash" />사육박스 삭제 확인</div>
            </div>
            <p className="confirm-copy">
              <b>{deleteTarget.name}</b> 데이터를 삭제하시겠습니까? 바로 DB에서 제거하지 않고 trash.db 휴지통으로 이동합니다.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>취소</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onBoxDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                휴지통으로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
