import React, { useEffect, useState } from 'react';
import { EmptyState, Notice, PageBody, PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { t } from '../i18n';
import type { MapSummary, VehicleSummary } from '../types/scaffold';
import { StatusCode } from '../types/scaffold';

export const ContentPage: React.FC = () => {
  const [maps, setMaps] = useState<MapSummary[]>([]);
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshContent = async () => {
    if (!window.neoomsi) return;
    setLoading(true);
    setError(null);
    try {
      const [mapsRes, vehiclesRes] = await Promise.all([
        window.neoomsi.getMaps(),
        window.neoomsi.getVehicles(),
      ]);
      if (mapsRes.status.code !== StatusCode.STATUS_OK) {
        throw new Error(mapsRes.status.message);
      }
      if (vehiclesRes.status.code !== StatusCode.STATUS_OK) {
        throw new Error(vehiclesRes.status.message);
      }
      setMaps(mapsRes.maps || []);
      setVehicles(vehiclesRes.vehicles || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(t('content.loadFailed', { message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContent();
  }, []);

  return (
    <>
      <PageHeader
        title={t('content.title')}
        actions={
          <button
            type="button"
            className="btn-quiet gap-2"
            onClick={refreshContent}
            disabled={loading}
          >
            <Icon name="refresh" size={18} />
            {loading ? t('content.refreshing') : t('content.refresh')}
          </button>
        }
      />

      <PageBody className="space-y-10">
        {error && <Notice tone="caution">{error}</Notice>}

        <section>
          <h2 className="mb-4 text-[1.2rem]">{t('content.maps', { count: maps.length })}</h2>
          {maps.length === 0 ? (
            <EmptyState>{t('content.noMaps')}</EmptyState>
          ) : (
            <div className="table-frame">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('content.table.id')}</th>
                    <th>{t('content.table.name')}</th>
                    <th>{t('content.table.tiles')}</th>
                    <th>{t('content.table.chronology')}</th>
                  </tr>
                </thead>
                <tbody>
                  {maps.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <code className="select-text">{m.id}</code>
                      </td>
                      <td className="font-medium text-heading">{m.name}</td>
                      <td>{m.tileCount}</td>
                      <td>{m.hasChronology ? t('content.table.yes') : t('content.table.no')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-[1.2rem]">
            {t('content.vehicles', { count: vehicles.length })}
          </h2>
          {vehicles.length === 0 ? (
            <EmptyState>{t('content.noVehicles')}</EmptyState>
          ) : (
            <div className="table-frame">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('content.table.id')}</th>
                    <th>{t('content.table.name')}</th>
                    <th>{t('content.table.manufacturer')}</th>
                    <th>{t('content.table.repaints')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <code className="select-text">{v.id}</code>
                      </td>
                      <td className="font-medium text-heading">{v.name}</td>
                      <td>{v.manufacturer}</td>
                      <td>{v.availablePaints?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
};
