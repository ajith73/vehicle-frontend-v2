import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient, AUTH_STATE_CHANGED_EVENT } from '../api/apiClient';

interface DataContextType {
  vehicles: any[];
  services: any[];
  isLoadingData: boolean;
  isLoadingCustomerProfile: boolean;
  refreshData: () => Promise<void>;
  cachedMechanics: any[] | null;
  cachedMechanicsTotalCount: number;
  cachedMechanicsParams: string | null;
  setCachedMechanicsData: (data: any[], totalCount: number, params: string) => void;
  cachedMapMechanics: any[] | null;
  cachedMapMechanicsParams: string | null;
  setCachedMapMechanicsData: (data: any[], params: string) => void;
  cachedLandingMechanics: any[] | null;
  cachedLandingMechanicsParams: string | null;
  setCachedLandingMechanicsData: (data: any[], params: string) => void;
  customerProfile: any | null;
  refreshCustomerProfile: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [cachedMechanics, setCachedMechanics] = useState<any[] | null>(null);
  const [cachedMechanicsTotalCount, setCachedMechanicsTotalCount] = useState<number>(0);
  const [cachedMechanicsParams, setCachedMechanicsParams] = useState<string | null>(null);
  
  const [cachedMapMechanics, setCachedMapMechanics] = useState<any[] | null>(null);
  const [cachedMapMechanicsParams, setCachedMapMechanicsParams] = useState<string | null>(null);

  const [cachedLandingMechanics, setCachedLandingMechanics] = useState<any[] | null>(null);
  const [cachedLandingMechanicsParams, setCachedLandingMechanicsParams] = useState<string | null>(null);

  const [customerProfile, setCustomerProfile] = useState<any | null>(null);
  const [isLoadingCustomerProfile, setIsLoadingCustomerProfile] = useState(true);

  const hasCustomerSession = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    return Boolean(token) && role === 'Customer';
  };

  const refreshCustomerProfile = useCallback(async () => {
    setIsLoadingCustomerProfile(true);
    if (!hasCustomerSession()) {
      setCustomerProfile(null);
      setIsLoadingCustomerProfile(false);
      return;
    }

    try {
      const data = await apiClient<any>('/customer/profile');
      if (data?.profile) {
        setCustomerProfile(data.profile);
      } else {
        setCustomerProfile(null);
      }
    } catch (err) {
      console.error('Failed to fetch customer profile', err);
      setCustomerProfile(null);
    } finally {
      setIsLoadingCustomerProfile(false);
    }
  }, []);

  const setCachedMechanicsData = (data: any[], totalCount: number, params: string) => {
    setCachedMechanics(data);
    setCachedMechanicsTotalCount(totalCount);
    setCachedMechanicsParams(params);
  };

  const setCachedMapMechanicsData = (data: any[], params: string) => {
    setCachedMapMechanics(data);
    setCachedMapMechanicsParams(params);
  };

  const setCachedLandingMechanicsData = (data: any[], params: string) => {
    setCachedLandingMechanics(data);
    setCachedLandingMechanicsParams(params);
  };

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [vData, sData] = await Promise.all([
        apiClient<any>('/public/vehicles'),
        apiClient<any>('/public/services')
      ]);
      setVehicles(vData);
      setServices(sData);
    } catch (err) {
      console.error('Failed to fetch vehicles and services:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    void refreshCustomerProfile();
  }, [fetchData, refreshCustomerProfile]);

  useEffect(() => {
    const handleAuthStateChanged = () => {
      void refreshCustomerProfile();
    };

    const handleWindowFocus = () => {
      if (hasCustomerSession()) {
        void refreshCustomerProfile();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasCustomerSession()) {
        void refreshCustomerProfile();
      }
    };

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged as EventListener);
    window.addEventListener('storage', handleAuthStateChanged);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged as EventListener);
      window.removeEventListener('storage', handleAuthStateChanged);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshCustomerProfile]);

  return (
    <DataContext.Provider value={{ 
      vehicles, 
      services, 
      isLoadingData, 
      isLoadingCustomerProfile,
      refreshData: fetchData,
      cachedMechanics,
      cachedMechanicsTotalCount,
      cachedMechanicsParams,
      setCachedMechanicsData,
      cachedMapMechanics,
      cachedMapMechanicsParams,
      setCachedMapMechanicsData,
      cachedLandingMechanics,
      cachedLandingMechanicsParams,
      setCachedLandingMechanicsData,
      customerProfile,
      refreshCustomerProfile
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
