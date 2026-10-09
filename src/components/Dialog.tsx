import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n';

export function Confirm({
  title,
  children,
  action,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  children?: ReactNode;
  action: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-6 backdrop-blur-[2px]"
      onPointerDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[28rem] rounded-[1.25rem] bg-page p-7 shadow-2xl"
      >
        <h2 className="font-display text-[1.45rem] leading-tight font-bold tracking-tight">
          {title}
        </h2>
        {children && <div className="mt-2.5 text-[15.5px] text-muted">{children}</div>}
        <div className="mt-7 flex justify-end gap-2">
          <button
            type="button"
            className="btn-quiet h-11 rounded-full px-5"
            autoFocus
            onClick={onCancel}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`btn h-11 rounded-full px-6 ${danger ? 'bg-danger text-white hover:bg-danger/85' : ''}`}
            onClick={onConfirm}
          >
            {action}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Modal({
  title,
  wide,
  hideTitle,
  onClose,
  children,
}: {
  title: string;
  wide?: boolean;
  hideTitle?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-6 backdrop-blur-[2px]"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${wide ? 'max-w-[42rem]' : 'max-w-[28rem]'} rounded-[1.25rem] bg-page p-7 shadow-2xl`}
      >
        {!hideTitle && (
          <h2 className="font-display text-[1.45rem] leading-tight font-bold tracking-tight">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
