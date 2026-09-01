import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Car,
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Wrench,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { apiClient } from '../../api/apiClient';
import { reverseGeocodeName } from '../../api/geocoding';
import { MapLocationPicker } from '../../components/MapLocationPicker';
import { LocationPopup } from '../../components/shared/LocationPopup';
import { useDataContext } from '../../contexts/DataContext';
import { useLocationContext } from '../../contexts/LocationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SERVICE_IMAGES, DEFAULT_SERVICE_IMAGE } from '../../utils/serviceImages';
import { VehicleForm, type VehicleData } from '../../components/customer/VehicleForm';
import type { Mechanic } from '../../types';
import {
  MapClickHandler,
  REQUEST_FLOW_PROGRESS_ITEMS,
  REQUEST_RADIUS_DEFAULT,
  customerPinIcon,
  getDistanceKm,
  getRequestFlowTileAttribution,
  getRequestFlowTileUrl,
} from './requestFlowHelpers';

type StepId = 1 | 2 | 3 | 4 | 5;

function RequestLocationPreviewMap({
  coords
}: {
  coords: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(coords, Math.max(map.getZoom(), 14), { animate: true });
  }, [coords, map]);

  return null;
}

export default function CustomerRequestFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialService = searchParams.get('service') || '';
  const { theme } = useTheme();

  const {
    vehicles,
    services,
    isLoadingData,
    customerProfile,
    refreshCustomerProfile,
    isLoadingCustomerProfile
  } = useDataContext();
  const {
    userLocation,
    locationName,
    requestLocation,
    setLocation,
    isLoading: locationLoading
  } = useLocationContext();
  const [step, setStep] = useState<StepId>(1);
  const [loading, setLoading] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [manualCoords, setManualCoords] = useState<[number, number] | null>(userLocation || null);
  const [manualAddress, setManualAddress] = useState(locationName || 'Pinned Location');
  const [radius, setRadius] = useState(REQUEST_RADIUS_DEFAULT);
  const [nearbyMechanics, setNearbyMechanics] = useState<Mechanic[]>([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');
  const [requestServices, setRequestServices] = useState<any[]>([]);
  const [servicesError, setServicesError] = useState('');
  const [stepErrors, setStepErrors] = useState<Partial<Record<'problem' | 'vehicle' | 'location' | 'details', string>>>({});
  const [addressResolving, setAddressResolving] = useState(false);

  const [requestData, setRequestData] = useState({
    vehicleId: '',
    vehicleLabel: '',
    vehicleType: '',
    problem: initialService,
    details: ''
  });

  useEffect(() => {
    void refreshCustomerProfile();
  }, [refreshCustomerProfile]);

  useEffect(() => {
    if (userLocation) {
      setManualCoords(userLocation);
    }
    if (locationName) {
      setManualAddress(locationName);
    }
  }, [userLocation, locationName]);

  useEffect(() => {
    if (services.length > 0) {
      setRequestServices(services);
      setServicesError('');
    }
  }, [services]);

  useEffect(() => {
    if (isLoadingData || services.length > 0) return;

    const loadRequestServices = async () => {
      try {
        setServicesError('');
        const fallbackServices = await apiClient<any[]>('/public/services');
        setRequestServices(Array.isArray(fallbackServices) ? fallbackServices : []);
      } catch {
        setRequestServices([]);
        setServicesError('Unable to load services right now. Please try again.');
      }
    };

    void loadRequestServices();
  }, [isLoadingData, services]);

  useEffect(() => {
    if (customerProfile?.savedVehicles?.length > 0 && !requestData.vehicleId) {
      const defaultVehicle = customerProfile.savedVehicles[0];
      setRequestData((prev) => ({
        ...prev,
        vehicleId: defaultVehicle.id || '1',
        vehicleLabel: `${defaultVehicle.make} ${defaultVehicle.model} (${defaultVehicle.plate})`,
        vehicleType: defaultVehicle.type || ''
      }));
    }
  }, [customerProfile, requestData.vehicleId]);

  const loadNearbyMechanics = async (
    coords: [number, number],
    nextRadius = radius,
    options?: { preserveSelection?: boolean }
  ) => {
    if (!coords || !requestData.problem || !requestData.vehicleType) {
      setNearbyMechanics([]);
      return;
    }

    setMechanicsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('lat', String(coords[0]));
      params.set('lng', String(coords[1]));
      params.set('radius', String(nextRadius));
      params.set('availability', 'Available');
      params.set('limit', '20');
      params.append('service', requestData.problem);
      params.append('vehicle', requestData.vehicleType);

      const mechanics = await apiClient<Mechanic[]>(`/public/mechanics?${params.toString()}`);
      const filtered = (mechanics || [])
        .filter((mechanic) => Number.isFinite(Number(mechanic.latitude)) && Number.isFinite(Number(mechanic.longitude)))
        .map((mechanic) => ({
          ...mechanic,
          distanceKm: getDistanceKm(
            coords[0],
            coords[1],
            Number(mechanic.latitude),
            Number(mechanic.longitude)
          )
        }))
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
        .slice(0, 10) as Mechanic[];

      setNearbyMechanics(filtered);
      if (!options?.preserveSelection) {
        setSelectedMechanicId(filtered[0]?.id ? String(filtered[0].id) : '');
      } else if (!filtered.some((mechanic) => String(mechanic.id) === selectedMechanicId)) {
        setSelectedMechanicId(filtered[0]?.id ? String(filtered[0].id) : '');
      }
    } catch (error) {
      console.error('Failed to load nearby mechanics', error);
      setNearbyMechanics([]);
    } finally {
      setMechanicsLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 3 || !manualCoords || !requestData.problem || !requestData.vehicleType) return;
    void loadNearbyMechanics(manualCoords, radius, { preserveSelection: true });
  }, [step, manualCoords, radius, requestData.problem, requestData.vehicleType]);

  const selectedService = useMemo(
    () => requestServices.find((service) => String(service.name).toLowerCase() === String(requestData.problem).toLowerCase()),
    [requestServices, requestData.problem]
  );

  const selectedVehicleType = useMemo(
    () =>
      vehicles.find((vehicle) => {
        const vehicleName = String(vehicle.name || '').toLowerCase();
        const chosenType = String(requestData.vehicleType || '').toLowerCase();
        return chosenType && (vehicleName === chosenType || vehicleName.includes(chosenType) || chosenType.includes(vehicleName));
      }),
    [vehicles, requestData.vehicleType]
  );

  const selectedMechanic = useMemo(
    () => nearbyMechanics.find((mechanic) => String(mechanic.id) === selectedMechanicId) || null,
    [nearbyMechanics, selectedMechanicId]
  );

  const progressItems = REQUEST_FLOW_PROGRESS_ITEMS as Array<{ id: StepId; label: string }>;

  const availableServices = requestServices;

  const retryServicesLoad = async () => {
    try {
      setServicesError('');
      const fallbackServices = await apiClient<any[]>('/public/services');
      setRequestServices(Array.isArray(fallbackServices) ? fallbackServices : []);
    } catch {
      setRequestServices([]);
      setServicesError('Unable to load services right now. Please try again.');
    }
  };

  const applySavedLocation = (savedLocation: any) => {
    const nextAddress = savedLocation.addressText || savedLocation.name || 'Saved location';
    const nextLat = Number(savedLocation.latitude ?? savedLocation.lat);
    const nextLng = Number(savedLocation.longitude ?? savedLocation.lng);

    if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
      setManualCoords([nextLat, nextLng]);
    }

    setManualAddress(nextAddress);
    setStepErrors((current) => {
      if (!current.location) return current;
      const next = { ...current };
      delete next.location;
      return next;
    });
  };

  const clearStepError = (field: keyof typeof stepErrors) => {
    setStepErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const resolvePinnedAddress = async (coords: [number, number]) => {
    setAddressResolving(true);
    try {
      const address = await reverseGeocodeName(coords);
      setManualAddress(address);
    } catch {
      setManualAddress('Pinned Location');
    } finally {
      setAddressResolving(false);
    }
  };

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

      toast.success('Vehicle added successfully');
      await refreshCustomerProfile();
      setRequestData((prev) => ({
        ...prev,
        vehicleId: newVehicle.id || '',
        vehicleLabel: `${newVehicle.make} ${newVehicle.model} (${newVehicle.plate})`,
        vehicleType: newVehicle.type || ''
      }));
      clearStepError('vehicle');
      setStep(3);
    } catch {
      toast.error('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle: any, index: number) => {
    setRequestData((prev) => ({
      ...prev,
      vehicleId: vehicle.id || String(index),
      vehicleLabel: `${vehicle.make} ${vehicle.model} (${vehicle.plate})`,
      vehicleType: vehicle.type || ''
    }));
    clearStepError('vehicle');
    setStep(3);
  };

  const handleUseLiveLocation = async () => {
    await requestLocation(true);
    clearStepError('location');
  };

  const handleConfirmPinnedLocation = async () => {
    if (!manualCoords) {
      toast.error('Please choose your location on the map');
      setStepErrors((current) => ({ ...current, location: 'Choose or confirm the service location before continuing.' }));
      return;
    }

    setLocation(manualCoords, manualAddress, 'manual');
    await loadNearbyMechanics(manualCoords, radius);
    clearStepError('location');
  };

  const validateStep = () => {
    const nextErrors: Partial<Record<'problem' | 'vehicle' | 'location' | 'details', string>> = {};

    if (step === 1 && !requestData.problem) {
      nextErrors.problem = 'Choose the service you need to continue.';
    }

    if (step === 2 && !requestData.vehicleLabel) {
      nextErrors.vehicle = 'Select a saved vehicle or add a new vehicle to continue.';
    }

    if (step === 3 && !manualCoords) {
      nextErrors.location = 'Choose your live, searched, or pinned location to continue.';
    }

    if (step === 4 && requestData.details.trim().length > 0 && requestData.details.trim().length < 5) {
      nextErrors.details = 'Add a little more detail so the partner understands the issue.';
    }

    setStepErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep()) {
      toast.error('Please complete the highlighted area');
      return;
    }

    if (step === 3) {
      await handleConfirmPinnedLocation();
      if (!selectedMechanicId && nearbyMechanics.length > 0) {
        setSelectedMechanicId(String(nearbyMechanics[0].id));
      }
    }

    setStep((current) => (Math.min(5, current + 1) as StepId));
  };

  const prevStep = () => {
    if (step === 1) {
      navigate('/customer');
      return;
    }
    setStep((current) => (Math.max(1, current - 1) as StepId));
  };

  const submitRequest = async () => {
    try {
      setLoading(true);

      if (!manualCoords) {
        toast.error('Please confirm your location');
        setStepErrors((current) => ({ ...current, location: 'Choose your location before confirming the request.' }));
        return;
      }
      if (!requestData.vehicleLabel) {
        toast.error('Please select a vehicle');
        setStepErrors((current) => ({ ...current, vehicle: 'Select a vehicle before confirming the request.' }));
        return;
      }
      if (!requestData.problem) {
        toast.error('Please select the problem');
        setStepErrors((current) => ({ ...current, problem: 'Choose a service before confirming the request.' }));
        return;
      }
      if (!selectedService?.id) {
        toast.error('Selected service is not available right now');
        return;
      }

      const payload = {
        mechanicId: selectedMechanic?.id ? Number(selectedMechanic.id) : undefined,
        serviceTypeId: Number(selectedService.id),
        vehicleLabel: requestData.vehicleLabel,
        vehicleTypeId: selectedVehicleType?.id ? Number(selectedVehicleType.id) : null,
        issueSummary: requestData.problem,
        issueDetails: requestData.details || 'No additional details provided.',
        latitude: manualCoords[0],
        longitude: manualCoords[1],
        addressText: manualAddress || 'Pinned Location'
      };

      const res: any = await apiClient('/customer/requests', {
        method: 'POST',
        data: payload
      });

      toast.success('Request submitted successfully');
      navigate(`/customer/request/searching?id=${res.request?.id || res.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
            setManualCoords(coords);
            setManualAddress(address);
            setLocation(coords, address, 'manual');
            setShowMapPicker(false);
          }}
          initialLocation={manualCoords || userLocation || undefined}
        />
      )}

      {/* Keep the flow header compact so the active step stays visible on mobile. */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 p-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={prevStep} className="rounded-full p-2 transition-colors hover:bg-secondary">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-foreground">{progressItems.find((item) => item.id === step)?.label}</h1>
          </div>
          <button
            onClick={() => navigate('/customer')}
            className="rounded-full p-2 transition-colors hover:bg-secondary"
            aria-label="Close request flow"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="h-1 w-full overflow-hidden bg-secondary">
        <motion.div
          className="h-full rounded-r-full bg-gradient-to-r from-primary to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${(step / progressItems.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <main className={`mx-auto flex w-full flex-1 ${step === 3 ? 'max-w-none p-0' : 'max-w-6xl p-4 md:p-6'}`}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section
              key="step-problem"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mx-auto w-full max-w-5xl"
            >
              {isLoadingData && availableServices.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center rounded-[1.75rem] border border-border bg-card">
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Loading services...
                  </div>
                </div>
              ) : availableServices.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-border bg-card px-6 text-center">
                  <p className="text-base font-black text-foreground">No services available right now</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {servicesError || 'Please refresh the page or check the admin service setup.'}
                  </p>
                  <button
                    onClick={() => void retryServicesLoad()}
                    className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div>
                  {stepErrors.problem ? (
                    <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300">
                      {stepErrors.problem}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {availableServices.map((service) => {
                      const imageSrc = SERVICE_IMAGES[service.name] || service.imageUrl || DEFAULT_SERVICE_IMAGE;
                      const isSelected = requestData.problem === service.name;
                      return (
                        <button
                          key={service.name}
                          onClick={() => {
                            setRequestData((prev) => ({ ...prev, problem: service.name }));
                            clearStepError('problem');
                            setStep(2);
                          }}
                          className={`group flex min-h-[168px] flex-col items-center justify-center rounded-[1.75rem] border p-5 text-center transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-[0_12px_30px_rgba(var(--primary),0.12)]'
                              : 'border-border bg-card hover:border-primary/40 hover:bg-card/90'
                          }`}
                        >
                          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-primary/10">
                            <img src={imageSrc} alt={service.name} className="h-14 w-14 object-contain" />
                          </div>
                          <p className={`text-sm font-black leading-snug ${isSelected ? 'text-primary' : 'text-foreground'}`}>{service.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="step-vehicle"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mx-auto w-full max-w-5xl"
            >
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    {stepErrors.vehicle ? (
                      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300">
                        {stepErrors.vehicle}
                      </div>
                    ) : null}
                    <div className="space-y-3">
                    {isLoadingCustomerProfile ? (
                      <div className="flex items-center justify-center rounded-[1.75rem] border border-border bg-card p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : customerProfile?.savedVehicles?.length > 0 ? (
                      customerProfile.savedVehicles.map((vehicle: any, index: number) => {
                        const vehicleId = vehicle.id || String(index);
                        const selected = requestData.vehicleId === vehicleId;
                        return (
                          <button
                            key={vehicleId}
                            onClick={() => handleSelectVehicle(vehicle, index)}
                            className={`flex w-full items-center gap-4 rounded-[1.5rem] border p-4 text-left transition-all ${
                              selected
                                ? 'border-primary bg-primary/10 shadow-[0_10px_24px_rgba(var(--primary),0.12)]'
                                : 'border-border bg-card hover:border-primary/40'
                            }`}
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                              <Car className="h-7 w-7 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-base font-black text-foreground">{vehicle.make} {vehicle.model}</p>
                              <p className="mt-1 text-xs font-semibold text-muted-foreground">{vehicle.plate} • {vehicle.type} • {vehicle.fuelType}</p>
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 ${selected ? 'border-primary bg-primary' : 'border-border'}`} />
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                        No saved vehicles found yet. Please add a vehicle below.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-foreground">Add New Vehicle</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Add the vehicle once here if it is not already saved.</p>
                  </div>
                  <VehicleForm onSubmit={handleSaveVehicle} loading={loading} submitLabel="Save and Continue" />
                </div>
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section
              key="step-location"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="w-full"
            >
              <div className="mx-auto grid h-[calc(100dvh-8.5rem)] w-full max-w-6xl gap-0 overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm lg:grid-cols-[380px_minmax(0,1fr)]">
                <div className="order-2 flex min-h-0 flex-col lg:order-1 lg:border-r lg:border-border">
                  <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Choose Location</h2>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        Search, use live GPS, or move the pin on the map. We will use this location for dispatch and routing.
                      </p>
                    </div>
                    <div className="mt-5 grid gap-3">
                      <button
                        onClick={() => setShowLocationPopup(true)}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
                      >
                        <Search className="h-4 w-4" />
                        Search Address
                      </button>
                      <button
                        onClick={handleUseLiveLocation}
                        disabled={locationLoading}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
                      >
                        {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                        {locationLoading ? 'Detecting live location...' : 'Use Live Location'}
                      </button>
                      <button
                        onClick={() => setShowMapPicker(true)}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                      >
                        <MapPin className="h-4 w-4 text-primary" />
                        Open Full Map Picker
                      </button>
                    </div>

                    <div className={`mt-5 rounded-2xl border p-4 ${stepErrors.location ? 'border-red-500/30 bg-red-500/10' : 'border-border bg-background'}`}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Pinned Address</p>
                      <p className="mt-2 break-words text-sm font-black text-foreground">
                        {locationLoading ? 'Detecting your location...' : addressResolving ? 'Updating pinned address...' : (manualAddress || 'Location not set')}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Tap the map once to move the pin. You can also choose from saved locations below.
                      </p>
                      {stepErrors.location ? (
                        <p className="mt-3 text-xs font-semibold text-red-500">{stepErrors.location}</p>
                      ) : null}
                    </div>

                    {!!customerProfile?.savedLocations?.length && (
                      <div className="mt-5">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Saved Locations</p>
                          <span className="text-xs text-muted-foreground">Tap one to reuse</span>
                        </div>
                        <div className="space-y-3">
                          {customerProfile.savedLocations.slice(0, 5).map((savedLocation: any) => (
                            <button
                              key={savedLocation.id}
                              onClick={() => applySavedLocation(savedLocation)}
                              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30"
                            >
                              <p className="text-sm font-bold text-foreground">{savedLocation.name || savedLocation.type || 'Saved location'}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{savedLocation.addressText}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nearby partners</p>
                        <span className="text-xs font-bold text-primary">
                          {mechanicsLoading ? 'Finding nearby...' : `${nearbyMechanics.length} found`}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nearby partners are filtered using the selected service and vehicle type. You can continue with the selected partner or let the platform assign one.
                      </p>
                      {mechanicsLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : nearbyMechanics.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {nearbyMechanics.map((mechanic: any) => {
                            const selected = String(mechanic.id) === selectedMechanicId;
                            return (
                              <button
                                key={mechanic.id}
                                onClick={() => setSelectedMechanicId(String(mechanic.id))}
                                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                                  selected
                                    ? 'border-primary bg-primary/10 shadow-[0_10px_20px_rgba(var(--primary),0.12)]'
                                    : 'border-border bg-card hover:border-primary/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-foreground">{mechanic.businessName || mechanic.name || 'Partner'}</p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                      {[mechanic.area, mechanic.city, mechanic.mechanicType].filter(Boolean).join(' • ') || 'Nearby partner'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-bold text-primary">
                                      {typeof mechanic.distanceKm === 'number' ? `${mechanic.distanceKm.toFixed(1)} km` : 'Nearby'}
                                    </p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">{mechanic.availabilityState || 'Available'}</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-sm text-muted-foreground">
                          Nearby partners will appear here after you confirm the pinned location.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border px-4 py-4 sm:px-5">
                    <button
                      onClick={nextStep}
                      className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Continue
                    </button>
                  </div>
                </div>

                <div className="order-1 min-h-[38vh] overflow-hidden lg:order-2 lg:min-h-0">
                  <MapContainer
                    center={manualCoords || userLocation || [11.0168, 76.9558]}
                    zoom={14}
                    className="h-full w-full"
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution={getRequestFlowTileAttribution(theme)}
                      url={getRequestFlowTileUrl(theme)}
                    />
                    <Marker
                      position={manualCoords || userLocation || [11.0168, 76.9558]}
                      icon={customerPinIcon}
                      draggable
                      eventHandlers={{
                        dragend: (event) => {
                          const position = event.target.getLatLng();
                          const coords: [number, number] = [position.lat, position.lng];
                          setManualCoords(coords);
                          setManualAddress('Updating pinned address...');
                          clearStepError('location');
                          void resolvePinnedAddress(coords);
                        }
                      }}
                    />
                    <MapClickHandler
                      onSelect={(coords) => {
                        setManualCoords(coords);
                        setManualAddress('Updating pinned address...');
                        clearStepError('location');
                        void resolvePinnedAddress(coords);
                      }}
                    />
                    <RequestLocationPreviewMap coords={manualCoords || userLocation || [11.0168, 76.9558]} />
                  </MapContainer>
                </div>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section
              key="step-details"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mx-auto w-full max-w-4xl"
            >
              <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Additional Details</p>
                  <h2 className="mt-2 text-2xl font-black text-foreground">Anything else the partner should know?</h2>
                </div>

                <textarea
                  placeholder="Describe symptoms, vehicle condition, urgency, landmark, or any extra notes."
                  value={requestData.details}
                  onChange={(event) => {
                    setRequestData((prev) => ({ ...prev, details: event.target.value }));
                    clearStepError('details');
                  }}
                  className={`min-h-[180px] w-full rounded-[1.5rem] border p-4 text-sm outline-none transition-colors focus:ring-2 ${
                    stepErrors.details
                      ? 'border-red-500 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-border bg-background focus:border-primary focus:ring-primary/20'
                  }`}
                />
                {stepErrors.details ? <p className="mt-3 text-sm font-medium text-red-500">{stepErrors.details}</p> : null}

                <div className="mt-5 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                  We’ll send your selected service, vehicle, pinned location, and these notes to the dispatch flow.
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={nextStep}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Continue to Confirm
                </button>
              </div>
            </motion.section>
          )}

          {step === 5 && (
            <motion.section
              key="step-confirm"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mx-auto w-full max-w-6xl"
            >
              <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <CircleDashed className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-black text-foreground">Progress</h2>
                  </div>
                  <div className="space-y-4">
                    {progressItems.map((item, index) => {
                      const completed = item.id < step;
                      const active = item.id === step;
                      return (
                        <div key={item.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black ${
                                completed
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : active
                                    ? 'border-primary text-primary'
                                    : 'border-border text-muted-foreground'
                              }`}
                            >
                              {completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                            </div>
                            {index < progressItems.length - 1 && (
                              <div className={`mt-2 h-8 w-px ${completed ? 'bg-primary/50' : 'bg-border'}`} />
                            )}
                          </div>
                          <div className="pt-1">
                            <p className={`text-sm font-bold ${active || completed ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </aside>

                <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Review request</p>
                      <h2 className="mt-2 text-2xl font-black text-foreground">Confirm all selected details</h2>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Problem</p>
                      <p className="mt-2 text-base font-black text-primary">{requestData.problem || 'Not selected'}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Vehicle</p>
                      <p className="mt-2 text-base font-black text-foreground">{requestData.vehicleLabel || 'Not selected'}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Pinned location</p>
                      <p className="mt-2 text-base font-black text-foreground">{manualAddress || 'Not set'}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Selected mechanic</p>
                      <p className="mt-2 text-base font-black text-foreground">{selectedMechanic?.businessName || selectedMechanic?.name || 'Random / platform assigned'}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Additional details</p>
                    <p className="mt-2 text-sm text-foreground">{requestData.details || 'No extra details added.'}</p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        Confirm request to continue to the searching screen, where nearby partners will be notified inside the selected radius.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Link
                      to="/customer/support"
                      className="rounded-xl border border-border bg-background px-5 py-3 text-center text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                    >
                      Need Help?
                    </Link>
                    <button
                      onClick={submitRequest}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-6 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(239,68,68,0.28)] transition-all hover:opacity-90"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                      Confirm Request
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
