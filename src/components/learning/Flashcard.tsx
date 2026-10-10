import type { ReactNode } from 'react';
import { useState } from 'react';
import { classNames } from '@/lib/utils';

interface FlashcardProps {
  front: ReactNode;
  back: ReactNode;
  height?: number;
  frontHint?: string;
}

export function Flashcard({ front, back, height = 230, frontHint = '点击卡片看释义' }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="flip-scene" style={{ height }}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={classNames('flip-inner relative h-full w-full rounded-2xl', flipped && 'is-flipped')}
        aria-label="翻转卡片"
      >
        <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-2 p-5 text-center">
          <div className="text-xl font-semibold text-text break-safe">{front}</div>
          <span className="text-xs text-muted">{frontHint}</span>
        </div>
        <div className="flip-face flip-face--back absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-auto rounded-2xl border border-root/30 bg-surface p-5 text-center">
          <div className="break-safe text-text">{back}</div>
        </div>
      </button>
    </div>
  );
}
