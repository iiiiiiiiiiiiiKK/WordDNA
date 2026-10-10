import { classNames } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('animate-pulse rounded-xl bg-surface-2', className)} />;
}
