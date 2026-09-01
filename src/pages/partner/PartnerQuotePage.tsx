import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, Loader2, Plus, Send, Trash2, UserRound, Wrench } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type QuoteEditorItem = {
  id: string;
  label: string;
  category: 'PART' | 'LABOR' | 'FEE';
  unitAmount: number;
  quantity: number;
};

type JobRecord = {
  id: number;
  issueSummary?: string;
  vehicleLabel?: string;
  CustomerUser?: {
    CustomerProfile?: {
      displayName?: string;
    };
  };
};

const createItem = (): QuoteEditorItem => ({
  id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  label: '',
  category: 'LABOR',
  unitAmount: 0,
  quantity: 1
});

const formatMoney = (value: unknown) => `₹${Number(value || 0).toFixed(2)}`;

export default function PartnerQuotePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob] = useState<JobRecord | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [items, setItems] = useState<QuoteEditorItem[]>([
    { id: `${Date.now()}`, label: 'Inspection labor', category: 'LABOR', unitAmount: 0, quantity: 1 }
  ]);
  const [notes, setNotes] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      if (!id) return;
      setJobLoading(true);
      try {
        const data = await apiClient<JobRecord>(`/mechanic/jobs/${id}`);
        setJob(data);
        if (!notes) {
          setNotes(`Inspection completed for ${data.vehicleLabel || 'customer vehicle'}. Add service parts, labor, and any required charges below.`);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load job details');
      } finally {
        setJobLoading(false);
      }
    };

    void loadJob();
  }, [id]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unitAmount || 0) * Number(item.quantity || 0), 0),
    [items]
  );
  const grandTotal = total + taxAmount + feeAmount;
  const customerName = job?.CustomerUser?.CustomerProfile?.displayName || 'Customer';

  const addItem = () => {
    setItems((current) => [...current, createItem()]);
  };

  const removeItem = (idToRemove: string) => {
    setItems((current) => current.filter((item) => item.id !== idToRemove));
  };

  const updateItem = <K extends keyof QuoteEditorItem>(idToUpdate: string, field: K, value: QuoteEditorItem[K]) => {
    setItems((current) => current.map((item) => (item.id === idToUpdate ? { ...item, [field]: value } : item)));
  };

  const handleSend = async () => {
    if (!notes.trim()) {
      toast.error('Please add inspection notes');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    if (items.some((item) => !item.label.trim() || Number(item.unitAmount) <= 0 || Number(item.quantity) <= 0)) {
      toast.error('Please fill all quote items with valid name, amount, and quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadLineItems = items.map((item) => ({
        label: item.label.trim(),
        category: item.category,
        quantity: Number(item.quantity),
        unitAmount: Number(item.unitAmount)
      }));

      await apiClient(`/mechanic/jobs/${id}/quote`, {
        method: 'POST',
        data: {
          lineItems: payloadLineItems,
          notes: notes.trim(),
          taxAmount: Number(taxAmount),
          feeAmount: Number(feeAmount),
          pricingMode: 'QUOTE_REQUIRED'
        }
      });
      toast.success('Quote sent to customer successfully');
      navigate(`/partner/request/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (jobLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 transition-colors hover:bg-secondary">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-lg font-black text-foreground">Create Quote</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-32 sm:max-w-4xl sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground">Inspection quote</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add customer-visible pricing only. The customer will review this before work continues.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Customer</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{customerName}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Issue</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{job?.issueSummary || 'Vehicle assistance request'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-black text-foreground">Inspection details</h3>
              <label className="mt-4 block text-sm font-bold text-foreground">Customer-facing notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm outline-none transition-colors focus:border-primary"
                placeholder="Describe what you checked, what was found, and why these charges are needed."
              />
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <h3 className="text-lg font-black text-foreground">Line items</h3>
                <button onClick={addItem} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20">
                  <Plus className="h-4 w-4" />
                  Add item
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {items.map((item) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={item.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Item name</label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(event) => updateItem(item.id, 'label', event.target.value)}
                          placeholder="Battery replacement, labor, tow fee..."
                          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                        />
                      </div>
                      {items.length > 1 ? (
                        <button onClick={() => removeItem(item.id)} className="mt-6 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Category</label>
                        <select
                          value={item.category}
                          onChange={(event) => updateItem(item.id, 'category', event.target.value as QuoteEditorItem['category'])}
                          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                        >
                          <option value="PART">Part</option>
                          <option value="LABOR">Labor</option>
                          <option value="FEE">Fee</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) => updateItem(item.id, 'quantity', Math.max(1, Number(event.target.value || 1)))}
                          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Unit amount</label>
                        <input
                          type="number"
                          min={0}
                          value={item.unitAmount}
                          onChange={(event) => updateItem(item.id, 'unitAmount', Math.max(0, Number(event.target.value || 0)))}
                          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3 text-sm">
                      <span className="text-muted-foreground">Item total</span>
                      <span className="font-black text-foreground">{formatMoney(item.unitAmount * item.quantity)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Tax amount</label>
                  <input
                    type="number"
                    min={0}
                    value={taxAmount}
                    onChange={(event) => setTaxAmount(Math.max(0, Number(event.target.value || 0)))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Platform fee</label>
                  <input
                    type="number"
                    min={0}
                    value={feeAmount}
                    onChange={(event) => setFeeAmount(Math.max(0, Number(event.target.value || 0)))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">Before sending</h3>
              </div>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <p>1. Keep item names simple and clear for the customer.</p>
                <p>2. Add only approved parts, labor, and required charges.</p>
                <p>3. After quote approval, the customer will move to payment.</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">Quote totals</h3>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items subtotal</span>
                  <span className="font-bold text-foreground">{formatMoney(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-bold text-foreground">{formatMoney(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span className="font-bold text-foreground">{formatMoney(feeAmount)}</span>
                </div>
                <div className="border-t border-dashed border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-black text-foreground">Grand total</span>
                    <span className="text-2xl font-black text-primary">{formatMoney(grandTotal)}</span>
                  </div>
                </div>
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
            onClick={handleSend}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl bg-primary p-4 text-lg font-black text-primary-foreground shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            <span className="flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {isSubmitting ? 'Sending...' : 'Send to customer'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
