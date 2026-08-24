import { useEffect, useState } from 'react';
import { Activity, MapPin, Radio, ShieldAlert, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/apiClient';
import type { CustomerRequest, Mechanic } from '../types';

type OverrideDraft = Record<number, { mechanicId: string; reason: string; notes: string }>;
type SupportDraft = Record<number, { subject: string; description: string; priority: string }>;

export default function AdminLiveOperations() {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideDrafts, setOverrideDrafts] = useState<OverrideDraft>({});
  const [supportDrafts, setSupportDrafts] = useState<SupportDraft>({});
  const [savingRequestId, setSavingRequestId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const [liveRequests, liveMechanics] = await Promise.all([
          apiClient<CustomerRequest[]>('/admin/live/requests'),
          apiClient<Mechanic[]>('/admin/live/mechanics'),
        ]);

        if (!cancelled) {
          setRequests(liveRequests);
          setMechanics(liveMechanics);
        }
      } catch (error: any) {
        if (!cancelled && !silent) {
          toast.error(error.message || 'Failed to load live operations');
        }
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = window.setInterval(() => {
      load(true);
    }, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const onlineMechanics = mechanics.filter((mechanic) => mechanic.isOnline || mechanic.MechanicLiveState?.isOnline);
  const activeRequests = requests.filter((request) => ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'SERVICE_STARTED'].includes(request.status));

  const handleOverride = async (requestId: number) => {
    const draft = overrideDrafts[requestId];
    if (!draft?.reason?.trim()) {
      toast.error('Override reason is required');
      return;
    }

    setSavingRequestId(requestId);
    try {
      await apiClient(`/admin/requests/${requestId}/dispatch/override`, {
        method: 'POST',
        data: {
          mechanicId: draft.mechanicId ? Number(draft.mechanicId) : undefined,
          overrideType: draft.mechanicId ? 'MANUAL_REASSIGN' : 'LOCK_DISPATCH',
          reason: draft.reason.trim(),
          notes: draft.notes.trim() || undefined,
        },
      });
      toast.success('Dispatch override applied');
      const refreshed = await apiClient<CustomerRequest[]>(`/admin/live/requests`);
      setRequests(refreshed);
    } catch (error: any) {
      toast.error(error.message || 'Failed to override dispatch');
    } finally {
      setSavingRequestId(null);
    }
  };

  const handleEscalation = async (requestId: number) => {
    const draft = supportDrafts[requestId];
    if (!draft?.subject?.trim()) {
      toast.error('Support subject is required');
      return;
    }

    setSavingRequestId(requestId);
    try {
      await apiClient(`/admin/requests/${requestId}/support/escalate`, {
        method: 'POST',
        data: {
          subject: draft.subject.trim(),
          description: draft.description.trim() || undefined,
          priority: draft.priority || 'NORMAL',
        },
      });
      toast.success('Support escalation created');
      const refreshed = await apiClient<CustomerRequest[]>(`/admin/live/requests`);
      setRequests(refreshed);
    } catch (error: any) {
      toast.error(error.message || 'Failed to escalate support');
    } finally {
      setSavingRequestId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm">
        Loading live operations control tower...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Phase 6</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">Live Operations Control Tower</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          This view tracks active demand, online supply, dispatch retries, and support interventions using the current admin shell and theme.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary"><Activity className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.2em]">Active Requests</span></div>
          <p className="mt-3 text-3xl font-black text-foreground">{activeRequests.length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary"><Radio className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.2em]">Online Supply</span></div>
          <p className="mt-3 text-3xl font-black text-foreground">{onlineMechanics.length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary"><ShieldAlert className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.2em]">Open Support</span></div>
          <p className="mt-3 text-3xl font-black text-foreground">{requests.reduce((sum, request) => sum + (request.SupportTickets?.filter((ticket) => ticket.status === 'OPEN').length || 0), 0)}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary"><Wrench className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.2em]">Trusted Online</span></div>
          <p className="mt-3 text-3xl font-black text-foreground">{onlineMechanics.filter((mechanic) => mechanic.isTrustedPartner).length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {requests.map((request) => {
            const overrideDraft = overrideDrafts[request.id] || { mechanicId: '', reason: '', notes: '' };
            const supportDraft = supportDrafts[request.id] || { subject: '', description: '', priority: 'NORMAL' };

            return (
              <div key={request.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">#{request.id} {request.issueSummary}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {request.CustomerUser?.CustomerProfile?.displayName || request.CustomerUser?.email || 'Customer'} • {request.addressText || `${request.latitude}, ${request.longitude}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{request.status}</span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{request.dispatchStatus || 'DISPATCH_PENDING'}</span>
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-foreground">
                      ETA {request.currentEtaMinutes != null ? `${request.currentEtaMinutes} min` : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Assigned Partner</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{request.Mechanic?.businessName || request.Mechanic?.name || 'No partner yet'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {request.Mechanic?.availabilityState || (request.Mechanic?.isOnline ? 'ONLINE' : 'OFFLINE')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Dispatch Attempts</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{request.RequestDispatchAttempts?.length || 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{request.RequestDispatchAttempts?.[0]?.attemptStatus || 'No attempts yet'}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Support Queue</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{request.SupportTickets?.[0]?.status || 'No ticket'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{request.SupportTickets?.[0]?.priority || 'NORMAL'}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-sm font-bold text-foreground">Dispatch override</p>
                    <div className="mt-3 space-y-3">
                      <select
                        value={overrideDraft.mechanicId}
                        onChange={(event) => setOverrideDrafts((current) => ({
                          ...current,
                          [request.id]: { ...overrideDraft, mechanicId: event.target.value },
                        }))}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Lock without reassignment</option>
                        {mechanics
                          .filter((mechanic) => mechanic.status === 'Approved')
                          .map((mechanic) => (
                            <option key={mechanic.id} value={mechanic.id}>
                              {mechanic.businessName || mechanic.name} ({mechanic.availabilityState || 'UNKNOWN'})
                            </option>
                          ))}
                      </select>
                      <input
                        value={overrideDraft.reason}
                        onChange={(event) => setOverrideDrafts((current) => ({
                          ...current,
                          [request.id]: { ...overrideDraft, reason: event.target.value },
                        }))}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                        placeholder="Why are you overriding this dispatch?"
                      />
                      <textarea
                        value={overrideDraft.notes}
                        onChange={(event) => setOverrideDrafts((current) => ({
                          ...current,
                          [request.id]: { ...overrideDraft, notes: event.target.value },
                        }))}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                        placeholder="Optional operator notes"
                      />
                      <button
                        onClick={() => handleOverride(request.id)}
                        disabled={savingRequestId === request.id}
                        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        Apply override
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-sm font-bold text-foreground">Support escalation</p>
                    <div className="mt-3 space-y-3">
                      <input
                        value={supportDraft.subject}
                        onChange={(event) => setSupportDrafts((current) => ({
                          ...current,
                          [request.id]: { ...supportDraft, subject: event.target.value },
                        }))}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                        placeholder="Support subject"
                      />
                      <select
                        value={supportDraft.priority}
                        onChange={(event) => setSupportDrafts((current) => ({
                          ...current,
                          [request.id]: { ...supportDraft, priority: event.target.value },
                        }))}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                      <textarea
                        value={supportDraft.description}
                        onChange={(event) => setSupportDrafts((current) => ({
                          ...current,
                          [request.id]: { ...supportDraft, description: event.target.value },
                        }))}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                        placeholder="What is stuck or delayed?"
                      />
                      <button
                        onClick={() => handleEscalation(request.id)}
                        disabled={savingRequestId === request.id}
                        className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-60"
                      >
                        Escalate support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-bold text-foreground">Online Supply Feed</p>
            <div className="mt-4 space-y-3">
              {mechanics.slice(0, 12).map((mechanic) => (
                <div key={mechanic.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{mechanic.businessName || mechanic.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{[mechanic.city, mechanic.state].filter(Boolean).join(', ') || 'Location unavailable'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      mechanic.isOnline || mechanic.MechanicLiveState?.isOnline
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {(mechanic.isOnline || mechanic.MechanicLiveState?.isOnline) ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{mechanic.availabilityState || mechanic.MechanicLiveState?.availabilityState || 'OFFLINE'}</span>
                  </div>
                  {mechanic.lastActiveAt && (
                    <p className="mt-2 text-xs text-muted-foreground">Last active: {new Date(mechanic.lastActiveAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
