import { useState } from 'react';
import './DetectionPage.css';
import { Icon } from '../components/Icons';
import { UploadZone } from '../components/UploadZone';
import { FileChip } from '../components/FileChip';
import { Processing } from '../components/Processing';
import { Placeholder } from '../components/Placeholder';
import { Badge } from '../components/Badge';
import { BoxSelector } from '../components/BoxSelector';
import type { CultureBox, DetectionBox, Measurement, PhaseId } from '../types';

const DET_BOXES: DetectionBox[] = [
  { id: 1,  cls: 'predator', conf: 0.962, x: 14, y: 22, w: 13, h: 16 },
  { id: 2,  cls: 'prey',     conf: 0.944, x: 38, y: 12, w: 9,  h: 11 },
  { id: 3,  cls: 'prey',     conf: 0.918, x: 58, y: 28, w: 8,  h: 10 },
  { id: 4,  cls: 'predator', conf: 0.901, x: 70, y: 54, w: 12, h: 15 },
  { id: 5,  cls: 'prey',     conf: 0.887, x: 24, y: 60, w: 9,  h: 10 },
  { id: 6,  cls: 'prey',     conf: 0.864, x: 45, y: 66, w: 8,  h: 9  },
  { id: 7,  cls: 'prey',     conf: 0.842, x: 84, y: 20, w: 7,  h: 9  },
  { id: 8,  cls: 'predator', conf: 0.823, x: 52, y: 44, w: 11, h: 13 },
  { id: 9,  cls: 'prey',     conf: 0.791, x: 30, y: 40, w: 7,  h: 8  },
  { id: 10, cls: 'prey',     conf: 0.762, x: 66, y: 74, w: 7,  h: 8  },
];

const DET_STEPS = [
  '이미지 전처리 및 리사이즈…',
  '백본 특징 추출 (backbone inference)…',
  '객체 후보 영역 탐지…',
  'NMS 후처리 및 클래스 분류…',
  '신뢰도 임계값 적용 및 결과 정리…',
];

interface DetectionResultProps {
  onReset: () => void;
}

