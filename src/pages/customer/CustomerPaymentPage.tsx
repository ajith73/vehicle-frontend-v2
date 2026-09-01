import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  FileText,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

type PaymentState = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

type QuoteLineItem = {
  id?: number | string;
  label?: string;
  totalAmount?: number;
};

type QuoteRecord = {
  notes?: string;
  totalAmount?: number;
  taxAmount?: number;
  feeAmount?: number;
  RequestQuoteLineItems?: QuoteLineItem[];
  Mechanic?: {
    name?: string;
    businessName?: string;
  };
};

type PaymentTransactionRecord = {
  transactionReference?: string;
  paidAt?: string;
  createdAt?: string;
  paymentMethod?: string;
  paymentStatus?: string;
};

type PaymentStatusRecord = {
  paymentStatus?: string;
  finalAmount?: number;
  payments?: PaymentTransactionRecord[];
};

const formatMoney = (value: unknown) => `₹${Number(value || 0).toFixed(2)}`;

export default function CustomerPaymentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [paymentState, setPaymentState] = useState<PaymentState>('PENDING');
  const [paymentMethod, setPaymentMethod] = useState<'MOCK_SUCCESS' | 'MOCK_FAILURE'>('MOCK_SUCCESS');
  const [showMockPopup, setShowMockPopup] = useState(false);
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handlePay = () => {
    setShowMockPopup(true);
  };

  const loadPaymentData = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [quoteData, paymentData] = await Promise.all([
        apiClient<QuoteRecord>(`/customer/requests/${id}/quote`),
        apiClient<PaymentStatusRecord>(`/customer/requests/${id}/payment/status`).catch(() => null)
      ]);
      setQuote(quoteData);
      setPaymentStatus(paymentData);
      if (paymentData?.paymentStatus === 'PAYMENT_COMPLETED') {
        setPaymentState('PAID');
      } else if (paymentData?.paymentStatus === 'PAYMENT_FAILED') {
        setPaymentState('FAILED');
      } else {
        setPaymentState('PENDING');
      }
    } catch (error: any) {
      const message = error.message || 'Failed to load payment details';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPaymentData();
  }, [id]);

  const latestPayment = useMemo(() => paymentStatus?.payments?.[0] || null, [paymentStatus]);
  const totalAmount = Number(quote?.totalAmount || paymentStatus?.finalAmount || 0);
  const partnerName = quote?.Mechanic?.businessName || quote?.Mechanic?.name || 'Assigned partner';
  const lineItems = quote?.RequestQuoteLineItems || [];

  const confirmMockPayment = async (method: 'MOCK_SUCCESS' | 'MOCK_FAILURE') => {
    if (!id) return;
    setPaymentState('PROCESSING');
    setShowMockPopup(false);
    try {
      await apiClient(`/customer/requests/${id}/payment/initiate`, {
        method: 'POST',
        data: { paymentMethod: method }
      });
      await loadPaymentData();
      setPaymentState(method === 'MOCK_FAILURE' ? 'FAILED' : 'PAID');
      if (method === 'MOCK_FAILURE') {
        toast.error('Mock payment failed');
      } else {
        toast.success('Mock payment successful');
      }
    } catch (error: any) {
      setPaymentState('FAILED');
      toast.error(error.message || 'Failed to process payment');
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
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-black text-foreground">Payment details unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => void loadPaymentData()}
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

  if (paymentState === 'PAID') {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background p-4">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <h1 className="text-center text-3xl font-black text-foreground">Payment successful</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
          {formatMoney(totalAmount)} has been recorded successfully for {partnerName}.
        </p>

        <div className="mt-8 w-full max-w-sm rounded-3xl border border-border bg-card p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="max-w-[55%] truncate font-bold text-foreground">{latestPayment?.transactionReference || 'Generated'}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-bold text-foreground">
              {new Date(latestPayment?.paidAt || latestPayment?.createdAt || Date.now()).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span className="font-bold text-foreground">{latestPayment?.paymentMethod || 'Mock gateway'}</span>
          </div>
        </div>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Link to={`/customer/request/${id}/rating`} className="rounded-2xl bg-primary px-4 py-4 text-center text-base font-black text-primary-foreground">
            Continue to rating
          </Link>
          <Link to={`/customer/request/${id}`} className="rounded-2xl border border-border bg-card px-4 py-4 text-center text-sm font-bold text-foreground">
            Back to request
          </Link>
        </div>
      </div>
    );
  }

  if (paymentState === 'FAILED') {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background p-4">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-center text-3xl font-black text-foreground">Payment failed</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
          This is the temporary mock failure path for QA until Razorpay is connected. You can retry now.
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <button onClick={() => setPaymentState('PENDING')} className="rounded-2xl bg-primary px-4 py-4 font-bold text-primary-foreground">
            Retry payment
          </button>
          <Link to={`/customer/request/${id}`} className="rounded-2xl border border-border bg-card px-4 py-4 text-center font-bold text-foreground">
            Back to request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 transition-colors hover:bg-secondary">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-black text-foreground">Checkout</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-36 sm:max-w-4xl sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Wallet className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground">Complete your payment</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your quote is approved. Finish checkout to close the request and continue to rating.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Partner</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{partnerName}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{paymentStatus?.paymentStatus || 'PAYMENT_PENDING'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Payment summary</h3>
                  <p className="text-sm text-muted-foreground">{quote?.notes || 'Approved quote ready for payment'}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                {lineItems.map((item) => (
                  <div key={item.id || item.label} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                    <span className="font-medium text-foreground">{item.label || 'Line item'}</span>
                    <span className="font-bold text-foreground">{formatMoney(item.totalAmount)}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-bold text-foreground">{formatMoney(quote?.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span className="font-bold text-foreground">{formatMoney(quote?.feeAmount)}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-dashed border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-foreground">Total to pay</span>
                  <span className="text-3xl font-black text-primary">{formatMoney(totalAmount)}</span>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-black text-foreground">Select payment method</h3>
              <div className="mt-4 flex flex-col gap-3">
                <label className="relative flex cursor-pointer items-start gap-4 overflow-hidden rounded-2xl border-2 border-primary bg-primary/5 p-4">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'MOCK_SUCCESS'}
                    onChange={() => setPaymentMethod('MOCK_SUCCESS')}
                    className="mt-1 h-5 w-5 accent-primary"
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">Mock success payment</p>
                    <p className="mt-1 text-xs text-muted-foreground">Use this while Razorpay is pending to verify successful checkout flow.</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'MOCK_FAILURE'}
                    onChange={() => setPaymentMethod('MOCK_FAILURE')}
                    className="mt-1 h-5 w-5 accent-primary"
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">Mock failure payment</p>
                    <p className="mt-1 text-xs text-muted-foreground">Use this to verify retry, failure message, and payment support handling.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">What happens next</h3>
              </div>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <p>1. Complete the mock payment for this request.</p>
                <p>2. RoadResQ records the transaction and updates request status.</p>
                <p>3. You continue to rating, review, and invoice follow-up.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4">
          <div className="hidden min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-3 sm:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Selected method</p>
            <p className="mt-1 truncate text-sm font-bold text-foreground">
              {paymentMethod === 'MOCK_SUCCESS' ? 'Mock success payment' : 'Mock failure payment'}
            </p>
          </div>
          <button
            onClick={handlePay}
            disabled={paymentState === 'PROCESSING'}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black text-primary-foreground shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-transform hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 sm:w-auto"
          >
            {paymentState === 'PROCESSING' ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {paymentState === 'PROCESSING' ? 'Processing...' : `Pay ${formatMoney(totalAmount)}`}
          </button>
        </div>
      </div>

      {showMockPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-black text-foreground">Mock Razorpay tester</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Razorpay is not connected yet. Choose a temporary outcome for this payment.
            </p>
            <div className="mt-6 grid gap-3">
              <button onClick={() => void confirmMockPayment(paymentMethod)} className="rounded-xl bg-primary px-4 py-4 font-bold text-primary-foreground">
                Continue with selected method
              </button>
              <button onClick={() => void confirmMockPayment('MOCK_SUCCESS')} className="rounded-xl bg-emerald-600 px-4 py-4 font-bold text-white">
                Force success
              </button>
              <button onClick={() => void confirmMockPayment('MOCK_FAILURE')} className="rounded-xl bg-destructive px-4 py-4 font-bold text-destructive-foreground">
                Force failure
              </button>
              <button onClick={() => setShowMockPopup(false)} className="rounded-xl border border-border bg-background px-4 py-4 font-bold text-foreground">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
