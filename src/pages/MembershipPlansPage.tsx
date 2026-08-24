import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import type { CustomerMembershipStatus, SubscriptionPlan } from '../types';

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState<CustomerMembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCustomer = typeof window !== 'undefined' && localStorage.getItem('role') === 'Customer';

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, statusData] = await Promise.all([
        apiClient<SubscriptionPlan[]>('/customer/membership/plans'),
        isCustomer
          ? apiClient<CustomerMembershipStatus>('/customer/membership/status')
          : Promise.resolve(null as unknown as CustomerMembershipStatus)
      ]);
      setPlans(plansData);
      setStatus(statusData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeTier = useMemo(() => status?.profile?.subscriptionTier || status?.subscription?.subscriptionTier || null, [status]);

  const handleSubscribe = async (planId: number) => {
    if (!isCustomer) {
      toast.error('Please sign in as a customer first from the request flow.');
      return;
    }
    setSaving(true);
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
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">Loading membership plans...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Membership</p>
        <h1 className="mt-3 text-3xl font-black text-foreground">Premium support and trusted supply access</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Phase 5 adds member benefits like trusted-partner preference, backend-driven premium status, and priority-ready marketplace rules while keeping the existing RoadResQ experience intact.
        </p>

        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-bold text-foreground">Current status</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeTier
              ? `Active tier: ${activeTier}${status?.profile?.subscriptionEndsAt ? ` until ${new Date(status.profile.subscriptionEndsAt).toLocaleDateString('en-IN')}` : ''}`
              : 'No active membership yet.'}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{plan.tier}</p>
                <h2 className="mt-2 text-2xl font-black text-foreground">{plan.name}</h2>
              </div>
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{plan.description || 'Membership benefits for better support and trusted marketplace access.'}</p>
            <p className="mt-5 text-3xl font-black text-foreground">₹{plan.priceAmount.toFixed(0)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{plan.billingCycle}</p>

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
                <span>{plan.trustedOnlyAccess ? 'Trusted partner preference included' : 'Trusted partner access not included'}</span>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {activeTier === plan.tier ? 'Current plan' : 'Activate membership'}
            </button>
          </div>
        ))}
      </div>

      {!isCustomer && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          Membership activation currently uses your customer login from the request flow. Start from the request-help journey first, then return here if you want to enable a plan.
        </div>
      )}

      <div className="mt-8">
        <Link to="/list" className="text-sm font-bold text-primary hover:underline">Back to mechanic discovery</Link>
      </div>
    </div>
  );
}
