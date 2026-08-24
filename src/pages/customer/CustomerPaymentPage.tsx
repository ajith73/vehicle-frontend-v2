import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CreditCard, Landmark, CheckCircle2, ShieldCheck, FileText, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

type PaymentState = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export default function CustomerPaymentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [paymentState, setPaymentState] = useState<PaymentState>('PENDING');
  const [paymentMethod, setPaymentMethod] = useState('MOCK_SUCCESS');
  const [showMockPopup, setShowMockPopup] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handlePay = () => {
    setShowMockPopup(true);
  };

  const loadPaymentData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [quoteData, paymentData] = await Promise.all([
        apiClient<any>(`/customer/requests/${id}/quote`),
        apiClient<any>(`/customer/requests/${id}/payment/status`).catch(() => null)
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
      toast.error(error.message || 'Failed to load payment details');
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

  if (paymentState === 'PAID') {
    return (
      <div className="flex flex-col h-[100dvh] bg-background items-center justify-center p-4">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">Payment Successful</h1>
        <p className="text-muted-foreground font-medium mb-8 text-center max-w-xs">
          Thank you! ₹{totalAmount.toFixed(2)} has been paid successfully to {partnerName}.
        </p>
        
        <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-4 mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-bold">{latestPayment?.transactionReference || 'Generated'}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Date</span>
            <span className="font-bold">{new Date(latestPayment?.paidAt || latestPayment?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span className="font-bold">{latestPayment?.paymentMethod || 'Mock gateway'}</span>
          </div>
        </div>

        <Link to={`/customer/request/${id}/rating`} className="w-full max-w-sm bg-primary text-primary-foreground font-bold p-4 rounded-xl text-center shadow-lg hover:scale-105 transition-transform">
          Continue to Rating
        </Link>
      </div>
    );
  }

  if (paymentState === 'FAILED') {
    return (
      <div className="flex flex-col h-[100dvh] bg-background items-center justify-center p-4">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">Payment Failed</h1>
        <p className="text-muted-foreground font-medium mb-8 text-center max-w-xs">
          The mock payment flow returned a failure state. You can retry with success or failure again until Razorpay is integrated.
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <button onClick={() => setPaymentState('PENDING')} className="rounded-xl bg-primary px-4 py-4 font-bold text-primary-foreground">
            Retry payment
          </button>
          <Link to={`/customer/request/${id}`} className="rounded-xl border border-border bg-card px-4 py-4 text-center font-bold text-foreground">
            Back to request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-foreground">Checkout</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        
        <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
               <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Service Summary</h3>
              <p className="text-sm text-muted-foreground">{quote?.notes || 'Approved quote ready for payment'}</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Partner</span>
              <span className="font-bold">{partnerName}</span>
            </div>
            {(quote?.RequestQuoteLineItems || []).map((item: any) => (
              <div key={item.id || item.label} className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">{item.label}</span>
                <span className="font-bold">₹{Number(item.totalAmount || 0).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Taxes & Platform Fee</span>
              <span className="font-bold">₹{(Number(quote?.taxAmount || 0) + Number(quote?.feeAmount || 0)).toFixed(2)}</span>
            </div>
          </div>

          <div className="h-[2px] bg-border my-4 border-dashed border-b border-t-0 border-r-0 border-l-0"></div>
          
          <div className="flex justify-between items-center mt-4">
            <span className="font-black text-xl">Total To Pay</span>
            <span className="font-black text-3xl text-primary">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4 pl-2">Select Payment Method</h3>
        
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-4 bg-card border-2 border-primary rounded-2xl p-4 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[100px]" />
            <input type="radio" name="payment" checked={paymentMethod === 'MOCK_SUCCESS'} onChange={() => setPaymentMethod('MOCK_SUCCESS')} className="w-5 h-5 accent-primary" />
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <span className="font-black text-primary">UPI</span>
            </div>
            <div className="flex-1">
              <p className="font-bold">UPI / QR Code</p>
              <p className="text-xs text-muted-foreground mt-0.5">Google Pay, PhonePe, Paytm</p>
            </div>
          </label>

          <label className="flex items-center gap-4 bg-card border border-border hover:border-primary/50 rounded-2xl p-4 cursor-pointer">
            <input type="radio" name="payment" checked={paymentMethod === 'MOCK_FAILURE'} onChange={() => setPaymentMethod('MOCK_FAILURE')} className="w-5 h-5 accent-primary" />
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
               <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Test failure path</p>
              <p className="text-xs text-muted-foreground mt-0.5">Use this to simulate failed Razorpay checkout during QA</p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 mt-6 justify-center text-xs text-muted-foreground font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          100% Secure Payments
        </div>

      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto w-full flex gap-4">
          <button 
            onClick={handlePay}
            disabled={paymentState === 'PROCESSING'}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground p-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100"
          >
            {paymentState === 'PROCESSING' ? (
              <span className="flex items-center gap-2 animate-pulse">Processing...</span>
            ) : (
              `Pay ₹${totalAmount.toFixed(2)}`
            )}
          </button>
        </div>
      </div>

      {showMockPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-black text-foreground">Mock Razorpay Tester</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Razorpay is not connected yet. Choose a temporary outcome for this request payment.
            </p>
            <div className="mt-6 grid gap-3">
              <button onClick={() => void confirmMockPayment('MOCK_SUCCESS')} className="rounded-xl bg-emerald-600 px-4 py-4 font-bold text-white">
                Mock Success Payment
              </button>
              <button onClick={() => void confirmMockPayment('MOCK_FAILURE')} className="rounded-xl bg-destructive px-4 py-4 font-bold text-destructive-foreground">
                Mock Failed Payment
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
