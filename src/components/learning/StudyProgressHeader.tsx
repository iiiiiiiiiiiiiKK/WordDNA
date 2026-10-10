import { ProgressBar } from '@/components/common/ProgressBar';

interface StudyProgressHeaderProps {
  cursor: number; // 已完成数量
  total: number;
  correct: number;
}

export function StudyProgressHeader({ cursor, total, correct }: StudyProgressHeaderProps) {
  const pct = total > 0 ? Math.min(cursor, total) / total : 0;
  const current = Math.min(cursor + 1, total);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>
          第 {total === 0 ? 0 : current} / {total} 题
        </span>
        <span>答对 {correct}</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}
