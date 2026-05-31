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

function numberValue(value: number | undefined, digits = 0) {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

type AnalysisHistory = {
  key: string;
  measuredAt: string;
  types: Set<Measurement['type']>;
  countValue?: number;
  detectionCount?: number;
  densityCount?: number;
  densityPerLiter?: number;
  vitalityScore?: number;
  activeRatio?: number;
};

const MERGE_WINDOW_MS = 5 * 60 * 1000;

function compactAnalysisHistory(measurements: Measurement[]) {
  const sorted = measurements
    .slice()
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

  return sorted.reduce<AnalysisHistory[]>((groups, item) => {
    const measuredAtMs = new Date(item.measuredAt).getTime();
    const latest = groups[groups.length - 1];
    const latestMs = latest ? new Date(latest.measuredAt).getTime() : 0;
    const sameAnalysis = latest && Math.abs(measuredAtMs - latestMs) <= MERGE_WINDOW_MS;
    const group = sameAnalysis
      ? latest
      : {
          key: `${item.measuredAt}-${item.id}`,
          measuredAt: item.measuredAt,
          types: new Set<Measurement['type']>(),
        };

    if (!sameAnalysis) groups.push(group);

    group.types.add(item.type);
    if (measuredAtMs < new Date(group.measuredAt).getTime()) {
      group.measuredAt = item.measuredAt;
    }
    if (item.type === 'detection') {
      group.detectionCount = item.countValue;
    }
    if (item.type === 'density') {
      group.densityCount = item.countValue;
      group.densityPerLiter = item.densityPerLiter;
    }
    if (item.type === 'vitality') {
      group.vitalityScore = item.vitalityScore;
      group.activeRatio = item.activeRatio;
    }
    group.countValue = group.densityCount ?? group.detectionCount ?? group.countValue;

    return groups;
  }, []);
}

function historyTypeLabel(types: Set<Measurement['type']>) {
  if (types.has('density') && types.has('vitality')) return '통합 분석';
  if (types.has('density') && types.has('detection')) return '탐지·밀도';
  if (types.has('detection')) return '객체 탐지';
  if (types.has('density')) return '밀도 분석';
  if (types.has('vitality')) return '활력도';
  return '분석';
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
  const [expandedCard, setExpandedCard] = useState<'count' | 'vitality' | 'rate' | null>(null);

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

  const vitalityTrend = growth?.vitalityTrend.map((v) => v.score) ?? [];
  const analysisHistory = compactAnalysisHistory(measurements);
  const growthLabel = growth?.growthLabel ?? '유지 관찰';
  const growthBadge =
    growthLabel === '증식 활발' ? 'high' : growthLabel === '감소 추세' ? 'low' : 'mid';

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />증식률 분석 · GROWTH</div>
        <h1 className="page-title">count · 활력도 기반 증식률 분석</h1>
        <p className="page-desc">사육 박스별 누적 count와 활력도 변화를 3:1 가중치로 반영해 기간별 증식 상태를 보여줍니다.</p>
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

      <div className={`card growth-hero growth-hero-${growthBadge}`}>
        <div className="card-head">
          <div className="card-title"><Icon name="growth" />통합 증식률</div>
          <span className="growth-hero-period">{growth ? `${growth.from} → ${growth.to} / ${growth.days}일` : ''}</span>
        </div>
        <div className={`growth-hero-label growth-hero-label-${growthBadge}`}>
          {growthLabel}
        </div>
        <div className="growth-hero-formula">
          <span>count 변화율 <strong>{growth?.countChangeRatePercent.toFixed(1) ?? '-'}%</strong> × 0.75</span>
          <span className="ghf-sep">+</span>
          <span>활력도 변화율 <strong>{growth?.vitalityChangeRatePercent.toFixed(1) ?? '-'}%</strong> × 0.25</span>
          <span className="ghf-sep">=</span>
          <strong className="ghf-result">{growth?.weightedGrowthRatePercent.toFixed(1) ?? '-'}</strong>
          <div className="ghf-threshold">
            <span className="ghf-thr-item ghf-thr-high">20 초과 → 증식 활발</span>
            <span className="ghf-thr-sep">·</span>
            <span className="ghf-thr-item ghf-thr-mid">−10 ~ 20 → 유지 관찰</span>
            <span className="ghf-thr-sep">·</span>
            <span className="ghf-thr-item ghf-thr-low">−10 미만 → 감소 추세</span>
          </div>
        </div>
      </div>

      <div className={`growth-sub${expandedCard ? ' growth-sub-has-expanded' : ' grid grid-3'}`}>
        {(['count', 'vitality', 'rate'] as const).map((key) => {
          const isExpanded = expandedCard === key;
          const toggle = () => setExpandedCard(isExpanded ? null : key);
          return (
            <div
              key={key}
              className={`card growth-sub-card${isExpanded ? ' expanded' : ''}`}
              role="button"
              tabIndex={0}
              onClick={toggle}
              onKeyDown={(e) => e.key === 'Enter' && toggle()}
            >
              <div className="card-head">
                <div className="card-title">
                  {key === 'count'    && <><Icon name="grid"  />현재 카운트</>}
                  {key === 'vitality' && <><Icon name="pulse" />현재 활력도 그래프</>}
                  {key === 'rate'     && <><Icon name="trend" />변화율</>}
                </div>
                <span className="growth-expand-icon">
                  {isExpanded ? <Icon name="x" /> : <Icon name="scan" />}
                </span>
              </div>

              {key === 'count' && (
                <>
                  <div className="stat-value tnum">
                    {growth && growth.currentCount > 0 ? numberValue(growth.currentCount) : '-'}
                    <small>마리/mL</small>
                  </div>
                  <div className="stat-sub">{growth?.to ?? '측정 필요'}</div>
                  {isExpanded && (
                    <div className="growth-sub-detail">
                      <span>초기 {numberValue(growth?.firstCount)} 마리/mL</span>
                      <span>증가량 +{numberValue(growth?.countChange)} 마리/mL</span>
                    </div>
                  )}
                </>
              )}

              {key === 'vitality' && (
                <>
                  {vitalityTrend.length > 1
                    ? <LineChart data={vitalityTrend} xlabel="측정" height={isExpanded ? 300 : 180} />
                    : <div className="growth-empty">활력도 측정 데이터가 더 필요합니다.</div>}
                  {isExpanded && (
                    <div className="growth-sub-detail">
                      <span>초기 {growth?.firstVitalityScore.toFixed(1) ?? '-'}점</span>
                      <span>현재 {growth?.latestVitalityScore.toFixed(1) ?? '-'}점</span>
                      <span>평균 {growth?.averageVitalityScore.toFixed(1) ?? '-'}점</span>
                    </div>
                  )}
                </>
              )}

              {key === 'rate' && (
                <>
                  <div className="stat-value tnum">
                    {growth ? growth.countChangeRatePercent.toFixed(1) : '-'}<small>%</small>
                  </div>
                  <div className="stat-sub">{growth ? `${growth.from} 대비 count 변화` : 'count 기반'}</div>
                  {isExpanded && (
                    <div className="growth-sub-detail">
                      <span>활력도 변화율 {growth?.vitalityChangeRatePercent.toFixed(1) ?? '-'}%</span>
                      <span>통합 증식률 {growth?.weightedGrowthRatePercent.toFixed(1) ?? '-'}%</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="card growth-table-card">
        <div className="card-head">
          <div className="card-title"><Icon name="layers" />분석 이력</div>
          <span className="card-sub">같은 영상/시간대의 탐지·밀도·활력도를 한 회차로 표시</span>
        </div>
        <div className="growth-table">
          <div className="growth-row growth-row-head">
            <span>날짜</span>
            <span>분석</span>
            <span>count</span>
            <span>밀도(마리/L)</span>
            <span>활력도</span>
          </div>
          {analysisHistory.length === 0 && (
            <div className="growth-empty" style={{ padding: '20px 0' }}>측정 이력이 없습니다.</div>
          )}
          {analysisHistory
            .map((item) => (
              <div className="growth-row" key={item.key}>
                <span>{dateOnly(item.measuredAt)}</span>
                <span>
                  <Badge kind={item.types.has('density') ? 'high' : 'neutral'}>{historyTypeLabel(item.types)}</Badge>
                </span>
                <span className="mono">{item.countValue?.toLocaleString() ?? '-'}</span>
                <span className="mono">{item.densityPerLiter?.toLocaleString() ?? '-'}</span>
                <span className="mono">{item.vitalityScore?.toFixed(1) ?? '-'}</span>
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
