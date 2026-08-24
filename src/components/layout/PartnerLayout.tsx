import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Briefcase, Clock, DollarSign, TrendingUp, User, Power, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function PartnerLayout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);

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

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground selection:bg-primary/20">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 p-4 border-b border-border bg-background/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
               <img src="https://ui-avatars.com/api/?name=Ramesh+K&background=random" alt="Partner" className="w-full h-full object-cover" />
             </div>
             <div className="hidden lg:block">
               <h1 className="text-sm font-black text-foreground">Good morning, Ramesh</h1>
               <p className="text-xs font-semibold text-muted-foreground mt-0.5">Partner ID: P-10023</p>
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
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all font-bold text-xs ${
                isOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-secondary border-border text-muted-foreground'
              }`}
            >
               <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-500' : 'text-muted-foreground'}`} />
               {isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10 -z-10" />
        <div className="h-full overflow-y-auto">
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
