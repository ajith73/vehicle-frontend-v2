import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CreditCard, FileText, HelpCircle, Loader2, MessageSquare, Phone, Send, ShieldAlert, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { customerSupportCategories, getRequestStatusMeta } from '../../lib/requestLifecycle';
import { trackEvent } from '../../utils/analytics';

const quickHelpItems = [
  { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Active Request' },
  { icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Payment Issue' },
  { icon: ShieldAlert, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Safety Concern' },
  { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancellations' },
];

export default function CustomerSupportPage() {
  const [searchParams] = useSearchParams();
  const requestIdFromQuery = searchParams.get('requestId') || '';
  const [requests, setRequests] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerRequestId: requestIdFromQuery,
    category: 'Active Request',
    subject: '',
    description: '',
    priority: 'NORMAL',
    incidentType: 'General roadside issue',
    contactPreference: 'Call',
    evidenceNotes: '',
  });

  const selectedRequest = useMemo(
    () => requests.find((request) => String(request.id) === String(form.customerRequestId)),
    [form.customerRequestId, requests]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [history, supportTickets] = await Promise.all([
        apiClient<any[]>('/customer/requests/history'),
        apiClient<any[]>('/customer/support/tickets'),
      ]);
      setRequests(history);
      setTickets(supportTickets);
      if (!requestIdFromQuery && history[0]) {
        setForm((current) => ({ ...current, customerRequestId: String(history[0].id) }));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load support data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    setSaving(true);
    try {
      await apiClient('/customer/support/tickets', {
        method: 'POST',
        data: {
          customerRequestId: Number(form.customerRequestId),
          category: form.category,
          subject: form.subject,
          description: form.description,
          priority: form.priority,
          incidentType: form.incidentType,
          contactPreference: form.contactPreference,
          evidenceNotes: form.evidenceNotes,
        }
      });
      trackEvent('Customer', 'SUPPORT_TICKET_CREATED', form.category);
      toast.success('Support ticket submitted');
      setForm((current) => ({ ...current, subject: '', description: '', evidenceNotes: '' }));
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 p-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-foreground">Help & Support</h1>
            <p className="text-xs font-medium text-muted-foreground">Emergency-first roadside support flow</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-muted-foreground uppercase">Email Us</span>
            <a href="mailto:support@roadresq.com" className="text-sm font-bold text-primary">support@roadresq.com</a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-6">
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Help Categories</h2>
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
                    <p className="mt-1 text-sm text-muted-foreground">For severe incidents, email <strong>support@roadresq.com</strong>. Use the ticket flow for dispatch, payment, cancellation, or follow-up help.</p>
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

                  {selectedRequest && (
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
                      <p className="font-bold text-foreground">Selected request</p>
                      <p className="mt-2 text-muted-foreground">REQ-{selectedRequest.id} • {selectedRequest.issueSummary}</p>
                      <p className="mt-1 text-muted-foreground">{getRequestStatusMeta(selectedRequest.status).label}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm font-bold text-muted-foreground opacity-50 cursor-not-allowed">
                      <Phone className="h-4 w-4" />
                      Emergency
                    </div>
                    <button type="submit" disabled={saving} className="inline-flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
                      <Send className="h-4 w-4" />
                      {saving ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Tickets</h2>
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

              <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-foreground">RoadResQ support path</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Customer support is now request-linked so operations can see request status, partner assignment, and timeline context while resolving your issue.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
