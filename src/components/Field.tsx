import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

export const Field: React.FC<FieldProps> = ({ label, children, hint, error }) => {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-semibold text-muted">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-[14px] text-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-[14px] text-danger">{error}</span>}
    </label>
  );
};
