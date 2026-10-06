import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
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
    <div className="page-content">
      <PageHeader
        title={t('content.title')}
        actions={
          <button className="btn btn-secondary" onClick={refreshContent} disabled={loading}>
            {loading ? t('content.refreshing') : t('content.refresh')}
          </button>
        }
      />

      <div className="page-body">
        {error && <div className="notice-bar error">{error}</div>}

        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">{t('content.maps', { count: maps.length })}</h2>
          </div>
          {maps.length === 0 ? (
            <div className="empty-state">{t('content.noMaps')}</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
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
                        <code className="code-text select-text">{m.id}</code>
                      </td>
                      <td>{m.name}</td>
                      <td>{m.tileCount}</td>
                      <td>{m.hasChronology ? t('content.table.yes') : t('content.table.no')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="separator" />

        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">{t('content.vehicles', { count: vehicles.length })}</h2>
          </div>
          {vehicles.length === 0 ? (
            <div className="empty-state">{t('content.noVehicles')}</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
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
                        <code className="code-text select-text">{v.id}</code>
                      </td>
                      <td>{v.name}</td>
                      <td>{v.manufacturer}</td>
                      <td>{v.availablePaints?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
