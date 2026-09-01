import type { LucideIcon } from 'lucide-react';

type EmptyStateCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export default function EmptyStateCard({ icon: Icon, title, description, action, className = '' }: EmptyStateCardProps) {
  return (
    <div className={`rounded-[2rem] border border-border bg-card px-6 py-16 text-center shadow-sm ${className}`}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-black text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
