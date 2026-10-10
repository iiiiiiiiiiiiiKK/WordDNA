import { useState } from 'react';
import { classNames } from '@/lib/utils';

interface MultipleChoiceProps {
  prompt: string;
  options: string[];
  correctIndex: number;
  onResult?: (correct: boolean) => void;
}

export function MultipleChoice({ prompt, options, correctIndex, onResult }: MultipleChoiceProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  return (
    <div>
      <p className="mb-3 text-base text-text">{prompt}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt, i) => {
          const isCorrect = i === correctIndex;
          let cls = 'border-border hover:border-root/40';
          if (answered) {
            if (isCorrect) cls = 'border-success bg-success/10 text-success';
            else if (i === picked) cls = 'border-danger bg-danger/10 text-danger';
            else cls = 'border-border opacity-50';
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(i);
                onResult?.(isCorrect);
              }}
              className={classNames(
                'rounded-xl border-2 bg-surface px-4 py-3 text-left text-sm transition-colors',
                cls,
              )}
            >
              <span className="break-safe">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
