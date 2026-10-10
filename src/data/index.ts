// ============================================================
// 数据聚合层：建立索引 + 提供查询 helper
// 数据源：cigenDataset（cigen 真实词根词缀数据 + 自研词缀词典）
// 对外 API 与旧版一致，组件层无需改动。
// ============================================================
import type { Root, Word, Morpheme, ExamLevel } from '@/types/domain';
import {
  ROOTS_FUSED,
  WORDS_FUSED,
  MORPHEMES_FUSED,
  ROOT_BY_TEXT,
  WORD_BY_ID,
  WORD_BY_LOWER,
  ROOT_MEANINGS,
} from './cigenDataset';
import { getEcdict, getEcdictPhonetic, searchEcdict, firstLineOf, ECDICT_SIZE } from './ecdict';

export function getRoots(): Root[] {
  return ROOTS_FUSED;
}
export function getRootById(id: string): Root | undefined {
  return ROOTS_FUSED.find((r) => r.id === id);
}
export function getRootByText(text: string): Root | undefined {
  return ROOT_BY_TEXT.get(text.toLowerCase());
}
export function getWords(): Word[] {
  return WORDS_FUSED;
}
export function getWordById(id: string): Word | undefined {
  return WORD_BY_ID.get(id);
}
export function getWordByText(text: string): Word | undefined {
  return WORD_BY_LOWER.get(text.toLowerCase());
}
export function getMorphemes(): Morpheme[] {
  return MORPHEMES_FUSED;
}

export function getWordsByExamLevel(level: ExamLevel): Word[] {
  return WORDS_FUSED.filter((w) => w.examLevels.includes(level));
}

// 词族（同根单词，去重且只取有效 id）
export function getFamilyWords(rootId: string): Word[] {
  const root = getRootById(rootId);
  if (!root) return [];
  return root.words
    .map((id) => WORD_BY_ID.get(id))
    .filter((w): w is Word => Boolean(w));
}

export function getWordsByRoot(rootId: string): Word[] {
  return WORDS_FUSED.filter((w) => w.rootIds.includes(rootId));
}

export { ROOT_MEANINGS, getEcdict, getEcdictPhonetic, searchEcdict, firstLineOf, ECDICT_SIZE };
export { default as examBooks } from './examBooks.json';
export { default as vocabExamples } from './vocabExamples.json';
