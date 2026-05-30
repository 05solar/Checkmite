import { useState, useRef } from 'react';
import './DensityPage.css';
import { Icon } from '../components/Icons';
import { UploadZone } from '../components/UploadZone';
import { FileChip } from '../components/FileChip';
import { Processing } from '../components/Processing';
import { Badge, gradeOf } from '../components/Badge';
import { LineChart } from '../components/LineChart';
import { BoxSelector } from '../components/BoxSelector';
import { api } from '../api/client';
import type { DensityResult } from '../api/client';
import type { CultureBox, PhaseId } from '../types';

const DEN_STEPS = [
  '영상 디코딩 및 프레임 분할…',
  '프레임별 객체 탐지 실행…',
  '다중 객체 트래킹 (ByteTrack)…',
  '트랙 ID 매칭 및 중복 제거…',
  '최대 동시 출현 수 집계 및 밀도 환산…',
];

function fileMeta(file: File) {
  const mb = (file.size / 1024 / 1024).toFixed(1);
  return `${mb} MB`;
}

interface DensityResultViewProps {
  data: DensityResult['density'];
  onReset: () => void;
}

function DensityResultView({ data, onReset }: DensityResultViewProps) {
  const perCm2 = data.currentDensityPerCm2.toFixed(1);
  const level = data.currentDensityPerCm2 < 1.5 ? '낮음' : data.currentDensityPerCm2 < 3 ? '보통' : '높음';

  return (
    <div className="fade-in grid grid-2">
      <div>
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div className="card-title"><Icon name="trend" />밀도 정보</div>
            <Badge kind="accent" dot>완료</Badge>
          </div>
          <div className="metric-row"><span className="mr-k">측정 면적</span><span className="mr-v mono">{data.measuredAreaCm2} ㎠</span></div>
          <div className="metric-row"><span className="mr-k">최대 출현 수</span><span className="mr-v mono">{data.peakCount}마리</span></div>
          <div className="metric-row"><span className="mr-k">평균 출현 수</span><span className="mr-v mono">{data.averageCount?.toFixed(1) ?? '-'}마리</span></div>
        </div>
        {data.peakCount > 0 && (
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-head">
              <div className="card-title"><Icon name="trend" />출현 분포</div>
              <span className="card-sub">peak {data.peakCount}마리</span>
            </div>
            <LineChart data={[0, data.averageCount ?? 0, data.peakCount, data.averageCount ?? 0, data.peakCount]} />
          </div>
        )}
      </div>

      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-soft-2)' }}>
          <div className="card-head"><div className="card-title"><Icon name="grid" />밀도 등급</div></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div className="stat-value tnum" style={{ fontSize: 44 }}>{perCm2}<small> 마리/㎠</small></div>
          </div>
          <div className="grade-row" style={{ marginTop: 12 }}>
            <Badge kind={gradeOf(level)} dot>{level}</Badge>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>측정 면적 {data.measuredAreaCm2}㎠ 기준</span>
          </div>
        </div>

        <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat">
            <div className="stat-label">최대 동시 출현</div>
            <div className="stat-value tnum">{data.peakCount}<small>마리</small></div>
            <div className="stat-sub">peak concurrent</div>
          </div>
          <div className="stat">
            <div className="stat-label">평균 출현 수</div>
            <div className="stat-value tnum">{data.averageCount?.toFixed(0) ?? '-'}<small>마리</small></div>
            <div className="stat-sub">frame average</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-block" onClick={onReset}><Icon name="upload" />새 영상 분석</button>
        </div>
      </div>
    </div>
  );
}

interface DensityPageProps {
  boxes: CultureBox[];
  selectedBoxId: string;
  onBoxChange: (id: string) => void;
}

export function DensityPage({ boxes, selectedBoxId, onBoxChange }: DensityPageProps) {
  const [phase, setPhase] = useState<PhaseId>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [areaCm2, setAreaCm2] = useState('12');
  const [result, setResult] = useState<DensityResult['density'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiPromise = useRef<Promise<DensityResult | null> | null>(null);

  const handlePick = (picked: File) => {
    setFile(picked);
    setError(null);
    setPhase('file');
  };

  const startAnalysis = () => {
    if (!file || !selectedBoxId) return;
    const area = parseFloat(areaCm2);
    if (!area || area <= 0) { setError('측정 면적을 0보다 큰 값으로 입력해주세요.'); return; }
    setError(null);
    apiPromise.current = api.analyzeDensity(selectedBoxId, file, area).catch((e: Error) => {
      setError(e.message);
      setPhase('file');
      return null;
    });
    setPhase('proc');
  };

  const onAnimDone = () => {
    apiPromise.current?.then((r) => {
      if (!r) return;
      setResult(r.density);
      setPhase('result');
    });
  };

  const reset = () => {
    setPhase('idle');
    setFile(null);
    setResult(null);
    setError(null);
    apiPromise.current = null;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />밀도 측정 · DENSITY</div>
        <h1 className="page-title">영상 기반 밀도 측정</h1>
        <p className="page-desc">영상을 업로드하면 서버가 프레임마다 응애를 추적해 마릿수를 집계하고, 단위 면적당 밀도와 등급을 환산합니다.</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <BoxSelector boxes={boxes} value={selectedBoxId} onChange={onBoxChange} />
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--danger, #e55)', color: 'var(--danger, #e55)', padding: '12px 16px', fontSize: 13.5 }}>
          <Icon name="info" /> {error}
        </div>
      )}

      {phase === 'idle' && (
        <div className="grid grid-2">
          <UploadZone accept="MP4 · MOV · AVI · 최대 500MB" kind="video" onPick={handlePick} />
          <div className="card">
            <div className="card-head"><div className="card-title"><Icon name="info" />측정 단계</div></div>
            <div className="metric-row"><span className="mr-k">1. 트래킹</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>프레임별 객체 추적</span></div>
            <div className="metric-row"><span className="mr-k">2. 집계</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>고유 개체 수 산출</span></div>
            <div className="metric-row"><span className="mr-k">3. 환산</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>면적당 밀도 · 등급</span></div>
          </div>
        </div>
      )}

      {phase === 'file' && file && (
        <div className="grid" style={{ maxWidth: 560 }}>
          <FileChip name={file.name} meta={fileMeta(file)} kind="video" onRemove={() => setPhase('idle')} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: 'var(--text-2)' }}>
            측정 면적 (㎠)
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={areaCm2}
              onChange={(e) => setAreaCm2(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)', fontSize: 14 }}
            />
          </label>
          <button className="btn btn-primary btn-lg btn-block" onClick={startAnalysis}>
            <Icon name="grid" />밀도 측정
          </button>
        </div>
      )}

      {phase === 'proc' && <Processing steps={DEN_STEPS} onDone={onAnimDone} duration={3200} />}
      {phase === 'result' && result && <DensityResultView data={result} onReset={reset} />}
    </div>
  );
}
