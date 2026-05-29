import './FileChip.css';
import { Icon } from './Icons';

interface FileChipProps {
  name: string;
  meta: string;
  kind: 'image' | 'video';
  onRemove?: () => void;
}

export function FileChip({ name, meta, kind, onRemove }: FileChipProps) {
  return (
    <div className="file-chip">
      <div className="fc-ic">
        <Icon name={kind === 'video' ? 'video' : 'image'} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="fc-name">{name}</div>
        <div className="fc-meta mono">{meta}</div>
      </div>
      {onRemove && (
        <button className="fc-x" onClick={onRemove} aria-label="제거">
          <Icon name="x" />
        </button>
      )}
    </div>
  );
}
