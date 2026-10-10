import { NavLink } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '@/lib/routes';
import { Icon, type IconName } from '@/components/common/Icon';
import { ProgressRing } from '@/components/viz/ProgressRing';
import { useLearningStore } from '@/store/useLearningStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { overallMastery } from '@/lib/mastery';
import { classNames } from '@/lib/utils';

function useOverallMasteryPct(): number {
  const states = useLearningStore((s) => s.states);
  return Math.round(overallMastery(states) * 100);
}

export function Sidebar() {
  const pct = useOverallMasteryPct();
  return (
    <aside className="hidden xl:flex w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-root text-white font-bold">W</div>
        <div className="leading-tight">
          <div className="font-semibold text-text">WordDNA</div>
          <div className="text-[11px] text-muted">单词DNA</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-root/10 text-root' : 'text-muted hover:bg-surface-2 hover:text-text',
              )
            }
          >
            <Icon name={it.icon as IconName} size={20} />
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-4">
          <ProgressRing value={pct / 100} size={52} stroke={5} label={`${pct}%`} />
          <div className="text-sm">
            <div className="text-text font-medium">总体掌握度</div>
            <div className="text-muted text-xs">继续学习解锁更多</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
