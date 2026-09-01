import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, Loader2, MapPin, Save, Search, ShieldCheck, SlidersHorizontal, Truck, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { CustomerRequest, DispatchScoringResponse, Mechanic } from '../../types';
import { getRequestStatusMeta, getRequestToneClasses, isSearchingRequestStatus } from '../../lib/requestLifecycle';
import { formatPhoneDisplay } from '../../utils/phone';
import { useLocation } from 'react-router-dom';

type AutomationOverview = {
  metrics: {
    reDispatch: number;
    requestTimeout: number;
    noPartnerFound: number;
    slaBreaches: number;
  };
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

const statusColor = (value?: string) => {
  if (value === 'ONLINE_BUSY') return 'bg-amber-500/10 text-amber-600';
  if (value?.includes('ONLINE')) return 'bg-emerald-500/10 text-emerald-600';
  return 'bg-secondary text-muted-foreground';
};

export default function AdminDispatch() {
  const location = useLocation();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [dispatchScoring, setDispatchScoring] = useState<DispatchScoringResponse | null>(null);
  const [overview, setOverview] = useState<AutomationOverview | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('Admin manual dispatch override');
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [savingRules, setSavingRules] = useState(false);
  const preselectedRequestId = typeof location.state?.selectedRequestId === 'number'
    ? location.state.selectedRequestId
    : null;

  const fetchData = async () => {
    try {
      const [liveRequests, liveMechanics, scoring, automation] = await Promise.all([
        apiClient<CustomerRequest[]>('/admin/live/requests'),
        apiClient<Mechanic[]>('/admin/live/mechanics'),
        apiClient<DispatchScoringResponse>('/admin/dispatch/scoring'),
        apiClient<AutomationOverview>('/admin/automation/overview')
      ]);
      setRequests(liveRequests || []);
      setMechanics(liveMechanics || []);
      setDispatchScoring(scoring || null);
      setOverview(automation || null);
      if (preselectedRequestId && liveRequests?.some((request) => request.id === preselectedRequestId)) {
        setSelectedRequestId(preselectedRequestId);
      } else if (!selectedRequestId && liveRequests?.length) {
        setSelectedRequestId(liveRequests[0].id);
      }
    } catch (error) {
      toast.error('Failed to load dispatch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preselectedRequestId]);

  const unassignedRequests = useMemo(() => {
    return requests.filter((request) => !request.Mechanic?.id || isSearchingRequestStatus(request.status));
  }, [requests]);

  const selectedRequest = useMemo(() => {
    return unassignedRequests.find((request) => request.id === selectedRequestId) || null;
  }, [unassignedRequests, selectedRequestId]);

  const scoringMap = useMemo(() => {
    return new Map((dispatchScoring?.scores || []).map((score) => [score.mechanicId, score]));
  }, [dispatchScoring]);

  const matchingMechanics = useMemo(() => {
    return mechanics
      .filter((mechanic) => mechanic.status === 'Approved')
      .filter((mechanic) => {
        const text = `${mechanic.businessName || mechanic.name || ''} ${mechanic.city || ''} ${formatPhoneDisplay(mechanic.phone, '')}`.toLowerCase();
        return !query || text.includes(query.toLowerCase());
      })
      .sort((left, right) => {
        const leftScore = scoringMap.get(left.id)?.score || 0;
        const rightScore = scoringMap.get(right.id)?.score || 0;
        return rightScore - leftScore;
      });
  }, [mechanics, query, scoringMap]);

  const assignMechanic = async (mechanicId: number) => {
    if (!selectedRequest) return;
    setAssigningId(mechanicId);
    try {
      await apiClient(`/admin/requests/${selectedRequest.id}/dispatch/override`, {
        method: 'POST',
        data: {
          mechanicId,
          overrideType: selectedRequest.Mechanic?.id ? 'MANUAL_REASSIGN' : 'MANUAL_ASSIGN',
          reason,
          notes: 'Force assigned from admin dispatch control on August 20, 2026'
        }
      });
      toast.success('Dispatch override applied');
      await fetchData();
    } catch (error) {
      toast.error('Failed to assign partner');
    } finally {
      setAssigningId(null);
    }
  };

  const updateRule = (key: keyof DispatchScoringResponse['rules'], value: number) => {
    setDispatchScoring((current) => current ? ({
      ...current,
      rules: {
        ...current.rules,
        [key]: value
      }
    }) : current);
  };

  const saveRules = async () => {
    if (!dispatchScoring) return;
    setSavingRules(true);
    try {
      await apiClient('/admin/dispatch/scoring/rules', {
        method: 'PUT',
        data: dispatchScoring.rules
      });
      toast.success('Dispatch scoring rules updated');
      await fetchData();
    } catch (error) {
      toast.error('Failed to update scoring rules');
    } finally {
      setSavingRules(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-foreground mb-1">Dispatch Engine</h1>
        <p className="text-muted-foreground">Manual override, match scoring, and timeout monitoring for fast marketplace dispatch.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Open re-dispatch" value={String(overview?.metrics.reDispatch || 0)} />
        <MetricCard label="Timeout risk" value={String(overview?.metrics.requestTimeout || 0)} />
        <MetricCard label="No supply" value={String(overview?.metrics.noPartnerFound || 0)} />
        <MetricCard label="SLA breaches" value={String(overview?.metrics.slaBreaches || 0)} />
      </div>

      {dispatchScoring ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                Scoring Weights
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Explainable score controls for distance, trust, availability, response speed, and premium preference.</p>
            </div>
            <button onClick={saveRules} disabled={savingRules} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
              <Save className="w-4 h-4" />
              {savingRules ? 'Saving...' : 'Save Weights'}
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Object.entries(dispatchScoring.rules).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-border/70 bg-background/70 p-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type="number"
                  value={value}
                  min={0}
                  step={0.1}
                  onChange={(event) => updateRule(key as keyof DispatchScoringResponse['rules'], Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 min-h-[46rem]">
        <div className="flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30">
            <h2 className="font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" /> Unassigned Requests ({unassignedRequests.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {unassignedRequests.map((request) => (
              <motion.button
                key={request.id}
                variants={cardVariants}
                initial="hidden"
                animate="show"
                onClick={() => setSelectedRequestId(request.id)}
                className={`text-left rounded-xl p-4 shadow-sm transition-colors relative border ${selectedRequestId === request.id ? 'bg-primary/5 border-primary' : 'bg-background border-border hover:border-primary/40'}`}
              >
                {selectedRequestId === request.id ? (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-bl-lg uppercase">
                    Selected
                  </div>
                ) : null}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-muted-foreground">REQ-{request.id}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${getRequestToneClasses(request.status)}`}>
                    <Clock className="w-3 h-3" /> {Math.max(1, Math.round((Date.now() - new Date(request.createdAt).getTime()) / 60000))}m
                  </span>
                </div>
                <h3 className="font-bold mb-1">{request.ServiceType?.name || request.issueSummary}</h3>
                <p className="text-xs text-muted-foreground mb-2">{request.CustomerUser?.CustomerProfile?.displayName || request.CustomerUser?.email || 'Customer'} • {request.vehicleLabel || 'Vehicle pending'}</p>
                <p className="mb-2 text-[11px] font-bold text-primary">{getRequestStatusMeta(request.status).label}</p>
                <p className="text-xs font-medium flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                  {request.addressText || request.Mechanic?.city || 'Unknown location'}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-bold flex items-center gap-2 text-foreground">
              <Truck className="w-4 h-4" /> Dispatch candidates for {selectedRequest ? `REQ-${selectedRequest.id}` : 'request'}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Override reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none w-72"
              />
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-primary w-64"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {matchingMechanics.map((mechanic) => {
              const score = scoringMap.get(mechanic.id);
              return (
                <motion.div
                  key={mechanic.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  className="border border-border rounded-xl p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Wrench className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {mechanic.businessName || mechanic.name}
                        {mechanic.isTrustedPartner ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : null}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusColor(mechanic.availabilityState || (mechanic.isOnline ? 'ONLINE_IDLE' : 'OFFLINE'))}`}>
                          {mechanic.availabilityState || (mechanic.isOnline ? 'ONLINE_IDLE' : 'OFFLINE')}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {mechanic.city || 'Unknown city'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Match score: {score?.score ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start xl:items-end gap-2">
                    <div className="bg-primary/10 text-primary text-xs font-black px-2 py-1 rounded">
                      TRUST {mechanic.trustScore || 0}
                    </div>
                    <button
                      disabled={!selectedRequest || assigningId === mechanic.id}
                      onClick={() => assignMechanic(mechanic.id)}
                      className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 shadow-sm disabled:opacity-60"
                    >
                      {assigningId === mechanic.id ? 'Assigning...' : 'Assign Partner'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
    </div>
  );
}
