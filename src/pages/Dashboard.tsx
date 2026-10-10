import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { useLearningStore } from '@/store/useLearningStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useCollectionStore } from '@/store/useCollectionStore';
import { overallMastery } from '@/lib/mastery';
import { getRoots, getRootById, getWordById, getWords, getFamilyWords } from '@/data';
import { todayKey } from '@/lib/utils';
import { ROUTES as PATHS } from '@/lib/routes';
import { buildDailyQueue } from '@/lib/queue';
import { BRAND } from '@/lib/brand';
import type { Root } from '@/types/domain';

// 推荐词根的持久化 key：只有用户点 SHUFFLE 才会变
const RECOMMENDED_KEY = 'worddna.recommended.v1';

function loadRecommended(): Root[] {
  try {
    const raw = localStorage.getItem(RECOMMENDED_KEY);
    if (raw) {
      const ids = JSON.parse(raw) as string[];
      const list = ids.map((id) => getRootById(id)).filter((r): r is Root => Boolean(r));
      if (list.length > 0) return list;
    }
  } catch {
    /* 隐私模式下不可用则退回默认 */
  }
  return getRoots().slice(0, 6);
}

function saveRecommended(list: Root[]): void {
  try {
    localStorage.setItem(RECOMMENDED_KEY, JSON.stringify(list.map((r) => r.id)));
  } catch {
    /* noop */
  }
}

