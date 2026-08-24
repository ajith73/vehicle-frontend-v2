import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Loader2, MapPin, Phone, ShieldCheck, Sparkles, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { CustomerMembershipStatus, Mechanic } from '../../types';

export default function CustomerTrustedPartnersPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [membership, setMembership] = useState<CustomerMembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [trustedPartners, membershipStatus] = await Promise.all([
          apiClient<Mechanic[]>('/public/mechanics?trustedOnly=true&sort=Available&limit=24'),
          apiClient<CustomerMembershipStatus>('/customer/membership/status').catch(() => null as unknown as CustomerMembershipStatus),
        ]);
        setMechanics(trustedPartners);
        setMembership(membershipStatus);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load trusted partners');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const activeTier = useMemo(
    () => membership?.profile?.subscriptionTier || membership?.subscription?.subscriptionTier || null,
    [membership]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-24">
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Trusted Partners</p>
            <h1 className="mt-2 text-3xl font-black text-foreground">Verified supply for faster, safer roadside help</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              This queue is for RoadResQ partners with trust scoring, verified business records, and stronger dispatch preference.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <p className="font-bold text-foreground">Membership</p>
            <p className="mt-1 text-muted-foreground">{activeTier ? `Active: ${activeTier}` : 'No active membership yet'}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider">
          <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-emerald-700">Verified identity</span>
          <span className="rounded-full bg-blue-500/10 px-3 py-2 text-blue-700">Priority dispatch fit</span>
          <span className="rounded-full bg-amber-500/10 px-3 py-2 text-amber-700">Trusted marketplace supply</span>
        </div>
      </section>

      {mechanics.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm">
          Trusted partners are not available in this area yet. You can still use the normal discovery flow from <Link to="/list" className="font-bold text-primary hover:underline">mechanic discovery</Link>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mechanics.map((mechanic) => {
            const phoneValue = Array.isArray(mechanic.phone) ? mechanic.phone[0]?.number : mechanic.phone;
            const partnerName = mechanic.businessName || mechanic.name || 'Trusted Partner';
            return (
              <article key={mechanic.id} className="rounded-[2rem] border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-foreground">{partnerName}</h2>
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{mechanic.mechanicType || 'Roadside assistance partner'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Trusted
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{[mechanic.area, mechanic.city, mechanic.state].filter(Boolean).join(', ') || 'Location available on profile'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    <span>{mechanic.partnerTier || 'Verified partner tier'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Trust score {Math.round(Number(mechanic.trustScore || 0))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{mechanic.currentStatus || mechanic.availabilityState || 'Available status shown on live dispatch'}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(mechanic.serviceTypes || []).slice(0, 3).map((service) => (
                    <span key={`${mechanic.id}-${service}`} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                      {String(service)}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex gap-3">
                  <Link to={`/mechanic/${mechanic.id}`} className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:border-primary/40">
                    View profile
                  </Link>
                  {phoneValue ? (
                    <a href={`tel:${phoneValue}`} className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                      <Phone className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/customer/membership" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          Manage membership
        </Link>
        <Link to="/list?trustedOnly=true" className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:border-primary/40">
          Open trusted discovery
        </Link>
      </div>
    </div>
  );
}
