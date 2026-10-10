import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = '出了点问题。', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <Icon name="alert" size={26} />
      </div>
      <h3 className="text-base font-semibold text-text">加载失败</h3>
      <p className="text-sm text-muted max-w-xs break-safe">{message}</p>
      {onRetry && (
        <Button variant="subtle" size="sm" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  );
}
