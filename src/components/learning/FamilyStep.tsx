import { useMemo } from 'react';
import type { Root } from '@/types/domain';
import { Button } from '@/components/common/Button';
import { MultipleChoice } from './MultipleChoice';
import { getFamilyWords, getWords } from '@/data';

interface FamilyStepProps {
  root: Root;
  onContinue: () => void;
}

// 词根家族回忆：从家族词中选出一个属于该词根的词
export function FamilyStep({ root, onContinue }: FamilyStepProps) {
  const { options, correctIndex } = useMemo(() => {
    const family = getFamilyWords(root.id);
    const pool = family.length > 0 ? family : getWords().slice(0, 8);
    const correct = pool[Math.floor(Math.random() * pool.length)];
    const others = getWords()
      .filter((w) => !family.includes(w))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const all = [correct, ...others.map((w) => w)].sort(() => Math.random() - 0.5);
    return { options: all.map((w) => w.word), correctIndex: all.indexOf(correct) };
  }, [root.id]);

  return (
    <div>
      <MultipleChoice
        prompt={`下面哪个词最可能属于「${root.root}（${root.meaning}）」家族？`}
        options={options}
        correctIndex={correctIndex}
      />
      <Button block className="mt-4" onClick={onContinue}>
        继续
      </Button>
    </div>
  );
}
