import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Loader2, RefreshCcw, Send, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

type NotificationEngineResponse = {
  generatedAt: string;
  summary: {
    activeFlows: number;
    retryBacklog: number;
    duplicateRisk: number;
  };
  rows: Array<{
    notificationKey: string;
    title: string;
    audience: string;
    channel: string;
    health: string;
    retryEligible: boolean;
    duplicateCount: number;
    lastTriggeredAt?: string | null;
  }>;
  history: Array<{
    id: string;
    eventName: string;
    dedupeKey: string;
    audience: string;
    status: string;
    retryEligible: boolean;
    retryCount: number;
    createdAt: string;
  }>;
};

export default function AdminNotifications() {
  const [data, setData] = useState<NotificationEngineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingKey, setRetryingKey] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient<NotificationEngineResponse>('/admin/notifications/engine');
      setData(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load notification engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const retryFlow = async (notificationKey: string) => {
    setRetryingKey(notificationKey);
    try {
      await apiClient('/admin/notifications/engine/retry', {
        method: 'POST',
        data: {
          notificationKey,
          reason: 'Manual retry from notification engine'
        }
      });
      toast.success('Retry queued');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to retry notification');
    } finally {
      setRetryingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Notification Engine</h1>
          <p className="text-muted-foreground">Delivery coverage, retry backlog, and dedupe risk for live customer, partner, and ops communication.</p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:border-primary/40">
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard label="Active flows" value={String(data.summary.activeFlows)} icon={Bell} />
            <SummaryCard label="Retry backlog" value={String(data.summary.retryBacklog)} icon={RefreshCcw} />
            <SummaryCard label="Duplicate risk" value={String(data.summary.duplicateRisk)} icon={ShieldAlert} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-6">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Flow Matrix</h2>
              <div className="mt-5 space-y-3">
                {data.rows.map((row) => (
                  <motion.div key={row.notificationKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{row.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{row.audience} • {row.channel}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                        row.health === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                        row.health === 'BUSY' ? 'bg-amber-500/10 text-amber-700' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {row.health}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Dedupe signals: {row.duplicateCount}</span>
                      <span>Last trigger: {row.lastTriggeredAt ? new Date(row.lastTriggeredAt).toLocaleString('en-IN') : 'No recent event'}</span>
                    </div>
                    <div className="mt-4">
                      <button
                        disabled={!row.retryEligible || retryingKey === row.notificationKey}
                        onClick={() => retryFlow(row.notificationKey)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
                      >
                        <Send className="w-4 h-4" />
                        {retryingKey === row.notificationKey ? 'Retrying...' : 'Retry Flow'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Notification History</h2>
              <p className="mt-1 text-sm text-muted-foreground">Recent event trail for retry and dedupe checks.</p>
              <div className="mt-5 space-y-3">
                {data.history.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{item.eventName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.audience}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                        item.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Dedupe key: {item.dedupeKey}</span>
                      <span>Retries: {item.retryCount}</span>
                      <span>{new Date(item.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
    </div>
  );
}