function DetectionResult({ onReset }: DetectionResultProps) {
  const preds = DET_BOXES.filter((b) => b.cls === 'predator').length;
  const preys = DET_BOXES.filter((b) => b.cls === 'prey').length;
  const total = DET_BOXES.length;
  const preyPct = Math.round((preys / total) * 100);
  const predPct = 100 - preyPct;
  const avgConf = (DET_BOXES.reduce((s, b) => s + b.conf, 0) / total * 100).toFixed(1);

  return (
    <div className="fade-in grid grid-2">
      <div>
        <div className="card card-pad-0">
          <Placeholder label="원본 사진 · 바운딩 박스 오버레이">
            {DET_BOXES.map((b) => (
              <div
                key={b.id}
                className={`det-box ${b.cls === 'predator' ? 'is-predator' : 'is-prey'}`}
                style={{ left: b.x + '%', top: b.y + '%', width: b.w + '%', height: b.h + '%' }}
              >
                <span className="db-tag">
                  {b.cls === 'predator' ? '천적' : '해충'} {(b.conf * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </Placeholder>
        </div>

        <div className="legend" style={{ marginTop: 14, padding: '0 4px' }}>
          <span className="lg-item"><span className="lg-sw" style={{ background: 'var(--predator)' }} />천적 응애 (predator)</span>
          <span className="lg-item"><span className="lg-sw" style={{ background: 'var(--prey)' }} />해충 응애 (prey)</span>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div className="card-title"><Icon name="cpu" />추론 정보</div>
            <Badge kind="accent" dot>완료</Badge>
          </div>
          <div className="metric-row"><span className="mr-k">처리 시간</span><span className="mr-v mono">0.84초</span></div>
          <div className="metric-row"><span className="mr-k">입력 해상도</span><span className="mr-v mono">1920 × 1080</span></div>
          <div className="metric-row"><span className="mr-k">신뢰도 임계값</span><span className="mr-v mono">0.70</span></div>
          <div className="metric-row"><span className="mr-k">평균 신뢰도</span><span className="mr-v mono">{avgConf}%</span></div>
        </div>
      </div>

      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat">
            <div className="stat-label"><span className="sl-sw" style={{ background: 'var(--predator)' }} />천적 응애</div>
            <div className="stat-value tnum">{preds}<small>마리</small></div>
          </div>
          <div className="stat">
            <div className="stat-label"><span className="sl-sw" style={{ background: 'var(--prey)' }} />해충 응애</div>
            <div className="stat-value tnum">{preys}<small>마리</small></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">탐지 객체 비율</div>
            <span className="card-sub">총 {total}마리</span>
          </div>
          <div className="ratio-bar">
            <div className="ratio-seg" style={{ background: 'var(--prey)', flexBasis: preyPct + '%' }}>해충 {preyPct}%</div>
            <div className="ratio-seg" style={{ background: 'var(--predator)', flexBasis: predPct + '%' }}>천적 {predPct}%</div>
          </div>
          <div className="hint" style={{ marginTop: 14 }}>
            <Icon name="info" />
            <span>해충 대비 천적 비율은 약 <b>{preys}:{preds}</b> 입니다. 천적 비율이 낮으면 추가 방사를 검토하세요.</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">개체별 신뢰도</div>
            <span className="card-sub">confidence</span>
          </div>
          <div className="conf-list">
            {DET_BOXES.map((b) => {
              const isPred = b.cls === 'predator';
              const col = isPred ? 'var(--predator)' : 'var(--prey)';
              return (
                <div className="conf-row" key={b.id}>
                  <span className="conf-id">#{String(b.id).padStart(2, '0')}</span>
                  <div className="conf-mid">
                    <div className="conf-name">
                      <span className="cn-sw" style={{ background: col }} />
                      {isPred ? '천적 응애' : '해충 응애'}
                    </div>
                    <div className="conf-meter"><i style={{ width: (b.conf * 100) + '%', background: col }} /></div>
                  </div>
                  <span className="conf-val">{(b.conf * 100).toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-block" onClick={onReset}><Icon name="upload" />새 사진 분석</button>
          <button className="btn btn-ghost"><Icon name="download" />결과 저장</button>
        </div>
      </div>
    </div>
  );
}

interface DetectionPageProps {
  boxes: CultureBox[];
  selectedBoxId: string;
  onBoxChange: (id: string) => void;
  onMeasurementAdd: (measurement: Omit<Measurement, 'id' | 'measuredAt'>) => void;
}

export function DetectionPage({ boxes, selectedBoxId, onBoxChange, onMeasurementAdd }: DetectionPageProps) {
  const [phase, setPhase] = useState<PhaseId>('idle');

  const finishAnalysis = () => {
    onMeasurementAdd({
      boxId: selectedBoxId,
      type: 'detection',
      countValue: DET_BOXES.length,
      resultJson: {
        predatorCount: DET_BOXES.filter((box) => box.cls === 'predator').length,
        preyCount: DET_BOXES.filter((box) => box.cls === 'prey').length,
      },
    });
    setPhase('result');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />객체 탐지 · OBJECT DETECTION</div>
        <h1 className="page-title">사진 속 응애 탐지</h1>
        <p className="page-desc">응애가 촬영된 사진을 업로드하면 서버가 천적·해충 개체를 탐지하고, 종류별 마릿수와 개체별 신뢰도를 보여줍니다.</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <BoxSelector boxes={boxes} value={selectedBoxId} onChange={onBoxChange} />
      </div>

      {phase === 'idle' && (
        <div className="grid grid-2">
          <UploadZone accept="JPG · PNG · WEBP · 최대 20MB" kind="image" onPick={() => setPhase('file')} />
          <div className="card">
            <div className="card-head"><div className="card-title"><Icon name="info" />이렇게 동작합니다</div></div>
            <div className="metric-row"><span className="mr-k">1. 업로드</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>응애 사진 선택</span></div>
            <div className="metric-row"><span className="mr-k">2. 추론</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>서버 분석 실행</span></div>
            <div className="metric-row"><span className="mr-k">3. 결과</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>박스 · 마릿수 · 신뢰도</span></div>
          </div>
        </div>
      )}

      {phase === 'file' && (
        <div className="grid" style={{ maxWidth: 560 }}>
          <FileChip name="mite_sample_01.jpg" meta="2,480 × 1,395 · 3.1 MB" kind="image" onRemove={() => setPhase('idle')} />
          <button className="btn btn-primary btn-lg btn-block" onClick={() => setPhase('proc')}>
            <Icon name="scan" />탐지 실행
          </button>
        </div>
      )}

      {phase === 'proc' && <Processing steps={DET_STEPS} onDone={finishAnalysis} />}
      {phase === 'result' && <DetectionResult onReset={() => setPhase('idle')} />}
    </div>
  );
}
