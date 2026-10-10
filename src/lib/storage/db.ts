// ============================================================
// 存储抽象层：IndexedDB 优先，自动回退 LocalStorage
// ARCHITECTURE.md §10.5
// ============================================================
export interface KVStore {
  get<T>(store: string, key: string): Promise<T | undefined>;
  getAll<T>(store: string): Promise<T[]>;
  put<T>(store: string, key: string, value: T): Promise<void>;
  del(store: string, key: string): Promise<void>;
  clear(store: string): Promise<void>;
}

const DB_NAME = 'worddna';
const DB_VERSION = 1;
const LS_PREFIX = 'wd:';
const STORE_NAMES = [
  'learningState',
  'favorites',
  'mistakes',
  'settings',
  'dailyLogs',
  'meta',
];

let dbPromise: Promise<IDBDatabase> | null = null;
let useFallback = false;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      useFallback = true;
      reject(new Error('no-indexeddb'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: name === 'settings' || name === 'meta' ? 'key' : 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      useFallback = true;
      reject(req.error);
    };
  });
  return dbPromise;
}

// ---------- LocalStorage 回退实现 ----------
function lsKey(store: string, key: string): string {
  return `${LS_PREFIX}${store}:${key}`;
}
function lsGetAll<T>(store: string): T[] {
  const out: T[] = [];
  const prefix = `${LS_PREFIX}${store}:`;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      try {
        out.push(JSON.parse(localStorage.getItem(k) as string) as T);
      } catch {
        /* noop */
      }
    }
  }
  return out;
}

async function idbRequest<T>(fn: (db: IDBDatabase) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    try {
      const req = fn(db);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

export const db: KVStore = {
  async get<T>(store: string, key: string): Promise<T | undefined> {
    try {
      const idbKey = store === 'settings' || store === 'meta' ? 'app' : key;
      const r = await idbRequest<T | undefined>((d) => d.transaction(store, 'readonly').objectStore(store).get(idbKey));
      if (r != null) return r;
      // IndexedDB 里没有（比如历史上 put 失败只落到了 localStorage）→ 再兜一层，
      // 否则已存过的数据会凭空消失（新手引导就是这么反复弹的）。
      const raw = localStorage.getItem(lsKey(store, key));
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      // 回退
      const raw = localStorage.getItem(lsKey(store, key));
      return raw ? (JSON.parse(raw) as T) : undefined;
    }
  },

  async getAll<T>(store: string): Promise<T[]> {
    try {
      const fromIdb = await idbRequest<T[]>((d) => d.transaction(store, 'readonly').objectStore(store).getAll());
      // 合并历史 localStorage 孤儿数据（修复前 put 失败遗留的进度），按 id 去重，
      // 保证升级后旧的练习进度不会丢失。
      const fromLs = lsGetAll<T>(store);
      if (fromLs.length === 0) return fromIdb;
      const seen = new Set<string>(
        (fromIdb as Array<Record<string, unknown>>).map((r) => String(r?.id ?? r?.itemId ?? r?.date ?? '')),
      );
      const merged = [...fromIdb];
      for (const rec of fromLs as Array<Record<string, unknown>>) {
        const k = String(rec?.id ?? rec?.itemId ?? rec?.date ?? '');
        if (!seen.has(k)) {
          seen.add(k);
          merged.push(rec as unknown as T);
        }
      }
      return merged;
    } catch {
      return lsGetAll<T>(store);
    }
  },

  async put<T>(store: string, key: string, value: T): Promise<void> {
    try {
      const idbKey = store === 'settings' || store === 'meta' ? 'app' : key;
      // 关键修复：objectStore 使用 keyPath:'id'，但 learningState/mistakes/dailyLogs 等
      // 记录以 itemId/date 作为标识，本身不含 id 字段。若不注入 id 并改用内联键，
      // IndexedDB 会因 keyPath 冲突/缺失而抛 DataError，导致数据只落到 localStorage
      // 而 getAll 永远读不到（表现为“学习进度刷新后丢失”）。注入 id 后不再传显式 key，
      // 由内联 keyPath 派生，所有实现均可正常写入。
      //
      // ⚠️ 第二个坑：settings / meta 两个 store 的 keyPath 其实是 'key'（见 openDB），
      // 只注入 id 会让它们的 put 同样抛 DataError → 只写进 localStorage；而 get 用
      // get('app') 在 keyPath='key' 的 store 里查不到也**不报错**，直接返回 undefined，
      // 于是 settings 永远读不回来 —— 表现就是「每次打开都弹新手引导」。
      // 这里同时注入 id 和 key，覆盖两种 keyPath。
      const record =
        typeof value === 'object' && value !== null
          ? { ...(value as object), id: idbKey, key: idbKey }
          : value;
      await idbRequest<IDBValidKey>((d) =>
        d.transaction(store, 'readwrite').objectStore(store).put(record as unknown as object),
      );
    } catch {
      localStorage.setItem(lsKey(store, key), JSON.stringify(value));
    }
  },

  async del(store: string, key: string): Promise<void> {
    try {
      const idbKey = store === 'settings' || store === 'meta' ? 'app' : key;
      await idbRequest<undefined>((d) => d.transaction(store, 'readwrite').objectStore(store).delete(idbKey));
    } catch {
      localStorage.removeItem(lsKey(store, key));
    }
  },

  async clear(store: string): Promise<void> {
    try {
      await idbRequest<undefined>((d) => d.transaction(store, 'readwrite').objectStore(store).clear());
    } catch {
      const prefix = `${LS_PREFIX}${store}:`;
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    }
  },
};

export async function initStorage(): Promise<void> {
  try {
    await openDB();
  } catch {
    useFallback = true;
  }
}
