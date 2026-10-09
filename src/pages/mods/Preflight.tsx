import React, { useState } from 'react';
import { Modal } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { Notice, Segmented, Spinner } from '../../components/ui';
import { t } from '../../i18n';
import { call, errorText, useCommand } from '../../lib/engine';
import { bytes, number } from '../../lib/format';
import { useToast } from '../../lib/nav';
import { InstallMode, type SourceInfo } from '../../types/launcher';
import { autoTakes, canInstall, fileName, modeKey } from './logic';

const MODES = [InstallMode.AUTO, InstallMode.EXTRACT, InstallMode.IN_PLACE];

export const Preflight: React.FC<{
  path: string;
  position: number;
  total: number;
  onStarted: () => void;
  onDone: () => void;
}> = ({ path, position, total, onStarted, onDone }) => {
  const info = useCommand('modinfo', { path });
  const toast = useToast();
  const [mode, setMode] = useState(InstallMode.AUTO);
  const [busy, setBusy] = useState(false);
  const name = fileName(path);

  const install = async () => {
    setBusy(true);
    try {
      await call('startInstall', { path, mode: info.data?.isArchive ? mode : InstallMode.AUTO });
      toast(t('mods.sheet.started', { name }), 'tip');
      onStarted();
      onDone();
    } catch (err) {
      toast(errorText(err), 'caution');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={name.replace(/([_.-])/g, '$1​')} onClose={onDone}>
      <p className="mt-1 truncate text-[14px] text-muted select-text" title={path}>
        {total > 1 && `${t('mods.sheet.of', { n: position, total })} · `}
        {path}
      </p>
      <div className="mt-5">
        {info.error ? (
          <Notice tone="caution" icon="error" title={t('mods.sheet.failed')}>
            <p className="select-text">{info.error}</p>
          </Notice>
        ) : info.data ? (
          <Facts info={info.data} mode={mode} onMode={setMode} />
        ) : (
          <Spinner label={t('mods.sheet.reading')} />
        )}
      </div>
      <div className="mt-7 flex justify-end gap-2">
        <button type="button" className="btn-quiet h-11 rounded-full px-5" onClick={onDone}>
          {total > 1 ? t('mods.sheet.skip') : t('common.cancel')}
        </button>
        <button
          type="button"
          className="btn h-11 rounded-full px-6"
          disabled={busy || !info.data || !canInstall(info.data, mode)}
          onClick={install}
        >
          {t('mods.sheet.install')}
        </button>
      </div>
    </Modal>
  );
};

function Facts({
  info,
  mode,
  onMode,
}: {
  info: SourceInfo;
  mode: InstallMode;
  onMode: (mode: InstallMode) => void;
}) {
  if (!info.isArchive) return <p className="text-[15.5px] text-muted">{t('mods.sheet.folder')}</p>;

  const facts: [string, string][] = [
    [t('mods.sheet.archive'), bytes(info.archiveBytes)],
    [t('mods.sheet.unpacked'), bytes(info.unpackedBytes)],
    [t('mods.sheet.files'), number(info.files)],
    [t('mods.sheet.free'), bytes(info.freeBytes)],
  ];
  const room = { needed: bytes(info.neededBytes), free: bytes(info.freeBytes) };
  const hint = !canInstall(info, mode)
    ? mode === InstallMode.IN_PLACE
      ? info.isZip
        ? t('mods.mode.inplaceNo', { reason: info.inPlace })
        : t('mods.mode.inplaceZipOnly')
      : t('mods.mode.noSpace')
    : mode === InstallMode.AUTO
      ? t(`mods.mode.autoWill.${modeKey(autoTakes(info))}`)
      : t(`mods.mode.${modeKey(mode)}Hint`);

  return (
    <>
      <dl className="divide-y divide-line text-[15px]">
        {facts.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2">
            <dt className="text-muted">{label}</dt>
            <dd className="text-heading tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p
        className={`mt-3 flex items-center gap-2 text-[14.5px] ${info.fits ? 'text-muted' : 'text-warn'}`}
      >
        <Icon name={info.fits ? 'check_circle' : 'warning'} size={17} />
        {info.fits ? t('mods.sheet.fits', room) : t('mods.sheet.noFit', room)}
      </p>
      <p className="mt-6 mb-2 text-[14.5px] font-semibold text-muted">{t('mods.sheet.mode')}</p>
      <Segmented
        fill
        label={t('mods.sheet.mode')}
        value={mode}
        options={MODES.map((m) => [m, t(`mods.mode.${modeKey(m)}`)] as const)}
        onChange={onMode}
      />
      <p
        className={`mt-2 px-1 text-[14.5px] leading-snug ${canInstall(info, mode) ? 'text-muted' : 'text-danger'}`}
      >
        {hint}
      </p>
    </>
  );
}
