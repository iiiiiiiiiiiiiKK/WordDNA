import type { WordPart } from '@/types/domain';
import { Icon } from '@/components/common/Icon';
import { classNames } from '@/lib/utils';

interface MorphemeChipProps {
  part: WordPart;
  showMeaning?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

// 方案 D：词素三分采用强对比实色，词根（ROOT）用荧光黄绿做视觉主角
const TYPE_COLOR: Record<WordPart['type'], string> = {
  prefix: 'bg-accent-2 text-white',
  root: 'bg-accent text-onaccent',
  suffix: 'bg-ink text-paper',
};

const TYPE_LABEL: Record<WordPart['type'], string> = {
  prefix: '前缀',
  root: '词根',
  suffix: '后缀',
};

export function MorphemeChip({ part, showMeaning = true, size = 'md', className }: MorphemeChipProps) {
  const hasMeaning = Boolean(part.meaning);
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-none border-2 border-ink font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        TYPE_COLOR[part.type],
        className,
      )}
    >
      <span className="break-safe">{part.text}</span>
      {part.isInferred && <Icon name="alert" size={size === 'sm' ? 12 : 13} className="shrink-0" />}
      {showMeaning && (
        <span
          className={classNames(
            hasMeaning ? 'font-normal opacity-80' : 'font-normal opacity-60',
            size === 'sm' ? 'text-[10px]' : 'text-[11px]',
          )}
        >
          · {hasMeaning ? part.meaning : TYPE_LABEL[part.type]}
        </span>
      )}
    </span>
  );
}
