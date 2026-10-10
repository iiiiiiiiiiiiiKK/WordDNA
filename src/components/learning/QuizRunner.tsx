import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SpeakButton } from '@/components/common/SpeakButton';
import { useLearningStore } from '@/store/useLearningStore';
import { getWordById, getFamilyWords } from '@/data';
import type { QuizQuestion, QuizKind } from '@/lib/quiz';

interface QuizRunnerProps {
  questions: QuizQuestion[];
  onExit: () => void;
}

/**
 * 主动回忆的方向标签：让「识别 / 反向回忆 / 词缀 / 语境 / 辨析」一目了然。
 * big=true 时题干文本短（词根、词、词缀），用大字号展示；
 * big=false 时题干为长句或辨析导语，用段落样式展示。
 */
const KIND_META: Record<QuizKind, { tag: string; big: boolean }> = {
  meaning: { tag: '识别 · 选释义', big: true },
  word: { tag: '回忆 · 选词形', big: false },
  affix: { tag: '词缀 · 选释义', big: true },
  context: { tag: '语境 · 选释义', big: false },
  distinguish: { tag: '辨析 · 挑词形', big: false },
};

/**
 * 按需测试（Quiz）
 * 四选一作答 → 即时反馈 → 结果写回 SRS（答对 good / 答错 again），
 * 由间隔重复决定下次什么时候再考你。
 */
export function QuizRunner({ questions, onExit }: QuizRunnerProps) {
  const rate = useLearningStore((s) => s.rate);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[i];

  // 答后给真实例句（elaborative feedback）：研究显示「对答案 + 看语境」比只告知对错更有效
  const feedbackExample = useMemo(() => {
    if (!q) return null;
    if (q.type === 'word') {
      const w = getWordById(q.itemId);
      return w?.examples?.[0] ? { ...w.examples[0], word: w.word } : null;
    }
    for (const w of getFamilyWords(q.itemId)) {
      if (w.examples?.[0]) return { ...w.examples[0], word: w.word };
    }
    return null;
  }, [q]);

  const choose = async (opt: string) => {
    if (picked || !q) return;
    setPicked(opt);
    const ok = opt === q.answer;
    if (ok) setCorrectCount((c) => c + 1);
    await rate(q.itemId, ok ? 'good' : 'again');
  };

  const nextQ = () => {
    setPicked(null);
    if (i + 1 >= questions.length) setDone(true);
    else setI(i + 1);
  };

  if (done) {
    const acc = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    return (
      <Card>
        <div className="text-center">
          <div className="tag-edit">QUIZ COMPLETE</div>
          <div className="mt-2 font-display text-4xl font-black text-text">{acc}%</div>
          <p className="mt-1 text-sm text-muted">
            {questions.length} 题 · 答对 {correctCount} 题
          </p>
          <p className="mt-2 text-xs text-muted">
            答错的已进入错题本，并会在更短的间隔后再考你一次。
          </p>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onExit}>
            继续滑动学习
          </Button>
        </div>
      </Card>
    );
  }

  if (!q) return null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="tag-edit">QUIZ · 按需测试</span>
        <span className="tag-edit">
          {i + 1} / {questions.length} · 答对 {correctCount}
        </span>
      </div>
      <div className="mb-4 h-1 w-full bg-border">
        <div
          className="h-1 bg-accent-2 transition-all duration-300"
          style={{ width: `${(i / questions.length) * 100}%` }}
        />
      </div>

      <Card key={q.itemId} className="animate-pop-in">
        <div className="flex items-center justify-between gap-2">
          <div className="tag-edit">{KIND_META[q.kind].tag}</div>
          {q.sub && <div className="font-mono text-[11px] text-muted">{q.sub}</div>}
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div
            className={
              KIND_META[q.kind].big
                ? 'word-huge text-[clamp(1.8rem,9vw,2.8rem)] text-text'
                : 'min-w-0 text-base leading-relaxed text-text break-safe'
            }
          >
            {q.prompt}
          </div>
          <SpeakButton text={q.prompt} className="mb-1 shrink-0" />
        </div>

        <div className="rule-thick mt-3" />

        <div className="mt-3 space-y-2">
          {q.options.map((opt) => {
            const isAnswer = opt === q.answer;
            const isPicked = opt === picked;
            let style = 'border-2 border-ink bg-surface text-text hover:bg-accent/20';
            if (picked) {
              if (isAnswer) style = 'border-2 border-ink bg-accent text-onaccent';
              else if (isPicked) style = 'border-2 border-ink bg-danger text-white';
              else style = 'border-2 border-border bg-surface text-muted';
            }
            return (
              <button
                key={opt}
                onClick={() => choose(opt)}
                disabled={picked !== null}
                className={
                  'w-full px-3 py-3 text-left text-sm font-medium transition-colors ' + style
                }
              >
                {opt}
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-3 border-t-2 border-ink pt-3">
            <p className="text-sm font-semibold text-text">
              {picked === q.answer ? '答对了 ✓' : '答错了 · 已记入错题'}
            </p>
            {!picked || picked !== q.answer ? (
              <p className="mt-1 text-xs text-muted">正确答案：{q.answer}</p>
            ) : null}

            {feedbackExample && (
              <div className="mt-2 border-2 border-ink bg-surface-2 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs leading-snug text-text break-safe">
                      {feedbackExample.en}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted break-safe">
                      {feedbackExample.cn}
                    </div>
                  </div>
                  <SpeakButton text={feedbackExample.en} />
                </div>
                <div className="mt-1.5 font-display text-[11px] font-bold tracking-tight text-accent-2">
                  — {feedbackExample.word}
                </div>
              </div>
            )}

            <Button block className="mt-3" onClick={nextQ}>
              {i + 1 >= questions.length ? '查看结果' : '下一题 →'}
            </Button>
          </div>
        )}
      </Card>

      <button onClick={onExit} className="mt-4 tag-edit block w-full text-center text-muted">
        退出测试，继续滑动学习
      </button>
    </div>
  );
}
