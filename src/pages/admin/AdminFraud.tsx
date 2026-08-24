import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert, ShieldCheck, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

type FraudResponse = {
  summary: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    repeatedCustomerCancellations: number;
    repeatedPartnerCancellations: number;
    duplicateRequests: number;
    duplicatePayments: number;
  };
  flags: Array<{
    entityType: string;
    entityId: number;
    riskScore: number;
    signal: string;
    reason: string;
  }>;
};

export default function AdminFraud() {
  const [data, setData] = useState<FraudResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingKey, setActingKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiClient<FraudResponse>('/admin/fraud/signals');
      setData(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load fraud signals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reviewFlag = async (flag: FraudResponse['flags'][number], decision: 'WATCH' | 'ESCALATE' | 'CLEAR' | 'RESTRICT') => {
    const key = `${flag.entityType}-${flag.entityId}-${decision}`;
    setActingKey(key);
    try {
      await apiClient('/admin/fraud/review', {
        method: 'POST',
        data: {
          entityType: flag.entityType,
          entityId: flag.entityId,
          decision,
          assigneeRole: decision === 'ESCALATE' ? 'Risk Ops' : decision === 'RESTRICT' ? 'Fraud Control' : 'Support',
          notes: `${flag.signal} reviewed from fraud queue`
        }
      });
      toast.success(`Fraud action recorded: ${decision}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to record fraud action');
    } finally {
      setActingKey(null);
    }
  };

  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Fraud & Abuse Control</h1>
        <p className="text-muted-foreground">Signal review plus action workflow for watch, clear, escalate, and restrict decisions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <RiskCard title="High risk" value={String(summary?.highRisk || 0)} icon={ShieldAlert} tone="destructive" />
        <RiskCard title="Medium risk" value={String(summary?.mediumRisk || 0)} icon={AlertTriangle} tone="warning" />
        <RiskCard title="Duplicate requests" value={String(summary?.duplicateRequests || 0)} icon={ShieldCheck} tone="primary" />
        <RiskCard title="Duplicate payments" value={String(summary?.duplicatePayments || 0)} icon={Wallet} tone="primary" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold text-foreground">Fraud workflow queue</h2>
        <p className="text-sm text-muted-foreground mt-1">Admin actions are review-first and recorded for risk operations follow-up.</p>

        {loading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading fraud signals...
          </div>
        ) : data && data.flags.length > 0 ? (
          <div className="mt-6 space-y-3">
            {data.flags.map((flag, index) => (
              <div key={`${flag.entityType}-${flag.entityId}-${index}`} className="rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{flag.signal}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{flag.reason}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {flag.entityType} #{flag.entityId}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${flag.riskScore >= 80 ? 'bg-destructive/10 text-destructive' : flag.riskScore >= 60 ? 'bg-amber-500/10 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                    Risk {flag.riskScore}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['WATCH', 'ESCALATE', 'CLEAR', 'RESTRICT'] as const).map((decision) => {
                    const key = `${flag.entityType}-${flag.entityId}-${decision}`;
                    return (
                      <button
                        key={decision}
                        onClick={() => reviewFlag(flag, decision)}
                        disabled={actingKey === key}
                        className={`rounded-lg px-3 py-2 text-xs font-bold ${
                          decision === 'ESCALATE' ? 'bg-amber-500/10 text-amber-700' :
                          decision === 'RESTRICT' ? 'bg-destructive/10 text-destructive' :
                          decision === 'CLEAR' ? 'bg-emerald-500/10 text-emerald-600' :
                          'bg-primary/10 text-primary'
                        } disabled:opacity-60`}
                      >
                        {actingKey === key ? 'Saving...' : decision}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
            No risk signals are currently flagged above the review threshold.
          </div>
        )}
      </div>
    </div>
  );
}

function RiskCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: any; tone: 'destructive' | 'warning' | 'primary' }) {
  const toneMap = {
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-amber-500/10 text-amber-700',
    primary: 'bg-primary/10 text-primary',
  } as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${toneMap[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
    </div>
  );
}
