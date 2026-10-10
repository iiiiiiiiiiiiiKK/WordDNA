import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { GraphExplorer } from '@/components/viz/GraphExplorer';
import { getRoots, getRootById, getFamilyWords } from '@/data';
import { useLearningStore } from '@/store/useLearningStore';
import { useScrollRestore } from '@/lib/useScrollRestore';
import { ROUTES } from '@/lib/routes';

export function Graph() {
  const { rootId } = useParams<{ rootId?: string }>();
  const navigate = useNavigate();
  const roots = getRoots();
  const lastRootId = useLearningStore((s) => s.lastFeedRootId);
  // 点图谱里的单词节点进详情、再返回时回到原来那一屏
  useScrollRestore(`graph:${rootId ?? 'default'}`);

  // 选中词根：URL 优先；没有 URL 参数时，回到「最近在看的那个词根」而不是死盯 un，
  // 否则从任何地方点进图谱都只会看到 un，像是没生效。
  const DEFAULT_ROOT = 'r-un';
  const focused =
    rootId ?? (lastRootId && getRootById(lastRootId) ? lastRootId : DEFAULT_ROOT);
  const root = focused ? getRootById(focused) : undefined;

  // 标本选择器：收录全部词根（274 个），按词族规模排序——大家族在前，便于优先探索。
  // 之前只取前 30 个，被误认为「没有全部显示」，现已放开为全量（横向滑动浏览）。
  const topRoots = useMemo(() => {
    const list = [...roots].sort((a, b) => b.words.length - a.words.length);
    if (!list.some((r) => r.id === DEFAULT_ROOT)) {
      const un = getRootById(DEFAULT_ROOT);
      if (un) list.push(un);
    }
    return list;
  }, [roots]);

  const family = useMemo(() => (root ? getFamilyWords(root.id) : []), [root]);

  const select = (id: string) => navigate(ROUTES.graph(id || undefined));

  return (
    <PageContainer
      title="词根实验室"
      subtitle="深色探索环境：以当前词根为中心，观察词族如何向外生长"
    >
      {/* ── 方案 B：深色知识实验室（与浅色页面形成节奏差） ── */}
      {/* 实验台：不再用纯黑板（和米黄纸主题反差过大、面板上的白字按钮看不清），
          改成同色系的「标本台」——暖灰底 + 墨黑粗描边，节点配色仍走主题变量。 */}
      <section className="border-2 border-ink bg-surface-2">
        {/* 抬头：词根和它的释义同一行，不再单独占一行 */}
        <div className="flex items-end justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="tag-edit">ROOT LAB / SPECIMEN</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-lab text-[clamp(1.6rem,7vw,2.4rem)] font-bold leading-none text-text break-safe">
                {root ? root.root : '—'}
              </span>
              {root && root.meaning && (
                <span className="font-mono text-sm text-accent-2 break-safe">{root.meaning}</span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="tag-edit">FAMILY</div>
            <div className="mt-1 font-display text-lg font-black text-root">{family.length}</div>
          </div>
        </div>

        {/* 标本选择器：全量词根，横向滑动 */}
        <div className="flex items-baseline justify-between px-4 pt-3">
          <span className="tag-edit">SPECIMENS · ALL {topRoots.length}</span>
          <span className="tag-edit">SWIPE →</span>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {topRoots.map((r) => {
            const isActive = focused === r.id;
            return (
              <button
                key={r.id}
                onClick={() => select(r.id)}
                className={
                  'shrink-0 border-2 px-2.5 py-1 font-display text-xs font-bold tracking-tight transition-colors ' +
                  // 选中态改用 ink/paper 成对色（原来是 bg-root + text-onaccent；
                  // 离开黑板底后 root=墨黑、onaccent 也是墨黑，会变成黑底黑字）
                  (isActive
                    ? 'border-ink bg-ink text-paper'
                    : 'border-border bg-surface text-muted hover:text-text')
                }
              >
                {r.root}
              </button>
            );
          })}
        </div>

        {/* 图谱画布 */}
        <div className="border-t border-border">
          <GraphExplorer key={focused || 'all'} rootId={focused || undefined} />
        </div>
      </section>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        提示：中心为当前词根，关联单词向外展开；点击单词节点可查看释义与详情。可拖拽重排、拖动平移、滚轮缩放。图谱融合自
        cigen 真实词根词缀库与自研词缀词典，力导向布局由前端自研物理引擎实时计算（零第三方依赖）。
      </p>
    </PageContainer>
  );
}
