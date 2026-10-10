import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import { SpeakButton } from '@/components/common/SpeakButton';
import { getWords, searchEcdict, examBooks, getEcdictPhonetic, getEcdict, vocabExamples } from '@/data';
import { splitWord } from '@/lib/splitter';
import { WordParts } from '@/components/word/WordParts';
import type { WordPart } from '@/types/domain';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
type ExamCat = keyof typeof examBooks;
type Tab = 'root' | 'surplus' | 'exam';

// ── 浏览位置记忆 ────────────────────────────────────────────
// 看到第 100 个词刷新后就回到第 1 个，这种体验对“按字母表一路刷下去”是致命的。
// 这里把「当前分类 + 关键词 + 字母 + 滚动位置」存进 localStorage，刷新后原样复位。
// （用 localStorage 而非 IndexedDB：只是 UI 视图状态，同步读写、无需事务。）
const STORAGE_KEY = 'worddna.wordbook.v1';

/** 每页渲染条数：一次渲染几千张卡片会明显卡顿，改成「加载更多」按需追加 */
const PAGE = 200;

interface WordbookView {
  tab: Tab;
  q: string;
  letter: string;
  examCat: string;
  scrollTop: number;
  /** 已加载条数：刷新后必须恢复，否则「回到第 100 个」时列表还没渲染到那里 */
  limit: number;
}

function loadView(): WordbookView | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<WordbookView>;
    if (!v || (v.tab !== 'root' && v.tab !== 'surplus' && v.tab !== 'exam')) return null;
    const cats = Object.keys(examBooks) as string[];
    return {
      tab: v.tab,
      q: typeof v.q === 'string' ? v.q : '',
      letter: typeof v.letter === 'string' ? v.letter : '',
      examCat: typeof v.examCat === 'string' && cats.includes(v.examCat) ? v.examCat : cats[0],
      scrollTop: typeof v.scrollTop === 'number' && v.scrollTop > 0 ? v.scrollTop : 0,
      limit: typeof v.limit === 'number' && v.limit >= PAGE ? v.limit : PAGE,
    };
  } catch {
    return null;
  }
}

