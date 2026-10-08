import { Component, type ErrorInfo, type ReactNode } from 'react';
import { t } from '../i18n';
import { Icon } from './Icon';

interface Props {
  children: ReactNode;
  onError?: (text: string) => void;
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(`[Launcher] ${error.message}${info.componentStack ?? ''}`);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const details = `${error.name}: ${error.message}\n${error.stack ?? ''}`;
    return (
      <div className="stage-calm mr-3 mb-3 flex min-h-0 flex-1 items-center justify-center overflow-y-auto rounded-3xl p-10">
        <div className="w-full max-w-[34rem]">
          <span className="grid size-12 place-items-center text-danger">
            <Icon name="error" size={35} />
          </span>
          <h1 className="mt-5 font-display text-[2rem] leading-tight font-bold tracking-tight">
            {t('crash.title')}
          </h1>
          <p className="mt-2 text-muted">{t('crash.text')}</p>
          <pre className="mt-6 max-h-48 rounded-xl bg-sunken overflow-auto px-5 py-4 font-mono text-[13px] leading-normal whitespace-pre-wrap text-ink select-text">
            {error.message}
          </pre>
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              className="btn h-11 gap-2 rounded-full pr-6 pl-5"
              onClick={() => this.setState({ error: null })}
            >
              <Icon name="refresh" size={19} />
              {t('crash.retry')}
            </button>
            <button
              type="button"
              className="btn-quiet h-11 gap-2 rounded-full pr-6 pl-5"
              onClick={() => navigator.clipboard?.writeText(details).catch(() => {})}
            >
              <Icon name="content_copy" size={18} />
              {t('crash.copy')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
