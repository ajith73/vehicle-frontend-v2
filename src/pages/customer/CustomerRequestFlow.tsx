import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Car, Plus, AlertCircle, MapPin, Camera, CheckCircle2, Loader2, Navigation, Map as MapIcon2 } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { useDataContext } from '../../contexts/DataContext';
import { useLocationContext } from '../../contexts/LocationContext';
import { LocationPopup } from '../../components/shared/LocationPopup';
import { MapLocationPicker } from '../../components/MapLocationPicker';
import { SERVICE_IMAGES, DEFAULT_SERVICE_IMAGE } from '../../utils/serviceImages';
import { VehicleForm, type VehicleData } from '../../components/customer/VehicleForm';

export default function CustomerRequestFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialService = searchParams.get('service') || '';

  const { services, customerProfile, refreshCustomerProfile } = useDataContext();
  const { userLocation, locationName, locationSource, requestLocation, setLocation, isLoading: locationLoading, locationMessage } = useLocationContext();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [showVehicleForm, setShowVehicleForm] = useState(false);

  const [requestData, setRequestData] = useState({
    vehicleId: '',
    vehicleLabel: '',
    problem: initialService,
    details: '',
  });

  useEffect(() => {
    refreshCustomerProfile();
  }, []);

  useEffect(() => {
    if (customerProfile?.savedVehicles?.length > 0 && !requestData.vehicleId) {
      const defaultV = customerProfile.savedVehicles[0];
      setRequestData(prev => ({
        ...prev,
        vehicleId: defaultV.id || '1',
        vehicleLabel: `${defaultV.make} ${defaultV.model} (${defaultV.plate})`
      }));
    }
  }, [customerProfile, requestData.vehicleId]);

  const handleSaveVehicle = async (data: VehicleData) => {
    try {
      setLoading(true);
      const currentVehicles = customerProfile?.savedVehicles || [];
      const newVehicle = { ...data, id: Date.now().toString() };
      const updatedVehicles = [...currentVehicles, newVehicle];

      await apiClient('/customer/profile', {
        method: 'PUT',
        data: { savedVehicles: updatedVehicles }
      });
      
      toast.success('Vehicle added successfully!');
      setShowVehicleForm(false);
      await refreshCustomerProfile();
      
      setRequestData(prev => ({
        ...prev,
        vehicleId: newVehicle.id,
        vehicleLabel: `${newVehicle.make} ${newVehicle.model} (${newVehicle.plate})`
      }));
      nextStep();
    } catch (err) {
      toast.error('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(4, s + 1));
  const prevStep = () => {
    if (step === 1) {
       if (showVehicleForm) setShowVehicleForm(false);
       else navigate('/customer');
    }
    else setStep(s => s - 1);
  };

  const submitRequest = async () => {
    try {
      setLoading(true);
      const payload = {
        serviceTypeId: 1, // Mocked for MVP
        vehicleLabel: requestData.vehicleLabel || 'Unknown Vehicle',
        issueSummary: requestData.problem || 'General Service',
        issueDetails: requestData.details || 'No additional details provided.',
        latitude: userLocation ? userLocation[0] : 11.0168,
        longitude: userLocation ? userLocation[1] : 76.9558,
        addressText: locationName || 'Unknown Location'
      };
      
      const res: any = await apiClient('/customer/requests', {
        method: 'POST',
        data: payload
      });
      
      toast.success('Request submitted successfully!');
      navigate(`/customer/request/searching?id=${res.request?.id || res.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background min-h-screen relative">
      <LocationPopup 
        isOpen={showLocationPopup} 
        onClose={() => setShowLocationPopup(false)} 
        setLocation={setLocation} 
        setShowMapPicker={setShowMapPicker} 
      />
      
      {showMapPicker && (
        <MapLocationPicker
          onClose={() => setShowMapPicker(false)}
          onSelect={(coords, address) => {
            setLocation(coords, address, 'manual');
            setShowMapPicker(false);
          }}
          initialLocation={userLocation || undefined}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border p-4 flex items-center justify-between shadow-sm">
        <button onClick={prevStep} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-foreground">
          {step === 1 && (showVehicleForm ? "Add Vehicle" : "Select Vehicle")}
          {step === 2 && "What's the problem?"}
          {step === 3 && "Provide Details"}
          {step === 4 && "Confirm Request"}
        </h1>
        <div className="w-10"></div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-secondary overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-r-full" 
          initial={{ width: 0 }}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-32 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Vehicle */}
          {step === 1 && !showVehicleForm && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Saved Vehicles</h2>
              
              {!customerProfile ? (
                <div className="flex flex-col items-center justify-center p-8 border rounded-2xl bg-card border-border">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading vehicles...</p>
                </div>
              ) : customerProfile?.savedVehicles?.length > 0 ? (
                customerProfile.savedVehicles.map((v: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => { 
                      setRequestData({...requestData, vehicleId: v.id || String(idx), vehicleLabel: `${v.make} ${v.model}`}); 
                      nextStep(); 
                    }}
                    className={`flex items-center gap-4 bg-card border rounded-2xl p-4 transition-all text-left ${requestData.vehicleId === (v.id || String(idx)) ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/20'}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{v.make} {v.model}</p>
                      <p className="text-xs text-muted-foreground mt-1">{v.plate} • {v.fuelType || 'Petrol'}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center">
                       {requestData.vehicleId === (v.id || String(idx)) && <div className="w-3 h-3 bg-primary rounded-full" />}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center p-6 border rounded-2xl bg-card text-muted-foreground text-sm">
                  No saved vehicles found. Please add a vehicle to continue.
                </div>
              )}

              <button onClick={() => setShowVehicleForm(true)} className="flex items-center gap-4 bg-background border-2 border-dashed border-border rounded-2xl p-4 hover:border-primary hover:bg-primary/5 transition-all mt-2 text-left group w-full">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="font-bold text-muted-foreground group-hover:text-primary">Add New Vehicle</p>
              </button>
            </motion.div>
          )}

          {/* STEP 1: Add Vehicle Form Inline */}
          {step === 1 && showVehicleForm && (
            <motion.div key="step1-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <VehicleForm 
                onSubmit={handleSaveVehicle}
                onCancel={() => setShowVehicleForm(false)}
                loading={loading}
              />
            </motion.div>
          )}

          {/* STEP 2: Problem */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {!services || services.length === 0 ? (
                 <div className="col-span-full flex justify-center p-8">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                 </div>
              ) : (
                services.map(service => {
                  const imageSrc = SERVICE_IMAGES[service.name] || service.imageUrl || DEFAULT_SERVICE_IMAGE;
                  const isSelected = requestData.problem === service.name;
                  return (
                    <button
                      key={service.name}
                      onClick={() => { setRequestData({...requestData, problem: service.name}); nextStep(); }}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-center ${isSelected ? 'border-primary bg-primary/10 shadow-[0_4px_20px_rgba(var(--primary),0.15)] scale-105' : 'border-border bg-card/80 hover:border-primary/50 hover:bg-card hover:shadow-md active:scale-95'}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center p-2 ${isSelected ? 'bg-primary/20' : 'bg-primary/10'}`}>
                        <img src={imageSrc} alt={service.name} className="w-full h-full object-contain" />
                      </div>
                      <span className={`text-[11px] sm:text-xs font-bold leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>{service.name}</span>
                    </button>
                  );
                })
              )}
            </motion.div>
          )}

          {/* STEP 3: Combine Location, Details, and Price */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              
              {/* Location Block */}
              <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Service Location</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{locationLoading ? 'Detecting your location...' : (locationName || 'Location not set')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locationLoading ? 'Loading live location' : locationSource === 'geolocation' ? 'Live GPS Location' : 'Selected Location'}
                    </p>
                    {locationMessage ? <p className="text-[11px] text-muted-foreground mt-1">{locationMessage}</p> : null}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-border/50">
                  <button onClick={() => setShowLocationPopup(true)} className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary p-2 rounded-xl text-xs font-bold transition-colors">
                    <MapIcon2 className="w-4 h-4" /> Edit Address
                  </button>
                  <button
                    onClick={() => requestLocation(true)}
                    disabled={locationLoading}
                    className="flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 p-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                  >
                    {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    {locationLoading ? 'Detecting...' : 'Live Location'}
                  </button>
                </div>
              </div>

              {/* Details Block */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Additional Details (Optional)</h3>
                <textarea 
                  placeholder="E.g. Car made a clunking noise and stopped suddenly..."
                  value={requestData.details}
                  onChange={e => setRequestData({...requestData, details: e.target.value})}
                  className="w-full bg-card border border-border rounded-xl p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] shadow-sm"
                />
              </div>

              {/* Price Estimate Block */}
              <div className="bg-card border border-border rounded-2xl p-5 text-center overflow-hidden relative shadow-sm">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">Estimated Call-out Fee</h3>
                <p className="text-4xl font-black text-foreground relative z-10">₹250</p>
                <p className="text-xs text-muted-foreground mt-2 relative z-10">Actual cost may vary based on parts required.</p>
              </div>

              <div className="bg-secondary/50 rounded-2xl p-3 flex gap-2 text-xs border border-border/50">
                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                <p className="text-muted-foreground leading-relaxed">
                  You will only be charged after the mechanic inspects your vehicle and provides a final quote.
                </p>
              </div>

              <button onClick={nextStep} className="w-full bg-primary text-primary-foreground p-4 rounded-xl font-bold mt-2 shadow-[0_8px_20px_rgba(var(--primary),0.3)] hover:opacity-90 transition-all hover:-translate-y-1">
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 4: Confirm */}
          {step === 4 && (
            <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Vehicle</p>
                    <p className="font-bold text-foreground">{requestData.vehicleLabel || 'Selected Vehicle'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Issue</p>
                    <p className="font-bold text-primary">{requestData.problem || 'General Service'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
                    <p className="font-bold text-foreground text-sm">{locationName || 'Unknown Location'}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={submitRequest} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white p-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(239,68,68,0.3)] hover:scale-[1.02] transition-transform mt-4 flex items-center justify-center gap-2 overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> CONFIRM REQUEST</>}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
