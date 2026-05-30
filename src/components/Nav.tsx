import { useState } from 'react';
import './Nav.css';
import checkmiteTitle from '../public/checkmite-title.png';
import { Icon } from './Icons';
import type { TabId, Theme } from '../types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'detection', label: '객체 탐지', icon: 'scan' },
  { id: 'density', label: '밀도 측정', icon: 'grid' },
  { id: 'vitality', label: '활력도 측정', icon: 'pulse' },
];

interface NavProps {
  tab: TabId;
  onTab: (id: TabId) => void;
  theme: Theme;
  onTheme: () => void;
}

export function Nav({ tab, onTab, theme, onTheme }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const selectTab = (id: TabId) => {
    onTab(id);
    setMenuOpen(false);
  };

  return (
    <nav className="nav">
      <div className="brand">
        <img className="brand-title" src={checkmiteTitle} alt="CheckMite" />
      </div>
      <div className="nav-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => selectTab(t.id)}
          >
            <Icon name={t.icon} /><span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="nav-right">
        <div className="mobile-menu">
          <button
            className="icon-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
          {menuOpen && (
            <div className="mobile-menu-panel">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`mobile-menu-item${tab === t.id ? ' active' : ''}`}
                  onClick={() => selectTab(t.id)}
                >
                  <Icon name={t.icon} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
