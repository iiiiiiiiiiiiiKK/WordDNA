import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { SpeakButton } from '@/components/common/SpeakButton';
import { EmptyState } from '@/components/common/EmptyState';
import { StudyCard } from '@/components/learning/StudyCard';
import { RatingBar } from '@/components/learning/RatingBar';
import { MultipleChoice } from '@/components/learning/MultipleChoice';
import { useLearningStore } from '@/store/useLearningStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getRootById, getWordById, getFamilyWords } from '@/data';
import { buildDailyQueue } from '@/lib/queue';
import { buildQuiz, type QuizQuestion, type QuizKind } from '@/lib/quiz';
import { ROUTES } from '@/lib/routes';
import type { LearnItemType, Rating, Root, StudyItem, Word } from '@/types/domain';

const KIND_LABEL: Record<QuizKind, string> = {
  meaning: '识别 · 选释义',
  word: '回忆 · 选词形',
  affix: '词缀 · 选释义',
  context: '语境 · 选释义',
  distinguish: '辨析 · 挑词形',
};

const TYPE_LABEL: Record<string, string> = { prefix: '前缀', root: '词根', suffix: '后缀' };
const PART_CLS: Record<string, string> = {
  prefix: 'border-prefix text-prefix',
  root: 'border-root text-root',
  suffix: 'border-suffix text-suffix',
};

/**
 * 每日计划引导式会话（Wave 3）
 * 保留 /study 的滑动流不动，这里新增一条「今天该学什么」的引导路线：
 *   理解（看词根/单词 + 词族）→ 拆解（看一个词的词素零件）→ 回忆（多方向主动回忆）→ 评分（写回 SRS）
 * 复用 buildDailyQueue（决定今天新学/复习配额）+ buildQuiz（多方向出题）+ 现成 RatingBar / MultipleChoice。
 */
