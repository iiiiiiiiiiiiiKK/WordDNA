import type { Word } from '@/types/domain';
import { Card } from '@/components/common/Card';
import { WordParts } from './WordParts';

interface WordBuildingBoardProps {
  word: Word;
  className?: string;
}

const LEGEND = [
  { label: '前缀', cls: 'text-prefix bg-prefix/10' },
  { label: '词根', cls: 'text-root bg-root/10' },
  { label: '后缀', cls: 'text-suffix bg-suffix/10' },
];

// 构词拆解面板：单词 + 词素拆解 + 词源说明
export function WordBuildingBoard({ word, className }: WordBuildingBoardProps) {
  return (
    <Card className={className}>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-text">构词拆解</h3>
        <span className="font-mono text-xs text-muted">{word.phonetic}</span>
      </div>
      <div className="text-2xl font-bold text-word break-safe">{word.word}</div>
      <div className="mt-3">
        <WordParts parts={word.parts} />
      </div>
      <p className="mt-4 border-l-2 border-root/40 pl-3 text-sm text-muted break-safe">{word.etymology}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {LEGEND.map((l) => (
          <span key={l.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${l.cls}`}>
            {l.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
