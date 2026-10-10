// ============================================================
// 内联 SVG 图标集（零图标库依赖）
// ============================================================
import type { SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'book'
  | 'split'
  | 'root'
  | 'user'
  | 'star'
  | 'alert'
  | 'chart'
  | 'gear'
  | 'search'
  | 'sun'
  | 'moon'
  | 'check'
  | 'x'
  | 'chevron-right'
  | 'chevron-down'
  | 'plus'
  | 'heart'
  | 'arrow-left'
  | 'arrow-right'
  | 'rotate'
  | 'info'
  | 'sparkles'
  | 'menu'
  | 'play'
  | 'shuffle'
  | 'flame'
  | 'bookmark'
  | 'graph';

const PATHS: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 3v16',
  split: 'M12 3v18M5 8l0 8M19 8l0 8M5 12h14',
  root: 'M12 21v-6m0 0a4 4 0 0 0 4-4 4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0 4 4Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  star: 'm12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9z',
  alert: 'M12 4 2 20h20L12 4Zm0 6v5m0 3v.5',
  chart: 'M4 20V4M4 20h16M8 16l3-5 3 3 4-7',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 4 2-1-1.5-2.5 1-2.5-2.5-1-1.5-2.5h-3L9 2.5 6.5 3.5 4 4.5l1 2.5L3.5 9.5 4 11l-2 1 1.5 2.5-1 2.5 2.5 1L9 21.5h3l1.5-2.5 2.5 1 1-2.5z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm6 13 4 4',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v3M12 20v3M4 12H1M23 12h-3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  moon: 'M21 12.8A8 8 0 1 1 11.2 3 6 6 0 0 0 21 12.8Z',
  check: 'M5 12.5 10 17 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  'chevron-right': 'M9 5l7 7-7 7',
  'chevron-down': 'M5 9l7 7 7-7',
  plus: 'M12 5v14M5 12h14',
  heart: 'M12 20s-7-4.6-9.3-9A4.8 4.8 0 0 1 12 5a4.8 4.8 0 0 1 9.3 6c-2.3 4.4-9.3 9-9.3 9Z',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  rotate: 'M21 12a9 9 0 1 1-3-6.7M21 4v4h-4',
  info: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 8v5m0-9v.5',
  sparkles: 'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  play: 'M6 4l14 8-14 8z',
  shuffle: 'M4 5h3l9 14h3M4 19h3l3-5M15 5h5M17 16l3 3M20 16l-3 3',
  flame: 'M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4M12 21a3 3 0 0 0 3-3',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  graph: 'M4 18 10 8l5 5 5-9M4 18h16M10 8a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Zm5 5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z',
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const d = PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
