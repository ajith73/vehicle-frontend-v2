import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Wrench, Map as MapIcon, List, AlertTriangle, MessageSquare, Sun, Moon, User, ShieldCheck, Settings, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('role') === 'Customer' && !!localStorage.getItem('token'));
  }, [location.pathname]);

  const handleProtectedAction = (e: React.MouseEvent, path: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      toast('Please login or register to access this feature', {
        icon: '🔒',
        duration: 3000,
      });
      navigate('/customer/login');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/20 pb-[72px] sm:pb-0">
      <header className="hidden sm:block sticky top-0 z-50 p-4 border-b border-border bg-background/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <Link to="/customer" className="flex items-center gap-2 text-xl font-black hover:scale-105 transition-transform">
            <Wrench className="w-6 h-6 text-primary" />
            <div className="tracking-tight">
              <span className="text-foreground">Road</span>
              <span className="text-primary">Res</span>
              <span className="text-blue-500">Q</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground ml-2 border-l border-border pl-2">Customer</span>
          </Link>
          <div className="flex gap-2 sm:gap-6 items-center">
            <Link to="/customer" className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${location.pathname === '/customer' ? 'text-primary font-bold' : 'font-medium text-foreground/80 hover:text-primary'}`}>
              <MapIcon className="w-4 h-4" /> Home
            </Link>
            <Link to="/map" className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${location.pathname === '/map' ? 'text-primary font-bold' : 'font-medium text-foreground/80 hover:text-primary'}`}>
              <MapPin className="w-4 h-4" /> Map
            </Link>
            <Link to="/list" className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${location.pathname === '/list' ? 'text-primary font-bold' : 'font-medium text-foreground/80 hover:text-primary'}`}>
              <List className="w-4 h-4" /> List
            </Link>
            
            {/* Protected Routes */}
            <Link onClick={(e) => handleProtectedAction(e, '/customer/requests')} to="/customer/requests" className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${location.pathname.includes('/customer/requests') ? 'text-primary font-bold' : 'font-medium text-foreground/80 hover:text-primary'}`}>
              <AlertTriangle className="w-4 h-4" /> Requests
            </Link>
            <Link onClick={(e) => handleProtectedAction(e, '/customer/support')} to="/customer/support" className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${location.pathname === '/customer/support' ? 'text-primary font-bold' : 'font-medium text-foreground/80 hover:text-primary'}`}>
              <MessageSquare className="w-4 h-4" /> Support
            </Link>
            <Link onClick={(e) => handleProtectedAction(e, '/customer/trusted-partners')} to="/customer/trusted-partners" className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${location.pathname === '/customer/trusted-partners' ? 'text-primary font-bold' : 'font-medium text-foreground/80 hover:text-primary'}`}>
              <ShieldCheck className="w-4 h-4" /> Trusted
            </Link>
            <Link onClick={(e) => handleProtectedAction(e, '/customer/settings')} to="/customer/settings" className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${location.pathname === '/customer/settings' ? 'text-primary font-bold' : 'font-medium text-foreground/80 hover:text-primary'}`}>
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <Link onClick={(e) => handleProtectedAction(e, '/customer/profile')} to="/customer/profile" className={`hidden sm:flex items-center gap-1 text-sm transition-colors ${location.pathname === '/customer/profile' ? 'text-primary font-bold' : 'font-medium text-foreground/80 hover:text-primary'}`}>
              <User className="w-4 h-4" /> Profile
            </Link>

            {!isLoggedIn && (
              <Link to="/customer/login" className="hidden sm:flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 border border-primary px-3 py-1.5 rounded-full transition-colors">
                Login / Register
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10 -z-10" />
        <Outlet />
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center h-[72px]">
          <Link to="/customer" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/customer' ? 'text-primary' : 'text-muted-foreground'}`}>
            <MapIcon className={`w-6 h-6 ${location.pathname === '/customer' ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link to="/map" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/map' ? 'text-primary' : 'text-muted-foreground'}`}>
            <MapPin className={`w-6 h-6 ${location.pathname === '/map' ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold">Map</span>
          </Link>
          <Link to="/list" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/list' ? 'text-primary' : 'text-muted-foreground'}`}>
            <List className={`w-6 h-6 ${location.pathname === '/list' ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold">List</span>
          </Link>
          <Link onClick={(e) => handleProtectedAction(e, '/customer/requests')} to="/customer/requests" className={`flex flex-col items-center gap-1 p-2 ${location.pathname.includes('/customer/requests') ? 'text-primary' : 'text-muted-foreground hover:text-primary transition-colors'}`}>
            <AlertTriangle className="w-6 h-6" />
            <span className="text-[10px] font-bold">Requests</span>
          </Link>
          <Link onClick={(e) => handleProtectedAction(e, '/customer/profile')} to="/customer/profile" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/customer/profile' ? 'text-primary' : 'text-muted-foreground hover:text-primary transition-colors'}`}>
            <User className={`w-6 h-6 ${location.pathname === '/customer/profile' ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
