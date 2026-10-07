import React from 'react';
import './styles/app.css';
import { Sidebar } from './components/Sidebar';
import { EmptyState, Page } from './components/ui';
import { t } from './i18n';
import { EngineProvider, useEngine } from './lib/engine';
import { NavProvider, ToastProvider, useNav, type PageId } from './lib/nav';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { DrivePage } from './pages/drive/DrivePage';
import { DutyProvider } from './lib/duty';

const PAGES: Partial<Record<PageId, React.FC>> = {
  drive: DrivePage,
};

function Diagnostics() {
  const { status, logs, connect, disconnect, clearLogs } = useEngine();
  return (
    <DiagnosticsPage
      status={status}
      logs={logs}
      onConnect={connect}
      onDisconnect={disconnect}
      onClearLogs={clearLogs}
    />
  );
}

function Current() {
  const { route } = useNav();
  if (route.page === 'settings') return <Diagnostics />;
  const Screen = PAGES[route.page];
  if (Screen) return <Screen />;
  return (
    <Page title={t(`nav.${route.page}`)}>
      <EmptyState icon="construction" title={t(`nav.${route.page}`)} />
    </Page>
  );
}

export const App: React.FC = () => (
  <EngineProvider>
    <NavProvider>
      <ToastProvider>
        <DutyProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">
              <Current />
            </main>
          </div>
        </DutyProvider>
      </ToastProvider>
    </NavProvider>
  </EngineProvider>
);
