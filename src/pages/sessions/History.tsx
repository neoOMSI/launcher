import React, { useEffect, useState } from 'react';
import { ListGroup, ListRow } from '../../components/List';
import { Notice, Select, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { call, errorText, useCommand } from '../../lib/engine';
import { ago, dateTime, duration, number } from '../../lib/format';
import type { Session } from '../../types/launcher';
import { useNames } from '../profile/names';
import { duty, Mark } from './Game';

const ALL = '\u0000all';

export const History: React.FC<{ ended: number }> = ({ ended }) => {
  const config = useCommand('config');
  const profiles = useCommand('profiles');
  const names = useNames();
  const [who, setWho] = useState<string | null>(null);
  const [state, setState] = useState<{ sessions?: Session[]; error?: string }>({});
  const drivers = profiles.data?.names ?? [];
  const chosen = who ?? config.data?.profile ?? '';
  const wanted = chosen === ALL ? drivers : chosen ? [chosen] : [];
  const key = JSON.stringify(wanted);

  useEffect(() => {
    if (!config.data || !profiles.data) return;
    let live = true;
    Promise.all(wanted.map((name) => call('profile', { name })))
      .then((list) => {
        if (!live) return;
        const sessions = list
          .flatMap((p) => p.sessions)
          .sort((a, b) => Number(b.time) - Number(a.time));
        setState({ sessions });
      })
      .catch((err) => live && setState({ error: errorText(err) }));
    return () => {
      live = false;
    };
  }, [key, ended, config.data, profiles.data]);

  const error = config.error ?? profiles.error ?? state.error;
  const sessions = state.sessions;

  return (
    <ListGroup
      title={t('sessions.history.title')}
      action={
        drivers.length > 1 && (
          <Select
            className="w-52"
            label={t('sessions.history.driver')}
            value={chosen}
            options={[
              [ALL, t('sessions.history.allDrivers')] as const,
              ...drivers.map((n) => [n, n] as const),
            ]}
            onChange={setWho}
          />
        )
      }
    >
      {error ? (
        <div className="p-4">
          <Notice tone="caution" icon="error" title={t('sessions.history.failed')}>
            {error}
          </Notice>
        </div>
      ) : !sessions ? (
        <div className="px-5">
          <Spinner label={t('sessions.history.loading')} />
        </div>
      ) : sessions.length === 0 ? (
        <ListRow label={t('sessions.history.none')} hint={t('sessions.history.noneHint')} />
      ) : (
        sessions.map((s, k) => (
          <div key={`${s.driver}-${s.time}-${k}`} className="list-row gap-4">
            <Mark line={s.line} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-ink">
                {names.map(s.map)} · {duty(s.line, s.tour)}
              </p>
              <p className="truncate text-[14.5px] text-muted">
                {chosen === ALL && `${s.driver} · `}
                {names.bus(s.bus)}
              </p>
            </div>
            <span className="w-24 shrink-0 text-right text-[15px] text-muted tabular-nums">
              {duration(s.seconds)}
            </span>
            <span className="w-20 shrink-0 text-right text-[15px] text-muted tabular-nums">
              {number(s.metres / 1000, 1)} km
            </span>
            <span
              className="w-28 shrink-0 text-right text-[15px] text-muted"
              title={dateTime(s.time)}
            >
              {ago(s.time)}
            </span>
          </div>
        ))
      )}
    </ListGroup>
  );
};
