import type { Word } from '@/types/domain';
import { Icon } from '@/components/common/Icon';
import { Chip } from '@/components/common/Chip';
import { useCollectionStore } from '@/store/useCollectionStore';
import { SpeakButton } from '@/components/common/SpeakButton';
import { classNames } from '@/lib/utils';

interface WordHeaderProps {
  word: Word;
  className?: string;
}

export function WordHeader({ word, className }: WordHeaderProps) {
  const isFav = useCollectionStore((s) => s.isFavorite('word', word.id));
  const toggleFavorite = useCollectionStore((s) => s.toggleFavorite);

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h1 className="text-3xl font-bold text-text break-safe">{word.word}</h1>
            <SpeakButton text={word.word} label="" className="self-center" />
            {word.phonetic && (
              <span className="font-mono text-sm text-accent-2">{word.phonetic}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleFavorite('word', word.id)}
          aria-label={isFav ? '取消收藏' : '收藏'}
          className={classNames(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
            isFav ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-muted hover:text-danger',
          )}
        >
          <Icon name={isFav ? 'heart' : 'bookmark'} size={22} />
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {word.meanings.map((m, i) => (
          <div key={i} className="text-sm text-text break-safe">
            <span className="mr-1.5 font-medium text-root">{m.pos}</span>
            {m.cn}
          </div>
        ))}
      </div>

      {word.examLevels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {word.examLevels.map((l) => (
            <Chip key={l} color="muted">
              {l}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
