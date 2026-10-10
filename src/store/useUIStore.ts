// ============================================================
// UI 瞬态 store（不持久化）
// ARCHITECTURE.md §3.2
// ============================================================
import { create } from 'zustand';
import type { SplitResult } from '@/types/domain';

interface UIStore {
  searchOpen: boolean;
  mobileDrawerOpen: boolean;
  splitResult: SplitResult | null;
  setSearchOpen: (v: boolean) => void;
  setDrawer: (v: boolean) => void;
  setSplitResult: (r: SplitResult | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  searchOpen: false,
  mobileDrawerOpen: false,
  splitResult: null,
  setSearchOpen: (v) => set({ searchOpen: v }),
  setDrawer: (v) => set({ mobileDrawerOpen: v }),
  setSplitResult: (r) => set({ splitResult: r }),
}));