export function Dashboard() {
  const navigate = useNavigate();
  const states = useLearningStore((s) => s.states);
  const settings = useSettingsStore((s) => s.settings);
  const dailyLogs = useSettingsStore((s) => s.dailyLogs);
  const getStreak = useSettingsStore((s) => s.getStreak);
  const mistakes = useCollectionStore((s) => s.mistakes);
  const lastFeedRootId = useLearningStore((s) => s.lastFeedRootId);

  // 今日计划：用已有的每日队列算法算出「新学 / 复习」配额，正面回答「今天该学什么」。
  const today = useMemo(
    () => buildDailyQueue({ now: new Date(), plan: settings.plan, states }),
    [states, settings.plan],
  );
  // 中断恢复：有过学习记录且距今天 >= 1 天 → 无负罪感回归，不显示「连续中断」。
  const lastStudyDate = useMemo(() => {
    if (dailyLogs.length === 0) return null;
    return [...dailyLogs].map((l) => l.date).sort().at(-1) ?? null;
  }, [dailyLogs]);
  const gapDays = useMemo(() => {
    if (!lastStudyDate) return 0;
    const a = Date.parse(lastStudyDate + 'T00:00:00');
    const b = Date.parse(todayKey() + 'T00:00:00');
    return Math.max(0, Math.round((b - a) / 86_400_000));
  }, [lastStudyDate]);
  const showWelcomeBack = lastStudyDate !== null && gapDays >= 1;

  const pct = Math.round(overallMastery(states) * 100);
  const streak = getStreak();
  const rootCount = getRoots().length;
  const wordCount = getWords().length;

  const todayLog = useMemo(() => dailyLogs.find((l) => l.date === todayKey()), [dailyLogs]);

  // 到期复习数：间隔重复真正在起作用的地方。成年人需要明确的「今天该复习多少」，
  // 否则只会一直往前学新的，学过的全部忘掉。
  const dueCount = useMemo(() => {
    const now = Date.now();
    return Object.values(states).filter(
      (s) => s.status !== 'new' && Date.parse(s.dueAt) <= now,
    ).length;
  }, [states]);
  // 推荐词根：抽到什么就一直保持，直到用户主动 SHUFFLE。
  // 之前是组件 state，离开首页再回来（组件重挂载）就被重置成「前 6 个」，
  // 看起来像自己乱变——现在把 id 存进 localStorage。
  const [recommended, setRecommended] = useState<Root[]>(loadRecommended);
  // 薄弱词根 = 错题（权重 3/次）+ SRS 里遗忘次数多 & 掌握度低（lapses×2、ease<2.2 再 +1）
  // 只保留词根表里真实存在的 id，保证「N ITEMS」与实际渲染出来的 chip 数量一致
  // （旧实现会把 583 个查不到的 rootId 算进数字里，出现「2 ITEMS 却只显示 1 个」）。
  const weakRoots = useMemo(() => {
    const valid = new Set(getRoots().map((r) => r.id));
    const score = new Map<string, number>();
    const wrong = new Map<string, number>();
    const add = (id: string, n: number, isWrong: number) => {
      if (!valid.has(id)) return;
      score.set(id, (score.get(id) ?? 0) + n);
      wrong.set(id, (wrong.get(id) ?? 0) + isWrong);
    };
    const addByItem = (itemId: string, n: number, isWrong: number) => {
      // 错题可能是词根题本身（r-xxx），也可能是单词题（w-xxx → 归到它的词根）
      if (itemId.startsWith('r-')) {
        add(itemId, n, isWrong);
        return;
      }
      const w = getWordById(itemId);
      if (w) for (const rid of w.rootIds) add(rid, n, isWrong);
    };

    for (const m of mistakes) addByItem(m.itemId, m.wrongCount * 3, m.wrongCount);
    for (const s of Object.values(states)) {
      if (s.status === 'new') continue;
      const weak = s.lapses * 2 + (s.ease < 2.2 ? 1 : 0);
      if (weak > 0) addByItem(s.itemId, weak, 0);
    }
    return [...score.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, sc]) => ({ id, wrong: wrong.get(id) ?? 0 }));
  }, [mistakes, states]);

  // 今日词根：按「日期」做种子，在同一天里恒定、换一天才变（不是随机的，也不是写死的）。
  // 池子取词族最大的 12 个，保证每天都有足够多的家族词可探索。
  const todayRoot = useMemo(() => {
    const pool = [...getRoots()].sort((a, b) => b.words.length - a.words.length).slice(0, 12);
    if (pool.length === 0) return undefined;
    const seed = new Date(todayKey()).getTime();
    return pool[seed % pool.length];
  }, []);
  const familyWords = useMemo(
    () => (todayRoot ? getFamilyWords(todayRoot.id).slice(0, 4) : []),
    [todayRoot],
  );

  const shuffleRoots = () => {
    const all = getRoots();
    const picked: typeof all = [];
    const pool = all.slice();
    while (picked.length < 6 && pool.length > 0) {
      const i = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(i, 1)[0]);
    }
    setRecommended(picked);
    saveRecommended(picked);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return '深夜';
    if (h < 12) return '早上好';
    if (h < 18) return '下午好';
    return '晚上好';
  })();

  return (
    <PageContainer>
      <div>
        {/* ── 巨型英文标题：单词本身即视觉主体（品牌名已在顶栏，此处不重复） ── */}
        <section className="mt-5">
          <h1 className="word-huge text-[clamp(2.4rem,12vw,4rem)] text-text">
            {BRAND.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="word-huge mt-1 text-[clamp(1.3rem,6.5vw,2.1rem)] text-accent-2">
            {BRAND.headlineAlt.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted">
            <span>
              {greeting} · {BRAND.cn}
            </span>
            {/* 作者 X 外链：与顶栏一致，新标签页打开 */}
            <a
              href={BRAND.xUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`X ${BRAND.xHandle}`}
              className="shrink-0 rounded-full border border-border/60 bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-ink hover:bg-accent/20 hover:text-text"
            >
              𝕏 {BRAND.xHandle}
            </a>
          </p>
        </section>

        {showWelcomeBack && (
          <section className="mt-5 rounded-2xl border-2 border-ink bg-surface-2 p-4">
            <div className="tag-edit">WELCOME BACK</div>
            <p className="mt-2 text-sm font-semibold text-text">很高兴你回来了。</p>
            <p className="mt-1 text-xs text-muted">
              你已 {gapDays} 天没学习，不用补完所有内容。今天先学 5 分钟。
            </p>
            <Button block className="mt-3" onClick={() => navigate(PATHS.study)}>
              重新开始
            </Button>
          </section>
        )}

        {/* ── 今日学习：首页唯一要回答的问题「今天该学什么」 ── */}
        <section className="mt-5">
          <div className="flex items-baseline justify-between">
            <span className="word-huge text-[clamp(2rem,10vw,3rem)] text-text">TODAY</span>
            <span className="tag-edit">{todayKey().slice(5).replace('-', '/')}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-display text-2xl font-black leading-none text-text">{today.newCount}</div>
              <div className="tag-edit mt-1">NEW</div>
            </div>
            <div>
              <div className="font-display text-2xl font-black leading-none text-text">{today.reviewCount}</div>
              <div className="tag-edit mt-1">REVIEW</div>
            </div>
            <div>
              <div className="font-display text-2xl font-black leading-none text-text">{settings.plan}</div>
              <div className="tag-edit mt-1">MIN</div>
            </div>
          </div>
          <Button block className="mt-3" onClick={() => navigate(PATHS.study)}>
            {BRAND.cta}
            <Icon name="arrow-right" size={18} />
          </Button>
          {lastFeedRootId &&
            (() => {
              const r = getRootById(lastFeedRootId);
              return r ? (
                <button
                  onClick={() => navigate(PATHS.rootFamily(r.id))}
                  className="mt-2 flex w-full items-center justify-between border-b-2 border-ink py-2 text-left"
                >
                  <span className="tag-edit">继续上次学习</span>
                  <span className="font-display text-sm font-bold tracking-tight text-text">{r.root}</span>
                </button>
              ) : null;
            })()}
        </section>

        <div className="rule mt-5" />

        {/* ── 今日词根 ── */}
        {todayRoot && (
          <section className="mt-5">
            <div className="flex items-baseline justify-between">
              <span className="tag-edit">TODAY&apos;S ROOT</span>
              {/* 直接标出日期：一眼看出「当天固定、隔天轮换」，不是随机的 */}
              <span className="tag-edit">DAILY · {todayKey().slice(5).replace('-', '/')}</span>
            </div>

            <button
              onClick={() => navigate(PATHS.rootFamily(todayRoot.id))}
              className="mt-2 block w-full text-left"
            >
              <span className="word-huge block text-[clamp(2rem,10vw,3rem)] text-text">
                {todayRoot.root}
              </span>
              <span className="mt-1 block font-mono text-sm text-accent-2">
                {todayRoot.meaning}
              </span>
            </button>

            {familyWords.length > 0 && (
              <ol className="mt-3 border-t-2 border-ink">
                {familyWords.map((w, i) => (
                  <li
                    key={w.id}
                    className="flex items-baseline gap-3 border-b border-border/50 py-2"
                  >
                    <span className="tag-edit w-6 shrink-0 text-ink">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => navigate(PATHS.wordDetail(w.id))}
                      className="flex-1 text-left"
                    >
                      <span className="font-display text-base font-bold tracking-tight text-text">
                        {w.word}
                      </span>
                      <span className="ml-2 text-xs text-muted">{w.meanings[0]?.cn ?? ''}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <button
              onClick={() => navigate(PATHS.rootFamily(todayRoot.id))}
              className="mt-3 tag-edit border-b-2 border-ink text-ink hover:text-accent-2"
            >
              VIEW FULL FAMILY ↗
            </button>
          </section>
        )}

        {/* ── 今日学习状态：一行编辑式数据，不做卡片堆 ── */}
        <section className="mt-6 border-y-2 border-ink py-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            <EditorialStat label="MASTERY" value={`${pct}%`} />
            <EditorialStat label="STREAK" value={`${streak}D`} />
            <EditorialStat label="ROOTS" value={rootCount} />
            <EditorialStat label="WORDS" value={wordCount} />
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            {todayLog && todayLog.total > 0
              ? `今日已学 ${todayLog.total} · 正确率 ${Math.round((todayLog.correct / Math.max(1, todayLog.total)) * 100)}% · 计划 ${settings.plan} 分钟`
              : `新学 ${settings.dailyNewTarget} · 复习 ${settings.dailyReviewTarget} · ${settings.plan} 分钟计划`}
          </p>
        </section>

        {/* ── 到期复习提醒：间隔重复的关键钩子 ── */}
        {dueCount > 0 && (
          <button
            onClick={() => navigate(PATHS.study)}
            className="mt-4 flex w-full items-center justify-between gap-2 border-2 border-ink bg-accent px-3 py-2.5 text-left shadow-hard-sm"
          >
            <span className="font-display text-sm font-bold text-onaccent">
              有 {dueCount} 项到期复习
            </span>
            <span className="tag-edit text-onaccent">去复习 →</span>
          </button>
        )}

        {/* ── 快捷入口（主行动已放在 TODAY 卡片，这里只做分流） ── */}
        <section className="mt-6">
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(PATHS.split)}>
              拆词
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(PATHS.graph())}>
              图谱
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(PATHS.roots)}>
              词根
            </Button>
          </div>
        </section>

        {/* ── 易错词根 ── */}
        {weakRoots.length > 0 && (
          <section className="mt-6">
            <div className="flex items-baseline justify-between">
              <span className="tag-edit">WEAK ROOTS</span>
              <span className="tag-edit">{weakRoots.length} ITEMS</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {weakRoots.map(({ id, wrong }) => {
                const r = getRootById(id);
                if (!r) return null;
                return (
                  <button
                    key={id}
                    onClick={() => navigate(PATHS.rootFamily(r.id))}
                    className="flex items-baseline gap-1 border-2 border-ink bg-accent-2 px-2.5 py-1 font-display text-sm font-bold tracking-tight text-white shadow-hard-sm"
                  >
                    {r.root}
                    {wrong > 0 && (
                      <span className="font-mono text-[10px] font-normal opacity-80">
                        ×{wrong}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              答错/遗忘会自动归到这里，× 是累计答错次数；点进去可直接看该词根整个词族。
            </p>
          </section>
        )}

        {/* ── 推荐词根 ── */}
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="tag-edit">RECOMMENDED</span>
            <div className="flex items-center gap-3">
              <button
                onClick={shuffleRoots}
                className="tag-edit border-b-2 border-ink text-ink hover:text-accent-2"
              >
                SHUFFLE
              </button>
              <button
                onClick={() => navigate(PATHS.roots)}
                className="tag-edit border-b-2 border-ink text-ink hover:text-accent-2"
              >
                ALL
              </button>
            </div>
          </div>
          <ul className="mt-2 border-t-2 border-ink">
            {recommended.map((r, i) => (
              <li key={r.id} className="border-b border-border/50">
                <button
                  onClick={() => navigate(PATHS.rootFamily(r.id))}
                  className="flex w-full items-baseline gap-3 py-2.5 text-left hover:bg-accent/20"
                >
                  <span className="tag-edit w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-base font-bold tracking-tight text-text">
                    {r.root}
                  </span>
                  <span className="ml-auto truncate text-xs text-muted">{r.meaning}</span>
                </button>
              </li>
            ))}
          </ul>
          {mistakes.length > 0 && (
            <button
              onClick={() => navigate(PATHS.mistakes)}
              className="mt-3 tag-edit border-b-2 border-ink text-accent-2"
            >
              REVIEW {mistakes.length} MISTAKES ↗
            </button>
          )}
        </section>
      </div>
    </PageContainer>
  );
}

function EditorialStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="font-display text-lg font-black leading-none text-text">{value}</div>
      <div className="tag-edit mt-1">{label}</div>
    </div>
  );
}
