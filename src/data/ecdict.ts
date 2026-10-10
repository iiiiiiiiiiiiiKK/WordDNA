// ECDICT 英汉词典（skywind3000/ECDICT）精简版：取词频前 15000 的常用词，
// 作为「整词释义 / 音标」兜底——拆词引擎无法拆解、或拆解后想看单词整体含义时使用。
// 数据源：https://github.com/skywind3000/ECDICT
import ecdictMini from './ecdictMini.json';

interface EcdictEntry {
  tr: string; // 中文翻译（可能含多行）
  ph: string; // 音标（KK/IPA）
}
const MAP = ecdictMini as Record<string, EcdictEntry>;

// ⚠️ 重要：ECDICT 源数据里大量释义是用「字面量 \n」（反斜杠 + n 两个字符）表示换行的，
// 而不是真正的换行符 charCode(10)。实测 15000 条里有 9463 条如此。
// 若不归一化，UI 上会把 \n 当成文字直接显示出来（如 "a. 正确的, 精确的\n[经] 准确的"）。
const LITERAL_NL = /\\n/g;
function normalizeTr(tr: string): string {
  return tr.replace(LITERAL_NL, '\n');
}

// 整词翻译（首行由 firstLineOf 裁剪）
export function getEcdict(word: string): string | undefined {
  const tr = MAP[word.trim().toLowerCase()]?.tr;
  return tr ? normalizeTr(tr) : undefined;
}
// 整词音标
export function getEcdictPhonetic(word: string): string | undefined {
  return MAP[word.trim().toLowerCase()]?.ph;
}

// 取翻译首行（去掉词性与换行），便于卡片内简洁展示
export function firstLineOf(tr: string): string {
  return normalizeTr(tr).split('\n')[0].trim();
}

export const ECDICT_SIZE = Object.keys(MAP).length;

// 词库检索：优先前缀匹配，再包含匹配，返回前 limit 条（用于“盈余词库”浏览）
export function searchEcdict(
  query: string,
  limit = 200,
): { word: string; ph: string; tr: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: { word: string; ph: string; tr: string }[] = [];
  const seen = new Set<string>();
  // 第一遍：前缀匹配（更符合“按字母分类浏览”的直觉）
  for (const key in MAP) {
    if (key.startsWith(q)) {
      out.push({ word: key, ph: MAP[key].ph, tr: firstLineOf(MAP[key].tr) });
      seen.add(key);
      if (out.length >= limit) return out;
    }
  }
  // 第二遍：包含匹配补漏
  for (const key in MAP) {
    if (!seen.has(key) && key.includes(q)) {
      out.push({ word: key, ph: MAP[key].ph, tr: firstLineOf(MAP[key].tr) });
      seen.add(key);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
