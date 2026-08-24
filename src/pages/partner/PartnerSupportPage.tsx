import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, Loader2, Map, MessageSquare, ShieldCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobData, ticketData] = await Promise.all([
        apiClient<CustomerRequest[]>('/mechanic/jobs'),
        apiClient<SupportTicketRecord[]>('/mechanic/support/tickets')
      ]);
      setJobs(jobData || []);
      setTickets(ticketData || []);
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
    loadData();
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

    setSaving(true);
    try {
      await apiClient('/mechanic/support/tickets', {
        method: 'POST',
        data: {
          customerRequestId: Number(form.customerRequestId),
          category: form.category,
          subject: form.subject,
          description: form.description,
          priority: form.priority,
          incidentType: form.incidentType,
          contactPreference: form.contactPreference,
          evidenceNotes: form.evidenceNotes
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
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full bg-background p-4 max-w-5xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/partner')} className="p-2 -ml-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors sm:hidden">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">Partner Support</h1>
          <p className="text-xs text-muted-foreground mt-1">Request-linked partner support flow</p>
        </div>
      </div>

      <div className="flex-1 w-full">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Help</h2>
                <div className="grid grid-cols-2 gap-3">
                  {quickHelpItems.map((item) => (
                    <motion.button
                      key={item.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickCategory(item.label)}
                      className="bg-card border border-border p-4 rounded-xl flex flex-col items-center gap-2 transition-colors text-center shadow-sm hover:border-primary/40"
                    >
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </section>

              <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Open a Ticket</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold block mb-1 text-foreground">Linked job</label>
                    <select
                      value={form.customerRequestId}
                      onChange={(event) => setForm((current) => ({ ...current, customerRequestId: event.target.value }))}
                      className="w-full bg-secondary border border-border p-3 rounded-xl text-sm outline-none"
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
                      <label className="text-xs font-bold block mb-1 text-foreground">Category</label>
                      <select
                        value={form.category}
                        onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                        className="w-full bg-secondary border border-border p-3 rounded-xl text-sm outline-none"
                      >
                        {['Payment Dispute', 'Customer Behavior', 'App Bug', 'Account Suspension', 'Location Issue', 'Other'].map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1 text-foreground">Priority</label>
                      <select
                        value={form.priority}
                        onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                        className="w-full bg-secondary border border-border p-3 rounded-xl text-sm outline-none"
                      >
                        {['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1 text-foreground">Subject</label>
                    <input
                      value={form.subject}
                      onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                      className="w-full bg-secondary border border-border p-3 rounded-xl text-sm outline-none"
                      placeholder="Short summary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1 text-foreground">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      className="w-full bg-secondary border border-border p-3 rounded-xl text-sm min-h-[120px] outline-none resize-none"
                      placeholder="Describe your issue in detail..."
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold block mb-1 text-foreground">Incident type</label>
                      <input
                        value={form.incidentType}
                        onChange={(event) => setForm((current) => ({ ...current, incidentType: event.target.value }))}
                        className="w-full bg-secondary border border-border p-3 rounded-xl text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1 text-foreground">Preferred contact</label>
                      <select
                        value={form.contactPreference}
                        onChange={(event) => setForm((current) => ({ ...current, contactPreference: event.target.value }))}
                        className="w-full bg-secondary border border-border p-3 rounded-xl text-sm outline-none"
                      >
                        {['Call', 'Email', 'In-app update'].map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1 text-foreground">Evidence notes</label>
                    <textarea
                      value={form.evidenceNotes}
                      onChange={(event) => setForm((current) => ({ ...current, evidenceNotes: event.target.value }))}
                      className="w-full bg-secondary border border-border p-3 rounded-xl text-sm min-h-[90px] outline-none resize-none"
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
                    className={`w-full ${saving ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:scale-[1.01]'} text-primary-foreground font-black p-4 rounded-xl mt-2 flex items-center justify-center gap-2 shadow-sm transition-all`}
                  >
                    <MessageSquare className="w-5 h-5" /> {saving ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </form>
              </section>
            </div>

            <section>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Recent Tickets</h2>
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
        )}
      </div>
    </motion.div>
  );
}
