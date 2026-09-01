import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type ErrorStateCardProps = {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export default function ErrorStateCard({
  title,
  description,
  onRetry,
  retryLabel = 'Retry',
  secondaryAction,
  icon: Icon = AlertTriangle,
  className = ''
}: ErrorStateCardProps) {
  return (
    <div className={`rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm ${className}`}>
      <Icon className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-black text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {(onRetry || secondaryAction) ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry ? (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {retryLabel}
            </button>
          ) : null}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
