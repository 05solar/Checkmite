import { useState, useEffect, useRef } from 'react';
import './Nav.css';
import { Icon } from './Icons';
import type { TabId, Theme, Version } from '../types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'detection', label: '객체 탐지', icon: 'scan' },
  { id: 'density',   label: '밀도 측정', icon: 'grid' },
  { id: 'vitality',  label: '활력도 측정', icon: 'pulse' },
  { id: 'models',    label: '모델 관리', icon: 'box' },
];

interface VersionDropdownProps {
  model: string;
  versions: Version[];
  activeId: string;
  onSelect: (id: string) => void;
}

function VersionDropdown({ model, versions, activeId, onSelect }: VersionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const active = versions.find((v) => v.id === activeId) ?? versions[0];

  return (
    <div className="ver" ref={ref}>
      <button className="ver-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="ver-dot" />
        <span className="ver-meta">
          <span className="vl">{model} · 활성 모델</span>
          <span className="vv mono">{active?.tag}</span>
        </span>
        <span className="chev"><Icon name="chevron" /></span>
      </button>
      {open && (
        <div className="ver-menu" role="menu">
          <div className="vm-head">{model} 버전 선택</div>
          {versions.map((v) => (
            <button key={v.id} className="ver-item" role="menuitem"
              onClick={() => { onSelect(v.id); setOpen(false); }}>
              <div className="vi-body">
                <div className="vi-name">
                  <span className="mono">{v.tag}</span>
                  {v.id === activeId && <span style={{ fontSize: 11, color: 'var(--accent)' }}>· 현재</span>}
                  {v.beta && <span className="badge badge-mid" style={{ padding: '1px 6px', fontSize: 10 }}>beta</span>}
                </div>
                <div className="vi-sub">{v.note} · {v.metric}</div>
              </div>
              {v.id === activeId && <span className="vi-check"><Icon name="check" /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface NavProps {
  tab: TabId;
  onTab: (id: TabId) => void;
  theme: Theme;
  onTheme: () => void;
  model: string;
  versions: Version[];
  activeId: string;
  onSelectVersion: (id: string) => void;
}

export function Nav({ tab, onTab, theme, onTheme, model, versions, activeId, onSelectVersion }: NavProps) {
  return (
    <nav className="nav">
      <div className="brand">
        <div className="brand-mark"><span /></div>
        <div className="brand-name">Check<b>Mite</b></div>
      </div>
      <div className="nav-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => onTab(t.id)}
          >
            <Icon name={t.icon} /><span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="nav-right">
        <VersionDropdown
          model={model}
          versions={versions}
          activeId={activeId}
          onSelect={onSelectVersion}
        />
        <button
          className="icon-btn"
          onClick={onTheme}
          aria-label="테마 전환"
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </nav>
  );
}
