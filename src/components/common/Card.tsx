import type { ReactNode } from 'react';
import { classNames } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function Card({ children, className, onClick, interactive }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'bg-surface border-2 border-ink rounded-none p-4 sm:p-5',
        interactive && 'transition-colors duration-150 hover:bg-accent/20 cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
