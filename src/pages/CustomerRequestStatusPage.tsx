import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, MapPin, ShieldCheck, Wrench, XCircle } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { openRealtimeStream } from '../api/realtime';
import type { CustomerRequest } from '../types';
import { RequestTimeline } from '../components/customer/RequestTimeline';
import { SupportActionsCard } from '../components/customer/SupportActionsCard';
import { customerCancellationReasons, getRequestStatusMeta, getRequestToneClasses, isCancellableRequestStatus } from '../lib/requestLifecycle';

export default function CustomerRequestStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<CustomerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDetails, setCancelDetails] = useState('');
  const [quoteDecisionNotes, setQuoteDecisionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    let closed = false;

    const closeStream = openRealtimeStream<CustomerRequest>(`/customer/requests/${id}/stream`, {
      event: 'request:update',
      onMessage: (data) => {
        if (closed) return;
        setRequest(data);
        setLoading(false);
      },
      onError: async () => {
        if (closed) return;
        try {
          const data = await apiClient<CustomerRequest>(`/customer/requests/${id}/status`);
          if (!closed) {
            setRequest(data);
            setLoading(false);
          }
        } catch (error: any) {
          if (!closed) {
            toast.error(error.message || 'Failed to load request status');
            setLoading(false);
          }
        }
      }
    });

    return () => {
      closed = true;
      closeStream();
    };
  }, [id]);

  const canCancel = useMemo(() => {
    if (!request) return false;
    return isCancellableRequestStatus(request.status);
  }, [request]);

  const progressItems = [
    { key: 'acceptedAt', label: 'Accepted', value: request?.acceptedAt },
    { key: 'enRouteAt', label: 'En route', value: request?.enRouteAt },
    { key: 'arrivedAt', label: 'Arrived', value: request?.arrivedAt },
    { key: 'serviceStartedAt', label: 'Service started', value: request?.serviceStartedAt },
    { key: 'completedAt', label: 'Completed', value: request?.completedAt },
  ];

  const latestQuote = request?.RequestQuotes?.[0];
  const latestPayment = request?.PaymentTransactions?.[0];

  const formatCurrency = (amount?: number) => amount == null ? 'Pending' : new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);

  const handleCancel = async () => {
    if (!request || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason.');
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient<{ request: CustomerRequest }>(`/customer/requests/${request.id}/cancel`, {
        method: 'PUT',
        data: {
          reason: cancelReason.trim(),
          details: cancelDetails.trim() || undefined
        }
      });
      setRequest(response.request);
      toast.success('Request cancelled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel request');
    } finally {
      setSaving(false);
    }
  };

  const handleQuoteDecision = async (decision: 'approve' | 'reject') => {
    if (!request) return;
    setSaving(true);
    try {
      const response = await apiClient<{ request: CustomerRequest }>(`/customer/requests/${request.id}/quote/${decision}`, {
        method: 'POST',
        data: {
          notes: quoteDecisionNotes.trim() || undefined
        }
      });
      setRequest(response.request);
      setQuoteDecisionNotes('');
      toast.success(decision === 'approve' ? 'Quote approved' : 'Quote rejected');
    } catch (error: any) {
      toast.error(error.message || `Failed to ${decision} quote`);
    } finally {
      setSaving(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!request) return;
    setPaymentSaving(true);
    try {
      await apiClient(`/customer/requests/${request.id}/payment/initiate`, {
        method: 'POST',
        data: {
          paymentMethod: 'MANUAL_CAPTURE'
        }
      });
      const refreshed = await apiClient<CustomerRequest>(`/customer/requests/${request.id}/status`);
      setRequest(refreshed);
      toast.success('Payment readiness recorded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setPaymentSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm">Loading request status...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-lg font-bold text-foreground">Request not found</p>
          <p className="mt-2 text-sm text-muted-foreground">Please log in with the same customer account used to create the request.</p>
          <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Customer Request Status</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">#{request.id} {request.issueSummary}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{getRequestStatusMeta(request.status).headline}</p>
          <div className={`mt-5 inline-flex rounded-full border px-4 py-2 text-sm font-bold ${getRequestToneClasses(request.status)}`}>{getRequestStatusMeta(request.status).label}</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Live dispatch</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Dispatch state</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{request.dispatchStatus || 'DISPATCH_PENDING'}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Current ETA</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{request.currentEtaMinutes != null ? `${request.currentEtaMinutes} min` : 'Pending'}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Partner presence</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{request.Mechanic?.availabilityState || (request.Mechanic?.isOnline ? 'ONLINE' : 'Awaiting live update')}</p>
                </div>
              </div>
              {request.RequestDispatchAttempts && request.RequestDispatchAttempts.length > 0 && (
                <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm font-bold text-foreground">Dispatch history</p>
                  <div className="mt-3 space-y-2">
                    {request.RequestDispatchAttempts.slice(0, 3).map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{attempt.Mechanic?.businessName || attempt.Mechanic?.name || 'Dispatch pool'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{attempt.dispatchMode} • {attempt.attemptStatus}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(attempt.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Assigned mechanic</p>
              </div>
              <p className="mt-3 text-base font-bold text-foreground">{request.Mechanic?.businessName || request.Mechanic?.name || 'Not assigned yet'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{[request.Mechanic?.city, request.Mechanic?.state].filter(Boolean).join(', ') || 'Awaiting manual assignment'}</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Location</p>
              </div>
              <p className="mt-3 text-sm text-foreground">{request.addressText || `${request.latitude}, ${request.longitude}`}</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-bold text-foreground">Service progress</p>
              <div className="mt-4 space-y-3">
                {progressItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className={`text-xs font-semibold ${item.value ? 'text-primary' : 'text-muted-foreground'}`}>
                      {item.value ? new Date(item.value).toLocaleString('en-IN') : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <SupportActionsCard request={request} />

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Support visibility</p>
              </div>
              {request.SupportTickets && request.SupportTickets.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {request.SupportTickets.slice(0, 2).map((ticket) => (
                    <div key={ticket.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{ticket.status}</span>
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-foreground">{ticket.priority}</span>
                      </div>
                      <p className="mt-3 text-sm font-bold text-foreground">{ticket.subject}</p>
                      {ticket.description && <p className="mt-2 text-sm text-muted-foreground">{ticket.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No live support escalation is open on this request right now. If timing slips or reassignment is needed, operations can raise an intervention from the control tower.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Commercial summary</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Pricing mode</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{request.pricingMode || 'Not created yet'}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Final amount</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{formatCurrency(request.finalAmount)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Quote status</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{request.quoteStatus || 'Not available yet'}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Payment status</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{request.paymentStatus || 'Not ready yet'}</p>
                </div>
              </div>

              {latestQuote && (
                <div className="mt-5 rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">Latest quote</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {latestQuote.pricingMode} • Submitted {latestQuote.submittedAt ? new Date(latestQuote.submittedAt).toLocaleString('en-IN') : 'Pending'}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{latestQuote.status}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {latestQuote.RequestQuoteLineItems?.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.category} • Qty {item.quantity}</p>
                          {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(item.totalAmount)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">Subtotal: {formatCurrency(latestQuote.subtotalAmount)}</div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">Tax: {formatCurrency(latestQuote.taxAmount)}</div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground">Total: {formatCurrency(latestQuote.totalAmount)}</div>
                  </div>
                  {latestQuote.notes && <p className="mt-4 text-sm text-muted-foreground">{latestQuote.notes}</p>}
                  {latestQuote.customerDecisionNotes && <p className="mt-2 text-sm text-muted-foreground">Decision note: {latestQuote.customerDecisionNotes}</p>}

                  {latestQuote.status === 'QUOTE_SUBMITTED' && (
                    <div className="mt-5 space-y-3">
                      <textarea
                        value={quoteDecisionNotes}
                        onChange={(e) => setQuoteDecisionNotes(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Optional decision note for admin and mechanic"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleQuoteDecision('approve')}
                          disabled={saving}
                          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                        >
                          Approve quote
                        </button>
                        <button
                          onClick={() => handleQuoteDecision('reject')}
                          disabled={saving}
                          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                        >
                          Reject quote
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {request.quoteStatus === 'QUOTE_APPROVED' && request.paymentStatus !== 'PAYMENT_COMPLETED' && (
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-bold text-foreground">Payment readiness</p>
                  <p className="mt-2 text-sm text-muted-foreground">This phase records a mock payment-ready confirmation so the commercial flow can be tested before a real gateway rollout.</p>
                  <button
                    onClick={handleInitiatePayment}
                    disabled={paymentSaving}
                    className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    Record payment readiness
                  </button>
                </div>
              )}

              {latestPayment && (
                <div className="mt-5 rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm font-bold text-foreground">Latest payment record</p>
                  <div className="mt-3 space-y-2 text-sm text-foreground">
                    <p>Status: {latestPayment.paymentStatus}</p>
                    <p>Amount: {formatCurrency(latestPayment.amount)}</p>
                    <p>Method: {latestPayment.paymentMethod || 'Not specified'}</p>
                    <p>Reference: {latestPayment.transactionReference || 'Pending'}</p>
                    <p>Recorded: {latestPayment.paidAt ? new Date(latestPayment.paidAt).toLocaleString('en-IN') : 'Pending'}</p>
                  </div>
                </div>
              )}
            </div>

            {canCancel && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-bold text-foreground">Cancel request</p>
                </div>
                <div className="mt-4 space-y-3">
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Select cancellation reason</option>
                    {customerCancellationReasons.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                  <textarea
                    value={cancelDetails}
                    onChange={(e) => setCancelDetails(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                    placeholder="Optional details"
                  />
                  <button
                    onClick={handleCancel}
                    disabled={saving || !cancelReason.trim()}
                    className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    Cancel request
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <RequestTimeline request={request} />

            {request.RequestProofAssets && request.RequestProofAssets.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm font-bold text-foreground">Proof assets</p>
                <div className="mt-4 space-y-3">
                  {request.RequestProofAssets.map((asset) => (
                    <a
                      key={asset.id}
                      href={asset.assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-border/60 bg-background/70 p-4 hover:bg-secondary/30"
                    >
                      <p className="text-sm font-bold text-foreground">{asset.assetType}</p>
                      <p className="mt-1 break-all text-xs text-primary">{asset.assetUrl}</p>
                      {asset.caption && <p className="mt-2 text-sm text-muted-foreground">{asset.caption}</p>}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request.RequestCancellation && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-bold text-foreground">Cancellation record</p>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{request.RequestCancellation.reason}</p>
                  {request.RequestCancellation.details && <p className="mt-1 text-sm text-muted-foreground">{request.RequestCancellation.details}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
