// ============================================================
// 测试题库生成：从「已经浏览过的词根 / 单词」里出题
// 设计原则：只考学过的东西，且优先考「最久没复习」的，避免刚看完立刻考。
// ============================================================
import type { LearnItemType } from '@/types/domain';
import { getRoots, getWords, getRootById, getWordById } from '@/data';

export interface QuizQuestion {
  itemId: string;
  type: LearnItemType;
  /** 题干：词根文本 或 单词 */
  prompt: string;
  /** 辅助信息（单词音标） */
  sub?: string;
  /** 正确答案 */
  answer: string;
  /** 4 个被打乱的选项 */
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 从候选里取 n 个与正确答案不同的干扰项（去重） */
function pickDistractors(pool: string[], answer: string, n: number): string[] {
  const seen = new Set<string>([answer]);
  const out: string[] = [];
  const src = shuffle(pool);
  for (const s of src) {
    if (!s || seen.has(s)) continue;
    // 过长的释义不适合做选项
    if (s.length > 24) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

/**
 * 生成测试题
 * @param pool 已浏览过的条目（按「最久没复习」排好序）
 * @param count 题目数量
 */
export function buildQuiz(
  pool: { itemId: string; type: LearnItemType }[],
  count = 12,
): QuizQuestion[] {
  const roots = getRoots();
  const words = getWords();
  const rootMeanings = roots.map((r) => r.meaning).filter(Boolean);
  const wordMeanings = words.map((w) => w.meanings[0]?.cn).filter(Boolean);

  const out: QuizQuestion[] = [];
  for (const it of pool) {
    if (out.length >= count) break;

    if (it.type === 'root') {
      const r = getRootById(it.itemId);
      if (!r || !r.meaning) continue;
      const distractors = pickDistractors(rootMeanings, r.meaning, 3);
      if (distractors.length < 3) continue;
      out.push({
        itemId: r.id,
        type: 'root',
        prompt: r.root,
        answer: r.meaning,
        options: shuffle([r.meaning, ...distractors]),
      });
    } else {
      const w = getWordById(it.itemId);
      if (!w || !w.meanings[0]?.cn) continue;
      const answer = w.meanings[0].cn;
      const distractors = pickDistractors(wordMeanings, answer, 3);
      if (distractors.length < 3) continue;
      out.push({
        itemId: w.id,
        type: 'word',
        prompt: w.word,
        sub: w.phonetic,
        answer,
        options: shuffle([answer, ...distractors]),
      });
    }
  }
  return out;
}
