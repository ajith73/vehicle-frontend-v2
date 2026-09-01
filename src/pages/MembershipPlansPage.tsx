import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Crown, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import type { CustomerMembershipStatus, SubscriptionPlan } from '../types';
import ErrorStateCard from '../components/common/ErrorStateCard';
import LoadingScreen from '../components/common/LoadingScreen';
import MetricCard from '../components/common/MetricCard';

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState<CustomerMembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isCustomer = typeof window !== 'undefined' && localStorage.getItem('role') === 'Customer';

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [plansData, statusData] = await Promise.all([
        apiClient<SubscriptionPlan[]>('/customer/membership/plans'),
        isCustomer ? apiClient<CustomerMembershipStatus>('/customer/membership/status') : Promise.resolve(null as unknown as CustomerMembershipStatus)
      ]);
      setPlans(plansData || []);
      setStatus(statusData);
    } catch (error: any) {
      const message = error.message || 'Failed to load membership plans';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeTier = useMemo(() => status?.profile?.subscriptionTier || status?.subscription?.subscriptionTier || null, [status]);
  const activePlanId = status?.subscription?.SubscriptionPlan?.id || null;

  const handleSubscribe = async (planId: number) => {
    if (!isCustomer) {
      toast.error('Please sign in as a customer first from the customer login screen.');
      return;
    }
    setSavingPlanId(planId);
    try {
      await apiClient('/customer/membership/subscribe', {
        method: 'POST',
        data: { subscriptionPlanId: planId }
      });
      toast.success('Membership activated');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate membership');
    } finally {
      setSavingPlanId(null);
    }
  };

  if (loading) return <LoadingScreen className="min-h-[60vh]" />;

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorStateCard title="Membership plans unavailable" description={loadError} onRetry={() => void loadData()} icon={Crown} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Membership</p>
            <h1 className="mt-3 text-3xl font-black text-foreground">Premium support and trusted roadside access</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Choose the RoadResQ plan that fits your breakdown frequency, support expectations, and trusted-partner preference.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <p className="font-bold text-foreground">Current status</p>
            <p className="mt-1 text-muted-foreground">
              {activeTier ? `Active tier: ${activeTier}${status?.profile?.subscriptionEndsAt ? ` until ${new Date(status.profile.subscriptionEndsAt).toLocaleDateString('en-IN')}` : ''}` : 'No active membership yet'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Trusted partner access" value={activeTier ? 'Enabled based on your plan' : 'Available with eligible plans'} />
          <MetricCard label="Priority support" value={status?.profile?.prioritySupportEligible ? 'Active' : 'Standard support lane'} />
          <MetricCard label="Renewal readiness" value={status?.subscription?.status || 'Not subscribed'} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = activeTier === plan.tier || activePlanId === plan.id;
          return (
            <div key={plan.id} className={`rounded-[2rem] border bg-card p-6 shadow-sm ${isCurrent ? 'border-primary shadow-[0_10px_30px_rgba(59,130,246,0.12)]' : 'border-border'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{plan.tier}</p>
                  <h2 className="mt-2 text-2xl font-black text-foreground">{plan.name}</h2>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                  {isCurrent ? <Star className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">{plan.description || 'Membership benefits for better support and trusted marketplace access.'}</p>
              <div className="mt-5 flex items-end gap-2">
                <p className="text-3xl font-black text-foreground">₹{plan.priceAmount.toFixed(0)}</p>
                <p className="pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{plan.billingCycle}</p>
              </div>

              <div className="mt-6 space-y-3 text-sm text-foreground">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Platform fee discount: {plan.platformFeeDiscountPercent}%</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{plan.prioritySupport ? 'Priority support included' : 'Standard support lane'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{plan.trustedOnlyAccess ? 'Trusted partner preference included' : 'Standard marketplace supply'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{plan.priorityDispatch ? 'Priority-ready dispatch eligibility' : 'Normal dispatch handling'}</span>
                </div>
              </div>

              <button onClick={() => void handleSubscribe(plan.id)} disabled={Boolean(savingPlanId) || isCurrent} className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold ${isCurrent ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:opacity-70`}>
                {savingPlanId === plan.id ? 'Activating...' : isCurrent ? 'Current plan' : 'Activate membership'}
              </button>
            </div>
          );
        })}
      </div>

      {!isCustomer ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          Membership activation requires a logged-in customer account. Use the customer login or request flow first, then return here.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-black text-foreground">What membership changes</h2>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>1. Better visibility into trusted supply when available in your area.</p>
            <p>2. Membership-aware pricing and support behavior in the current customer flow.</p>
            <p>3. Cleaner upgrade path when payment gateway and renewals become fully automated.</p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-black text-foreground">Related shortcuts</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/customer/trusted-partners" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Trusted partners</Link>
            <Link to="/list" className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">Mechanic discovery</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
