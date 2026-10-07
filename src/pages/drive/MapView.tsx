import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';

export interface StopRow {
  name: string;
  time?: string;
}

export const StopList: React.FC<{ stops: StopRow[] }> = ({ stops }) => {
  if (stops.length === 0) return null;
  return (
    <div className="flex min-h-0 flex-col">
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
    </div>
  );
};

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

export const MapThumb: React.FC<{ mapFile: string; className?: string }> = ({
  mapFile,
  className = 'h-8 w-12',
}) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    picture(mapFile).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [mapFile]);
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-md bg-sunken text-muted ${className}`}
    >
      {url ? (
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <Icon name="map" size={16} />
      )}
    </span>
  );
};
