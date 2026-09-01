type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'primary';
  className?: string;
};

export default function MetricCard({ label, value, tone = 'default', className = '' }: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        tone === 'primary' ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'
      } ${className}`}
    >
      <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${tone === 'primary' ? 'text-primary' : 'text-muted-foreground'}`}>
        {label}
      </p>
      <div className="mt-2 text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}
