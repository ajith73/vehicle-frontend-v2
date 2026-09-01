import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Expand, Loader2, MapPin, RefreshCw, Search, XCircle } from 'lucide-react';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import { useTheme } from '../../contexts/ThemeContext';
import type { CustomerRequest, Mechanic } from '../../types';
import { getRequestStatusMeta, isCancelledRequestStatus, isSearchingRequestStatus } from '../../lib/requestLifecycle';
import { getRequestFlowTileAttribution, getRequestFlowTileUrl } from './requestFlowHelpers';

const SEARCHING_RADIUS_DEFAULT = 11;
const SEARCH_TIMEOUT_MS = 60_000;

const createPinIcon = (background: string, label: string) =>
  L.divIcon({
    className: 'custom-search-map-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="padding:6px 10px;border-radius:999px;background:${background};color:white;font-size:11px;font-weight:800;box-shadow:0 8px 24px rgba(15,23,42,0.24);white-space:nowrap;">
          ${label}
        </div>
        <div style="width:16px;height:16px;background:${background};transform:rotate(45deg);margin-top:-10px;border-radius:3px;"></div>
      </div>
    `,
    iconSize: [90, 42],
    iconAnchor: [45, 42],
    popupAnchor: [0, -38]
  });

const customerIcon = createPinIcon('#f97316', 'You');
const mechanicIcon = createPinIcon('#0f766e', 'Partner');

const getDistanceKm = (startLat: number, startLng: number, endLat: number, endLng: number) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(endLat - startLat);
  const dLng = toRadians(endLng - startLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startLat)) * Math.cos(toRadians(endLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export default function CustomerSearchingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const searchParams = new URLSearchParams(location.search);
  const requestId = searchParams.get('id');

  const [radius, setRadius] = useState(SEARCHING_RADIUS_DEFAULT);
  const [failed, setFailed] = useState(false);
  const [dots, setDots] = useState('');
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [request, setRequest] = useState<CustomerRequest | null>(null);
  const [nearbyMechanics, setNearbyMechanics] = useState<Mechanic[]>([]);
  const [mobileCardHeight, setMobileCardHeight] = useState<'compact' | 'expanded'>('compact');
  const [searchRound, setSearchRound] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => prev.length >= 3 ? '' : `${prev}.`);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const loadNearbyMechanics = async (requestData: CustomerRequest, nextRadius = radius) => {
    const lat = Number(requestData.latitude);
    const lng = Number(requestData.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setNearbyMechanics([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set('lat', String(lat));
      params.set('lng', String(lng));
      params.set('radius', String(nextRadius));
      params.set('availability', 'Available');
      params.set('limit', '24');

      const vehicleName = requestData.VehicleType?.name || requestData.vehicleLabel;
      const serviceName = requestData.SpecificService?.name || requestData.ServiceType?.name || requestData.issueSummary;

      if (vehicleName) {
        params.append('vehicle', vehicleName);
      }
      if (serviceName) {
        params.append('service', serviceName);
      }

      const mechanics = await apiClient<Mechanic[]>(`/public/mechanics?${params.toString()}`);
      const filtered = (mechanics || [])
        .filter((mechanic) => Number.isFinite(Number(mechanic.latitude)) && Number.isFinite(Number(mechanic.longitude)))
        .map((mechanic) => ({
          ...mechanic,
          distanceKm: getDistanceKm(lat, lng, Number(mechanic.latitude), Number(mechanic.longitude))
        }))
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
        .slice(0, 12) as Mechanic[];

      setNearbyMechanics(filtered);
    } catch (error) {
      console.error('Failed to load nearby mechanics', error);
      setNearbyMechanics([]);
    }
  };

  useEffect(() => {
    if (!requestId || failed) return;

    let closed = false;
    const closeStream = openRealtimeStream<CustomerRequest>(`/customer/requests/${requestId}/stream`, {
      event: 'request:update',
      onMessage: (res) => {
        if (closed) return;
        setRequest(res);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
        setIsInitialLoading(false);
        const status = String(res.status || '');

        if (isCancelledRequestStatus(res.status) || status === 'NO_MECHANIC_FOUND') {
          setFailed(true);
          return;
        }

        if (!isSearchingRequestStatus(res.status)) {
          navigate(`/customer/request/${requestId}`);
          return;
        }

        void loadNearbyMechanics(res);
      },
      onError: async () => {
        if (closed) return;
        setConnectionLost(true);
        try {
          const res = await apiClient<CustomerRequest>(`/customer/requests/${requestId}/status`);
          if (closed) return;
          setRequest(res);
          setLastUpdatedAt(new Date().toISOString());
          setIsInitialLoading(false);
          const status = String(res.status || '');
          if (isCancelledRequestStatus(res.status) || status === 'NO_MECHANIC_FOUND') {
            setFailed(true);
            return;
          }
          if (!isSearchingRequestStatus(res.status)) {
            navigate(`/customer/request/${requestId}`);
            return;
          }
          await loadNearbyMechanics(res);
        } catch (err) {
          console.error('Failed to fetch request status', err);
          setIsInitialLoading(false);
        }
      }
    });

    return () => {
      closed = true;
      closeStream();
    };
  }, [requestId, failed, navigate]);

  useEffect(() => {
    if (!request) return;
    void loadNearbyMechanics(request, radius);
  }, [radius, request]);

  useEffect(() => {
    if (!request || failed) return;
    if (!isSearchingRequestStatus(request.status)) return;

    const timeoutId = window.setTimeout(() => {
      setFailed(true);
    }, SEARCH_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [request, radius, searchRound, failed]);

  const cancelRequest = async () => {
    setIsCancelling(true);
    if (requestId) {
      try {
        await apiClient(`/customer/requests/${requestId}/cancel`, {
          method: 'PUT',
          data: { reason: 'Cancelled by user while searching' }
        });
      } catch (err) {
        console.error('Error cancelling', err);
      } finally {
        setIsCancelling(false);
      }
    } else {
      setIsCancelling(false);
    }
    navigate('/customer');
  };

  const mapCenter = useMemo<[number, number]>(() => {
    if (request?.latitude && request?.longitude) {
      return [request.latitude, request.longitude];
    }
    return [11.0168, 76.9558];
  }, [request?.latitude, request?.longitude]);

  const summaryLocation = request?.addressText || (request ? `${request.latitude}, ${request.longitude}` : 'Detecting request location');
  const serviceLabel = request?.SpecificService?.name || request?.ServiceType?.name || request?.issueSummary || 'Roadside assistance';
  const vehicleLabel = request?.VehicleType?.name || request?.vehicleLabel || 'Vehicle';
  const visibleMechanicsCount = nearbyMechanics.length;
  const mobileCardHeightClass = mobileCardHeight === 'compact' ? 'h-[25vh]' : 'h-[50vh]';
  const statusMeta = getRequestStatusMeta(request?.status || 'ASSIGNING');
  const secondsSinceLastUpdate = lastUpdatedAt ? Math.max(0, Math.floor((Date.now() - new Date(lastUpdatedAt).getTime()) / 1000)) : null;
  const remainingSearchSeconds = request && !failed && isSearchingRequestStatus(request.status)
    ? Math.max(0, Math.ceil((SEARCH_TIMEOUT_MS - (secondsSinceLastUpdate || 0) * 1000) / 1000))
    : 0;
  const restartSearchWindow = () => {
    setFailed(false);
    setSearchRound((current) => current + 1);
    setRadius((current) => current + 3);
  };

  const renderSearchingState = (isMobile = false) => (
    <motion.div
      key={isMobile ? 'searching-mobile' : 'searching-desktop'}
      initial={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, x: -20 }}
      animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
      exit={isMobile ? { opacity: 0, y: -20 } : { opacity: 0, x: -20 }}
      className="space-y-5 p-5 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-foreground sm:text-2xl">{statusMeta.headline}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Finding nearby partners. Notifying mechanics within <span className="font-bold text-foreground">{radius} km</span> of your location.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Requested service</p>
          <p className="mt-2 text-sm font-bold text-foreground">{serviceLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">{vehicleLabel}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Live dispatch</p>
          <p className="mt-2 text-sm font-bold text-foreground">{visibleMechanicsCount} visible partners in the current search</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {remainingSearchSeconds > 0 ? `${remainingSearchSeconds}s left in this search round` : 'Waiting for the next status update'}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Request location</p>
          </div>
          <p className="mt-2 break-words text-sm text-foreground">{summaryLocation}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={restartSearchWindow}
          disabled={isCancelling}
          className="rounded-xl bg-secondary p-4 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Search className="h-5 w-5" /> Expand Search Radius
          </span>
        </button>
        <button
          onClick={cancelRequest}
          disabled={isCancelling}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background p-4 text-sm font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isCancelling ? 'Cancelling...' : 'Cancel Request'}
        </button>
      </div>
    </motion.div>
  );

  const renderFailedState = (isMobile = false) => (
    <motion.div
      key={isMobile ? 'failed-mobile' : 'failed-desktop'}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5 p-5 text-center sm:p-6"
    >
      <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-10 w-10 text-destructive" />
      </div>
      <div>
        <h2 className="text-xl font-black text-foreground sm:text-2xl">No partners available</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find an available partner within {radius} km right now.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={restartSearchWindow}
          className="w-full rounded-xl bg-primary p-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Search className="h-5 w-5" /> Search Wider Area
          </span>
        </button>
        {!isMobile ? (
          <Link to="/customer/request" className="w-full rounded-xl bg-secondary p-4 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80">
            Try Another Service
          </Link>
        ) : null}
        {!isMobile ? (
          <Link to="/customer/support" className="w-full rounded-xl bg-destructive/10 p-4 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20">
            <span className="inline-flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Contact Emergency Support
            </span>
          </Link>
        ) : null}
        <button
          onClick={cancelRequest}
          disabled={isCancelling}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background p-4 text-sm font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isCancelling ? 'Cancelling...' : 'Cancel Request'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-full w-full">
            <TileLayer attribution={getRequestFlowTileAttribution(theme)} url={getRequestFlowTileUrl(theme)} />

            {request && (
              <>
                <Circle
                  center={[request.latitude, request.longitude]}
                  radius={radius * 1000}
                  pathOptions={{ color: '#f97316', weight: 2, fillColor: '#fb923c', fillOpacity: 0.12 }}
                />
                <Marker position={[request.latitude, request.longitude]} icon={customerIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-bold">{serviceLabel}</p>
                      <p className="text-xs text-slate-600">{summaryLocation}</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {nearbyMechanics.map((mechanic) => (
              <Marker key={mechanic.id} position={[Number(mechanic.latitude), Number(mechanic.longitude)]} icon={mechanicIcon}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-bold">{mechanic.businessName || mechanic.name || 'Partner'}</p>
                    <p className="text-xs text-slate-600">{mechanic.area || mechanic.city || 'Nearby area'}</p>
                    {'distanceKm' in mechanic && typeof (mechanic as any).distanceKm === 'number' && (
                      <p className="text-xs font-semibold text-emerald-700">{(mechanic as any).distanceKm.toFixed(1)} km away</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {!failed && request && (
            <>
              <motion.div
                animate={{ scale: [1, 1.7], opacity: [0.35, 0] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary"
              />
              <motion.div
                animate={{ scale: [1, 2.4], opacity: [0.18, 0] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'linear', delay: 0.6 }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary"
              />
            </>
          )}

          {isInitialLoading && (
            <div className="absolute inset-0 z-[450] flex items-center justify-center bg-background/45 backdrop-blur-[1px]">
              <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Loading your request status...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-[500] flex h-full flex-col p-4">
          <header className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Request Search</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                  {!failed ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching{dots}</> : 'Search Failed'}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">{visibleMechanicsCount} nearby</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{radius} km search radius</p>
              </div>
              <button
                onClick={cancelRequest}
                disabled={isCancelling}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
              >
                {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isCancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>

            {connectionLost && (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
                Connection lost. Trying to reconnect...
                {lastUpdatedAt ? ` Last updated ${new Date(lastUpdatedAt).toLocaleTimeString('en-IN')}.` : ''}
              </div>
            )}

            {!connectionLost && lastUpdatedAt ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Last updated {new Date(lastUpdatedAt).toLocaleTimeString('en-IN')}
              </div>
            ) : null}
          </header>

          <div className="hidden flex-1 items-center md:flex">
            <div className="w-full max-w-[420px]">
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <AnimatePresence mode="wait">
                  {!failed ? renderSearchingState() : renderFailedState()}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className={`absolute inset-x-0 bottom-0 z-[520] border-t border-border bg-card/95 p-4 shadow-[0_-12px_28px_rgba(15,23,42,0.12)] backdrop-blur md:hidden ${mobileCardHeightClass}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Searching</p>
                <p className="mt-1 text-sm font-black text-foreground">{serviceLabel}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{summaryLocation}</p>
              </div>
              <button
                onClick={() => setMobileCardHeight((current) => current === 'compact' ? 'expanded' : 'compact')}
                className="rounded-full bg-secondary p-2 text-secondary-foreground"
                aria-label="Toggle card size"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>

            <div className="h-[calc(100%-3.5rem)] overflow-y-auto pr-1">
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <AnimatePresence mode="wait">
                  {!failed ? renderSearchingState(true) : renderFailedState(true)}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
