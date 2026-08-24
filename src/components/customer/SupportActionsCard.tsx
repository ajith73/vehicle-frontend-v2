import { MapPin, Phone, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CustomerRequest } from '../../types';

interface SupportActionsCardProps {
  request: CustomerRequest;
}

export function SupportActionsCard({ request }: SupportActionsCardProps) {
  const shareSummary = async () => {
    const text = `RoadResQ request #${request.id}\nStatus: ${request.status}\nIssue: ${request.issueSummary}\nLocation: ${request.addressText || `${request.latitude}, ${request.longitude}`}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `RoadResQ Request #${request.id}`,
          text,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Request summary copied to clipboard');
    } catch {
      toast.error('Failed to share request summary');
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm font-bold text-foreground">Support actions</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {request.Mechanic?.phone?.[0]?.number ? (
          <a
            href={`tel:${request.Mechanic.phone[0].number}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary"
          >
            <Phone className="h-4 w-4 text-primary" />
            Call mechanic
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-muted-foreground opacity-60"
          >
            <Phone className="h-4 w-4" />
            Call mechanic
          </button>
        )}

        <a
          href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary"
        >
          <MapPin className="h-4 w-4 text-primary" />
          Open location
        </a>

        <button
          onClick={shareSummary}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Share2 className="h-4 w-4" />
          Share summary
        </button>
      </div>
    </div>
  );
}
