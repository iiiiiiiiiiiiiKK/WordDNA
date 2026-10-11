// ============================================================
// 主题解析与 DOM 应用（light / dark / system）
// ============================================================
import type { ThemeMode } from '@/types/domain';

const STORAGE_KEY = 'wd:themeMode';

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function applyTheme(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  syncSystemChrome(resolved);
}

/**
 * 让「系统顶栏」和 App 顶部同色，添加到主屏幕后像一个原生 App。
 *
 * 关键事实（踩坑点）：
 * - iOS 完全忽略 <meta name="theme-color">，只认 apple-mobile-web-app-status-bar-style
 *   （只能选 default/black/black-translucent，不能指定颜色）或 manifest 的 status_bar。
 * - manifest 的 status_bar **不支持 prefers-color-scheme 媒体查询**，所以深浅两套得准备
 *   两份 manifest，在这里按当前主题切换 href。
 * - 该字段只在「添加到主屏幕」后生效；改完必须彻底退出 PWA 再从图标启动才会看到。
 */
function syncSystemChrome(resolved: 'light' | 'dark'): void {
  const link = document.getElementById('app-manifest') as HTMLLinkElement | null;
  if (link) {
    const href = resolved === 'dark'
      ? `${import.meta.env.BASE_URL}manifest-dark.webmanifest`
      : `${import.meta.env.BASE_URL}manifest.webmanifest`;
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }
}

export function getStoredThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ThemeMode;
  } catch {
    /* noop */
  }
  return 'system';
}

export function setStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mode));
  } catch {
    /* noop */
  }
}

let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

export function initTheme(): void {
  const mode = getStoredThemeMode();
  applyTheme(resolveTheme(mode));
  // 监听系统主题（仅 system 模式生效）
  if (typeof window !== 'undefined') {
    if (mediaListener) window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaListener);
    mediaListener = (e: MediaQueryListEvent) => {
      if (getStoredThemeMode() === 'system') applyTheme(e.matches ? 'dark' : 'light');
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', mediaListener);
  }
}
