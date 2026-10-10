import { useMediaQuery } from './useMediaQuery';

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

// 断点：<768 mobile，768–1439 tablet，>=1440 desktop
export function useLayoutMode(): LayoutMode {
  const isDesktop = useMediaQuery('(min-width: 1440px)');
  const isTablet = useMediaQuery('(min-width: 768px)');
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}
