import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { t } from '../../i18n';
import { call, errorText } from '../../lib/engine';
import { contentName } from '../../lib/format';
import type { Instance } from '../../types/launcher';

const tone = (line: string) =>
  /\bERROR\b/.test(line) ? 'text-danger' : /\bWARN\b/.test(line) ? 'text-warn' : '';

export const LogView: React.FC<{ instance: Instance; onClose: () => void }> = ({
  instance,
  onClose,
}) => {
  const [lines, setLines] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const body = useRef<HTMLPreElement>(null);
  const pinned = useRef(true);
  const { pid, running } = instance;

  useEffect(() => {
    let live = true;
    const load = () =>
      call('log', { pid, lines: 200 })
        .then((l) => {
          if (!live) return;
          setLines(l.lines);
          setError(null);
        })
        .catch((err) => live && setError(errorText(err)));
    load();
    const timer = running ? setInterval(load, 2000) : undefined;
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [pid, running]);

  useLayoutEffect(() => {
    const el = body.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const copy = () => {
    if (!lines) return;
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <div className="code h-72">
      <div className="code-bar">
        <span className="truncate">{contentName(instance.log ?? '')}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" className="code-action" onClick={copy} disabled={!lines?.length}>
            <Icon name={copied ? 'check' : 'content_copy'} size={15} />
            {copied ? t('common.copied') : t('common.copy')}
          </button>
          <button
            type="button"
            className="code-action"
            aria-label={t('sessions.hideLog')}
            title={t('sessions.hideLog')}
            onClick={onClose}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      </div>
      <pre
        ref={body}
        className="code-body m-0 text-[13px] whitespace-pre"
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
      >
        {error ? (
          <span className="text-danger">{error}</span>
        ) : lines === null ? (
          <span className="text-muted">{t('sessions.readingLog')}</span>
        ) : lines.length === 0 ? (
          <span className="text-muted">{t('sessions.emptyLog')}</span>
        ) : (
          lines.map((line, k) => (
            <span key={k} className={`block ${tone(line)}`}>
              {line || ' '}
            </span>
          ))
        )}
      </pre>
    </div>
  );
};
