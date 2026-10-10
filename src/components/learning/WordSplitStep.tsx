import type { Word } from '@/types/domain';
import { Button } from '@/components/common/Button';
import { WordBuildingBoard } from '@/components/word/WordBuildingBoard';

interface WordSplitStepProps {
  word: Word;
  onContinue: () => void;
}

// 学习拆解步骤：先理解构词，再继续到回忆
export function WordSplitStep({ word, onContinue }: WordSplitStepProps) {
  return (
    <div>
      <WordBuildingBoard word={word} />
      <div className="mt-4 space-y-1">
        <div className="text-sm font-semibold text-text">释义</div>
        {word.meanings.map((m, i) => (
          <div key={i} className="text-sm text-text break-safe">
            <span className="mr-1.5 font-medium text-root">{m.pos}</span>
            {m.cn}
          </div>
        ))}
      </div>
      <Button block className="mt-5" onClick={onContinue}>
        我记住了
      </Button>
    </div>
  );
}
