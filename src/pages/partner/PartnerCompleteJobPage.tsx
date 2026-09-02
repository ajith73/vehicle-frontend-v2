import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Camera, CheckCircle2, ChevronLeft, FileText, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type JobRecord = {
  id: number;
  status?: string;
  finalAmount?: number;
  issueSummary?: string;
  CustomerUser?: {
    CustomerProfile?: {
      displayName?: string;
    };
  };
  RequestQuotes?: Array<{
    RequestQuoteLineItems?: Array<{
      id?: number | string;
      label?: string;
      totalAmount?: number;
    }>;
  }>;
};

const formatMoney = (value: unknown) => `₹${Number(value || 0).toFixed(2)}`;

export default function PartnerCompleteJobPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);

  const fetchJob = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient<JobRecord>(`/mechanic/jobs/${id}`);
      setJob(res);
      if (res?.status === 'SERVICE_COMPLETED') {
        setCompleted(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJob();
  }, [id]);

  const otp = otpDigits.join('');
  const finalAmount = Number(job?.finalAmount || 0);
  const customerName = job?.CustomerUser?.CustomerProfile?.displayName || 'Customer';
  const lineItems = job?.RequestQuotes?.[0]?.RequestQuoteLineItems || [];

  const otpHint = useMemo(() => {
    if (otp.length === 0) return 'Enter the 4-digit completion OTP from the customer app.';
    if (otp.length < 4) return 'Keep going until all 4 digits are filled.';
    return 'OTP looks complete. You can finish the job now.';
  }, [otp.length]);

  const updateOtpDigit = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    if (pasted.length === 0) return;
    setOtpDigits((current) => current.map((digit, index) => pasted[index] ?? digit));
    otpRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  const handleComplete = async () => {
    if (otp.length < 4) {
      toast.error('Please enter the 4-digit completion OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient(`/mechanic/jobs/${id}/status`, {
        method: 'PUT',
        data: { status: 'SERVICE_COMPLETED', pin: otp }
      });
      setCompleted(true);
      toast.success('Job marked as completed');
      setTimeout(() => {
        navigate('/partner/requests');
      }, 2500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete job. Please verify the OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-lg font-bold text-foreground">Job not found</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground">
            Go back
          </button>
          <button onClick={() => void fetchJob()} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[60vh] flex-col items-center justify-center bg-background p-4 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </motion.div>
        <h1 className="text-3xl font-black text-foreground">Job completed</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Payment for {formatMoney(finalAmount)} has been triggered and this job will now move to settlement history.
        </p>
        <p className="mt-5 text-xs text-muted-foreground">Redirecting to requests...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 transition-colors hover:bg-secondary">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-lg font-black text-foreground">Complete Job</h1>
        <button onClick={() => void fetchJob()} className="rounded-full p-2 transition-colors hover:bg-secondary" aria-label="Refresh job">
          <RefreshCw className="h-5 w-5 text-foreground" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-4xl p-4 pb-32 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground">Ready to finish service</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Confirm the customer OTP only after the work is fully done and the customer has reviewed it.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Customer</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{customerName}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Final amount</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{formatMoney(finalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-black text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Service summary
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-border bg-background px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Issue</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{job.issueSummary || 'Vehicle assistance request'}</p>
                </div>
                {lineItems.map((item) => (
                  <div key={item.id || item.label} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                    <span className="font-medium text-foreground">{item.label || 'Line item'}</span>
                    <span className="font-bold text-foreground">{formatMoney(item.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-black text-foreground">Proof of work</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep proof capture ready for the next enhancement pass. This phase still completes using OTP confirmation.
              </p>
              <div className="mt-4 flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background text-muted-foreground">
                <Camera className="h-8 w-8" />
                <span className="mt-2 text-sm font-bold">Proof capture UI reserved</span>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-black text-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Customer confirmation
              </h3>
              <p className="mt-3 text-sm text-foreground">
                Ask {customerName} for the 4-digit completion OTP shown in the customer app.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => updateOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    className="h-14 w-14 rounded-2xl border-2 border-border bg-background text-center text-2xl font-black text-foreground outline-none transition-colors focus:border-primary"
                    placeholder="•"
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-xs font-semibold text-muted-foreground">{otpHint}</p>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-black text-foreground">Before you complete</h3>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <p>1. Confirm the vehicle issue is resolved.</p>
                <p>2. Review final price with the customer.</p>
                <p>3. Enter the OTP only in front of the customer.</p>
              </div>
            </div>

            <Link to={`/partner/request/${id}`} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground">
              Back to active request
            </Link>
          </aside>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex w-full max-w-4xl gap-3">
          <button
            onClick={handleComplete}
            disabled={otp.length < 4 || isSubmitting}
            className="w-full rounded-2xl bg-emerald-500 p-4 text-lg font-black text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              {isSubmitting ? 'Verifying...' : 'Confirm and complete'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
