import { useState, useEffect, useRef } from 'react';
import './DensityPage.css';
import { Icon } from '../components/Icons';
import { UploadZone } from '../components/UploadZone';
import { FileChip } from '../components/FileChip';
import { Processing } from '../components/Processing';
import { Placeholder } from '../components/Placeholder';
import { Badge, gradeOf } from '../components/Badge';
import { LineChart } from '../components/LineChart';
import type { Version, PhaseId } from '../types';

const DEN_STEPS = [
  '영상 디코딩 및 프레임 분할…',
  '프레임별 객체 탐지 실행…',
  '다중 객체 트래킹 (ByteTrack)…',
  '트랙 ID 매칭 및 중복 제거…',
  '최대 동시 출현 수 집계 및 밀도 환산…',
];

const FRAME_COUNTS = [4, 6, 5, 8, 11, 9, 13, 14, 12, 16, 18, 17, 21, 19, 23, 24, 22, 26, 28, 27, 29, 31, 30, 33];
const PEAK = Math.max(...FRAME_COUNTS);
const AREA_CM2 = 12.0;

const TRACKS = [
  { id: 14, bx: 20, by: 30, sx: 7, sy: 5, ph: 0 },
  { id: 22, bx: 55, by: 22, sx: 5, sy: 8, ph: 1.7 },
  { id: 7,  bx: 70, by: 60, sx: 9, sy: 4, ph: 3.1 },
  { id: 31, bx: 35, by: 65, sx: 6, sy: 7, ph: 0.8 },
  { id: 18, bx: 48, by: 45, sx: 8, sy: 6, ph: 2.4 },
];

function MovingBoxes() {
  const [t, setT] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <>
      {TRACKS.map((tr) => {
        const x = tr.bx + Math.sin(t * 0.7 + tr.ph) * tr.sx;
        const y = tr.by + Math.cos(t * 0.55 + tr.ph) * tr.sy;
        return (
          <div key={tr.id} className="det-box is-predator"
            style={{ left: x + '%', top: y + '%', width: '7%', height: '9%', borderColor: 'var(--accent)' }}>
            <span className="db-tag">ID {tr.id}</span>
          </div>
        );
      })}
    </>
  );
}

function VideoPlayer({ label, children }: { label: string; children?: React.ReactNode }) {
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(0.42);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setPos((p) => (p >= 1 ? 0 : p + 0.008)), 60);
    return () => clearInterval(iv);
  }, [playing]);

  const dur = 18;
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="card card-pad-0">
      <Placeholder label={label} ratio="16 / 9">{playing && children}</Placeholder>
      <div className="vid-bar">
        <button className="vid-play" onClick={() => setPlaying((p) => !p)}>
          <Icon name={playing ? 'pause' : 'play'} fill />
        </button>
        <div
          className="vid-track"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setPos((e.clientX - r.left) / r.width);
          }}
        >
          <i style={{ width: pos * 100 + '%' }} />
          <b style={{ left: pos * 100 + '%' }} />
        </div>
        <span className="vid-time">{fmt(pos * dur)} / {fmt(dur)}</span>
      </div>
    </div>
  );
}

interface DensityResultProps {
  version: Version;
  onReset: () => void;
}

