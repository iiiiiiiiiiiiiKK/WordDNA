import { Icon } from '@/components/common/Icon';
import { classNames } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  className?: string;
  light?: boolean;
  /** 纯文本模式（不要胶囊底）：左边缘和上面的标题文字严格对齐，字号也更大 */
  plain?: boolean;
}

export function StreakBadge({ streak, className, light, plain }: StreakBadgeProps) {
  const active = streak > 0;
  return (
    <div
      className={classNames(
        plain
          ? 'inline-flex items-center gap-1.5 whitespace-nowrap text-base font-semibold'
          : 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium',
        light
          ? active
            ? 'text-white'
            : 'text-white/80'
          : plain
            ? active
              ? 'text-warn'
              : 'text-muted'
            : active
              ? 'bg-warn/10 text-warn'
              : 'bg-surface-2 text-muted',
        className,
      )}
    >
      <Icon name="flame" size={plain ? 18 : 16} />
      <span>{active ? `${streak} 天连续学习` : '今天还没开始'}</span>
    </div>
  );
}
