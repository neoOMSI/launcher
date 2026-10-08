import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { Confirm } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { ListGroup, ListRow } from '../../components/List';
import { PanelScreen, SearchField } from '../../components/Screen';
import { Notice, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { useNav, useToast } from '../../lib/nav';
import { CATEGORIES, isCategory, type Category } from './categories';
import { Controllers, useControllers } from './Controllers';
import { KeyList, NoMatch, useKeyboard, type KeyboardState, type Row } from './Keyboard';

type Section = Category | 'controllers';

const tr = (key: string, params?: Record<string, string | number>) => t(`controls.${key}`, params);

export const ControlsPage: React.FC = () => {
  const { route, go } = useNav();
  const toast = useToast();
  const kb = useKeyboard();
  const pads = useControllers();
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const present = new Set(kb.rows.map((r) => r.category));
  const categories = CATEGORIES.filter(([id]) => !kb.current || present.has(id));
  const current: Section =
    route.section === 'controllers'
      ? 'controllers'
      : isCategory(route.section) && categories.some(([id]) => id === route.section)
        ? route.section
        : (categories[0]?.[0] ?? 'controllers');
  const q = query.trim().toLowerCase();
  const searching = q !== '';
  const changes = kb.changes + pads.changes;

  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    top.current?.closest('.overflow-y-auto')?.scrollTo(0, 0);
  }, [current, searching]);

  const open = (id: Section) => {
    setQuery('');
    go('controls', id);
  };

  const save = async () => {
    setSaving(true);
    const [a, b] = await Promise.all([kb.save(), pads.save()]);
    setSaving(false);
    if (a && b) toast(tr('saved'), 'tip');
  };

  const sections: (readonly [Section, string])[] = [
    ...categories,
    ['controllers', 'stadia_controller'],
  ];

  let body: ReactNode;
  if (current === 'controllers' && !searching) {
    body = (
      <>
        <Title>{tr('sections.controllers')}</Title>
        <div>
          <Controllers pads={pads} keys={kb.current} lang={kb.lang} />
        </div>
      </>
    );
  } else if (!kb.current) {
    body = kb.error ? (
      <Notice tone="caution" icon="error" title={tr('keyboard.loadFailed')}>
        <p className="select-text">{kb.error}</p>
        <button type="button" className="btn-quiet mt-4 h-10 rounded-full px-5" onClick={kb.reload}>
          {tr('retry')}
        </button>
      </Notice>
    ) : (
      <Spinner label={tr('keyboard.loading')} />
    );
  } else if (!kb.rows.length) {
    body = (
      <ListGroup>
        <ListRow label={tr('keyboard.empty')} hint={tr('keyboard.emptyHint')} />
      </ListGroup>
    );
  } else if (searching) {
    body = <Results rows={kb.rows.filter((r) => kb.matches(r, q))} query={query} kb={kb} />;
  } else {
    body = (
      <>
        <Title>{tr(`sections.${current}`)}</Title>
        <div>
          <ListGroup>
            <KeyList rows={kb.rows.filter((r) => r.category === current)} kb={kb} />
          </ListGroup>
        </div>
      </>
    );
  }

  return (
    <PanelScreen
      panel={
        <>
          <div className="shrink-0 px-6 pt-6">
            <h2 className="section-title text-[1.6rem]">{t('nav.controls')}</h2>
            <SearchField
              className="mt-4 w-full bg-sunken"
              value={query}
              onChange={setQuery}
              placeholder={tr('keyboard.filter')}
            />
          </div>
          <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-4 [scrollbar-width:none]">
            {sections.map(([id, icon]) => {
              const on = !searching && id === current;
              const clashes = kb.rows.filter((r) => r.category === id && r.conflict).length;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={on ? 'page' : undefined}
                  className={`nav-link ${on ? 'on' : ''}`}
                  onClick={() => open(id)}
                >
                  <Icon name={icon} size={20} />
                  <span className="truncate">{tr(`sections.${id}`)}</span>
                  {clashes > 0 && (
                    <span
                      className="ml-auto text-[13px] leading-6 font-semibold text-danger tabular-nums"
                      title={tr('conflicts', { n: clashes })}
                    >
                      {clashes}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {changes > 0 && (
            <div className="shrink-0 px-6 pt-2 pb-5" aria-live="polite">
              <p className="mb-3 text-[14px] text-muted">
                {tr(changes === 1 ? 'save.changesOne' : 'save.changesOther', { n: changes })}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-quiet h-11 flex-1 justify-center rounded-full px-4"
                  disabled={saving}
                  onClick={() => setConfirm(true)}
                >
                  {tr('save.discard')}
                </button>
                <button
                  type="button"
                  className="btn h-11 flex-1 justify-center rounded-full px-4"
                  disabled={saving}
                  onClick={save}
                >
                  {saving ? tr('save.saving') : t('common.save')}
                </button>
              </div>
            </div>
          )}
        </>
      }
    >
      <div ref={top} className="mx-auto max-w-[52rem]">
        {body}
      </div>
      {confirm && (
        <Confirm
          title={tr(changes === 1 ? 'save.confirmOne' : 'save.confirmOther', { n: changes })}
          action={tr('save.discard')}
          danger
          onConfirm={() => {
            setConfirm(false);
            kb.discard();
            pads.discard();
          }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </PanelScreen>
  );
};

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-5 px-1 font-display text-[1.6rem] leading-[2.4rem] font-bold tracking-tight">
      {children}
    </h2>
  );
}

function Results({ rows, query, kb }: { rows: Row[]; query: string; kb: KeyboardState }) {
  if (!rows.length) return <NoMatch query={query} kb={kb} />;
  return CATEGORIES.map(([id]) => {
    const part = rows.filter((r) => r.category === id);
    return (
      part.length > 0 && (
        <ListGroup key={id} title={tr(`sections.${id}`)}>
          <KeyList rows={part} kb={kb} />
        </ListGroup>
      )
    );
  });
}
