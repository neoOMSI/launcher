import React, { useState } from 'react';
import { Confirm, Modal } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { LineBadge } from '../../components/LineBadge';
import { ListGroup, ListRow } from '../../components/List';
import { Ring } from '../../components/Ring';
import { Screen } from '../../components/Screen';
import { Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { call, errorText, useCommand } from '../../lib/engine';
import { ago, duration, number, percent } from '../../lib/format';
import { useNav, useToast } from '../../lib/nav';
import type { Profile, Session } from '../../types/launcher';
import { useNames } from './names';
import { levelProgress, nameProblem, punctuality, rating } from './stats';

export const ProfilePage: React.FC = () => {
  const config = useCommand('config');
  const profiles = useCommand('profiles');
  const name = config.data?.profile ?? '';
  const profile = useCommand('profile', name ? { name } : null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const names = profiles.data ?? [];

  const choose = (next: string) =>
    call('save_config', { profile: next }).catch((err) => toast(errorText(err), 'caution'));

  let body: React.ReactNode;
  if (config.error || profiles.error || profile.error) {
    body = (
      <Notice tone="caution" icon="error" title={t('profile.loadFailed')}>
        {config.error ?? profiles.error ?? profile.error}
      </Notice>
    );
  } else if (!config.data || !profiles.data) {
    body = <Spinner label={t('profile.loading')} />;
  } else if (!name) {
    body = <NoDriver onCreate={() => setCreating(true)} />;
  } else if (!profile.data || profile.data.name !== name) {
    body = <Spinner label={t('profile.loading')} />;
  } else {
    body = (
      <div className="mx-auto max-w-[60rem]">
        <Hero profile={profile.data} />
        <Numbers profile={profile.data} />
        <Runs sessions={profile.data.sessions} />
        <Drivers
          names={names}
          current={name}
          onChoose={choose}
          onCreate={() => setCreating(true)}
        />
      </div>
    );
  }

  return (
    <Screen>
      {body}
      {creating && <NewDriver taken={names} onClose={() => setCreating(false)} />}
    </Screen>
  );
};

function NoDriver({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Ring value={0} size={132} stroke={6}>
        <span className="grid size-[104px] place-items-center text-muted">
          <Icon name="person" size={59} />
        </span>
      </Ring>
      <h1 className="mt-7 font-display text-[2.4rem] leading-tight font-bold tracking-tight">
        {t('profile.noDriver')}
      </h1>
      <p className="mt-2 max-w-[28em] text-muted">{t('profile.noDriverHint')}</p>
      <button
        type="button"
        className="btn mt-7 h-12 gap-2 rounded-full pr-6 pl-5"
        onClick={onCreate}
      >
        <Icon name="person_add" size={20} />
        {t('profile.newDriver')}
      </button>
    </div>
  );
}

function Hero({ profile: p }: { profile: Profile }) {
  const { fraction, toNext } = levelProgress(p);
  return (
    <section className="flex items-center gap-6">
      <Ring value={fraction} size={112} stroke={5}>
        <span className="grid size-[90px] place-items-center rounded-full bg-brand font-display text-[2.4rem] font-bold text-night">
          {p.name[0]?.toUpperCase()}
        </span>
      </Ring>
      <div className="min-w-0">
        <h1 className="truncate font-display text-[2.4rem] leading-tight font-bold tracking-tight">
          {p.name}
        </h1>
        <p className="mt-0.5 text-muted">
          <span className="font-medium text-accent">{t('profile.level', { level: p.level })}</span>
          {' · '}
          {t('profile.toNext', { xp: number(toNext), level: p.level + 1 })}
        </p>
      </div>
    </section>
  );
}

function Numbers({ profile: p }: { profile: Profile }) {
  const onTime = punctuality(p.stops, p.early, p.late);
  const big: [string, string][] = [
    [t('profile.stats.hours'), duration(p.hours * 3600)],
    [t('profile.stats.distance'), `${number(p.km)} km`],
    [t('profile.stats.stops'), number(p.stops)],
    [t('profile.stats.onTime'), onTime === null ? '–' : percent(onTime)],
  ];
  const ratings: [string, number][] = [
    ['driving', p.rating_driving],
    ['comfort', p.rating_comfort],
    ['tickets', p.rating_tickets],
  ];
  return (
    <>
      <dl className="mt-9 grid grid-cols-4 divide-x divide-line py-2">
        {big.map(([label, value]) => (
          <div key={label} className="px-6 first:pl-0">
            <dt className="text-[14.5px] text-muted">{label}</dt>
            <dd className="mt-1.5 font-display text-[1.75rem] leading-none font-bold text-heading tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <ListGroup title={t('profile.ratings.title')}>
        {ratings.map(([id, value]) => (
          <ListRow
            key={id}
            label={t(`profile.ratings.${id}`)}
            hint={t(`profile.ratings.${id}Hint`)}
          >
            <div className="flex w-56 items-center gap-4">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${rating(value) * 100}%` }}
                />
              </span>
              <span className="w-10 text-right font-medium text-heading tabular-nums">
                {Math.round(value)}
              </span>
            </div>
          </ListRow>
        ))}
      </ListGroup>
    </>
  );
}

function Runs({ sessions }: { sessions: Session[] }) {
  const { go } = useNav();
  const names = useNames();
  const recent = sessions.slice(0, 5);
  return (
    <ListGroup
      title={t('profile.runs.title')}
      action={
        sessions.length > 0 && (
          <button
            type="button"
            className="flex items-center gap-0.5 text-[14.5px] text-muted transition-colors hover:text-ink"
            onClick={() => go('sessions', 'history')}
          >
            {t('profile.runs.all')}
            <Icon name="chevron_right" size={18} />
          </button>
        )
      }
    >
      {recent.length === 0 ? (
        <ListRow label={t('profile.runs.none')} hint={t('profile.runs.noneHint')}>
          <button type="button" className="btn h-10 rounded-full px-5" onClick={() => go('drive')}>
            {t('profile.runs.drive')}
          </button>
        </ListRow>
      ) : (
        recent.map((s) => (
          <div key={s.time} className="list-row gap-4">
            {s.line ? (
              <LineBadge line={s.line} />
            ) : (
              <span className="grid h-8 min-w-12 place-items-center text-muted">
                <Icon name="explore" size={24} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-ink">{names.map(s.map)}</p>
              <p className="truncate text-[14.5px] text-muted">{names.bus(s.bus)}</p>
            </div>
            <span className="w-24 text-right text-[15px] text-muted tabular-nums">
              {duration(s.seconds)}
            </span>
            <span className="w-20 text-right text-[15px] text-muted tabular-nums">
              {number(s.metres / 1000, 1)} km
            </span>
            <span className="w-28 text-right text-[15px] text-muted">{ago(s.time)}</span>
          </div>
        ))
      )}
    </ListGroup>
  );
}

function Drivers({
  names,
  current,
  onChoose,
  onCreate,
}: {
  names: readonly string[];
  current: string;
  onChoose: (name: string) => Promise<unknown>;
  onCreate: () => void;
}) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const toast = useToast();

  const remove = async (name: string) => {
    setConfirm(null);
    try {
      await call('delete_profile', { name });
      const next = names.find((n) => n !== name);
      if (name === current && next) await call('save_config', { profile: next });
      toast(t('profile.drivers.deleted', { name }), 'tip');
    } catch (err) {
      toast(errorText(err), 'caution');
    }
  };

  return (
    <ListGroup title={t('profile.drivers.title')}>
      {names.map((name) => {
        const on = name === current;
        return (
          <div key={name} className="list-row gap-4">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full font-display font-bold ${
                on ? 'bg-brand text-night' : 'bg-sunken text-heading'
              }`}
            >
              {name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-ink">{name}</span>
            {on ? (
              <span className="text-[14.5px] text-muted">{t('profile.drivers.current')}</span>
            ) : (
              <button
                type="button"
                className="btn-quiet h-9 rounded-full px-4 text-[14.5px]"
                onClick={() => onChoose(name)}
              >
                {t('profile.drivers.choose')}
              </button>
            )}
            <button
              type="button"
              className="theme-toggle rounded-full hover:text-danger"
              aria-label={t('profile.drivers.delete', { name })}
              title={t('profile.drivers.delete', { name })}
              onClick={() => setConfirm(name)}
            >
              <Icon name="delete" size={19} />
            </button>
          </div>
        );
      })}
      <button type="button" className="list-row gap-4 text-muted hover:text-ink" onClick={onCreate}>
        <span className="grid size-9 shrink-0 place-items-center">
          <Icon name="add" size={27} />
        </span>
        {t('profile.newDriver')}
      </button>
      {confirm && (
        <Confirm
          title={t('profile.drivers.confirmTitle', { name: confirm })}
          action={t('profile.drivers.confirm')}
          danger
          onConfirm={() => remove(confirm)}
          onCancel={() => setConfirm(null)}
        >
          {t('profile.drivers.confirmText')}
        </Confirm>
      )}
    </ListGroup>
  );
}

function NewDriver({ taken, onClose }: { taken: readonly string[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const problem = nameProblem(name, taken);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || problem) return;
    setBusy(true);
    setError(null);
    try {
      await call('create_profile', { name: clean });
      toast(t('profile.create.done', { name: clean }), 'tip');
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={t('profile.create.title')} onClose={onClose}>
      <form onSubmit={create}>
        <p className="mt-2.5 text-[15.5px] text-muted">{t('profile.create.hint')}</p>
        <input
          className="input mt-5 rounded-full px-5"
          autoFocus
          maxLength={60}
          value={name}
          aria-label={t('profile.create.name')}
          placeholder={t('profile.create.placeholder')}
          onChange={(e) => setName(e.target.value)}
        />
        {(problem || error) && (
          <p className="mt-2 px-5 text-[14.5px] text-danger" role="alert">
            {problem ?? error}
          </p>
        )}
        <div className="mt-7 flex justify-end gap-2">
          <button type="button" className="btn-quiet h-11 rounded-full px-5" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn h-11 rounded-full px-6"
            disabled={busy || !name.trim() || !!problem}
          >
            {t('profile.create.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
