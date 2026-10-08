import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { ListGroup, ListRow } from '../../components/List';
import { t } from '../../i18n';
import { call, errorText } from '../../lib/engine';
import { ago, bytes, number, percent } from '../../lib/format';
import { useToast } from '../../lib/nav';
import type { InstallProgress } from '../../types/launcher';
import { jobProgress, splitJobs, stateTone, type StateTone } from './logic';
import { Title } from './Title';

const TONE: Record<Exclude<StateTone, 'busy'>, [string, string]> = {
  ok: ['check_circle', 'text-ok'],
  danger: ['error', 'text-danger'],
  muted: ['cancel', 'text-muted'],
};

export const Installing: React.FC<{ jobs: InstallProgress[] }> = ({ jobs }) => {
  const toast = useToast();
  const { running, finished } = splitJobs(jobs);

  const clear = () => call('clear_installs').catch((err) => toast(errorText(err), 'caution'));

  return (
    <>
      <Title>{t('mods.sections.installing')}</Title>
      <ListGroup title={t('mods.jobs.running')}>
        {running.length === 0 ? (
          <ListRow label={t('mods.jobs.idle')} hint={t('mods.jobs.idleHint')} />
        ) : (
          running.map((job) => <RunningRow key={job.id} job={job} />)
        )}
      </ListGroup>
      {finished.length > 0 && (
        <ListGroup
          title={t('mods.jobs.finished')}
          action={
            <button
              type="button"
              className="flex items-center gap-1.5 text-[14.5px] text-muted transition-colors hover:text-ink"
              onClick={clear}
            >
              <Icon name="cleaning_services" size={17} />
              {t('mods.jobs.clear')}
            </button>
          }
        >
          {finished.map((job) => (
            <FinishedRow key={job.id} job={job} />
          ))}
        </ListGroup>
      )}
    </>
  );
};

function RunningRow({ job }: { job: InstallProgress }) {
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);
  const progress = jobProgress(job);

  const cancel = async () => {
    setCancelling(true);
    try {
      await call('cancel_install', { id: job.id });
    } catch (err) {
      toast(errorText(err), 'caution');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="list-row gap-6">
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-3">
          <span className="min-w-0 truncate text-ink" title={job.source}>
            {job.name}
          </span>
          <span className="shrink-0 text-[14.5px] text-accent">{t(`mods.state.${job.state}`)}</span>
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line-strong">
          {progress === null ? (
            <div className="h-full w-1/4 animate-pulse rounded-full bg-brand/60" />
          ) : (
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-700"
              style={{ width: `${progress * 100}%` }}
            />
          )}
        </div>
        <p className="mt-1.5 flex justify-between gap-4 text-[14px] text-muted tabular-nums">
          <span className="truncate">
            {job.files_total > 0
              ? `${t('mods.jobs.files', { done: number(job.files_done), total: number(job.files_total) })} · ${bytes(job.bytes_done)} / ${bytes(job.bytes_total)}`
              : job.message || t('mods.jobs.preparing')}
          </span>
          {progress !== null && <span className="shrink-0">{percent(progress)}</span>}
        </p>
      </div>
      <button
        type="button"
        className="btn-quiet h-9 shrink-0 rounded-full px-4 text-[14.5px]"
        disabled={cancelling}
        onClick={cancel}
      >
        {t('common.cancel')}
      </button>
    </div>
  );
}

function FinishedRow({ job }: { job: InstallProgress }) {
  const [open, setOpen] = useState(false);
  const tone = stateTone(job.state);
  const [icon, color] = TONE[tone === 'busy' ? 'muted' : tone];
  const meta = [
    t(`mods.state.${job.state}`),
    t(`mods.modeName.${job.mode}`),
    job.from_inbox ? t('mods.jobs.fromInbox') : null,
    ago(job.finished ?? job.started),
  ].filter(Boolean);

  return (
    <div>
      <button
        type="button"
        className="list-row gap-4"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className={`shrink-0 ${color}`}>
          <Icon name={icon} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-ink">{job.name}</span>
          <span className="block truncate text-[14.5px] text-muted">{meta.join(' · ')}</span>
        </span>
        {job.warnings.length > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-[14px] text-warn">
            <Icon name="warning" size={16} />
            {job.warnings.length}
          </span>
        )}
        <span
          className="shrink-0 text-muted transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          <Icon name="expand_more" size={20} />
        </span>
      </button>
      {open && <Details job={job} />}
    </div>
  );
}

function Details({ job }: { job: InstallProgress }) {
  const failed = job.state === 'failed';
  const lines: { icon: string; text: string; tone?: string }[] = [
    ...(job.message
      ? [
          {
            icon: failed ? 'error' : 'info',
            text: job.message,
            tone: failed ? 'text-danger' : undefined,
          },
        ]
      : []),
    ...job.warnings.map((text) => ({ icon: 'warning', text, tone: 'text-warn' })),
    ...job.installed.map((folder) => ({
      icon: 'check',
      text: t('mods.jobs.installed', { folder }),
    })),
    ...job.kept_aside.map((name) => ({
      icon: 'hourglass_top',
      text: t('mods.jobs.keptAside', { name }),
    })),
  ];
  return (
    <div className="px-5 pb-5 pl-[3.75rem] text-[14.5px] leading-snug text-muted select-text">
      {lines.length > 0 && (
        <ul className="space-y-1.5">
          {lines.map(({ icon, text, tone }, k) => (
            <li key={k} className="flex gap-2.5">
              <span className={`mt-px shrink-0 ${tone ?? ''}`}>
                <Icon name={icon} size={16} />
              </span>
              <span className={`min-w-0 break-words ${tone === 'text-danger' ? tone : ''}`}>
                {text}
              </span>
            </li>
          ))}
        </ul>
      )}
      {job.report.length > 0 && (
        <ul className="mt-3 space-y-0.5 rounded-xl bg-sunken px-4 py-3 font-mono text-[13px] break-all">
          {job.report.map((line, k) => (
            <li key={k}>{line}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 truncate text-[13.5px]" title={job.source}>
        {job.source}
      </p>
    </div>
  );
}
