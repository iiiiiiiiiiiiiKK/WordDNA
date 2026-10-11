// ============================================================
// 路由路径常量（唯一真源） ARCHITECTURE.md §10.4
// ============================================================
export const ROUTES = {
  dashboard: '/',
  study: '/study',
  plan: '/plan',
  split: '/split',
  roots: '/roots',
  rootFamily: (rootId: string) => `/roots/${rootId}`,
  wordDetail: (wordId: string) => `/word/${wordId}`,
  graph: (rootId?: string) => (rootId ? `/graph/${rootId}` : '/graph'),
  mistakes: '/mistakes',
  favorites: '/favorites',
  stats: '/stats',
  search: '/search',
  settings: '/settings',
  notFound: '*',
} as const;

export const BOTTOM_TABS = [
  { to: ROUTES.dashboard, label: '首页', icon: 'home' as const },
  { to: ROUTES.study, label: '学习', icon: 'book' as const },
  { to: ROUTES.split, label: '拆词', icon: 'split' as const },
  { to: ROUTES.roots, label: '词根', icon: 'root' as const },
  { to: ROUTES.stats, label: '我的', icon: 'user' as const },
];

export const SIDEBAR_ITEMS = [
  { to: ROUTES.dashboard, label: '首页', icon: 'home' as const },
  { to: ROUTES.study, label: '学习', icon: 'book' as const },
  { to: ROUTES.split, label: '拆词', icon: 'split' as const },
  { to: ROUTES.roots, label: '词根', icon: 'root' as const },
  { to: ROUTES.graph(), label: '图谱', icon: 'graph' as const },
  { to: ROUTES.favorites, label: '收藏', icon: 'star' as const },
  { to: ROUTES.mistakes, label: '错题', icon: 'alert' as const },
  { to: ROUTES.stats, label: '统计', icon: 'chart' as const },
  { to: ROUTES.settings, label: '设置', icon: 'gear' as const },
];
