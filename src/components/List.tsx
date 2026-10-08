import type { ReactNode } from 'react';

export function ListGroup({
  title,
  hint,
  action,
  children,
}: {
  title?: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      {(title || action) && (
        <div className="mb-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="font-sans text-[15px] font-semibold text-muted">{title}</h2>}
            {hint && <p className="mt-0.5 text-[14.5px] text-muted">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="list">{children}</div>
    </section>
  );
}

export function ListRow({
  label,
  hint,
  children,
  wide,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`list-row ${wide ? 'flex-col items-stretch' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="text-ink">{label}</div>
        {hint && <div className="mt-0.5 text-[14.5px] leading-snug text-muted">{hint}</div>}
      </div>
      {children && <div className={wide ? '' : 'flex shrink-0 items-center'}>{children}</div>}
    </div>
  );
}
