import { useState, useEffect } from 'react';
import './Processing.css';

interface ProcessingProps {
  steps: string[];
  onDone: () => void;
  duration?: number;
}

export function Processing({ steps, onDone, duration = 2600 }: ProcessingProps) {
  const [pct, setPct] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
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
  }, [duration, onDone, steps]);

  return (
    <div className="card">
      <div className="proc">
        <div className="proc-ring" />
        <div className="proc-title">서버 분석 중...</div>
        <div className="proc-step">{steps[stepIdx]}</div>
        <div className="proc-bar"><i style={{ width: pct + '%' }} /></div>
        <div className="proc-pct">{pct}%</div>
      </div>
    </div>
  );
}
