import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileText, Loader2, MapPin, Navigation, Phone, RefreshCw, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import { RequestTimeline } from '../../components/customer/RequestTimeline';
import { SupportActionsCard } from '../../components/customer/SupportActionsCard';
import { useTheme } from '../../contexts/ThemeContext';
import type { CustomerRequest } from '../../types';
import { customerCancellationReasons, getRequestStatusMeta, getRequestToneClasses, isCancellableRequestStatus } from '../../lib/requestLifecycle';
import { trackEvent } from '../../utils/analytics';
import { customerPinIcon, getRequestFlowTileAttribution, getRequestFlowTileUrl, mechanicPinIcon } from './requestFlowHelpers';

export default function CustomerActiveServicePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
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
  const requestStatus = String(request?.status || '');
  const lastUpdatedLabel = useMemo(
    () => (lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('en-IN') : null),
    [lastUpdatedAt]
  );
  const nextActionCopy = useMemo(() => {
    if (!request) {
      return {
        title: 'Checking request',
        description: 'Loading your latest service status.'
      };
    }

    if (request.quoteStatus === 'QUOTE_SUBMITTED') {
      return {
        title: 'Review your quote',
        description: 'Your partner has submitted the inspection quote. Approve it to continue toward payment.'
      };
    }

    if (request.status === 'ASSIGNED' || request.status === 'ACCEPTED') {
      return {
        title: 'Waiting for partner movement',
        description: 'Your assigned partner is reviewing the request and preparing to travel to your location.'
      };
    }

    if (request.status === 'EN_ROUTE') {
      return {
        title: 'Partner is on the way',
        description: 'Keep your phone available. You can open the map, share location, or contact support if needed.'
      };
    }

    if (request.status === 'ARRIVED') {
      return {
        title: 'Meet your partner',
        description: 'Your partner has arrived. Confirm the vehicle and issue details before service starts.'
      };
    }

    if (request.status === 'SERVICE_STARTED') {
      return {
        title: 'Service is in progress',
        description: 'Stay available for updates. A quote or payment action may appear depending on the service type.'
      };
    }

    if (requestStatus === 'SERVICE_COMPLETED' || requestStatus === 'PAYMENT_PENDING') {
      return {
        title: 'Complete payment and review',
        description: 'Your service is marked complete. Finish payment or follow the next commercial step shown below.'
      };
    }

    return {
      title: statusMeta.headline,
      description: 'We are keeping this page synced with the latest backend request status.'
    };
  }, [request, requestStatus, statusMeta.headline]);

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

  const mechanicRecord = (request.Mechanic || {}) as Record<string, unknown>;
  const mapCenter: [number, number] = Number.isFinite(Number(request.latitude)) && Number.isFinite(Number(request.longitude))
    ? [Number(request.latitude), Number(request.longitude)]
    : [11.0168, 76.9558];
  const mechanicCoords =
    Number.isFinite(Number(mechanicRecord.latitude)) && Number.isFinite(Number(mechanicRecord.longitude))
      ? [Number(mechanicRecord.latitude), Number(mechanicRecord.longitude)] as [number, number]
      : null;
  const hasPaymentCta = requestStatus === 'PAYMENT_PENDING' || requestStatus === 'SERVICE_COMPLETED';
  const showCompletionPin = requestStatus === 'SERVICE_STARTED' && /^\d{4}$/.test(String(request.completionPin || ''));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
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
              {lastUpdatedLabel ? ` Last updated ${lastUpdatedLabel}.` : ''}
            </div>
          )}

          {!connectionLost && lastUpdatedLabel ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              Last updated {lastUpdatedLabel}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="relative h-64 bg-secondary/50 sm:h-80">
                <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-full w-full" key={theme}>
                  <TileLayer attribution={getRequestFlowTileAttribution(theme)} url={getRequestFlowTileUrl(theme)} />
                  <Marker position={mapCenter} icon={customerPinIcon}>
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-bold">Your vehicle</p>
                        <p className="text-xs text-slate-600">{request.addressText || `${request.latitude}, ${request.longitude}`}</p>
                      </div>
                    </Popup>
                  </Marker>
                  {mechanicCoords ? (
                    <Marker position={mechanicCoords} icon={mechanicPinIcon}>
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-bold">{request.Mechanic?.businessName || request.Mechanic?.name || 'Assigned partner'}</p>
                          <p className="text-xs text-slate-600">{String(mechanicRecord.area || request.Mechanic?.city || request.dispatchStatus || 'Live assignment')}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null}
                </MapContainer>
                <div className="absolute inset-x-4 top-4 z-[450]">
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{request.addressText || `${request.latitude}, ${request.longitude}`}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-border p-4">
                <div className="flex flex-wrap gap-3">
                  <a href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                    <Navigation className="h-4 w-4" />
                    Open map
                  </a>
                  <button onClick={shareLocation} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    Share location
                  </button>
                </div>
              </div>
            </div>

            <RequestTimeline request={request} />
            <SupportActionsCard request={request} />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">What happens next</p>
              <h2 className="mt-3 text-xl font-black text-foreground">{nextActionCopy.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{nextActionCopy.description}</p>
              <div className="mt-4 flex flex-col gap-3">
                {request.quoteStatus === 'QUOTE_SUBMITTED' ? (
                  <Link
                    to={`/customer/request/${request.id}/quote`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600"
                  >
                    <FileText className="h-4 w-4" />
                    Review Quote
                  </Link>
                ) : null}
                {hasPaymentCta ? (
                  <Link
                    to={`/customer/request/${request.id}/payment`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Open Payment
                  </Link>
                ) : null}
                <Link
                  to={`/customer/support?requestId=${request.id}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Contact Support
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-bold text-foreground">Partner</p>
              <p className="mt-3 text-lg font-black text-foreground">{request.Mechanic?.businessName || request.Mechanic?.name || 'Awaiting partner assignment'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{request.currentEtaMinutes != null ? `ETA ${request.currentEtaMinutes} min` : 'ETA will appear after live assignment'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{request.Mechanic?.availabilityState || request.dispatchStatus || 'Dispatch in progress'}</p>
            </div>

            {showCompletionPin ? (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Completion OTP</p>
                <h3 className="mt-3 text-xl font-black text-foreground">Show this 4-digit OTP to your partner after service is finished</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {String(request.completionPin).split('').map((digit, index) => (
                    <div key={`${digit}-${index}`} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-background text-2xl font-black text-foreground shadow-sm">
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Share this OTP only after the work is fully completed and you have checked your vehicle.
                </p>
              </div>
            ) : null}

            {request.quoteStatus === 'QUOTE_SUBMITTED' && (
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">Quote ready for your approval</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your partner has submitted the inspection quote. Review the price breakdown and approve to continue payment.
                    </p>
                  </div>
                </div>
                <Link
                  to={`/customer/request/${request.id}/quote`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600"
                >
                  <FileText className="h-4 w-4" />
                  Review Quote
                </Link>
              </div>
            )}

            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-bold text-foreground">Emergency & safety</p>
                  <p className="mt-2 text-sm text-muted-foreground">Use emergency services first for severe incidents, then continue with RoadResQ support.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <a href="tel:112" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white">
                  <Phone className="h-4 w-4" />
                  Call 112
                </a>
                <Link to="/emergency" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Open Emergency Hub
                </Link>
                <Link to={`/customer/support?requestId=${request.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">
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
