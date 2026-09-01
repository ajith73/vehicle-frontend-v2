import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Settings2, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import ErrorStateCard from '../../components/common/ErrorStateCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import MetricCard from '../../components/common/MetricCard';

type PublicService = { id: number; name: string; isFeatured?: boolean };
type MechanicProfile = { id: number; serviceTypes?: unknown[]; servicesAvailable?: string; serviceRadius?: number; status?: string };

const normalizeList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};

export default function PartnerServicesPage() {
  const [services, setServices] = useState<PublicService[]>([]);
  const [mechanic, setMechanic] = useState<MechanicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mechanicId = typeof window !== 'undefined' ? localStorage.getItem('mechanicId') : null;

  const loadData = async () => {
    if (!mechanicId) {
      setLoading(false);
      setLoadError('No partner profile is linked to this account yet.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [serviceData, mechanicData] = await Promise.all([
        apiClient<PublicService[]>('/public/services'),
        apiClient<MechanicProfile>(`/public/mechanics/${mechanicId}`)
      ]);
      setServices(serviceData || []);
      setMechanic(mechanicData);
    } catch (error: any) {
      const message = error.message || 'Failed to load partner services';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [mechanicId]);

  const enabledServiceNames = useMemo(() => {
    const fromTypes = normalizeList(mechanic?.serviceTypes);
    const fromAvailable = normalizeList(mechanic?.servicesAvailable);
    return new Set([...fromTypes, ...fromAvailable].map((item) => item.toLowerCase()));
  }, [mechanic]);

  const mappedServices = useMemo(() => services.map((service) => ({ ...service, enabled: enabledServiceNames.has(service.name.toLowerCase()) })), [enabledServiceNames, services]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <Link to="/partner/account" className="rounded-full p-2 transition-colors hover:bg-secondary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-black text-foreground">My Services</h1>
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-24 sm:max-w-4xl sm:p-6">
        {loadError ? (
          <ErrorStateCard
            title="Service list unavailable"
            description={loadError}
            onRetry={() => void loadData()}
            icon={Wrench}
            secondaryAction={<Link to="/partner/account" className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">Back to account</Link>}
          />
        ) : (
          <>
            <div className="mb-6 rounded-[2rem] border border-primary/20 bg-primary/5 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Verified service list</p>
                  <p className="mt-1 text-sm text-muted-foreground">This screen reflects your current partner profile and the available RoadResQ service catalog. Service editing still continues through the existing profile/update flow.</p>
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Active services" value={<span className="text-2xl font-black">{mappedServices.filter((service) => service.enabled).length}</span>} />
              <MetricCard label="Service radius" value={mechanic?.serviceRadius ? `${mechanic.serviceRadius} km` : 'Not configured'} />
              <MetricCard label="Profile status" value={mechanic?.status || 'Unknown'} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {mappedServices.map((service) => (
                <div key={service.id} className={`rounded-[2rem] border p-5 shadow-sm ${service.enabled ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${service.enabled ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">{service.name}</h3>
                        <p className={`mt-1 text-xs font-bold uppercase tracking-[0.16em] ${service.enabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>{service.enabled ? 'Active on your profile' : 'Not enabled yet'}</p>
                      </div>
                    </div>
                    {service.isFeatured ? <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">Featured</span> : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link to="/mechanic-dashboard" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                <Settings2 className="h-4 w-4" />
                Manage through existing profile flow
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
