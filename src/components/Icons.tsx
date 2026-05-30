interface IcProps {
  d: string | string[];
  fill?: boolean;
}

function Ic({ d, fill }: IcProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {Array.isArray(d)
        ? d.map((p, i) => <path key={i} d={p} />)
        : <path d={d} />}
    </svg>
  );
}

const ICONS: Record<string, string | string[]> = {
  scan:     'M4 8V6a2 2 0 0 1 2-2h2 M16 4h2a2 2 0 0 1 2 2v2 M20 16v2a2 2 0 0 1-2 2h-2 M8 20H6a2 2 0 0 1-2-2v-2 M7 12h10',
  grid:     ['M4 5h16', 'M4 12h16', 'M4 19h16', 'M9 5v14', 'M15 5v14'],
  pulse:    'M3 12h4l2-7 4 14 2-7h6',
  box:      ['M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M3.3 7 12 12l8.7-5', 'M12 22V12'],
  upload:   ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  image:    ['M3 5h18v14H3z', 'M3 15l5-5 4 4 3-3 6 6'],
  video:    ['M3 5h13v14H3z', 'M16 9l5-3v12l-5-3'],
  play:     'M7 5v14l11-7z',
  pause:    ['M8 5v14', 'M16 5v14'],
  x:        ['M6 6l12 12', 'M18 6L6 18'],
  plus:     ['M12 5v14', 'M5 12h14'],
  menu:     ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  check:    'M5 12l5 5L20 6',
  chevron:  'M6 9l6 6 6-6',
  sun:      ['M12 3v2', 'M12 19v2', 'M5 5l1.4 1.4', 'M17.6 17.6L19 19', 'M3 12h2', 'M19 12h2', 'M5 19l1.4-1.4', 'M17.6 6.4L19 5'],
  moon:     'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  info:     ['M12 8h.01', 'M11 12h1v4h1'],
  clock:    ['M12 7v5l3 2'],
  cpu:      ['M6 6h12v12H6z', 'M9 9h6v6H9z', 'M9 2v2', 'M15 2v2', 'M9 20v2', 'M15 20v2', 'M2 9h2', 'M2 15h2', 'M20 9h2', 'M20 15h2'],
  area:     ['M3 3v18h18', 'M7 14l4-4 3 3 5-6'],
  layers:   ['M12 2 2 7l10 5 10-5z', 'M2 12l10 5 10-5', 'M2 17l10 5 10-5'],
  download: ['M12 4v12', 'M7 11l5 5 5-5', 'M4 20h16'],
  trend:    'M3 17l6-6 4 4 8-8',
  growth:   ['M4 19V5', 'M4 19h16', 'M7 15l4-4 3 3 5-7'],
  trash:    ['M4 7h16', 'M9 7V4h6v3', 'M7 7l1 14h8l1-14', 'M10 11v6', 'M14 11v6'],
  restore:  ['M4 7v5h5', 'M5 12a7 7 0 1 0 2-5', 'M4 12l4-4'],
  spark:    'M12 3l2.2 6.2L20 11l-5.8 1.8L12 19l-2.2-6.2L4 11l5.8-1.8z',
  ruler:    ['M3 8l13 13 5-5L8 3z', 'M7 8l2 2', 'M11 6l2 2', 'M9 12l2 2', 'M13 10l2 2'],
};

interface IconProps {
  name: string;
  fill?: boolean;
}

export function Icon({ name, fill }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  return <Ic d={d} fill={fill} />;
}
