import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, MapPin, Mail, RefreshCw, Wrench, XCircle } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import type { CustomerRequest, Mechanic } from '../types';

export default function AdminRequests() {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [paymentIssues, setPaymentIssues] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [mechanicsLoading, setMechanicsLoading] = useState(true);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDetails, setCancelDetails] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [data, issues] = await Promise.all([
        apiClient<CustomerRequest[]>('/admin/requests'),
        apiClient<CustomerRequest[]>('/admin/payments/issues')
      ]);
      setRequests(data);
      setPaymentIssues(issues);
      if (data.length > 0) {
        setSelectedRequest((current) => current ? data.find((item) => item.id === current.id) || data[0] : data[0]);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      toast.error('Failed to load customer requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        setMechanicsLoading(true);
        const data = await apiClient<Mechanic[]>('/admin/mechanics');
        const approved = data.filter((item) => item.status === 'Approved');
        setMechanics(approved);
      } catch (error) {
        toast.error('Failed to load mechanics for assignment');
      } finally {
        setMechanicsLoading(false);
      }
    };
    fetchMechanics();
  }, []);

  useEffect(() => {
    if (!selectedRequest) return;
    setSelectedMechanicId(selectedRequest.Mechanic?.id ? String(selectedRequest.Mechanic.id) : '');
    setAssignNotes(selectedRequest.adminNotes || '');
    setCancelReason(selectedRequest.RequestCancellation?.reason || '');
    setCancelDetails(selectedRequest.RequestCancellation?.details || '');
    setInternalNote('');
  }, [selectedRequest?.id]);

  const selectedMechanicOption = useMemo(
    () => mechanics.find((item) => String(item.id) === selectedMechanicId),
    [mechanics, selectedMechanicId]
  );

  const refreshSelectedRequest = async (requestId: number) => {
    const data = await apiClient<CustomerRequest>(`/admin/requests/${requestId}`);
    setSelectedRequest(data);
    setRequests((prev) => prev.map((item) => item.id === data.id ? data : item));
  };

  const formatCurrency = (amount?: number) => amount == null ? 'Pending' : new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);

  const handleAssign = async (mode: 'assign' | 'reassign') => {
    if (!selectedRequest) return;
    if (!selectedMechanicId) {
      toast.error('Choose a mechanic first.');
      return;
    }

    setSaving(true);
    try {
      await apiClient(`/admin/requests/${selectedRequest.id}/${mode}`, {
        method: 'POST',
        data: {
          mechanicId: Number(selectedMechanicId),
          notes: assignNotes.trim() || undefined
        }
      });
      toast.success(mode === 'assign' ? 'Request assigned' : 'Request reassigned');
      await fetchRequests();
      await refreshSelectedRequest(selectedRequest.id);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} request`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedRequest) return;
    if (!cancelReason.trim()) {
      toast.error('Enter a cancellation reason.');
      return;
    }

    setSaving(true);
    try {
      await apiClient(`/admin/requests/${selectedRequest.id}/cancel`, {
        method: 'POST',
        data: {
          reason: cancelReason.trim(),
          details: cancelDetails.trim() || undefined
        }
      });
      toast.success('Request cancelled');
      await fetchRequests();
      await refreshSelectedRequest(selectedRequest.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel request');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedRequest || !internalNote.trim()) {
      toast.error('Enter an internal note first.');
      return;
    }

    setSaving(true);
    try {
      await apiClient(`/admin/requests/${selectedRequest.id}/notes`, {
        method: 'POST',
        data: { note: internalNote.trim() }
      });
      toast.success('Internal note added');
      setInternalNote('');
      await fetchRequests();
      await refreshSelectedRequest(selectedRequest.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add internal note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Phase 4 admin operations queue for lifecycle tracking, quote review, payment readiness, and support follow-up.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
            Payment issues: {paymentIssues.length}
          </span>
          <button
            onClick={fetchRequests}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-base font-bold text-foreground">No customer requests yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Once customer requests are created from the public UI, they will appear here for operations handling.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="space-y-3">
              {requests.map((request) => {
                const isActive = selectedRequest?.id === request.id;
                const customerName = request.CustomerUser?.CustomerProfile?.displayName || request.CustomerUser?.email || 'Customer';
                return (
                  <button
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">#{request.id} {request.issueSummary}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{customerName}</p>
                      </div>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {request.Mechanic?.businessName || request.Mechanic?.name || 'Mechanic not linked'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            {selectedRequest && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Request Detail</p>
                    <h2 className="mt-2 text-2xl font-bold text-foreground">#{selectedRequest.id} {selectedRequest.issueSummary}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Submitted {new Date(selectedRequest.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700">
                    {selectedRequest.status}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Customer</p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {selectedRequest.CustomerUser?.CustomerProfile?.displayName || 'Unnamed customer'}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary" />
                      {selectedRequest.CustomerUser?.email || 'Email unavailable'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Assigned mechanic target</p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {selectedRequest.Mechanic?.businessName || selectedRequest.Mechanic?.name || 'Not linked'}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {[selectedRequest.Mechanic?.city, selectedRequest.Mechanic?.state].filter(Boolean).join(', ') || 'Location unavailable'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Vehicle and service</p>
                    <p className="mt-2 text-sm text-foreground">
                      <span className="font-semibold">Vehicle:</span> {selectedRequest.VehicleType?.name || selectedRequest.vehicleLabel || 'Not provided'}
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      <span className="font-semibold">Service:</span> {selectedRequest.ServiceType?.name || selectedRequest.SpecificService?.name || 'Not provided'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Location</p>
                    <p className="mt-2 flex items-start gap-2 text-sm text-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{selectedRequest.addressText || `${selectedRequest.latitude}, ${selectedRequest.longitude}`}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Problem details</p>
                  <p className="mt-2 text-sm text-foreground">{selectedRequest.issueDetails || 'No additional details were provided.'}</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Lifecycle timestamps</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                      ['Accepted', selectedRequest.acceptedAt],
                      ['En route', selectedRequest.enRouteAt],
                      ['Arrived', selectedRequest.arrivedAt],
                      ['Service started', selectedRequest.serviceStartedAt],
                      ['Completed', selectedRequest.completedAt],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-border/60 bg-card px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                        <p className="mt-2 text-sm text-foreground">{value ? new Date(value).toLocaleString('en-IN') : 'Pending'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Commercial summary</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Pricing mode</p>
                      <p className="mt-2 text-sm text-foreground">{selectedRequest.pricingMode || 'Not created yet'}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Quote status</p>
                      <p className="mt-2 text-sm text-foreground">{selectedRequest.quoteStatus || 'Not available yet'}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Payment status</p>
                      <p className="mt-2 text-sm text-foreground">{selectedRequest.paymentStatus || 'Not ready yet'}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Final amount</p>
                      <p className="mt-2 text-sm text-foreground">{formatCurrency(selectedRequest.finalAmount)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <p className="text-sm font-bold text-foreground">Manual assignment</p>
                    </div>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Mechanic</span>
                      <select
                        value={selectedMechanicId}
                        onChange={(e) => setSelectedMechanicId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        disabled={mechanicsLoading}
                      >
                        <option value="">{mechanicsLoading ? 'Loading mechanics...' : 'Select mechanic'}</option>
                        {mechanics.map((mechanic) => (
                          <option key={mechanic.id} value={mechanic.id}>
                            {mechanic.businessName || mechanic.name} {mechanic.city ? `- ${mechanic.city}` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Ops note</span>
                      <textarea
                        value={assignNotes}
                        onChange={(e) => setAssignNotes(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Example: Best match for city and service type"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleAssign(selectedRequest.Mechanic?.id ? 'reassign' : 'assign')}
                        disabled={saving || !selectedMechanicId}
                        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        {selectedRequest.Mechanic?.id ? 'Reassign request' : 'Assign request'}
                      </button>
                      {selectedMechanicOption && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                          Selected: {selectedMechanicOption.businessName || selectedMechanicOption.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <p className="text-sm font-bold text-foreground">Cancel request</p>
                    </div>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Reason</span>
                      <input
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Example: No matching mechanic available"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Details</span>
                      <textarea
                        value={cancelDetails}
                        onChange={(e) => setCancelDetails(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Optional operational context"
                      />
                    </label>
                    <button
                      onClick={handleCancel}
                      disabled={saving || !cancelReason.trim()}
                      className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground transition-colors hover:opacity-90 disabled:opacity-60"
                    >
                      Cancel request
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Timeline</p>
                  <div className="mt-4 space-y-3">
                    {selectedRequest.RequestTimelineEvents && selectedRequest.RequestTimelineEvents.length > 0 ? (
                      selectedRequest.RequestTimelineEvents.map((event) => (
                        <div key={event.id} className="rounded-xl border border-border/60 bg-card p-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-bold text-foreground">{event.eventType}</p>
                            <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString('en-IN')}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {event.actorType}
                            {event.ActorUser?.email ? ` - ${event.ActorUser.email}` : ''}
                            {event.fromStatus || event.toStatus ? ` | ${event.fromStatus || 'START'} -> ${event.toStatus || 'END'}` : ''}
                          </p>
                          {event.notes && <p className="mt-2 text-sm text-foreground">{event.notes}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No timeline events recorded yet.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Internal notes</p>
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Add an operations note for this request"
                      />
                      <button
                        onClick={handleAddInternalNote}
                        disabled={saving || !internalNote.trim()}
                        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        Add note
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedRequest.RequestInternalNotes && selectedRequest.RequestInternalNotes.length > 0 ? (
                        selectedRequest.RequestInternalNotes.map((note) => (
                          <div key={note.id} className="rounded-xl border border-border bg-card p-3">
                            <p className="text-sm text-foreground">{note.note}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {note.AuthorUser?.email || note.AuthorUser?.name || 'Admin'} • {new Date(note.createdAt).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No internal notes yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Proof assets</p>
                    <div className="mt-4 space-y-3">
                      {selectedRequest.RequestProofAssets && selectedRequest.RequestProofAssets.length > 0 ? (
                        selectedRequest.RequestProofAssets.map((asset) => (
                          <a
                            key={asset.id}
                            href={asset.assetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-xl border border-border bg-card p-3 hover:bg-secondary/30"
                          >
                            <p className="text-sm font-bold text-foreground">{asset.assetType}</p>
                            <p className="mt-1 break-all text-xs text-primary">{asset.assetUrl}</p>
                            {asset.caption && <p className="mt-2 text-sm text-muted-foreground">{asset.caption}</p>}
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No proof assets uploaded yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Latest quote</p>
                    <div className="mt-4 space-y-3">
                      {selectedRequest.RequestQuotes && selectedRequest.RequestQuotes.length > 0 ? (
                        <>
                          <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-bold text-foreground">{selectedRequest.RequestQuotes[0].pricingMode}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{selectedRequest.RequestQuotes[0].status}</p>
                              </div>
                              <p className="text-sm font-bold text-foreground">{formatCurrency(selectedRequest.RequestQuotes[0].totalAmount)}</p>
                            </div>
                            {selectedRequest.RequestQuotes[0].notes && <p className="mt-3 text-sm text-muted-foreground">{selectedRequest.RequestQuotes[0].notes}</p>}
                          </div>
                          {selectedRequest.RequestQuotes[0].RequestQuoteLineItems?.map((item) => (
                            <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{item.category} • Qty {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">{formatCurrency(item.totalAmount)}</p>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No quote created yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Payment records</p>
                    <div className="mt-4 space-y-3">
                      {selectedRequest.PaymentTransactions && selectedRequest.PaymentTransactions.length > 0 ? (
                        selectedRequest.PaymentTransactions.map((payment) => (
                          <div key={payment.id} className="rounded-xl border border-border bg-card p-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-bold text-foreground">{payment.paymentStatus}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{payment.paymentMethod || payment.provider}</p>
                              </div>
                              <p className="text-sm font-bold text-foreground">{formatCurrency(payment.amount)}</p>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">Reference: {payment.transactionReference || 'Pending'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : 'Recorded but not marked paid yet'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No payment records yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                  This Phase 4 queue supports active-service progress tracking, quote review, mock payment readiness, optional proof collection, and internal operational notes before a real gateway rollout.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
