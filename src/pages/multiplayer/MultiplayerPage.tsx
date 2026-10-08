import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { ListGroup, ListRow } from '../../components/List';
import { Screen } from '../../components/Screen';
import { Segmented, Switch } from '../../components/ui';
import { t } from '../../i18n';
import { useDuty } from '../../lib/duty';
import { call, errorText, useEngine } from '../../lib/engine';
import { useNav } from '../../lib/nav';
import { ServerList } from './ServerList';
import { lanSessions, SessionRow } from './Sessions';
import { hostingPatch, isHosting, joinTarget, serverTitle } from './servers';
import { useJoin } from './useJoin';

type View = 'play' | 'servers';

export const MultiplayerPage: React.FC = () => {
  const { route, go } = useNav();
  const view: View = route.section === 'servers' ? 'servers' : 'play';
  return (
    <Screen
      title={view === 'servers' ? t('multiplayer.servers.title') : t('nav.multiplayer')}
      actions={
        <Segmented<View>
          label={t('nav.multiplayer')}
          value={view}
          options={[
            ['play', t('multiplayer.views.play')],
            ['servers', t('multiplayer.views.servers')],
          ]}
          onChange={(v) => go('multiplayer', v)}
        />
      }
    >
      <div className={`mx-auto max-w-[56rem] ${view === 'servers' ? '' : 'pt-8'}`}>
        {view === 'servers' ? (
          <ServerList />
        ) : (
          <>
            <JoinBar />
            <YourGame />
          </>
        )}
      </div>
    </Screen>
  );
};

type Check = { text: string; ok: boolean; map?: string } | 'checking' | null;

function JoinBar() {
  const join = useJoin();
  const [text, setText] = useState('');
  const [check, setCheck] = useState<Check>(null);
  const value = text.trim();

  useEffect(() => {
    if (!value) {
      setCheck(null);
      return;
    }
    let live = true;
    setCheck('checking');
    const timer = setTimeout(() => {
      call('join', { text: value })
        .then((res) => live && setCheck(res))
        .catch((err) => live && setCheck({ ok: false, text: errorText(err) }));
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [value]);

  const ready = check !== null && check !== 'checking' && check.ok;
  const message =
    check === 'checking'
      ? t('multiplayer.join.checking')
      : check === null
        ? t('multiplayer.join.hint')
        : check.text;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) join(joinTarget(value, check.text), check.map ?? '');
      }}
    >
      <div className="flex items-center gap-3 rounded-full bg-sunken p-1.5 pl-5 focus-within:ring-2 focus-within:ring-brand/60">
        <Icon name="link" size={22} color="var(--muted)" />
        <input
          className="h-12 min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-muted"
          placeholder={t('multiplayer.join.placeholder')}
          aria-label={t('multiplayer.join.placeholder')}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className={`${ready ? 'btn' : 'btn-quiet'} h-12 rounded-full px-7`}
          disabled={!ready}
        >
          {t('multiplayer.join.button')}
        </button>
      </div>
      <p
        className={`mt-2 flex h-5 items-center gap-1.5 px-5 text-[14px] ${
          check === 'checking' || check === null
            ? 'text-muted'
            : check.ok
              ? 'text-ok'
              : 'text-danger'
        }`}
        aria-live="polite"
      >
        {check !== null && check !== 'checking' && (
          <Icon name={check.ok ? 'check_circle' : 'error'} size={16} />
        )}
        <span className="truncate">{message}</span>
      </p>
    </form>
  );
}

function YourGame() {
  const { choice, update, server, setServer } = useDuty();
  const { instances } = useEngine();
  const { go } = useNav();
  const hosting = isHosting(choice);
  const sessions = lanSessions(instances);

  const toggle = (on: boolean) => {
    if (on) setServer(null);
    update(hostingPatch(on));
  };

  return (
    <ListGroup title={t('multiplayer.yours.title')}>
      {sessions.map((s) => (
        <SessionRow key={s.id} instance={s} />
      ))}
      {server ? (
        <ListRow
          label={t('multiplayer.host.joins', { name: serverTitle(server) })}
          hint={t('multiplayer.yours.joinsHint')}
        >
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-quiet h-10 rounded-full px-5"
              onClick={() => setServer(null)}
            >
              {t('multiplayer.servers.leave')}
            </button>
            <button
              type="button"
              className="btn h-10 rounded-full px-5"
              onClick={() => go('drive')}
            >
              {t('multiplayer.host.toDrive')}
            </button>
          </div>
        </ListRow>
      ) : (
        <ListRow label={t('multiplayer.host.switch')} hint={t('multiplayer.yours.hostHint')}>
          <div className="flex items-center gap-4">
            {hosting && (
              <button
                type="button"
                className="btn-quiet h-10 rounded-full px-5"
                onClick={() => go('drive')}
              >
                {t('multiplayer.host.toDrive')}
              </button>
            )}
            <Switch checked={hosting} onChange={toggle} label={t('multiplayer.host.switch')} />
          </div>
        </ListRow>
      )}
    </ListGroup>
  );
}