function DensityResult({ version, onReset }: DensityResultProps) {
  const perCm2 = (PEAK / AREA_CM2).toFixed(1);
  const level = parseFloat(perCm2) < 1.5 ? '낮음' : parseFloat(perCm2) < 3 ? '보통' : '높음';
  const avg = Math.round(FRAME_COUNTS.reduce((a, b) => a + b, 0) / FRAME_COUNTS.length);

  return (
    <div className="fade-in grid grid-2">
      <div>
        <VideoPlayer label="트래킹 결과 영상 · ID 라벨 오버레이"><MovingBoxes /></VideoPlayer>
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div className="card-title"><Icon name="trend" />프레임별 출현 수 추이</div>
            <span className="card-sub">peak {PEAK}마리</span>
          </div>
          <LineChart data={FRAME_COUNTS} />
        </div>
      </div>

      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-soft-2)' }}>
          <div className="card-head"><div className="card-title"><Icon name="grid" />밀도 등급</div></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div className="stat-value tnum" style={{ fontSize: 44 }}>{perCm2}<small> 마리/㎠</small></div>
          </div>
          <div className="grade-row" style={{ marginTop: 12 }}>
            <Badge kind={gradeOf(level)} dot>{level}</Badge>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>측정 면적 {AREA_CM2}㎠ 기준</span>
          </div>
        </div>

        <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat">
            <div className="stat-label">최대 동시 출현</div>
            <div className="stat-value tnum">{PEAK}<small>마리</small></div>
            <div className="stat-sub">peak concurrent</div>
          </div>
          <div className="stat">
            <div className="stat-label">평균 출현 수</div>
            <div className="stat-value tnum">{avg}<small>마리</small></div>
            <div className="stat-sub">frame average</div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="cpu" />측정 정보</div>
            <Badge kind="accent" dot>완료</Badge>
          </div>
          <div className="metric-row"><span className="mr-k">사용 모델</span><span className="mr-v mono">{version.tag}</span></div>
          <div className="metric-row"><span className="mr-k">트래커</span><span className="mr-v mono">ByteTrack</span></div>
          <div className="metric-row"><span className="mr-k">분석 프레임</span><span className="mr-v mono">540 / 540</span></div>
          <div className="metric-row"><span className="mr-k">고유 트랙 ID</span><span className="mr-v mono">37개</span></div>
          <div className="metric-row"><span className="mr-k">처리 시간</span><span className="mr-v mono">14.2초</span></div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-block" onClick={onReset}><Icon name="upload" />새 영상 분석</button>
          <button className="btn btn-ghost"><Icon name="download" />결과 영상 저장</button>
        </div>
      </div>
    </div>
  );
}

interface DensityPageProps {
  version: Version;
}

export function DensityPage({ version }: DensityPageProps) {
  const [phase, setPhase] = useState<PhaseId>('idle');

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />밀도 측정 · DENSITY</div>
        <h1 className="page-title">영상 기반 밀도 측정</h1>
        <p className="page-desc">영상을 업로드하면 모델이 프레임마다 응애를 추적해 마릿수를 집계하고, 단위 면적당 밀도와 등급을 환산합니다.</p>
      </div>

      {phase === 'idle' && (
        <div className="grid grid-2">
          <UploadZone accept="MP4 · MOV · AVI · 최대 500MB" kind="video" onPick={() => setPhase('file')} />
          <div className="card">
            <div className="card-head"><div className="card-title"><Icon name="info" />측정 단계</div></div>
            <div className="metric-row"><span className="mr-k">1. 트래킹</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>프레임별 객체 추적</span></div>
            <div className="metric-row"><span className="mr-k">2. 집계</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>고유 개체 수 산출</span></div>
            <div className="metric-row"><span className="mr-k">3. 환산</span><span className="mr-v" style={{ color: 'var(--text-2)', fontWeight: 500 }}>면적당 밀도 · 등급</span></div>
          </div>
        </div>
      )}

      {phase === 'file' && (
        <div className="grid" style={{ maxWidth: 560 }}>
          <FileChip name="mite_field_clip.mp4" meta="1920 × 1080 · 18초 · 540 프레임 · 42 MB" kind="video" onRemove={() => setPhase('idle')} />
          <button className="btn btn-primary btn-lg btn-block" onClick={() => setPhase('proc')}>
            <Icon name="grid" />{version.tag} 모델로 밀도 측정
          </button>
        </div>
      )}

      {phase === 'proc' && <Processing steps={DEN_STEPS} onDone={() => setPhase('result')} duration={3200} />}
      {phase === 'result' && <DensityResult version={version} onReset={() => setPhase('idle')} />}
    </div>
  );
}
