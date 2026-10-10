import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SpeakButton } from '@/components/common/SpeakButton';
import { getRoots, getFamilyWords, getWordById } from '@/data';
import { useLearningStore } from '@/store/useLearningStore';
import { ROUTES } from '@/lib/routes';

/** 音标统一成 /…/ 形式，没加斜杠的源数据补上，读起来更像词典 */
function fmtPhonetic(p: string): string {
  const t = p.trim();
  if (!t) return '';
  return t.startsWith('/') || t.endsWith('/') ? t : `/${t}/`;
}

interface LearnFeedProps {
  onStartQuiz: () => void;
  /** 上报当前浏览的词根 id，供「开始测试」排除刚看过的内容 */
  onView?: (itemId: string) => void;
}

/**
 * 滑动学习流（Learn Feed）
 * - 一张卡 = 一个词根/前缀 + 它的整个词族，滑动即可连续吸收，不强制测试。
 * - 支持手指左右滑、左右按钮、键盘方向键。
 * - 浏览过的卡片自动标记为「已接触」，之后才会进入「开始测试」的题库。
 */
export function LearnFeed({ onStartQuiz, onView }: LearnFeedProps) {
  const navigate = useNavigate();
  const states = useLearningStore((s) => s.states);
  const markSeen = useLearningStore((s) => s.markSeen);
  const lastFeedRootId = useLearningStore((s) => s.lastFeedRootId);
  const setLastFeedRootId = useLearningStore((s) => s.setLastFeedRootId);

  // 牌堆：大家族在前（一张卡能学到更多单词）
  const deck = useMemo(
    () => [...getRoots()].sort((a, b) => b.words.length - a.words.length),
    [],
  );

  // 「学习这个」的意图：从词根页 / 单词页点「学习」进来时，直接停在这个词根上。
  //   - 目标是词根 → 就用它
  //   - 目标是单词 → 用它所属的第一个真实词根（顺便记下该单词，进卡片后高亮并滚动到它）
  const focusItemId = useLearningStore((s) => s.focusItemId);
  const setFocusItem = useLearningStore((s) => s.setFocusItem);
  const focus = useMemo(() => {
    if (!focusItemId) return undefined;
    if (focusItemId.startsWith('r-')) {
      const at = deck.findIndex((r) => r.id === focusItemId);
      return at >= 0 ? { index: at, wordId: undefined as string | undefined } : undefined;
    }
    const w = getWordById(focusItemId);
    if (w) {
      // ① 先按单词自带的 rootIds 找
      for (const rid of w.rootIds) {
        const at = deck.findIndex((r) => r.id === rid);
        if (at >= 0) return { index: at, wordId: w.id };
      }
      // ② 你刚在看的那张卡里有这个词 → 回到它（从 un 的家族词点进 unreal，就该回 un）
      if (lastFeedRootId) {
        const ctx = deck.find((r) => r.id === lastFeedRootId);
        if (ctx?.words.includes(w.id)) {
          return { index: deck.findIndex((r) => r.id === ctx.id), wordId: w.id };
        }
      }
      // ③ 兜底：单词的 rootIds 里有大量词根表中查不到的 id（766 个引用里 583 个无效），
      //    这时反查「哪个词根的家族词里包含这个单词」——unequal 属于 un 就是这种情况。
      //    少了这一步，从首页 TODAY'S ROOT 点进 unequal 再「学这个词族」会跳到别的词根。
      const owner = getRoots().find((r) => r.words.includes(w.id));
      if (owner) {
        const at = deck.findIndex((r) => r.id === owner.id);
        if (at >= 0) return { index: at, wordId: w.id };
      }
    }
    return undefined;
  }, [focusItemId, deck, lastFeedRootId]);

  // 起始位置：① 本次「学习这个」的目标 → ② 上次停留的词根（从单词/词族页返回不跳位）
  // → ③ 第一个还没学过的词根
  const [index, setIndex] = useState(() => {
    if (focus) return focus.index;
    if (lastFeedRootId) {
      const at = deck.findIndex((r) => r.id === lastFeedRootId);
      if (at >= 0) return at;
    }
    const i = deck.findIndex((r) => {
      const s = states[r.id];
      return !s || s.status === 'new';
    });
    return i >= 0 ? i : 0;
  });

  // 意图消费一次即清空，避免以后每次进学习页都被拉回同一个词根
  useEffect(() => {
    if (focusItemId) setFocusItem(null);
  }, [focusItemId, setFocusItem]);

  // 从单词点进来的那个词：在家族词列表里高亮 + 滚动到可见处
  const [focusWord] = useState<string | undefined>(() => focus?.wordId);
  const focusWordRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (focusWord && focusWordRef.current) {
      focusWordRef.current.scrollIntoView({ block: 'center' });
    }
  }, [focusWord, index]);
  const [dir, setDir] = useState<1 | -1>(1);
  // 是否正在拖动进度条（拖动途中不把路过的词根记成已学）
  const [scrubbing, setScrubbing] = useState(false);

  const root = deck[index];
  const family = useMemo(() => (root ? getFamilyWords(root.id) : []), [root]);

  // 例句：从本词族的单词里挑一个自带例句的——脱离语境背单词留存率很低，
  // 给成年人一个真实例句，才知道这个词在句子里怎么用。
  const exampleWord = useMemo(() => family.find((w) => w.examples?.[0]), [family]);
  const example = exampleWord?.examples?.[0];

  // 浏览即学习：标记为已接触（已学过的不重复计数）
  // 拖动滑块途中不标记——否则从 exo 拉回 un 会把路过的上百个词根全记成「已学」
  useEffect(() => {
    if (!root || scrubbing) return;
    void markSeen(root.id, 'root');
    onView?.(root.id);
    // 记住当前位置：返回本页时用它复位，避免被「第一个未学」逻辑弹到别的词
    setLastFeedRootId(root.id);
  }, [root, scrubbing, markSeen, onView, setLastFeedRootId]);

  const go = (delta: number) => {
    setDir(delta >= 0 ? 1 : -1);
    setIndex((i) => Math.min(deck.length - 1, Math.max(0, i + delta)));
  };

  // 键盘方向键（桌面）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.length]);

  // 手指左右滑动
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
  };

  if (!root) return null;

  const seenCount = deck.filter((r) => {
    const s = states[r.id];
    return s && s.status !== 'new';
  }).length;

  // 到期复习数：提醒「该回头巩固旧的了」，别只顾着往前刷新卡
  const dueCount = Object.values(states).filter(
    (s) => s.status !== 'new' && Date.parse(s.dueAt) <= Date.now(),
  ).length;

  return (
    <div>
      {/* 进度条 */}
      <div className="mb-3 flex items-baseline justify-between">
        <span className="tag-edit">BROWSE · 滑动学习</span>
        <span className="tag-edit">
          {index + 1} / {deck.length} · 已学 {seenCount}
        </span>
      </div>
      {/* 进度条改成可拖动滑块：274 张卡靠「上一张/下一张」一张张翻太慢，
          从 exo 回到 un 得点几十次，现在直接拉到任意位置。 */}
      <input
        type="range"
        min={0}
        max={Math.max(0, deck.length - 1)}
        value={index}
        onChange={(e) => {
          const v = Number(e.target.value);
          setDir(v >= index ? 1 : -1);
          setIndex(v);
        }}
        onPointerDown={() => setScrubbing(true)}
        onPointerUp={() => setScrubbing(false)}
        onPointerCancel={() => setScrubbing(false)}
        onBlur={() => setScrubbing(false)}
        aria-label="拖动跳转到任意词根"
        className="mb-2 h-6 w-full cursor-pointer"
        style={{ accentColor: 'var(--accent-2)' }}
      />
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <span className="tag-edit truncate">NOW · {root?.root ?? '—'}</span>
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="tag-edit">拖动跳转</span>
          {index > 0 && (
            <button
              onClick={() => {
                setDir(-1);
                setIndex(0);
              }}
              className="tag-edit border-b-2 border-ink text-ink hover:text-accent-2"
            >
              ⤒ 首张
            </button>
          )}
        </div>
      </div>

      {/* 卡片：可左右滑动 */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Card
          key={root.id}
          className={dir === 1 ? 'animate-slide-up' : 'animate-fade-in'}
        >
          <div className="flex items-baseline justify-between">
            <span className="tag-edit">{root.language || 'ROOT'}</span>
            <span className="tag-edit">FAMILY · {family.length}</span>
          </div>

          {/* 巨型词根 + 发音 */}
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="word-huge text-[clamp(2.4rem,12vw,3.6rem)] text-text">
              {root.root}
            </div>
            <SpeakButton text={root.root} className="mb-1" />
          </div>
          <div className="mt-1 font-mono text-base text-accent-2">{root.meaning}</div>

          {root.description && (
            <p className="mt-2 text-xs leading-relaxed text-muted">{root.description}</p>
          )}

          {/* 词族：一个词根带出一批单词 */}
          {family.length > 0 && (
            <>
              <div className="rule-thick mt-3" />
              {/* 家族词：行高压紧后默认露出 8 行，更多则上下滑动（全部渲染，不会丢失）。
                  每行 = 单词 + 音标 + 释义，字号与行高都压紧，不挤占底部例句空间。 */}
              <div className="mt-2 max-h-52 overflow-y-auto pr-1">
                <ol>
                  {family.map((w, i) => (
                    <li
                      key={w.id}
                      ref={w.id === focusWord ? focusWordRef : undefined}
                      className={
                        'flex items-baseline gap-1.5 border-b border-border/40 py-[3px] ' +
                        (w.id === focusWord ? 'bg-accent/25' : '')
                      }
                    >
                      <span className="tag-edit w-5 shrink-0 text-[9px] leading-4">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => navigate(ROUTES.wordDetail(w.id))}
                        className="flex min-w-0 flex-1 items-baseline gap-1.5 text-left"
                      >
                        <span className="shrink-0 font-display text-xs font-bold leading-4 tracking-tight text-text">
                          {w.word}
                        </span>
                        {/* 音标：不点进去也知道怎么读 */}
                        {w.phonetic && (
                          <span className="shrink-0 font-mono text-[10px] leading-4 text-accent-2">
                            {fmtPhonetic(w.phonetic)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-[11px] leading-4 text-muted">
                          {w.meanings[0]?.cn ?? ''}
                        </span>
                      </button>
                      {/* 每个家族词都能直接点读：不用进详情页才知道怎么念。
                          「发音按钮」是 <li> 的直接子元素（不嵌套在跳转按钮里），
                          所以点喇叭只朗读，不会误触发跳转。 */}
                      <SpeakButton
                        text={w.word}
                        label=""
                        className="self-center !border-0 !px-1 !py-0.5 hover:!bg-transparent"
                      />
                    </li>
                  ))}
                </ol>
              </div>
              {family.length > 8 && (
                <button
                  onClick={() => navigate(ROUTES.rootFamily(root.id))}
                  className="mt-2 tag-edit border-b-2 border-ink text-ink hover:text-accent-2"
                >
                  查看全部 {family.length} 个家族词 ↗
                </button>
              )}

              {/* 真实例句：把词根落回实际用法 */}
              {example && exampleWord && (
                <div className="mt-3 border-2 border-ink bg-surface-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-snug text-text break-safe">
                        {example.en}
                      </div>
                      <div className="mt-1 text-xs text-muted break-safe">{example.cn}</div>
                    </div>
                    <SpeakButton text={example.en} />
                  </div>
                  <div className="mt-2 font-display text-xs font-bold tracking-tight text-accent-2">
                    — {exampleWord.word}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* 操作区 */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          size="md"
          variant="outline"
          className="flex-1"
          onClick={() => go(-1)}
          disabled={index === 0}
        >
          ← 上一张
        </Button>
        <Button size="md" variant="outline" className="flex-1" onClick={() => go(1)}>
          下一张 →
        </Button>
      </div>

      <Button size="lg" block className="mt-3" onClick={onStartQuiz}>
        开始测试{dueCount > 0 ? `（${dueCount} 项到期）` : ''}
      </Button>

      <p className="mt-3 text-center text-xs text-muted">
        左右滑动卡片即可连续学习；想检验记忆时再点「开始测试」——
        只考你浏览过的内容，不会拿刚看的那一题来考你。
      </p>
    </div>
  );
}
