import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, Clock, RefreshCw, Star, Target, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import ErrorStateCard from '../../components/common/ErrorStateCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import MetricCard from '../../components/common/MetricCard';

type InsightsResponse = {
  mechanicName: string;
  score: number;
  metrics?: {
    acceptRate: number;
    completionRate: number;
    rejectRate: number;
    quoteApprovalRate: number;
    averageEtaMinutes?: number | null;
    onlineHours: number;
    dispatchAttemptsReceived: number;
  };
  improvements: string[];
};

export default function PartnerPerformancePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await apiClient<InsightsResponse>('/mechanic/performance/insights');
      setData(response);
    } catch (error: any) {
      const message = error.message || 'Failed to load partner performance';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingScreen />;

  if (loadError) {
    return (
      <div className="mx-auto flex h-[100dvh] max-w-lg items-center px-4">
        <ErrorStateCard title="Performance unavailable" description={loadError} onRetry={() => void load()} icon={Target} className="w-full" />
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/partner')} className="rounded-full bg-secondary p-2 transition-colors hover:bg-secondary/80">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground">Performance</h1>
            <p className="text-xs font-semibold text-muted-foreground">Latest dispatch and reliability snapshot</p>
          </div>
        </div>
        <button onClick={() => void load()} className="rounded-full border border-border bg-card p-2" aria-label="Refresh performance">
          <RefreshCw className="h-4 w-4 text-primary" />
        </button>
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-32 sm:max-w-4xl sm:p-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between rounded-2xl border-2 border-primary bg-card p-6 shadow-[0_10px_30px_rgba(59,130,246,0.1)]">
          <div>
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Partner score</h2>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-foreground">{Number(data?.score || 0).toFixed(1)}</span>
              <span className="mb-1.5 text-sm font-bold text-muted-foreground">/ 100</span>
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{data?.mechanicName || 'Partner account'}</p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-yellow-500/20 bg-yellow-500/10">
            <Star className="h-10 w-10 fill-yellow-500 text-yellow-500" />
          </div>
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <MetricCard label="Dispatch attempts" value={<span className="text-3xl font-black">{metrics?.dispatchAttemptsReceived || 0}</span>} />
          <MetricCard label="Average ETA" value={<span className="text-3xl font-black">{Number(metrics?.averageEtaMinutes || 0).toFixed(0)} min</span>} />
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {[
            ['Acceptance Rate', metrics?.acceptRate || 0, 'Requests you accepted vs received', 'emerald'],
            ['Completion Rate', metrics?.completionRate || 0, 'Jobs completed without cancellation', 'blue'],
            ['Reject Rate', metrics?.rejectRate || 0, 'Requests declined or skipped', 'destructive'],
            ['Quote Approval', metrics?.quoteApprovalRate || 0, 'Customer approvals after inspection quote', 'amber']
          ].map(([label, value, note, tone]) => (
            <div key={String(label)} className="mb-6 last:mb-0">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    {tone === 'emerald' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                     tone === 'blue' ? <Target className="h-4 w-4 text-blue-500" /> :
                     tone === 'amber' ? <Star className="h-4 w-4 text-amber-500" /> :
                     <XCircle className="h-4 w-4 text-destructive" />}
                    {label}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">{note}</p>
                </div>
                <span className={`font-black ${tone === 'emerald' ? 'text-emerald-500' : tone === 'blue' ? 'text-blue-500' : tone === 'amber' ? 'text-amber-500' : 'text-destructive'}`}>{Number(value).toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, Number(value)))}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'blue' ? 'bg-blue-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-destructive'}`} />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hours Online</p>
            <p className="text-xl font-black text-foreground">{Number(metrics?.onlineHours || 0).toFixed(1)} h</p>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Improvement items</p>
            <p className="text-xl font-black text-foreground">{(data?.improvements || []).length}</p>
          </div>
        </motion.div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Improvement focus</p>
          <div className="mt-3 space-y-2">
            {(data?.improvements || []).length > 0 ? data?.improvements.map((item) => <p key={item} className="text-sm text-muted-foreground">{item}</p>) : <p className="text-sm text-muted-foreground">No active improvement suggestions right now.</p>}
          </div>
        </div>
      </main>
    </motion.div>
  );
}