export function DailyPlan() {
  const navigate = useNavigate();
  const states = useLearningStore((s) => s.states);
  const startSession = useLearningStore((s) => s.startSession);
  const rate = useLearningStore((s) => s.rate);
  const finishSession = useLearningStore((s) => s.finishSession);
  const plan = useSettingsStore((s) => s.settings.plan);

  const queue = useMemo(
    () => buildDailyQueue({ now: new Date(), plan, states }).queue,
    [states, plan],
  );

  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [rated, setRated] = useState(false);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  // 会话开始时把队列快照下来：评分会改写 states，不能让队列在会话中途重算导致错位
  const [sessionQueue, setSessionQueue] = useState<StudyItem[] | null>(null);

  const q = sessionQueue ?? queue;
  const item = q[idx];

  // 当前条目的「锚点」信息：root 用 root + 抽一个样本词拆；word 直接用该词
  const anchor = useMemo(() => {
    if (!item) return null;
    if (item.type === 'root') {
      const r = getRootById(item.itemId);
      if (!r) return null;
      const fam = getFamilyWords(r.id);
      const sample = fam.find((w) => w.parts.length >= 2) ?? fam[0] ?? null;
      return { kind: 'root' as const, root: r, family: fam, sample };
    }
    const w = getWordById(item.itemId);
    if (!w) return null;
    const root = w.rootIds.length ? getRootById(w.rootIds[0]) : undefined;
    return { kind: 'word' as const, word: w, root, sample: w.parts.length >= 2 ? w : null };
  }, [item]);

  // 当前条目的多方向题目（理解/拆解之后用来回忆）
  const questions = useMemo<QuizQuestion[]>(() => {
    if (!anchor) return [];
    if (anchor.kind === 'root') {
      const pool = [
        { itemId: anchor.root.id, type: 'root' as LearnItemType },
        ...anchor.family.slice(0, 3).map((w) => ({ itemId: w.id, type: 'word' as LearnItemType })),
      ];
      return buildQuiz(pool, 3);
    }
    return buildQuiz([{ itemId: anchor.word.id, type: 'word' as LearnItemType }], 3);
  }, [anchor]);

  const begin = () => {
    setSessionQueue(queue);
    startSession('plan', queue);
    setStarted(true);
  };

  const next = () => {
    setResults([]);
    setRated(false);
    if (idx + 1 >= q.length) {
      void finishSession();
      setFinished(true);
    } else {
      setIdx(idx + 1);
    }
  };

  const onRate = async (r: Rating) => {
    if (!item || rated) return;
    await rate(item.itemId, r);
    setRated(true);
  };

  // ── 空状态：今天没有新学也没有到期复习 ──
  if (q.length === 0) {
    return (
      <PageContainer>
        <StudyCard title="今日计划">
          <EmptyState
            icon="info"
            title="今天没有待学项"
            description="没有新词根要学，也没有到期复习。去自由滑动浏览，或回来随便看看。"
            action={
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.dashboard)}>
                  返回首页
                </Button>
                <Button className="flex-1" onClick={() => navigate(ROUTES.study)}>
                  自由滑动浏览
                </Button>
              </div>
            }
          />
        </StudyCard>
      </PageContainer>
    );
  }

  if (!started) {
    return (
      <PageContainer>
        <StudyCard title="今日计划">
          <p className="text-sm text-muted">
            已为你算出今天的配额：<span className="font-semibold text-text">{q.length}</span> 项
            （新学 {q.filter((x) => x.kind === 'new').length} · 复习{' '}
            {q.filter((x) => x.kind === 'review').length}）。
          </p>
          <p className="mt-2 text-xs text-muted">
            每次 5~20 分钟：先看结构、拆解词素，再用多方向主动回忆巩固，最后评分写回间隔重复。
          </p>
          <Button block className="mt-4" onClick={begin}>
            开始今日计划
            <Icon name="arrow-right" size={18} />
          </Button>
          <button
            onClick={() => navigate(ROUTES.study)}
            className="mt-2 block w-full text-center text-xs text-muted"
          >
            不想按计划？自由滑动浏览 →
          </button>
        </StudyCard>
      </PageContainer>
    );
  }

  if (finished) {
    return (
      <PageContainer>
        <StudyCard title="今日计划完成">
          <div className="text-center">
            <div className="tag-edit">PLAN DONE</div>
            <p className="mt-2 text-sm font-semibold text-text">
              今天过了 {q.length} 项（新学 {q.filter((x) => x.kind === 'new').length} · 复习{' '}
              {q.filter((x) => x.kind === 'review').length}）
            </p>
            <p className="mt-1 text-xs text-muted">进度已记入「我的」与间隔重复，明天会按遗忘曲线再提醒你。</p>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.dashboard)}>
              返回首页
            </Button>
            <Button className="flex-1" onClick={() => navigate(ROUTES.study)}>
              自由滑动浏览
            </Button>
          </div>
        </StudyCard>
      </PageContainer>
    );
  }

  if (!anchor) {
    return (
      <PageContainer>
        <EmptyState
          icon="alert"
          title="这一项数据缺失"
          description="该条目在词库里找不到对应记录，已跳过。"
          action={<Button onClick={next}>下一项</Button>}
        />
      </PageContainer>
    );
  }

  const total = q.length;
  const isNew = item.kind === 'new';

  return (
    <PageContainer>
      {/* 顶部进度 + 方向标识 */}
      <div className="mb-3 flex items-baseline justify-between">
        <span className="tag-edit">
          {isNew ? 'NEW' : 'REVIEW'} · {idx + 1} / {total}
        </span>
        <span className="tag-edit">{Math.round(((idx + (rated ? 1 : 0)) / total) * 100)}%</span>
      </div>
      <div className="mb-3 h-1 w-full bg-border">
        <div
          className="h-1 bg-accent-2 transition-all duration-300"
          style={{ width: `${((idx + (rated ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <StudyCard
        title={anchor.kind === 'root' ? `词根 ${anchor.root.root}` : `单词 ${anchor.word.word}`}
      >
        {/* ── 1. 理解 ── */}
        <div>
          <div className="tag-edit">① 理解</div>
          {anchor.kind === 'root' ? (
            <RootUnderstand root={anchor.root} family={anchor.family} />
          ) : (
            <WordUnderstand word={anchor.word} root={anchor.root} />
          )}
        </div>

        {/* ── 2. 拆解 ── */}
        {anchor.sample && (
          <div className="mt-4 border-t-2 border-ink pt-3">
            <div className="tag-edit">② 拆解 · 看零件</div>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              {anchor.sample.parts.map((p, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span
                    className={`rounded-lg border-2 bg-surface px-2.5 py-1.5 font-display text-base font-bold ${
                      PART_CLS[p.type] ?? 'border-ink text-text'
                    }`}
                  >
                    {p.text}
                  </span>
                  <span className="mt-1 font-mono text-[10px] text-muted">
                    {TYPE_LABEL[p.type] ?? p.type}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-xs text-muted">
                <span className="font-semibold text-text">{anchor.sample.word}</span> ·{' '}
                {anchor.sample.meanings[0]?.cn}
              </p>
              <SpeakButton text={anchor.sample.word} />
            </div>
          </div>
        )}

        {/* ── 3. 回忆（多方向主动回忆） ── */}
        {questions.length > 0 && (
          <div className="mt-4 border-t-2 border-ink pt-3">
            <div className="tag-edit">③ 回忆 · 主动回忆</div>
            <div className="mt-3 space-y-5">
              {questions.map((q, qi) => {
                const correctIndex = q.options.indexOf(q.answer);
                const answered = results[qi] !== null && results[qi] !== undefined;
                return (
                  <div key={qi}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="tag-edit">{KIND_LABEL[q.kind]}</div>
                      {q.sub && <div className="font-mono text-[11px] text-muted">{q.sub}</div>}
                    </div>
                    <div
                      className={
                        q.kind === 'meaning' || q.kind === 'affix'
                          ? 'mt-1 word-huge text-[clamp(1.6rem,8vw,2.4rem)] text-text'
                          : 'mt-1 text-base leading-relaxed text-text break-safe'
                      }
                    >
                      {q.prompt}
                    </div>
                    <div className="mt-2">
                      <MultipleChoice
                        prompt=""
                        options={q.options}
                        correctIndex={correctIndex}
                        onResult={(ok) =>
                          setResults((prev) => {
                            const nextR = prev.slice();
                            nextR[qi] = ok;
                            return nextR;
                          })
                        }
                      />
                    </div>
                    {answered && (
                      <div className="mt-2 border-2 border-ink bg-surface-2 p-2.5">
                        <p className="text-sm font-semibold text-text">
                          {results[qi] ? '答对了 ✓' : '答错了 · 已记入错题'}
                        </p>
                        {!results[qi] && (
                          <p className="mt-0.5 text-xs text-muted">正确答案：{q.answer}</p>
                        )}
                        {q.feedbackExample && (
                          <div className="mt-2">
                            <div className="text-xs leading-snug text-text break-safe">
                              {q.feedbackExample.en}
                            </div>
                            <div className="mt-0.5 text-[11px] text-muted break-safe">
                              {q.feedbackExample.cn}
                            </div>
                            <div className="mt-1 font-display text-[11px] font-bold tracking-tight text-accent-2">
                              — {q.feedbackExample.word}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 4. 评分（写回 SRS） ── */}
        <div className="mt-4 border-t-2 border-ink pt-3">
          <div className="tag-edit">④ 评分 · 记下来</div>
          <p className="mt-1 text-xs text-muted">凭感觉选：这词根/单词你掌握得怎么样？</p>
          <div className="mt-2">
            <RatingBar onRate={onRate} disabled={rated} />
          </div>
          {rated && (
            <Button block className="mt-3" onClick={next}>
              {idx + 1 >= total ? '完成今日计划' : '下一项 →'}
            </Button>
          )}
          {!rated && (
            <button
              onClick={next}
              className="mt-3 block w-full text-center text-xs text-muted"
            >
              暂不评分，跳过这一项 →
            </button>
          )}
        </div>
      </StudyCard>
    </PageContainer>
  );
}

function RootUnderstand({ root, family }: { root: Root; family: ReturnType<typeof getFamilyWords> }) {
  return (
    <div className="mt-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="word-huge text-[clamp(1.8rem,9vw,2.6rem)] text-text">{root.root}</div>
          <div className="mt-1 font-mono text-sm text-accent-2">{root.meaning}</div>
        </div>
        <SpeakButton text={root.root} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {root.language} · {root.description}
      </p>
      {family.length > 0 && (
        <ul className="mt-3 border-t-2 border-ink">
          {family.slice(0, 6).map((w) => (
            <li key={w.id} className="flex items-baseline gap-2 border-b border-border/50 py-1.5">
              <span className="font-display text-sm font-bold tracking-tight text-text">{w.word}</span>
              <span className="ml-auto truncate text-xs text-muted">{w.meanings[0]?.cn ?? ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WordUnderstand({ word, root }: { word: Word; root?: Root }) {
  return (
    <div className="mt-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="word-huge text-[clamp(1.8rem,9vw,2.6rem)] text-text">{word.word}</div>
          <div className="mt-1 font-mono text-xs text-accent-2">{word.phonetic}</div>
        </div>
        <SpeakButton text={word.word} />
      </div>
      <p className="mt-1 text-sm text-text">{word.meanings.map((m) => m.cn).join('；')}</p>
      {root && (
        <p className="mt-1 text-xs text-muted">
          含词根 <span className="font-semibold text-root">{root.root}</span>（{root.meaning}）
        </p>
      )}
      {word.examples[0] && (
        <div className="mt-2 border-2 border-ink bg-surface-2 p-2.5">
          <div className="text-xs leading-snug text-text break-safe">{word.examples[0].en}</div>
          <div className="mt-0.5 text-[11px] text-muted break-safe">{word.examples[0].cn}</div>
        </div>
      )}
    </div>
  );
}
