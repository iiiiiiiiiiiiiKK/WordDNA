// ============================================================
// SRS 间隔重复（纯函数，无副作用）
// ARCHITECTURE.md §5
// ============================================================
import type { LearningState, LearnItemType, Rating, SrsStatus } from '@/types/domain';
import { clamp } from './utils';

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const MASTER_REPS = 4;
const MASTER_MIN_INTERVAL_DAYS = 30;

// 间隔阶梯：10(分钟) + 1/3/7/14/30/90(天)
export const STEPS = [10, 1, 3, 7, 14, 30, 90];

// 首次评分间隔（对齐 PRD：again 10m / hard 1d / good 3d / easy 7d）
const FIRST_INTERVAL: Record<Rating, [number, 'minute' | 'day']> = {
  again: [STEPS[0], 'minute'],
  hard: [STEPS[1], 'day'],
  good: [STEPS[2], 'day'],
  easy: [STEPS[3], 'day'],
};

export function createInitialState(itemId: string, type: LearnItemType): LearningState {
  const now = new Date().toISOString();
  return {
    itemId,
    type,
    status: 'new',
    ease: DEFAULT_EASE,
    interval: 0,
    intervalUnit: 'minute',
    dueAt: now,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: null,
    createdAt: now,
  };
}

function toDays(s: LearningState): number {
  if (s.intervalUnit === 'minute') return 0;
  return s.interval;
}

// 找下一个更大档位索引（跳过 STEPS[0]=10min）
function nextStepIndex(currentDays: number): number {
  for (let i = 1; i < STEPS.length; i++) {
    if (currentDays < STEPS[i]) return i;
  }
  return STEPS.length - 1;
}

function duration(interval: number, unit: 'minute' | 'day'): number {
  // 返回毫秒
  return unit === 'minute' ? interval * 60_000 : interval * 86_400_000;
}

export function applyRating(s: LearningState, rating: Rating, now: Date): LearningState {
  const ns: LearningState = { ...s };
  const isNew = ns.status === 'new';

  if (isNew) {
    ns.status = 'learning';
    ns.repetitions = 0;
  }

  switch (rating) {
    case 'again': {
      ns.lapses += 1;
      ns.repetitions = 0;
      ns.ease = clamp(ns.ease - 0.2, MIN_EASE, MAX_EASE);
      ns.interval = FIRST_INTERVAL.again[0];
      ns.intervalUnit = FIRST_INTERVAL.again[1];
      ns.status = 'learning';
      break;
    }
    case 'hard': {
      ns.ease = clamp(ns.ease - 0.15, MIN_EASE, MAX_EASE);
      if (isNew) {
        ns.interval = FIRST_INTERVAL.hard[0];
        ns.intervalUnit = FIRST_INTERVAL.hard[1];
      } else {
        const curDays = toDays(ns);
        const idx = nextStepIndex(curDays);
        const newDays = Math.max(curDays, STEPS[idx]) * 1.2;
        ns.interval = Math.round(newDays);
        ns.intervalUnit = 'day';
      }
      ns.status = ns.status === 'mastered' ? 'review' : 'learning';
      break;
    }
    case 'good': {
      if (isNew) {
        ns.interval = FIRST_INTERVAL.good[0];
        ns.intervalUnit = FIRST_INTERVAL.good[1];
      } else {
        const curDays = toDays(ns);
        const idx = nextStepIndex(curDays);
        const base = STEPS[idx];
        const newDays = base * ns.ease;
        ns.interval = Math.round(clamp(newDays, 1, 3650));
        ns.intervalUnit = 'day';
      }
      ns.repetitions += 1;
      ns.status = ns.repetitions >= 2 ? 'review' : 'learning';
      break;
    }
    case 'easy': {
      ns.ease = clamp(ns.ease + 0.1, MIN_EASE, MAX_EASE);
      if (isNew) {
        ns.interval = FIRST_INTERVAL.easy[0];
        ns.intervalUnit = FIRST_INTERVAL.easy[1];
      } else {
        const curDays = toDays(ns);
        const idx = nextStepIndex(curDays);
        const base = STEPS[idx];
        const newDays = base * ns.ease * 1.3;
        ns.interval = Math.round(clamp(newDays, 1, 3650));
        ns.intervalUnit = 'day';
      }
      ns.repetitions += 1;
      ns.status = ns.repetitions >= 2 ? 'review' : 'learning';
      break;
    }
  }

  // mastered 判定
  if (ns.repetitions >= MASTER_REPS && toDays(ns) >= MASTER_MIN_INTERVAL_DAYS) {
    ns.status = 'mastered';
  }

  const due = new Date(now.getTime() + duration(ns.interval, ns.intervalUnit));
  ns.dueAt = due.toISOString();
  ns.lastReviewedAt = now.toISOString();
  return ns;
}

export function isDue(s: LearningState, now: Date): boolean {
  return Date.parse(s.dueAt) <= now.getTime();
}

export function statusWeight(s: SrsStatus): number {
  switch (s) {
    case 'mastered':
      return 1;
    case 'review':
      return 0.7;
    case 'learning':
      return 0.4;
    case 'new':
      return 0;
  }
}
