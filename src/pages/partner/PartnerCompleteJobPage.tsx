import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Camera, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PartnerCompleteJobPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await apiClient<any>(`/mechanic/jobs/${id}`);
      setJob(res);
      if (res && res.status === 'SERVICE_COMPLETED') {
        setCompleted(true);
      }
    } catch (err) {
      console.error("Failed to fetch job", err);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (otp.length < 4) {
      toast.error('Please enter the 4-digit PIN');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Assuming PIN validation is handled or ignored for now, updating status to completed
      await apiClient(`/mechanic/jobs/${id}/status`, {
        method: 'PUT',
        data: { status: 'SERVICE_COMPLETED', pin: otp }
      });
      setCompleted(true);
      setTimeout(() => {
        navigate('/partner/requests');
      }, 3000);
    } catch (err) {
      toast.error("Failed to complete job. Invalid PIN?");
    } finally {
      setIsSubmitting(false);
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
        <button onClick={() => navigate(-1)} className="text-primary hover:underline">Go Back</button>
      </div>
    );
  }

  const finalAmount = job.finalAmount || 0;
  const customerName = job.CustomerUser?.CustomerProfile?.displayName || 'Customer';

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-[100dvh] bg-background items-center justify-center p-4 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <h1 className="text-3xl font-black text-foreground mb-2">Job Completed!</h1>
        <p className="text-muted-foreground font-medium max-w-xs mb-8">
          Great work! Payment of ₹{finalAmount.toLocaleString()} has been triggered and will reflect in your earnings shortly.
        </p>
        <p className="text-xs text-muted-foreground animate-pulse">Redirecting to Dashboard...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-black text-foreground">Complete Job</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        
        {/* Service Summary */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
             <FileText className="w-4 h-4" /> Service Summary
          </h3>
          
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Service Requested</span>
              <span className="font-bold">{job.issueSummary}</span>
            </div>
            {job.RequestQuotes && job.RequestQuotes.length > 0 && job.RequestQuotes[0].RequestQuoteLineItems && (
              job.RequestQuotes[0].RequestQuoteLineItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className="font-bold">₹{item.totalAmount}</span>
                </div>
              ))
            )}
          </div>

          <div className="h-[2px] bg-border my-4 border-dashed border-b border-t-0 border-r-0 border-l-0"></div>
          
          <div className="flex justify-between items-center">
            <span className="font-black text-lg">Total Amount</span>
            <span className="font-black text-2xl text-emerald-500">₹{finalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Proof of Work */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">Proof of Work</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload a photo of the completed service (e.g. newly installed battery).</p>
          <button className="w-full h-32 rounded-xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors">
             <Camera className="w-8 h-8 mb-2" />
             <span className="font-bold text-sm">Tap to take photo</span>
          </button>
        </div>

        {/* Customer Confirmation */}
        <div className="bg-card border-2 border-primary/20 rounded-2xl p-5 mb-6 shadow-sm bg-primary/5">
          <h3 className="font-bold text-sm text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
             <ShieldCheck className="w-4 h-4" /> Customer Confirmation
          </h3>
          <p className="text-sm text-foreground mb-4">
            Ask the customer ({customerName}) for the 4-digit completion PIN sent to their app/SMS.
          </p>
          
          <div className="flex justify-center gap-3">
             <input type="text" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full max-w-[200px] text-center text-3xl font-black tracking-[0.5em] bg-background border-2 border-border focus:border-primary p-4 rounded-xl outline-none transition-colors" placeholder="••••" />
          </div>
        </div>

      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-lg mx-auto w-full flex gap-3">
          <button 
            onClick={handleComplete}
            disabled={otp.length < 4 || isSubmitting}
            className={`w-full ${isSubmitting ? 'bg-emerald-500/50 cursor-not-allowed' : 'bg-emerald-500 hover:scale-[1.02]'} text-white p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-2`}
          >
            <CheckCircle2 className="w-5 h-5" /> {isSubmitting ? 'VERIFYING...' : 'CONFIRM & COMPLETE'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
