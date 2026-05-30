import { useEffect, useMemo, useState } from 'react';
import './DetectionPage.css';
import { Icon } from '../components/Icons';
import { UploadZone } from '../components/UploadZone';
import { FileChip } from '../components/FileChip';
import { Processing } from '../components/Processing';
import { Badge } from '../components/Badge';
import { BoxSelector } from '../components/BoxSelector';
import type { CultureBox, DetectionBox, Measurement, PhaseId } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

const DET_STEPS = [
  '이미지 업로드 및 전처리…',
  'YOLOv8 모델 로딩 상태 확인…',
  '객체 후보 영역 탐지…',
  'NMS 후처리 및 클래스 분류…',
  '신뢰도 임계값 적용 및 결과 정리…',
];

interface ApiDetection {
  id: number;
  class_name: 'predator' | 'prey' | string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
}

interface DetectionApiResponse {
  filename: string;
  image: {
    width: number;
    height: number;
  };
  settings: {
    confidence: number;
    image_size: number;
  };
  counts: Record<string, number>;
  total: number;
  detections: ApiDetection[];
}

interface DetectionResult {
  boxes: DetectionBox[];
  imageWidth: number;
  imageHeight: number;
  confidence: number;
  imageSize: number;
  elapsedMs: number;
  raw: DetectionApiResponse;
}

