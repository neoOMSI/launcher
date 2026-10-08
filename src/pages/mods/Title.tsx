import type { ReactNode } from 'react';

export function Title({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-6">
      <h2 className="px-1 font-display text-[1.6rem] leading-[2.4rem] font-bold tracking-tight">
        {children}
      </h2>
      {action}
    </div>
  );
}
