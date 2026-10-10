// ============================================================
// 设置 / 每日日志 store
// ARCHITECTURE.md §3.2
// ============================================================
import { create } from 'zustand';
import type { Settings, DailyLog, PlanMinutes, ThemeMode } from '@/types/domain';
import { db } from '@/lib/storage/db';
import { exportData, importData } from '@/lib/storage/migrate';
import { planTargets, todayKey, clamp } from '@/lib/utils';
import { applyTheme, resolveTheme, setStoredThemeMode } from '@/lib/theme';

const DEFAULT_SETTINGS: Settings = {
  plan: 10,
  theme: 'system',
  onboardingDone: false,
  dailyNewTarget: 5,
  dailyReviewTarget: 10,
  splitMode: 'learn',
};

interface SettingsStore {
  settings: Settings;
  dailyLogs: DailyLog[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPlan: (p: PlanMinutes) => Promise<void>;
  setTheme: (t: ThemeMode) => Promise<void>;
  setSplitMode: (m: Settings['splitMode']) => Promise<void>;
  completeOnboarding: (p: PlanMinutes) => Promise<void>;
  logDay: (entry: Partial<DailyLog>) => Promise<void>;
  getStreak: (today?: Date) => number;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  dailyLogs: [],
  hydrated: false,

  async hydrate() {
    const stored = await db.get<Settings>('settings', 'app');
    const logs = await db.getAll<DailyLog>('dailyLogs');
    set({
      settings: stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS,
      dailyLogs: logs,
      hydrated: true,
    });
  },

  async setPlan(p) {
    const { newTarget, reviewTarget } = planTargets(p);
    const settings = { ...get().settings, plan: p, dailyNewTarget: newTarget, dailyReviewTarget: reviewTarget };
    set({ settings });
    await db.put('settings', 'app', settings);
  },

  async setTheme(t) {
    applyTheme(resolveTheme(t));
    setStoredThemeMode(t);
    const settings = { ...get().settings, theme: t };
    set({ settings });
    await db.put('settings', 'app', settings);
  },

  async setSplitMode(m) {
    const settings = { ...get().settings, splitMode: m };
    set({ settings });
    await db.put('settings', 'app', settings);
  },

  async completeOnboarding(p) {
    const { newTarget, reviewTarget } = planTargets(p);
    const settings: Settings = {
      ...get().settings,
      plan: p,
      dailyNewTarget: newTarget,
      dailyReviewTarget: reviewTarget,
      onboardingDone: true,
    };
    set({ settings });
    await db.put('settings', 'app', settings);
  },

  async logDay(entry) {
    const date = entry.date ?? todayKey();
    const logs = get().dailyLogs.slice();
    const idx = logs.findIndex((l) => l.date === date);
    if (idx >= 0) {
      logs[idx] = { ...logs[idx], ...entry, date };
    } else {
      logs.push({
        date,
        newLearned: 0,
        reviewed: 0,
        correct: 0,
        total: 0,
        ...entry,
      });
    }
    set({ dailyLogs: logs });
    await db.put('dailyLogs', date, logs.find((l) => l.date === date)!);
  },

  getStreak(today = new Date()) {
    const dates = new Set(get().dailyLogs.filter((l) => l.total > 0).map((l) => l.date));
    let streak = 0;
    const d = new Date(today);
    // 若今天无记录从昨天起算
    if (!dates.has(todayKey(d))) d.setDate(d.getDate() - 1);
    while (dates.has(todayKey(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  },

  async exportData() {
    return exportData();
  },

  async importData(json) {
    await importData(json);
    await get().hydrate();
  },

  async resetAll() {
    await Promise.all([
      db.clear('learningState'),
      db.clear('favorites'),
      db.clear('mistakes'),
      db.clear('dailyLogs'),
      db.clear('settings'),
    ]);
    set({ settings: DEFAULT_SETTINGS, dailyLogs: [] });
    await db.put('settings', 'app', DEFAULT_SETTINGS);
  },
}));
