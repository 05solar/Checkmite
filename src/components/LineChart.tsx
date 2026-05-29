interface LineChartProps {
  data: number[];
  height?: number;
  color?: string;
  xlabel?: string;
}

export function LineChart({ data, height = 180, color = 'var(--accent)', xlabel = '프레임' }: LineChartProps) {
  const w = 640;
  const pad = { l: 38, r: 14, t: 14, b: 26 };
  const max = Math.max(...data) * 1.15 || 1;
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;

  const px = (i: number) => pad.l + (i / (data.length - 1)) * iw;
  const py = (v: number) => pad.t + ih - (v / max) * ih;

  const line = data.map((v, i) => `${i ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${px(data.length - 1)} ${pad.t + ih} L ${px(0)} ${pad.t + ih} Z`;

  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = pad.t + (ih / ticks) * i;
        const val = Math.round(max - (max / ticks) * i);
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.l - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="var(--text-3)" fontFamily="var(--mono)">{val}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#lcg)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <text x={pad.l} y={height - 6} fontSize="10" fill="var(--text-3)">0</text>
      <text x={w - pad.r} y={height - 6} textAnchor="end" fontSize="10" fill="var(--text-3)">{xlabel} {data.length}</text>
    </svg>
  );
}
