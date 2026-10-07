import React from 'react';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, actions }) => {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 px-10 pt-9 pb-6">
      <h1 className="section-title">{title}</h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
};

export const PageBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`min-h-0 flex-1 overflow-y-auto px-10 pb-10 ${className}`}>{children}</div>;

export const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center text-muted">
    {children}
  </div>
);

export const Notice: React.FC<{
  tone?: 'note' | 'tip' | 'caution';
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'note', className = '', children }) => (
  <div className={`callout callout-${tone} text-[15.5px] ${className}`} role="status">
    {children}
  </div>
);
