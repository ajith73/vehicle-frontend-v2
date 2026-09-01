import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

type QuoteLineItem = {
  id?: number | string;
  label?: string;
  quantity?: number;
  unitAmount?: number;
  totalAmount?: number;
  category?: string;
};

type QuoteRecord = {
  id: number;
  status?: string;
  notes?: string;
  taxAmount?: number;
  feeAmount?: number;
  totalAmount?: number;
  createdAt?: string;
  Mechanic?: {
    name?: string;
    businessName?: string;
    phone?: string;
  };
  RequestQuoteLineItems?: QuoteLineItem[];
};

const formatMoney = (value: unknown) => `₹${Number(value || 0).toFixed(2)}`;

export default function CustomerQuotePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchQuote = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiClient<QuoteRecord>(`/customer/requests/${id}/quote`);
      setQuote(data);
    } catch (error: any) {
      const message = error.message || 'Failed to load quote';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuote();
  }, [id]);

  const lineItems = useMemo(() => quote?.RequestQuoteLineItems || [], [quote]);
  const partnerName = quote?.Mechanic?.businessName || quote?.Mechanic?.name || 'Assigned partner';
  const quoteStatus = String(quote?.status || '');
  const quoteSubmittedAt = quote?.createdAt ? new Date(quote.createdAt).toLocaleString('en-IN') : null;

  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (!id) return;
    setSaving(true);
    try {
      await apiClient(`/customer/requests/${id}/quote/${decision}`, {
        method: 'POST',
        data: {}
      });
      toast.success(decision === 'approve' ? 'Quote approved' : 'Quote rejected');
      if (decision === 'approve') {
        navigate(`/customer/request/${id}/payment`);
      } else {
        navigate(`/customer/request/${id}`);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${decision} quote`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-8">
        <div className="w-full rounded-[2rem] border border-border bg-card p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-4 text-xl font-black text-foreground">Could not load quotation</h2>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => void fetchQuote()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <Link
              to={`/customer/request/${id}`}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground"
            >
              Back to request
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-black text-foreground">Quote not available yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your mechanic has not submitted the quotation yet.</p>
        </div>
        <Link to={`/customer/request/${id}`} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
          Back to request
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 transition-colors hover:bg-secondary">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-black text-foreground">Review Quotation</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-10 sm:max-w-4xl sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                    <FileText className="h-7 w-7 text-amber-500" />
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-foreground">Service quotation</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    {partnerName} inspected your vehicle and submitted a quote for approval before work continues.
                  </p>
                </div>
                <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
                  {quoteStatus || 'SUBMITTED'}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Partner</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{partnerName}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Submitted</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{quoteSubmittedAt || 'Just now'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">Inspection summary</h3>
              </div>
              <p className="mt-4 rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-6 text-foreground/90">
                {quote.notes || 'Your mechanic has reviewed the issue and submitted this quotation.'}
              </p>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <h3 className="text-lg font-black text-foreground">Cost breakdown</h3>
                <p className="text-xs font-semibold text-muted-foreground">{lineItems.length} item{lineItems.length === 1 ? '' : 's'}</p>
              </div>

              <div className="mt-4 space-y-3">
                {lineItems.map((item) => {
                  const quantity = Number(item.quantity || 1);
                  const unitAmount = Number(item.unitAmount || 0);
                  const totalAmount = Number(item.totalAmount ?? unitAmount * quantity);
                  return (
                    <div key={item.id || item.label} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.label || 'Line item'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.category || 'SERVICE'} • Qty {quantity} • {formatMoney(unitAmount)} each
                          </p>
                        </div>
                        <p className="text-sm font-black text-foreground">{formatMoney(totalAmount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3 rounded-2xl border border-border bg-background px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-bold text-foreground">{formatMoney(quote.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span className="font-bold text-foreground">{formatMoney(quote.feeAmount)}</span>
                </div>
                <div className="border-t border-dashed border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-foreground">Total amount</span>
                    <span className="text-2xl font-black text-primary">{formatMoney(quote.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">What happens next</p>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Approve to continue</p>
                    <p className="mt-1 text-sm text-muted-foreground">Approval moves this request to payment and final completion.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Reject if details are wrong</p>
                    <p className="mt-1 text-sm text-muted-foreground">If something looks incorrect, reject and contact support or the mechanic.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Keep this screen for records</p>
                    <p className="mt-1 text-sm text-muted-foreground">You can return to the active request page any time to see the latest status.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">Need clarification?</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Ask for help if pricing, parts, or work details do not match what you expected.</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  to={`/customer/support?requestId=${id}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground"
                >
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Ask mechanic or support
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => void handleDecision('approve')}
                disabled={saving}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-black text-primary-foreground shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Approve and continue
              </button>
              <button
                onClick={() => void handleDecision('reject')}
                disabled={saving}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Reject quote
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
