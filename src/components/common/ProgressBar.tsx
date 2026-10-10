import { classNames } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0..1
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  height?: number;
}

export function ProgressBar({ value, className, trackClassName, barClassName, height = 8 }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={classNames('w-full rounded-full bg-surface-2 overflow-hidden', trackClassName, className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={classNames('h-full rounded-full bg-root transition-[width] duration-500', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
