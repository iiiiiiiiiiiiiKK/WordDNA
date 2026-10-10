import { NavLink } from 'react-router-dom';
import { BOTTOM_TABS } from '@/lib/routes';
import { Icon, type IconName } from '@/components/common/Icon';
import { classNames } from '@/lib/utils';

export function BottomNav() {
  return (
    // 与顶栏一致用 paper：上下两条系统级栏和页面底色同色，整体感更强
    <nav className="shrink-0 border-t border-border bg-paper/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {BOTTOM_TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              classNames(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[11px] font-medium transition-colors',
                isActive ? 'text-root' : 'text-muted',
              )
            }
          >
            <Icon name={t.icon as IconName} size={22} />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
