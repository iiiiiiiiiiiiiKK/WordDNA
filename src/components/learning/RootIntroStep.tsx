import type { Root, Word } from '@/types/domain';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { getFamilyWords } from '@/data';

interface RootIntroStepProps {
  root: Root;
  onContinue: () => void;
}

// 词根学习卡：先看释义与家族词（含中文 + 拆解 + 音标），再进入自测评分
export function RootIntroStep({ root, onContinue }: RootIntroStepProps) {
  const family = getFamilyWords(root.id);
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-root break-safe">{root.root}</div>
        {root.language && <Chip color="muted">{root.language}</Chip>}
      </div>

      {root.meaning ? (
        <p className="mt-2 text-base text-text">{root.meaning}</p>
      ) : (
        <p className="mt-2 text-sm text-muted">该词根暂无标准释义，可结合下方家族词理解。</p>
      )}

      {root.etymology && <p className="mt-2 text-xs text-muted break-safe">{root.etymology}</p>}
      {root.description && (
        <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-text break-safe">{root.description}</p>
      )}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted">家族词（{family.length}）</span>
          <span className="text-[11px] text-muted">点击单词查看完整拆解</span>
        </div>
        <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
          {family.map((w) => (
            <FamilyRow key={w.id} word={w} />
          ))}
          {family.length === 0 && <p className="text-sm text-muted">该词根暂无家族词。</p>}
        </div>
      </div>

      <Button block className="mt-5" onClick={onContinue}>
        我记住了，开始测试
      </Button>
    </div>
  );
}

// 家族词行：可点击进入单词详情（完整拆解 + 音标 + 例句）
function FamilyRow({ word }: { word: Word }) {
  return (
    <Link
      to={`/word/${word.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-root hover:bg-surface-2 active:bg-surface-2"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-text break-safe">{word.word}</span>
          {word.phonetic && <span className="font-mono text-[11px] text-muted">{word.phonetic}</span>}
        </div>
        <div className="truncate text-xs text-muted">
          {word.meanings.map((m) => `${m.pos} ${m.cn}`).join('；')}
        </div>
        {word.etymology && (
          <div className="mt-0.5 truncate font-mono text-[11px] text-root/80 break-safe">{word.etymology}</div>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted">›</span>
    </Link>
  );
}
