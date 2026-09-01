import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Calendar, Landmark, RefreshCw, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import LoadingScreen from '../../components/common/LoadingScreen';
import MetricCard from '../../components/common/MetricCard';

type EarningsResponse = {
  summary: {
    today: number; week: number; month: number; total: number; pending: number; settled: number; grossEarnings: number; platformFee: number; netEarnings: number; cashCollected: number; onlinePayments: number; refundAdjustments: number; cancellationCompensation: number; payoutStatus: string; lastBankReference?: string | null;
  };
  earnings: Array<{ id: number; createdAt: string; grossAmount: number; platformFeeDeduction: number; netEarningAmount: number; status: string; notes?: string | null; CustomerRequest?: { id: number; issueSummary?: string; vehicleLabel?: string; status?: string; }; PaymentTransaction?: { paymentMethod?: string | null; paymentStatus?: string; amount?: number; }; PayoutSettlement?: { id: number; status: string; bankReference?: string | null; }; }>;
  settlements: Array<{ id: number; status: string; totalAmount?: number; bankReference?: string | null; processedAt?: string | null; }>;
};
type Period = 'TODAY' | 'WEEK' | 'MONTH' | 'TOTAL';

export default function PartnerEarningsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('WEEK');
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const fetchEarnings = async () => {
    try {
      const res = await apiClient<EarningsResponse>('/mechanic/earnings');
      setData(res);
      setConnectionLost(false);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error: any) {
      toast.error(error.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEarnings();
    const closeStream = openRealtimeStream<EarningsResponse>('/mechanic/earnings', {
      event: 'mechanic:earnings:update',
      onMessage: (payload) => {
        setData(payload);
        setLoading(false);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
      },
      onError: async () => {
        setConnectionLost(true);
        await fetchEarnings();
      }
    });
    return () => closeStream();
  }, []);

  const earnings = data?.earnings || [];
  const summary = data?.summary;
  const filteredEarnings = useMemo(() => {
    const now = new Date();
    if (period === 'TOTAL') return earnings;
    return earnings.filter((item) => {
      const createdAt = new Date(item.createdAt);
      if (period === 'TODAY') return createdAt.toDateString() === now.toDateString();
      if (period === 'WEEK') return createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    });
  }, [earnings, period]);

  const heroAmount = summary ? period === 'TODAY' ? summary.today : period === 'WEEK' ? summary.week : period === 'MONTH' ? summary.month : summary.total : 0;
  const lastUpdatedLabel = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('en-IN') : null;

  if (loading) return <LoadingScreen />;

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/partner')} className="rounded-full bg-secondary p-2"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
            <div>
              <h1 className="text-xl font-black text-foreground">Earnings</h1>
              <p className="text-xs font-semibold text-muted-foreground">Partner payouts, deductions, and settlement readiness</p>
            </div>
          </div>
          <button onClick={() => void fetchEarnings()} className="rounded-full border border-border bg-card p-2" aria-label="Refresh earnings"><RefreshCw className="h-4 w-4 text-primary" /></button>
        </div>
        <div className="flex rounded-xl bg-secondary p-1">
          {(['TODAY', 'WEEK', 'MONTH', 'TOTAL'] as Period[]).map((option) => (
            <button key={option} onClick={() => setPeriod(option)} className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${period === option ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {option === 'TODAY' ? 'Today' : option === 'WEEK' ? 'This Week' : option === 'MONTH' ? 'This Month' : 'Total'}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-32 sm:max-w-5xl sm:p-6">
        {connectionLost ? <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">Realtime earnings sync was interrupted. Latest data has been refreshed directly.</div> : null}

        <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-lg">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary-foreground/80">Net earnings</h2>
          <div className="flex items-end gap-3"><span className="text-4xl font-black">₹{heroAmount.toFixed(2)}</span></div>
          <p className="mt-3 text-sm text-primary-foreground/80">Payout status: {summary?.payoutStatus || 'PENDING'}</p>
          <p className="mt-1 text-xs text-primary-foreground/70">{summary?.lastBankReference || 'Bank reference will appear after settlement processing.'}</p>
          {lastUpdatedLabel ? <p className="mt-3 text-xs text-primary-foreground/70">Last updated {lastUpdatedLabel}</p> : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {[
            ['Pending', summary?.pending || 0], ['Settled', summary?.settled || 0], ['Gross earnings', summary?.grossEarnings || 0],
            ['Platform fee', summary?.platformFee || 0], ['Net earnings', summary?.netEarnings || 0], ['Cash collected', summary?.cashCollected || 0],
            ['Online payments', summary?.onlinePayments || 0], ['Refund adjustments', summary?.refundAdjustments || 0], ['Cancellation comp.', summary?.cancellationCompensation || 0]
          ].map(([label, value]) => <MetricCard key={String(label)} label={String(label)} value={<span className="text-2xl font-black">₹{Number(value).toFixed(2)}</span>} />)}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><Wallet className="h-4 w-4 text-primary" /> Job earnings ledger</h3>
            {filteredEarnings.length === 0 ? <p className="py-6 text-sm text-muted-foreground">No earnings found for this period.</p> : (
              <div className="space-y-3">
                {filteredEarnings.map((txn) => (
                  <div key={txn.id} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${txn.status === 'SETTLED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-600'}`}>
                        {txn.status === 'SETTLED' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{txn.CustomerRequest?.issueSummary || `Request #${txn.CustomerRequest?.id || txn.id}`}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleString('en-IN')} • {txn.PaymentTransaction?.paymentMethod || 'Payment mode pending'}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Gross ₹{Number(txn.grossAmount || 0).toFixed(2)} • Fee ₹{Number(txn.platformFeeDeduction || 0).toFixed(2)} • Net ₹{Number(txn.netEarningAmount || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-foreground">₹{Number(txn.netEarningAmount || 0).toFixed(2)}</p>
                      <p className={`mt-1 text-[10px] font-black uppercase tracking-wider ${txn.status === 'SETTLED' ? 'text-emerald-600' : 'text-amber-600'}`}>{txn.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><Calendar className="h-4 w-4 text-primary" /> Period snapshot</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Today</span><span className="font-bold text-foreground">₹{Number(summary?.today || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Week</span><span className="font-bold text-foreground">₹{Number(summary?.week || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Month</span><span className="font-bold text-foreground">₹{Number(summary?.month || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-foreground">₹{Number(summary?.total || 0).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><Landmark className="h-4 w-4 text-primary" /> Settlement history</h3>
              <div className="space-y-3">
                {(data?.settlements || []).slice(0, 5).map((settlement) => (
                  <div key={settlement.id} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">SET-{settlement.id}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{settlement.processedAt ? new Date(settlement.processedAt).toLocaleString('en-IN') : 'Awaiting processing'}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${settlement.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>{settlement.status}</span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-foreground">₹{Number(settlement.totalAmount || 0).toFixed(2)}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{settlement.bankReference || 'Bank ref pending'}</p>
                  </div>
                ))}
                {(data?.settlements || []).length === 0 ? <p className="text-sm text-muted-foreground">No settlements recorded yet.</p> : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
