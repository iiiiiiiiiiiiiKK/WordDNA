import { useEffect } from 'react';

/**
 * 页面滚动位置记忆：从列表页点进详情、再返回时回到原来那一屏。
 *
 * 注意：本应用的滚动容器不是 window，而是 AppShell 的 <main data-app-scroll>，
 * 所以不能用 window.scrollY，必须对这个容器读写。
 *
 * 用 sessionStorage（同标签页内有效、关掉即忘），和「词库浏览」那种长期记忆区分开。
 */
export function useScrollRestore(key: string): void {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-app-scroll]');
    if (!el) return;
    const k = `worddna.scroll.${key}`;

    const saved = Number(sessionStorage.getItem(k) ?? '');
    if (saved > 0) {
      requestAnimationFrame(() => {
        el.scrollTop = saved;
      });
    }

    let timer: number | null = null;
    const onScroll = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        sessionStorage.setItem(k, String(el.scrollTop));
      }, 200);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (timer) window.clearTimeout(timer);
    };
  }, [key]);
}
