import { useState } from 'react';
import './ModelsPage.css';
import { Icon } from '../components/Icons';
import { Badge } from '../components/Badge';
import type { Registry, ModelKey, Version } from '../types';

const MODEL_META: Record<ModelKey, { name: string; sub: string; icon: string; metricLabel: string }> = {
  detection: { name: '객체 탐지 모델', sub: '사진 → 천적·해충 탐지', icon: 'scan',  metricLabel: 'mAP@0.5' },
  density:   { name: '밀도 측정 모델', sub: '영상 → 트래킹·밀도',    icon: 'grid',  metricLabel: 'MOTA' },
  vitality:  { name: '활력도 측정 모델', sub: '영상 → 활력도 점수',   icon: 'pulse', metricLabel: '정확도' },
};

const INPUT_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
  border: '1px solid var(--border)', borderRadius: 9, background: 'var(--surface-2)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', fontWeight: 400,
};

interface UploadModalProps {
  modelKey: ModelKey;
  onClose: () => void;
  onConfirm: (info: { tag: string; note: string }) => void;
}

function UploadModal({ modelKey, onClose, onConfirm }: UploadModalProps) {
  const [stage, setStage] = useState<'pick' | 'uploading' | 'name'>('pick');
  const [pct, setPct] = useState(0);
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');
  const meta = MODEL_META[modelKey];

  const startUpload = () => {
    setStage('uploading');
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setTimeout(() => setStage('name'), 300);
      }
      setPct(Math.round(p));
    }, 180);
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card fade-in modal-card">
        <div className="card-head">
          <div className="card-title"><Icon name="upload" />{meta.name} 업로드</div>
          <button className="fc-x" onClick={onClose}><Icon name="x" /></button>
        </div>

        {stage === 'pick' && (
          <div className="upload modal-upload" onClick={startUpload}>
            <div className="up-ic"><Icon name="layers" /></div>
            <div className="up-title">모델 가중치 파일 선택</div>
            <div className="up-desc">새 버전의 학습된 모델 파일을 업로드합니다</div>
            <div className="up-formats">.pt · .onnx · .pth · 최대 2GB</div>
          </div>
        )}

        {stage === 'uploading' && (
          <div className="modal-uploading">
            <div className="file-chip" style={{ marginBottom: 16 }}>
              <div className="fc-ic"><Icon name="layers" /></div>
              <div style={{ minWidth: 0 }}>
                <div className="fc-name">{modelKey}_v_new.pt</div>
                <div className="fc-meta mono">업로드 중… {pct}%</div>
              </div>
            </div>
            <div className="proc-bar" style={{ margin: 0, maxWidth: '100%' }}><i style={{ width: pct + '%' }} /></div>
          </div>
        )}

        {stage === 'name' && (
          <div className="modal-name-form">
            <div className="hint"><Icon name="check" /><span>업로드 완료. 버전 정보를 입력하세요.</span></div>
            <label className="modal-label">
              버전 태그
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="예: v2.4.0"
                className="mono"
                style={INPUT_STYLE}
              />
            </label>
            <label className="modal-label">
              설명
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 야간 촬영 데이터 추가 학습"
                style={INPUT_STYLE}
              />
            </label>
            <button
              className="btn btn-primary btn-block"
              disabled={!tag.trim()}
              onClick={() => onConfirm({ tag: tag.trim(), note: note.trim() || '신규 업로드 버전' })}
            >
              <Icon name="check" />버전 등록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ModelGroupProps {
  modelKey: ModelKey;
  data: { activeId: string; versions: Version[] };
  onActivate: (key: ModelKey, vid: string) => void;
  onUpload: (key: ModelKey) => void;
}

function ModelGroup({ modelKey, data, onActivate, onUpload }: ModelGroupProps) {
  const meta = MODEL_META[modelKey];
  return (
    <div className="card model-group">
      <div className="card-head">
        <div className="mg-head">
          <div className="mg-ic"><Icon name={meta.icon} /></div>
          <div>
            <div className="mg-name">{meta.name}</div>
            <div className="mg-sub">{meta.sub} · {data.versions.length}개 버전</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => onUpload(modelKey)}>
          <Icon name="upload" />버전 업로드
        </button>
      </div>
      <div className="ver-table">
        {data.versions.map((v) => {
          const active = v.id === data.activeId;
          return (
            <div className="vt-row" key={v.id}>
              <div className="vt-main">
                <span className="vt-tag">{v.tag}</span>
                {active && <Badge kind="accent" dot>활성</Badge>}
                {v.beta && <Badge kind="mid">beta</Badge>}
                <span className="vt-name">{v.note}</span>
              </div>
              <div className="vt-metric">{v.metric}<small>{meta.metricLabel}</small></div>
              <div className="vt-date">{v.date}</div>
              <div className="vt-act">
                {active
                  ? <button className="btn btn-ghost btn-sm" disabled style={{ opacity: .55 }}><Icon name="check" />사용 중</button>
                  : <button className="btn btn-primary btn-sm" onClick={() => onActivate(modelKey, v.id)}>활성화</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ModelsPageProps {
  registry: Registry;
  onActivate: (key: ModelKey, vid: string) => void;
  onUpload: (key: ModelKey) => void;
  uploadTarget: ModelKey | null;
  onCloseUpload: () => void;
  onConfirmUpload: (key: ModelKey, info: { tag: string; note: string }) => void;
}

export function ModelsPage({ registry, onActivate, onUpload, uploadTarget, onCloseUpload, onConfirmUpload }: ModelsPageProps) {
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />모델 관리 · MODELS</div>
        <h1 className="page-title">모델 버전 관리</h1>
        <p className="page-desc">모델별로 학습된 버전을 업로드하고, 분석에 사용할 활성 버전을 지정합니다. 활성 버전은 상단 네비게이션 바에서도 언제든 전환할 수 있습니다.</p>
      </div>
      {(Object.keys(MODEL_META) as ModelKey[]).map((k) => (
        <ModelGroup key={k} modelKey={k} data={registry[k]} onActivate={onActivate} onUpload={onUpload} />
      ))}
      {uploadTarget && (
        <UploadModal
          modelKey={uploadTarget}
          onClose={onCloseUpload}
          onConfirm={(info) => onConfirmUpload(uploadTarget, info)}
        />
      )}
    </div>
  );
}
