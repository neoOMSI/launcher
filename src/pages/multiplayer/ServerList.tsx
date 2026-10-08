import React, { useState } from 'react';
import { Confirm, Modal } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { ListGroup, ListRow } from '../../components/List';
import { SearchField } from '../../components/Screen';
import { Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { useDuty } from '../../lib/duty';
import { call, errorText, useCommand } from '../../lib/engine';
import { useToast } from '../../lib/nav';
import type { MapInfo, ServerInfo } from '../../types/launcher';
import {
  addServer,
  sortServers,
  fill,
  filterServers,
  isFull,
  mapLabel,
  removeServer,
  resolveMap,
  serverTitle,
} from './servers';
import { useJoin } from './useJoin';

export const ServerList: React.FC = () => {
  const servers = useCommand('servers');
  const maps = useCommand('maps');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ServerInfo | null>(null);
  const toast = useToast();
  const all = servers.data ?? [];
  const installed = maps.data ?? [];
  const shown = sortServers(filterServers(all, query, installed));
  const online = all.filter((s) => s.error === null);
  const players = online.reduce((sum, s) => sum + s.players, 0);

  const remove = async (server: ServerInfo) => {
    setRemoving(null);
    try {
      await call('save_servers', { servers: removeServer(all, server.address) });
      toast(t('multiplayer.servers.removed', { name: serverTitle(server) }), 'tip');
    } catch (err) {
      toast(errorText(err), 'caution');
    }
  };

  let rows: React.ReactNode;
  if (servers.error) {
    rows = null;
  } else if (!servers.data) {
    rows = (
      <div className="px-5">
        <Spinner label={t('multiplayer.servers.reading')} />
      </div>
    );
  } else if (all.length === 0) {
    rows = (
      <ListRow label={t('multiplayer.servers.none')} hint={t('multiplayer.servers.noneHint')} />
    );
  } else if (shown.length === 0) {
    rows = <ListRow label={t('multiplayer.servers.noMatch', { query: query.trim() })} />;
  } else {
    rows = shown.map((s) => (
      <ServerRow key={s.address} server={s} maps={installed} onRemove={() => setRemoving(s)} />
    ));
  }

  return (
    <>
      {servers.error && (
        <Notice
          tone="caution"
          icon="error"
          title={t('multiplayer.servers.loadFailed')}
          className="mb-8"
        >
          {servers.error}
        </Notice>
      )}
      <ListGroup
        title={
          servers.data
            ? t('multiplayer.servers.summary', { servers: online.length, players })
            : undefined
        }
        action={
          <div className="flex items-center gap-1">
            <SearchField
              className="mr-1 h-9 w-52 text-[15px]"
              value={query}
              onChange={setQuery}
              placeholder={t('multiplayer.servers.filter')}
            />
            <button
              type="button"
              className="theme-toggle rounded-full"
              title={t('common.refresh')}
              aria-label={t('common.refresh')}
              disabled={servers.loading}
              onClick={servers.reload}
            >
              <span className={`grid ${servers.loading ? 'animate-spin' : ''}`}>
                <Icon name="refresh" size={20} />
              </span>
            </button>
            <button
              type="button"
              className="btn-quiet h-9 gap-1.5 rounded-full pr-4 pl-3 text-[15px]"
              onClick={() => setAdding(true)}
            >
              <Icon name="add" size={18} />
              {t('multiplayer.servers.add')}
            </button>
          </div>
        }
      >
        {rows}
      </ListGroup>
      {adding && <AddServer servers={all} onClose={() => setAdding(false)} />}
      {removing && (
        <Confirm
          title={t('multiplayer.servers.confirmRemove', { name: serverTitle(removing) })}
          action={t('common.remove')}
          danger
          onConfirm={() => remove(removing)}
          onCancel={() => setRemoving(null)}
        >
          {t('multiplayer.servers.confirmRemoveText')}
        </Confirm>
      )}
    </>
  );
};

function ServerRow({
  server,
  maps,
  onRemove,
}: {
  server: ServerInfo;
  maps: MapInfo[];
  onRemove: () => void;
}) {
  const { server: joined, setServer } = useDuty();
  const join = useJoin();
  const title = serverTitle(server);
  const reachable = server.error === null;
  const missing = reachable && maps.length > 0 && !!server.map && !resolveMap(server.map, maps);
  const isJoined = joined?.address === server.address;
  const conditions = [server.time, server.weather || t('multiplayer.servers.mapWeather')]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={`list-row min-h-[4.75rem] gap-4 pr-3 ${reachable ? '' : 'opacity-70'}`}>
      <span
        className={`size-2.5 shrink-0 rounded-full ${reachable ? (isFull(server) ? 'bg-warn' : 'bg-ok') : 'bg-danger'}`}
      />
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2">
          <span className={`truncate font-semibold ${reachable ? 'text-heading' : 'text-muted'}`}>
            {title}
          </span>
          {server.official && (
            <span
              className="shrink-0 text-muted"
              title={t('multiplayer.servers.official')}
              aria-label={t('multiplayer.servers.official')}
            >
              <Icon name="verified" size={17} />
            </span>
          )}
          {isJoined && (
            <span className="shrink-0 rounded-full bg-ok/15 px-2 text-[12.5px] leading-5 font-semibold text-ok">
              {t('multiplayer.servers.joinedBadge')}
            </span>
          )}
        </p>
        {reachable ? (
          <p className="mt-0.5 truncate text-[14.5px] text-muted">
            {server.motd || server.address}
          </p>
        ) : (
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[14.5px] text-danger">
            <Icon name="cloud_off" size={16} />
            <span className="truncate">
              {t('multiplayer.servers.unreachable', { error: server.error ?? '' })}
            </span>
          </p>
        )}
      </div>

      <div className="w-44 shrink-0 text-right">
        {reachable ? (
          <>
            <p className="truncate text-[14.5px] text-ink">{mapLabel(server.map, maps) || '–'}</p>
            <p
              className={`truncate text-[14px] tabular-nums ${missing ? 'font-medium text-warn' : 'text-muted'}`}
            >
              {missing ? t('multiplayer.servers.notInstalled') : conditions}
            </p>
          </>
        ) : (
          server.name.trim() && (
            <p className="truncate font-mono text-[13.5px] text-muted">{server.address}</p>
          )
        )}
      </div>

      <Players server={server} reachable={reachable} />

      <div className="flex shrink-0 items-center gap-1">
        {isJoined ? (
          <button
            type="button"
            className="btn-quiet h-9 w-[5.5rem] justify-center rounded-full px-0 text-[15px]"
            onClick={() => setServer(null)}
          >
            {t('multiplayer.servers.leave')}
          </button>
        ) : (
          <button
            type="button"
            className="btn-quiet h-9 w-[5.5rem] justify-center rounded-full px-0 text-[15px]"
            disabled={!reachable || missing}
            title={
              missing
                ? t('multiplayer.servers.mapMissing', { map: mapLabel(server.map, maps) })
                : undefined
            }
            onClick={() => join(server)}
          >
            {t('multiplayer.servers.join')}
          </button>
        )}
        {server.official ? (
          <span className="size-9 shrink-0" />
        ) : (
          <button
            type="button"
            className="theme-toggle shrink-0 rounded-full hover:text-danger"
            title={t('multiplayer.servers.remove')}
            aria-label={t('multiplayer.servers.remove')}
            onClick={onRemove}
          >
            <Icon name="delete" size={19} />
          </button>
        )}
      </div>
    </div>
  );
}

