import React, { useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import { Loader2 } from 'lucide-react';

const carMakeOptions = [
  { value: 'Maruti Suzuki', label: 'Maruti Suzuki' },
  { value: 'Hyundai', label: 'Hyundai' },
  { value: 'Tata', label: 'Tata' },
  { value: 'Mahindra', label: 'Mahindra' },
  { value: 'Kia', label: 'Kia' },
  { value: 'Toyota', label: 'Toyota' },
  { value: 'Honda', label: 'Honda' },
  { value: 'Renault', label: 'Renault' },
  { value: 'MG', label: 'MG' },
  { value: 'Volkswagen', label: 'Volkswagen' },
  { value: 'Skoda', label: 'Skoda' },
  { value: 'Nissan', label: 'Nissan' }
];

const bikeMakeOptions = [
  { value: 'Hero', label: 'Hero' },
  { value: 'Honda', label: 'Honda' },
  { value: 'TVS', label: 'TVS' },
  { value: 'Bajaj', label: 'Bajaj' },
  { value: 'Royal Enfield', label: 'Royal Enfield' },
  { value: 'Yamaha', label: 'Yamaha' },
  { value: 'Suzuki', label: 'Suzuki' },
  { value: 'KTM', label: 'KTM' }
];

const carModelOptions = [
  { value: 'Swift', label: 'Swift' },
  { value: 'Baleno', label: 'Baleno' },
  { value: 'Creta', label: 'Creta' },
  { value: 'Venue', label: 'Venue' },
  { value: 'Nexon', label: 'Nexon' },
  { value: 'Punch', label: 'Punch' },
  { value: 'Scorpio', label: 'Scorpio' },
  { value: 'Thar', label: 'Thar' },
  { value: 'XUV700', label: 'XUV700' },
  { value: 'Seltos', label: 'Seltos' },
  { value: 'Innova', label: 'Innova' },
  { value: 'Fortuner', label: 'Fortuner' },
  { value: 'City', label: 'City' }
];

const bikeModelOptions = [
  { value: 'Splendor', label: 'Splendor' },
  { value: 'Activa', label: 'Activa' },
  { value: 'Jupiter', label: 'Jupiter' },
  { value: 'Pulsar', label: 'Pulsar' },
  { value: 'Classic 350', label: 'Classic 350' },
  { value: 'R15', label: 'R15' },
  { value: 'Access', label: 'Access' },
  { value: 'Duke', label: 'Duke' }
];

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: 'hsl(var(--secondary))',
    borderColor: state.isFocused ? 'hsl(var(--primary))' : 'transparent',
    borderRadius: '0.75rem',
    padding: '0.25rem',
    boxShadow: 'none',
    '&:hover': {
      borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))'
    }
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: 'hsl(var(--card))',
    color: 'hsl(var(--foreground))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    zIndex: 9999
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'color-mix(in srgb, hsl(var(--primary)) 12%, hsl(var(--card)))' : 'transparent',
    color: 'hsl(var(--foreground))',
    cursor: 'pointer'
  }),
  singleValue: (base: any) => ({
    ...base,
    color: 'hsl(var(--foreground))'
  }),
  input: (base: any) => ({
    ...base,
    color: 'hsl(var(--foreground))'
  })
};

export interface VehicleData {
  id?: string;
  make: string;
  model: string;
  plate: string;
  fuelType: string;
  type: string;
}

interface VehicleFormProps {
  initialData?: VehicleData;
  onSubmit: (data: VehicleData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export function VehicleForm({ initialData, onSubmit, onCancel, loading = false, submitLabel = 'Save Vehicle' }: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleData>({
    id: initialData?.id || '',
    make: initialData?.make || '',
    model: initialData?.model || '',
    plate: initialData?.plate || '',
    fuelType: initialData?.fuelType || 'Petrol',
    type: initialData?.type || 'Car'
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldValue = (field: keyof VehicleData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateVehicle = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.make.trim()) {
      nextErrors.make = 'Select or type the vehicle brand';
    }
    if (!formData.model.trim()) {
      nextErrors.model = 'Select or type the vehicle model';
    }
    if (!formData.plate.trim()) {
      nextErrors.plate = 'Enter the vehicle registration number';
    } else if (formData.plate.replace(/[^A-Z0-9]/g, '').length < 6) {
      nextErrors.plate = 'Enter a valid registration number';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVehicle()) return;
    await onSubmit(formData);
  };

  const getFieldClassName = (field: string) =>
    `w-full rounded-xl border p-3 outline-none transition-colors ${
      fieldErrors[field]
        ? 'border-red-500 bg-red-500/5 focus:border-red-500'
        : 'border-border bg-secondary focus:border-primary'
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Make (Brand)</label>
        <CreatableSelect
          options={formData.type.includes('Bike') ? bikeMakeOptions : carMakeOptions}
          value={formData.make ? { value: formData.make, label: formData.make } : null}
          onChange={(newValue: any) => setFieldValue('make', newValue?.value || '')}
          placeholder="Select or type brand..."
          styles={selectStyles}
          classNamePrefix="vehicle-select"
          isClearable
        />
        {fieldErrors.make ? <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.make}</p> : null}
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Model</label>
        <CreatableSelect
          options={formData.type.includes('Bike') ? bikeModelOptions : carModelOptions}
          value={formData.model ? { value: formData.model, label: formData.model } : null}
          onChange={(newValue: any) => setFieldValue('model', newValue?.value || '')}
          placeholder="Select or type model..."
          styles={selectStyles}
          classNamePrefix="vehicle-select"
          isClearable
        />
        {fieldErrors.model ? <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.model}</p> : null}
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">License Plate</label>
        <input 
          type="text" 
          value={formData.plate} 
          onChange={e => setFieldValue('plate', e.target.value.toUpperCase())} 
          className={`${getFieldClassName('plate')} uppercase`} 
          placeholder="e.g. TN 38 BX 1234" 
        />
        {fieldErrors.plate ? <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.plate}</p> : null}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Fuel Type</label>
          <select value={formData.fuelType} onChange={e => setFieldValue('fuelType', e.target.value)} className={getFieldClassName('fuelType')}>
            <option>Petrol</option>
            <option>Diesel</option>
            <option>EV</option>
            <option>Hybrid</option>
            <option>CNG</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
          <select value={formData.type} onChange={e => setFieldValue('type', e.target.value)} className={getFieldClassName('type')}>
            <option>Car</option>
            <option>Bike/Scooter</option>
            <option>SUV</option>
            <option>Van</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-primary text-primary-foreground font-bold p-4 rounded-xl mt-4 shadow-md hover:opacity-90 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : submitLabel}
      </button>
      
      {onCancel && (
        <button 
          type="button" 
          onClick={onCancel}
          className="w-full p-4 font-bold text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
