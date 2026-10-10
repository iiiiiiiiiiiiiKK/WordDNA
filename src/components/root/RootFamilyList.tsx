import { Link } from 'react-router-dom';
import type { Root } from '@/types/domain';
import { getFamilyWords } from '@/data';
import { useLearningStore } from '@/store/useLearningStore';
import { classNames } from '@/lib/utils';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: '新词', cls: 'text-muted' },
  learning: { label: '学习中', cls: 'text-warn' },
  review: { label: '待复习', cls: 'text-prefix' },
  mastered: { label: '已掌握', cls: 'text-success' },
};

interface RootFamilyListProps {
  rootId: string;
  className?: string;
}

export function RootFamilyList({ rootId, className }: RootFamilyListProps) {
  const words = getFamilyWords(rootId);
  const states = useLearningStore((s) => s.states);

  if (words.length === 0) {
    return <p className={classNames('text-sm text-muted', className)}>该词根暂无家族词。</p>;
  }

  return (
    <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
      {words.map((w) => {
        const st = states[w.id];
        const meta = STATUS_META[st?.status ?? 'new'];
        return (
          <Link
            key={w.id}
            to={`/word/${w.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-root/40"
          >
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-text break-safe">{w.word}</span>
                {w.phonetic && <span className="font-mono text-[11px] text-muted">{w.phonetic}</span>}
              </div>
              <div className="truncate text-xs text-muted">{w.meanings.map((m) => `${m.pos} ${m.cn}`).join('；')}</div>
              {w.etymology && (
                <div className="mt-0.5 truncate font-mono text-[11px] text-root/80 break-safe">{w.etymology}</div>
              )}
            </div>
            <span className={classNames('shrink-0 text-xs font-medium', meta.cls)}>{meta.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
