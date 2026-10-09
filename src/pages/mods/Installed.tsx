import React, { useMemo, useState } from 'react';
import { Confirm } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { ListGroup, ListRow } from '../../components/List';
import { SearchField } from '../../components/Screen';
import { Notice } from '../../components/ui';
import { t } from '../../i18n';
import { call, errorText } from '../../lib/engine';
import { ago, bytes, dateTime } from '../../lib/format';
import { useToast } from '../../lib/nav';
import type { InstalledMod } from '../../types/launcher';
import { filterInstalled, usedInPlace } from './logic';
import { Title } from './Title';

export const Installed: React.FC<{ mods: InstalledMod[]; cleaned: string[] }> = ({
  mods,
  cleaned,
}) => {
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState<InstalledMod | null>(null);
  const toast = useToast();
  const shown = useMemo(() => filterInstalled(mods, query), [mods, query]);

  const uninstall = async (mod: InstalledMod) => {
    setRemoving(null);
    try {
      await call('uninstallMod', { name: mod.name });
      toast(t('mods.uninstall.done', { name: mod.name }), 'tip');
    } catch (err) {
      toast(errorText(err), 'caution');
    }
  };

  return (
    <>
      <Title
        action={
          mods.length > 0 && (
            <SearchField value={query} onChange={setQuery} placeholder={t('mods.search')} />
          )
        }
      >
        {t('mods.sections.installed')}
      </Title>
      {cleaned.length > 0 && (
        <Notice tone="note" icon="cleaning_services" title={t('mods.cleaned')} className="mb-8">
          <ul className="space-y-0.5 text-muted select-text">
            {cleaned.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Notice>
      )}
      <ListGroup>
        {mods.length === 0 ? (
          <ListRow label={t('mods.none')} hint={t('mods.noneHint')} />
        ) : shown.length === 0 ? (
          <ListRow label={t('mods.noMatch', { query: query.trim() })} />
        ) : (
          shown.map((mod) => (
            <div key={mod.name} className="list-row gap-4">
              <span className="grid size-9 shrink-0 place-items-center text-muted">
                <Icon name={usedInPlace(mod) ? 'folder_zip' : 'extension'} size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-ink">{mod.name}</p>
                <p className="truncate text-[14.5px] text-muted" title={mod.folders.join('\n')}>
                  <span title={dateTime(mod.installed)}>{ago(mod.installed)}</span>
                  {' · '}
                  {bytes(mod.size)}
                  {usedInPlace(mod) && ` · ${t('mods.inPlace')}`}
                  {mod.folders.length > 0 && ` · ${mod.folders.join(', ')}`}
                </p>
              </div>
              <button
                type="button"
                className="theme-toggle shrink-0 rounded-full hover:text-danger"
                aria-label={t('mods.uninstall.label', { name: mod.name })}
                title={t('mods.uninstall.label', { name: mod.name })}
                onClick={() => setRemoving(mod)}
              >
                <Icon name="delete" size={19} />
              </button>
            </div>
          ))
        )}
      </ListGroup>
      {removing && (
        <Confirm
          title={t('mods.uninstall.title', { name: removing.name })}
          action={t('mods.uninstall.confirm')}
          danger
          onConfirm={() => uninstall(removing)}
          onCancel={() => setRemoving(null)}
        >
          <p>{t('mods.uninstall.body', { folder: `Mods/uninstalled/${removing.name}` })}</p>
          {removing.folders.length > 0 && (
            <ul className="mt-3 space-y-0.5 font-mono text-[13.5px] break-all">
              {removing.folders.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </Confirm>
      )}
    </>
  );
};
