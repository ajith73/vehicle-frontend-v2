import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Clock3, Loader2, RefreshCcw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

type AutomationRule = {
  ruleKey: string;
  eventName: string;
  conditionSummary: string;
  actionSummary: string;
  ownerRole: string;
  enabled: boolean;
  timeoutMinutes?: number | null;
  maxRetries?: number | null;
  notes?: string;
};

type AutomationResponse = {
  generatedAt: string;
  rules: AutomationRule[];
  recentChanges: Array<{
    id: number;
    action: string;
    details?: Partial<AutomationRule> | null;
    createdAt: string;
  }>;
};

export default function AdminAutomationEngine() {
  const [data, setData] = useState<AutomationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient<AutomationResponse>('/admin/automation/rules');
      setData(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateRule = async (rule: AutomationRule) => {
    setSavingKey(rule.ruleKey);
    try {
      await apiClient('/admin/automation/rules', {
        method: 'POST',
        data: rule
      });
      toast.success('Automation rule saved');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save rule');
    } finally {
      setSavingKey(null);
    }
  };

  const updateLocalRule = (ruleKey: string, patch: Partial<AutomationRule>) => {
    setData((current) => current ? ({
      ...current,
      rules: current.rules.map((rule) => rule.ruleKey === ruleKey ? { ...rule, ...patch } : rule)
    }) : current);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Automation Engine</h1>
          <p className="text-muted-foreground">Event to rule to action controls for dispatch timeout, quote follow-up, and risk review operations.</p>
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
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Rule Builder</h2>
            <div className="mt-5 space-y-4">
              {data.rules.map((rule) => (
                <motion.div key={rule.ruleKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground">{rule.eventName}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">{rule.ownerRole}</p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(event) => updateLocalRule(rule.ruleKey, { enabled: event.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Condition</label>
                      <textarea
                        value={rule.conditionSummary}
                        onChange={(event) => updateLocalRule(rule.ruleKey, { conditionSummary: event.target.value })}
                        className="min-h-[80px] w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Action</label>
                      <textarea
                        value={rule.actionSummary}
                        onChange={(event) => updateLocalRule(rule.ruleKey, { actionSummary: event.target.value })}
                        className="min-h-[80px] w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeout minutes</label>
                        <input
                          type="number"
                          value={rule.timeoutMinutes ?? 0}
                          onChange={(event) => updateLocalRule(rule.ruleKey, { timeoutMinutes: Number(event.target.value) })}
                          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Max retries</label>
                        <input
                          type="number"
                          value={rule.maxRetries ?? 0}
                          onChange={(event) => updateLocalRule(rule.ruleKey, { maxRetries: Number(event.target.value) })}
                          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
                      <textarea
                        value={rule.notes || ''}
                        onChange={(event) => updateLocalRule(rule.ruleKey, { notes: event.target.value })}
                        className="min-h-[70px] w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => updateRule(rule)}
                      disabled={savingKey === rule.ruleKey}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      {savingKey === rule.ruleKey ? 'Saving...' : 'Save Rule'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Recent Changes</h2>
            <div className="mt-5 space-y-3">
              {data.recentChanges.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                  No automation edits recorded yet.
                </div>
              ) : (
                data.recentChanges.map((change) => (
                  <div key={change.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{change.details?.eventName || 'Automation rule update'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{change.details?.actionSummary || change.action}</p>
                        <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock3 className="w-3 h-3" />
                          {new Date(change.createdAt).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
