import React, { useEffect, useState } from 'react';
import './styles/app.css';
import { Sidebar, type PrimaryTab } from './components/Sidebar';
import { SessionPage } from './pages/SessionPage';
import { ContentPage } from './pages/ContentPage';
import { SettingsPage } from './pages/SettingsPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import type { EngineStatus, SessionEvent } from './types/scaffold';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PrimaryTab>('launch');
  const [status, setStatus] = useState<EngineStatus>({
    connectionState: 'disconnected',
    capabilities: [],
  });
  const [currentSession, setCurrentSession] = useState<SessionEvent | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!window.neoomsi) {
      return;
    }

    const unsubStatus = window.neoomsi.onEngineStatus((newStatus) => {
      setStatus(newStatus);
    });

    const unsubSession = window.neoomsi.onSessionEvent((event) => {
      setCurrentSession(event);
      setLogs((prev) => [...prev, `[Session] ${event.message}`]);
    });

    const unsubLogs = window.neoomsi.onDiagnosticLog((log) => {
      setLogs((prev) => [...prev, log]);
    });

    window.neoomsi
      .getEngineStatus()
      .then((s) => {
        setStatus(s);
        if (s.connectionState === 'disconnected') {
          window.neoomsi.startEngine().catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            setLogs((prev) => [...prev, `[Launcher] Auto-start failed: ${message}`]);
          });
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setLogs((prev) => [...prev, `[Launcher] Failed to query engine status: ${message}`]);
      });

    return () => {
      unsubStatus();
      unsubSession();
      unsubLogs();
    };
  }, []);

  const handleConnect = async () => {
    if (window.neoomsi) {
      try {
        await window.neoomsi.startEngine();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setLogs((prev) => [...prev, `[Launcher] Connection attempt failed: ${message}`]);
      }
    }
  };

  const handleDisconnect = async () => {
    if (window.neoomsi) {
      try {
        await window.neoomsi.stopEngine();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setLogs((prev) => [...prev, `[Launcher] Disconnect failed: ${message}`]);
      }
    }
  };

  return (
    <div className="desktop-layout">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        status={status}
        logCount={logs.length}
      />

      <main className="main-viewport">
        {activeTab === 'launch' && (
          <SessionPage currentSession={currentSession} onSessionEvent={setCurrentSession} />
        )}
        {activeTab === 'content' && <ContentPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'diagnostics' && (
          <DiagnosticsPage
            status={status}
            logs={logs}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onClearLogs={() => setLogs([])}
          />
        )}
      </main>
    </div>
  );
};
