import { useState, useRef } from 'react';
import './VitalityPage.css';
import { Icon } from '../components/Icons';
import { UploadZone } from '../components/UploadZone';
import { FileChip } from '../components/FileChip';
import { Processing } from '../components/Processing';
import { Badge, gradeOf } from '../components/Badge';
import { Gauge } from '../components/Gauge';
import { LineChart } from '../components/LineChart';
import { BoxSelector } from '../components/BoxSelector';
import { api } from '../api/client';
import type { VitalityResult } from '../api/client';
import type { CultureBox, PhaseId } from '../types';

const VIT_STEPS = [
  '영상 디코딩 및 프레임 분할…',
  '개체 추적 및 궤적 추출…',
  '프레임 간 이동량(optical flow) 계산…',
  '움직임 분포·밀집도 분석…',
  '활력도 점수 산출…',
];

function fileMeta(file: File) {
  const mb = (file.size / 1024 / 1024).toFixed(1);
  return `${mb} MB`;
}

interface VitalityResultViewProps {
  data: VitalityResult['vitality'];
  onReset: () => void;
}

function VitalityResultView({ data, onReset }: VitalityResultViewProps) {
  const level = data.score < 40 ? '낮음' : data.score < 70 ? '보통' : '높음';
  const activeRatioPct = data.activeRatio != null ? Math.round(data.activeRatio * 100) : null;

  return (
    <div className="fade-in grid grid-2">
      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card vit-gauge-card">
          <Gauge value={data.score} />
          <div className="grade-row" style={{ marginTop: 18 }}>
            <Badge kind={gradeOf(level)} dot>활력도 {level}</Badge>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">활력도 세부 지표</div></div>
          {activeRatioPct != null && (
            <div className="metric-row"><span className="mr-k">활동 개체 비율</span><span className="mr-v mono">{activeRatioPct}%</span></div>
          )}
          {activeRatioPct != null && (
            <div className="metric-row"><span className="mr-k">정지 개체 비율</span><span className="mr-v mono">{100 - activeRatioPct}%</span></div>
          )}
          <div className="metric-row"><span className="mr-k">활력도 점수</span><span className="mr-v mono">{data.score}점</span></div>
        </div>
      </div>

      <div className="grid" style={{ alignContent: 'start' }}>
        {data.trend.length > 1 && (
          <div className="card">
            <div className="card-head">
              <div className="card-title">시간별 활력도 추이</div>
              <span className="card-sub">초 단위</span>
            </div>
            <LineChart data={data.trend} xlabel="구간" />
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <div className="card-title">측정 정보</div>
            <Badge kind="accent" dot>완료</Badge>
          </div>
          <div className="metric-row"><span className="mr-k">최종 점수</span><span className="mr-v mono">{data.score}점</span></div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-block" onClick={onReset}><Icon name="upload" />새 영상 분석</button>
        </div>
      </div>
    </div>
  );
}

interface VitalityPageProps {
  boxes: CultureBox[];
  selectedBoxId: string;
  onBoxChange: (id: string) => void;
  onBoxCreate: (box: Omit<CultureBox, 'id'>) => Promise<void> | void;
}

export function VitalityPage({ boxes, selectedBoxId, onBoxChange, onBoxCreate }: VitalityPageProps) {
  const [phase, setPhase] = useState<PhaseId>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VitalityResult['vitality'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiPromise = useRef<Promise<VitalityResult | null> | null>(null);

  const handlePick = (picked: File) => {
    setFile(picked);
    setError(null);
    setPhase('file');
  };

  const startAnalysis = () => {
    if (!file || !selectedBoxId) return;
    setError(null);
    apiPromise.current = api.analyzeVitality(selectedBoxId, file).catch((e: Error) => {
      setError(e.message);
      setPhase('file');
      return null;
    });
    setPhase('proc');
  };

  const onAnimDone = () => {
    apiPromise.current?.then((r) => {
      if (!r) return;
      setResult(r.vitality);
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
        <div className="page-eyebrow"><span className="pe-dot" />활력도 측정 · VITALITY</div>
        <h1 className="page-title">영상 기반 활력도 측정</h1>
        <p className="page-desc">영상을 업로드하면 서버가 개체들의 움직임을 분석해 0~100점의 활력도 점수와 추이를 산출합니다.</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <BoxSelector boxes={boxes} value={selectedBoxId} onChange={onBoxChange} onCreate={onBoxCreate} />
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
            <div className="card-head"><div className="card-title">활력도란?</div></div>
            <p style={{ margin: '0 0 4px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
              개체의 이동량·속도·활동 비율을 종합해 군집의 건강 상태를 0~100점으로 나타냅니다. 점수가 높을수록 활발하게 움직이는 개체가 많음을 의미합니다.
            </p>
          </div>
        </div>
      )}

      {phase === 'file' && file && (
        <div className="grid" style={{ maxWidth: 560 }}>
          <FileChip name={file.name} meta={fileMeta(file)} kind="video" onRemove={() => setPhase('idle')} />
          <button className="btn btn-primary btn-lg btn-block" onClick={startAnalysis}>
            <Icon name="pulse" />활력도 측정
          </button>
        </div>
      )}

      {phase === 'proc' && <Processing steps={VIT_STEPS} onDone={onAnimDone} duration={3000} />}
      {phase === 'result' && result && <VitalityResultView data={result} onReset={reset} />}
    </div>
  );
}
