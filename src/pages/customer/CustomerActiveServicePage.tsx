import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Loader2, MapPin, Navigation, Phone, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import { RequestTimeline } from '../../components/customer/RequestTimeline';
import { SupportActionsCard } from '../../components/customer/SupportActionsCard';
import type { CustomerRequest } from '../../types';
import { customerCancellationReasons, getRequestStatusMeta, getRequestToneClasses, isCancellableRequestStatus } from '../../lib/requestLifecycle';
import { trackEvent } from '../../utils/analytics';

export default function CustomerActiveServicePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [request, setRequest] = useState<CustomerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>(customerCancellationReasons[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    let closed = false;

    const closeStream = openRealtimeStream<CustomerRequest>(`/customer/requests/${id}/stream`, {
      event: 'request:update',
      onMessage: (res) => {
        if (closed) return;
        setRequest(res);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
        setLoading(false);
      },
      onError: async () => {
        if (closed) return;
        setConnectionLost(true);
        try {
          const res = await apiClient<CustomerRequest>(`/customer/requests/${id}/status`);
          if (closed) return;
          setRequest(res);
          setLastUpdatedAt(new Date().toISOString());
          setLoading(false);
        } catch (err) {
          console.error('Failed to fetch request', err);
          setLoading(false);
        }
      }
    });

    return () => {
      closed = true;
      closeStream();
    };
  }, [id]);

  const statusMeta = useMemo(() => getRequestStatusMeta(request?.status), [request?.status]);

  const cancelRequest = async () => {
    if (!request || !isCancellableRequestStatus(request.status)) return;
    setSaving(true);
    try {
      await apiClient(`/customer/requests/${request.id}/cancel`, {
        method: 'PUT',
        data: { reason: cancelReason, details: cancelReason === 'Other' ? 'Cancelled from active request screen' : undefined }
      });
      trackEvent('Customer', 'REQUEST_CANCELLED', cancelReason);
      toast.success('Request cancelled');
      navigate('/customer/requests');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request');
    } finally {
      setSaving(false);
    }
  };

  const shareLocation = async () => {
    if (!request) return;
    const url = `https://www.google.com/maps?q=${request.latitude},${request.longitude}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `RoadResQ request #${request.id}`, text: request.addressText || url, url });
        trackEvent('Customer', 'LOCATION_SELECTED', 'share-location');
        return;
      }
      await navigator.clipboard.writeText(url);
      trackEvent('Customer', 'LOCATION_SELECTED', 'copy-location-link');
      toast.success('Location link copied');
    } catch {
      toast.error('Failed to share location');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-lg font-bold text-foreground">Request not found</p>
          <Link to="/customer" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Active Service</p>
              <h1 className="mt-2 text-3xl font-black text-foreground">{statusMeta.headline}</h1>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{request.issueSummary} for {request.vehicleLabel || 'your vehicle'}</p>
            </div>
            <div className={`rounded-full border px-4 py-2 text-sm font-bold ${getRequestToneClasses(request.status)}`}>
              {statusMeta.label}
            </div>
          </div>

          {connectionLost && (
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              Connection lost. Trying to reconnect...
              {lastUpdatedAt ? ` Last updated ${new Date(lastUpdatedAt).toLocaleTimeString('en-IN')}.` : ''}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="h-56 bg-secondary/50 p-4">
                <div className="flex h-full flex-col justify-between rounded-[1.5rem] border border-border/50 bg-background/60 p-4">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {request.addressText || `${request.latitude}, ${request.longitude}`}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                      <Navigation className="h-4 w-4" />
                      Open map
                    </a>
                    <button onClick={shareLocation} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      Share location
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <RequestTimeline request={request} />
            <SupportActionsCard request={request} />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-bold text-foreground">Partner</p>
              <p className="mt-3 text-lg font-black text-foreground">{request.Mechanic?.businessName || request.Mechanic?.name || 'Awaiting partner assignment'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{request.currentEtaMinutes != null ? `ETA ${request.currentEtaMinutes} min` : 'ETA will appear after live assignment'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{request.Mechanic?.availabilityState || request.dispatchStatus || 'Dispatch in progress'}</p>
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-bold text-foreground">Emergency & safety</p>
                  <p className="mt-2 text-sm text-muted-foreground">Use emergency services first for severe incidents, then continue with RoadResQ support.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <a href="tel:112" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white">
                  <Phone className="h-4 w-4" />
                  Call 112
                </a>
                <Link to="/emergency" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Open Emergency Hub
                </Link>
                <Link to={`/customer/support?requestId=${request.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Contact RoadResQ
                </Link>
              </div>
            </div>

            {isCancellableRequestStatus(request.status) && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm font-bold text-foreground">Need to cancel?</p>
                <select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none">
                  {customerCancellationReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
                <button onClick={cancelRequest} disabled={saving} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground disabled:opacity-60">
                  {saving ? 'Cancelling...' : 'Cancel request'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
