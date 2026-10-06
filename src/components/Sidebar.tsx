import React from 'react';
import { t } from '../i18n';
import type { EngineStatus } from '../types/scaffold';
import wordmarkSvg from '../../assets/logos/wordmark-gradient-dark.svg';

export type PrimaryTab = 'launch' | 'content' | 'settings' | 'diagnostics';

interface SidebarProps {
  activeTab: PrimaryTab;
  onSelectTab: (tab: PrimaryTab) => void;
  status: EngineStatus;
  logCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, status, logCount }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={wordmarkSvg} alt={t('app.brandingAlt')} className="brand-logo" />
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <button
            className={`nav-item ${activeTab === 'launch' ? 'active' : ''}`}
            onClick={() => onSelectTab('launch')}
          >
            {t('navigation.launch')}
          </button>
          <button
            className={`nav-item ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => onSelectTab('content')}
          >
            {t('navigation.content')}
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onSelectTab('settings')}
          >
            {t('navigation.settings')}
          </button>
        </div>

        <div className="nav-group-bottom">
          <button
            className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => onSelectTab('diagnostics')}
          >
            <span>{t('navigation.diagnostics')}</span>
            {logCount > 0 && <span className="nav-badge">{logCount}</span>}
          </button>

          <div className="status-indicator" title={status.lastError ?? status.connectionState}>
            <span className={`status-pip ${status.connectionState}`} />
            <span className="status-text">
              {t(`connection.${status.connectionState}`) || status.connectionState}
            </span>
          </div>
        </div>
      </nav>
    </aside>
  );
};
