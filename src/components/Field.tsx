import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

export const Field: React.FC<FieldProps> = ({ label, children, hint, error }) => {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className="field-control">{children}</div>
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
};
