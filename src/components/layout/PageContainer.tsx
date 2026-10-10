import type { ReactNode } from 'react';
import { classNames } from '@/lib/utils';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageContainer({ title, subtitle, actions, children, className }: PageContainerProps) {
  return (
    <div className={className}>
      {(title || actions) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {title && <h1 className="text-xl font-semibold text-text break-safe">{title}</h1>}
            {subtitle && <p className="mt-0.5 text-sm text-muted break-safe">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
