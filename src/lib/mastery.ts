// ============================================================
// Root Mastery 加权掌握度
// ARCHITECTURE.md §3.3 / PRD §16
// ============================================================
import type { LearningState } from '@/types/domain';
import { statusWeight } from './srs';
import { getRootById } from '@/data';

export interface RootMasteryResult {
  rootId: string;
  ratio: number;
  masteredWords: number;
  totalWords: number;
  mastered: number;
  learning: number;
  review: number;
  newCount: number;
}

export function rootMastery(rootId: string, states: Record<string, LearningState>): RootMasteryResult {
  const root = getRootById(rootId);
  const wordIds = root?.words ?? [];
  let sum = 0;
  let mastered = 0;
  let learning = 0;
  let review = 0;
  let newCount = 0;
  for (const wid of wordIds) {
    const st = states[wid];
    const w = st ? statusWeight(st.status) : 0;
    sum += w;
    if (!st || st.status === 'new') newCount++;
    else if (st.status === 'mastered') mastered++;
    else if (st.status === 'learning') learning++;
    else if (st.status === 'review') review++;
  }
  const total = wordIds.length || 1;
  return {
    rootId,
    ratio: sum / total,
    masteredWords: mastered,
    totalWords: wordIds.length,
    mastered,
    learning,
    review,
    newCount,
  };
}

export function overallMastery(states: Record<string, LearningState>): number {
  const ids = Object.keys(states);
  if (ids.length === 0) return 0;
  let sum = 0;
  for (const id of ids) sum += statusWeight(states[id].status);
  return sum / ids.length;
}
