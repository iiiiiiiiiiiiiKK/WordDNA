import { useMemo } from 'react';
import type { Root } from '@/types/domain';
import { Button } from '@/components/common/Button';
import { MultipleChoice } from './MultipleChoice';
import { getRoots } from '@/data';

interface RootRecallStepProps {
  root: Root;
  onContinue: () => void;
}

// 词根主动回忆：选出该词根/前缀的正确释义
export function RootRecallStep({ root, onContinue }: RootRecallStepProps) {
  const { options, correctIndex } = useMemo(() => {
    const correct = root.meaning;
    const distractors = getRoots()
      .filter((r) => r.id !== root.id)
      .map((r) => r.meaning)
      .filter((m) => m !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const all = [correct, ...distractors].sort(() => Math.random() - 0.5);
    return { options: all, correctIndex: all.indexOf(correct) };
  }, [root.id]);

  return (
    <div>
      <p className="mb-3 text-sm text-muted break-safe">
        下面哪个释义最可能对应「<span className="font-semibold text-root">{root.root}</span>」？
      </p>
      <MultipleChoice prompt={`「${root.root}」最可能表示？`} options={options} correctIndex={correctIndex} />
      <Button block className="mt-4" onClick={onContinue}>
        继续
      </Button>
    </div>
  );
}
