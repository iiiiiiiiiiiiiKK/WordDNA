// ============================================================
// 每日学习队列生成（新词根优先 + 到期复习）
// ARCHITECTURE.md §4.4
// ============================================================
import type { LearningState, PlanMinutes, StudyItem } from '@/types/domain';
import { isDue } from './srs';
import { getRoots, getWords } from '@/data';

export interface QueueResult {
  queue: StudyItem[];
  newCount: number;
  reviewCount: number;
}

export function buildDailyQueue(opts: {
  now: Date;
  plan: PlanMinutes;
  states: Record<string, LearningState>;
  seenNewIds?: string[];
}): QueueResult {
  const { now, plan, states, seenNewIds = [] } = opts;
  const { newTarget, reviewTarget } = planTargetsLocal(plan);
  const seen = new Set(seenNewIds);

  // 1) 复习项：已学习且到期
  const dueReviews: { id: string; dueAt: number }[] = [];
  for (const id of Object.keys(states)) {
    const st = states[id];
    if (st.status === 'new') continue;
    if (isDue(st, now)) dueReviews.push({ id, dueAt: Date.parse(st.dueAt) });
  }
  dueReviews.sort((a, b) => a.dueAt - b.dueAt);
  const reviewItems: StudyItem[] = dueReviews
    .slice(0, reviewTarget)
    .map((r) => ({ itemId: r.id, type: states[r.id].type, kind: 'review' }));

  // 2) 新项：Root 优先于 Word
  const rootIds = getRoots().map((r) => r.id);
  const wordIds = getWords().map((w) => w.id);

  const newRootIds = rootIds.filter((id) => !states[id] || states[id].status === 'new');
  const newWordIds = wordIds.filter((id) => !states[id] || states[id].status === 'new');

  const newList: string[] = [...newRootIds, ...newWordIds];

  let added = 0;
  const newItems: StudyItem[] = [];
  for (const id of newList) {
    if (added >= newTarget) break;
    if (seen.has(id)) continue;
    const id2 = id;
    const type = rootIds.includes(id2) ? 'root' : 'word';
    newItems.push({ itemId: id2, type, kind: 'new' });
    added++;
  }

  const queue = [...newItems, ...reviewItems];
  return { queue, newCount: newItems.length, reviewCount: reviewItems.length };
}

function planTargetsLocal(plan: PlanMinutes): { newTarget: number; reviewTarget: number } {
  switch (plan) {
    case 10:
      return { newTarget: 5, reviewTarget: 10 };
    case 20:
      return { newTarget: 10, reviewTarget: 20 };
    case 30:
      return { newTarget: 15, reviewTarget: 30 };
  }
}
