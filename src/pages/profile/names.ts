import { t } from '../../i18n';
import { useCommand } from '../../lib/engine';
import { contentName, lineLabel } from '../../lib/format';

export function useNames() {
  const maps = useCommand('maps');
  const vehicles = useCommand('vehicles');
  return {
    map: (map: string) =>
      maps.data?.find((m) => m.file === map || m.friendly === map || m.name === map)?.friendly ??
      contentName(map),
    bus: (bus: string) =>
      vehicles.data?.find((v) => v.file === bus || v.name === bus)?.name ?? contentName(bus),
  };
}

export function dutyName(line: string | null, tour: string | null) {
  if (!line) return t('profile.freeDrive');
  return tour ? t('profile.lineTour', { line: lineLabel(line), tour }) : lineLabel(line);
}
