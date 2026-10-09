import { t } from '../../i18n';
import { useDuty, type Choice } from '../../lib/duty';
import { useCommand } from '../../lib/engine';
import { useNav, useToast } from '../../lib/nav';
import type { ServerInfo } from '../../types/launcher';
import { hostingPatch, mapLabel, resolveMap, serverTitle } from './servers';

export function useJoin() {
  const { choice, update, setServer } = useDuty();
  const maps = useCommand('maps');
  const { go } = useNav();
  const toast = useToast();

  return (target: ServerInfo, mapValue = target.map) => {
    const installed = maps.data?.maps ?? [];
    const patch: Partial<Choice> = hostingPatch(false);
    if (mapValue && installed.length) {
      const map = resolveMap(mapValue, installed);
      if (!map) {
        toast(
          t('multiplayer.servers.mapMissing', { map: mapLabel(mapValue, installed) }),
          'caution',
        );
        return;
      }
      if (map.file !== choice.map) {
        Object.assign(patch, {
          map: map.file,
          entry: -1,
          line: '',
          tour: '',
          trip: '',
          hof: '',
          stop: null,
        });
      }
    }
    update(patch);
    setServer(target);
    toast(t('multiplayer.join.joined', { name: serverTitle(target) }), 'tip');
    go('drive');
  };
}
