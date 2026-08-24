import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Briefcase, Clock, DollarSign, TrendingUp, User, Power, Moon, Sun, Loader2, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';

const PARTNER_LIVE_STATE_EVENT = 'roadresq:partner-live-state-changed';

export default function PartnerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileResolved, setProfileResolved] = useState(false);
  const storedMechanicId = localStorage.getItem('mechanicId');
  const pendingVerificationStatus = String(profile?.pendingVerification?.status || '').toLowerCase();
  const isPartnerApproved =
    profile?.status === 'Approved' &&
    Number(profile?.verificationLevel || 0) >= 1 &&
    pendingVerificationStatus !== 'pending' &&
    pendingVerificationStatus !== 'rejected';

  const loadPartnerShell = async () => {
    const mechanicId = localStorage.getItem('mechanicId');
    if (!mechanicId) {
      setProfile(null);
      setIsOnline(false);
      setProfileResolved(true);
      return;
    }

    try {
      const data = await apiClient<any>(`/public/mechanics/${mechanicId}`);
      setProfile(data);
      setIsOnline(Boolean(data?.MechanicLiveState?.isOnline ?? data?.isOnline));
    } catch {
      setProfile(null);
    } finally {
      setProfileResolved(true);
    }
  };

  useEffect(() => {
    void loadPartnerShell();
  }, []);

  useEffect(() => {
    const handleStateSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOnline?: boolean }>;
      if (typeof customEvent.detail?.isOnline === 'boolean') {
        setIsOnline(customEvent.detail.isOnline);
      } else {
        void loadPartnerShell();
      }
    };

    window.addEventListener(PARTNER_LIVE_STATE_EVENT, handleStateSync as EventListener);
    window.addEventListener('storage', handleStateSync as EventListener);

    return () => {
      window.removeEventListener(PARTNER_LIVE_STATE_EVENT, handleStateSync as EventListener);
      window.removeEventListener('storage', handleStateSync as EventListener);
    };
  }, []);

  const isLegacyPartnerFlow =
    location.pathname.startsWith('/mechanic-dashboard/') ||
    location.pathname.startsWith('/verify-flow/');

  useEffect(() => {
    if (!profileResolved || isLegacyPartnerFlow) return;
    const fallbackMechanicId = profile?.id || storedMechanicId;
    if (fallbackMechanicId && !isPartnerApproved) {
      navigate(`/mechanic-dashboard/${fallbackMechanicId}`, { replace: true });
    }
  }, [profileResolved, profile?.id, storedMechanicId, isPartnerApproved, isLegacyPartnerFlow, navigate]);

  const navItems = [
    { label: 'Home', href: '/partner', icon: Briefcase, activePath: '/partner' },
    { label: 'Requests', href: '/partner/requests', icon: Clock, activePath: '/partner/requests' },
    { label: 'Earnings', href: '/partner/earnings', icon: DollarSign, activePath: '/partner/earnings' },
    { label: 'Performance', href: '/partner/performance', icon: TrendingUp, activePath: '/partner/performance' },
    { label: 'Account', href: '/partner/account', icon: User, activePath: '/partner/account' },
  ];

  const isActive = (path: string) => {
    if (path === '/partner') {
      return location.pathname === '/partner' || location.pathname.startsWith('/partner/request/');
    }
    return location.pathname.startsWith(path);
  };

  const displayName = profile?.businessName || profile?.name || 'Partner';
  const partnerId = profile?.id || localStorage.getItem('mechanicId');
  const avatarName = encodeURIComponent(displayName);

  const handleToggleOnline = async () => {
    setLoadingState(true);
    try {
      if (isOnline) {
        await apiClient('/mechanic/live/go-offline', {
          method: 'POST',
          data: { notes: 'Changed from partner shell' }
        });
        setIsOnline(false);
        toast.success('You are now offline');
        window.dispatchEvent(new CustomEvent(PARTNER_LIVE_STATE_EVENT, { detail: { isOnline: false } }));
      } else {
        await apiClient('/mechanic/live/go-online', {
          method: 'POST',
          data: { availabilityState: 'ONLINE_IDLE' }
        });
        setIsOnline(true);
        toast.success('You are now online');
        window.dispatchEvent(new CustomEvent(PARTNER_LIVE_STATE_EVENT, { detail: { isOnline: true } }));
      }
      await loadPartnerShell();
    } catch (error: any) {
      toast.error(error.message || 'Failed to change online status');
    } finally {
      setLoadingState(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('mechanicId');
    localStorage.removeItem('role');
    window.location.href = '/partner/login';
  };

  if (isLegacyPartnerFlow) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    );
  }

  if (!profileResolved) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Checking partner access...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground selection:bg-primary/20">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 p-4 border-b border-border bg-background/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
               <img src={`https://ui-avatars.com/api/?name=${avatarName}&background=random`} alt={displayName} className="w-full h-full object-cover" />
             </div>
             <div className="hidden lg:block">
               <h1 className="text-sm font-black text-foreground">Welcome back, {displayName}</h1>
               <p className="text-xs font-semibold text-muted-foreground mt-0.5">Partner ID: {partnerId ? `P-${partnerId}` : 'Not linked'}</p>
             </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-6">
            {navItems.map((item) => {
              const active = isActive(item.activePath);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-3">
            {/* ONLINE / OFFLINE Toggle */}
            <button 
              onClick={handleToggleOnline}
              disabled={loadingState}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all font-bold text-xs ${
                isOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-secondary border-border text-muted-foreground'
              }`}
            >
               {loadingState ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-500' : 'text-muted-foreground'}`} />}
               {loadingState ? 'UPDATING' : isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>

            <button
              onClick={toggleTheme}
              className="hidden sm:inline-flex p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogout}
              className="hidden md:inline-flex p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10 -z-10" />
        <div className="h-full overflow-y-auto pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center h-[70px]">
          {navItems.map((item) => {
            const active = isActive(item.activePath);
            return (
              <Link 
                key={item.label} 
                to={item.href} 
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className={`p-1.5 rounded-full transition-colors ${active ? 'bg-primary/10' : ''}`}>
                  <item.icon className={`w-5 h-5 ${active ? 'fill-primary/20' : ''}`} />
                </div>
                <span className={`text-[10px] font-bold ${active ? 'text-primary' : ''}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  );
}
