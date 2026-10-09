import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { ListGroup, ListRow } from '../../components/List';
import { t } from '../../i18n';
import { call, errorText, useCommand } from '../../lib/engine';
import { useToast } from '../../lib/nav';
import { useSettings } from '../../lib/settings';
import type { KeyBinding, KeyBindings } from '../../types/launcher';
import { actionName } from './actions';
import { CATEGORIES, categoryOf, type Category } from './categories';
import {
  MODIFIER_CODES,
  capture as captureKey,
  chordOf,
  keyAlias,
  keyCaps,
  keyLabel,
  type LayoutMap,
} from './keys';
import {
  actionRows,
  addKey,
  conflicts,
  countChanges,
  keyId,
  setKey,
  unbind,
  type Group,
} from './model';

interface Capture {
  group: Group;
  action: string;
  index: number | null;
  fresh?: boolean;
}

export interface Row {
  group: Group;
  action: string;
  name: string;
  category: Category;
  entries: number[];
  bound: number[];
  conflict: boolean;
}

const GROUPS: Group[] = ['vehicles', 'game'];

function useLayoutMap() {
  const [layout, setLayout] = useState<LayoutMap>();
  useEffect(() => {
    const keyboard = (
      navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<LayoutMap> } }
    ).keyboard;
    keyboard
      ?.getLayoutMap?.()
      .then((map) => setLayout(() => map))
      .catch(() => {});
  }, []);
  return layout;
}

export function useKeyboard() {
  const { language: lang } = useSettings();
  const layout = useLayoutMap();
  const toast = useToast();
  const { data, error, loading, reload } = useCommand('keybindings');
  const [stored, setStored] = useState<KeyBindings>();
  const [draft, setDraft] = useState<KeyBindings | null>(null);
  const [capture, setCapture] = useState<Capture | null>(null);

  useEffect(() => setStored(undefined), [data]);
  const saved = stored ?? data;
  const current = draft ?? saved;

  const edit = (group: Group, change: (list: KeyBinding[]) => KeyBinding[]) =>
    setDraft((d) => {
      const base = d ?? saved;
      return base ? { ...base, [group]: change(base[group] ?? []) } : d;
    });

  useEffect(() => {
    if (!capture) return;
    let lone: string | null = null;
    const commit = (e: KeyboardEvent) => {
      const hit = captureKey(e, 0);
      if (!hit) {
        toast(t('controls.keyboard.unknownKey', { key: e.key.trim() || e.code }), 'caution');
        return;
      }
      edit(capture.group, (list) =>
        capture.index === null
          ? addKey(list, capture.action, hit.scan, hit.modifier)
          : setKey(list, capture.index, hit.scan, hit.modifier),
      );
      setCapture(null);
    };
    const down = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
      if (MODIFIER_CODES.has(e.code)) {
        lone = e.code;
        return;
      }
      lone = null;
      if (e.code === 'Escape') return setCapture(null);
      if (
        capture.index !== null &&
        !capture.fresh &&
        !chordOf(e) &&
        (e.code === 'Backspace' || e.code === 'Delete')
      ) {
        const index = capture.index;
        edit(capture.group, (list) => unbind(list, index));
        return setCapture(null);
      }
      commit(e);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'PrintScreen' && e.code !== lone) return;
      e.preventDefault();
      commit(e);
    };
    const cancel = () => setCapture(null);
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    window.addEventListener('pointerdown', cancel, true);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
      window.removeEventListener('pointerdown', cancel, true);
      window.removeEventListener('blur', cancel);
    };
  }, [capture]);

  const shared = useMemo(
    () =>
      Object.fromEntries(GROUPS.map((g) => [g, conflicts(current?.[g] ?? [])])) as Record<
        Group,
        Map<string, string[]>
      >,
    [current],
  );

  const rows = useMemo(() => {
    if (!current) return [];
    const all = GROUPS.flatMap((group) => {
      const list = current[group] ?? [];
      return actionRows(list).map((row): Row => {
        const bound = row.entries.filter((i) => list[i].scanCode);
        return {
          ...row,
          group,
          name: actionName(row.action, lang),
          category: categoryOf(row.action, group),
          bound,
          conflict: bound.some((i) => shared[group].has(keyId(list[i]))),
        };
      });
    });
    const order = (c: Category) => CATEGORIES.findIndex(([id]) => id === c);
    return all.sort((a, b) => order(a.category) - order(b.category));
  }, [current, shared, lang]);

  const changes = useMemo(() => (draft && saved ? countChanges(saved, draft) : 0), [draft, saved]);

  const save = async () => {
    if (!draft) return true;
    try {
      setStored(await call('saveKeybindings', draft));
      setDraft(null);
      return true;
    } catch (err) {
      toast(t('controls.failed', { error: errorText(err) }), 'caution');
      return false;
    }
  };

  const matches = (row: Row, q: string) => {
    if (row.name.toLowerCase().includes(q) || row.action.toLowerCase().includes(q)) return true;
    const list = current?.[row.group] ?? [];
    return row.bound.some((i) => {
      const b = list[i];
      return `${keyLabel(b.scanCode, b.modifier, lang, layout)} ${keyAlias(b.scanCode)}`
        .toLowerCase()
        .includes(q);
    });
  };

  return {
    lang,
    layout,
    current,
    error,
    loading,
    reload,
    rows,
    shared,
    changes,
    capture,
    setCapture,
    matches,
    save,
    discard: () => {
      setCapture(null);
      setDraft(null);
    },
    remove: (group: Group, index: number) => edit(group, (list) => unbind(list, index)),
  };
}

export type KeyboardState = ReturnType<typeof useKeyboard>;

