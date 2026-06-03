import { useState, useRef, useEffect } from 'react';
import './DetectionPage.css';
import { Icon } from '../components/Icons';
import { UploadZone } from '../components/UploadZone';
import { FileChip } from '../components/FileChip';
import { Processing } from '../components/Processing';
import { Placeholder } from '../components/Placeholder';
import { Badge } from '../components/Badge';
import { BoxSelector } from '../components/BoxSelector';
import { api } from '../api/client';
import type { DetectionResult } from '../api/client';
import type { CultureBox, DetectionBox, PhaseId } from '../types';

const DET_STEPS = [
  '이미지 업로드 및 전처리…',
  'YOLOv8 모델 로딩 상태 확인…',
  '객체 후보 영역 탐지…',
  'NMS 후처리 및 클래스 분류…',
  '신뢰도 임계값 적용 및 결과 정리…',
];

const classLabel = (cls: DetectionBox['cls']) => (cls === 'predator' ? '천적응애' : '먹이응애');

function fileMeta(file: File) {
  const mb = (file.size / 1024 / 1024).toFixed(1);
  return `${mb} MB`;
}

interface DetectionResultViewProps {
  file: File;
  boxes: DetectionBox[];
  onReset: () => void;
}

function DetectionResultView({ file, boxes, onReset }: DetectionResultViewProps) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const preds = boxes.filter((b) => b.cls === 'predator').length;
  const preys = boxes.filter((b) => b.cls === 'prey').length;
  const total = boxes.length;
  const preyPct = total > 0 ? Math.round((preys / total) * 100) : 0;
  const predPct = 100 - preyPct;
  const avgConf = total > 0
    ? (boxes.reduce((s, b) => s + b.conf, 0) / total * 100).toFixed(1)
    : '0.0';

  return (
    <div className="fade-in grid grid-2">
      <div>
        <div className="card card-pad-0">
          {previewUrl ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <img src={previewUrl} alt={file.name} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
              {boxes.map((b) => (
                <div
                  key={b.id}
                  className={`det-box ${b.cls === 'predator' ? 'is-predator' : 'is-prey'}`}
                  style={{ left: b.x + '%', top: b.y + '%', width: b.w + '%', height: b.h + '%', position: 'absolute' }}
                >
                  <span className="db-tag">
                    {classLabel(b.cls)} {(b.conf * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Placeholder label="원본 사진 · 바운딩 박스 오버레이">
              {boxes.map((b) => (
                <div
                  key={b.id}
                  className={`det-box ${b.cls === 'predator' ? 'is-predator' : 'is-prey'}`}
                  style={{ left: b.x + '%', top: b.y + '%', width: b.w + '%', height: b.h + '%' }}
                >
                  <span className="db-tag">
                    {classLabel(b.cls)} {(b.conf * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </Placeholder>
          )}
        </div>

        <div className="legend" style={{ marginTop: 14, padding: '0 4px' }}>
          <span className="lg-item"><span className="lg-sw" style={{ background: 'var(--predator)' }} />천적응애 (predator)</span>
          <span className="lg-item"><span className="lg-sw" style={{ background: 'var(--prey)' }} />먹이응애 (prey)</span>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div className="card-title">추론 정보</div>
            <Badge kind="accent" dot>완료</Badge>
          </div>
          <div className="metric-row"><span className="mr-k">파일명</span><span className="mr-v mono">{file.name}</span></div>
          <div className="metric-row"><span className="mr-k">신뢰도 임계값</span><span className="mr-v mono">0.50</span></div>
          <div className="metric-row"><span className="mr-k">평균 신뢰도</span><span className="mr-v mono">{avgConf}%</span></div>
        </div>
      </div>

      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat">
            <div className="stat-label"><span className="sl-sw" style={{ background: 'var(--predator)' }} />천적응애</div>
            <div className="stat-value tnum">{preds}<small>마리</small></div>
          </div>
          <div className="stat">
            <div className="stat-label"><span className="sl-sw" style={{ background: 'var(--prey)' }} />먹이응애</div>
            <div className="stat-value tnum">{preys}<small>마리</small></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">탐지 객체 비율</div>
            <span className="card-sub">총 {total}마리</span>
          </div>
          {total > 0 ? (
            <>
              <div className="ratio-bar">
                {preys > 0 && (
                  <div className="ratio-seg" style={{ background: 'var(--prey)', flex: `${preys} 1 0` }}>
                    <span>먹이 {preyPct}%</span>
                  </div>
                )}
                {preds > 0 && (
                  <div className="ratio-seg" style={{ background: 'var(--predator)', flex: `${preds} 1 0` }}>
                    <span>천적 {predPct}%</span>
                  </div>
                )}
              </div>
              <div className="hint" style={{ marginTop: 14 }}>
                <Icon name="info" />
                <span>해충 대비 천적 비율은 약 <b>{preys}:{preds}</b> 입니다.</span>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-2)', fontSize: 13.5 }}>탐지된 개체가 없습니다.</p>
          )}
        </div>

        {boxes.length > 0 && (
          <div className="card">
            <div className="card-head">
              <div className="card-title">개체별 신뢰도</div>
              <span className="card-sub">confidence</span>
            </div>
            <div className="conf-list">
              {boxes.map((b) => {
                const isPred = b.cls === 'predator';
                const col = isPred ? 'var(--predator)' : 'var(--prey)';
                return (
                  <div className="conf-row" key={b.id}>
                    <span className="conf-id">#{String(b.id).padStart(2, '0')}</span>
                    <div className="conf-mid">
                      <div className="conf-name">
                        <span className="cn-sw" style={{ background: col }} />
                        {classLabel(b.cls)}
                      </div>
                      <div className="conf-meter"><i style={{ width: (b.conf * 100) + '%', background: col }} /></div>
                    </div>
                    <span className="conf-val">{(b.conf * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-block" onClick={onReset}><Icon name="upload" />새 사진 분석</button>
        </div>
      </div>
    </div>
  );
}

interface DetectionPageProps {
  boxes: CultureBox[];
  selectedBoxId: string;
  onBoxChange: (id: string) => void;
  onBoxCreate: (box: Omit<CultureBox, 'id'>) => Promise<void> | void;
}

export function DetectionPage({ boxes, selectedBoxId, onBoxChange, onBoxCreate }: DetectionPageProps) {
  const [phase, setPhase] = useState<PhaseId>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [detBoxes, setDetBoxes] = useState<DetectionBox[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiPromise = useRef<Promise<DetectionResult | null> | null>(null);

  const handlePick = (picked: File) => {
    setFile(picked);
    setError(null);
    setPhase('file');
  };

  const startAnalysis = () => {
    if (!file || !selectedBoxId) return;
    setError(null);
    apiPromise.current = api.analyzeDetection(selectedBoxId, file).catch((e: Error) => {
      setError(e.message);
      setPhase('file');
      return null;
    });
    setPhase('proc');
  };

  const onAnimDone = () => {
    apiPromise.current?.then((result) => {
      if (!result) return;
      const mapped: DetectionBox[] = result.detection.boxes.map((b, i) => ({
        id: i + 1,
        cls: b.className === 'predator' ? 'predator' : 'prey',
        conf: b.confidence,
        x: b.x * 100,
        y: b.y * 100,
        w: b.width * 100,
        h: b.height * 100,
      }));
      setDetBoxes(mapped);
      setPhase('result');
    });
  };

  const reset = () => {
    setPhase('idle');
    setFile(null);
    setDetBoxes([]);
    setError(null);
    apiPromise.current = null;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />객체 탐지 · OBJECT DETECTION</div>
        <h1 className="page-title">사진 속 응애 탐지</h1>
        <p className="page-desc">응애가 촬영된 사진을 업로드하면 서버가 천적·해충 개체를 탐지하고, 종류별 마릿수와 개체별 신뢰도를 보여줍니다.</p>
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
          <UploadZone accept="JPG · PNG · WEBP · 최대 20MB" kind="image" onPick={handlePick} />
          <div className="card">
            <div className="card-head"><div className="card-title">이렇게 동작합니다</div></div>
            <div className="metric-row"><span className="mr-k">1. 업로드</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>응애 사진 선택</span></div>
            <div className="metric-row"><span className="mr-k">2. 추론</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>서버 분석 실행</span></div>
            <div className="metric-row"><span className="mr-k">3. 결과</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>박스 · 마릿수 · 신뢰도</span></div>
          </div>
        </div>
      )}

      {phase === 'file' && file && (
        <div className="grid" style={{ maxWidth: 560 }}>
          <FileChip name={file.name} meta={fileMeta(file)} kind="image" onRemove={() => setPhase('idle')} />
          <button className="btn btn-primary btn-lg btn-block" onClick={startAnalysis}>
            <Icon name="scan" />탐지 실행
          </button>
        </div>
      )}

      {phase === 'proc' && <Processing steps={DET_STEPS} onDone={onAnimDone} />}
      {phase === 'result' && file && <DetectionResultView file={file} boxes={detBoxes} onReset={reset} />}
    </div>
  );
}
