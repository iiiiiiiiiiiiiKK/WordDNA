import { useMediaQuery } from './useMediaQuery';

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

// 断点：<768 mobile，768–1279 tablet，>=1280 desktop
//
// ⚠️ 桌面阈值必须和侧边栏/右栏的 Tailwind 断点保持一致：
// Sidebar / RightRail 用的是 `xl:`（=1280px）。早前这里写 1440px，
// 导致 1280–1439 这一大段（1366×768 笔记本、未最大化的窗口）明明够宽
// 却仍走「移动端单列」布局，内容被拉伸到整个窗口，大屏上阅读非常费劲。
export function useLayoutMode(): LayoutMode {
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isTablet = useMediaQuery('(min-width: 768px)');
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}
