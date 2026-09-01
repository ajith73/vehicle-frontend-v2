import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Power, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import AvailabilityOptionCard from '../../components/common/AvailabilityOptionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import MetricCard from '../../components/common/MetricCard';

type Status = 'ONLINE_IDLE' | 'ONLINE_BUSY' | 'OFFLINE';
type MechanicProfile = { id: number; isOnline?: boolean; availabilityState?: string; serviceRadius?: number; area?: string; city?: string; state?: string; lastActiveAt?: string; latitude?: number; longitude?: number };

export default function PartnerAvailabilityPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('OFFLINE');
  const [mechanic, setMechanic] = useState<MechanicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const mechanicId = typeof window !== 'undefined' ? localStorage.getItem('mechanicId') : null;

  const syncStatusFromMechanic = (record: MechanicProfile | null) => {
    if (!record || !record.isOnline || record.availabilityState === 'OFFLINE') {
      setStatus('OFFLINE');
      return;
    }
    setStatus(record.availabilityState === 'ONLINE_BUSY' ? 'ONLINE_BUSY' : 'ONLINE_IDLE');
  };

  const loadProfile = async () => {
    if (!mechanicId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient<MechanicProfile>(`/public/mechanics/${mechanicId}`);
      setMechanic(data);
      syncStatusFromMechanic(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [mechanicId]);

  const updateStatus = async (newStatus: Status) => {
    setSaving(true);
    try {
      if (newStatus === 'OFFLINE') {
        await apiClient('/mechanic/live/go-offline', { method: 'POST', data: { notes: 'Changed from availability screen' } });
      } else {
        const getCoords = () => new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
          if (!navigator.geolocation) {
            resolve({ latitude: mechanic?.latitude, longitude: mechanic?.longitude });
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            () => resolve({ latitude: mechanic?.latitude, longitude: mechanic?.longitude }),
            { enableHighAccuracy: true, timeout: 6000 }
          );
        });

        const coords = await getCoords();
        await apiClient('/mechanic/live/go-online', { method: 'POST', data: { availabilityState: newStatus, latitude: coords.latitude, longitude: coords.longitude } });
      }

      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      await loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const statusContent = useMemo(() => {
    if (status === 'ONLINE_IDLE') return { title: 'You are online', subtitle: 'Receiving new service requests.', classes: 'bg-emerald-500/10 border-emerald-500 text-emerald-500' };
    if (status === 'ONLINE_BUSY') return { title: 'You are busy', subtitle: 'Visible as unavailable for fresh dispatch while active or paused.', classes: 'bg-amber-500/10 border-amber-500 text-amber-500' };
    return { title: 'You are offline', subtitle: 'Not receiving any new requests.', classes: 'bg-secondary border-muted text-muted-foreground' };
  }, [status]);

  if (loading) return <LoadingScreen />;

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <button onClick={() => navigate('/partner/account')} className="rounded-full p-2 transition-colors hover:bg-secondary">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-xl font-black text-foreground">Availability</h1>
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-24 sm:max-w-4xl sm:p-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6 rounded-[2rem] border border-border bg-card p-6 text-center shadow-sm">
          <motion.div animate={{ scale: status === 'ONLINE_IDLE' ? [1, 1.06, 1] : 1 }} transition={{ duration: 2, repeat: status === 'ONLINE_IDLE' ? Infinity : 0 }} className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-lg ${statusContent.classes}`}>
            <Power className="h-10 w-10" />
          </motion.div>
          <h2 className="text-2xl font-black text-foreground">{statusContent.title}</h2>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{statusContent.subtitle}</p>
        </motion.div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Service area" value={[mechanic?.area, mechanic?.city, mechanic?.state].filter(Boolean).join(', ') || 'Not configured'} />
          <MetricCard label="Service radius" value={mechanic?.serviceRadius ? `${mechanic.serviceRadius} km` : 'Not configured'} />
          <MetricCard label="Last active" value={mechanic?.lastActiveAt ? new Date(mechanic.lastActiveAt).toLocaleString('en-IN') : 'No recent activity'} />
        </div>

        <h3 className="mb-3 px-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Change Status</h3>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8 flex flex-col gap-3">
          {[
            ['ONLINE_IDLE', 'Online', 'Receive new requests normally', 'bg-emerald-500'],
            ['ONLINE_BUSY', 'Busy', 'Stay online but unavailable for new jobs', 'bg-amber-500'],
            ['OFFLINE', 'Offline', 'Stop receiving new requests', 'bg-muted-foreground']
          ].map(([value, label, description, dotClass]) => (
            <AvailabilityOptionCard key={String(value)} label={String(label)} description={String(description)} colorClass={String(dotClass)} active={status === value} disabled={saving} onClick={() => void updateStatus(value as Status)} />
          ))}
        </motion.div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-foreground">Area and live readiness</h3>
              <p className="mt-2 text-sm text-muted-foreground">Live location is captured when you go online from this screen. For deeper area and profile setup, continue through your account profile flow.</p>
            </div>
            <button onClick={() => void loadProfile()} className="rounded-full border border-border bg-background p-2 text-foreground" aria-label="Refresh availability">
              <RefreshCw className="h-4 w-4 text-primary" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/partner/account" className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">Back to account</Link>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
