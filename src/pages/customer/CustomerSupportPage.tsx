import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CreditCard, FileText, HelpCircle, Loader2, MessageSquare, Phone, RefreshCw, Send, ShieldAlert, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import { customerSupportCategories, getRequestStatusMeta } from '../../lib/requestLifecycle';
import { trackEvent } from '../../utils/analytics';
import { useSearchParams } from 'react-router-dom';

const quickHelpItems = [
  { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Active Request' },
  { icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Payment Issue' },
  { icon: ShieldAlert, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Safety Concern' },
  { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancellations' }
];

export default function CustomerSupportPage() {
  const [searchParams] = useSearchParams();
  const requestIdFromQuery = searchParams.get('requestId') || '';
  const [requests, setRequests] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerRequestId: requestIdFromQuery,
    category: 'Active Request',
    subject: '',
    description: '',
    priority: 'NORMAL',
    incidentType: 'General roadside issue',
    contactPreference: 'Call',
    evidenceNotes: ''
  });

  const selectedRequest = useMemo(
    () => requests.find((request) => String(request.id) === String(form.customerRequestId)),
    [form.customerRequestId, requests]
  );
  const openTicketsCount = useMemo(
    () => tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(String(ticket.status))).length,
    [tickets]
  );
  const lastUpdatedLabel = useMemo(
    () => (lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('en-IN') : null),
    [lastUpdatedAt]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [history, supportTickets] = await Promise.all([
        apiClient<any[]>('/customer/requests/history'),
        apiClient<any[]>('/customer/support/tickets')
      ]);
      setRequests(history || []);
      setTickets(supportTickets || []);
      setConnectionLost(false);
      setLastUpdatedAt(new Date().toISOString());
      if (!requestIdFromQuery && history[0] && !form.customerRequestId) {
        setForm((current) => ({ ...current, customerRequestId: String(history[0].id) }));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load support data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();

    const closeStream = openRealtimeStream<any[]>('/customer/support/tickets', {
      event: 'customer:support:update',
      onMessage: (payload) => {
        setTickets(Array.isArray(payload) ? payload : []);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
      },
      onError: async () => {
        setConnectionLost(true);
        try {
          const supportTickets = await apiClient<any[]>('/customer/support/tickets');
          setTickets(supportTickets || []);
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
    setForm((current) => ({ ...current, category: label, subject: current.subject || `${label} support needed` }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.customerRequestId) {
      toast.error('Select a request first');
      return;
    }
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Please fill the subject and description');
      return;
    }

    setSaving(true);
    try {
      await apiClient('/customer/support/tickets', {
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
      trackEvent('Customer', 'SUPPORT_TICKET_CREATED', form.category);
      toast.success('Support ticket submitted');
      setForm((current) => ({ ...current, subject: '', description: '', evidenceNotes: '' }));
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 p-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-foreground">Help & Support</h1>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Raise request-linked issues for dispatch, payment, safety, and follow-up help.</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase text-muted-foreground">Support email</span>
            <a href="mailto:support@roadresq.com" className="text-sm font-bold text-primary">support@roadresq.com</a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Linked requests</p>
                <p className="mt-2 text-2xl font-black text-foreground">{requests.length}</p>
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
                Realtime ticket sync was interrupted. The latest tickets are being refreshed directly.
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="space-y-6">
                <section>
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick help categories</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {quickHelpItems.map((item) => (
                      <motion.button
                        key={item.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickCategory(item.label)}
                        className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50"
                      >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${item.bg}`}>
                          <item.icon className={`h-6 w-6 ${item.color}`} />
                        </div>
                        <span className="mt-3 block text-sm font-bold text-foreground">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <HelpCircle className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-bold text-foreground">Before raising a ticket</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Use this flow for dispatch, payment, cancellation, or partner-related help. Severe incidents should also be reported immediately to RoadResQ support.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Linked request</label>
                      <select value={form.customerRequestId} onChange={(event) => setForm((current) => ({ ...current, customerRequestId: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none">
                        <option value="">Select a request</option>
                        {requests.map((request) => (
                          <option key={request.id} value={request.id}>
                            REQ-{request.id} • {request.issueSummary} • {getRequestStatusMeta(request.status).label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                        <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none">
                          {customerSupportCategories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                        <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none">
                          {['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((priority) => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                      <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none" placeholder="Short issue summary" />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                      <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required className="min-h-[140px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none" placeholder="Describe what happened, what you need, and any safety concern." />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Incident type</label>
                        <select value={form.incidentType} onChange={(event) => setForm((current) => ({ ...current, incidentType: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none">
                          {['General roadside issue', 'Safety concern', 'Payment dispute', 'Partner behavior', 'Quote issue', 'Cancellation issue', 'Technical issue'].map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred contact</label>
                        <select value={form.contactPreference} onChange={(event) => setForm((current) => ({ ...current, contactPreference: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none">
                          {['Call', 'Email', 'In-app update'].map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Evidence notes</label>
                      <textarea value={form.evidenceNotes} onChange={(event) => setForm((current) => ({ ...current, evidenceNotes: event.target.value }))} className="min-h-[90px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none" placeholder="Add payment reference, partner details, incident notes, or evidence summary for support." />
                    </div>

                    {selectedRequest ? (
                      <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
                        <p className="font-bold text-foreground">Selected request</p>
                        <p className="mt-2 text-muted-foreground">REQ-{selectedRequest.id} • {selectedRequest.issueSummary}</p>
                        <p className="mt-1 text-muted-foreground">{getRequestStatusMeta(selectedRequest.status).label}</p>
                      </div>
                    ) : null}

                    <div className="flex gap-3">
                      <div className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm font-bold text-muted-foreground opacity-50">
                        <Phone className="h-4 w-4" />
                        Emergency
                      </div>
                      <button type="submit" disabled={saving} className="inline-flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {saving ? 'Submitting...' : 'Submit ticket'}
                      </button>
                    </div>
                  </form>
                </section>
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent tickets</h2>
                  <button onClick={() => void fetchData()} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    Refresh
                  </button>
                </div>
                <div className="space-y-3">
                  {tickets.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">No support tickets yet.</div>
                  ) : (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground">{ticket.subject}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">
                                TKT-{ticket.id} • REQ-{ticket.CustomerRequest?.id} • {ticket.ticketType}
                              </p>
                            </div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600' : ticket.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{ticket.description || 'No description provided.'}</p>
                        {ticket.metadata?.incidentType ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">
                            {String(ticket.metadata.incidentType)}
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(ticket.updatedAt || ticket.createdAt).toLocaleString('en-IN')}</span>
                          <span>{ticket.priority}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-bold text-foreground">RoadResQ support path</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Tickets stay linked to request status so operations can see dispatch, partner assignment, and timeline context while resolving issues.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
