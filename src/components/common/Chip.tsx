import type { ReactNode } from 'react';
import { classNames } from '@/lib/utils';

interface ChipProps {
  children: ReactNode;
  color?: 'root' | 'prefix' | 'suffix' | 'word' | 'muted';
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const COLORS = {
  root: 'text-root bg-root/10',
  prefix: 'text-prefix bg-prefix/10',
  suffix: 'text-suffix bg-suffix/10',
  word: 'text-word bg-surface-2',
  muted: 'text-muted bg-surface-2',
};

export function Chip({ children, color = 'muted', active, onClick, className }: ChipProps) {
  return (
    <span
      onClick={onClick}
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        COLORS[color],
        active && '!bg-accent !text-onaccent font-semibold',
        onClick && 'cursor-pointer transition-transform active:scale-95',
        className,
      )}
    >
      {children}
    </span>
  );
}
