// ============================================================
// 数据聚合层：建立索引 + 提供查询 helper
// 数据源：cigenDataset（cigen 真实词根词缀数据 + 自研词缀词典）
// 对外 API 与旧版一致，组件层无需改动。
// ============================================================
import type { Root, Word, Morpheme, ExamLevel, VerificationStatus } from '@/types/domain';
import {
  ROOTS_FUSED,
  WORDS_FUSED,
  MORPHEMES_FUSED,
  ROOT_BY_TEXT,
  WORD_BY_LOWER,
  ROOT_MEANINGS,
} from './cigenDataset';
import { getEcdict, getEcdictPhonetic, searchEcdict, firstLineOf, ECDICT_SIZE } from './ecdict';

// ── Wave 4 校验清洗（在聚合层做，源文件不动，可回退） ──
// 1) 剔除单词里指向「不存在词根」的孤儿 rootId（583 条 dangling 引用，如 asocial→r-social、
//    abnormal→r-normal）。这些 root 从未进入 274 条精选词根表，会污染词族/薄弱词根/学习计数。
//    清洗后词族、薄弱词根、每日计划都只统计真实存在的词根。
// 2) 给词根 / 词缀打 verificationStatus：词根来自 cigen 真实词源 → verified；词缀有词源描述 →
//    verified，否则 → review（待人工核验），用于后续数据质量看板。
const EXISTING_ROOT_IDS = new Set(ROOTS_FUSED.map((r) => r.id));

const WORDS_CLEAN: Word[] = WORDS_FUSED.map((w) => ({
  ...w,
  rootIds: w.rootIds.filter((id) => EXISTING_ROOT_IDS.has(id)),
}));
const WORD_CLEAN_BY_ID = new Map(WORDS_CLEAN.map((w) => [w.id, w]));

const ROOTS_DERIVED: Root[] = ROOTS_FUSED.map((r) => ({
  ...r,
  verificationStatus: 'verified' as VerificationStatus,
}));

const MORPH_DERIVED: Morpheme[] = MORPHEMES_FUSED.map((m) => ({
  ...m,
  verificationStatus: m.etymology && m.etymology.trim() ? ('verified' as VerificationStatus) : ('review' as VerificationStatus),
}));

export function getRoots(): Root[] {
  return ROOTS_DERIVED;
}
export function getRootById(id: string): Root | undefined {
  return ROOTS_DERIVED.find((r) => r.id === id);
}
export function getRootByText(text: string): Root | undefined {
  return ROOT_BY_TEXT.get(text.toLowerCase());
}
export function getWords(): Word[] {
  return WORDS_CLEAN;
}
export function getWordById(id: string): Word | undefined {
  return WORD_CLEAN_BY_ID.get(id);
}
export function getWordByText(text: string): Word | undefined {
  return WORD_BY_LOWER.get(text.toLowerCase());
}
export function getMorphemes(): Morpheme[] {
  return MORPH_DERIVED;
}

export function getWordsByExamLevel(level: ExamLevel): Word[] {
  return WORDS_CLEAN.filter((w) => w.examLevels.includes(level));
}

// 词族（同根单词，去重且只取有效 id；使用清洗后的单词索引）
export function getFamilyWords(rootId: string): Word[] {
  const root = getRootById(rootId);
  if (!root) return [];
  return root.words
    .map((id) => WORD_CLEAN_BY_ID.get(id))
    .filter((w): w is Word => Boolean(w));
}

export function getWordsByRoot(rootId: string): Word[] {
  return WORDS_CLEAN.filter((w) => w.rootIds.includes(rootId));
}

export { ROOT_MEANINGS, getEcdict, getEcdictPhonetic, searchEcdict, firstLineOf, ECDICT_SIZE };
export { default as examBooks } from './examBooks.json';
export { default as vocabExamples } from './vocabExamples.json';
