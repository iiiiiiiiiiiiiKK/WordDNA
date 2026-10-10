// ============================================================
// 拆词引擎（融合 cigen 真实拆解 + find-roots-of-word 规则）
// 流程：
//   1) 命中内置真实词表（cigen）→ 词源拆解（etymological，100% 可信）
//   2) 否则：规则化还原词形（去复数/时态等）后，使用 find-roots-of-word 的
//      子串词根算法——在单词任意位置搜索词根，再向前后整段匹配前缀/后缀，
//      仅保留完整覆盖整词的拆解（morphological）
//   3) 失败 → 返回近似词建议
// 数据源：
//   - cigen：275 真实词根 + 953 词条的权威中文释义拆解
//   - find-roots-of-word：4311 条词根/词缀文本（仅用于子串匹配，无释义）
// ============================================================
import type { WordPart, SplitResult, Reliability, MorphemeType } from '@/types/domain';
import { getMorphemes, getWordByText, ROOT_MEANINGS } from '@/data';
import { FROW_PREFIXES, FROW_SUFFIXES, FROW_ROOTS } from '@/data/frowMorphemes';
import { levenshtein } from './utils';

// ---------- 词素索引（cigen 有权威释义；frow 仅补文本覆盖） ----------
// 按「类型」分表建索引，避免同一文本既是前缀又是词根时的 Map 覆盖冲突；
// 拆词时类型以所在槽位为准，释义从对应类型表取。
const PREFIX_BY_TEXT = new Map<string, { text: string; meaning: string; id: string }>();
const SUFFIX_BY_TEXT = new Map<string, { text: string; meaning: string; id: string }>();
const ROOT_BY_TEXT_L = new Map<string, { text: string; meaning: string; id: string }>();
for (const m of getMorphemes()) {
  const key = m.text.toLowerCase();
  const rec = { text: m.text, meaning: m.meaning, id: m.id };
  if (m.type === 'prefix') PREFIX_BY_TEXT.set(key, rec);
  else if (m.type === 'suffix') SUFFIX_BY_TEXT.set(key, rec);
  else ROOT_BY_TEXT_L.set(key, rec);
}
const PREFIX_SET = new Set<string>([...FROW_PREFIXES, ...PREFIX_BY_TEXT.keys()]);
const SUFFIX_SET = new Set<string>([...FROW_SUFFIXES, ...SUFFIX_BY_TEXT.keys()]);
const ROOT_SET = new Set<string>([
  ...FROW_ROOTS,
  ...ROOT_BY_TEXT_L.keys(),
  ...Object.keys(ROOT_MEANINGS),
]);

interface Segment {
  text: string;
  type: MorphemeType;
  meaning: string;
  morphemeId?: string;
  reliability: Reliability;
  isInferred?: boolean;
}

function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function toWordPart(seg: Segment): WordPart {
  return {
    text: seg.text,
    type: seg.type,
    meaning: seg.meaning,
    morphemeId: seg.morphemeId,
    reliability: seg.reliability,
    isInferred: seg.isInferred,
  };
}

function resolve(text: string, fallbackType: MorphemeType): Segment {
  const key = text.toLowerCase();
  const hit =
    fallbackType === 'prefix'
      ? PREFIX_BY_TEXT.get(key)
      : fallbackType === 'suffix'
        ? SUFFIX_BY_TEXT.get(key)
        : ROOT_BY_TEXT_L.get(key);
  if (hit) {
    // 命中词素库，但若该词素（如 cigen 前缀型词根）释义为空，回退到高频词根词典
    const meaning = hit.meaning || (fallbackType === 'root' ? ROOT_MEANINGS[key] || '' : '');
    return {
      text: hit.text,
      type: fallbackType,
      meaning,
      morphemeId: hit.id,
      reliability: 'morphological',
      isInferred: !hit.meaning && Boolean(meaning),
    };
  }
  // 词根型：再回退到高频词根中文词典（来自 frow 子串但我们有释义）
  if (fallbackType === 'root' && ROOT_MEANINGS[key]) {
    return {
      text,
      type: 'root',
      meaning: ROOT_MEANINGS[key],
      morphemeId: undefined,
      reliability: 'morphological',
      isInferred: true,
    };
  }
  return { text, type: fallbackType, meaning: '', reliability: 'morphological', isInferred: true };
}

