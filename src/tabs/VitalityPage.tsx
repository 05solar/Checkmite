import { useState } from 'react';
import './VitalityPage.css';
import { Icon } from '../components/Icons';
import { UploadZone } from '../components/UploadZone';
import { FileChip } from '../components/FileChip';
import { Processing } from '../components/Processing';
import { Badge, gradeOf } from '../components/Badge';
import { Gauge } from '../components/Gauge';
import { Heatmap } from '../components/Heatmap';
import { LineChart } from '../components/LineChart';
import type { PhaseId } from '../types';

const VIT_STEPS = [
  '영상 디코딩 및 프레임 분할…',
  '개체 추적 및 궤적 추출…',
  '프레임 간 이동량(optical flow) 계산…',
  '움직임 분포·밀집도 분석…',
  '활력도 점수 산출…',
];

const VIT_SCORE = 78;
const VIT_TREND = [62, 58, 65, 71, 68, 74, 79, 83, 80, 77, 82, 85, 81, 78, 76, 80, 84, 79];

const HEAT = (() => {
  const cells: number[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 14; c++) {
      const cx = 9, cy = 3.5;
      const d = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
      let v = Math.max(0, 1 - d / 7) * (0.6 + 0.4 * Math.sin(c * 0.9 + r));
      const cx2 = 3, cy2 = 5;
      const d2 = Math.sqrt((c - cx2) ** 2 + (r - cy2) ** 2);
      v = Math.max(v, Math.max(0, 1 - d2 / 4) * 0.7);
      cells.push(Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 0.12)));
    }
  }
  return cells;
})();

interface VitalityResultProps {
  onReset: () => void;
}

function VitalityResult({ onReset }: VitalityResultProps) {
  const level = VIT_SCORE < 40 ? '낮음' : VIT_SCORE < 70 ? '보통' : '높음';

  return (
    <div className="fade-in grid grid-2">
      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card vit-gauge-card">
          <Gauge value={VIT_SCORE} />
          <div className="grade-row" style={{ marginTop: 18 }}>
            <Badge kind={gradeOf(level)} dot>활력도 {level}</Badge>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title"><Icon name="spark" />활력도 세부 지표</div></div>
          <div className="metric-row"><span className="mr-k">평균 이동 속도</span><span className="mr-v mono">2.4 mm/s</span></div>
          <div className="metric-row"><span className="mr-k">활동 개체 비율</span><span className="mr-v mono">86%</span></div>
          <div className="metric-row"><span className="mr-k">정지 개체 비율</span><span className="mr-v mono">14%</span></div>
          <div className="metric-row"><span className="mr-k">평균 이동 거리</span><span className="mr-v mono">41.7 mm</span></div>
          <div className="metric-row"><span className="mr-k">방향 전환 빈도</span><span className="mr-v mono">초당 1.8회</span></div>
        </div>
      </div>

      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="grid" />움직임 히트맵</div>
            <span className="card-sub">motion heatmap</span>
          </div>
          <Heatmap data={HEAT} />
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="pulse" />시간별 활력도 추이</div>
            <span className="card-sub">초 단위</span>
          </div>
          <LineChart data={VIT_TREND} xlabel="구간" />
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="cpu" />측정 정보</div>
            <Badge kind="accent" dot>완료</Badge>
          </div>
          <div className="metric-row"><span className="mr-k">분석 프레임</span><span className="mr-v mono">450 / 450</span></div>
          <div className="metric-row"><span className="mr-k">처리 시간</span><span className="mr-v mono">11.6초</span></div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-block" onClick={onReset}><Icon name="upload" />새 영상 분석</button>
          <button className="btn btn-ghost"><Icon name="download" />리포트 저장</button>
        </div>
      </div>
    </div>
  );
}

export function VitalityPage() {
  const [phase, setPhase] = useState<PhaseId>('idle');

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />활력도 측정 · VITALITY</div>
        <h1 className="page-title">영상 기반 활력도 측정</h1>
        <p className="page-desc">영상을 업로드하면 서버가 개체들의 움직임을 분석해 0~100점의 활력도 점수와 움직임 히트맵을 산출합니다.</p>
      </div>

      {phase === 'idle' && (
        <div className="grid grid-2">
          <UploadZone accept="MP4 · MOV · AVI · 최대 500MB" kind="video" onPick={() => setPhase('file')} />
          <div className="card">
            <div className="card-head"><div className="card-title"><Icon name="info" />활력도란?</div></div>
            <p style={{ margin: '0 0 4px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
              개체의 이동량·속도·활동 비율을 종합해 군집의 건강 상태를 0~100점으로 나타냅니다. 점수가 높을수록 활발하게 움직이는 개체가 많음을 의미합니다.
            </p>
          </div>
        </div>
      )}

      {phase === 'file' && (
        <div className="grid" style={{ maxWidth: 560 }}>
          <FileChip name="mite_activity_clip.mp4" meta="1920 × 1080 · 15초 · 450 프레임 · 36 MB" kind="video" onRemove={() => setPhase('idle')} />
          <button className="btn btn-primary btn-lg btn-block" onClick={() => setPhase('proc')}>
            <Icon name="pulse" />활력도 측정
          </button>
        </div>
      )}

      {phase === 'proc' && <Processing steps={VIT_STEPS} onDone={() => setPhase('result')} duration={3000} />}
      {phase === 'result' && <VitalityResult onReset={() => setPhase('idle')} />}
    </div>
  );
}
