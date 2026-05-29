import './Badge.css';
import type { ReactNode } from 'react';

type BadgeKind = 'accent' | 'neutral' | 'low' | 'mid' | 'high';

interface BadgeProps {
  kind?: BadgeKind;
  dot?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}

const kindClass: Record<BadgeKind, string> = {
  accent:  'badge-accent',
  neutral: 'badge-neutral',
  low:     'badge-low',
  mid:     'badge-mid',
  high:    'badge-high',
};

export function Badge({ kind = 'neutral', dot, children, style }: BadgeProps) {
  return (
    <span className={`badge ${kindClass[kind]}`} style={style}>
      {dot && <span className="b-dot" style={{ background: 'currentColor' }} />}
      {children}
    </span>
  );
}

export function gradeOf(level: string): BadgeKind {
  if (level === '낮음') return 'low';
  if (level === '보통') return 'mid';
  return 'high';
}
