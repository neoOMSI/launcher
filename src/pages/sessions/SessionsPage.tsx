import React, { useEffect, useState } from 'react';
import { ListGroup, ListRow } from '../../components/List';
import { Screen } from '../../components/Screen';
import { Notice, Segmented } from '../../components/ui';
import { t } from '../../i18n';
import { useEngine } from '../../lib/engine';
import { useNav } from '../../lib/nav';
import { readLan } from './clock';
import { Game } from './Game';
import { History } from './History';
import { Lan } from './Lan';

function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

type View = 'running' | 'history';

export const SessionsPage: React.FC = () => {
  const { instances, ready } = useEngine();
  const { route, go } = useNav();
  const now = useNow();
  const running = instances.filter((i) => i.running);
  const ended = instances.filter((i) => !i.running).sort((a, b) => (b.ended ?? 0) - (a.ended ?? 0));

  const view: View = route.section === 'history' ? 'history' : 'running';

  return (
    <Screen
      title={t('nav.sessions')}
      actions={
        <Segmented<View>
          label={t('nav.sessions')}
          value={view}
          options={[
            ['running', t('sessions.views.running')],
            ['history', t('sessions.views.history')],
          ]}
          onChange={(v) => go('sessions', v)}
        />
      }
    >
      <div className="mx-auto max-w-[52rem] pt-8">
        {view === 'history' ? (
          ready && <History ended={ended.length} />
        ) : !ready && instances.length === 0 ? (
          <Notice tone="warning" icon="warning" title={t('sessions.offline')}>
            {t('sessions.offlineHint')}
          </Notice>
        ) : (
          <>
            <ListGroup title={t('sessions.running')}>
              {running.length === 0 ? (
                <ListRow label={t('sessions.none')} hint={t('sessions.noneHint')}>
                  <button
                    type="button"
                    className="btn h-10 rounded-full px-5"
                    onClick={() => go('drive')}
                  >
                    {t('sessions.goDrive')}
                  </button>
                </ListRow>
              ) : (
                running.map((i) => <Game key={i.id} instance={i} now={now} />)
              )}
            </ListGroup>
            {running.map((i) => {
              const lan = readLan(i.lan_status);
              return lan && <Lan key={i.id} lan={lan} />;
            })}
            {ended.length > 0 && (
              <ListGroup title={t('sessions.ended')}>
                {ended.map((i) => (
                  <Game key={i.id} instance={i} now={now} />
                ))}
              </ListGroup>
            )}
          </>
        )}
      </div>
    </Screen>
  );
};
