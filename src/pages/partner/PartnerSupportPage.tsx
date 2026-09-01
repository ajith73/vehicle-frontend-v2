import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, Loader2, Map, MessageSquare, RefreshCw, ShieldCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import type { CustomerRequest, SupportTicketRecord } from '../../types';

const quickHelpItems = [
  { icon: UserX, color: 'text-amber-500', label: 'Customer No-Show' },
  { icon: Map, color: 'text-blue-500', label: 'Location Issue' },
  { icon: ShieldCheck, color: 'text-emerald-500', label: 'Verification Help' },
  { icon: AlertTriangle, color: 'text-destructive', label: 'Dispute Resolution' }
];

export default function PartnerSupportPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CustomerRequest[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerRequestId: '',
    category: 'Payment Dispute',
    subject: '',
    description: '',
    priority: 'NORMAL',
    incidentType: 'Partner issue',
    contactPreference: 'Call',
    evidenceNotes: ''
  });

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id) === String(form.customerRequestId)),
    [form.customerRequestId, jobs]
  );
  const openTicketsCount = useMemo(
    () => tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(String(ticket.status))).length,
    [tickets]
  );
  const lastUpdatedLabel = useMemo(
    () => (lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('en-IN') : null),
    [lastUpdatedAt]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobData, ticketData] = await Promise.all([
        apiClient<CustomerRequest[]>('/mechanic/jobs'),
        apiClient<SupportTicketRecord[]>('/mechanic/support/tickets')
      ]);
      setJobs(jobData || []);
      setTickets(ticketData || []);
      setConnectionLost(false);
      setLastUpdatedAt(new Date().toISOString());
      if (!form.customerRequestId && jobData?.[0]) {
        setForm((current) => ({ ...current, customerRequestId: String(jobData[0].id) }));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load partner support');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    const closeStream = openRealtimeStream<SupportTicketRecord[]>('/mechanic/support/tickets', {
      event: 'mechanic:support:update',
      onMessage: (payload) => {
        setTickets(Array.isArray(payload) ? payload : []);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
      },
      onError: async () => {
        setConnectionLost(true);
        try {
          const ticketData = await apiClient<SupportTicketRecord[]>('/mechanic/support/tickets');
          setTickets(ticketData || []);
          setLastUpdatedAt(new Date().toISOString());
        } catch {
          return;
        }
      }
    });

    return () => {
      closeStream();
    };
  }, []);

  const handleQuickCategory = (label: string) => {
    setForm((current) => ({
      ...current,
      category: label,
      subject: current.subject || `${label} support needed`
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.customerRequestId) {
      toast.error('Select a job first');
      return;
    }
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Please fill the subject and description');
      return;
    }

    setSaving(true);
    try {
      await apiClient('/mechanic/support/tickets', {
        method: 'POST',
        data: {
          customerRequestId: Number(form.customerRequestId),
          category: form.category,
          subject: form.subject.trim(),
          description: form.description.trim(),
          priority: form.priority,
          incidentType: form.incidentType,
          contactPreference: form.contactPreference,
          evidenceNotes: form.evidenceNotes.trim()
        }
      });
      toast.success('Support ticket submitted');
      setForm((current) => ({
        ...current,
        subject: '',
        description: '',
        evidenceNotes: ''
      }));
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit support ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="mx-auto flex h-full max-w-6xl flex-col bg-background p-4 pb-32">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/partner')} className="rounded-full bg-secondary p-2 transition-colors hover:bg-secondary/80 sm:hidden">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">Partner Support</h1>
          <p className="mt-1 text-xs text-muted-foreground">Request-linked support for payout, customer, verification, and operational issues.</p>
        </div>
      </div>

      <div className="flex-1 w-full">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Linked jobs</p>
                <p className="mt-2 text-2xl font-black text-foreground">{jobs.length}</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Open tickets</p>
                <p className="mt-2 text-2xl font-black text-foreground">{openTicketsCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Last sync</p>
                <p className="mt-2 text-sm font-bold text-foreground">{lastUpdatedLabel || 'Just now'}</p>
              </div>
            </section>

            {connectionLost ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                Realtime support updates were interrupted. The latest ticket list is being refreshed directly.
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="space-y-6">
                <section>
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick help</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {quickHelpItems.map((item) => (
                      <motion.button
                        key={item.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickCategory(item.label)}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-colors hover:border-primary/40"
                      >
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                        <span className="text-xs font-bold text-foreground">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Open a ticket</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Use this when you need operations help during active jobs, customer disputes, location issues, or payout follow-up.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Linked job</label>
                      <select
                        value={form.customerRequestId}
                        onChange={(event) => setForm((current) => ({ ...current, customerRequestId: event.target.value }))}
                        className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
                      >
                        <option value="">Select a job</option>
                        {jobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            REQ-{job.id} • {job.issueSummary} • {job.status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                        <select
                          value={form.category}
                          onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
                        >
                          {['Payment Dispute', 'Customer Behavior', 'App Bug', 'Account Suspension', 'Location Issue', 'Other'].map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                        <select
                          value={form.priority}
                          onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
                        >
                          {['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                      <input
                        value={form.subject}
                        onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                        className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
                        placeholder="Short summary"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        className="min-h-[120px] w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none"
                        placeholder="Describe your issue in detail..."
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Incident type</label>
                        <input
                          value={form.incidentType}
                          onChange={(event) => setForm((current) => ({ ...current, incidentType: event.target.value }))}
                          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred contact</label>
                        <select
                          value={form.contactPreference}
                          onChange={(event) => setForm((current) => ({ ...current, contactPreference: event.target.value }))}
                          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
                        >
                          {['Call', 'Email', 'In-app update'].map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Evidence notes</label>
                      <textarea
                        value={form.evidenceNotes}
                        onChange={(event) => setForm((current) => ({ ...current, evidenceNotes: event.target.value }))}
                        className="min-h-[90px] w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none"
                        placeholder="Share payout refs, customer details, proof summary, or operational notes."
                      />
                    </div>

                    {selectedJob ? (
                      <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
                        <p className="font-bold text-foreground">Selected job</p>
                        <p className="mt-2 text-muted-foreground">REQ-{selectedJob.id} • {selectedJob.issueSummary}</p>
                        <p className="mt-1 text-muted-foreground">{selectedJob.status} • {selectedJob.addressText || 'Location unavailable'}</p>
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={saving}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-4 font-black text-primary-foreground shadow-sm transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                      {saving ? 'Submitting...' : 'Submit ticket'}
                    </button>
                  </form>
                </section>
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent tickets</h2>
                  <button onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    Refresh
                  </button>
                </div>
                <div className="space-y-3">
                  {tickets.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                      No partner tickets yet.
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-foreground">{ticket.subject}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              TKT-{ticket.id} • REQ-{ticket.CustomerRequest?.id} • {ticket.ticketType}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                            ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600' :
                            ticket.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-600' :
                            'bg-amber-500/10 text-amber-600'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{ticket.description || 'No description provided.'}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(ticket.updatedAt || ticket.createdAt).toLocaleString('en-IN')}</span>
                          <span>{ticket.priority}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
