// ============================================================
// 收藏 / 错题 store
// ARCHITECTURE.md §3.2
// ============================================================
import { create } from 'zustand';
import type { Favorite, MistakeRecord, LearnItemType, FavoriteKind } from '@/types/domain';
import { db } from '@/lib/storage/db';
import { uid } from '@/lib/utils';
import { getWordById, getRoots } from '@/data';

interface CollectionStore {
  favorites: Favorite[];
  mistakes: MistakeRecord[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleFavorite: (kind: FavoriteKind, refId: string, note?: string) => Promise<void>;
  isFavorite: (kind: FavoriteKind, refId: string) => boolean;
  recordMistake: (itemId: string, type: LearnItemType) => Promise<void>;
  clearMistakes: () => Promise<void>;
  getWeakRoots: () => string[];
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  favorites: [],
  mistakes: [],
  hydrated: false,

  async hydrate() {
    const [favs, mist] = await Promise.all([
      db.getAll<Favorite>('favorites'),
      db.getAll<MistakeRecord>('mistakes'),
    ]);
    set({ favorites: favs, mistakes: mist, hydrated: true });
  },

  async toggleFavorite(kind, refId, note) {
    const favs = get().favorites.slice();
    const idx = favs.findIndex((f) => f.kind === kind && f.refId === refId);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push({ id: uid('fav'), kind, refId, note, createdAt: new Date().toISOString() });
    }
    set({ favorites: favs });
    await db.clear('favorites');
    for (const f of favs) await db.put('favorites', f.id, f);
  },

  isFavorite(kind, refId) {
    return get().favorites.some((f) => f.kind === kind && f.refId === refId);
  },

  async recordMistake(itemId, type) {
    const mist = get().mistakes.slice();
    const idx = mist.findIndex((m) => m.itemId === itemId);
    const now = new Date().toISOString();
    if (idx >= 0) {
      mist[idx] = { ...mist[idx], wrongCount: mist[idx].wrongCount + 1, lastWrongAt: now };
    } else {
      mist.push({ itemId, type, wrongCount: 1, lastWrongAt: now });
    }
    set({ mistakes: mist });
    await db.clear('mistakes');
    for (const m of mist) await db.put('mistakes', m.itemId, m);
  },

  async clearMistakes() {
    // 旧数据/误操作留下的错题会让首页 WEAK ROOTS 长期显示同一个词根，
    // 给一个明确的清空入口（只清错题，不影响学习进度与 SRS 排期）。
    set({ mistakes: [] });
    await db.clear('mistakes');
  },

  getWeakRoots() {
    // 从错题聚合易错词根。
    // ⚠️ 两个历史 bug（都会让首页 WEAK ROOTS 显示异常）：
    //  1) 错题可能是「词根题」本身（itemId 就是 r-xxx），原实现只用 getWordById 查单词，
    //     词根题的错题被整条丢掉 → 答错了词根题也不算易错。
    //  2) 单词的 rootIds 里有大量「词根表里查不到」的 id（实测 766 个被引用的 rootId 中
    //     有 583 个不在 274 个词根内），这些 id 会被算进 ITEMS 数字却渲染不出 chip
    //     → 出现「2 ITEMS 但只显示 1 个 pose」。
    // 现在：词根题按词根 id 直接计入；单词题映射到它所属词根；只保留真实存在的词根 id。
    const valid = new Set(getRoots().map((r) => r.id));
    const rootCounts: Record<string, number> = {};
    const bump = (id: string, n: number) => {
      if (!valid.has(id)) return;
      rootCounts[id] = (rootCounts[id] ?? 0) + n;
    };
    for (const m of get().mistakes) {
      if (m.itemId.startsWith('r-')) {
        bump(m.itemId, m.wrongCount);
        continue;
      }
      const w = getWordById(m.itemId);
      if (w) for (const rid of w.rootIds) bump(rid, m.wrongCount);
    }
    return Object.keys(rootCounts).sort((a, b) => rootCounts[b] - rootCounts[a]);
  },
}));
