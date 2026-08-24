import { useEffect, useMemo, useState } from 'react';
import { BadgePercent, CarFront, MapPinned, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { CityConfigRecord, RegionalPricingRuleRecord } from '../../types';

export default function AdminPricing() {
  const [cities, setCities] = useState<CityConfigRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient<CityConfigRecord[]>('/admin/cities');
        setCities(data || []);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load pricing configuration');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pricingRules = useMemo(
    () => cities.flatMap((city) => city.pricingRules || []),
    [cities]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Pricing</h1>
        <p className="text-muted-foreground">Configuration-driven regional pricing visibility for city, zone, and service rules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PricingMetric title="Cities" value={String(cities.length)} icon={MapPinned} />
        <PricingMetric title="Pricing rules" value={String(pricingRules.length)} icon={Wallet} />
        <PricingMetric title="Zone-linked rules" value={String(pricingRules.filter((rule) => rule.zoneSlug || rule.zoneConfigId).length)} icon={CarFront} />
        <PricingMetric title="Discount rules" value={String(pricingRules.filter((rule) => Number(rule.memberDiscountPercent || 0) > 0).length)} icon={BadgePercent} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading pricing rules...</div>
      ) : (
        <div className="space-y-6">
          {cities.map((city) => (
            <section key={city.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{city.cityName}</h2>
                  <p className="text-sm text-muted-foreground">{city.slug} • {city.launchState}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {(city.pricingRules || []).length} rules
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {(city.pricingRules || []).length === 0 ? (
                  <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                    No regional pricing rules configured for this city yet.
                  </div>
                ) : (
                  (city.pricingRules || []).map((rule) => <PricingRuleCard key={rule.id} rule={rule} />)
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function PricingMetric({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
    </div>
  );
}

function PricingRuleCard({ rule }: { rule: RegionalPricingRuleRecord }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-foreground">{rule.ruleName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {rule.ServiceType?.name || 'All services'} • {rule.pricingMode}
            {rule.zoneSlug ? ` • Zone ${rule.zoneSlug}` : ''}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
          {rule.multiplier != null ? `x${rule.multiplier}` : rule.flatFee != null ? `₹${rule.flatFee}` : 'Configured'}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Cell label="Multiplier" value={rule.multiplier != null ? String(rule.multiplier) : 'N/A'} />
        <Cell label="Flat fee" value={rule.flatFee != null ? `₹${rule.flatFee}` : 'N/A'} />
        <Cell label="Tax %" value={rule.taxPercent != null ? String(rule.taxPercent) : 'N/A'} />
        <Cell label="Member discount" value={rule.memberDiscountPercent != null ? `${rule.memberDiscountPercent}%` : 'N/A'} />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}
