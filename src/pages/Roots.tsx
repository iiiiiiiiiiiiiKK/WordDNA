import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { RootList } from '@/components/root/RootList';
import { Tabs } from '@/components/common/Tabs';
import { Icon } from '@/components/common/Icon';
import { getRoots } from '@/data';
import { ROUTES } from '@/lib/routes';
import { useScrollRestore } from '@/lib/useScrollRestore';
import type { Root } from '@/types/domain';

export function Roots() {
  const roots = getRoots();
  const navigate = useNavigate();
  // 从词根详情返回时回到原来那一屏（274 个词根，滚到 al 再返回被弹回顶部很打断学习节奏）
  useScrollRestore('roots');
  // 分类标签：全部 / 词根（有释义）/ 前缀（前缀型词根，如 ad/trans）
  const categories = useMemo(() => ['全部', '词根', '前缀'], []);
  // 分类也记住，返回时不会莫名换了一组列表
  const [cat, setCat] = useState(
    () => sessionStorage.getItem('worddna.roots.cat') ?? '全部',
  );

  const filtered: Root[] = useMemo(() => {
    if (cat === '全部') return roots;
    if (cat === '前缀') return roots.filter((r) => r.language === '前缀');
    return roots.filter((r) => r.language !== '前缀');
  }, [roots, cat]);

  const prefixCount = roots.filter((r) => r.language === '前缀').length;
  const rootCount = roots.length - prefixCount;

  return (
    <PageContainer>
      {/* 图谱入口：原来只是右上角一个孤零零的小按钮，现在做成整块居中的「实验室入口」 */}
      <button
        onClick={() => navigate(ROUTES.graph())}
        aria-label="进入词根实验室 · 图谱"
        className="group mb-4 block w-full"
      >
        <div className="flex items-center justify-center gap-2 border-2 border-ink bg-surface-2 px-4 py-3 shadow-hard-sm transition-colors group-hover:bg-accent/25 group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-none">
          <Icon name="graph" size={18} className="text-accent-2" />
          <span className="font-display text-sm font-bold tracking-tight text-text">
            词根实验室 · 图谱
          </span>
          <span className="font-mono text-[11px] text-muted">↗</span>
        </div>
      </button>

      <Tabs
        className="mb-4"
        items={categories.map((l) => ({
          id: l,
          label: l === '词根' ? `词根 ${rootCount}` : l === '前缀' ? `前缀 ${prefixCount}` : '全部',
        }))}
        active={cat}
        onChange={(id) => {
          setCat(id);
          sessionStorage.setItem('worddna.roots.cat', id);
        }}
      />
      <RootList roots={filtered} />
    </PageContainer>
  );
}
