import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Phone, MessageSquare, MapPin, Navigation, Clock, ShieldCheck, FileText, CheckCircle2, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getRequestStatusMeta, getRequestToneClasses, isCancelledRequestStatus, isCompletedRequestStatus } from '../../lib/requestLifecycle';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../contexts/ThemeContext';
import { customerPinIcon, getRequestFlowTileAttribution, getRequestFlowTileUrl, mechanicPinIcon } from '../customer/requestFlowHelpers';

function FitJobMapBounds({
  customerCoords,
  mechanicCoords,
  routeCoords
}: {
  customerCoords: [number, number] | null;
  mechanicCoords: [number, number] | null;
  routeCoords: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    const points = routeCoords.length > 0
      ? routeCoords
      : [customerCoords, mechanicCoords].filter(Boolean) as [number, number][];

    if (points.length >= 2) {
      map.fitBounds(points, { padding: [32, 32] });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
    }
  }, [customerCoords, mechanicCoords, map, routeCoords]);

  return null;
}

export default function PartnerActiveJobPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState<{ distanceKm: string; durationLabel: string } | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    let closed = false;
    const closeStream = openRealtimeStream<any>(`/mechanic/jobs/${id}/stream`, {
      event: 'job:update',
      onMessage: (res) => {
        if (closed) return;
        setJob(res);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
        setLoading(false);
      },
      onError: () => {
        if (!closed) {
          setConnectionLost(true);
          fetchJob();
        }
      }
    });

    return () => {
      closed = true;
      closeStream();
    };
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await apiClient<any>(`/mechanic/jobs/${id}`);
      setJob(res);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error("Failed to fetch job", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      setStatusSaving(true);
      await apiClient(`/mechanic/jobs/${id}/status`, {
        method: 'PUT',
        data: { status: newStatus }
      });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      await fetchJob();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const customerCoords: [number, number] | null =
    Number.isFinite(Number(job?.latitude)) && Number.isFinite(Number(job?.longitude))
      ? [Number(job.latitude), Number(job.longitude)]
      : null;

  const mechanicCoords: [number, number] | null = (() => {
    const liveLat = Number(job?.Mechanic?.MechanicLiveState?.latitude);
    const liveLng = Number(job?.Mechanic?.MechanicLiveState?.longitude);
    if (Number.isFinite(liveLat) && Number.isFinite(liveLng)) {
      return [liveLat, liveLng];
    }

    const baseLat = Number(job?.Mechanic?.latitude);
    const baseLng = Number(job?.Mechanic?.longitude);
    if (Number.isFinite(baseLat) && Number.isFinite(baseLng)) {
      return [baseLat, baseLng];
    }

    return null;
  })();

  useEffect(() => {
    if (!customerCoords || !mechanicCoords) {
      setRouteCoords([]);
      setRouteSummary(null);
      return;
    }

    let cancelled = false;

    const fetchRoute = async () => {
      try {
        setRouteLoading(true);
        const data = await apiClient<any>('/public/route', {
          method: 'POST',
          data: {
            startLat: mechanicCoords[0],
            startLng: mechanicCoords[1],
            endLat: customerCoords[0],
            endLng: customerCoords[1],
            routeOption: 'Fastest'
          }
        });

        if (cancelled) {
          return;
        }

        const coords = Array.isArray(data?.routeCoords) ? data.routeCoords as [number, number][] : [];
        setRouteCoords(coords);

        const durationMinutes = Number(data?.durationMinutes || 0);
        setRouteSummary({
          distanceKm: Number(data?.distanceKm || 0).toFixed(1),
          durationLabel: durationMinutes > 60
            ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
            : `${durationMinutes} min`
        });
      } catch {
        if (!cancelled) {
          setRouteCoords([]);
          setRouteSummary(null);
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    void fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [job?.id, customerCoords?.[0], customerCoords?.[1], mechanicCoords?.[0], mechanicCoords?.[1]]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-background">
        <p className="text-muted-foreground font-bold mb-4">Job not found.</p>
        <button onClick={() => navigate('/partner/requests')} className="text-primary hover:underline">Go Back</button>
      </div>
    );
  }

  const jobState = job.status;
  const lastUpdatedLabel = useMemo(
    () => (lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('en-IN') : null),
    [lastUpdatedAt]
  );
  const nextActionCopy = useMemo(() => {
    if (jobState === 'ACCEPTED') {
      return { title: 'Start navigation', description: 'Head toward the customer and switch the job to en route once you begin moving.' };
    }
    if (jobState === 'EN_ROUTE') {
      return { title: 'Mark arrival', description: 'Once you reach the customer, mark the job as arrived so the customer sees the live update.' };
    }
    if (jobState === 'ARRIVED') {
      return { title: 'Inspect and start service', description: 'If pricing needs approval, create a quote first. Otherwise start the service when ready.' };
    }
    if (jobState === 'SERVICE_STARTED') {
      return { title: 'Complete the service', description: 'Finish the job after the work is done and move to the completion and OTP step.' };
    }
    return { title: getRequestStatusMeta(jobState).headline, description: 'This screen stays synced with the latest customer request and route state.' };
  }, [jobState]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/partner')} className="p-2 -ml-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground mb-0.5">Active Job</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">REQ-{job.id}</p>
          </div>
        </div>
        
        {/* State Badge */}
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black border ${getRequestToneClasses(jobState)}`}>
          {getRequestStatusMeta(jobState).label}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32 flex flex-col gap-4">
        {connectionLost ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
            Connection lost. Refreshing active job...
            {lastUpdatedLabel ? ` Last updated ${lastUpdatedLabel}.` : ''}
          </div>
        ) : lastUpdatedLabel ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            Last updated {lastUpdatedLabel}
          </div>
        ) : null}
        
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Live Route</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {routeLoading
                  ? 'Loading route...'
                  : routeSummary
                    ? `${routeSummary.distanceKm} km • ${routeSummary.durationLabel}`
                    : 'Customer location map'}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${job.latitude},${job.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
            >
              <Navigation className="h-3.5 w-3.5 text-primary" />
              Open Maps
            </a>
          </div>

          <div className="h-56 w-full sm:h-72">
            <MapContainer
              center={customerCoords || mechanicCoords || [11.0168, 76.9558]}
              zoom={14}
              className="h-full w-full"
              zoomControl={false}
              scrollWheelZoom
            >
              <TileLayer
                url={getRequestFlowTileUrl(theme)}
                attribution={getRequestFlowTileAttribution(theme)}
              />

              {customerCoords && (
                <Marker position={customerCoords} icon={customerPinIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-bold">Customer location</p>
                      <p className="text-xs text-slate-600">{job.addressText || 'Destination available'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {mechanicCoords && (
                <Marker position={mechanicCoords} icon={mechanicPinIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-bold">Your live position</p>
                      <p className="text-xs text-slate-600">{job.Mechanic?.businessName || job.Mechanic?.name || 'Partner location'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85 }} />
              )}

              <FitJobMapBounds
                customerCoords={customerCoords}
                mechanicCoords={mechanicCoords}
                routeCoords={routeCoords}
              />
            </MapContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border px-4 py-3 text-xs">
            <div className="rounded-xl bg-secondary/50 px-3 py-2">
              <p className="font-black uppercase tracking-wider text-muted-foreground">Customer</p>
              <p className="mt-1 font-semibold text-foreground">{job.addressText || 'Unknown location'}</p>
            </div>
            <div className="rounded-xl bg-secondary/50 px-3 py-2">
              <p className="font-black uppercase tracking-wider text-muted-foreground">Partner Start</p>
              <p className="mt-1 font-semibold text-foreground">
                {mechanicCoords ? 'Current partner position available' : 'Partner live location not available yet'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">What happens next</p>
          <h2 className="mt-2 text-lg font-black text-foreground">{nextActionCopy.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{nextActionCopy.description}</p>
        </div>

        {/* Customer Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm mt-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden shrink-0">
               <img src={`https://ui-avatars.com/api/?name=${job.CustomerUser?.CustomerProfile?.displayName || 'Customer'}&background=random`} alt="Customer" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="font-black text-lg text-foreground flex items-center gap-2">
                {job.CustomerUser?.CustomerProfile?.displayName || 'Customer'}
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </h2>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {job.addressText || 'Unknown Location'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-5 bg-secondary/30 p-3 rounded-xl border border-border/50">
             <div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Vehicle</p>
               <p className="text-sm font-bold text-foreground">{job.vehicleLabel}</p>
             </div>
             <div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Service Requested</p>
               <p className="text-sm font-bold text-destructive">{job.issueSummary}</p>
             </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 p-3 rounded-xl font-bold hover:bg-emerald-500/20 transition-colors">
              <Phone className="w-4 h-4" /> Call
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary p-3 rounded-xl font-bold hover:bg-primary/20 transition-colors">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          </div>
        </motion.div>

        {/* Quotes Section (Appears after Arrival) */}
        <AnimatePresence>
          {jobState === 'ARRIVED' && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl overflow-hidden">
               <h3 className="font-bold text-amber-700 dark:text-amber-500 flex items-center gap-2 mb-2">
                 <FileText className="w-5 h-5" /> Inspection & Quote
               </h3>
               <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mb-4">
                 If this issue requires parts or non-fixed labor, generate a quote for customer approval before starting.
               </p>
               <Link to={`/partner/request/${id}/quote`} className="w-full bg-amber-500 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-amber-600 transition-colors">
                 Create Quote
               </Link>
             </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Sticky Action Footer */}
      {!isCompletedRequestStatus(jobState) && !isCancelledRequestStatus(jobState) && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
          <div className="max-w-lg mx-auto w-full">
            {jobState === 'ACCEPTED' && (
            <button 
                onClick={() => updateStatus('EN_ROUTE')}
                disabled={statusSaving}
                className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {statusSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />} START NAVIGATION
              </button>
            )}

            {jobState === 'EN_ROUTE' && (
              <button 
                onClick={() => updateStatus('ARRIVED')}
                disabled={statusSaving}
                className="w-full bg-blue-500 text-white p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {statusSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />} I HAVE ARRIVED
              </button>
            )}

            {jobState === 'ARRIVED' && (
              <button 
                onClick={() => updateStatus('SERVICE_STARTED')}
                disabled={statusSaving}
                className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {statusSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />} START SERVICE
              </button>
            )}

            {jobState === 'SERVICE_STARTED' && (
              <Link 
                to={`/partner/request/${id}/complete`}
                className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> COMPLETE JOB
              </Link>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
