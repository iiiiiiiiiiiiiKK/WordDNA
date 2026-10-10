// ============================================================
// 全局搜索索引与匹配
// ARCHITECTURE.md §2.1
// ============================================================
import type { Root, Word, Morpheme } from '@/types/domain';
import { getRoots, getWords, getMorphemes } from '@/data';

export type SearchKind = 'word' | 'root' | 'morpheme';
export interface SearchHit {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  to: string;
}

export function searchAll(query: string, limit = 20): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];

  for (const w of getWords() as Word[]) {
    const word = w.word.toLowerCase();
    const cn = w.meanings.map((m) => m.cn).join(' ');
    if (word.includes(q) || cn.includes(q)) {
      hits.push({
        kind: 'word',
        id: w.id,
        title: w.word,
        subtitle: w.meanings.map((m) => `${m.pos} ${m.cn}`).join('；'),
        to: `/word/${w.id}`,
      });
    }
  }

  for (const r of getRoots() as Root[]) {
    if (r.root.toLowerCase().includes(q) || r.meaning.toLowerCase().includes(q)) {
      hits.push({
        kind: 'root',
        id: r.id,
        title: r.root,
        subtitle: r.meaning,
        to: `/roots/${r.id}`,
      });
    }
  }

  for (const m of getMorphemes() as Morpheme[]) {
    if (m.text.toLowerCase().includes(q) || m.meaning.toLowerCase().includes(q)) {
      hits.push({
        kind: 'morpheme',
        id: m.id,
        title: m.text,
        subtitle: `${m.type === 'prefix' ? '前缀' : m.type === 'suffix' ? '后缀' : '词根'} · ${m.meaning}`,
        to: `/roots`,
      });
    }
  }

  return hits.slice(0, limit);
}