const formatBytes = (size: number) => {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const classLabel = (cls: DetectionBox['cls']) => (cls === 'predator' ? '천적응애' : '먹이응애');

const normalizeClass = (className: string): DetectionBox['cls'] =>
  className === 'predator' ? 'predator' : 'prey';

interface DetectionResultProps {
  file: File;
  previewUrl: string;
  result: DetectionResult;
  onReset: () => void;
}

function DetectionResultView({ file, previewUrl, result, onReset }: DetectionResultProps) {
  const boxes = result.boxes;
  const preds = boxes.filter((b) => b.cls === 'predator').length;
  const preys = boxes.filter((b) => b.cls === 'prey').length;
  const total = boxes.length;
  const preyPct = total > 0 ? Math.round((preys / total) * 100) : 0;
  const predPct = total > 0 ? 100 - preyPct : 0;
  const avgConf = total > 0
    ? (boxes.reduce((s, b) => s + b.conf, 0) / total * 100).toFixed(1)
    : '0.0';

  return (
    <div className="fade-in grid grid-2">
      <div>
        <div className="card card-pad-0">
          <div className="det-preview">
            <img src={previewUrl} alt={`${file.name} 탐지 결과`} />
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
            {total === 0 && (
              <div className="det-empty">탐지된 개체 없음</div>
            )}
          </div>
        </div>

        <div className="legend" style={{ marginTop: 14, padding: '0 4px' }}>
          <span className="lg-item"><span className="lg-sw" style={{ background: 'var(--predator)' }} />천적응애 (predator)</span>
          <span className="lg-item"><span className="lg-sw" style={{ background: 'var(--prey)' }} />먹이응애 (prey)</span>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div className="card-title"><Icon name="cpu" />추론 정보</div>
            <Badge kind="accent" dot>완료</Badge>
          </div>
          <div className="metric-row"><span className="mr-k">파일명</span><span className="mr-v mono">{file.name}</span></div>
          <div className="metric-row"><span className="mr-k">처리 시간</span><span className="mr-v mono">{(result.elapsedMs / 1000).toFixed(2)}초</span></div>
          <div className="metric-row"><span className="mr-k">입력 해상도</span><span className="mr-v mono">{result.imageWidth} × {result.imageHeight}</span></div>
          <div className="metric-row"><span className="mr-k">모델 입력 크기</span><span className="mr-v mono">{result.imageSize}px</span></div>
          <div className="metric-row"><span className="mr-k">신뢰도 임계값</span><span className="mr-v mono">{result.confidence.toFixed(2)}</span></div>
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
          <div className="ratio-bar">
            {total === 0 ? (
              <div className="ratio-seg is-empty">탐지 결과 없음</div>
            ) : (
              <>
                <div className="ratio-seg" style={{ background: 'var(--prey)', flexBasis: preyPct + '%' }}>먹이 {preyPct}%</div>
                <div className="ratio-seg" style={{ background: 'var(--predator)', flexBasis: predPct + '%' }}>천적 {predPct}%</div>
              </>
            )}
          </div>
          <div className="hint" style={{ marginTop: 14 }}>
            <Icon name="info" />
            <span>현재 결과는 업로드한 사진에 대한 YOLOv8 추론값입니다. 고해상도 타일링 추론은 추후 단계에서 연결합니다.</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">개체별 신뢰도</div>
            <span className="card-sub">confidence</span>
          </div>
          <div className="conf-list">
            {boxes.length === 0 && <div className="det-list-empty">표시할 개체가 없습니다.</div>}
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
  onMeasurementAdd: (measurement: Omit<Measurement, 'id' | 'measuredAt'>) => void;
}

export function DetectionPage({ boxes, selectedBoxId, onBoxChange, onMeasurementAdd }: DetectionPageProps) {
  const [phase, setPhase] = useState<PhaseId>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState('');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const reset = () => {
    setPhase('idle');
    setFile(null);
    setResult(null);
    setError('');
  };

  const chooseFile = (nextFile: File) => {
    setFile(nextFile);
    setResult(null);
    setError('');
    setPhase('file');
  };

  const runDetection = async () => {
    if (!file) return;
    setPhase('proc');
    setError('');
    const started = performance.now();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/predict/image?conf=0.25&imgsz=640`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `HTTP ${response.status}`);
      }

      const data = await response.json() as DetectionApiResponse;
      const imageWidth = Math.max(1, data.image.width);
      const imageHeight = Math.max(1, data.image.height);
      const mappedBoxes: DetectionBox[] = data.detections.map((det) => ({
        id: det.id,
        cls: normalizeClass(det.class_name),
        conf: det.confidence,
        x: Math.max(0, Math.min(100, (det.box.x1 / imageWidth) * 100)),
        y: Math.max(0, Math.min(100, (det.box.y1 / imageHeight) * 100)),
        w: Math.max(0, Math.min(100, (det.box.width / imageWidth) * 100)),
        h: Math.max(0, Math.min(100, (det.box.height / imageHeight) * 100)),
      }));

      const nextResult = {
        boxes: mappedBoxes,
        imageWidth,
        imageHeight,
        confidence: data.settings.confidence,
        imageSize: data.settings.image_size,
        elapsedMs: performance.now() - started,
        raw: data,
      };

      setResult(nextResult);
      onMeasurementAdd({
        boxId: selectedBoxId,
        type: 'detection',
        countValue: mappedBoxes.length,
        resultJson: {
          filename: file.name,
          predatorCount: mappedBoxes.filter((box) => box.cls === 'predator').length,
          preyCount: mappedBoxes.filter((box) => box.cls === 'prey').length,
          confidence: data.settings.confidence,
          imageSize: data.settings.image_size,
        },
      });
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '객체 탐지 요청에 실패했습니다.');
      setPhase('file');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />객체 탐지 · OBJECT DETECTION</div>
        <h1 className="page-title">사진 속 응애 탐지</h1>
        <p className="page-desc">응애가 촬영된 사진을 업로드하면 YOLOv8 모델이 천적응애·먹이응애 개체를 탐지하고, 종류별 마릿수와 신뢰도를 보여줍니다.</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <BoxSelector boxes={boxes} value={selectedBoxId} onChange={onBoxChange} />
      </div>

      {phase === 'idle' && (
        <div className="grid grid-2">
          <UploadZone accept="JPG · PNG · WEBP · 최대 20MB" kind="image" onPick={chooseFile} />
          <div className="card">
            <div className="card-head"><div className="card-title"><Icon name="info" />이렇게 동작합니다</div></div>
            <div className="metric-row"><span className="mr-k">1. 업로드</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>응애 사진 선택</span></div>
            <div className="metric-row"><span className="mr-k">2. 추론</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>YOLOv8 API 호출</span></div>
            <div className="metric-row"><span className="mr-k">3. 결과</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>박스 · 마릿수 · 신뢰도</span></div>
          </div>
        </div>
      )}

      {phase === 'file' && file && (
        <div className="grid" style={{ maxWidth: 560 }}>
          <FileChip name={file.name} meta={`${formatBytes(file.size)} · ${file.type || 'image'}`} kind="image" onRemove={reset} />
          {error && (
            <div className="det-error">
              <Icon name="info" />
              <span>{error}</span>
            </div>
          )}
          <button className="btn btn-primary btn-lg btn-block" onClick={runDetection}>
            <Icon name="scan" />탐지 실행
          </button>
        </div>
      )}

      {phase === 'proc' && <Processing steps={DET_STEPS} onDone={() => undefined} duration={600000} />}
      {phase === 'result' && file && result && previewUrl && (
        <DetectionResultView file={file} previewUrl={previewUrl} result={result} onReset={reset} />
      )}
    </div>
  );
}
