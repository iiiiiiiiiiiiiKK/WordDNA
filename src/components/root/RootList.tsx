import type { Root } from '@/types/domain';
import { RootCard } from './RootCard';

interface RootListProps {
  roots: Root[];
  className?: string;
}

export function RootList({ roots, className }: RootListProps) {
  if (roots.length === 0) return null;
  return (
    // 卡片现在自带整个家族词，内容变宽，改成单列铺满；多列会把每行挤得读不了
    <div className={['grid grid-cols-1 gap-3', className].filter(Boolean).join(' ')}>
      {roots.map((r) => (
        <RootCard key={r.id} root={r} />
      ))}
    </div>
  );
}
