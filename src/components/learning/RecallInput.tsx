import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { classNames } from '@/lib/utils';

interface RecallInputProps {
  prompt: string;
  answer: string;
  onResult?: (correct: boolean) => void;
  placeholder?: string;
}

export function RecallInput({ prompt, answer, onResult, placeholder = '输入你的答案…' }: RecallInputProps) {
  const [val, setVal] = useState('');
  const [checked, setChecked] = useState(false);
  const correct = val.trim().toLowerCase() === answer.trim().toLowerCase();

  return (
    <div>
      <p className="mb-3 text-base text-text">{prompt}</p>
      <input
        value={val}
        disabled={checked}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text outline-none focus:border-root"
      />
      {!checked ? (
        <Button
          block
          className="mt-3"
          onClick={() => {
            setChecked(true);
            onResult?.(correct);
          }}
        >
          检查
        </Button>
      ) : (
        <div
          className={classNames(
            'mt-3 rounded-xl px-4 py-3 text-sm',
            correct ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
          )}
        >
          {correct ? '答对了！' : (
            <>
              正确答案：<b className="break-safe">{answer}</b>
            </>
          )}
        </div>
      )}
    </div>
  );
}
