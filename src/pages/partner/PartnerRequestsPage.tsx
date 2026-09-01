import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Navigation, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequestStatusMeta, isCancelledRequestStatus, isCompletedRequestStatus, getRequestToneClasses } from '../../lib/requestLifecycle';
import toast from 'react-hot-toast';

type Tab = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function PartnerRequestsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('AVAILABLE');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    let closed = false;

    const closeStream = openRealtimeStream<any[]>('/mechanic/jobs/stream', {
      event: 'jobs:update',
      onMessage: (res) => {
        if (closed) return;
        setJobs(res || []);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
        setLoading(false);
      },
      onError: () => {
        if (!closed) {
          setConnectionLost(true);
          fetchJobs();
        }
      }
    });

    return () => {
      closed = true;
      closeStream();
    };
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await apiClient<any[]>('/mechanic/jobs');
      setJobs(res || []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      setActionLoadingId(id);
      await apiClient(`/mechanic/jobs/${id}/accept`, { method: 'POST' });
      toast.success('Request accepted');
      navigate(`/partner/request/${id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setActionLoadingId(id);
      await apiClient(`/mechanic/jobs/${id}/reject`, { method: 'POST', data: { reason: 'Busy' } });
      toast.success('Request rejected');
      void fetchJobs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const availableJobs = jobs.filter(j => j.status === 'ASSIGNED');
  const activeJobs = jobs.filter(j => ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'SERVICE_STARTED'].includes(j.status));
  const completedJobs = jobs.filter(j => isCompletedRequestStatus(j.status));
  const cancelledJobs = jobs.filter(j => isCancelledRequestStatus(j.status));

  const pageVariants = {
    initial: { opacity: 0, x: -10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 10 }
  };
  const lastUpdatedLabel = useMemo(
    () => (lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('en-IN') : null),
    [lastUpdatedAt]
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4">
        <h1 className="text-xl font-black text-foreground mb-4">Requests Hub</h1>
        {connectionLost ? (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
            Connection lost. Refreshing request feed...
            {lastUpdatedLabel ? ` Last updated ${lastUpdatedLabel}.` : ''}
          </div>
        ) : lastUpdatedLabel ? (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            Last updated {lastUpdatedLabel}
          </div>
        ) : null}
        
        {/* Tabs */}
        <div className="flex bg-secondary p-1 rounded-xl overflow-x-auto snap-x hide-scrollbar">
          {(['AVAILABLE', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as Tab[]).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 py-2 px-3 shrink-0 text-sm font-bold rounded-lg transition-colors snap-center ${activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute inset-0 bg-background rounded-lg shadow-sm" />
              )}
              <span className="relative z-10 capitalize">{tab.toLowerCase()}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              
              {activeTab === 'AVAILABLE' && (
                availableJobs.length > 0 ? availableJobs.map(job => (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} key={job.id} className="bg-card border-2 border-primary/20 rounded-2xl p-4 shadow-[0_4px_15px_rgba(var(--primary),0.05)]">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2 bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                         NEW REQUEST
                       </div>
                       <div className="text-[11px] font-semibold text-muted-foreground">
                         {job.currentEtaMinutes ? `${job.currentEtaMinutes} min` : 'Live'}
                       </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{job.issueSummary}</h3>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> {job.addressText || 'Unknown location'}
                    </p>
                    <div className="mb-3 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                      {job.CustomerUser?.CustomerProfile?.displayName || 'Customer'} • {job.vehicleLabel || 'Vehicle not set'}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-border">
                      <button onClick={() => handleReject(job.id)} disabled={actionLoadingId === job.id} className="flex-1 bg-secondary text-secondary-foreground font-bold py-2 rounded-lg text-sm hover:bg-secondary/80 disabled:opacity-60">
                        {actionLoadingId === job.id ? 'Working...' : 'Reject'}
                      </button>
                      <button onClick={() => handleAccept(job.id)} disabled={actionLoadingId === job.id} className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-60">
                        {actionLoadingId === job.id ? 'Working...' : 'Accept'}
                      </button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center p-8 text-muted-foreground">
                     <p className="text-sm">Searching for more requests in your area...</p>
                  </div>
                )
              )}

              {activeTab === 'ACTIVE' && (
                activeJobs.length > 0 ? activeJobs.map(job => (
                  <Link key={job.id} to={`/partner/request/${job.id}`} className="bg-card border-2 border-amber-500/30 rounded-2xl p-4 shadow-sm hover:border-amber-500 transition-colors block">
                    <div className="flex justify-between items-start mb-2">
                       <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getRequestToneClasses(job.status)}`}>
                         <Clock className="w-3 h-3" /> {getRequestStatusMeta(job.status).label}
                       </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{job.issueSummary}</h3>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> {job.addressText}
                    </p>
                    <div className="mb-3 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                      {job.CustomerUser?.CustomerProfile?.displayName || 'Customer'} • ETA {job.currentEtaMinutes || '--'} min
                    </div>
                    <div className="flex items-center text-primary font-bold text-sm">
                      <Navigation className="w-4 h-4 mr-1" /> Open active job
                    </div>
                  </Link>
                )) : (
                  <div className="text-center p-8 text-muted-foreground">
                     <p className="text-sm">No active jobs right now.</p>
                  </div>
                )
              )}

              {activeTab === 'COMPLETED' && (
                completedJobs.length > 0 ? completedJobs.map(job => (
                  <div key={job.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                         <CheckCircle2 className="w-3 h-3" /> {getRequestStatusMeta(job.status).label}
                       </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{job.issueSummary}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{job.vehicleLabel} • {job.addressText}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <span className="font-black text-foreground">Earned: ₹{job.feeAmount || '--'}</span>
                      <Link to={`/partner/request/${job.id}`} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20">View Details</Link>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-8 text-muted-foreground">
                     <p className="text-sm">No completed jobs yet.</p>
                  </div>
                )
              )}

              {activeTab === 'CANCELLED' && (
                cancelledJobs.length > 0 ? cancelledJobs.map(job => (
                  <div key={job.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm opacity-75">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                         <XCircle className="w-3 h-3" /> {getRequestStatusMeta(job.status).label}
                       </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{job.issueSummary}</h3>
                    <p className="text-sm text-muted-foreground">{job.vehicleLabel}</p>
                  </div>
                )) : (
                  <div className="text-center p-8 text-muted-foreground">
                     <p className="text-sm">No cancelled jobs.</p>
                  </div>
                )
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
