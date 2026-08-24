import { Clock3 } from 'lucide-react';
import type { CustomerRequest } from '../../types';
import { getRequestStatusMeta } from '../../lib/requestLifecycle';

interface RequestTimelineProps {
  request: CustomerRequest;
}

export function RequestTimeline({ request }: RequestTimelineProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-primary" />
        <p className="text-sm font-bold text-foreground">Timeline</p>
      </div>
      <div className="mt-4 space-y-3">
        {request.RequestTimelineEvents && request.RequestTimelineEvents.length > 0 ? (
          request.RequestTimelineEvents.map((event) => (
            <div key={event.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-foreground">{getRequestStatusMeta(event.toStatus || event.fromStatus || event.eventType).label}</p>
                <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.actorType}
                {event.fromStatus || event.toStatus ? ` | ${event.fromStatus || 'START'} -> ${event.toStatus || 'END'}` : ''}
              </p>
              {event.notes && <p className="mt-2 text-sm text-foreground">{event.notes}</p>}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No timeline events yet.</p>
        )}
      </div>
    </div>
  );
}