export function KeyList({ rows, kb }: { rows: Row[]; kb: KeyboardState }) {
  return rows.map((row) => <ActionRow key={`${row.group}:${row.action}`} row={row} kb={kb} />);
}

const looksLikeTrigger = (s: string) => s.length > 1 && /^[\w+-]+$/.test(s);

export function NoMatch({ query, kb }: { query: string; kb: KeyboardState }) {
  const name = query.trim();
  const known = kb.rows.some((r) => r.action.toLowerCase() === name.toLowerCase());
  const offer = looksLikeTrigger(name) && !known;
  const adding =
    kb.capture?.index === null && kb.capture.group === 'vehicles' && kb.capture.action === name;
  return (
    <ListGroup>
      <ListRow
        label={t('controls.keyboard.noMatch', { query: name })}
        hint={offer ? t('controls.keyboard.addActionHint') : undefined}
      >
        {offer &&
          (adding ? (
            <CapturePill />
          ) : (
            <button
              type="button"
              className="btn-quiet h-10 gap-2 rounded-full px-5"
              onClick={() => kb.setCapture({ group: 'vehicles', action: name, index: null })}
            >
              <Icon name="add" size={20} />
              {t('controls.keyboard.addAction')}
            </button>
          ))}
      </ListRow>
    </ListGroup>
  );
}

function ActionRow({ row, kb }: { row: Row; kb: KeyboardState }) {
  const { capture, setCapture, lang, layout } = kb;
  const list = kb.current?.[row.group] ?? [];
  const capturing = (index: number | null) =>
    capture?.group === row.group && capture.action === row.action && capture.index === index;
  const active = capture?.group === row.group && capture.action === row.action;
  const first = row.entries[0];
  const others = [
    ...new Set(row.bound.flatMap((i) => kb.shared[row.group].get(keyId(list[i])) ?? [])),
  ]
    .filter((a) => a !== row.action)
    .map((a) => actionName(a, lang));

  const hint = active
    ? capture.index === null || capture.fresh
      ? t('controls.keyboard.pressHintNew')
      : t('controls.keyboard.pressHint')
    : others.length
      ? t('controls.keyboard.shared', { actions: others.join(', ') })
      : undefined;

  return (
    <div className="group/row list-row">
      <div className="min-w-0 flex-1">
        <div className="truncate text-ink" title={row.action}>
          {row.name}
        </div>
        {hint && (
          <div
            className={`mt-0.5 truncate text-[14.5px] leading-snug ${
              !active && others.length ? 'text-danger' : 'text-muted'
            }`}
          >
            {hint}
          </div>
        )}
      </div>
      <div className="flex max-w-[60%] shrink-0 flex-wrap items-center justify-end gap-2">
        {row.bound.map((index) =>
          capturing(index) ? (
            <CapturePill key={index} />
          ) : (
            <KeyCap
              key={index}
              caps={keyCaps(list[index].scanCode, list[index].modifier, lang, layout)}
              clash={kb.shared[row.group].has(keyId(list[index]))}
              onChange={() => setCapture({ group: row.group, action: row.action, index })}
              onRemove={() => kb.remove(row.group, index)}
            />
          ),
        )}
        {!row.bound.length &&
          (capturing(first) ? (
            <CapturePill />
          ) : (
            <button
              type="button"
              className="h-8 rounded-md px-2.5 text-[15px] text-muted ring-1 ring-line-strong transition-colors ring-inset hover:text-ink"
              onClick={() =>
                setCapture({ group: row.group, action: row.action, index: first, fresh: true })
              }
            >
              {t('controls.keyboard.notSet')}
            </button>
          ))}
        {!row.bound.length && <span className="size-8" aria-hidden="true" />}
        {capturing(null) ? (
          <CapturePill />
        ) : (
          row.bound.length > 0 && (
            <button
              type="button"
              className="theme-toggle size-8 rounded-full opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
              title={t('controls.keyboard.addKey', { action: row.name })}
              aria-label={t('controls.keyboard.addKey', { action: row.name })}
              onClick={() => setCapture({ group: row.group, action: row.action, index: null })}
            >
              <Icon name="add" size={18} />
            </button>
          )
        )}
      </div>
    </div>
  );
}

function KeyCap({
  caps,
  clash,
  onChange,
  onRemove,
}: {
  caps: string[];
  clash: boolean;
  onChange: () => void;
  onRemove: () => void;
}) {
  const label = caps.join('+');
  return (
    <span className="group/cap relative">
      <button
        type="button"
        className={`flex h-8 min-w-8 items-center justify-center gap-1 rounded-md bg-sunken px-2.5 text-[15px] font-medium transition-colors hover:bg-line ${
          clash ? 'text-danger ring-1 ring-danger/70 ring-inset' : 'text-heading'
        }`}
        aria-label={t('controls.keyboard.changeKey', { key: label })}
        onClick={onChange}
      >
        {caps.map((cap, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-muted">+</span>}
            <kbd className="font-sans">{cap}</kbd>
          </Fragment>
        ))}
      </button>
      <button
        type="button"
        className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-line text-muted opacity-0 shadow transition-opacity group-hover/cap:opacity-100 hover:text-danger focus-visible:opacity-100"
        aria-label={t('controls.keyboard.removeKey', { key: label })}
        title={t('controls.keyboard.removeKey', { key: label })}
        onClick={onRemove}
      >
        <Icon name="close" size={14} />
      </button>
    </span>
  );
}

function CapturePill() {
  return (
    <span
      role="status"
      className="flex h-8 animate-pulse items-center rounded-md bg-brand/12 px-2.5 text-[15px] font-medium text-accent ring-1 ring-brand ring-inset"
    >
      {t('controls.keyboard.press')}
    </span>
  );
}
