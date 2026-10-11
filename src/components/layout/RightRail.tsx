import { Link } from 'react-router-dom';
import { ProgressRing } from '@/components/viz/ProgressRing';
import { StreakBadge } from '@/components/viz/StreakBadge';
import { useLearningStore } from '@/store/useLearningStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { overallMastery } from '@/lib/mastery';
import { getRoots } from '@/data';
import { Icon } from '@/components/common/Icon';

export function RightRail() {
  const states = useLearningStore((s) => s.states);
  const streak = useSettingsStore((s) => s.getStreak());
  const pct = Math.round(overallMastery(states) * 100);
  const rootCount = getRoots().length;

  return (
    // 只在真正宽的屏（2xl = 1536px+）才出现：1280–1535 这一档留给正文，
    // 否则「侧栏 256 + 右栏 288」会把正文压到 670px，中等桌面反而更挤。
    <aside className="hidden 2xl:flex w-72 shrink-0 flex-col gap-4 border-l border-border bg-bg px-5 py-8 overflow-y-auto">
      <div className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-4">
        <ProgressRing value={pct / 100} size={56} stroke={5} label={`${pct}%`} />
        <div>
          <div className="text-sm font-semibold text-text">总体掌握度</div>
          <div className="text-xs text-muted">{rootCount} 个词根 · 持续进步</div>
        </div>
      </div>

      <Link
        to="/study"
        className="flex items-center gap-3 rounded-2xl bg-root px-4 py-3 text-white hover:opacity-90"
      >
        <Icon name="play" size={18} />
        <span className="font-medium">开始学习</span>
      </Link>

      <div className="flex items-center gap-2">
        <StreakBadge streak={streak} />
      </div>

      <div className="rounded-2xl bg-surface border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text">今日词根</span>
          <Link to="/roots" className="text-xs text-root">
            全部
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {getRoots()
            .slice(0, 8)
            .map((r) => (
              <Link
                key={r.id}
                to={`/roots/${r.id}`}
                className="rounded-full bg-surface-2 px-3 py-1 text-sm text-word hover:text-root"
              >
                {r.root}
              </Link>
            ))}
        </div>
      </div>
    </aside>
  );
}
