import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { Icon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { useCollectionStore } from '@/store/useCollectionStore';
import { useLearningStore } from '@/store/useLearningStore';
import { getWordById, getRootById } from '@/data';

export function Mistakes() {
  const navigate = useNavigate();
  const mistakes = useCollectionStore((s) => s.mistakes);
  const clearMistakes = useCollectionStore((s) => s.clearMistakes);
  const startSession = useLearningStore((s) => s.startSession);

  const items = useMemo(
    () =>
      mistakes
        .map((m) => {
          const word = getWordById(m.itemId);
          const root = word ? undefined : getRootById(m.itemId);
          return { m, word, root };
        })
        .filter((x) => x.word || x.root)
        .sort((a, b) => b.m.lastWrongAt.localeCompare(a.m.lastWrongAt)),
    [mistakes],
  );

  const reviewAll = () => {
    const queue = items.map(({ m, word, root }) => ({
      itemId: m.itemId,
      type: (word ? 'word' : 'root') as 'word' | 'root',
      kind: 'review' as const,
    }));
    if (queue.length === 0) return;
    startSession('review', queue);
    navigate('/study');
  };

  return (
    <PageContainer title="错题" subtitle={`共 ${items.length} 个易错项`}>
      {items.length === 0 ? (
        <EmptyState icon="check" title="暂无错题" description="做错的单词会在这里出现，方便集中复习。" />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (window.confirm(`清空 ${items.length} 条错题记录？学习进度与复习排期不受影响。`)) {
                  void clearMistakes();
                }
              }}
            >
              清空错题
            </Button>
            <Button size="sm" onClick={reviewAll}>
              复习全部错题
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map(({ m, word, root }) => {
              const to = word ? `/word/${word.id}` : `/roots/${root!.id}`;
              const title = word ? word.word : root!.root;
              const sub = word ? word.meanings.map((x) => x.cn).join('；') : root!.meaning;
              return (
                <button
                  key={m.itemId}
                  onClick={() => navigate(to)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-danger/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon name="alert" size={18} className="shrink-0 text-danger" />
                    <div className="min-w-0">
                      <div className="font-medium text-text break-safe">{title}</div>
                      <div className="truncate text-xs text-muted">{sub}</div>
                    </div>
                  </div>
                  <Chip color="muted">错 {m.wrongCount} 次</Chip>
                </button>
              );
            })}
          </div>
        </>
      )}
    </PageContainer>
  );
}
