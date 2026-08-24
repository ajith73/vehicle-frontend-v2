import { useEffect, useState } from 'react';
import { MapPin, Radar, TimerReset, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { ZoneConfigRecord } from '../../types';

export default function AdminZones() {
  const [zones, setZones] = useState<ZoneConfigRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient<ZoneConfigRecord[]>('/admin/zones');
        setZones(data || []);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load zones');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Zones</h1>
        <p className="text-muted-foreground">Dedicated zone-level launch, ETA, and response configuration overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric title="Total zones" value={String(zones.length)} icon={MapPin} />
        <Metric title="Rapid response" value={String(zones.filter((zone) => zone.rapidResponseEnabled).length)} icon={Zap} />
        <Metric title="Paused zones" value={String(zones.filter((zone) => zone.launchState === 'PAUSED').length)} icon={TimerReset} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading zones...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {zones.map((zone) => (
            <motion.div key={zone.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{zone.zoneName}</h2>
                  <p className="text-sm text-muted-foreground">{zone.cityName} • {zone.slug}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{zone.launchState}</span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Info label="ETA expectation" value={zone.etaExpectationMinutes != null ? `${zone.etaExpectationMinutes} min` : 'Not set'} />
                <Info label="Standby supply" value={zone.standbySupplyTarget != null ? String(zone.standbySupplyTarget) : 'Not set'} />
                <Info label="Pricing multiplier" value={zone.pricingMultiplier != null ? String(zone.pricingMultiplier) : 'Default'} />
                <Info label="Availability mode" value={zone.serviceAvailabilityMode || 'Default'} />
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <Radar className="w-4 h-4 text-primary" />
                <span className={zone.rapidResponseEnabled ? 'font-bold text-emerald-600' : 'text-muted-foreground'}>
                  {zone.rapidResponseEnabled ? 'Rapid response enabled' : 'Rapid response not enabled'}
                </span>
              </div>
            </motion.div>
          ))}

          {zones.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
              No zones configured yet. Use the existing city controls to create the first zone.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