function Players({ server, reachable }: { server: ServerInfo; reachable: boolean }) {
  const full = isFull(server);
  return (
    <div
      className="w-[4.5rem] shrink-0"
      title={
        reachable
          ? t('multiplayer.servers.players', { players: server.players, max: server.max_players })
          : undefined
      }
    >
      <p className="text-right text-[15px] tabular-nums">
        {reachable ? (
          <>
            <span className={`font-semibold ${full ? 'text-warn' : 'text-heading'}`}>
              {server.players}
            </span>
            <span className="text-muted"> / {server.max_players}</span>
          </>
        ) : (
          <span className="text-muted">–</span>
        )}
      </p>
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line-strong">
        <span
          className={`block h-full rounded-full ${full ? 'bg-warn' : 'bg-ok'}`}
          style={{ width: `${reachable ? fill(server) * 100 : 0}%` }}
        />
      </span>
    </div>
  );
}

function AddServer({ servers, onClose }: { servers: ServerInfo[]; onClose: () => void }) {
  const toast = useToast();
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = addServer(servers, name, address);
    if ('error' in result) {
      setError(t(`multiplayer.servers.errors.${result.error}`));
      return;
    }
    setBusy(true);
    try {
      await call('save_servers', { servers: result.list });
      toast(t('multiplayer.servers.added', { name: name.trim() || address.trim() }), 'tip');
      onClose();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={t('multiplayer.servers.addTitle')} onClose={onClose}>
      <form onSubmit={add}>
        <label className="mt-5 block">
          <span className="mb-2 block px-1 text-[14px] font-semibold text-muted">
            {t('multiplayer.servers.name')}
          </span>
          <input
            className="input rounded-full px-5"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block px-1 text-[14px] font-semibold text-muted">
            {t('multiplayer.servers.address')}
          </span>
          <input
            className="input rounded-full px-5 text-[15px]"
            placeholder="play.example.org:7777"
            spellCheck={false}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError('');
            }}
          />
        </label>
        {error && (
          <p className="mt-2 px-5 text-[14.5px] text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-7 flex justify-end gap-2">
          <button type="button" className="btn-quiet h-11 rounded-full px-5" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn h-11 rounded-full px-6"
            disabled={busy || !address.trim()}
          >
            {t('multiplayer.servers.addSubmit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