// ---------- 规则化还原词形（轻量版 word-exchanges） ----------
function restoreForms(word: string): string[] {
  const out = new Set<string>();
  const tryAdd = (w: string) => {
    if (w && w.length >= 2 && w !== word) out.add(w);
  };
  if (word.endsWith('ies') && word.length > 4) tryAdd(word.slice(0, -3) + 'y');
  if (word.endsWith('es') && word.length > 3) tryAdd(word.slice(0, -2));
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) tryAdd(word.slice(0, -1));
  if (word.endsWith('ed') && word.length > 3) {
    tryAdd(word.slice(0, -2)); // played -> play
    tryAdd(word.slice(0, -1) + 'e'); // liked -> like
  }
  if (word.endsWith('ing') && word.length > 4) {
    tryAdd(word.slice(0, -3) + 'e'); // making -> make
    tryAdd(word.slice(0, -3)); // making -> mak
  }
  if (word.endsWith('ly') && word.length > 3) tryAdd(word.slice(0, -2));
  if (word.endsWith('er') && word.length > 4) tryAdd(word.slice(0, -2));
  if (word.endsWith('est') && word.length > 5) tryAdd(word.slice(0, -3));
  if (word.endsWith('y') && word.length > 3) tryAdd(word.slice(0, -1) + 'e'); // happy -> hap?
  return Array.from(out);
}

// ---------- 前后缀整段分割（覆盖整段才算数） ----------
function segmentPrefix(str: string, set: Set<string>): string[] | null {
  if (str === '') return [];
  for (let i = 0; i < str.length; i++) {
    const cand = str.substring(i); // 取 str 的后缀段
    if (set.has(cand)) {
      const rest = str.substring(0, i);
      const sub = segmentPrefix(rest, set);
      if (sub !== null) return [...sub, cand]; // 前缀按词序排列
    }
  }
  return null;
}
function segmentSuffix(str: string, set: Set<string>): string[] | null {
  if (str === '') return [];
  // 最长优先：优先把整段后部当一个后缀，避免拆成单字母（如 ation → a+t+i+on）
  for (let j = str.length; j >= 1; j--) {
    const cand = str.substring(0, j); // 取 str 的前缀段（即单词后缀）
    if (set.has(cand)) {
      const rest = str.substring(j);
      const sub = segmentSuffix(rest, set);
      if (sub !== null) return [cand, ...sub];
    }
  }
  return null;
}

// ---------- 子串词根穷举（find-roots-of-word 核心） ----------
interface Combo {
  segs: Segment[];
  morphemeCount: number;
  noMeaningCount: number;
  rootIsCigen: boolean;
  rootIsCurated: boolean;
  rootIsAffix: boolean;
  rootLen: number;
}

