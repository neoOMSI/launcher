import React from 'react';
import './styles/app.css';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { Tooltips } from './components/Tooltip';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdateBanner } from './components/UpdateBanner';
import { EngineProvider, useEngine } from './lib/engine';
import { NavProvider, ToastProvider, useNav, type PageId } from './lib/nav';
import { DutyProvider } from './lib/duty';
import { SettingsProvider, useSettings } from './lib/settings';
import { DrivePage } from './pages/drive/DrivePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ControlsPage } from './pages/controls/ControlsPage';
import { ModsPage } from './pages/mods/ModsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SessionsPage } from './pages/sessions/SessionsPage';
import { TimetablesPage } from './pages/timetables/TimetablesPage';
import { TutorialsPage } from './pages/tutorials/TutorialsPage';
import { MultiplayerPage } from './pages/multiplayer/MultiplayerPage';

const PAGES: Record<PageId, React.FC> = {
  drive: DrivePage,
  multiplayer: MultiplayerPage,
  tutorials: TutorialsPage,
  mods: ModsPage,
  timetables: TimetablesPage,
  profile: ProfilePage,
  sessions: SessionsPage,
  settings: SettingsPage,
  controls: ControlsPage,
};

function Current() {
  const { route } = useNav();
  const { log } = useEngine();
  const Screen = PAGES[route.page];
  return (
    <ErrorBoundary key={route.page} onError={log}>
      <Screen />
    </ErrorBoundary>
  );
}

function Shell() {
  const { language } = useSettings();
  return (
    <div key={language} className="flex h-screen flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <UpdateBanner />
          <Current />
        </main>
      </div>
    </div>
  );
}

export const App: React.FC = () => (
  <EngineProvider>
    <SettingsProvider>
      <NavProvider>
        <ToastProvider>
          <DutyProvider>
            <Shell />
            <Tooltips />
          </DutyProvider>
        </ToastProvider>
      </NavProvider>
    </SettingsProvider>
  </EngineProvider>
);
