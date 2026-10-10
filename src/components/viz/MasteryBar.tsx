import { classNames } from '@/lib/utils';

interface MasteryBarProps {
  mastered: number;
  learning: number;
  review: number;
  newCount: number;
  className?: string;
}

const SEG = [
  { key: 'mastered', cls: 'bg-success' },
  { key: 'review', cls: 'bg-prefix' },
  { key: 'learning', cls: 'bg-warn' },
  { key: 'newCount', cls: 'bg-surface-2' },
] as const;

export function MasteryBar({ mastered, learning, review, newCount, className }: MasteryBarProps) {
  const total = Math.max(1, mastered + learning + review + newCount);
  const segs: Array<[number, string]> = [
    [mastered, 'bg-success'],
    [review, 'bg-prefix'],
    [learning, 'bg-warn'],
    [newCount, 'bg-surface-2'],
  ];
  return (
    <div className={classNames('flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      {segs.map(([v, cls], i) =>
        v > 0 ? (
          <div key={i} className={cls} style={{ width: `${(v / total) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}
