import { useState, useEffect } from 'react';
import './Processing.css';

interface ProcessingProps {
  steps: string[];
  onDone: () => void;
  duration?: number;
  percent?: number;
  message?: string;
  currentSample?: number;
  totalSamples?: number;
}

export function Processing({ steps, onDone, duration = 2600, percent, message, currentSample, totalSamples }: ProcessingProps) {
  const [pct, setPct] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (percent !== undefined) {
      setPct(percent);
      setStepIdx(Math.min(steps.length - 1, Math.floor((percent / 100) * steps.length)));
      return;
    }
    const t0 = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 2.2);
      setPct(Math.round(eased * 100));
      setStepIdx(Math.min(steps.length - 1, Math.floor(p * steps.length)));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, 280);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onDone, percent, steps]);

  return (
    <div className="card">
      <div className="proc">
        <div className="proc-ring" />
        <div className="proc-title">서버 분석 중...</div>
        <div className="proc-step">{message || steps[stepIdx]}</div>
        {totalSamples !== undefined && (
          <div className="proc-step">샘플 {currentSample || 0} / {totalSamples}</div>
        )}
        <div className="proc-bar"><i style={{ width: pct + '%' }} /></div>
        <div className="proc-pct">{pct}%</div>
      </div>
    </div>
  );
}
