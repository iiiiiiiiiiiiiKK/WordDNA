import { useMediaQuery } from './useMediaQuery';

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

// 断点：<768 mobile，768–1279 tablet，>=1280 desktop
//
// ⚠️ 这个 1280 必须保证「桌面壳里侧栏一定可见」：
// 桌面分支只渲染 Sidebar + main，不渲染 TopBar / BottomNav，
// 所以 Sidebar 的显示断点必须 ≤1280，否则会出现
// 「无顶栏 + 无底栏 + 无侧栏」的导航真空。当前 Sidebar 用 lg:(1024)，安全。
//
// 早前这里写 1440px，导致 1280–1439（1366×768 笔记本、未最大化窗口）明明够宽
// 却仍走移动端单列布局、内容被拉伸到整个窗口，大屏阅读非常费劲。
//
// ⚠️ tailwind.config.ts 的 screens 是覆盖不是 extend：
// xl = 1440px（不是 Tailwind 默认的 1280）、2xl = 1536px，另自定义 desk = 1280px。
// 桌面专属字号/间距统一用 desk:；RightRail 用 2xl:(1536)，
// 所以 1280–1535 不显示右栏（宽度留给正文），是预期行为而非 bug。
export function useLayoutMode(): LayoutMode {
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isTablet = useMediaQuery('(min-width: 768px)');
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}
