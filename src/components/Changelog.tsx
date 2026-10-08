import React from 'react';

export type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'text'; text: string };

// neoOMSI's release notes wrap the changes in an intro and a downloads table.
const CHANGES = /^##\s+what['’]?s changed\s*$/i;

export function changes(notes: string): string {
  const lines = notes.split(/\r?\n/);
  const start = lines.findIndex((l) => CHANGES.test(l.trim()));
  if (start < 0) return notes;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  return rest.slice(0, end < 0 ? undefined : end).join('\n');
}

export function blocks(notes: string): Block[] {
  const out: Block[] = [];
  for (const raw of changes(notes).split(/\r?\n/)) {
    const line = raw.trim();
    const last = out.at(-1);
    if (!line || line.startsWith('|')) continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const item = line.match(/^[-*]\s+(.*)$/);
    if (heading) out.push({ kind: 'heading', text: heading[1] });
    else if (item && last?.kind === 'list') last.items.push(item[1]);
    else if (item) out.push({ kind: 'list', items: [item[1]] });
    else out.push({ kind: 'text', text: line.replace(/^>\s*/, '') });
  }
  return out;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

const open = (url: string) => {
  if (window.neoomsi) void window.neoomsi.openExternal(url);
  else window.open(url, '_blank', 'noopener');
};

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE).map((part, k) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={k}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={k} className="rounded bg-sunken px-1 font-mono text-[0.9em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link && /^https:\/\//.test(link[2])) {
          return (
            <button key={k} type="button" className="link" onClick={() => open(link[2])}>
              {link[1]}
            </button>
          );
        }
        return <React.Fragment key={k}>{link ? link[1] : part}</React.Fragment>;
      })}
    </>
  );
}

export const Changelog: React.FC<{ notes: string; className?: string }> = ({
  notes,
  className = '',
}) => (
  <div className={`space-y-3 text-[14.5px] leading-snug text-ink select-text ${className}`}>
    {blocks(notes).map((b, k) =>
      b.kind === 'heading' ? (
        <h4 key={k} className="pt-1 font-display text-[15px] font-semibold text-heading">
          <Inline text={b.text} />
        </h4>
      ) : b.kind === 'list' ? (
        <ul key={k} className="list-disc space-y-1 pl-5 marker:text-muted">
          {b.items.map((item, i) => (
            <li key={i}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      ) : (
        <p key={k} className="text-muted">
          <Inline text={b.text} />
        </p>
      ),
    )}
  </div>
);
