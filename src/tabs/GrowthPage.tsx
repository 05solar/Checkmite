import { useState, useEffect } from 'react';
import './GrowthPage.css';
import { Badge } from '../components/Badge';
import { BoxSelector } from '../components/BoxSelector';
import { Icon } from '../components/Icons';
import { LineChart } from '../components/LineChart';
import { api } from '../api/client';
import type { GrowthResult } from '../api/client';
import type { CultureBox, Measurement } from '../types';

interface GrowthPageProps {
  boxes: CultureBox[];
  selectedBoxId: string;
  onBoxChange: (id: string) => void;
  onBoxAdd: (box: Omit<CultureBox, 'id'>) => void;
  onBoxDelete: (id: string) => void;
}

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function densityValue(value: number | undefined) {
  return value === undefined || value === null ? '-' : value.toLocaleString();
}

function numberValue(value: number | undefined, digits = 0) {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function GrowthPage({
  boxes,
  selectedBoxId,
  onBoxChange,
  onBoxAdd,
  onBoxDelete,
}: GrowthPageProps) {
  const box = boxes.find((item) => item.id === selectedBoxId) ?? boxes[0];
  const [deleteTarget, setDeleteTarget] = useState<CultureBox | null>(null);
  const [growth, setGrowth] = useState<GrowthResult | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  useEffect(() => {
    if (!box?.id) return;
    setGrowth(null);
    setMeasurements([]);
    Promise.all([
      api.getGrowth(box.id).catch(() => null),
      api.listMeasurements(box.id).catch(() => []),
    ]).then(([g, m]) => {
      setGrowth(g);
      setMeasurements(m as Measurement[]);
    });
  }, [box?.id]);

  const countTrend = growth?.countTrend.map((d) => d.countValue) ?? [];
  const vitalityTrend = growth?.vitalityTrend.map((v) => v.score) ?? [];
  const growthLabel = growth?.growthLabel ?? '유지 관찰';
  const growthBadge =
    growthLabel === '증식 활발' ? 'high' : growthLabel === '감소 추세' ? 'low' : 'mid';

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />증식률 분석 · GROWTH</div>
        <h1 className="page-title">count · 활력도 기반 증식률 분석</h1>
        <p className="page-desc">
          배양 상자별 날짜 누적 count와 활력도 변화를 3:1 가중치로 반영해 기간별 증식 상태를 보여줍니다.
        </p>
      </div>

      <div className="grid grid-2 growth-admin">
        <BoxSelector boxes={boxes} value={box?.id ?? ''} onChange={onBoxChange} onCreate={onBoxAdd} />
        <div className="card growth-box-form">
          <div className="card-head">
            <div className="card-title"><Icon name="box" />사육박스 관리</div>
            <Badge kind="neutral">{boxes.length}개</Badge>
          </div>
          <p className="growth-admin-copy">
            사육박스 추가는 왼쪽 선택기의 추가 버튼에서 바로 등록합니다. 삭제는 현재 선택된 박스를 휴지통으로 이동합니다.
          </p>
          <div className="growth-form-actions">
            <button
              className="btn btn-ghost"
              type="button"
              disabled={boxes.length <= 1}
              onClick={() => setDeleteTarget(box ?? null)}
            >
              <Icon name="x" />선택 박스 삭제
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="stat">
          <div className="stat-label">현재 count</div>
          <div className="stat-value tnum">
            {growth && growth.currentCount > 0 ? numberValue(growth.currentCount) : '-'}
            <small>마리/mL</small>
          </div>
          <div className="stat-sub">{growth?.to ?? 'count 측정 필요'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">count 변화율</div>
          <div className="stat-value tnum">{growth?.countChangeRatePercent.toFixed(1) ?? 0}<small>%</small></div>
          <div className="stat-sub">{growth ? `${growth.from} 대비` : 'count 기반'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">일 count 증식량</div>
          <div className="stat-value tnum">{growth?.countGrowthPerDay.toFixed(2) ?? 0}<small>/일</small></div>
          <div className="stat-sub">{growth ? `${growth.days}일 기준` : 'count 측정 필요'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">통합 증식률</div>
          <div className="stat-value tnum">{growth?.weightedGrowthRatePercent.toFixed(1) ?? 0}<small>%</small></div>
          <div className="stat-sub">count 75% · 활력도 25%</div>
        </div>
      </div>

      <div className="grid grid-2 growth-main">
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="grid" />count 추이</div>
            <span className="card-sub">latest {numberValue(growth?.currentCount)} / mL</span>
          </div>
          {countTrend.length > 1
            ? <LineChart data={countTrend} xlabel="측정" />
            : <div className="growth-empty">count 측정 데이터가 더 필요합니다.</div>}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="pulse" />활력도 추이</div>
            <span className="card-sub">latest {growth?.vitalityTrend[growth.vitalityTrend.length - 1]?.score ?? '-'}점</span>
          </div>
          {vitalityTrend.length > 1
            ? <LineChart data={vitalityTrend} xlabel="측정" />
            : <div className="growth-empty">활력도 측정 데이터가 더 필요합니다.</div>}
        </div>

        <div className="card growth-result-card">
          <div className="card-head">
            <div className="card-title"><Icon name="growth" />증식률 분석</div>
            <Badge kind={growthBadge} dot>{growthLabel}</Badge>
          </div>
          <div className="growth-formula">
            <span>growth_rate_per_day = (count_day_t - count_day_0) / days</span>
            <span>weighted_growth = count_change_rate * 0.75 + vitality_change_rate * 0.25</span>
          </div>
          <div className="metric-row"><span className="mr-k">기준 기간</span><span className="mr-v">{growth ? `${growth.from} - ${growth.to}` : '-'}</span></div>
          <div className="metric-row"><span className="mr-k">count 변화량</span><span className="mr-v mono">{numberValue(growth?.countChange)} / mL</span></div>
          <div className="metric-row"><span className="mr-k">count 변화율</span><span className="mr-v mono">{growth?.countChangeRatePercent.toFixed(1) ?? '-'}%</span></div>
          <div className="metric-row"><span className="mr-k">활력도 변화율</span><span className="mr-v mono">{growth?.vitalityChangeRatePercent.toFixed(1) ?? '-'}%</span></div>
          <div className="metric-row"><span className="mr-k">로그 count 성장률</span><span className="mr-v mono">{growth?.logCountGrowthPerDay.toFixed(4) ?? '-'}</span></div>
          <div className="metric-row"><span className="mr-k">보조 밀도</span><span className="mr-v mono">{densityValue(growth?.currentDensityPerLiter)} / L</span></div>
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
            <span>count</span>
            <span>밀도(마리/L)</span>
            <span>활력도</span>
          </div>
          {measurements.length === 0 && (
            <div className="growth-empty" style={{ padding: '20px 0' }}>측정 이력이 없습니다.</div>
          )}
          {measurements
            .slice()
            .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
            .map((item) => (
              <div className="growth-row" key={item.id}>
                <span>{dateOnly(item.measuredAt)}</span>
                <span>{item.type}</span>
                <span className="mono">{item.countValue?.toLocaleString() ?? '-'}</span>
                <span className="mono">{item.densityPerLiter?.toLocaleString() ?? '-'}</span>
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
              <b>{deleteTarget.name}</b> 데이터를 삭제하시겠습니까? 휴지통으로 이동합니다.
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
