import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { PanelScreen } from '../../components/Screen';
import { EmptyState, Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { toDuty, useDuty } from '../../lib/duty';
import { call, errorText, useCommand, useEngine } from '../../lib/engine';
import { ago } from '../../lib/format';
import { useNav, useToast } from '../../lib/nav';
import type { Tutorial } from '../../types/launcher';
import { blocks, markStarted, nextLesson, readStarts, type Starts } from './lessons';

const ICONS: Record<number, string> = {
  1: 'key',
  2: 'traffic',
  3: 'confirmation_number',
  4: 'emergency',
};

const iconOf = (tutorial: Tutorial) => ICONS[tutorial.number] ?? 'school';

export const TutorialsPage: React.FC = () => {
  const tutorials = useCommand('tutorials');
  const config = useCommand('config');
  const { choice } = useDuty();
  const { refreshInstances } = useEngine();
  const { route, go } = useNav();
  const toast = useToast();
  const [starts, setStarts] = useState<Starts>(readStarts);
  const [starting, setStarting] = useState(false);

  const start = async (tutorial: Tutorial) => {
    setStarting(true);
    try {
      const res = await call('launch', {
        ...toDuty(choice, config.data?.profile ?? '', null),
        tutorial: tutorial.number,
        lan: 'off',
      });
      setStarts(markStarted(tutorial.number));
      toast(t('tutorials.started', { n: tutorial.number, pid: res.pid }), 'tip');
      refreshInstances();
    } catch (err) {
      toast(errorText(err), 'caution');
    } finally {
      setStarting(false);
    }
  };

  const list = [...(tutorials.data ?? [])].sort((a, b) => a.number - b.number);
  const next = nextLesson(list, starts) ?? list[0];
  const current = list.find((x) => String(x.number) === route.section) ?? next;

  return (
    <PanelScreen
      panel={
        <>
          <h2 className="section-title shrink-0 px-6 pt-6 text-[1.6rem]">{t('nav.tutorials')}</h2>
          <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-4 [scrollbar-width:none]">
            {list.map((tutorial) => {
              const on = tutorial === current;
              return (
                <button
                  key={tutorial.number}
                  type="button"
                  aria-current={on ? 'page' : undefined}
                  className={`nav-link h-auto min-h-11 py-2.5 ${on ? 'on' : ''}`}
                  onClick={() => go('tutorials', String(tutorial.number))}
                >
                  <Icon name={iconOf(tutorial)} size={20} />
                  <span className="min-w-0 flex-1 text-left leading-snug">{tutorial.title}</span>
                  {starts[tutorial.number] && (
                    <Icon
                      name="check_circle"
                      size={18}
                      style={{ color: 'var(--color-ok)', flexShrink: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </>
      }
    >
      <div className="max-w-[46rem]">
        {tutorials.error ? (
          <Notice tone="caution" icon="error" title={t('tutorials.loadFailed')}>
            {tutorials.error}
          </Notice>
        ) : !tutorials.data ? (
          <Spinner label={t('tutorials.reading')} />
        ) : !current ? (
          <EmptyState icon="school" title={t('tutorials.none')}>
            {t('tutorials.noneHint')}
          </EmptyState>
        ) : (
          <Lesson
            key={current.number}
            tutorial={current}
            count={list.length}
            started={starts[current.number]}
            starting={starting}
            following={list[list.indexOf(current) + 1]}
            onStart={() => start(current)}
            onOpen={(n) => go('tutorials', String(n))}
          />
        )}
      </div>
    </PanelScreen>
  );
};

function Lesson({
  tutorial,
  count,
  started,
  starting,
  following,
  onStart,
  onOpen,
}: {
  tutorial: Tutorial;
  count: number;
  started: number | undefined;
  starting: boolean;
  following: Tutorial | undefined;
  onStart: () => void;
  onOpen: (n: number) => void;
}) {
  return (
    <article className="rise">
      <div className="flex items-center gap-3 text-accent">
        <Icon name={iconOf(tutorial)} size={30} />
        <span className="text-[15px] font-medium text-muted">
          {t('tutorials.lessonOf', { n: tutorial.number, count })}
        </span>
      </div>
      <h1 className="mt-3 font-display text-[2.5rem] leading-[1.1] font-bold tracking-tight text-heading">
        {tutorial.title}
      </h1>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          className="btn h-13 rounded-full px-8 text-[17px]"
          disabled={starting}
          onClick={onStart}
        >
          {starting
            ? t('tutorials.starting')
            : started
              ? t('tutorials.again')
              : t('tutorials.start')}
        </button>
        <span className="flex items-center gap-2 text-[15px] text-muted">
          {started ? (
            <>
              <Icon name="check_circle" size={18} style={{ color: 'var(--color-ok)' }} />
              {t('tutorials.startedAgo', { when: ago(started) })}
            </>
          ) : (
            t('tutorials.notStarted')
          )}
        </span>
      </div>

      <div className="mt-10 space-y-4 text-[16px] leading-relaxed text-ink select-text">
        {blocks(tutorial.text).map((block, i) =>
          block.kind === 'p' ? (
            <p key={i}>{block.text}</p>
          ) : (
            <ul key={i} className="space-y-2">
              {block.items.map((item, k) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ),
        )}
      </div>

      {following && (
        <button
          type="button"
          className="group mt-12 flex w-full items-center gap-4 rounded-2xl py-4 text-left"
          onClick={() => onOpen(following.number)}
        >
          <span className="text-muted transition-colors group-hover:text-accent">
            <Icon name={iconOf(following)} size={26} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] text-muted">{t('tutorials.next')}</span>
            <span className="block truncate text-[17px] font-semibold text-heading transition-colors group-hover:text-accent">
              {following.title}
            </span>
          </span>
          <span className="text-muted transition-transform group-hover:translate-x-1">
            <Icon name="arrow_forward" size={22} />
          </span>
        </button>
      )}
    </article>
  );
}
