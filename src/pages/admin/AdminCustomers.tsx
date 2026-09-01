import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, KeyRound, Loader2, Mail, MapPin, Phone, RefreshCcw, Search, ShieldAlert, Star, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { AdminCustomerRecord } from '../../types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { formatPhoneDisplay } from '../../utils/phone';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<{ customerName: string; password: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    type: 'reset' | 'delete';
    customer: AdminCustomerRecord;
  } | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiClient<AdminCustomerRecord[]>('/admin/customers');
      setCustomers(data || []);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const text = `${customer.displayName} ${customer.email} ${formatPhoneDisplay(customer.phone, '')} ${customer.city || ''}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const customerStatus = customer.subscriptionStatus || 'BASIC';
      const matchesStatus = statusFilter === 'ALL' || customerStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [customers, query, statusFilter]);

  const handleResetPassword = async (customer: AdminCustomerRecord) => {
    setResettingId(customer.id);
    try {
      const response = await apiClient<{ message: string; temporaryPassword: string }>(`/admin/customers/${customer.id}/reset-password`, {
        method: 'POST'
      });
      setTemporaryPassword({
        customerName: customer.displayName,
        password: response.temporaryPassword
      });
      toast.success('Temporary password generated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteCustomer = async (customer: AdminCustomerRecord) => {
    setDeletingId(customer.id);
    try {
      await apiClient(`/admin/customers/${customer.id}`, {
        method: 'DELETE'
      });
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      toast.success('Customer account deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Customers</h1>
          <p className="text-muted-foreground">Live customer directory with membership, location, repeat-booking visibility, and admin account controls.</p>
        </div>
        <button
          onClick={() => void loadCustomers()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary/50 disabled:opacity-60"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 bg-secondary/30 flex-wrap">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by name, phone, or email..." className="bg-transparent border-none outline-none text-sm w-full font-medium" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium outline-none w-48" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All Membership States</option>
            {Array.from(new Set(customers.map((customer) => customer.subscriptionStatus || 'BASIC'))).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground">
            <Filter className="w-4 h-4" /> {filteredCustomers.length} customers
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
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Customer</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Contact</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">City</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Requests</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Membership</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Joined</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Actions</th>
                </tr>
              </thead>
              <motion.tbody initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {filteredCustomers.map((customer) => (
                  <motion.tr key={customer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-border hover:bg-secondary/20 transition-colors align-top">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{customer.displayName}</p>
                          <p className="text-[10px] text-muted-foreground">ID: CUST-{customer.id}</p>
                          {customer.deletedAt ? (
                            <span className="mt-1 inline-flex w-max rounded bg-destructive/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-destructive">
                              Deleted
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium flex items-center gap-1 mb-0.5"><Phone className="w-3 h-3 text-muted-foreground" /> {formatPhoneDisplay(customer.phone, 'No phone')}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</p>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" /> {customer.city || 'Unknown'}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold">{customer.requestCount}</div>
                      <div className="text-[10px] text-muted-foreground">{customer.savedVehiclesCount} saved vehicles</div>
                    </td>
                    <td className="p-4">
                      {customer.prioritySupportEligible ? (
                        <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 w-max">
                          <Star className="w-3 h-3" /> {customer.subscriptionTier || customer.subscriptionStatus || 'Premium'}
                        </span>
                      ) : (
                        <span className="bg-secondary text-muted-foreground text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 w-max">
                          <ShieldAlert className="w-3 h-3" /> {customer.subscriptionStatus || 'Basic'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <button
                          onClick={() => setConfirmState({ type: 'reset', customer })}
                          disabled={Boolean(customer.deletedAt) || resettingId === customer.id || deletingId === customer.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15 disabled:opacity-60"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          {resettingId === customer.id ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button
                          onClick={() => setConfirmState({ type: 'delete', customer })}
                          disabled={Boolean(customer.deletedAt) || deletingId === customer.id || resettingId === customer.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/15 disabled:opacity-60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingId === customer.id ? 'Deleting...' : 'Delete'}
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

      {temporaryPassword ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-xl font-black text-foreground">Temporary Password</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Password reset completed for <span className="font-bold text-foreground">{temporaryPassword.customerName}</span>. Share this temporary password securely and ask the customer to change it after login.
            </p>
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Temporary password</p>
              <p className="mt-2 break-all font-mono text-lg font-black text-primary">{temporaryPassword.password}</p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setTemporaryPassword(null)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirmState)}
        title={confirmState?.type === 'reset' ? 'Reset Customer Password' : 'Delete Customer Account'}
        message={
          confirmState?.type === 'reset'
            ? `Reset password for ${confirmState.customer.displayName}?\nA temporary password will be generated and shown once.`
            : `Delete customer ${confirmState?.customer.displayName}?\nThis will remove their customer account access.`
        }
        confirmText={confirmState?.type === 'reset' ? 'Reset Password' : 'Delete'}
        cancelText="Cancel"
        type={confirmState?.type === 'reset' ? 'warning' : 'danger'}
        onConfirm={() => {
          if (!confirmState) return;
          const { type, customer } = confirmState;
          setConfirmState(null);
          if (type === 'reset') {
            void handleResetPassword(customer);
            return;
          }
          void handleDeleteCustomer(customer);
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
