import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, CheckCircle2, XCircle, HelpCircle, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

export default function CustomerQuotePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await apiClient<any>(`/customer/requests/${id}/quote`);
        setQuote(data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    void fetchQuote();
  }, [id]);

  const lineItems = useMemo(() => quote?.RequestQuoteLineItems || [], [quote]);
  const partnerName = quote?.Mechanic?.businessName || quote?.Mechanic?.name || 'Assigned partner';

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
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-foreground">Review Quotation</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Service Quotation</h2>
          <p className="text-muted-foreground font-medium">Your mechanic {partnerName} has inspected the vehicle and generated this quote.</p>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm mb-6">
          <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Problem Identified</h3>
          <p className="text-sm text-foreground/90 leading-relaxed mb-6">
            {quote.notes || 'Your mechanic has reviewed the issue and submitted this quotation.'}
          </p>

          <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Recommended Service</h3>
          <p className="text-sm font-semibold text-foreground mb-6">
            {lineItems.length > 0 ? lineItems.map((item: any) => item.label).join(', ') : 'Service quotation submitted'}
          </p>

          <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Cost Breakdown</h3>
          
          <div className="space-y-3 mb-6">
            {lineItems.map((item: any) => (
              <div key={item.id || item.label} className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">{item.label}</span>
                <span className="font-bold">₹{Number(item.totalAmount || 0).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Taxes</span>
              <span className="font-bold">₹{Number(quote.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Platform Fee</span>
              <span className="font-bold">₹{Number(quote.feeAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="h-[2px] bg-border my-4 border-dashed border-b border-t-0 border-r-0 border-l-0"></div>
          
          <div className="flex justify-between items-center mt-4">
            <span className="font-black text-xl">Total Amount</span>
            <span className="font-black text-3xl text-primary">₹{Number(quote.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pb-8">
          <button
            onClick={() => void handleDecision('approve')}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground p-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />} APPROVE & CONTINUE
          </button>
          
          <button
            onClick={() => void handleDecision('reject')}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive p-4 rounded-xl font-bold hover:bg-destructive/20 transition-colors disabled:opacity-60"
          >
            <XCircle className="w-5 h-5" /> Reject Quote
          </button>

          <div className="flex gap-3 mt-2">
            <Link to={`/customer/support?requestId=${id}`} className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-xl font-bold hover:bg-secondary/80 transition-colors text-sm">
              <HelpCircle className="w-4 h-4" /> Ask Mechanic
            </Link>
            <Link to={`/customer/support?requestId=${id}`} className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-xl font-bold hover:bg-secondary/80 transition-colors text-sm">
              <AlertTriangle className="w-4 h-4" /> Support
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
