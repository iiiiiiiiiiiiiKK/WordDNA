import { Link } from 'react-router-dom';
import type { Word } from '@/types/domain';
import { Card } from '@/components/common/Card';
import { Chip } from '@/components/common/Chip';
import { getRootById } from '@/data';

interface WordCardProps {
  word: Word;
  to?: string;
  className?: string;
}

export function WordCard({ word, to, className }: WordCardProps) {
  const target = to ?? `/word/${word.id}`;
  return (
    <Link to={target} className={className}>
      <Card interactive className="h-full">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-text break-safe">{word.word}</span>
            <span className="font-mono text-xs text-muted">{word.phonetic}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-text break-safe">{word.meanings.map((m) => `${m.pos} ${m.cn}`).join('；')}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {word.rootIds.slice(0, 3).map((id) => {
            const r = getRootById(id);
            return r ? (
              <Chip key={id} color="root">
                {r.root}
              </Chip>
            ) : null;
          })}
          {word.examLevels.slice(0, 3).map((l) => (
            <Chip key={l} color="muted">
              {l}
            </Chip>
          ))}
        </div>
      </Card>
    </Link>
  );
}
