import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Phone, MessageSquare, MapPin, Navigation, User, Car, Clock, ShieldCheck, FileText, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getRequestStatusMeta, getRequestToneClasses, isCancelledRequestStatus, isCompletedRequestStatus } from '../../lib/requestLifecycle';

export default function PartnerActiveJobPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let closed = false;
    const closeStream = openRealtimeStream<any>(`/mechanic/jobs/${id}/stream`, {
      event: 'job:update',
      onMessage: (res) => {
        if (closed) return;
        setJob(res);
        setLoading(false);
      },
      onError: () => {
        if (!closed) {
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
    } catch (err) {
      console.error("Failed to fetch job", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await apiClient(`/mechanic/jobs/${id}/status`, {
        method: 'PUT',
        data: { status: newStatus }
      });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchJob();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

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
        
        {/* Map Preview */}
        <div className="w-full h-48 bg-secondary rounded-2xl border border-border overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=11.0168,76.9558&zoom=15&size=600x300&sensor=false&key=')] bg-cover opacity-60 mix-blend-luminosity grayscale"></div>
          
          {/* Customer Pin */}
          <div className="absolute top-[30%] left-[60%] text-destructive drop-shadow-md">
            <div className="w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
               <User className="w-4 h-4" />
            </div>
          </div>
          
          {/* Partner Pin */}
          {(jobState === 'ACCEPTED' || jobState === 'EN_ROUTE') && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-[70%] left-[30%] text-primary drop-shadow-md">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <Car className="w-4 h-4" />
              </div>
            </motion.div>
          )}
          
          {/* External Nav CTA */}
          <a href={`https://www.google.com/maps/search/?api=1&query=${job.latitude},${job.longitude}`} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 bg-background/90 backdrop-blur text-foreground border border-border px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1 hover:bg-background">
            <Navigation className="w-3 h-3 text-primary" /> Open Maps
          </a>
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
                className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" /> START NAVIGATION
              </button>
            )}

            {jobState === 'EN_ROUTE' && (
              <button 
                onClick={() => updateStatus('ARRIVED')}
                className="w-full bg-blue-500 text-white p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" /> I HAVE ARRIVED
              </button>
            )}

            {jobState === 'ARRIVED' && (
              <button 
                onClick={() => updateStatus('SERVICE_STARTED')}
                className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mt-2"
              >
                <Clock className="w-5 h-5" /> START SERVICE
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
