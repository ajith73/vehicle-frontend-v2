import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, ExternalLink, FileBadge2, Landmark, LifeBuoy, Loader2, LogOut, Moon, RefreshCw, Settings2, ShieldCheck, Sun, User, Wrench } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { Mechanic } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

export default function PartnerAccountPage() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const mechanicId = typeof window !== 'undefined' ? localStorage.getItem('mechanicId') : null;
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isSetupMode = searchParams.get('setup') === '1';
  const isClaimMode = searchParams.get('claim') === '1';
  const isNewBusinessMode = searchParams.get('newBusiness') === '1';

  const load = async () => {
    if (!mechanicId) {
      setLoading(false);
      setMechanic(null);
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient<Mechanic>(`/public/mechanics/${mechanicId}`);
      setMechanic(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load partner account');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [mechanicId]);

  const displayName = mechanic?.businessName || mechanic?.name || 'Partner';
  const initials = useMemo(
    () => displayName.split(' ').map((part) => part[0]).join('').substring(0, 2).toUpperCase(),
    [displayName]
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('mechanicId');
    localStorage.removeItem('role');
    window.location.href = '/partner/login';
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Enter current and new password');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient('/auth/password', {
        method: 'PUT',
        data: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }
      });
      setPasswordForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <h1 className="text-xl font-black text-foreground">Account</h1>
        <button onClick={() => void load()} className="rounded-full border border-border bg-card p-2 text-foreground">
          <RefreshCw className="h-4 w-4 text-primary" />
        </button>
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-32 sm:max-w-4xl sm:p-6">
        {isSetupMode ? (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
            <p className="text-sm font-bold text-foreground">
              {isClaimMode ? 'Partner account created. Continue your business verification and profile updates.' : 'Partner account created. Next, add your business profile and complete setup.'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {isClaimMode
                ? 'Use the verification, documents, and support sections below to continue.'
                : 'Start by creating your business profile, then continue to verification and documents.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {mechanicId ? (
                <>
                  <Link to="/partner/verification" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Open verification</Link>
                  <Link to="/partner/documents" className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground">Review documents</Link>
                </>
              ) : isNewBusinessMode ? (
                <Link to="/submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Create business profile</Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-black text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-foreground">{displayName}</h2>
                {(mechanic?.verificationLevel || 0) > 0 ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">Partner ID: {mechanicId ? `P-${mechanicId}` : 'Not linked'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  {mechanic?.verificationLevel ? `Verified L${mechanic.verificationLevel}` : 'Verification pending'}
                </span>
                {mechanic?.isTrustedPartner ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Trusted partner</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Availability</p>
              <p className="mt-2 text-sm font-bold text-foreground">{mechanic?.availabilityState || (mechanic?.isOnline ? 'ONLINE' : 'OFFLINE') || 'Unknown'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Service area</p>
              <p className="mt-2 text-sm font-bold text-foreground">{[mechanic?.area, mechanic?.city].filter(Boolean).join(', ') || 'Not configured'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Last active</p>
              <p className="mt-2 text-sm font-bold text-foreground">{mechanic?.lastActiveAt ? new Date(mechanic.lastActiveAt).toLocaleString('en-IN') : 'No recent activity'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            {[
              { href: '/partner/services', icon: Wrench, title: 'My Services', subtitle: 'Current service catalog' },
              { href: '/partner/availability', icon: Settings2, title: 'Availability & Area', subtitle: 'Live status and service radius' },
              { href: '/partner/verification', icon: ShieldCheck, title: 'Verification', subtitle: 'Status and next actions' },
              { href: '/partner/documents', icon: FileBadge2, title: 'Documents', subtitle: 'Uploaded proofs and checklist' },
              { href: '/partner/settlements', icon: Landmark, title: 'Bank & Settlements', subtitle: 'Payout history and bank refs' }
            ].map((item, index) => (
              <Link key={item.href} to={item.href} className={`flex items-center justify-between p-4 transition-colors hover:bg-secondary/50 ${index < 4 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    <item.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <span className="block font-bold text-foreground">{item.title}</span>
                    <span className="text-[11px] text-muted-foreground">{item.subtitle}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              {mechanicId ? (
                <>
                  <Link to={`/mechanic-dashboard/${mechanicId}`} className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                        <Settings2 className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <span className="block font-bold text-foreground">Legacy Profile</span>
                        <span className="text-[11px] text-muted-foreground">Business detail management</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link to={`/mechanic/${mechanicId}`} className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                        <User className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <span className="block font-bold text-foreground">View Public Profile</span>
                        <span className="text-[11px] text-muted-foreground">What customers see</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  No business profile is linked yet. Create your business profile to unlock verification, public profile, and management tools.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <button type="button" onClick={toggleTheme} className="flex w-full items-center justify-between border-b border-border p-4 transition-colors hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    {theme === 'light' ? <Moon className="h-4 w-4 text-foreground" /> : <Sun className="h-4 w-4 text-foreground" />}
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-foreground">Theme</span>
                    <span className="text-[11px] text-muted-foreground">{theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary">{theme === 'light' ? 'Light' : 'Dark'}</span>
              </button>
              <Link to="/partner/notifications" className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    <Bell className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="font-bold text-foreground">Notifications</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link to="/partner/support" className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    <LifeBuoy className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="font-bold text-foreground">Help & Support</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-lg font-black text-foreground">Security</h3>
          <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground">Current password</label>
              <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none" placeholder="Enter current password" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground">New password</label>
              <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none" placeholder="Enter new password" />
            </div>
            <button type="submit" disabled={savingPassword} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-70">
              {savingPassword ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        </div>

        <button onClick={handleLogout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary p-4 font-bold text-secondary-foreground transition-colors hover:bg-secondary/80">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </main>
    </div>
  );
}
