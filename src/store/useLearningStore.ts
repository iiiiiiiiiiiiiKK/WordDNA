// ============================================================
// 学习状态 store（SRS 调度 + 会话）
// ARCHITECTURE.md §3.2
// ============================================================
import { create } from 'zustand';
import type { LearningState, StudyItem, StudySession, Rating, LearnItemType } from '@/types/domain';
import { db } from '@/lib/storage/db';
import { createInitialState, applyRating } from '@/lib/srs';
import { buildDailyQueue } from '@/lib/queue';
import { useSettingsStore } from './useSettingsStore';
import { useCollectionStore } from './useCollectionStore';
import { uid, todayKey } from '@/lib/utils';

interface LearningStore {
  states: Record<string, LearningState>;
  session: StudySession | null;
  queue: StudyItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  getState: (itemId: string) => LearningState | undefined;
  buildQueue: (now?: Date) => StudyItem[];
  startSession: (mode: StudySession['mode'], queue?: StudyItem[]) => void;
  rate: (itemId: string, rating: Rating) => Promise<void>;
  next: () => void;
  requeue: (itemId: string) => void;
  finishSession: () => Promise<void>;
  markMastered: (itemId: string) => Promise<void>;
  // 浏览（滑动学习）时调用：标记为「已接触」，进入复习池，但不立刻要求测试
  markSeen: (itemId: string, type: LearnItemType) => Promise<void>;
  // 滑动流当前停留的词根：从单词详情返回时用它复位，避免被弹到别的词
  lastFeedRootId: string | null;
  setLastFeedRootId: (id: string) => void;
  // 「学习这个」的意图：点「学习该词根 / 学习（单词）」时把目标放进来，
  // 进入 /study 后由滑动流消费一次并清空。以前只 startSession，而滑动流完全不看 session，
  // 于是无论点哪个词根都停在上次那个（默认是词族最大的 un）——看起来就像永远跳到 un。
  focusItemId: string | null;
  setFocusItem: (id: string | null) => void;
  reset: () => Promise<void>;
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  states: {},
  session: null,
  queue: [],
  hydrated: false,
  lastFeedRootId: null,
  focusItemId: null,

  setLastFeedRootId(id) {
    if (get().lastFeedRootId !== id) set({ lastFeedRootId: id });
  },

  setFocusItem(id) {
    set({ focusItemId: id });
  },

  async hydrate() {
    const all = await db.getAll<LearningState>('learningState');
    const states: Record<string, LearningState> = {};
    for (const s of all) states[s.itemId] = s;
    set({ states, hydrated: true });
  },

  getState(itemId) {
    return get().states[itemId];
  },

  buildQueue(now = new Date()) {
    const { states } = get();
    const plan = useSettingsStore.getState().settings.plan;
    const { queue } = buildDailyQueue({ now, plan, states });
    set({ queue });
    return queue;
  },

  startSession(mode, queueArg) {
    const queue = queueArg ?? get().queue;
    const session: StudySession = {
      id: uid('sess'),
      mode,
      queue,
      cursor: 0,
      startedAt: new Date().toISOString(),
      correctCount: 0,
      totalCount: 0,
      finishedAt: null,
    };
    set({ session });
  },

  async rate(itemId, rating) {
    const states = { ...get().states };
    const prev = states[itemId] ?? createInitialState(itemId, inferType(itemId));
    const updated = applyRating(prev, rating, new Date());
    states[itemId] = updated;
    set({ states });
    await db.put('learningState', itemId, updated);

    const session = get().session;
    if (session) {
      const total = session.totalCount + 1;
      const correct = rating !== 'again' ? session.correctCount + 1 : session.correctCount;
      set({ session: { ...session, totalCount: total, correctCount: correct } });
    }

    if (rating === 'again') {
      const t = prev.type;
      await useCollectionStore.getState().recordMistake(itemId, t);
    }
  },

  next() {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, cursor: Math.min(session.cursor + 1, session.queue.length) } });
  },

  // 把某一项重新放回队列尾部，本轮内再次出现（用于「重来」后马上再考一次）
  requeue(itemId) {
    const session = get().session;
    if (!session) return;
    const item = session.queue.find((q) => q.itemId === itemId);
    if (!item) return;
    const queue = [...session.queue, { ...item, kind: 'review' as const }];
    set({ session: { ...session, queue } });
  },

  async finishSession() {
    const session = get().session;
    if (!session) return;
    const finished: StudySession = { ...session, finishedAt: new Date().toISOString() };
    set({ session: finished });
    const newLearned = session.queue.filter((i) => i.kind === 'new').length;
    const reviewed = session.queue.filter((i) => i.kind === 'review').length;
    await useSettingsStore.getState().logDay({
      date: todayKey(),
      newLearned,
      reviewed,
      correct: session.correctCount,
      total: session.totalCount,
    });
  },

  async markMastered(itemId) {
    const states = { ...get().states };
    const prev = states[itemId] ?? createInitialState(itemId, inferType(itemId));
    const mastered: LearningState = { ...prev, status: 'mastered', repetitions: 4, interval: 90, intervalUnit: 'day' };
    states[itemId] = mastered;
    set({ states });
    await db.put('learningState', itemId, mastered);
  },

  // 滑动浏览一张词卡 = 已接触该词根/单词：
  //  · 进入复习池（之后才可能被「开始测试」抽到），但 10 分钟后才到期，避免刚看就考
  //  · 计入今日学习数，保证首页连续学习与今日进度有反馈
  async markSeen(itemId, type) {
    const states = { ...get().states };
    const prev = states[itemId];
    // 已经学过的不重复计入（保留原有 lastReviewedAt，测试时按「最久没复习」优先）
    if (prev && prev.status !== 'new') return;

    const now = new Date();
    const base = prev ?? createInitialState(itemId, type);
    const updated: LearningState = {
      ...base,
      status: 'learning',
      interval: 10,
      intervalUnit: 'minute',
      dueAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
      lastReviewedAt: now.toISOString(),
    };
    states[itemId] = updated;
    set({ states });
    await db.put('learningState', itemId, updated);

    const date = todayKey();
    const cur = useSettingsStore.getState().dailyLogs.find((l) => l.date === date);
    await useSettingsStore.getState().logDay({
      date,
      newLearned: (cur?.newLearned ?? 0) + 1,
      total: (cur?.total ?? 0) + 1,
    });
  },

  async reset() {
    await db.clear('learningState');
    set({ states: {}, session: null, queue: [] });
  },
}));

function inferType(itemId: string): LearnItemType {
  return itemId.startsWith('r-') ? 'root' : 'word';
}
