import type { ReactNode } from 'react';
import { Card } from '@/components/common/Card';

interface StudyCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function StudyCard({ title, children, className }: StudyCardProps) {
  return (
    <Card className={['animate-pop-in', className].filter(Boolean).join(' ')}>
      {title && (
        <h2 className="mb-3 border-b-2 border-ink pb-2 font-display text-base font-black tracking-widest text-text">
          {title}
        </h2>
      )}
      {children}
    </Card>
  );
}
