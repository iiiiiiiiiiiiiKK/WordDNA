// ============================================================
// 词库分层常量 + 学习计划常量
// ARCHITECTURE.md T02
// ============================================================
import type { ExamLevel, PlanMinutes } from '@/types/domain';

export const EXAM_LEVELS: ExamLevel[] = [
  'CET-4',
  'CET-6',
  '考研',
  'IELTS',
  'TOEFL',
  'GRE',
  'SAT',
  '日常',
];

export const PLAN_PRESETS: { minutes: PlanMinutes; label: string; newTarget: number; reviewTarget: number }[] = [
  { minutes: 10, label: '每日 10 分钟', newTarget: 5, reviewTarget: 10 },
  { minutes: 20, label: '每日 20 分钟', newTarget: 10, reviewTarget: 20 },
  { minutes: 30, label: '每日 30 分钟', newTarget: 15, reviewTarget: 30 },
];

export const DEFAULT_PLAN: PlanMinutes = 10;
export const DEFAULT_SPLIT_MODE: 'learn' | 'etymology' = 'learn';
