import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { BOTTOM_TABS } from '@/lib/routes';
import { BRAND } from '@/lib/brand';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';

export function AppTitle(pathname: string): string {
  if (pathname.startsWith('/study')) return '学习';
  if (pathname.startsWith('/split')) return '拆词';
  if (pathname.startsWith('/roots')) return '词根';
  if (pathname.startsWith('/word')) return '单词详情';
  if (pathname.startsWith('/mistakes')) return '错题';
  if (pathname.startsWith('/favorites')) return '收藏';
  if (pathname.startsWith('/stats')) return '我的';
  if (pathname.startsWith('/search')) return '搜索';
  if (pathname.startsWith('/settings')) return '设置';
  return 'WordDNA';
}

export function TopBar({ title }: { title?: string }) {
  const navigate = useNavigate();
  const theme = useSettingsStore((s) => s.settings.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const pathname = window.location.pathname;
  const heading = title ?? AppTitle(pathname);

  // 仅当处于一级底部 Tab 路由时才隐藏返回按钮，其余（词根详情/单词详情/图谱/错题库等）均显示
  const isTopLevel = BOTTOM_TABS.some((t) => t.to === '/' ? pathname === '/' : pathname === t.to || pathname.startsWith(t.to + '/'));
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    // bg-paper：和 App 底色（米黄 #F5F2EA）同色，和 iOS 状态栏连成一片，
    // 添加到主屏幕后看起来是一个整体，而不是「白条 + 米黄页」。
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-paper/95 backdrop-blur px-3 h-14">
      {!isTopLevel && (
        <button
          onClick={goBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2"
          aria-label="返回"
        >
          <Icon name="arrow-left" size={22} />
        </button>
      )}
      <h1 className="text-lg font-semibold text-text flex-1 truncate">{heading}</h1>
      {/* 作者 X 外链：跟在字标旁边，新标签页打开。窄屏只留 𝕏 图标，避免挤掉搜索/主题按钮 */}
      <a
        href={BRAND.xUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`X ${BRAND.xHandle}`}
        className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-surface-2 px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:border-ink hover:bg-accent/20 hover:text-text"
      >
        <span aria-hidden="true">𝕏</span>
        <span className="hidden sm:inline">{BRAND.xHandle}</span>
      </a>
      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2"
        aria-label="搜索"
      >
        <Icon name="search" size={20} />
      </button>
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2"
        aria-label="切换主题"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
      </button>
      <button
        onClick={() => navigate('/roots')}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 xl:hidden"
        aria-label="词根"
      >
        <Icon name="root" size={20} />
      </button>
    </header>
  );
}
