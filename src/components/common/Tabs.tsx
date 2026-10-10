import type { ReactNode } from 'react';
import { classNames } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div className={classNames('flex gap-1 rounded-xl bg-surface-2 p-1 overflow-x-auto', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={classNames(
            'flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
            active === it.id ? 'bg-surface text-root shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}
