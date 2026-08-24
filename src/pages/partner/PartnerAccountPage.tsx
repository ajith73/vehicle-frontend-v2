import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Settings2, User, ShieldCheck, MapPin, Bell, LifeBuoy, LogOut, ExternalLink, Wrench, FileBadge2, Landmark, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { Mechanic } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

export default function PartnerAccountPage() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      const mechanicId = localStorage.getItem('mechanicId');
      if (!mechanicId) return;
      try {
        const data = await apiClient<Mechanic>(`/public/mechanics/${mechanicId}`);
        setMechanic(data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load partner account');
      }
    };
    load();
  }, []);

  const mechanicId = mechanic?.id || localStorage.getItem('mechanicId');
  const displayName = mechanic?.businessName || mechanic?.name || 'Partner';
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isSetupMode = searchParams.get('setup') === '1';
  const isClaimMode = searchParams.get('claim') === '1';
  const isNewBusinessMode = searchParams.get('newBusiness') === '1';

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

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-xl font-black text-foreground">Account</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        {isSetupMode ? (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
            <p className="text-sm font-bold text-foreground">
              {isClaimMode ? 'Partner account created. Continue your business verification and profile updates.' : 'Partner account created. Next, add your business profile and complete setup.'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {isClaimMode
                ? 'Your partner menus are ready. Use the profile, verification, documents, and support sections below to continue.'
                : 'Your partner menus are ready. Start by creating your business profile, then continue to verification and documents.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {mechanicId ? (
                <>
                  <Link to="/partner/verification" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
                    Open verification
                  </Link>
                  <Link to="/partner/documents" className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground">
                    Review documents
                  </Link>
                </>
              ) : isNewBusinessMode ? (
                <Link to="/submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
                  Create business profile
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden shrink-0">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              {displayName}
              {(mechanic?.verificationLevel || 0) > 0 && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground mt-0.5">Partner ID: {mechanicId ? `P-${mechanicId}` : 'Not linked'}</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded uppercase tracking-wider">
                {mechanic?.verificationLevel ? `Verified L${mechanic.verificationLevel}` : 'Verification pending'}
              </span>
              {mechanic?.isTrustedPartner ? (
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded uppercase tracking-wider">
                  Trusted partner
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-6">
          <Link to="/partner/services" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold">My Services</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link to="/partner/availability" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
              <span className="font-bold">Availability & Area</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Verification & Documents</h3>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-6">
          <Link to="/partner/verification" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <span className="font-bold block">Verification</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status and next actions</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link to="/partner/documents" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <FileBadge2 className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <span className="font-bold block">Documents</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Uploaded proofs and checklist</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link to="/partner/settlements" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Landmark className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <span className="font-bold block">Bank & Settlements</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Payout history and bank refs</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Profile Access</h3>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-6">
          {mechanicId ? (
            <>
              <Link to={`/mechanic-dashboard/${mechanicId}`} className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <span className="font-bold block">Legacy Profile</span>
                    <span className="text-[10px] text-muted-foreground">Business detail management</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link to={`/mechanic/${mechanicId}`} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="font-bold">View Public Profile</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Link>
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              No business profile is linked yet. Create your business profile to unlock verification, public profile, and management tools.
            </div>
          )}
        </div>

        {!mechanicId ? (
          <div className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Business setup</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your workshop or roadside service business details so RoadResQ can connect your partner account to a profile.
            </p>
            <Link to="/submit" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
              Open profile update screen
            </Link>
          </div>
        ) : null}

        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">App Settings</h3>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                {theme === 'light' ? <Moon className="w-4 h-4 text-foreground" /> : <Sun className="w-4 h-4 text-foreground" />}
              </div>
              <div className="text-left">
                <span className="font-bold block">Theme</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-primary">
              {theme === 'light' ? 'Light' : 'Dark'}
            </span>
          </button>

          <Link to="/partner/notifications" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Bell className="w-4 h-4 text-foreground" />
              </div>
              <span className="font-bold">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link to="/partner/support" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <LifeBuoy className="w-4 h-4 text-foreground" />
              </div>
              <span className="font-bold">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Security</h3>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm mb-8">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground">Current password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground">New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                placeholder="Enter new password"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-70"
            >
              {savingPassword ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-xl font-bold hover:bg-secondary/80 transition-colors mb-4">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </main>
    </div>
  );
}
