import { useCallback, useRef, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { LearnFeed } from '@/components/learning/LearnFeed';
import { QuizRunner } from '@/components/learning/QuizRunner';
import { useLearningStore } from '@/store/useLearningStore';
import { buildQuiz, type QuizQuestion } from '@/lib/quiz';
import { getFamilyWords } from '@/data';
import type { LearnItemType } from '@/types/domain';

type Mode = 'feed' | 'quiz';

/**
 * 学习页 = 滑动浏览（吸收）+ 按需测试（检验）
 *
 * 之前每张卡都强制「我记住了 → 开始测试」，刚看完立刻考，记忆检验失去意义。
 * 现在：默认是不中断的滑动流，一张卡带出一个词族；想检验时再点「开始测试」，
 * 题目只从「已浏览过」的内容里出，并排除最近刚看过的几张，按「最久没复习」优先。
 */
export function Study() {
  const states = useLearningStore((s) => s.states);
  const [mode, setMode] = useState<Mode>('feed');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  // 本次会话浏览过的顺序，用于测试时排除「刚看完」的内容
  const viewed = useRef<string[]>([]);

  const handleView = useCallback((id: string) => {
    viewed.current.push(id);
  }, []);

  const startQuiz = () => {
    const now = Date.now();
    // 排除最近 3 张——避免拿刚还在屏幕上的内容来考
    const excluded = new Set(viewed.current.slice(-3));

    const pool = Object.values(states)
      .filter((s) => s.status !== 'new')
      .filter((s) => !excluded.has(s.itemId))
      .sort((a, b) => {
        // 到期的优先，其次「最久没复习」优先（最容易忘的先考）
        const aDue = Date.parse(a.dueAt) <= now ? 0 : 1;
        const bDue = Date.parse(b.dueAt) <= now ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        const at = Date.parse(a.lastReviewedAt ?? a.createdAt);
        const bt = Date.parse(b.lastReviewedAt ?? b.createdAt);
        return at - bt;
      })
      .map((s) => ({ itemId: s.itemId, type: s.type }));

    // 学词根最终是为了认单词：把已学词根的部分家族词也纳入题库，
    // 否则只练「词根释义」，真实单词永远没被检验过。
    const expanded: { itemId: string; type: LearnItemType }[] = [];
    for (const it of pool) {
      expanded.push(it);
      if (it.type === 'root') {
        for (const w of getFamilyWords(it.itemId).slice(0, 2)) {
          expanded.push({ itemId: w.id, type: 'word' });
        }
      }
    }
    const seen = new Set<string>();
    const deduped: { itemId: string; type: LearnItemType }[] = [];
    for (const x of expanded) {
      if (seen.has(x.itemId)) continue;
      seen.add(x.itemId);
      deduped.push(x);
    }

    setQuestions(buildQuiz(deduped, 12));
    setMode('quiz');
  };

  if (mode === 'quiz') {
    if (questions.length === 0) {
      return (
        <PageContainer>
          <EmptyState
            icon="info"
            title="先多看几张再来测试"
            description="刚浏览过的几张先不考你。再滑动浏览一些词根，测试才真正检验记忆。"
            action={<Button onClick={() => setMode('feed')}>继续滑动学习</Button>}
          />
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <QuizRunner questions={questions} onExit={() => setMode('feed')} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <LearnFeed onStartQuiz={startQuiz} onView={handleView} />
    </PageContainer>
  );
}
