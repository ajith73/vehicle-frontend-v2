import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, CreditCard, Download, Loader2, Search, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import type { CustomerRequest } from '../../types';

type SettlementRecord = {
  id: number;
  status: string;
  amount?: number;
  bankReference?: string | null;
  notes?: string | null;
  processedAt?: string | null;
  createdAt: string;
  Mechanic?: {
    id: number;
    businessName?: string;
    name?: string;
  };
  PartnerEarnings?: Array<{
    id: number;
    amount?: number;
    status?: string;
  }>;
};

export default function AdminPayments() {
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [paymentIssues, setPaymentIssues] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [settlementData, issueData] = await Promise.all([
        apiClient<SettlementRecord[]>('/admin/finance/settlements'),
        apiClient<CustomerRequest[]>('/admin/payments/issues')
      ]);
      setSettlements(settlementData || []);
      setPaymentIssues(issueData || []);
    } catch (error) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const closeStream = openRealtimeStream<SettlementRecord[]>('/admin/finance/settlements', {
      event: 'admin:settlements:update',
      onMessage: (payload) => {
        setSettlements(Array.isArray(payload) ? payload : []);
        setLoading(false);
      }
    });

    return () => {
      closeStream();
    };
  }, []);

  const ledgerRows = useMemo(() => {
    const settlementRows = settlements.map((settlement) => ({
      key: `settlement-${settlement.id}`,
      type: 'Partner Settlement',
      ref: `SET-${settlement.id}`,
      related: settlement.Mechanic?.businessName || settlement.Mechanic?.name || 'Partner payout',
      amount: -Math.abs(
        settlement.amount ||
        settlement.PartnerEarnings?.reduce((sum, earning) => sum + Number(earning.amount || 0), 0) ||
        0
      ),
      status: settlement.status,
      gateway: settlement.bankReference || 'Pending bank ref',
      createdAt: settlement.processedAt || settlement.createdAt,
      rawSettlement: settlement
    }));

    const issueRows = paymentIssues.map((request) => ({
      key: `request-${request.id}`,
      type: 'Customer Payment',
      ref: `REQ-${request.id}`,
      related: request.CustomerUser?.CustomerProfile?.displayName || request.CustomerUser?.email || 'Customer',
      amount: Number(request.finalAmount || 0),
      status: request.paymentStatus || request.quoteStatus || 'PENDING',
      gateway: request.PaymentTransactions?.[0]?.transactionReference || 'Awaiting payment capture',
      createdAt: request.updatedAt,
      rawRequest: request
    }));

    return [...settlementRows, ...issueRows]
      .filter((row) => {
        const text = `${row.type} ${row.ref} ${row.related} ${row.gateway}`.toLowerCase();
        return !query || text.includes(query.toLowerCase());
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [settlements, paymentIssues, query]);

  const totals = useMemo(() => {
    const successfulToday = ledgerRows
      .filter((row) => row.status.includes('COMPLETED') || row.status.includes('SUCCESS'))
      .reduce((sum, row) => sum + (row.amount > 0 ? row.amount : 0), 0);
    const pendingValue = ledgerRows
      .filter((row) => row.status.includes('PENDING'))
      .reduce((sum, row) => sum + Math.abs(row.amount), 0);
    const failedValue = ledgerRows
      .filter((row) => row.status.includes('FAILED') || row.status.includes('REJECTED'))
      .reduce((sum, row) => sum + Math.abs(row.amount), 0);
    const payoutValue = settlements
      .filter((settlement) => settlement.status === 'COMPLETED')
      .reduce((sum, settlement) => sum + Math.abs(settlement.amount || 0), 0);
    return { successfulToday, pendingValue, failedValue, payoutValue };
  }, [ledgerRows, settlements]);

  const processSettlement = async (settlementId: number) => {
    setProcessingId(settlementId);
    try {
      await apiClient(`/admin/finance/settlements/${settlementId}/process`, {
        method: 'POST',
        data: {
          status: 'COMPLETED',
          bankReference: `BANK-SET-${settlementId}`,
          notes: 'Processed from Admin Payments ledger on Wednesday, August 19, 2026'
        }
      });
      toast.success('Settlement processed');
      await loadData();
    } catch (error) {
      toast.error('Failed to process settlement');
    } finally {
      setProcessingId(null);
    }
  };

  const exportLedger = () => {
    const csv = ledgerRows.map((row) => [row.type, row.ref, row.related, row.amount, row.status, row.gateway, row.createdAt].join(',')).join('\n');
    const blob = new Blob([`type,ref,related,amount,status,gateway,createdAt\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payments-ledger.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Payments Ledger</h1>
          <p className="text-muted-foreground">Unified finance view for payout settlements and customer payment exceptions.</p>
        </div>
        <button onClick={exportLedger} className="flex items-center gap-2 bg-secondary text-foreground font-bold px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary/80 shadow-sm">
          <Download className="w-4 h-4" /> Export Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Successful Value</p>
            <p className="text-xl font-black text-foreground">₹{totals.successfulToday.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Pending Value</p>
            <p className="text-xl font-black text-foreground">₹{totals.pendingValue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Failed / Rejected</p>
            <p className="text-xl font-black text-foreground">₹{totals.failedValue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ArrowUpRight className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Settled Payouts</p>
            <p className="text-xl font-black text-foreground">₹{totals.payoutValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 bg-secondary/30 flex-wrap">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by settlement or request..." className="bg-transparent border-none outline-none text-sm w-full font-medium" value={query} onChange={(event) => setQuery(event.target.value)} />
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
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Transaction</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Related Entities</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Amount</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Status</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Reference</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Timestamp</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Action</th>
                </tr>
              </thead>
              <motion.tbody initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {ledgerRows.map((row) => (
                  <motion.tr key={row.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${row.amount >= 0 ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                          {row.amount >= 0 ? <ArrowDownRight className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{row.type}</p>
                          <p className="text-[10px] text-muted-foreground">{row.ref}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-foreground">{row.related}</p>
                    </td>
                    <td className={`p-4 text-sm font-black ${row.amount >= 0 ? 'text-emerald-500' : 'text-foreground'}`}>
                      {row.amount >= 0 ? '+' : '-'}₹{Math.abs(row.amount).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${row.status.includes('COMPLETED') || row.status.includes('SUCCESS') ? 'bg-emerald-500/10 text-emerald-600' : row.status.includes('FAILED') || row.status.includes('REJECTED') ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">{row.gateway}</td>
                    <td className="p-4 text-xs text-muted-foreground font-medium">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      {'rawSettlement' in row && row.rawSettlement.status !== 'COMPLETED' ? (
                        <button disabled={processingId === row.rawSettlement.id} onClick={() => processSettlement(row.rawSettlement.id)} className="bg-primary text-primary-foreground font-bold px-3 py-2 rounded-lg text-xs hover:opacity-90 disabled:opacity-60">
                          {processingId === row.rawSettlement.id ? 'Processing...' : 'Process'}
                        </button>
                      ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> Synced
                        </div>
                      )}
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
