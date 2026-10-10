import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon?: Parameters<typeof Icon>[0]['name'];
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'sparkles', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="text-sm text-muted max-w-xs break-safe">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
