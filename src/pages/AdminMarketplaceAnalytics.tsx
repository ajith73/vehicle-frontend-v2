import { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Gauge, MapPinned, TrendingUp, Users, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/apiClient';
import type {
  CustomerFunnelAnalytics,
  DispatchScoringResponse,
  FinancialAnalytics,
  MarketplaceZoneAnalytics,
  PartnerPerformanceAnalytics,
} from '../types';

type AnalyticsTab = 'customer' | 'partner' | 'zones' | 'financial' | 'scoring';

export default function AdminMarketplaceAnalytics() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('customer');
  const [loading, setLoading] = useState(true);
  const [customerFunnel, setCustomerFunnel] = useState<CustomerFunnelAnalytics | null>(null);
  const [partnerPerformance, setPartnerPerformance] = useState<PartnerPerformanceAnalytics[]>([]);
  const [zoneMetrics, setZoneMetrics] = useState<MarketplaceZoneAnalytics[]>([]);
  const [financial, setFinancial] = useState<FinancialAnalytics | null>(null);
  const [dispatchScoring, setDispatchScoring] = useState<DispatchScoringResponse | null>(null);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesForm, setRulesForm] = useState({
    distanceWeight: '35',
    serviceFitWeight: '15',
    vehicleFitWeight: '10',
    availabilityWeight: '15',
    trustWeight: '10',
    reliabilityWeight: '10',
    responseSpeedWeight: '3',
    premiumEligibilityWeight: '2',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [customerData, partnerData, zoneData, financialData, scoringData] = await Promise.all([
        apiClient<CustomerFunnelAnalytics>('/admin/analytics/customer-funnel'),
        apiClient<PartnerPerformanceAnalytics[]>('/admin/analytics/partner-performance'),
        apiClient<MarketplaceZoneAnalytics[]>('/admin/analytics/marketplace-zones'),
        apiClient<FinancialAnalytics>('/admin/analytics/financial'),
        apiClient<DispatchScoringResponse>('/admin/dispatch/scoring'),
      ]);

      setCustomerFunnel(customerData);
      setPartnerPerformance(partnerData);
      setZoneMetrics(zoneData);
      setFinancial(financialData);
      setDispatchScoring(scoringData);
      setRulesForm({
        distanceWeight: String(scoringData.rules.distanceWeight ?? 35),
        serviceFitWeight: String(scoringData.rules.serviceFitWeight ?? 15),
        vehicleFitWeight: String(scoringData.rules.vehicleFitWeight ?? 10),
        availabilityWeight: String(scoringData.rules.availabilityWeight ?? 15),
        trustWeight: String(scoringData.rules.trustWeight ?? 10),
        reliabilityWeight: String(scoringData.rules.reliabilityWeight ?? 10),
        responseSpeedWeight: String(scoringData.rules.responseSpeedWeight ?? 3),
        premiumEligibilityWeight: String(scoringData.rules.premiumEligibilityWeight ?? 2),
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load marketplace analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveRules = async () => {
    setRulesSaving(true);
    try {
      await apiClient('/admin/dispatch/scoring/rules', {
        method: 'PUT',
        data: Object.fromEntries(
          Object.entries(rulesForm).map(([key, value]) => [key, Number(value || 0)])
        )
      });
      toast.success('Dispatch scoring rules updated');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update scoring rules');
    } finally {
      setRulesSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm">
        Loading marketplace intelligence...
      </div>
    );
  }

  const tabs = [
    { id: 'customer' as const, label: 'Customer Funnel', icon: Users },
    { id: 'partner' as const, label: 'Partner Quality', icon: Wrench },
    { id: 'zones' as const, label: 'Zone Health', icon: MapPinned },
    { id: 'financial' as const, label: 'Financial', icon: DollarSign },
    { id: 'scoring' as const, label: 'Dispatch Scoring', icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Phase 7</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">Marketplace Intelligence</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          This intelligence layer turns request, dispatch, and commercial activity into admin decisions for growth, supply quality, and smarter matching.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-secondary'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'customer' && customerFunnel && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['Started', customerFunnel.requestStarted],
              ['Submitted', customerFunnel.requestSubmitted],
              ['Assigned', customerFunnel.requestAssigned],
              ['Completed', customerFunnel.serviceCompleted],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                <p className="mt-3 text-3xl font-black text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Funnel Drop Analysis</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile title="Assignment Rate" value={`${customerFunnel.metadata?.assignmentRate || 0}%`} note="Submitted to assigned" />
              <MetricTile title="Completion Rate" value={`${customerFunnel.metadata?.completionRate || 0}%`} note="Submitted to completed" />
              <MetricTile title="Payment Rate" value={`${customerFunnel.metadata?.paymentRate || 0}%`} note="Quote approved to payment" />
              <MetricTile title="Repeat Customers" value={String(customerFunnel.repeatRequestCreated)} note="Users with repeat requests" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'partner' && (
        <div className="grid gap-4">
          {partnerPerformance.slice(0, 12).map((partner) => (
            <div key={partner.mechanicId} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">{partner.mechanicName}</h2>
                    {partner.isTrustedPartner && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Trusted</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{partner.city || 'Unknown city'} • Score {partner.score}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <MetricPill label="Accept" value={`${partner.acceptRate}%`} />
                  <MetricPill label="Complete" value={`${partner.completionRate}%`} />
                  <MetricPill label="Quote" value={`${partner.quoteApprovalRate}%`} />
                  <MetricPill label="ETA" value={partner.averageEtaMinutes != null ? `${partner.averageEtaMinutes}m` : 'N/A'} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'zones' && (
        <div className="grid gap-4 md:grid-cols-2">
          {zoneMetrics.slice(0, 12).map((zone) => (
            <div key={zone.zoneKey} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{zone.city || zone.zoneKey}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{zone.zoneKey}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{zone.requestCount} requests</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetricTile title="Assigned" value={String(zone.assignedCount)} note={`${zone.metadata?.assignmentRate || 0}% assignment`} compact />
                <MetricTile title="Completed" value={String(zone.completedCount)} note={`${zone.metadata?.completionRate || 0}% completion`} compact />
                <MetricTile title="No Supply" value={String(zone.noSupplyCount)} note={`${zone.metadata?.noSupplyRate || 0}% no-supply`} compact />
                <MetricTile title="Avg ETA" value={zone.averageEtaMinutes != null ? `${zone.averageEtaMinutes}m` : 'N/A'} note={`${zone.activeSupplyCount} active supply`} compact />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'financial' && financial && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Recorded Value" value={`₹${financial.recordedTransactionValue.toFixed(0)}`} icon={TrendingUp} />
            <MetricCard title="Platform Fee" value={`₹${financial.platformFeeRealization.toFixed(0)}`} icon={DollarSign} />
            <MetricCard title="Membership Revenue" value={`₹${financial.membershipRevenue.toFixed(0)}`} icon={BarChart3} />
            <MetricCard title="Repeat Share" value={`${financial.repeatCustomerShare}%`} icon={Users} />
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">City-wise Recorded Value</h2>
            <div className="mt-4 space-y-3">
              {financial.cityWiseValue.slice(0, 10).map((row) => (
                <div key={row.city} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <span className="text-sm font-semibold text-foreground">{row.city}</span>
                  <span className="text-sm font-bold text-foreground">₹{row.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scoring' && dispatchScoring && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Dispatch Rule Weights</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These weights drive explainable matching decisions instead of nearest-mechanic-only routing.
            </p>
            <div className="mt-5 grid gap-3">
              {Object.entries(rulesForm).map(([key, value]) => (
                <label key={key} className="grid gap-1">
                  <span className="text-sm font-medium text-foreground">{formatRuleLabel(key)}</span>
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(event) => setRulesForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
            <button
              onClick={saveRules}
              disabled={rulesSaving}
              className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              Save scoring rules
            </button>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Current Score Breakdown</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sample request: {dispatchScoring.sampleRequestId ? `#${dispatchScoring.sampleRequestId}` : 'No recent assigned request'} • Generated {new Date(dispatchScoring.generatedAt).toLocaleString('en-IN')}
            </p>
            <div className="mt-5 space-y-4">
              {dispatchScoring.scores.map((score) => (
                <div key={score.mechanicId} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{score.mechanicName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Mechanic #{score.mechanicId}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{score.score}</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {Object.entries(score.factors).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                        <span className="text-xs font-medium text-muted-foreground">{formatRuleLabel(label)}</span>
                        <span className="text-xs font-bold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-black text-foreground">{value}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MetricTile({ title, value, note, compact = false }: { title: string; value: string; note: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-background/70 ${compact ? 'px-4 py-3' : 'p-4'}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-lg font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function formatRuleLabel(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}
