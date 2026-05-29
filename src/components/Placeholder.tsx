import './Placeholder.css';
import type { ReactNode } from 'react';

interface PlaceholderProps {
  label: string;
  ratio?: string;
  children?: ReactNode;
}

export function Placeholder({ label, ratio = '16 / 10', children }: PlaceholderProps) {
  return (
    <div className="ph" style={{ aspectRatio: ratio }}>
      {children}
      <div className="ph-label">{label}</div>
    </div>
  );
}
