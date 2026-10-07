import React, { useEffect, useState } from 'react';
import { t } from '../../i18n';

const pictures = new Map<string, Promise<string | null>>();

function picture(mapFile: string) {
  let pending = pictures.get(mapFile);
  if (!pending) {
    pending = window.neoomsi
      .mapPicture(mapFile)
      .then((bytes) =>
        bytes ? URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/jpeg' })) : null,
      )
      .catch(() => null);
    pictures.set(mapFile, pending);
  }
  return pending;
}

export const MapBackdrop: React.FC<{ mapFile: string }> = ({ mapFile }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setUrl(null);
    picture(mapFile).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [mapFile]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      className="map-backdrop absolute inset-y-0 left-0 h-full w-[64%] object-cover"
    />
  );
};

export interface StopRow {
  name: string;
  time?: string;
}

export const StopList: React.FC<{ stops: StopRow[]; title: string }> = ({ stops, title }) => {
  if (stops.length === 0) return null;
  return (
    <div className="flex min-h-0 flex-col">
      <p className="eyebrow mb-4">{title}</p>
      <ol className="route stops min-h-0 overflow-y-auto pr-4">
        {stops.map((s, i) => (
          <li key={`${s.name}-${i}`}>
            <span className="flex items-baseline gap-3">
              {s.time && (
                <span className="w-12 shrink-0 text-[14.5px] font-medium text-muted tabular-nums">
                  {s.time}
                </span>
              )}
              <span className="truncate font-medium text-heading">{s.name}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[14px] text-muted">
        {t('drive.stage.stops', { count: stops.length })}
      </p>
    </div>
  );
};
