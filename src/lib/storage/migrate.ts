// ============================================================
// 存储版本迁移 + 数据导入/导出
// ============================================================
import { db } from './db';

const SCHEMA_VERSION_KEY = 'schemaVersion';

export async function getSchemaVersion(): Promise<number> {
  const v = await db.get<{ value: number }>('meta', SCHEMA_VERSION_KEY);
  return v?.value ?? 0;
}

export async function setSchemaVersion(v: number): Promise<void> {
  await db.put('meta', SCHEMA_VERSION_KEY, { value: v });
}

export interface ExportBundle {
  version: number;
  exportedAt: string;
  learningState: unknown[];
  favorites: unknown[];
  mistakes: unknown[];
  settings: unknown;
  dailyLogs: unknown[];
}

export async function exportData(): Promise<string> {
  const [learningState, favorites, mistakes, settings, dailyLogs] = await Promise.all([
    db.getAll('learningState'),
    db.getAll('favorites'),
    db.getAll('mistakes'),
    db.get('settings', 'app'),
    db.getAll('dailyLogs'),
  ]);
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    learningState,
    favorites,
    mistakes,
    settings,
    dailyLogs,
  };
  return JSON.stringify(bundle, null, 2);
}

export async function importData(json: string): Promise<void> {
  const bundle = JSON.parse(json) as ExportBundle;
  if (!bundle || typeof bundle !== 'object') throw new Error('无效的数据文件');

  await db.clear('learningState');
  await db.clear('favorites');
  await db.clear('mistakes');
  await db.clear('dailyLogs');

  for (const item of bundle.learningState ?? []) {
    const rec = item as { itemId: string };
    await db.put('learningState', rec.itemId, item);
  }
  for (const item of bundle.favorites ?? []) {
    const rec = item as { id: string };
    await db.put('favorites', rec.id, item);
  }
  for (const item of bundle.mistakes ?? []) {
    const rec = item as { itemId: string };
    await db.put('mistakes', rec.itemId, item);
  }
  for (const item of bundle.dailyLogs ?? []) {
    const rec = item as { date: string };
    await db.put('dailyLogs', rec.date, item);
  }
  if (bundle.settings) await db.put('settings', 'app', bundle.settings);

  await setSchemaVersion(1);
}
