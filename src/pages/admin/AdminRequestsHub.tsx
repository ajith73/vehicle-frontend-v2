import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Download, Filter, Loader2, MapPin, Search, User, Wrench, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { CustomerRequest } from '../../types';

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : 'N/A';
const truncateText = (value?: string, max = 38) => {
  if (!value) return 'Unknown';
  return value.length > max ? `${value.slice(0, max).trimEnd()}...` : value;
};

const statusTone = (status?: string) => {
  if (!status) return 'bg-secondary text-foreground';
  if (status.includes('CANCELLED')) return 'bg-destructive/10 text-destructive';
  if (status.includes('COMPLETED')) return 'bg-emerald-500/10 text-emerald-600';
  if (['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'SERVICE_STARTED', 'ASSIGNED'].includes(status)) return 'bg-primary/10 text-primary';
  return 'bg-amber-500/10 text-amber-600';
};

export default function AdminRequestsHub() {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');

  const fetchRequests = async () => {
    try {
      const data = await apiClient<CustomerRequest[]>('/admin/requests');
      setRequests(data || []);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedRequest(null);
      return;
    }

    const loadDetails = async () => {
      setDetailsLoading(true);
      try {
        const data = await apiClient<CustomerRequest>(`/admin/requests/${selectedId}`);
        setSelectedRequest(data);
      } catch (error) {
        toast.error('Failed to load request details');
      } finally {
        setDetailsLoading(false);
      }
    };

    loadDetails();
  }, [selectedId]);

  const cities = useMemo(() => {
    return Array.from(new Set(
      requests
        .map((request) => request.Mechanic?.city || request.addressText || '')
        .filter(Boolean)
    ));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const customerName = request.CustomerUser?.CustomerProfile?.displayName || request.CustomerUser?.email || '';
      const mechanicName = request.Mechanic?.businessName || request.Mechanic?.name || '';
      const city = request.Mechanic?.city || request.addressText || '';
      const text = `${request.id} ${customerName} ${mechanicName} ${request.issueSummary} ${request.vehicleLabel || ''}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      const matchesCity = cityFilter === 'ALL' || city.toLowerCase().includes(cityFilter.toLowerCase());
      return matchesQuery && matchesStatus && matchesCity;
    });
  }, [requests, query, statusFilter, cityFilter]);

  const exportCsv = () => {
    const header = ['id', 'customer', 'service', 'partner', 'status', 'city', 'createdAt'];
    const rows = filteredRequests.map((request) => [
      request.id,
      request.CustomerUser?.CustomerProfile?.displayName || request.CustomerUser?.email || '',
      request.ServiceType?.name || request.issueSummary || '',
      request.Mechanic?.businessName || request.Mechanic?.name || '',
      request.status,
      request.Mechanic?.city || request.addressText || '',
      request.createdAt
    ]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-requests.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const cancelRequest = async (requestId: number) => {
    try {
      await apiClient(`/admin/requests/${requestId}/cancel`, {
        method: 'POST',
        data: { reason: 'Cancelled by admin from Requests Hub' }
      });
      toast.success('Request cancelled');
      await fetchRequests();
      if (selectedId === requestId) {
        setSelectedId(requestId);
      }
    } catch (error) {
      toast.error('Failed to cancel request');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Requests Hub</h1>
          <p className="text-muted-foreground">Track every ride-like roadside request with real dispatch, payment, and support state.</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-secondary text-foreground font-bold px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary/80 shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-4 bg-secondary/30">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search request, customer, partner..."
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium outline-none w-44" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All Statuses</option>
            {Array.from(new Set(requests.map((request) => request.status))).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium outline-none w-44" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            <option value="ALL">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground">
            <Filter className="w-4 h-4" /> {filteredRequests.length} shown
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
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Request</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Customer</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Service</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Partner</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Location</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Status</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Amount</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Created</th>
                </tr>
              </thead>
              <motion.tbody initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
                {filteredRequests.map((request) => (
                  <motion.tr
                    key={request.id}
                    variants={rowVariants}
                    className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedId(request.id)}
                  >
                    <td className="p-4 font-bold text-sm">REQ-{request.id}</td>
                    <td className="p-4 text-sm font-medium">{request.CustomerUser?.CustomerProfile?.displayName || request.CustomerUser?.email || 'Unknown'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{request.ServiceType?.name || request.issueSummary}</td>
                    <td className="p-4 text-sm text-muted-foreground">{request.Mechanic?.businessName || request.Mechanic?.name || 'Unassigned'}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[18rem]">
                      <span className="block truncate" title={request.Mechanic?.city || request.addressText || 'Unknown'}>
                        {truncateText(request.Mechanic?.city || request.addressText || 'Unknown')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${statusTone(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold">{request.finalAmount ? `₹${request.finalAmount}` : 'Pending'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatTime(request.createdAt)}</td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 right-0 bottom-0 w-[520px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            <div className="p-5 border-b border-border flex justify-between items-center bg-background/70 backdrop-blur">
              <div>
                <h2 className="font-black text-xl">REQ-{selectedId}</h2>
                <p className="text-xs text-muted-foreground font-semibold">Live request view</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-secondary rounded-full bg-secondary/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {detailsLoading || !selectedRequest ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${statusTone(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(selectedRequest.statusUpdatedAt || selectedRequest.updatedAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Customer</p>
                      <p className="text-sm font-bold">{selectedRequest.CustomerUser?.CustomerProfile?.displayName || selectedRequest.CustomerUser?.email || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedRequest.CustomerUser?.email || 'No email'}</p>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Vehicle</p>
                      <p className="text-sm font-bold">{selectedRequest.vehicleLabel || 'Not captured'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedRequest.VehicleType?.name || 'Vehicle type not linked'}</p>
                    </div>
                  </div>

                  <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Service Details</p>
                    <p className="font-bold">{selectedRequest.ServiceType?.name || selectedRequest.issueSummary}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRequest.issueDetails || 'No extra issue details added.'}</p>
                    <p className="text-xs text-muted-foreground mt-3 flex items-start gap-2">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {selectedRequest.addressText || 'Location not available'}
                    </p>
                  </div>

                  <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Partner & Payment</p>
                    <div className="flex items-center justify-between text-sm gap-3">
                      <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-muted-foreground" /> {selectedRequest.Mechanic?.businessName || selectedRequest.Mechanic?.name || 'Unassigned'}</span>
                      <span className="font-bold">{selectedRequest.finalAmount ? `₹${selectedRequest.finalAmount}` : 'Amount pending'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                      <span>Dispatch: {selectedRequest.dispatchStatus || 'Not started'}</span>
                      <span>Payment: {selectedRequest.paymentStatus || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Timeline</p>
                    <div className="flex flex-col gap-3">
                      {(selectedRequest.RequestTimelineEvents || []).slice(-6).reverse().map((event) => (
                        <div key={event.id} className="border-l-2 border-primary pl-3">
                          <p className="text-sm font-bold">{event.eventType}</p>
                          <p className="text-xs text-muted-foreground">{event.notes || `${event.actorType} updated ${event.toStatus || event.eventType}`}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{formatTime(event.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {selectedRequest && (
              <div className="p-4 border-t border-border bg-background flex gap-3">
                <button
                  onClick={() => cancelRequest(selectedRequest.id)}
                  className="flex-1 bg-secondary text-foreground font-bold p-3 rounded-xl hover:bg-secondary/80 transition-colors text-sm"
                >
                  Cancel Request
                </button>
                <button
                  onClick={() => toast('Use Dispatch screen for manual override')}
                  className="flex-1 bg-primary text-primary-foreground font-bold p-3 rounded-xl hover:opacity-90 transition-colors text-sm shadow-md"
                >
                  Manual Dispatch
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
