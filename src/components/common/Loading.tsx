import { classNames } from '@/lib/utils';

export function Loading({ label = '加载中…', className }: { label?: string; className?: string }) {
  return (
    <div className={classNames('flex flex-col items-center justify-center gap-3 py-16 text-muted', className)}>
      <div className="h-8 w-8 rounded-full border-2 border-border border-t-root animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
