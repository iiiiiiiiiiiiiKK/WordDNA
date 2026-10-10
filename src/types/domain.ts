// ============================================================
// WordDNA 领域模型（唯一真源）
// 对应 ARCHITECTURE.md §3.1
// ============================================================

// ---------- 枚举 / 联合类型 ----------
export type MorphemeType = 'prefix' | 'root' | 'suffix';
export type LearnItemType = 'root' | 'word' | 'prefix' | 'suffix';
export type SrsStatus = 'new' | 'learning' | 'review' | 'mastered';
export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type Reliability = 'etymological' | 'morphological' | 'mnemonic';
export type ThemeMode = 'light' | 'dark' | 'system';
export type PlanMinutes = 5 | 10 | 20 | 30;
export type ExamLevel =
  | 'CET-4'
  | 'CET-6'
  | '考研'
  | 'IELTS'
  | 'TOEFL'
  | 'GRE'
  | 'SAT'
  | '日常';

export const EXAM_LEVELS: ExamLevel[] = [
  'CET-4',
  'CET-6',
  '考研',
  'IELTS',
  'TOEFL',
  'GRE',
  'SAT',
  '日常',
];

// ---------- 词素 ----------
export interface Morpheme {
  id: string; // 如 'm-port'
  text: string; // 'port'
  type: MorphemeType;
  meaning: string; // 'carry 携带'
  variants?: string[]; // ['port','porta'] 异体
  language?: string; // 'Latin'
  etymology?: string;
}

// ---------- 词根 ----------
export interface Root {
  id: string; // 'r-port'
  root: string; // 'port'
  meaning: string; // 'carry 携带'
  language: string; // 'Latin'
  etymology: string;
  description: string; // 记忆提示
  words: string[]; // Word id 列表（词族）
}

// ---------- 单词 ----------
export interface Meaning {
  pos: string; // 'v.'
  cn: string; // '运输'
}
export interface WordPart {
  text: string;
  type: MorphemeType;
  meaning: string;
  morphemeId?: string; // 关联词素（可空=未收录）
  reliability: Reliability;
  isInferred?: boolean; // true 时 UI 显示 ⚠️
}
export interface Example {
  en: string;
  cn: string;
}
export interface Word {
  id: string; // 'w-transport'
  word: string; // 'transport'
  phonetic: string; // '/trænsˈpɔːrt/'
  meanings: Meaning[];
  parts: WordPart[]; // 预置拆解（学习拆解）
  etymParts?: WordPart[]; // 词源拆解（可选）
  rootIds: string[];
  prefixIds: string[];
  suffixIds: string[];
  etymology: string;
  evolution?: string[]; // 词义演化链
  examples: Example[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  frequency: number; // 词频（越大越高频）
  examLevels: ExamLevel[];
  mnemonic?: string; // 记忆提示
}

// ---------- SRS ----------
export interface LearningState {
  itemId: string;
  type: LearnItemType;
  status: SrsStatus;
  ease: number; // 默认 2.5
  interval: number; // 分钟（<1440）或天（>=1 表示天）
  intervalUnit: 'minute' | 'day';
  dueAt: string; // ISO
  repetitions: number;
  lapses: number;
  lastReviewedAt: string | null;
  createdAt: string;
}

// ---------- 学习会话 ----------
export interface StudyItem {
  itemId: string;
  type: LearnItemType;
  kind: 'new' | 'review';
}
export interface StudySession {
  id: string;
  mode: 'root' | 'review' | 'challenge';
  queue: StudyItem[];
  cursor: number;
  startedAt: string;
  correctCount: number;
  totalCount: number;
  finishedAt: string | null;
}

// ---------- 设置 / 收藏 ----------
export interface Settings {
  plan: PlanMinutes; // 5 | 10 | 20 | 30
  theme: ThemeMode;
  onboardingDone: boolean;
  dailyNewTarget: number; // 由 plan 推导：3/5/10/15
  dailyReviewTarget: number; // 5/10/20/30
  splitMode: 'learn' | 'etymology'; // 拆词页默认视图
  /** 首次诊断测得的英语基础：weak | mid | strong（用于初始学习画像） */
  level?: 'weak' | 'mid' | 'strong';
  /** 学习目标：daily / reading / work / tech / exam / overall */
  goal?: 'daily' | 'reading' | 'work' | 'tech' | 'exam' | 'overall';
}
export type FavoriteKind = 'word' | 'root' | 'family' | 'mistake' | 'note';
export interface Favorite {
  id: string;
  kind: FavoriteKind;
  refId: string;
  note?: string;
  createdAt: string;
}
export interface MistakeRecord {
  itemId: string;
  type: LearnItemType;
  wrongCount: number;
  lastWrongAt: string;
}
export interface DailyLog {
  date: string; // 'YYYY-MM-DD'
  newLearned: number;
  reviewed: number;
  correct: number;
  total: number;
}

// ---------- 学习队列 / 拆词结果 ----------
export interface SplitResult {
  input: string;
  success: boolean;
  parts: WordPart[];
  reliability: Reliability;
  warning: string | null;
  matchedWordId: string | null;
  suggestions: string[];
}
