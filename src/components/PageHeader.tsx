import React from 'react';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, actions }) => {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
};
