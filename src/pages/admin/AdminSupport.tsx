import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Loader2, Search, User, Wrench, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { SupportTicketRecord, User as AdminUser } from '../../types';

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [ticketData, adminData] = await Promise.all([
        apiClient<SupportTicketRecord[]>('/admin/support/tickets'),
        apiClient<AdminUser[]>('/admin/users')
      ]);
      setTickets(ticketData || []);
      setAdmins(adminData || []);
    } catch (error) {
      toast.error('Failed to load support workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const customer = ticket.CustomerRequest?.CustomerUser?.CustomerProfile?.displayName || ticket.CustomerRequest?.CustomerUser?.email || '';
      const text = `${ticket.id} ${ticket.subject} ${ticket.description || ''} ${customer}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [tickets, query, statusFilter]);

  const updateTicket = async (payload: Record<string, unknown>) => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      await apiClient(`/admin/support/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        data: payload
      });
      toast.success('Support ticket updated');
      await loadData();
      const refreshed = tickets.find((ticket) => ticket.id === selectedTicket.id);
      setSelectedTicket(refreshed || null);
    } catch (error) {
      toast.error('Failed to update support ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Support Tickets</h1>
          <p className="text-muted-foreground">Operational inbox for escalations, payment friction, and service disputes.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 bg-secondary/30 flex-wrap">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by ticket or customer..." className="bg-transparent border-none outline-none text-sm w-full font-medium" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium outline-none w-40" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All Statuses</option>
            {Array.from(new Set(tickets.map((ticket) => ticket.status))).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-secondary/50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Ticket</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Reporter</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Category</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Priority</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Status</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Created</th>
                </tr>
              </thead>
              <motion.tbody initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {filteredTickets.map((ticket) => {
                  const customerName = ticket.CustomerRequest?.CustomerUser?.CustomerProfile?.displayName || ticket.CustomerRequest?.CustomerUser?.email || 'Unknown';
                  return (
                    <motion.tr key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                      <td className="p-4">
                        <p className="font-bold text-sm">TKT-{ticket.id}</p>
                        <p className="text-[10px] text-muted-foreground">REQ-{ticket.customerRequestId}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {ticket.source === 'ADMIN' ? <Wrench className="w-4 h-4 text-emerald-500" /> : <User className="w-4 h-4 text-primary" />}
                          <div>
                            <p className="text-sm font-bold">{customerName}</p>
                            <p className="text-[10px] text-muted-foreground">{ticket.source}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium">{ticket.ticketType}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold flex items-center gap-1 ${ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? 'text-destructive' : 'text-amber-500'}`}>
                          <AlertTriangle className="w-3 h-3" /> {ticket.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground font-medium">{new Date(ticket.createdAt).toLocaleString()}</td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <motion.div initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }} transition={{ duration: 0.2 }} className="absolute top-0 right-0 bottom-0 w-[520px] bg-card border-l border-border shadow-2xl z-50 flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur">
              <div>
                <h2 className="font-black text-xl flex items-center gap-2">TKT-{selectedTicket.id}</h2>
                <p className="text-xs text-muted-foreground">Support ticket created on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-secondary rounded-full bg-secondary/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-secondary/10">
              <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                <h3 className="font-bold text-sm mb-2">Issue Description</h3>
                <p className="text-sm text-foreground">{selectedTicket.description || selectedTicket.subject}</p>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Reporter: {selectedTicket.CustomerRequest?.CustomerUser?.CustomerProfile?.displayName || selectedTicket.CustomerRequest?.CustomerUser?.email || 'Unknown'}</span>
                  <span>Related: REQ-{selectedTicket.customerRequestId}</span>
                </div>
              </div>

              <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assignee</label>
                  <select className="mt-2 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none" value={selectedTicket.assignedToUserId || ''} onChange={(event) => setSelectedTicket({ ...selectedTicket, assignedToUserId: event.target.value ? Number(event.target.value) : null })}>
                    <option value="">Unassigned</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>{admin.name || admin.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                  <select className="mt-2 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none" value={selectedTicket.status} onChange={(event) => setSelectedTicket({ ...selectedTicket, status: event.target.value })}>
                    {['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                  <select className="mt-2 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none" value={selectedTicket.priority} onChange={(event) => setSelectedTicket({ ...selectedTicket, priority: event.target.value })}>
                    {['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-background flex flex-col gap-3">
              <button disabled={saving} onClick={() => updateTicket({ status: selectedTicket.status, priority: selectedTicket.priority, assignedToUserId: selectedTicket.assignedToUserId })} className="w-full bg-secondary text-foreground font-bold p-3 rounded-xl border border-border text-sm hover:bg-secondary/80 disabled:opacity-60">
                Save Ticket Changes
              </button>
              <button disabled={saving} onClick={() => updateTicket({ status: 'RESOLVED', priority: selectedTicket.priority, assignedToUserId: selectedTicket.assignedToUserId, resolutionNote: 'Resolved from admin support workspace on Wednesday, August 19, 2026' })} className="w-full bg-emerald-500 text-white font-bold p-3 rounded-xl text-sm hover:opacity-90 flex items-center justify-center gap-1 disabled:opacity-60">
                <CheckCircle2 className="w-4 h-4" /> Resolve Ticket
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
