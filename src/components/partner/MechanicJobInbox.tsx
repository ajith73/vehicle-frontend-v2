import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Clock3, MapPin, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import type { CustomerRequest } from '../../types';

interface MechanicJobInboxProps {
  mechanicId: string;
}

export function MechanicJobInbox({ mechanicId }: MechanicJobInboxProps) {
  const createEmptyLineItem = () => ({
    label: '',
    category: 'LABOR',
    quantity: '1',
    unitAmount: '',
    description: ''
  });

  const [jobs, setJobs] = useState<CustomerRequest[]>([]);
  const [selectedJob, setSelectedJob] = useState<CustomerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [proofAssetUrl, setProofAssetUrl] = useState('');
  const [proofCaption, setProofCaption] = useState('');
  const [pricingMode, setPricingMode] = useState('QUOTE_REQUIRED');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [quoteLineItems, setQuoteLineItems] = useState([createEmptyLineItem()]);
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await apiClient<CustomerRequest[]>('/mechanic/jobs');
      setJobs(data);
      setSelectedJob((current) => current ? data.find((job) => job.id === current.id) || data[0] || null : data[0] || null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load assigned jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [mechanicId]);

  const refreshSelectedJob = async (jobId: number) => {
    const data = await apiClient<CustomerRequest>(`/mechanic/jobs/${jobId}`);
    setSelectedJob(data);
    setJobs((prev) => prev.map((item) => item.id === data.id ? data : item));
  };

  useEffect(() => {
    setRejectReason('');
    setStatusNotes('');
    setProofAssetUrl('');
    setProofCaption('');
    setPricingMode(selectedJob?.RequestQuotes?.[0]?.pricingMode || 'QUOTE_REQUIRED');
    setQuoteNotes(selectedJob?.RequestQuotes?.[0]?.notes || '');
    setTaxAmount(selectedJob?.RequestQuotes?.[0]?.taxAmount != null ? String(selectedJob.RequestQuotes[0].taxAmount) : '');
    setFeeAmount(selectedJob?.RequestQuotes?.[0]?.feeAmount != null ? String(selectedJob.RequestQuotes[0].feeAmount) : '');
    setQuoteLineItems(
      selectedJob?.RequestQuotes?.[0]?.RequestQuoteLineItems?.length
        ? selectedJob.RequestQuotes[0].RequestQuoteLineItems.map((item) => ({
            label: item.label,
            category: item.category,
            quantity: String(item.quantity),
            unitAmount: String(item.unitAmount),
            description: item.description || ''
          }))
        : [createEmptyLineItem()]
    );
  }, [selectedJob?.id]);

  const handleAccept = async () => {
    if (!selectedJob) return;
    setSaving(true);
    try {
      await apiClient(`/mechanic/jobs/${selectedJob.id}/accept`, { method: 'POST' });
      toast.success('Job accepted');
      await fetchJobs();
      await refreshSelectedJob(selectedJob.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept job');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedJob || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    setSaving(true);
    try {
      await apiClient(`/mechanic/jobs/${selectedJob.id}/reject`, {
        method: 'POST',
        data: { reason: rejectReason.trim() }
      });
      toast.success('Job rejected');
      setRejectReason('');
      await fetchJobs();
      await refreshSelectedJob(selectedJob.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject job');
    } finally {
      setSaving(false);
    }
  };

  const lifecycleActions = useMemo(() => {
    if (!selectedJob) return [];
    switch (selectedJob.status) {
      case 'ACCEPTED':
        return [{ status: 'EN_ROUTE', label: 'Mark en route' }];
      case 'EN_ROUTE':
        return [
          { status: 'ARRIVED', label: 'Mark arrived' },
          { status: 'MECHANIC_NO_SHOW', label: 'Mark no-show' },
        ];
      case 'ARRIVED':
        return [
          { status: 'SERVICE_STARTED', label: 'Start service' },
          { status: 'CUSTOMER_NO_RESPONSE', label: 'Customer no response' },
        ];
      case 'SERVICE_STARTED':
        return [
          { status: 'SERVICE_COMPLETED', label: 'Complete service' },
          { status: 'SERVICE_CANCELLED', label: 'Cancel active service' },
        ];
      default:
        return [];
    }
  }, [selectedJob?.status]);

  const handleLifecycleUpdate = async (status: string) => {
    if (!selectedJob) return;
    setSaving(true);
    try {
      await apiClient(`/mechanic/jobs/${selectedJob.id}/status`, {
        method: 'PUT',
        data: {
          status,
          notes: statusNotes.trim() || undefined,
          proofAssetUrl: proofAssetUrl.trim() || undefined,
          proofCaption: proofCaption.trim() || undefined,
        }
      });
      toast.success('Job status updated');
      setStatusNotes('');
      setProofAssetUrl('');
      setProofCaption('');
      await fetchJobs();
      await refreshSelectedJob(selectedJob.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update job status');
    } finally {
      setSaving(false);
    }
  };

  const canManageQuote = ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'SERVICE_STARTED'].includes(selectedJob?.status || '');
  const latestQuote = selectedJob?.RequestQuotes?.[0];
  const quotePreviewTotal = quoteLineItems.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const unitAmount = Number(item.unitAmount || 0);
    return sum + (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitAmount) ? unitAmount : 0);
  }, 0) + Number(taxAmount || 0) + Number(feeAmount || 0);

  const updateLineItem = (index: number, key: 'label' | 'category' | 'quantity' | 'unitAmount' | 'description', value: string) => {
    setQuoteLineItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  const handleQuoteSubmit = async () => {
    if (!selectedJob) return;
    const normalizedItems = quoteLineItems
      .map((item) => ({
        label: item.label.trim(),
        category: item.category,
        quantity: Number(item.quantity || 0),
        unitAmount: Number(item.unitAmount || 0),
        description: item.description.trim() || undefined
      }))
      .filter((item) => item.label && item.quantity > 0 && item.unitAmount >= 0);

    if (normalizedItems.length === 0) {
      toast.error('Add at least one valid quote line item.');
      return;
    }

    setSaving(true);
    try {
      await apiClient(`/mechanic/jobs/${selectedJob.id}/quote`, {
        method: 'POST',
        data: {
          pricingMode,
          notes: quoteNotes.trim() || undefined,
          taxAmount: taxAmount || undefined,
          feeAmount: feeAmount || undefined,
          lineItems: normalizedItems
        }
      });
      toast.success('Quote submitted');
      await fetchJobs();
      await refreshSelectedJob(selectedJob.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit quote');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading assigned jobs...</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-base font-bold text-foreground">No assigned jobs yet</p>
        <p className="mt-2 text-sm text-muted-foreground">When admin assigns a customer request to this mechanic account, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">Assigned jobs</p>
          <button onClick={fetchJobs} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                selectedJob?.id === job.id ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-secondary/40'
              }`}
            >
              <p className="text-sm font-bold text-foreground">#{job.id} {job.issueSummary}</p>
              <p className="mt-1 text-xs text-muted-foreground">{job.CustomerUser?.CustomerProfile?.displayName || job.CustomerUser?.email || 'Customer'}</p>
              <span className="mt-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{job.status}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedJob && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground">#{selectedJob.id} {selectedJob.issueSummary}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedJob.CustomerUser?.CustomerProfile?.displayName || selectedJob.CustomerUser?.email || 'Customer'}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">{selectedJob.status}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Location
              </div>
              <p className="mt-2 text-sm text-foreground">{selectedJob.addressText || `${selectedJob.latitude}, ${selectedJob.longitude}`}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Clock3 className="h-4 w-4 text-primary" />
                Service context
              </div>
              <p className="mt-2 text-sm text-foreground">Vehicle: {selectedJob.VehicleType?.name || selectedJob.vehicleLabel || 'Not provided'}</p>
              <p className="mt-1 text-sm text-foreground">Service: {selectedJob.ServiceType?.name || selectedJob.SpecificService?.name || 'Not provided'}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="text-sm font-bold text-foreground">Customer notes</p>
            <p className="mt-2 text-sm text-foreground">{selectedJob.issueDetails || 'No additional details provided.'}</p>
          </div>

          {selectedJob.status === 'ASSIGNED' && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                onClick={handleAccept}
                disabled={saving}
                className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                Accept job
              </button>
              <div className="space-y-3">
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="Reason for rejection"
                />
                <button
                  onClick={handleReject}
                  disabled={saving || !rejectReason.trim()}
                  className="w-full rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  Reject job
                </button>
              </div>
            </div>
          )}

          {lifecycleActions.length > 0 && (
            <div className="mt-6 rounded-xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-bold text-foreground">Active service actions</p>
              <div className="mt-4 space-y-3">
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="Optional notes for this status update"
                />
                <input
                  value={proofAssetUrl}
                  onChange={(e) => setProofAssetUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="Optional proof image URL"
                />
                <input
                  value={proofCaption}
                  onChange={(e) => setProofCaption(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="Optional proof caption"
                />
                <div className="flex flex-wrap gap-3">
                  {lifecycleActions.map((action) => (
                    <button
                      key={action.status}
                      onClick={() => handleLifecycleUpdate(action.status)}
                      disabled={saving}
                      className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedJob.RequestProofAssets && selectedJob.RequestProofAssets.length > 0 && (
            <div className="mt-6 rounded-xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-bold text-foreground">Proof assets</p>
              <div className="mt-3 space-y-3">
                {selectedJob.RequestProofAssets.map((asset) => (
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
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-border/60 bg-background/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Quote and pricing</p>
                <p className="mt-1 text-xs text-muted-foreground">Use this to send a fixed-price or inspection-based quote before payment readiness is recorded.</p>
              </div>
              {latestQuote && (
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{latestQuote.status}</span>
              )}
            </div>

            {latestQuote && (
              <div className="mt-4 space-y-3">
                {latestQuote.RequestQuoteLineItems?.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.category} • Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">₹{item.totalAmount.toFixed(2)}</p>
                  </div>
                ))}
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">Subtotal: ₹{latestQuote.subtotalAmount.toFixed(2)}</div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">Tax: ₹{latestQuote.taxAmount.toFixed(2)}</div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground">Total: ₹{latestQuote.totalAmount.toFixed(2)}</div>
                </div>
              </div>
            )}

            {canManageQuote && (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Pricing mode</span>
                    <select
                      value={pricingMode}
                      onChange={(e) => setPricingMode(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                    >
                      <option value="QUOTE_REQUIRED">Quote required</option>
                      <option value="FIXED_PRICE">Fixed price</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Tax amount</span>
                    <input
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                      placeholder="0"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Fee amount</span>
                    <input
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                      placeholder="0"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  {quoteLineItems.map((item, index) => (
                    <div key={`${selectedJob.id}-${index}`} className="rounded-xl border border-border bg-card p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={item.label}
                          onChange={(e) => updateLineItem(index, 'label', e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                          placeholder="Line item label"
                        />
                        <select
                          value={item.category}
                          onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        >
                          <option value="LABOR">Labor</option>
                          <option value="PART">Part</option>
                          <option value="FEE">Fee</option>
                          <option value="TAX">Tax</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <input
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                          placeholder="Quantity"
                        />
                        <input
                          value={item.unitAmount}
                          onChange={(e) => updateLineItem(index, 'unitAmount', e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                          placeholder="Unit amount"
                        />
                      </div>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        rows={2}
                        className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Optional line item description"
                      />
                      {quoteLineItems.length > 1 && (
                        <button
                          onClick={() => setQuoteLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          className="mt-3 text-xs font-bold text-destructive"
                        >
                          Remove line item
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setQuoteLineItems((current) => [...current, createEmptyLineItem()])}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-secondary"
                >
                  Add line item
                </button>

                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="Quote note for customer and admin"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-foreground">Preview total: ₹{quotePreviewTotal.toFixed(2)}</p>
                  <button
                    onClick={handleQuoteSubmit}
                    disabled={saving}
                    className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    Submit quote
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
