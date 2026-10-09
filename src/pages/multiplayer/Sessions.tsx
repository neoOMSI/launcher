import React from 'react';
import { Icon } from '../../components/Icon';
import { t } from '../../i18n';
import { errorText } from '../../lib/engine';
import { useToast } from '../../lib/nav';
import { LanRole, type Instance, type LanStatus } from '../../types/launcher';

export type LanSession = Instance & { lanStatus: LanStatus };

export const lanSessions = (instances: Instance[] | undefined) =>
  (instances ?? []).filter((i): i is LanSession => i.running && !!i.lanStatus);

export function SessionRow({ instance }: { instance: LanSession }) {
  const lan = instance.lanStatus;
  const host = lan.role === LanRole.HOST;
  const count = lan.players?.length ?? 0;
  const status = lan.rejected
    ? t('multiplayer.sessions.rejected', { reason: lan.rejected })
    : !lan.connected
      ? t('multiplayer.sessions.connecting', { host: lan.hostName || lan.code })
      : host
        ? lan.tunnel
          ? t('multiplayer.sessions.ready')
          : t('multiplayer.sessions.preparing')
        : t('multiplayer.sessions.with', { host: lan.hostName });
  return (
    <div className="list-row gap-5">
      <span className="grid size-9 shrink-0 place-items-center text-muted">
        <Icon name={host ? 'wifi_tethering' : 'lan'} size={27} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-ink">
          {host ? t('multiplayer.sessions.host') : t('multiplayer.sessions.guest')}
          <span className="text-muted"> · {instance.map}</span>
        </p>
        <p
          className={`truncate text-[14.5px] ${lan.rejected ? 'text-danger' : 'text-muted'}`}
          title={lan.players?.map((p) => p.name).join(', ')}
        >
          {count === 1
            ? t('multiplayer.sessions.onePlayer')
            : t('multiplayer.sessions.players', { count })}
          {' · '}
          {status}
        </p>
      </div>
      {host && lan.code && <Code code={lan.code} />}
    </div>
  );
}

function Code({ code }: { code: string }) {
  const toast = useToast();
  const copy = () =>
    navigator.clipboard
      .writeText(code)
      .then(() => toast(t('multiplayer.sessions.copied'), 'tip'))
      .catch((err) => toast(errorText(err), 'caution'));
  return (
    <span className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-sunken pr-1 pl-4">
      <span className="font-mono text-[14.5px] tracking-wide text-heading select-text">{code}</span>
      <button
        type="button"
        className="theme-toggle size-8 rounded-full"
        title={t('multiplayer.sessions.copy')}
        aria-label={t('multiplayer.sessions.copy')}
        onClick={copy}
      >
        <Icon name="content_copy" size={16} />
      </button>
    </span>
  );
}
