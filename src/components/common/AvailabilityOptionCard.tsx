import { CheckCircle2 } from 'lucide-react';

type AvailabilityOptionCardProps = {
  label: string;
  description: string;
  colorClass: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export default function AvailabilityOptionCard({
  label,
  description,
  colorClass,
  active,
  disabled,
  onClick
}: AvailabilityOptionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border-2 p-4 text-left transition-colors ${
        active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/40'
      } disabled:opacity-60`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-4 w-4 rounded-full ${colorClass}`} aria-hidden="true" />
          <div>
            <p className="font-bold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {active ? <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" /> : null}
      </div>
    </button>
  );
}
