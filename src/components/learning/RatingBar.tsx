import type { Rating } from '@/types/domain';
import { classNames } from '@/lib/utils';

interface RatingBarProps {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

const OPTIONS: { rating: Rating; label: string; sub: string; cls: string }[] = [
  { rating: 'again', label: '重来', sub: '10 分钟', cls: 'text-danger border-danger/40' },
  { rating: 'hard', label: '困难', sub: '1 天', cls: 'text-warn border-warn/40' },
  { rating: 'good', label: '良好', sub: '3 天', cls: 'text-prefix border-prefix/40' },
  { rating: 'easy', label: '简单', sub: '7 天', cls: 'text-success border-success/40' },
];

export function RatingBar({ onRate, disabled }: RatingBarProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.rating}
          disabled={disabled}
          onClick={() => onRate(o.rating)}
          className={classNames(
            'flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 bg-surface py-3 transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
            o.cls,
          )}
        >
          <span className="text-base font-semibold">{o.label}</span>
          <span className="text-[11px] opacity-70">{o.sub}</span>
        </button>
      ))}
    </div>
  );
}
