import React from 'react';
import { Icon } from '../../components/Icon';
import { ListGroup, ListRow } from '../../components/List';
import { t } from '../../i18n';
import { bytes, number } from '../../lib/format';
import type { Mods } from './logic';
import { Title } from './Title';

export const Folders: React.FC<{ mods: Mods; onOpen: (path: string) => void }> = ({
  mods,
  onOpen,
}) => {
  const filled = mods.folders.filter((f) => f.entries > 0n);
  const empty = mods.folders.filter((f) => f.entries === 0n).map((f) => f.folder);

  return (
    <>
      <Title>{t('mods.sections.folders')}</Title>

      <ListGroup title={t('mods.inbox.title')} hint={t('mods.inbox.hint')}>
        <ListRow
          label={t('mods.inbox.folder')}
          hint={<span className="block truncate select-text">{mods.inbox || '–'}</span>}
        >
          <button
            type="button"
            className="btn-quiet h-9 gap-2 rounded-full px-4 text-[14.5px]"
            disabled={!mods.inbox}
            onClick={() => onOpen(mods.inbox)}
          >
            <Icon name="folder_open" size={18} />
            {t('mods.open')}
          </button>
        </ListRow>
        {mods.inboxItems.map((item) => (
          <ItemRow key={item} icon="hourglass_top" label={item} hint={t('mods.inbox.settling')} />
        ))}
      </ListGroup>

      {mods.waiting.length > 0 && (
        <ListGroup title={t('mods.waiting.title')} hint={t('mods.waiting.hint')}>
          {mods.waiting.map((w) => (
            <ItemRow key={w} icon="directions_bus" label={w} />
          ))}
        </ListGroup>
      )}

      {mods.archives.length > 0 && (
        <ListGroup title={t('mods.archives')}>
          {mods.archives.map(({ name, bytes: size }) => (
            <ItemRow key={name} icon="folder_zip" label={name} value={bytes(size)} />
          ))}
        </ListGroup>
      )}

      <ListGroup title={t('mods.content.title')} hint={mods.contentDir}>
        {filled.map(({ folder, entries: n }) => (
          <div key={folder} className="list-row min-h-12 py-2">
            <span className="min-w-0 flex-1 truncate text-ink">{folder}</span>
            <span className="text-[15px] text-muted tabular-nums">{number(n)}</span>
          </div>
        ))}
        {empty.length > 0 && (
          <div className="list-row min-h-12 py-2 text-[14.5px] text-muted">
            {t('mods.content.empty', { names: empty.join(', ') })}
          </div>
        )}
        {mods.folders.length === 0 && <ListRow label={t('mods.content.none')} />}
      </ListGroup>
    </>
  );
};

function ItemRow({
  icon,
  label,
  hint,
  value,
}: {
  icon: string;
  label: string;
  hint?: string;
  value?: string;
}) {
  return (
    <div className="list-row gap-4">
      <span className="grid size-9 shrink-0 place-items-center text-muted">
        <Icon name={icon} size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-ink">{label}</p>
        {hint && <p className="truncate text-[14.5px] text-muted">{hint}</p>}
      </div>
      {value && <span className="shrink-0 text-[15px] text-muted tabular-nums">{value}</span>}
    </div>
  );
}
