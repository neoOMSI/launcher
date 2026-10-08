import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LineBadge } from '../../components/LineBadge';
import { ListGroup } from '../../components/List';
import { t } from '../../i18n';
import type { LanStatus } from '../../types/launcher';
import { useNames } from '../profile/names';
import { chatLine } from './clock';

export const Lan: React.FC<{ lan: LanStatus }> = ({ lan }) => (
  <>
    <ListGroup
      title={lan.role === 'host' ? t('sessions.lan.hosted') : t('sessions.lan.joinedGame')}
    >
      {lan.role === 'host' ? <Code lan={lan} /> : <Joined lan={lan} />}
      {lan.warnings.map((w, k) => (
        <div key={k} className="list-row min-h-12 gap-3 py-2.5 text-[14.5px] text-muted">
          <span className="shrink-0 text-warn">
            <Icon name="warning" size={18} />
          </span>
          <span className="min-w-0 flex-1">{w}</span>
        </div>
      ))}
    </ListGroup>
    {lan.players.length > 0 && <Players lan={lan} />}
    {lan.chat.length > 0 && (
      <ListGroup title={t('sessions.lan.chat')} hint={t('sessions.lan.chatHint')}>
        {lan.chat.slice(-8).map((line, k) => {
          const [who, text] = chatLine(line);
          return (
            <div key={k} className="list-row min-h-11 gap-4 py-2 text-[15px] select-text">
              {who ? (
                <>
                  <span className="w-32 shrink-0 truncate font-medium text-heading">{who}</span>
                  <span className="min-w-0 flex-1 text-ink">{text}</span>
                </>
              ) : (
                <span className="text-muted">{text}</span>
              )}
            </div>
          );
        })}
      </ListGroup>
    )}
  </>
);

function Code({ lan }: { lan: LanStatus }) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard
      .writeText(lan.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  return (
    <div className="list-row gap-6">
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[1.2rem] font-semibold tracking-wide text-heading select-text">
          {lan.code || '–'}
        </p>
        <p className="mt-0.5 text-[14.5px] text-muted">
          {t('sessions.lan.codeHint')}{' '}
          {lan.tunnel ? t('sessions.lan.tunnel') : t('sessions.lan.local')}
        </p>
      </div>
      <button
        type="button"
        className="btn-quiet h-9 shrink-0 gap-2 rounded-full px-4 text-[14.5px]"
        disabled={!lan.code}
        onClick={copy}
      >
        <Icon name={copied ? 'check' : 'content_copy'} size={17} />
        {copied ? t('common.copied') : t('common.copy')}
      </button>
    </div>
  );
}

function Joined({ lan }: { lan: LanStatus }) {
  const [dot, text] = lan.rejected
    ? ['bg-danger', t('sessions.lan.rejected', { reason: lan.rejected })]
    : lan.connected
      ? ['bg-ok', t('sessions.lan.connected', { host: lan.host_name })]
      : ['bg-warn', t('sessions.lan.connecting')];
  return (
    <div className="list-row gap-3">
      <span className={`size-2 shrink-0 rounded-full ${dot}`} />
      <span className="text-ink">{text}</span>
    </div>
  );
}

function Players({ lan }: { lan: LanStatus }) {
  const names = useNames();
  return (
    <ListGroup title={t('sessions.lan.players', { count: lan.players.length })}>
      {lan.players.map((p) => (
        <div key={p.name} className="list-row gap-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken font-display font-bold text-heading">
            {p.name[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-ink">
              {p.name}
              {p.name === lan.host_name && (
                <span className="ml-2 text-[14px] text-muted">{t('sessions.lan.host')}</span>
              )}
            </p>
            <p className="truncate text-[14.5px] text-muted">
              {[p.bus && names.bus(p.bus), p.location].filter(Boolean).join(' · ') || '–'}
            </p>
          </div>
          <div className="flex w-56 shrink-0 items-center gap-2.5">
            {p.line ? (
              <>
                <LineBadge line={p.line} size="sm" />
                <span className="truncate text-[14.5px] text-muted">{p.destination}</span>
              </>
            ) : (
              <span className="text-[14.5px] text-muted">{t('sessions.freeDrive')}</span>
            )}
          </div>
          <span
            className="flex w-14 shrink-0 items-center justify-end gap-1 text-[14.5px] text-muted tabular-nums"
            title={t('sessions.lan.passengers')}
          >
            <Icon name="group" size={17} />
            {p.passengers ?? 0}
          </span>
        </div>
      ))}
    </ListGroup>
  );
}
