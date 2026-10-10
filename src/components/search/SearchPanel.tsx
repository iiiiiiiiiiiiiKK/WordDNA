import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAll, type SearchHit } from '@/lib/search';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUIStore } from '@/store/useUIStore';
import { Dialog } from '@/components/common/Dialog';
import { Icon } from '@/components/common/Icon';
import { Chip } from '@/components/common/Chip';
import { EmptyState } from '@/components/common/EmptyState';

const KIND_COLOR: Record<SearchHit['kind'], 'word' | 'root' | 'prefix'> = {
  word: 'word',
  root: 'root',
  morpheme: 'prefix',
};

export function SearchBody({ onPick }: { onPick?: () => void }) {
  const [raw, setRaw] = useState('');
  const query = useDebouncedValue(raw, 120);
  const navigate = useNavigate();
  const hits = useMemo(() => searchAll(query, 30), [query]);

  const go = (hit: SearchHit) => {
    navigate(hit.to);
    onPick?.();
  };

  return (
    <div>
      <div className="relative">
        <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="搜索单词、词根、词缀…"
          className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-text outline-none focus:border-root"
        />
      </div>

      <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
        {query && hits.length === 0 && (
          <EmptyState icon="search" title="没有结果" description={`没有匹配「${query}」的内容。`} />
        )}
        {hits.map((h) => (
          <button
            key={`${h.kind}-${h.id}`}
            onClick={() => go(h)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-root/40"
          >
            <div className="min-w-0">
              <div className="font-medium text-text break-safe">{h.title}</div>
              <div className="truncate text-xs text-muted">{h.subtitle}</div>
            </div>
            <Chip color={KIND_COLOR[h.kind]}>{h.kind === 'word' ? '单词' : h.kind === 'root' ? '词根' : '词素'}</Chip>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchPanel() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="搜索">
      <SearchBody onPick={() => setOpen(false)} />
    </Dialog>
  );
}