// 词库浏览：三个词本共用同一套「富卡片」——内联展示 单词 + 音标 + 全部释义 + 例句 + 词素拆解，
// 无需再点进详情页，也不再需要「学习 / 拆解」按钮。
//  - 词根词库：App 内置词根词（自带词素拆解），按首字母分组
//  - 盈余词库：ECDICT 补充常用词（未内置拆解，由拆词引擎实时计算）
//  - 考试词书：四级 / 考研 / 雅思 / 托福 词书分类
export function WordbookPanel() {
  const initRef = useRef<WordbookView | null>(null);
  if (initRef.current === null) initRef.current = loadView();
  const init = initRef.current;

  const [tab, setTab] = useState<Tab>(init?.tab ?? 'root');
  const [q, setQ] = useState(init?.q ?? '');
  const [letter, setLetter] = useState(init?.letter ?? '');
  const [examCat, setExamCat] = useState<ExamCat>(
    (init?.examCat as ExamCat) ?? (Object.keys(examBooks)[0] as ExamCat),
  );

  const [limit, setLimit] = useState(init?.limit ?? PAGE);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(init?.scrollTop ?? 0);
  const saveTimer = useRef<number | null>(null);

  const scheduleSave = () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            tab,
            q,
            letter,
            examCat,
            scrollTop: scrollTopRef.current,
            limit,
          }),
        );
      } catch {
        /* 隐私模式下 localStorage 不可用时静默跳过 */
      }
    }, 400);
  };

  // 换了分类/关键词/字母/词书 → 回到第一页（首次挂载不触发，避免把恢复的分页数冲掉）
  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    setLimit(PAGE);
  }, [tab, q, letter, examCat]);

  // 首次渲染后把滚动位置恢复到上次离开的地方（列表是同步渲染的，一帧即可）
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const el = scrollRef.current;
    if (!el || scrollTopRef.current <= 0) return;
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollTopRef.current;
    });
  }, []);

  // 筛选条件 / 加载更多 → 写回（滚动位置由 onScroll 更新后触发）
  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, letter, examCat, limit]);

  const cigenWords = useMemo(() => {
    const all = getWords().slice().sort((a, b) => a.word.localeCompare(b.word));
    const set = new Set(all.map((w) => w.word.toLowerCase()));
    return { all, set };
  }, []);

  // 全量结果（不截断）：用来算真实总数与 001/002 的连续序号
  const rootAll = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = cigenWords.all.filter((w) => {
      if (letter && (w.word[0] || '').toUpperCase() !== letter) return false;
      if (query && !w.word.toLowerCase().includes(query)) return false;
      return true;
    });
    // base = 该字母组在全量结果里的起始序号，保证 001/002 跨字母组连续
    const groups: { letter: string; items: typeof filtered; base: number }[] = [];
    const map = new Map<string, typeof filtered>();
    for (const w of filtered) {
      const L = (w.word[0] || '#').toUpperCase();
      if (!map.has(L)) map.set(L, []);
      map.get(L)!.push(w);
    }
    let base = 0;
    const push = (L: string) => {
      const items = map.get(L);
      if (!items) return;
      groups.push({ letter: L, items, base });
      base += items.length;
    };
    for (const L of ALPHABET) push(L);
    push('#');
    return groups;
  }, [cigenWords, q, letter]);

  // 当前页实际渲染的部分（按 limit 截断，点「加载更多」再翻一倍）
  const rootList = useMemo(() => trimGroups(rootAll, limit), [rootAll, limit]);

  const surplusAll = useMemo(() => {
    if (tab !== 'surplus') return [];
    const query = (q.trim() || letter).toLowerCase();
    if (!query) return [];
    // 一次性取足（上限 5000），再本地截断——否则「加载更多」会重复扫描词库
    return searchEcdict(query, 5000).filter((e) => !cigenWords.set.has(e.word));
  }, [tab, q, letter, cigenWords]);
  const surplusList = useMemo(() => surplusAll.slice(0, limit), [surplusAll, limit]);

  const examAll = useMemo(() => {
    if (tab !== 'exam') return [] as string[];
    const all = examBooks[examCat]?.words ?? [];
    const query = (q.trim() || letter).toLowerCase();
    if (!query) return all;
    return all.filter((w) => w.startsWith(query) || w.includes(query));
  }, [tab, examCat, q, letter]);
  const examWords = useMemo(() => examAll.slice(0, limit), [examAll, limit]);

  // 词素拆解：为考试词书 / 盈余词库 单词调用拆词引擎，仅保留可可靠拆解的结果
  // （拉丁/希腊词根词会产出拆解；日耳曼原生词等引擎返回空，卡片则不显示拆解，符合设计）
  const examSplits = useMemo(() => {
    const m = new Map<string, WordPart[]>();
    if (tab === 'exam') {
      for (const w of examWords) {
        const r = splitWord(w);
        if (r.success && r.parts.length > 0) m.set(w, r.parts);
      }
    }
    return m;
  }, [tab, examWords]);

  const surplusSplits = useMemo(() => {
    const m = new Map<string, WordPart[]>();
    if (tab === 'surplus') {
      for (const e of surplusList) {
        const r = splitWord(e.word);
        if (r.success && r.parts.length > 0) m.set(e.word, r.parts);
      }
    }
    return m;
  }, [tab, surplusList]);

  // 真实总数（不受分页影响）与当前已渲染条数
  const total =
    tab === 'root'
      ? rootAll.reduce((n, g) => n + g.items.length, 0)
      : tab === 'surplus'
        ? surplusAll.length
        : examAll.length;
  const shown =
    tab === 'root'
      ? rootList.reduce((n, g) => n + g.items.length, 0)
      : tab === 'surplus'
        ? surplusList.length
        : examWords.length;
  const hasMore = shown < total;

  // 换了筛选条件，列表内容就变了，滚动位置必须一并归零再重新记
  const resetFilters = () => {
    setQ('');
    setLetter('');
    scrollTopRef.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    scheduleSave();
  };

  const pickLetter = (L: string) => {
    setLetter(letter === L ? '' : L);
    setQ('');
    scrollTopRef.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    scheduleSave();
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">词库浏览</h3>
        <div className="flex gap-1.5">
          <TabBtn active={tab === 'root'} onClick={() => { setTab('root'); resetFilters(); }}>
            词根词库
          </TabBtn>
          <TabBtn active={tab === 'surplus'} onClick={() => { setTab('surplus'); resetFilters(); }}>
            盈余词库
          </TabBtn>
          <TabBtn active={tab === 'exam'} onClick={() => { setTab('exam'); resetFilters(); }}>
            考试词书
          </TabBtn>
        </div>
      </div>

      <p className="mt-1 text-xs text-muted">
        {tab === 'root'
          ? 'App 内置词根词，卡片内联展示音标、释义、例句与词素拆解，按首字母分组浏览。'
          : tab === 'surplus'
            ? 'ECDICT 补充的常用词（App 未内置拆解），卡片内联展示音标、释义与词素拆解。'
            : '四级 / 考研 / 雅思 / 托福 等考试词书分类，卡片内联展示音标、释义与词素拆解。'}
      </p>

      {/* 考试词书：分类选择 */}
      {tab === 'exam' && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Object.keys(examBooks) as ExamCat[]).map((c) => (
            <button
              key={c}
              onClick={() => { setExamCat(c); resetFilters(); }}
              className={
                'rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
                (examCat === c ? 'bg-root text-white' : 'bg-surface-2 text-muted hover:text-text')
              }
            >
              {examBooks[c].name}（{examBooks[c].words.length}）
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLetter('');
            scrollTopRef.current = 0;
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            scheduleSave();
          }}
          placeholder={
            tab === 'root' ? '搜索词根词…' : tab === 'surplus' ? '搜索盈余词（如 app / trans）…' : `搜索${examBooks[examCat]?.name ?? '词书'}…`
          }
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-root"
        />
        {(q || letter) && (
          <button onClick={resetFilters} className="rounded-lg bg-surface-2 px-3 text-sm text-muted">清除</button>
        )}
      </div>

      {/* 字母索引导航（词根词库 / 盈余词库 / 考试词书 通用）：同一排，左右滑动 */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {ALPHABET.map((L) => (
          <button
            key={L}
            onClick={() => pickLetter(L)}
            className={
              'flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink font-display text-xs font-black transition-colors ' +
              (letter === L
                ? 'bg-accent text-onaccent'
                : 'bg-surface text-muted hover:bg-accent/20 hover:text-text')
            }
          >
            {L}
          </button>
        ))}
      </div>

      {/* 当前筛选结果数量：已显示 / 真实总数，配合卡片序号随时知道看到第几个 */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="tag-edit">
          {hasMore ? `${shown} / ${total} WORDS` : `${total} WORDS`}
        </span>
        <span className="tag-edit">
          {tab === 'exam' ? examBooks[examCat]?.name ?? '' : letter ? `字母 ${letter}` : '全部'}
        </span>
      </div>

      {/* 列表 */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          scrollTopRef.current = e.currentTarget.scrollTop;
          scheduleSave();
        }}
        className="mt-2 max-h-[28rem] overflow-y-auto pr-1"
      >
        {tab === 'root' ? (
          rootList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">没有匹配的单词，换个关键词试试。</p>
          ) : (
            <>
              {rootList.map((g) => (
                <div key={g.letter} className="mb-3">
                  <div className="sticky top-0 bg-surface py-1 font-display text-xs font-black tracking-widest text-ink">{g.letter}</div>
                  <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {g.items.map((w, i) => (
                      <RichWordCard
                        key={w.id}
                        no={g.base + i + 1}
                        word={w.word}
                        phonetic={w.phonetic}
                        lines={w.meanings.map((m) => `${m.pos} ${m.cn}`)}
                        examples={w.examples}
                        parts={w.parts}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {hasMore && (
                <LoadMoreBtn shown={shown} total={total} onClick={() => setLimit((n) => n + PAGE)} />
              )}
            </>
          )
        ) : tab === 'surplus' ? (
          surplusList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              {q || letter ? '没有匹配的盈余词。' : '输入关键词或点选上方字母，浏览 ECDICT 盈余词库。'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {surplusList.map((e, i) => (
                <RichWordCard
                  key={e.word}
                  no={i + 1}
                  word={e.word}
                  phonetic={e.ph}
                  lines={splitLines(e.tr)}
                  examples={[]}
                  parts={surplusSplits.get(e.word)}
                />
              ))}
              {hasMore && <LoadMoreBtn shown={shown} total={total} onClick={() => setLimit((n) => n + PAGE)} />}
            </div>
          )
        ) : examWords.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {q || letter ? '该词书没有匹配的单词。' : '该词书词量较大，输入关键词或点选上方字母开始浏览。'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {examWords.map((w, i) => {
              const ph = getEcdictPhonetic(w) ?? '';
              const tr = getEcdict(w) ?? '';
              const examples = (vocabExamples as Record<string, { en: string; cn: string }[]>)[w.toLowerCase()] ?? [];
              return (
                <RichWordCard
                  key={w}
                  no={i + 1}
                  word={w}
                  phonetic={ph}
                  lines={splitLines(tr)}
                  examples={examples}
                  parts={examSplits.get(w)}
                />
              );
            })}
            {hasMore && <LoadMoreBtn shown={shown} total={total} onClick={() => setLimit((n) => n + PAGE)} />}
          </div>
        )}
      </div>
    </Card>
  );
}

/** 把分组结果按 limit 截断（保留每组的 base，保证序号连续、不被截断打乱） */
function trimGroups<T extends { id: string }>(
  groups: { letter: string; items: T[]; base: number }[],
  limit: number,
): { letter: string; items: T[]; base: number }[] {
  const out: { letter: string; items: T[]; base: number }[] = [];
  for (const g of groups) {
    if (g.base >= limit) break;
    const take = limit - g.base;
    out.push(take >= g.items.length ? g : { ...g, items: g.items.slice(0, take) });
  }
  return out;
}

function LoadMoreBtn({
  shown,
  total,
  onClick,
}: {
  shown: number;
  total: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="col-span-full mt-1 w-full border-2 border-ink bg-surface-2 py-2 font-display text-xs font-bold tracking-tight text-text transition-colors hover:bg-accent/20"
    >
      加载更多 · 已显示 {shown} / 共 {total}
    </button>
  );
}

// 释义分行：兼容「真正换行」与源数据里的「字面量 \n」两种写法
function splitLines(tr: string): string[] {
  return tr
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}


// 盈余 / 考试词书 富卡片：内联展示音标 + 全部释义 + 例句 + 词素拆解，无需再点进页面
function RichWordCard({
  no,
  word,
  phonetic,
  lines,
  examples,
  parts,
}: {
  no?: number;
  word: string;
  phonetic?: string;
  lines: string[];
  examples: { en: string; cn: string }[];
  parts?: WordPart[];
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-3">
      <div className="flex items-baseline gap-2">
        {/* 淡序号：直接在列表里就知道这是本分类/本字母下的第几个词 */}
        {no != null && (
          <span className="w-7 shrink-0 font-mono text-[10px] leading-5 text-muted/70">
            {String(no).padStart(3, '0')}
          </span>
        )}
        <span className="text-base font-semibold text-text break-safe">{word}</span>
        {phonetic && <span className="font-mono text-[11px] text-accent-2">{phonetic}</span>}
        <SpeakButton text={word} label="" className="ml-auto self-center" />
      </div>
      <ul className="mt-1.5 space-y-0.5">
        {lines.slice(0, 5).map((l, i) => (
          <li key={i} className="text-xs text-text break-safe">{l}</li>
        ))}
        {lines.length > 5 && <li className="text-[11px] text-muted">…共 {lines.length} 条释义</li>}
      </ul>
      {examples[0] && (
        <div className="mt-1.5 rounded-lg bg-surface-2 p-2 text-[11px] text-muted">
          <div className="break-safe">{examples[0].en}</div>
          <div className="break-safe">{examples[0].cn}</div>
        </div>
      )}
      {parts && parts.length > 0 && (
        <div className="mt-2 border-t border-border/60 pt-2">
          <div className="mb-1 text-[11px] font-medium text-muted">词素拆解</div>
          <WordParts parts={parts} className="text-[11px]" />
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        'rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
        (active ? 'bg-root text-white' : 'bg-surface-2 text-muted hover:text-text')
      }
    >
      {children}
    </button>
  );
}
