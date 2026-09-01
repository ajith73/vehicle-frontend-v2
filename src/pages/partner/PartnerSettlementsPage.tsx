import { useEffect, useState } from 'react';
import { ArrowRightLeft, ChevronLeft, Landmark, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';

type EarningsResponse = {
  summary: {
    pending: number;
    settled: number;
    payoutStatus: string;
    lastBankReference?: string | null;
  };
  settlements: Array<{
    id: number;
    status: string;
    totalAmount?: number;
    createdAt: string;
    processedAt?: string | null;
    bankReference?: string | null;
    notes?: string | null;
    PartnerEarnings?: Array<{ id: number }>;
  }>;
};

export default function PartnerSettlementsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiClient<EarningsResponse>('/mechanic/earnings');
        setData(response);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load settlements');
      } finally {
        setLoading(false);
      }
    };
    load();

    const closeStream = openRealtimeStream<EarningsResponse>('/mechanic/earnings', {
      event: 'mechanic:earnings:update',
      onMessage: (payload) => {
        setData(payload);
        setLoading(false);
      }
    });

    return () => {
      closeStream();
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate('/partner/account')} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">Bank & Settlements</h1>
          <p className="text-xs font-semibold text-muted-foreground">Payout state, bank reference, and settlement history</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full pb-32">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending payout</p>
                <p className="mt-2 text-3xl font-black text-foreground">₹{Number(data?.summary.pending || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Settled total</p>
                <p className="mt-2 text-3xl font-black text-foreground">₹{Number(data?.summary.settled || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payout status</p>
                <p className="mt-2 text-lg font-black text-foreground">{data?.summary.payoutStatus || 'PENDING'}</p>
                <p className="mt-2 text-xs text-muted-foreground">{data?.summary.lastBankReference || 'Bank reference not available yet'}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Landmark className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-black text-foreground">Settlement history</h2>
                  <p className="text-sm text-muted-foreground">Track payout batches and bank processing references.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(data?.settlements || []).length === 0 ? (
                  <div className="rounded-2xl border border-border bg-background/70 p-5 text-sm text-muted-foreground">
                    No settlement records yet. Completed and payable earnings will appear here once the admin processes payout batches.
                  </div>
                ) : (
                  data!.settlements.map((settlement) => (
                    <div key={settlement.id} className="rounded-2xl border border-border bg-background/70 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-foreground">SET-{settlement.id}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Created {new Date(settlement.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${settlement.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-700' : settlement.status === 'FAILED' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-700'}`}>
                          {settlement.status}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-4 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</p>
                          <p className="mt-1 font-bold text-foreground">₹{Number(settlement.totalAmount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jobs</p>
                          <p className="mt-1 font-bold text-foreground">{settlement.PartnerEarnings?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Processed at</p>
                          <p className="mt-1 font-bold text-foreground">{settlement.processedAt ? new Date(settlement.processedAt).toLocaleString('en-IN') : 'Pending'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bank ref</p>
                          <p className="mt-1 font-bold text-foreground break-all">{settlement.bankReference || 'Pending'}</p>
                        </div>
                      </div>
                      {settlement.notes ? <p className="mt-3 text-sm text-muted-foreground">{settlement.notes}</p> : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <ArrowRightLeft className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h2 className="font-bold text-foreground">Bank or UPI withdrawal</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Withdrawal request tooling is not separate yet in this phase, but settlement readiness, bank references, and payout completion state are now visible here from live payout data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