function enumerate(word: string): Combo[] {
  const combos: Combo[] = [];
  const n = word.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= n; j++) {
      const rootCand = word.substring(i, j);
      if (!ROOT_SET.has(rootCand)) continue;
      const before = word.substring(0, i);
      const after = word.substring(j);
      const pre = segmentPrefix(before, PREFIX_SET);
      const suf = segmentSuffix(after, SUFFIX_SET);
      if (pre === null || suf === null) continue; // 必须完整覆盖前后
      const rootSeg = resolve(rootCand, 'root');
      const segs: Segment[] = [
        ...pre.map((p) => resolve(p, 'prefix')),
        rootSeg,
        ...suf.map((s) => resolve(s, 'suffix')),
      ];
      const lc = rootCand.toLowerCase();
      const rootIsAffix = PREFIX_BY_TEXT.has(lc) || SUFFIX_BY_TEXT.has(lc);
      const rootIsCurated = ROOT_BY_TEXT_L.has(lc) || Boolean(ROOT_MEANINGS[lc]);
      combos.push({
        segs,
        morphemeCount: pre.length + 1 + suf.length,
        noMeaningCount: segs.filter((s) => !s.meaning).length,
        rootIsCigen: rootSeg.morphemeId != null,
        rootIsCurated,
        rootIsAffix,
        rootLen: rootCand.length,
      });
    }
  }
  // 排序优先级：词素数最少 → 无意义词素最少 → cigen 权威词根 → 词根为可教学词根
  //          → 词根不是已知词缀 → 词根更长（更具体）
  combos.sort((a, b) => {
    if (a.morphemeCount !== b.morphemeCount) return a.morphemeCount - b.morphemeCount;
    if (a.noMeaningCount !== b.noMeaningCount) return a.noMeaningCount - b.noMeaningCount;
    if (a.rootIsCigen !== b.rootIsCigen) return a.rootIsCigen ? -1 : 1;
    if (a.rootIsCurated !== b.rootIsCurated) return a.rootIsCurated ? -1 : 1;
    if (a.rootIsAffix !== b.rootIsAffix) return a.rootIsAffix ? 1 : -1;
    return b.rootLen - a.rootLen;
  });
  return combos;
}

function nearestWords(target: string, n: number): string[] {
  return getMorphemes()
    .map((m) => ({ w: m.text, d: levenshtein(target, m.text) }))
    .filter((x) => x.d <= 3 && x.d > 0)
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.w);
}

export function splitWord(input: string, _mode: 'learn' | 'etymology' = 'learn'): SplitResult {
  const normalized = normalize(input);
  if (!normalized) {
    return {
      input,
      success: false,
      parts: [],
      reliability: 'mnemonic',
      warning: '请输入有效的英文单词。',
      matchedWordId: null,
      suggestions: [],
    };
  }

  // 1) 命中内置真实词表（cigen）→ 词源拆解
  const matched = getWordByText(normalized);
  if (matched) {
    return {
      input,
      success: true,
      parts: matched.parts,
      reliability: 'etymological',
      warning: null,
      matchedWordId: matched.id,
      suggestions: [],
    };
  }

  // 2) 规则化还原 + 子串词根穷举
  const bases = [normalized, ...restoreForms(normalized)];
  let best: Combo | null = null;
  let restored = false;
  for (const base of bases) {
    const combos = enumerate(base);
    if (combos.length > 0) {
      best = combos[0];
      restored = base !== normalized;
      break;
    }
  }
  if (best) {
    // 词根必须是权威（cigen）或可教学词根，否则大概率是日耳曼等原生词，放弃确定性拆解
    const teachable = best.rootIsCigen || best.rootIsCurated;
    if (!teachable) {
      return {
        input,
        success: false,
        parts: [],
        reliability: 'mnemonic',
        warning: '该词似乎不属于拉丁/希腊词根体系（可能为日耳曼原生词、专有名词或拼写变体），暂无法可靠拆解。可尝试输入更标准的词形。',
        matchedWordId: null,
        suggestions: nearestWords(normalized, 3),
      };
    }
    const inferred = best.segs.some((s) => s.isInferred);
    return {
      input,
      success: true,
      parts: best.segs.map(toWordPart),
      reliability: restored ? 'mnemonic' : 'morphological',
      warning: restored
        ? '已按规则还原词形后拆解，属记忆辅助拆分，不代表严格历史词源。'
        : inferred
          ? '含部分推断词缀（来自 find-roots-of-word 词库，未配中文释义），仅供参考。'
          : null,
      matchedWordId: null,
      suggestions: [],
    };
  }

  // 3) 失败
  return {
    input,
    success: false,
    parts: [],
    reliability: 'mnemonic',
    warning: '暂无法可靠拆解该单词（可能为原生日耳曼语源词，不在拉丁/希腊词根体系内）。',
    matchedWordId: null,
    suggestions: nearestWords(normalized, 3),
  };
}
