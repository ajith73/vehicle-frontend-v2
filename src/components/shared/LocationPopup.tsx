import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, Map as MapIcon2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchPlaces, type PlaceSuggestion } from '../../api/geocoding';
import { apiClient } from '../../api/apiClient';
import { useDataContext } from '../../contexts/DataContext';

interface LocationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  setLocation: (coords: [number, number], name: string, source: 'manual') => void;
  setShowMapPicker: (val: boolean) => void;
}

export function LocationPopup({ isOpen, onClose, setLocation, setShowMapPicker }: LocationPopupProps) {
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<PlaceSuggestion | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { customerProfile, refreshCustomerProfile } = useDataContext();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLocationSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (locationInput.length <= 2) {
      setLocationSuggestions([]);
      return;
    }

    const delayFn = setTimeout(() => {
      searchPlaces(locationInput)
        .then((data) => setLocationSuggestions(data))
        .catch((err) => console.error('Geocoding API error', err));
    }, 500);

    return () => clearTimeout(delayFn);
  }, [locationInput]);

  useEffect(() => {
    if (!isOpen) {
      setLocationInput('');
      setLocationSuggestions([]);
      setSelectedLocation(null);
      setSaveName('');
      setSaving(false);
    }
  }, [isOpen]);

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      toast.error('Choose a location first');
      return;
    }
    if (!saveName.trim()) {
      toast.error('Enter a name like Home or Work');
      return;
    }

    try {
      setSaving(true);
      const currentLocations = Array.isArray(customerProfile?.savedLocations) ? customerProfile.savedLocations : [];
      const updatedLocations = [
        ...currentLocations,
        {
          id: Date.now().toString(),
          name: saveName.trim(),
          type: saveName.trim(),
          addressText: selectedLocation.name,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lon
        }
      ];

      await apiClient('/customer/profile', {
        method: 'PUT',
        data: { savedLocations: updatedLocations }
      });

      await refreshCustomerProfile();
      toast.success('Location saved');
      setSaveName('');
    } catch {
      toast.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4">
      <div className="relative flex h-full w-full flex-col justify-center bg-card p-6 shadow-xl sm:h-auto sm:max-w-md sm:rounded-2xl sm:border sm:border-border">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
          aria-label="Close location popup"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="mb-2 text-xl font-black text-primary">Where are you located?</h3>
        <p className="mb-6 text-sm text-muted-foreground">Choose a city or pin your area on the map to improve nearby results and routing.</p>
        <div className="relative" ref={dropdownRef}>
          <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Enter city name..."
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          {locationSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-lg custom-scrollbar">
              {locationSuggestions.map((suggestion, idx) => {
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedLocation(suggestion);
                      setLocationInput(suggestion.name);
                      setLocationSuggestions([]);
                    }}
                    className="w-full border-b border-border px-4 py-3 text-left text-sm font-medium transition-colors last:border-0 hover:bg-primary/10"
                  >
                    {suggestion.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="mt-4 rounded-2xl border border-border bg-background p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Selected Location</p>
            <p className="mt-2 break-words text-sm font-bold text-foreground">{selectedLocation.name}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Save as Home, Work..."
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
            <button
              onClick={() => {
                setLocation([selectedLocation.lat, selectedLocation.lon], selectedLocation.name, 'manual');
                onClose();
              }}
              className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Use This Location
            </button>
          </div>
        )}

        {!!customerProfile?.savedLocations?.length && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Saved Locations</p>
            <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
              {customerProfile.savedLocations.map((savedLocation: any) => (
                <button
                  key={savedLocation.id}
                  onClick={() => {
                    if (Number.isFinite(Number(savedLocation.latitude)) && Number.isFinite(Number(savedLocation.longitude))) {
                      setLocation([Number(savedLocation.latitude), Number(savedLocation.longitude)], savedLocation.addressText || savedLocation.name, 'manual');
                      onClose();
                      return;
                    }
                    toast.error('This saved location does not have map coordinates yet');
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-primary/10"
                >
                  <p className="text-sm font-bold text-foreground">{savedLocation.name || savedLocation.type || 'Saved Location'}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{savedLocation.addressText}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              setShowMapPicker(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 font-bold text-primary transition-colors hover:bg-primary/20"
          >
            <MapIcon2 className="h-5 w-5" /> 📍 Choose on Map
          </button>
        </div>
      </div>
    </div>
  );
}
