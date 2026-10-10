import type { WordPart } from '@/types/domain';
import { MorphemeChip } from './MorphemeChip';

interface WordPartsProps {
  parts: WordPart[];
  className?: string;
}

// 把拆解结果渲染为带「+」连接的可换行词素序列
export function WordParts({ parts, className }: WordPartsProps) {
  if (parts.length === 0) {
    return <p className={className}>暂无拆解数据。</p>;
  }
  return (
    <div className={['flex flex-wrap items-center gap-x-1.5 gap-y-2', className].filter(Boolean).join(' ')}>
      {parts.map((part, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <MorphemeChip part={part} />
          {i < parts.length - 1 && <span className="text-muted">+</span>}
        </span>
      ))}
    </div>
  );
}
