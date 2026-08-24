import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Wrench, Sun, Moon, Menu, X, Smartphone, ChevronRight } from 'lucide-react';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';


export default function PublicLayout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Services', href: '/services' },
    { label: 'For Partners', href: '/for-partners' },
    { label: 'About Us', href: '/about' },
    { label: 'Feedback', href: '/feedback' },
    { label: 'Donate', href: '/donate' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/20 pb-0 font-sans">
      <header className="sticky top-0 z-50 p-4 border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <Link to="/" className="flex items-center gap-2 text-xl font-black hover:scale-105 transition-transform z-50">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="tracking-tight text-xl">
              <span className="text-foreground">Road</span>
              <span className="text-primary">Res</span>
              <span className="text-blue-500">Q</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-8 items-center">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const isDonate = link.label === 'Donate';
              return (
                <Link 
                  key={link.label} 
                  to={link.href} 
                  className={`text-sm font-semibold transition-all ${
                    isDonate 
                      ? 'px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] hover:bg-primary/20' 
                      : isActive 
                        ? 'text-primary' 
                        : 'text-foreground/70 hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            <div className="flex items-center gap-4 ml-4">
              <div className="relative">
                <button 
                  onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                  className="text-sm font-bold bg-primary text-primary-foreground px-6 py-2.5 rounded-xl hover:bg-primary/90 hover:shadow-[0_4px_14px_rgba(59,130,246,0.4)] transition-all flex items-center gap-2"
                >
                  Login
                </button>
                
                {loginDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border/50 rounded-xl shadow-xl overflow-hidden flex flex-col z-50">
                    <Link to="/customer/login" className="px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors" onClick={() => setLoginDropdownOpen(false)}>Customer Login</Link>
                    <Link to="/partner/login" className="px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors" onClick={() => setLoginDropdownOpen(false)}>Partner Login</Link>
                    <Link to="/admin/login" className="px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors" onClick={() => setLoginDropdownOpen(false)}>Admin Login</Link>
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full border border-border/50 bg-secondary/50 text-secondary-foreground hover:bg-secondary/80 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-3 z-50">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-border/50 bg-secondary/50 text-secondary-foreground hover:bg-secondary/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-secondary/80 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-[73px] left-0 right-0 bg-background border-b border-border/50 shadow-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const isDonate = link.label === 'Donate';
              return (
                <Link 
                  key={link.label} 
                  to={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-semibold p-3 rounded-xl flex items-center justify-between transition-all ${
                    isDonate
                      ? 'bg-primary/10 text-primary border border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                      : isActive
                        ? 'text-primary bg-primary/5'
                        : 'text-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              );
            })}
            <div className="h-[1px] bg-border/50 my-2"></div>
            <div className="flex flex-col gap-3 mt-2">
              <Link to="/customer/login" className="px-4 py-3 text-sm font-bold text-center bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors" onClick={() => setMobileMenuOpen(false)}>Customer Login</Link>
              <Link to="/partner/login" className="px-4 py-3 text-sm font-bold text-center bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors" onClick={() => setMobileMenuOpen(false)}>Partner Login</Link>
              <Link to="/admin/login" className="px-4 py-3 text-sm font-bold text-center bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors" onClick={() => setMobileMenuOpen(false)}>Admin Login</Link>
              <Link 
                to="/map" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center font-bold bg-primary text-primary-foreground p-3.5 rounded-xl hover:bg-primary/90 shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <Smartphone className="w-5 h-5" /> Get the App
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col w-full relative">
        <Outlet />
      </main>

      {/* Global Public Footer */}
      <footer className="bg-card/30 border-t border-border/50 mt-auto backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            
            {/* Brand Info */}
            <div className="flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2 text-xl font-black">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="tracking-tight">
                  <span className="text-foreground">Road</span>
                  <span className="text-primary">Res</span>
                  <span className="text-blue-500">Q</span>
                </div>
              </Link>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed mt-2">
                India's most trusted platform for vehicle repair and roadside assistance.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <a href="https://www.facebook.com/profile.php?id=61593310886141" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all"><FaFacebook className="w-4 h-4" /></a>
                <a href="https://www.instagram.com/roadresqofficial247/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all"><FaInstagram className="w-4 h-4" /></a>
                <a href="https://x.com/roadresq247" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all"><FaTwitter className="w-4 h-4" /></a>
                <a href="https://www.linkedin.com/company/roadresqofficial/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all"><FaLinkedin className="w-4 h-4" /></a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-foreground mb-3 text-lg">Quick Links</h4>
              <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Home</Link>
              <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> How It Works</Link>
              <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Services</Link>
              <Link to="/for-partners" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> For Partners</Link>
              <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> About Us</Link>
              <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Contact</Link>
            </div>

            {/* Support */}
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-foreground mb-3 text-lg">Support</h4>
              <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Help Center</Link>
              <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> FAQs</Link>
              <Link to="/terms" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Terms & Conditions</Link>
              <Link to="/privacy" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Privacy Policy</Link>
              <Link to="/terms" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Cancellation Policy</Link>
            </div>

            {/* Contact Us & Apps */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-foreground mb-1 text-lg">Contact Us</h4>
                <a href="mailto:support@roadresq.com" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">✉️ support@roadresq.com</a>
                <p className="text-sm font-medium text-muted-foreground mt-1">📍 Coimbatore, Tamil Nadu, India</p>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-foreground mb-1 text-sm">Access Anywhere</h4>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">Our responsive web platform works seamlessly on all devices.</p>
                </div>
              </div>
            </div>

          </div>
          <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-medium text-muted-foreground">
            <p>© {new Date().getFullYear()} RoadResQ. All rights reserved.</p>
            <p className="flex items-center gap-1">Made with <span className="text-red-500">❤️</span> in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
