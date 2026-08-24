import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Loader2, MapPin, Phone, Search, ShieldAlert, ShieldCheck, Star, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { Mechanic } from '../../types';

export default function AdminPartners() {
  const [partners, setPartners] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadPartners = async () => {
    try {
      const data = await apiClient<Mechanic[]>('/admin/mechanics');
      setPartners(data || []);
    } catch (error) {
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const text = `${partner.businessName || partner.name || ''} ${partner.phone || ''} ${partner.city || ''}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || partner.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [partners, query, statusFilter]);

  const approvePartner = async (partnerId: number) => {
    setBusyId(partnerId);
    try {
      await apiClient(`/admin/mechanics/${partnerId}/approve`, { method: 'POST' });
      toast.success('Partner approved');
      await loadPartners();
    } catch (error) {
      toast.error('Failed to approve partner');
    } finally {
      setBusyId(null);
    }
  };

  const trustPartner = async (partner: Mechanic) => {
    setBusyId(partner.id);
    try {
      await apiClient(`/admin/mechanics/${partner.id}/trust-status`, {
        method: 'PUT',
        data: {
          isTrustedPartner: !partner.isTrustedPartner,
          partnerTier: partner.partnerTier || 'PRIORITY',
          trustScore: partner.trustScore || 80,
          priorityDispatchEligible: !partner.priorityDispatchEligible,
          reason: 'Updated from Admin Partners screen'
        }
      });
      toast.success('Partner trust status updated');
      await loadPartners();
    } catch (error) {
      toast.error('Failed to update trust status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Partners Directory</h1>
          <p className="text-muted-foreground">Live partner operations view with approval and dispatch-priority controls.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 bg-secondary/30 flex-wrap">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by name, ID, or phone..." className="bg-transparent border-none outline-none text-sm w-full font-medium" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium outline-none w-40" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All Statuses</option>
            {Array.from(new Set(partners.map((partner) => partner.status))).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground">
            <Filter className="w-4 h-4" /> {filteredPartners.length} partners
          </div>
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
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Partner</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Contact & Base</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Performance</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Current State</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Actions</th>
                </tr>
              </thead>
              <motion.tbody initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {filteredPartners.map((partner) => (
                  <motion.tr key={partner.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                          <Wrench className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-bold text-sm flex items-center gap-1">
                            {partner.businessName || partner.name}
                            {partner.isTrustedPartner ? <ShieldCheck className="w-3 h-3 text-emerald-500" /> : <ShieldAlert className="w-3 h-3 text-amber-500" />}
                          </p>
                          <p className="text-[10px] text-muted-foreground">ID: PRT-{partner.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium flex items-center gap-1 mb-0.5"><Phone className="w-3 h-3 text-muted-foreground" /> {Array.isArray(partner.phone) ? partner.phone[0]?.number : String(partner.phone || 'No phone')}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {partner.city || 'Unknown city'}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {partner.trustScore || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          <span className="text-emerald-500 font-bold block">{partner.priorityDispatchEligible ? 'Priority' : 'Standard'}</span>
                          {partner.availabilityState || 'OFFLINE'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${partner.isOnline ? 'bg-emerald-500/10 text-emerald-600' : 'bg-secondary text-muted-foreground'}`}>
                        {partner.isOnline ? partner.availabilityState || 'ONLINE' : 'OFFLINE'}
                      </span>
                      <div className="text-xs text-muted-foreground mt-2">{partner.status}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {partner.status !== 'Approved' && (
                          <button disabled={busyId === partner.id} onClick={() => approvePartner(partner.id)} className="bg-primary text-primary-foreground font-bold px-3 py-2 rounded-lg text-xs hover:opacity-90 disabled:opacity-60">
                            Approve
                          </button>
                        )}
                        <button disabled={busyId === partner.id} onClick={() => trustPartner(partner)} className="bg-secondary text-foreground font-bold px-3 py-2 border border-border rounded-lg text-xs hover:bg-secondary/80 disabled:opacity-60">
                          {partner.isTrustedPartner ? 'Remove Trust' : 'Mark Trusted'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
