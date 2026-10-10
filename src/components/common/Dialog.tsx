import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2"
            aria-label="关闭"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="text-sm text-text break-safe">{children}</div>
        {footer && <div className="mt-5 flex gap-3">{footer}</div>}
      </div>
    </div>
  );
}
