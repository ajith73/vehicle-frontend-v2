import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, TrendingUp, AlertTriangle, X, Power, Loader2, Star, Bell, Clock3 } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PARTNER_LIVE_STATE_EVENT = 'roadresq:partner-live-state-changed';

export default function PartnerDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({ today: 0, growth: 0 });
  const [showIncoming, setShowIncoming] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const syncIncomingRequest = (jobsRes: any[]) => {
    const incoming = (jobsRes || []).find((job) => job.status === 'ASSIGNED');
    if (incoming) {
      setIncomingRequest(incoming);
      setShowIncoming(true);
      return;
    }

    setShowIncoming(false);
    setIncomingRequest(null);
  };

  const applyProfileLiveState = (profileRes: any) => {
    if (!profileRes) return;
    const liveOnline = Boolean(profileRes.MechanicLiveState?.isOnline ?? profileRes.isOnline);
    setIsOnline(liveOnline);
  };

  const fetchStaticData = async () => {
    try {
      const earningsRes = await apiClient<any>('/mechanic/earnings');
      if (earningsRes && earningsRes.summary) {
        const today = Number(earningsRes.summary.today || 0);
        const week = Number(earningsRes.summary.week || 0);
        const growth = week > 0 ? Math.max(0, Math.round((today / week) * 100)) : 0;
        setEarnings({ today, growth });
      }
    } catch (e) {
      setEarnings({ today: 0, growth: 0 });
    }

    try {
      const mechanicId = localStorage.getItem('mechanicId');
      const [performanceRes, profileRes] = await Promise.all([
        apiClient<any>('/mechanic/performance/insights').catch(() => null),
        mechanicId ? apiClient<any>(`/public/mechanics/${mechanicId}`).catch(() => null) : Promise.resolve(null)
      ]);
      setPerformance(performanceRes);
      setProfile(profileRes);
      applyProfileLiveState(profileRes);
    } catch (e) {
      setPerformance(null);
    }
  };

  useEffect(() => {
    fetchStaticData();
    let closed = false;

    const closeStream = openRealtimeStream<any[]>('/mechanic/jobs/stream', {
      event: 'jobs:update',
      onMessage: (jobsRes) => {
        if (closed) return;
        setJobs(jobsRes || []);
        syncIncomingRequest(jobsRes || []);
        if (jobsRes && jobsRes.length > 0 && jobsRes[0].Mechanic) {
          setIsOnline(jobsRes[0].Mechanic.isOnline);
        }
        setLoading(false);
      },
      onError: () => {
        if (!closed) {
          fetchJobsData();
        }
      }
    });

    return () => {
      closed = true;
      closeStream();
    };
  }, []);

  useEffect(() => {
    const handleLiveState = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOnline?: boolean }>;
      if (typeof customEvent.detail?.isOnline === 'boolean') {
        setIsOnline(customEvent.detail.isOnline);
      } else {
        void fetchJobsData();
      }
    };

    window.addEventListener(PARTNER_LIVE_STATE_EVENT, handleLiveState as EventListener);
    return () => window.removeEventListener(PARTNER_LIVE_STATE_EVENT, handleLiveState as EventListener);
  }, []);

  const fetchJobsData = async () => {
    try {
      const mechanicId = localStorage.getItem('mechanicId');
      const [jobsRes, profileRes] = await Promise.all([
        apiClient<any[]>('/mechanic/jobs'),
        mechanicId ? apiClient<any>(`/public/mechanics/${mechanicId}`).catch(() => null) : Promise.resolve(null)
      ]);

      setJobs(jobsRes || []);
      syncIncomingRequest(jobsRes || []);
      if (profileRes) {
        setProfile(profileRes);
        applyProfileLiveState(profileRes);
      }

      if (jobsRes && jobsRes.length > 0 && jobsRes[0].Mechanic) {
        setIsOnline(jobsRes[0].Mechanic.isOnline);
      }
    } catch (err) {
      console.error("Failed to fetch partner dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async () => {
    try {
      const newState = !isOnline;
      setIsOnline(newState);
      if (newState) {
        await apiClient('/mechanic/live/go-online', { method: 'POST', data: { availabilityState: 'ONLINE_IDLE' } });
        toast.success("You are now Online");
        window.dispatchEvent(new CustomEvent(PARTNER_LIVE_STATE_EVENT, { detail: { isOnline: true } }));
      } else {
        await apiClient('/mechanic/live/go-offline', { method: 'POST', data: { notes: 'Going offline manually' } });
        toast.success("You are now Offline");
        window.dispatchEvent(new CustomEvent(PARTNER_LIVE_STATE_EVENT, { detail: { isOnline: false } }));
      }
      await fetchStaticData();
      await fetchJobsData();
    } catch (err) {
      toast.error("Failed to change online status");
      setIsOnline(!isOnline); // revert
    }
  };

  const activeJobs = jobs.filter(j => ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'SERVICE_STARTED'].includes(j.status));
  const currentJob = activeJobs.length > 0 ? activeJobs[0] : null;
  const completedJobs = jobs.filter(j => j.status === 'SERVICE_COMPLETED').length;
  const liveNotifications = jobs.filter(j => ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED'].includes(j.status)).length;
  const availableJobs = jobs.filter(j => j.status === 'ASSIGNED').length;
  const areaDemandTitle = availableJobs > 0 ? 'Requests Waiting Nearby' : isOnline ? 'Coverage Active' : 'Go Online For Demand';
  const areaDemandSubtitle = availableJobs > 0
    ? `${availableJobs} request${availableJobs > 1 ? 's are' : ' is'} waiting for partner response`
    : isOnline
      ? `${liveNotifications} live dispatch update${liveNotifications === 1 ? '' : 's'} in your current feed`
      : 'Turn on availability to receive nearby requests';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full bg-background p-4 max-w-lg mx-auto pb-32">
      
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
        <button 
          onClick={toggleOnline}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm border ${isOnline ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-secondary text-muted-foreground border-border'}`}
        >
          <Power className={`w-4 h-4 ${isOnline ? 'text-emerald-500' : ''}`} />
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </button>
      </div>

      {/* Earnings Summary */}
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-primary text-primary-foreground rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(var(--primary),0.3)] mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary-foreground/80 mb-1">Today's Earnings</h2>
        <div className="flex items-end gap-3 relative z-10">
          <span className="text-4xl font-black">₹{earnings.today.toLocaleString()}</span>
          {earnings.growth > 0 ? (
            <span className="text-sm font-bold text-emerald-300 mb-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> {earnings.growth}% of weekly net
            </span>
          ) : null}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jobs completed</p>
          <p className="mt-2 text-2xl font-black text-foreground">{completedJobs}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hours online</p>
          <p className="mt-2 text-2xl font-black text-foreground">{Number(performance?.metrics?.onlineHours || 0).toFixed(1)} h</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rating / score</p>
          <p className="mt-2 text-2xl font-black text-foreground flex items-center gap-2">
            {profile?.rating ? Number(profile.rating).toFixed(1) : Number(performance?.score || 0).toFixed(1)}
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </p>
        </div>
        <Link to="/partner/notifications" className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notifications</p>
          <p className="mt-2 text-2xl font-black text-foreground flex items-center gap-2">
            {liveNotifications}
            <Bell className="w-4 h-4 text-primary" />
          </p>
        </Link>
      </div>

      {/* Current Job (If Active) */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Active Job</h3>
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : currentJob ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border-2 border-amber-500/50 shadow-[0_8px_30px_rgba(245,158,11,0.15)] rounded-2xl p-5 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            {currentJob.status.replace('_', ' ')}
          </div>
          <div className="flex items-center gap-4 mb-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-foreground">{currentJob.issueSummary || 'Service Request'}</h4>
              <p className="text-sm font-semibold text-muted-foreground">{currentJob.CustomerUser?.CustomerProfile?.displayName || 'Customer'} • {currentJob.vehicleLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2 mb-5 bg-background/50 p-3 rounded-xl border border-border">
             <div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location</p>
               <p className="text-sm font-bold text-foreground truncate pr-2">{currentJob.addressText || 'Unknown'}</p>
             </div>
             <div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ETA</p>
               <p className="text-sm font-bold text-foreground">{currentJob.currentEtaMinutes || '--'} min</p>
             </div>
          </div>

          <Link to={`/partner/request/${currentJob.id}`} className="w-full bg-foreground text-background p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md">
            <Navigation className="w-4 h-4" /> Open Job Details
          </Link>
        </motion.div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 mb-8 text-center flex flex-col items-center justify-center">
           <p className="text-muted-foreground font-semibold mb-2">No active jobs right now</p>
           {isOnline ? (
             <div className="flex items-center gap-2 text-sm text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full animate-pulse">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               Waiting for requests...
             </div>
           ) : (
             <button onClick={toggleOnline} className="text-sm text-primary font-bold hover:underline">Go online to receive jobs</button>
           )}
        </div>
      )}

      {/* Demand Area */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Area Status</h3>
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center relative">
          <div className="absolute inset-0 border-2 border-destructive rounded-full animate-ping opacity-20"></div>
          <MapPin className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h4 className="font-bold text-foreground">{areaDemandTitle}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{areaDemandSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Link to="/partner/performance" className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <TrendingUp className="w-4 h-4 text-primary" /> Performance
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Acceptance {Number(performance?.metrics?.acceptRate || 0).toFixed(0)}%</p>
        </Link>
        <Link to="/partner/requests" className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Clock3 className="w-4 h-4 text-primary" /> Active flow
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{currentJob ? currentJob.status.replace(/_/g, ' ') : 'No active job right now'}</p>
        </Link>
      </div>

      {/* INCOMING REQUEST MODAL */}
      <AnimatePresence>
        {showIncoming && incomingRequest && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-card border-2 border-primary shadow-[0_0_50px_rgba(var(--primary),0.3)] rounded-[2rem] w-full max-w-sm overflow-hidden"
            >
              
              {/* Map Header */}
              <div className="h-40 bg-secondary relative">
                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=11.0168,76.9558&zoom=14&size=400x200&sensor=false&key=')] bg-cover opacity-60 mix-blend-luminosity grayscale"></div>
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black text-primary border border-primary/20 shadow-sm animate-pulse">
                  NEW REQUEST
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <MapPin className="w-10 h-10 -mt-10 text-primary drop-shadow-md animate-bounce" />
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-black text-foreground mb-1">{incomingRequest.issueSummary}</h2>
                <p className="text-sm font-semibold text-muted-foreground mb-6">{incomingRequest.CustomerUser?.CustomerProfile?.displayName || 'Customer'} • {incomingRequest.vehicleLabel}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-secondary p-3 rounded-xl border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                    <p className="font-bold text-sm truncate">{incomingRequest.addressText}</p>
                  </div>
                  <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Est. Platform Fee</p>
                    <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg">₹{incomingRequest.feeAmount || 50}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={async () => {
                      await apiClient(`/mechanic/jobs/${incomingRequest.id}/reject`, { method: 'POST', data: { reason: 'Busy' } });
                      setShowIncoming(false);
                      fetchJobsData();
                    }}
                    className="flex-1 bg-secondary text-secondary-foreground font-bold p-4 rounded-xl flex items-center justify-center hover:bg-secondary/80 transition-colors border border-border"
                  >
                    <X className="w-5 h-5 mr-2" /> Reject
                  </button>
                  <Link 
                    to={`/partner/request/${incomingRequest.id}`}
                    onClick={async (e) => {
                      e.preventDefault();
                      await apiClient(`/mechanic/jobs/${incomingRequest.id}/accept`, { method: 'POST' });
                      setShowIncoming(false);
                      window.location.href = `/partner/request/${incomingRequest.id}`;
                    }}
                    className="flex-[2] bg-primary text-primary-foreground font-black p-4 rounded-xl flex items-center justify-center hover:opacity-90 shadow-[0_8px_20px_rgba(var(--primary),0.3)] transition-transform hover:-translate-y-1"
                  >
                    ACCEPT
                  </Link>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
