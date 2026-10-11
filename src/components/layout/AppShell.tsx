import { Outlet, useLocation } from 'react-router-dom';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { RightRail } from './RightRail';
import { TopBar } from './TopBar';
import { AppTitle } from './TopBar';

export function AppShell() {
  const mode = useLayoutMode();
  const { pathname } = useLocation();

  if (mode === 'desktop') {
    return (
      <div className="h-full flex">
        <Sidebar />
        <main data-app-scroll className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-8">
            <Outlet />
          </div>
        </main>
        <RightRail />
      </div>
    );
  }

  // mobile / tablet
  return (
    <div className="h-full flex flex-col">
      <TopBar title={AppTitle(pathname)} />
      <main data-app-scroll className="flex-1 min-w-0 overflow-y-auto px-4 pb-4 pt-3">
        {/* 手机保持满宽（max-w 不生效）；平板 / 未最大化的笔记本窗口限制阅读宽度。
            否则内容会被拉伸到整个窗口，行长过长、留白失衡，大屏上看着很费劲。 */}
        <div className="mx-auto w-full max-w-[820px]">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
