import './Gauge.css';

interface GaugeProps {
  value: number;
  size?: number;
  label?: string;
}

export function Gauge({ value, size = 200, label = '활력도' }: GaugeProps) {
  const r = (size - 28) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const start = 135;
  const sweep = 270;

  const polar = (deg: number): [number, number] => {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from);
    const [x2, y2] = polar(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const end = start + sweep * (value / 100);

  return (
    <div className="gauge-wrap">
      <div className="gauge" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <path d={arc(start, start + sweep)} fill="none"
            stroke="var(--surface-3)" strokeWidth="14" strokeLinecap="round" />
          <path d={arc(start, end)} fill="none"
            stroke="var(--accent)" strokeWidth="14" strokeLinecap="round"
            style={{ transition: 'all .9s cubic-bezier(.22,1,.36,1)' }} />
        </svg>
        <div className="gauge-center">
          <div className="gauge-score tnum">{Math.round(value)}<small> / 100</small></div>
          <div className="gauge-cap">{label}</div>
        </div>
      </div>
    </div>
  );
}
