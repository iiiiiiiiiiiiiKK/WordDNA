// ============================================================
// 通用工具函数
// ============================================================
import type { PlanMinutes } from '@/types/domain';

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    (out[k] ||= []).push(item);
  }
  return out;
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// 编辑距离（用于拆词建议）
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function planTargets(plan: PlanMinutes): { newTarget: number; reviewTarget: number } {
  switch (plan) {
    case 10:
      return { newTarget: 5, reviewTarget: 10 };
    case 20:
      return { newTarget: 10, reviewTarget: 20 };
    case 30:
      return { newTarget: 15, reviewTarget: 30 };
  }
}

// 间隔人类可读
export function humanInterval(interval: number, unit: 'minute' | 'day'): string {
  if (unit === 'minute') return `${interval} 分钟`;
  if (interval >= 365) return `${Math.round(interval / 365)} 年`;
  if (interval >= 30) return `${Math.round(interval / 30)} 个月`;
  return `${interval} 天`;
}

export function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(' ');
}
