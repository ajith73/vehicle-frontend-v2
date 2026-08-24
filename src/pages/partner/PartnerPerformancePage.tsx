import { useEffect, useState } from 'react';
import { Target, Star, Clock, CheckCircle2, XCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

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

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiClient<InsightsResponse>('/mechanic/performance/insights');
        setData(response);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load partner performance');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate('/partner')} className="p-2 -ml-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground mb-0.5">Performance</h1>
          <p className="text-xs font-semibold text-muted-foreground">Latest dispatch and reliability snapshot</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full pb-32 flex flex-col gap-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card border-2 border-primary rounded-2xl p-6 shadow-[0_10px_30px_rgba(var(--primary),0.1)] flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Partner score</h2>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-foreground">{Number(data?.score || 0).toFixed(1)}</span>
              <span className="text-sm font-bold text-muted-foreground mb-1.5">/ 100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">{data?.mechanicName || 'Partner account'}</p>
          </div>
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center border-4 border-yellow-500/20">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          {[
            ['Acceptance Rate', metrics?.acceptRate || 0, 'Requests you accepted vs received', 'emerald'],
            ['Completion Rate', metrics?.completionRate || 0, 'Jobs completed without cancellation', 'blue'],
            ['Reject Rate', metrics?.rejectRate || 0, 'Requests declined or skipped', 'destructive'],
            ['Quote Approval', metrics?.quoteApprovalRate || 0, 'Customer approvals after inspection quote', 'amber'],
          ].map(([label, value, note, tone]) => (
            <div key={String(label)}>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    {tone === 'emerald' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                     tone === 'blue' ? <Target className="w-4 h-4 text-blue-500" /> :
                     tone === 'amber' ? <Star className="w-4 h-4 text-amber-500" /> :
                     <XCircle className="w-4 h-4 text-destructive" />}
                    {label}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">{note}</p>
                </div>
                <span className={`font-black ${tone === 'emerald' ? 'text-emerald-500' : tone === 'blue' ? 'text-blue-500' : tone === 'amber' ? 'text-amber-500' : 'text-destructive'}`}>{Number(value).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, Number(value)))}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'blue' ? 'bg-blue-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-destructive'}`}></motion.div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Hours Online</p>
            <p className="font-black text-xl text-foreground">{Number(metrics?.onlineHours || 0).toFixed(1)} h</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg Arrival</p>
            <p className="font-black text-xl text-foreground">{Number(metrics?.averageEtaMinutes || 0).toFixed(0)} min</p>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dispatch attempts</p>
            <p className="mt-2 text-3xl font-black text-foreground">{metrics?.dispatchAttemptsReceived || 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Improvement focus</p>
            <div className="mt-2 space-y-2">
              {(data?.improvements || []).map((item) => (
                <p key={item} className="text-sm text-muted-foreground">{item}</p>
              ))}
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
