import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  // Neo-Brutalism：实心墨底 + 硬阴影 + 直角，按下时阴影塌陷产生“实体按压”反馈
  primary:
    'bg-btn-bg text-btn-fg border-2 border-ink shadow-hard-sm rounded-none font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  subtle: 'bg-surface-2 text-text border-2 border-ink rounded-none hover:bg-border/40',
  ghost: 'bg-transparent text-text rounded-none hover:bg-surface-2',
  danger: 'bg-danger text-white border-2 border-ink rounded-none shadow-hard-sm',
  outline:
    'bg-transparent text-text border-2 border-ink rounded-none hover:bg-accent hover:text-ink',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-14 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 select-none disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
