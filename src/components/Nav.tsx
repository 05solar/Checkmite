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
            onClick={() => onTab(t.id)}
          >
            <Icon name={t.icon} /><span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="nav-right">
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
