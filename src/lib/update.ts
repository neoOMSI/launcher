import { create } from '@bufbuild/protobuf';
import { useCallback, useEffect, useState } from 'react';
import { GameUpdateSchema, UpdateState, type GameUpdate } from '../types/launcher';
import { call, errorText, useEngine } from './engine';

export function useGameUpdate() {
  const { status } = useEngine();
  const [update, setUpdate] = useState<GameUpdate | null>(null);
  const canInstall = !!window.neoomsi && !!status.commands?.includes('install_update');

  useEffect(() => {
    if (!window.neoomsi) return;
    return window.neoomsi.onEngineEvent((event) => {
      if (event.case === 'updateChanged') setUpdate(event.value);
    });
  }, []);

  const install = useCallback(() => {
    setUpdate(create(GameUpdateSchema, { state: UpdateState.DOWNLOADING }));
    call('installUpdate')
      .then(setUpdate)
      .catch((err) =>
        setUpdate(create(GameUpdateSchema, { state: UpdateState.FAILED, message: errorText(err) })),
      );
  }, []);

  const busy =
    update?.state === UpdateState.DOWNLOADING || update?.state === UpdateState.RESTARTING;
  return { update, setUpdate, canInstall, install, busy };
}
