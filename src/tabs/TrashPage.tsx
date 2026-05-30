import './TrashPage.css';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icons';
import type { TrashedCultureBox } from '../types';

interface TrashPageProps {
  items: TrashedCultureBox[];
  onRestore: (id: string) => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function TrashPage({ items, onRestore }: TrashPageProps) {
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />휴지통 · TRASH.DB</div>
        <h1 className="page-title">삭제된 사육박스 보관함</h1>
      </div>

      {items.length === 0 ? (
        <div className="card trash-empty">
          <Icon name="trash" />
          <strong>휴지통이 비어 있습니다</strong>
          <span>삭제된 사육박스가 생기면 이곳에서 복구할 수 있습니다.</span>
        </div>
      ) : (
        <div className="trash-list">
          {items.map((item) => (
            <div className="card trash-item" key={`${item.box.id}-${item.deletedAt}`}>
              <div className="trash-item-main">
                <div>
                  <div className="trash-title">{item.box.name}</div>
                  <div className="trash-meta">
                    <span className="mono">{item.box.id}</span>
                    <span>삭제 {formatDate(item.deletedAt)}</span>
                  </div>
                </div>
                <Badge kind="neutral">{item.measurements.length}개 측정 이력</Badge>
              </div>
              {item.box.memo && <p className="trash-memo">{item.box.memo}</p>}
              <div className="trash-actions">
                <button className="btn btn-primary" onClick={() => onRestore(item.box.id)}>
                  <Icon name="restore" />복구
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
