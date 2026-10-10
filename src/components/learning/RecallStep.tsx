import { useMemo } from 'react';
import type { Word } from '@/types/domain';
import { Button } from '@/components/common/Button';
import { MultipleChoice } from './MultipleChoice';
import { getWords } from '@/data';

interface RecallStepProps {
  word: Word;
  onContinue: () => void;
}

// 主动回忆：选出该单词的正确释义
export function RecallStep({ word, onContinue }: RecallStepProps) {
  const { options, correctIndex } = useMemo(() => {
    const correct = word.meanings[0].cn;
    const distractors = getWords()
      .filter((w) => w.id !== word.id)
      .map((w) => w.meanings[0].cn)
      .filter((cn) => cn !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const all = [correct, ...distractors].sort(() => Math.random() - 0.5);
    return { options: all, correctIndex: all.indexOf(correct) };
  }, [word.id]);

  return (
    <div>
      <MultipleChoice prompt={`「${word.word}」最可能表示？`} options={options} correctIndex={correctIndex} />
      <Button block className="mt-4" onClick={onContinue}>
        继续
      </Button>
    </div>
  );
}
