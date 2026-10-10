import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { useCollectionStore } from '@/store/useCollectionStore';
import { getWordById, getRootById } from '@/data';
import type { Favorite } from '@/types/domain';

export function Favorites() {
  const navigate = useNavigate();
  const favorites = useCollectionStore((s) => s.favorites);
  const toggleFavorite = useCollectionStore((s) => s.toggleFavorite);

  if (favorites.length === 0) {
    return (
      <PageContainer title="收藏">
        <EmptyState icon="bookmark" title="暂无收藏" description="在单词或词根详情页点击收藏，方便随时回看。" />
      </PageContainer>
    );
  }

  const open = (f: Favorite) => {
    if (f.kind === 'word') navigate(`/word/${f.refId}`);
    else navigate(`/roots/${f.refId}`);
  };

  return (
    <PageContainer title="收藏" subtitle={`共 ${favorites.length} 项`}>
      <div className="flex flex-col gap-2">
        {favorites
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((f) => {
            const word = f.kind === 'word' ? getWordById(f.refId) : undefined;
            const root = word ? undefined : getRootById(f.refId);
            if (!word && !root) return null;
            const title = word ? word.word : root!.root;
            const sub = word ? word.meanings.map((x) => x.cn).join('；') : root!.meaning;
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <button onClick={() => open(f)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Icon name={f.kind === 'word' ? 'book' : 'root'} size={18} className="shrink-0 text-root" />
                  <div className="min-w-0">
                    <div className="font-medium text-text break-safe">{title}</div>
                    <div className="truncate text-xs text-muted">{sub}</div>
                  </div>
                </button>
                <button
                  onClick={() => toggleFavorite(f.kind, f.refId)}
                  aria-label="取消收藏"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            );
          })}
      </div>
    </PageContainer>
  );
}
