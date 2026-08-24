import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, AlertTriangle, Truck, Wrench, Car, Clock, Loader2, Crown, ShieldCheck, Bell, LifeBuoy, Zap, ChevronUp, ChevronDown } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion } from 'framer-motion';

import { useLocationContext } from '../../contexts/LocationContext';
import { useDataContext } from '../../contexts/DataContext';
import { LocationPopup } from '../../components/shared/LocationPopup';
import { MapLocationPicker } from '../../components/MapLocationPicker';
import { SERVICE_IMAGES, DEFAULT_SERVICE_IMAGE } from '../../utils/serviceImages';

export default function CustomerHomePage() {
  const [profile, setProfile] = useState<any>(null);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  
  const navigate = useNavigate();
  const { locationName, locationSource, requestLocation, setLocation, isLoading: locationLoading, locationMessage } = useLocationContext();
  const { services, customerProfile } = useDataContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isCustomerLoggedIn = localStorage.getItem('role') === 'Customer' && !!localStorage.getItem('token');
        const historyData = isCustomerLoggedIn
          ? await apiClient<any[]>('/customer/requests/history').catch(() => [])
          : [];
        
        if (customerProfile) {
          setProfile(customerProfile);
        } else {
          setProfile(null);
        }
        
        if (historyData?.length > 0) {
          const active = historyData.find((r: any) => !['SERVICE_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN', 'SERVICE_CANCELLED'].includes(r.status));
          setActiveRequest(active);
          setRecentRequests(historyData.filter((r: any) => r.status === 'SERVICE_COMPLETED').slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    setIsLoggedIn(localStorage.getItem('role') === 'Customer' && !!localStorage.getItem('token'));
  }, [customerProfile]);

  useEffect(() => {
     if (!locationLoading && (locationSource === 'none' || locationName === 'Current Location')) {
        setShowLocationPopup(true);
     } else {
        setShowLocationPopup(false);
     }
  }, [locationSource, locationName, locationLoading]);

  const handleProtectedAction = (e: React.MouseEvent, path: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      import('react-hot-toast').then(({ default: toast }) => {
        toast('Please login or register to access this feature', {
          icon: '🔒',
          duration: 3000,
        });
      });
      navigate('/customer/login');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground mt-4 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const defaultVehicle = profile?.savedVehicles?.[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 p-4 pb-24 max-w-lg mx-auto w-full"
    >
      <LocationPopup 
        isOpen={showLocationPopup} 
        onClose={() => setShowLocationPopup(false)} 
        setLocation={setLocation} 
        setShowMapPicker={setShowMapPicker} 
      />

      {showMapPicker && (
        <MapLocationPicker
          initialLocation={null}
          onClose={() => setShowMapPicker(false)}
          onSelect={(coords, address) => {
            setLocation(coords, address, 'manual');
            setShowMapPicker(false);
          }}
        />
      )}

      <section className="flex gap-4">
        <div className="flex-1 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-pointer" onClick={() => setShowLocationPopup(true)}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {locationLoading ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <MapPin className="w-5 h-5 text-primary" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Location</p>
              <p className="text-sm font-bold text-foreground truncate">
                {locationLoading ? 'Detecting your location...' : locationName}
              </p>
              {locationMessage ? (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{locationMessage}</p>
              ) : null}
            </div>
          </div>
        </div>

        <Link 
          onClick={(e) => handleProtectedAction(e, '/customer/vehicles')} 
          to="/customer/vehicles" 
          className="flex-1 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:border-primary/30"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Vehicle</p>
            {defaultVehicle ? (
              <p className="text-sm font-bold text-foreground truncate">{defaultVehicle.make} {defaultVehicle.model}</p>
            ) : (
              <p className="text-sm font-bold text-foreground">Add Vehicle</p>
            )}
          </div>
        </Link>
      </section>

      <section className="relative overflow-hidden rounded-2xl shadow-md h-32">
        <motion.div 
          animate={{ x: ['0%', '-100%', '-200%', '0%'] }}
          transition={{ ease: 'linear', duration: 30, repeat: Infinity }}
          className="flex w-[300%] h-full"
        >
          <div className="w-1/3 h-full relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex flex-col justify-center">
            <h3 className="text-white font-black text-xl mb-1">Get 20% Off</h3>
            <p className="text-white/80 text-sm">On your first full car service.</p>
            <div className="absolute right-4 bottom-0 opacity-20"><Wrench className="w-24 h-24" /></div>
          </div>
          <div className="w-1/3 h-full relative bg-gradient-to-r from-emerald-500 to-teal-600 p-6 flex flex-col justify-center">
            <h3 className="text-white font-black text-xl mb-1">Trust the Best</h3>
            <p className="text-white/80 text-sm">Verified mechanics at your doorstep.</p>
            <div className="absolute right-4 bottom-0 opacity-20"><ShieldCheck className="w-24 h-24" /></div>
          </div>
          <div className="w-1/3 h-full relative bg-gradient-to-r from-amber-500 to-orange-600 p-6 flex flex-col justify-center">
            <h3 className="text-white font-black text-xl mb-1">24/7 Roadside</h3>
            <p className="text-white/80 text-sm">Assistance whenever you need it.</p>
            <div className="absolute right-4 bottom-0 opacity-20"><Truck className="w-24 h-24" /></div>
          </div>
        </motion.div>
      </section>

      <motion.section whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link onClick={(e) => handleProtectedAction(e, '/customer/request')} to="/customer/request" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white p-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(239,68,68,0.3)] transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
          <AlertTriangle className="w-6 h-6" /> REQUEST HELP NOW
        </Link>
      </motion.section>

      {activeRequest && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-bold text-primary-foreground/90 uppercase tracking-wider">Active Request</p>
              <p className="text-xl font-black mt-1">{activeRequest.status}</p>
            </div>
            <Link to={`/customer/request/${activeRequest.id}`} className="bg-background text-foreground px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:scale-105 transition-transform">
              Track
            </Link>
          </div>
        </motion.section>
      )}

      <section>
        <h2 className="text-lg font-black text-foreground mb-4">Quick Services</h2>
        <div className="flex snap-x gap-2 overflow-x-auto pb-2 hide-scrollbar sm:grid sm:grid-cols-5 sm:gap-3 md:grid-cols-7">
          {!services ? (
            Array(7).fill(0).map((_, i) => (
              <div key={i} className="h-20 w-24 shrink-0 rounded-2xl border-2 border-border/50 bg-secondary/50 animate-pulse sm:h-24 sm:w-full"></div>
            ))
          ) : (
            <>
              <button
                onClick={(e) => {
                  handleProtectedAction(e as any, '/customer/request');
                  navigate('/customer/request');
                }}
                className="flex h-32 w-28 sm:h-36 sm:w-full snap-start flex-none flex-col items-center justify-center gap-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 transition-all active:scale-95 hover:scale-[1.02] hover:border-primary/50 hover:bg-card hover:shadow-md group text-center"
              >
                <div className="flex items-center justify-center p-2 group-hover:scale-110 transition-transform text-primary">
                  <Zap className="h-8 w-8 text-current" />
                </div>
                <span className="px-1 text-center text-[11px] sm:text-xs font-bold text-foreground">All Services</span>
              </button>
              {services
                .filter((service) => showAllServices || service.isFeatured || (!showAllServices && services.every((item) => !item.isFeatured)))
                .map((service) => {
                  const imageSrc = SERVICE_IMAGES[service.name] || service.imageUrl || DEFAULT_SERVICE_IMAGE;
                  return (
                    <button
                      key={service.name}
                      onClick={(e) => {
                        handleProtectedAction(e as any, '/customer/request');
                        navigate(`/customer/request?service=${service.name}`);
                      }}
                      className="flex h-32 w-28 sm:h-36 sm:w-full snap-start flex-none flex-col items-center justify-center gap-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 transition-all active:scale-95 hover:scale-[1.02] hover:border-primary/50 hover:bg-card hover:shadow-md group text-center"
                    >
                      <div className="flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                        <img src={imageSrc} alt={service.name} className="w-12 h-12 object-contain" />
                      </div>
                      <span className="px-1 text-center text-[11px] sm:text-xs font-bold text-foreground line-clamp-2 leading-tight">{service.name}</span>
                    </button>
                  );
                })}
              {services.some((service) => service.isFeatured) && services.some((service) => !service.isFeatured) && (
                <button
                  onClick={() => setShowAllServices(!showAllServices)}
                  className="flex h-32 w-28 sm:h-36 sm:w-full snap-start flex-none flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/40 bg-transparent text-muted-foreground transition-all hover:border-primary/50 hover:text-primary active:scale-95"
                >
                  <div className="flex items-center justify-center">
                    {showAllServices ? <ChevronUp className="h-8 w-8" /> : <ChevronDown className="h-8 w-8" />}
                  </div>
                  <span className="px-1 text-center text-[11px] sm:text-xs font-bold leading-tight">{showAllServices ? 'Show Less' : 'Show More'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {recentRequests.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-foreground">Recent Services</h2>
            <Link onClick={(e) => handleProtectedAction(e, '/customer/requests')} to="/customer/requests" className="text-sm font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentRequests.map(req => (
              <div key={req.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 flex justify-between items-center hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{req.ServiceType?.name || 'General Service'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">Member & Safety Shortcuts</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link onClick={(e) => handleProtectedAction(e, '/customer/membership')} to="/customer/membership" className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm transition-colors hover:border-primary/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-3 text-sm font-black text-foreground">Membership</p>
            <p className="mt-1 text-xs text-muted-foreground">Activate premium and fee benefits</p>
          </Link>
          <Link onClick={(e) => handleProtectedAction(e, '/customer/trusted-partners')} to="/customer/trusted-partners" className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm transition-colors hover:border-primary/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="mt-3 text-sm font-black text-foreground">Trusted Partners</p>
            <p className="mt-1 text-xs text-muted-foreground">View verified high-trust supply</p>
          </Link>
          <Link onClick={(e) => handleProtectedAction(e, '/customer/notifications')} to="/customer/notifications" className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm transition-colors hover:border-primary/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <Bell className="h-6 w-6 text-amber-500" />
            </div>
            <p className="mt-3 text-sm font-black text-foreground">Notifications</p>
            <p className="mt-1 text-xs text-muted-foreground">Track requests, payments and alerts</p>
          </Link>
          <Link onClick={(e) => handleProtectedAction(e, '/customer/support')} to="/customer/support" className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm transition-colors hover:border-primary/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
              <LifeBuoy className="h-6 w-6 text-rose-500" />
            </div>
            <p className="mt-3 text-sm font-black text-foreground">Support</p>
            <p className="mt-1 text-xs text-muted-foreground">Raise safety, dispatch or payment issues</p>
          </Link>
        </div>
      </section>

    </motion.div>
  );
}
