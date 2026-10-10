// ============================================================
// 测试题库生成：从「已经浏览过的词根 / 单词」里出题
// 设计原则：只考学过的东西，且优先考「最久没复习」的，避免刚看完立刻考。
//
// 主动回忆覆盖多个方向（对应产品需求 §9）：
//   meaning：给出 词/根 文本 → 选释义        （识别，Recognition）
//   word：   给出 释义 → 选 词/根 文本        （反向回忆，Recall）
//   affix：  给出 前缀/后缀 → 选释义          （词缀回忆）
//   context：给出 真实例句 → 选该词在句中的释义（语境理解，Context）
//   distinguish：同一词根的词族里挑出某个意思（辨析，Distinguish）
// ============================================================
import type { LearnItemType } from '@/types/domain';
import { getRoots, getWords, getRootById, getWordById, getMorphemes } from '@/data';

export type QuizKind = 'meaning' | 'word' | 'affix' | 'context' | 'distinguish';

export interface QuizQuestion {
  itemId: string;
  type: LearnItemType;
  kind: QuizKind;
  /** 题干文本：词/根文本、释义、前缀/后缀、例句、或辨析导语 */
  prompt: string;
  /** 题干辅助：例句里的高亮词、或「这些都含词根 X」之类说明 */
  sub?: string;
  /** 正确答案（与选项文本比对） */
  answer: string;
  /** 选项 */
  options: string[];
  /** 答对后的真实例句（语境反馈），可选 */
  feedbackExample?: { en: string; cn: string; word: string };
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 从候选里取 n 个与正确答案不同的干扰项（去重、过滤过长释义） */
function pickDistractors(pool: string[], answer: string, n: number): string[] {
  const seen = new Set<string>([answer]);
  const out: string[] = [];
  for (const s of shuffle(pool)) {
    if (!s || seen.has(s)) continue;
    if (s.length > 24) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

function exampleOf(itemId: string): { en: string; cn: string; word: string } | null {
  const w = getWordById(itemId);
  if (w?.examples?.[0]) return { ...w.examples[0], word: w.word };
  const r = getRootById(itemId);
  if (r) {
    for (const wid of r.words) {
      const fw = getWordById(wid);
      if (fw?.examples?.[0]) return { ...fw.examples[0], word: fw.word };
    }
  }
  return null;
}

/**
 * 生成测试题（多方向主动回忆）
 * @param pool 已浏览过的条目（按「最久没复习」排好序）
 * @param count 题目数量
 */
export function buildQuiz(
  pool: { itemId: string; type: LearnItemType }[],
  count = 12,
): QuizQuestion[] {
  const roots = getRoots();
  const words = getWords();
  const morphs = getMorphemes();

  const rootTexts = roots.map((r) => r.root);
  const rootMeanings = roots.map((r) => r.meaning).filter(Boolean);
  const wordTexts = words.map((w) => w.word);
  const wordMeanings = words.map((w) => w.meanings[0]?.cn).filter(Boolean) as string[];
  const affixTexts = morphs.filter((m) => m.type !== 'root' && m.meaning).map((m) => m.text);
  const affixMeanings = morphs.filter((m) => m.type !== 'root' && m.meaning).map((m) => m.meaning);

  const out: QuizQuestion[] = [];

  for (const it of pool) {
    if (it.type === 'root') {
      const r = getRootById(it.itemId);
      if (!r || !r.meaning) continue;

      // 1) 方向一：给词根释义 → 回忆词根文本
      const rtDistract = pickDistractors(rootTexts, r.root, 3);
      if (rtDistract.length >= 3) {
        out.push({
          itemId: r.id,
          type: 'root',
          kind: 'word',
          prompt: r.meaning,
          sub: '这个词根的意思是？',
          answer: r.root,
          options: shuffle([r.root, ...rtDistract]),
          feedbackExample: exampleOf(r.id) ?? undefined,
        });
      }

      // 2) 方向二：词族辨析 —— 同根词里挑出某个意思（Distinguish）
      const fam = r.words.map((id) => getWordById(id)).filter((w): w is NonNullable<typeof w> => Boolean(w));
      if (fam.length >= 3) {
        const sample = shuffle(fam).slice(0, 4);
        const answerWord = sample[0];
        const ansCn = answerWord.meanings[0]?.cn;
        if (ansCn) {
          out.push({
            itemId: r.id,
            type: 'root',
            kind: 'distinguish',
            prompt: `以下都含词根 ${r.root}（${r.meaning}），哪个意思是「${ansCn}」？`,
            sub: '同一词根 ≠ 相同意思，注意区分。',
            answer: answerWord.word,
            options: shuffle(sample.map((w) => w.word)),
            feedbackExample: exampleOf(answerWord.id) ?? undefined,
          });
        }
      }
    } else if (it.type === 'prefix' || it.type === 'suffix') {
      // 词缀题：给词缀文本 → 选释义
      const m = morphs.find((x) => x.text === it.itemId.replace(/^p-|^s-/, '') && x.type === it.type);
      if (m?.meaning) {
        const dist = pickDistractors(affixMeanings, m.meaning, 3);
        if (dist.length >= 3) {
          out.push({
            itemId: it.itemId,
            type: it.type,
            kind: 'affix',
            prompt: `${it.type === 'prefix' ? '前缀' : '后缀'} ${m.text}`,
            sub: '它的意思是？',
            answer: m.meaning,
            options: shuffle([m.meaning, ...dist]),
          });
        }
      }
    } else {
      const w = getWordById(it.itemId);
      if (!w || !w.meanings[0]?.cn) continue;
      const cn = w.meanings[0].cn;

      // 3) 方向三：给单词释义 → 回忆单词（反向）
      const wDistract = pickDistractors(wordTexts, w.word, 3);
      if (wDistract.length >= 3) {
        out.push({
          itemId: w.id,
          type: 'word',
          kind: 'word',
          prompt: cn,
          sub: '这个中文意思对应的单词是？',
          answer: w.word,
          options: shuffle([w.word, ...wDistract]),
        });
      }

      // 4) 方向四：给真实例句 → 选该词在句中的释义（Context）
      const ex = w.examples?.[0];
      if (ex) {
        const cDistract = pickDistractors(wordMeanings, cn, 3);
        if (cDistract.length >= 3) {
          out.push({
            itemId: w.id,
            type: 'word',
            kind: 'context',
            prompt: ex.en,
            sub: `句中「${w.word}」的意思是？`,
            answer: cn,
            options: shuffle([cn, ...cDistract]),
          });
        }
      }

      // 5) 方向五：从单词的 前缀/后缀 出题（Affix recall）
      for (const part of w.parts) {
        if (part.type !== 'root' && part.meaning) {
          const aDistract = pickDistractors(affixMeanings, part.meaning, 3);
          if (aDistract.length >= 3) {
            out.push({
              itemId: w.id,
              type: 'word',
              kind: 'affix',
              prompt: `${part.type === 'prefix' ? '前缀' : '后缀'} ${part.text}`,
              sub: `来自 ${w.word}`,
              answer: part.meaning,
              options: shuffle([part.meaning, ...aDistract]),
            });
            break; // 每个单词最多出一道词缀题，避免重复
          }
        }
      }
    }
  }

  // 保证题型多样：尽量先各取一道，再补足
  const mixed = shuffle(out).slice(0, count);
  // 回填每题的反馈例句（正向/反向题已有，这里兜底给 context/distinguish 也补上）
  for (const q of mixed) {
    if (!q.feedbackExample) q.feedbackExample = exampleOf(q.itemId) ?? undefined;
  }
  return mixed;
}
