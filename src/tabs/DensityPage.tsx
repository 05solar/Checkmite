import { useState, useRef } from 'react';
import './DensityPage.css';
import { Icon } from '../components/Icons';
import { FileChip } from '../components/FileChip';
import { Processing } from '../components/Processing';
import { Badge, gradeOf } from '../components/Badge';
import { LineChart } from '../components/LineChart';
import { BoxSelector } from '../components/BoxSelector';
import { api } from '../api/client';
import type { DensityProgress, DensityResult } from '../api/client';
import type { CultureBox, PhaseId } from '../types';

const DEN_STEPS = [
  '1 mL 배지 영상 확인…',
  '각 영상 10초 이상 여부 검증…',
  '영상별 좋은 프레임 선별…',
  '업로드 배지 count 평균 및 활력도 산출…',
  '통합 분석 결과 저장…',
];

function fileMeta(file: File) {
  const mb = (file.size / 1024 / 1024).toFixed(1);
  return `${mb} MB`;
}

function getVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('영상 길이를 확인할 수 없습니다.'));
    };
    video.src = url;
  });
}

interface DensityResultViewProps {
  data: DensityResult;
  onReset: () => void;
}

function DensityResultView({ data, onReset }: DensityResultViewProps) {
  const density = data.density;
  const perLiter = density.currentDensityPerLiter.toLocaleString();
  const level = density.densityGrade === 'marketable' ? '상품성 있음' : '낮음';
  const quality = density.selectedFrameQuality;
  const vitality = data.vitality;
  const activeRatioPct = vitality?.activeRatio != null ? Math.round(vitality.activeRatio * 100) : null;
  const representativeTrack = vitality?.representativeTrack;

  return (
    <div className="fade-in grid grid-2">
      <div>
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div className="card-title"><Icon name="trend" />밀도 정보</div>
            <Badge kind="accent" dot>완료</Badge>
          </div>
          <div className="metric-row"><span className="mr-k">평균 프레임 count</span><span className="mr-v mono">{density.averageFrameCount?.toFixed(1) ?? '-'}마리</span></div>
          <div className="metric-row"><span className="mr-k">평균 1 mL 밀도</span><span className="mr-v mono">{density.estimatedCountPerMl.toLocaleString()}마리</span></div>
          <div className="metric-row"><span className="mr-k">최대 프레임 count</span><span className="mr-v mono">{density.bestFrameCount}마리</span></div>
          <div className="metric-row"><span className="mr-k">분석 영상 수</span><span className="mr-v mono">{density.sampleCount ?? data.samples?.length ?? 0}개</span></div>
        </div>
        {density.bestFrameCount > 0 && (
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-head">
              <div className="card-title"><Icon name="trend" />최대 프레임</div>
              <span className="card-sub">frame {density.selectedFrameIndex ?? '-'}</span>
            </div>
            <LineChart data={[0, density.averageFrameCount ?? 0, density.bestFrameCount, density.averageFrameCount ?? 0, density.bestFrameCount]} />
          </div>
        )}
      </div>

      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-soft-2)' }}>
          <div className="card-head"><div className="card-title"><Icon name="grid" />밀도 등급</div></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div className="stat-value tnum" style={{ fontSize: 44 }}>{perLiter}<small> 마리/L</small></div>
          </div>
          <div className="grade-row" style={{ marginTop: 12 }}>
            <Badge kind={gradeOf(level)} dot>{level}</Badge>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>1 mL 10마리 이상 기준</span>
          </div>
        </div>

        <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat">
            <div className="stat-label">최대 프레임</div>
            <div className="stat-value tnum">{density.bestFrameCount}<small>마리</small></div>
            <div className="stat-sub">{density.selectedFrameTimestampSeconds?.toFixed(1) ?? '-'}초 지점</div>
          </div>
          <div className="stat">
            <div className="stat-label">샘플 프레임</div>
            <div className="stat-value tnum">{density.sampledFrames ?? '-'}<small>개</small></div>
            <div className="stat-sub">앞 {density.analysisWindowSeconds?.toFixed(1) ?? '10.0'}초 · 1초당 1프레임</div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title"><Icon name="pulse" />활력도 정보</div></div>
          <div className="metric-row"><span className="mr-k">평균 활력도</span><span className="mr-v mono">{vitality?.score ?? '-'}점</span></div>
          {activeRatioPct != null && (
            <div className="metric-row"><span className="mr-k">활동 개체 비율</span><span className="mr-v mono">{activeRatioPct}%</span></div>
          )}
          {vitality?.averageSpeedMmPerSec != null && (
            <div className="metric-row"><span className="mr-k">평균 속도</span><span className="mr-v mono">{vitality.averageSpeedMmPerSec.toFixed(3)} mm/s</span></div>
          )}
          {vitality?.averageSpeedRatio != null && (
            <div className="metric-row"><span className="mr-k">먹이응애 기준 속도</span><span className="mr-v mono">{vitality.averageSpeedRatio.toFixed(2)}x</span></div>
          )}
          <div className="metric-row"><span className="mr-k">확정 track</span><span className="mr-v mono">{vitality?.confirmedTracks ?? '-'}개</span></div>
          <div className="metric-row"><span className="mr-k">이동 track</span><span className="mr-v mono">{vitality?.movingTracks ?? '-'}개</span></div>
        </div>

        {representativeTrack && (
          <div className="card">
            <div className="card-head"><div className="card-title"><Icon name="pulse" />대표 track</div></div>
            <div className="metric-row"><span className="mr-k">샘플</span><span className="mr-v mono">{representativeTrack.sampleIndex}. {representativeTrack.originalName}</span></div>
            <div className="metric-row"><span className="mr-k">track ID</span><span className="mr-v mono">{representativeTrack.trackId}</span></div>
            <div className="metric-row"><span className="mr-k">track 활력도</span><span className="mr-v mono">{representativeTrack.vitalityScore?.toFixed(1) ?? '-'}점</span></div>
            <div className="metric-row"><span className="mr-k">관측 프레임</span><span className="mr-v mono">{representativeTrack.framesSeen ?? '-'}개</span></div>
            <div className="metric-row"><span className="mr-k">이동거리</span><span className="mr-v mono">{representativeTrack.totalDistancePx?.toFixed(1) ?? '-'}px</span></div>
            <div className="metric-row"><span className="mr-k">상대 속도</span><span className="mr-v mono">{representativeTrack.meanSpeedRatio?.toFixed(2) ?? '-'}x</span></div>
            <div className="metric-row"><span className="mr-k">이동 비율</span><span className="mr-v mono">{representativeTrack.movingRatio != null ? `${Math.round(representativeTrack.movingRatio * 100)}%` : '-'}</span></div>
          </div>
        )}

        <div className="card">
          <div className="card-head"><div className="card-title"><Icon name="info" />품질 정보</div></div>
          <div className="metric-row"><span className="mr-k">선명도</span><span className="mr-v mono">{quality?.sharpness.toFixed(1) ?? '-'}</span></div>
          <div className="metric-row"><span className="mr-k">밝기</span><span className="mr-v mono">{quality?.brightness.toFixed(1) ?? '-'}</span></div>
          {(density.warnings?.length ?? 0) > 0 && (
            <div style={{ marginTop: 10, color: 'var(--warning, #b7791f)', fontSize: 13 }}>
              {density.warnings?.join(' · ')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-block" onClick={onReset}><Icon name="upload" />새 영상 분석</button>
        </div>
      </div>

      {data.samples && data.samples.length > 0 && (
        <div className="card" style={{ gridColumn: '1 / -1', marginTop: 18 }}>
          <div className="card-head">
            <div className="card-title"><Icon name="layers" />샘플 분석 결과</div>
            <span className="card-sub">{data.samples.length}개 영상</span>
          </div>
          <div className="grid" style={{ gap: 8, maxHeight: 460, overflow: 'auto' }}>
            {data.samples.map((sample) => (
              <div className="metric-row" key={sample.sampleIndex}>
                <span className="mr-k">{sample.sampleIndex}. {sample.originalName}</span>
                <span className="mr-v mono">
                  count {sample.estimatedCountPerMl ?? '-'} / mL · density {sample.densityPerLiter?.toLocaleString() ?? '-'} / L · vitality {sample.vitalityScore?.toFixed(1) ?? '-'}점 · tracks {sample.confirmedTracks ?? 0}/{sample.movingTracks ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vitality?.trackingVideoUrl && (
        <div className="card" style={{ gridColumn: '1 / -1', marginTop: 18 }}>
          <div className="card-head">
            <div className="card-title"><Icon name="video" />트래킹 영상</div>
            <span className="card-sub">1번 영상 기준</span>
          </div>
          <div style={{ borderRadius: 8, overflow: 'hidden', background: '#050608' }}>
            <video
              src={vitality.trackingVideoUrl}
              controls
              muted
              playsInline
              style={{ display: 'block', width: '100%', maxHeight: 620, objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface DensityPageProps {
  boxes: CultureBox[];
  selectedBoxId: string;
  onBoxChange: (id: string) => void;
  onBoxCreate: (box: Omit<CultureBox, 'id'>) => Promise<void> | void;
}

export function DensityPage({ boxes, selectedBoxId, onBoxChange, onBoxCreate }: DensityPageProps) {
  const [phase, setPhase] = useState<PhaseId>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<DensityResult | null>(null);
  const [progress, setProgress] = useState<DensityProgress | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = (picked: FileList | File[]) => {
    const selected = Array.from(picked);
    const known = new Set(files.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
    const nextFiles = [
      ...files,
      ...selected.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (known.has(key)) return false;
        known.add(key);
        return true;
      }),
    ];
    setFiles(nextFiles);
    setProgress(null);
    setUploadPercent(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPhase('file');
  };

  const removeFile = (indexToRemove: number) => {
    const nextFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(nextFiles);
    setProgress(null);
    setUploadPercent(0);
    setError(null);
    setPhase(nextFiles.length ? 'file' : 'idle');
  };

  const startAnalysis = () => {
    if (!files.length || !selectedBoxId) return;
    if (files.length < 1) {
      setError('밀도 측정은 1개 이상의 영상이 필요합니다.');
      return;
    }
    setError(null);
    Promise.all(files.map(getVideoDuration))
      .then((durations) => {
        const shortIndex = durations.findIndex((duration) => duration < 10);
        if (shortIndex >= 0) throw new Error(`${shortIndex + 1}번 영상이 10초 미만입니다. 모든 영상은 10초 이상이어야 합니다.`);
        return api.startDensityAnalysis(selectedBoxId, files, setUploadPercent);
      })
      .then((job) => {
        setProgress(job);
        const poll = window.setInterval(async () => {
          try {
            const next = await api.getDensityProgress(job.id);
            setProgress(next);
            if (next.status === 'completed' && next.result) {
              window.clearInterval(poll);
              pollRef.current = null;
              setResult(next.result);
              setPhase('result');
            } else if (next.status === 'failed') {
              window.clearInterval(poll);
              pollRef.current = null;
              setError(next.error || '분석에 실패했습니다.');
              setPhase('file');
            }
          } catch (e) {
            window.clearInterval(poll);
            pollRef.current = null;
            setError(e instanceof Error ? e.message : '진행 상태를 가져오지 못했습니다.');
            setPhase('file');
          }
        }, 1000);
        pollRef.current = poll;
      })
      .catch((e: Error) => {
        setError(e.message);
        setPhase('file');
      });
    setPhase('proc');
  };

  const onAnimDone = () => {
    // 실제 완료는 backend progress polling으로 처리한다.
  };

  const reset = () => {
    setPhase('idle');
    setFiles([]);
    setResult(null);
    setProgress(null);
    setUploadPercent(0);
    setError(null);
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />밀도 측정 · DENSITY</div>
        <h1 className="page-title">영상 기반 통합 분석</h1>
        <p className="page-desc">1개 이상의 1 mL 배지 영상을 업로드하면 각 영상의 처음 10초 구간으로 평균 count, L당 밀도, 활력도를 함께 산출합니다.</p>
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
          <div className="card">
            <div className="card-head"><div className="card-title"><Icon name="upload" />영상 업로드</div></div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={(event) => {
                if (event.target.files) handlePick(event.target.files);
              }}
              style={{ width: '100%', padding: '12px 0' }}
            />
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              1개 이상의 1 mL 배지에서 촬영한 10초 이상 영상을 선택하세요.
              같은 영상으로 밀도와 활력도를 함께 계산합니다.
              10초를 초과하는 영상은 앞 10초 구간만 분석합니다.
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title"><Icon name="info" />측정 단계</div></div>
            <div className="metric-row"><span className="mr-k">1. 샘플</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>1개 이상 1 mL 배지</span></div>
            <div className="metric-row"><span className="mr-k">2. 밀도</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>영상별 최대 count 프레임 선택</span></div>
            <div className="metric-row"><span className="mr-k">3. 활력도</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>같은 영상의 움직임 추적</span></div>
          </div>
        </div>
      )}

      {phase === 'file' && files.length > 0 && (
        <div className="grid" style={{ maxWidth: 560 }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title"><Icon name="video" />선택된 영상</div>
              <Badge kind="accent">
                {files.length}개
              </Badge>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={(event) => {
                if (event.target.files) handlePick(event.target.files);
              }}
              style={{ width: '100%', padding: '0 0 12px' }}
            />
            <div className="grid" style={{ gap: 8, maxHeight: 360, overflow: 'auto' }}>
              {files.map((file, index) => (
                <FileChip
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  name={`${index + 1}. ${file.name}`}
                  meta={fileMeta(file)}
                  kind="video"
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-block" onClick={startAnalysis}>
            <Icon name="grid" />통합 분석 시작
          </button>
        </div>
      )}

      {phase === 'proc' && (
        <>
          <Processing
            steps={DEN_STEPS}
            onDone={onAnimDone}
            percent={progress ? progress.percent : Math.min(9, Math.round(uploadPercent / 12))}
            message={progress ? progress.message : `영상 업로드 중 ${uploadPercent}%`}
            currentSample={progress?.currentSample}
            totalSamples={progress?.totalSamples ?? files.length}
          />
          {progress && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-head">
                <div className="card-title"><Icon name="layers" />샘플별 분석 진행</div>
                <Badge kind="accent">{progress.percent}%</Badge>
              </div>
              <div className="grid" style={{ gap: 8, maxHeight: 420, overflow: 'auto' }}>
                {progress.samples.map((sample) => (
                  <div className="metric-row" key={sample.sampleIndex}>
                    <span className="mr-k">{sample.sampleIndex}. {sample.originalName ?? '대기 중'}</span>
                    <span className="mr-v mono">
                      {sample.status}
                      {sample.estimatedCountPerMl !== undefined ? ` · ${sample.estimatedCountPerMl}마리/mL` : ''}
                      {sample.vitalityScore !== undefined ? ` · ${sample.vitalityScore.toFixed(1)}점` : ''}
                      {sample.confirmedTracks !== undefined ? ` · tracks ${sample.confirmedTracks}/${sample.movingTracks ?? 0}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {phase === 'result' && result && <DensityResultView data={result} onReset={reset} />}
    </div>
  );
}
