import './Heatmap.css';

interface HeatmapProps {
  rows?: number;
  cols?: number;
  data: number[];
  label?: string;
}

export function Heatmap({ cols = 14, data, label = '움직임 밀집도' }: HeatmapProps) {
  return (
    <div>
      <div className="heat-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {data.map((v, i) => (
          <div
            key={i}
            className="heat-cell"
            style={{
              background: v < 0.04
                ? 'var(--surface-3)'
                : `color-mix(in srgb, var(--accent) ${Math.round(v * 100)}%, var(--surface-3))`,
            }}
            title={`강도 ${(v * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="legend" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          낮음
          <span style={{ display: 'flex', gap: 2 }}>
            {[0.12, 0.32, 0.55, 0.78, 1].map((o, i) => (
              <span key={i} style={{
                width: 14, height: 11, borderRadius: 2,
                background: `color-mix(in srgb, var(--accent) ${o * 100}%, var(--surface-3))`,
              }} />
            ))}
          </span>
          높음
        </span>
      </div>
    </div>
  );
}
