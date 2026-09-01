import React, { useState, useEffect } from 'react';
import { Car, Plus, Settings2, Trash2, Loader2, X } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { VehicleForm } from '../../components/customer/VehicleForm';
import type { VehicleData } from '../../components/customer/VehicleForm';
import { useDataContext } from '../../contexts/DataContext';

export default function CustomerVehiclesPage() {
  const { customerProfile, isLoadingCustomerProfile, refreshCustomerProfile } = useDataContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<VehicleData | undefined>(undefined);
  const profile = customerProfile;

  const handleSave = async (data: VehicleData) => {
    try {
      const currentVehicles = profile?.savedVehicles || [];
      let updatedVehicles;
      
      if (data.id) {
        // Edit
        updatedVehicles = currentVehicles.map((v: any) => v.id === data.id ? { ...data } : v);
      } else {
        // Add new
        const newVehicle = { ...data, id: Date.now().toString() };
        updatedVehicles = [...currentVehicles, newVehicle];
      }

      await apiClient('/customer/profile', {
        method: 'PUT',
        data: { savedVehicles: updatedVehicles }
      });
      
      toast.success('Vehicle saved!');
      setShowForm(false);
      await refreshCustomerProfile();
    } catch (err) {
      toast.error('Failed to save vehicle');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this vehicle?')) return;
    try {
      const currentVehicles = profile?.savedVehicles || [];
      const updatedVehicles = currentVehicles.filter((v: any) => v.id !== id);

      await apiClient('/customer/profile', {
        method: 'PUT',
        data: { savedVehicles: updatedVehicles }
      });
      
      toast.success('Vehicle removed');
      await refreshCustomerProfile();
    } catch (err) {
      toast.error('Failed to remove vehicle');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const currentVehicles = profile?.savedVehicles || [];
      const idx = currentVehicles.findIndex((v: any) => v.id === id);
      if (idx > 0) {
        // Move to front
        const vehicle = currentVehicles.splice(idx, 1)[0];
        currentVehicles.unshift(vehicle);

        await apiClient('/customer/profile', {
          method: 'PUT',
          data: { savedVehicles: currentVehicles }
        });
        toast.success('Default vehicle updated');
        await refreshCustomerProfile();
      }
    } catch (err) {
      toast.error('Failed to update default vehicle');
    }
  };

  const openForm = (vehicle?: any) => {
    if (vehicle) {
      setFormData(vehicle);
    } else {
      setFormData(undefined);
    }
    setShowForm(true);
  };

  useEffect(() => {
    void refreshCustomerProfile();
  }, [refreshCustomerProfile]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-foreground">My Vehicles</h1>
        {!showForm && (
          <button onClick={() => openForm()} className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32 flex flex-col gap-4 relative">
        
        {isLoadingCustomerProfile ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {showForm ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card border border-border rounded-[2rem] p-6 shadow-xl relative"
              >
                <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-2 bg-secondary rounded-full hover:bg-secondary/80">
                  <X className="w-4 h-4" />
                </button>
                <h2 className="text-xl font-black mb-6">{formData?.id ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
                <VehicleForm 
                  initialData={formData}
                  onSubmit={handleSave}
                />
              </motion.div>
            ) : profile?.savedVehicles?.length > 0 ? (
              profile.savedVehicles.map((v: any, index: number) => (
                <motion.div 
                  key={v.id || index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-card rounded-[2rem] p-6 relative overflow-hidden transition-all ${index === 0 ? 'border-2 border-primary shadow-[0_10px_30px_rgba(var(--primary),0.1)]' : 'border border-border shadow-sm'}`}
                >
                  {index === 0 && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
                      Default
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${index === 0 ? 'bg-primary/10' : 'bg-secondary'}`}>
                      <Car className={`w-8 h-8 ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h2 className="font-black text-xl text-foreground">{v.make} {v.model}</h2>
                      <p className="text-sm font-semibold text-muted-foreground mt-1">{v.type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
                     <div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Registration</p>
                       <p className="text-sm font-bold border border-border inline-block px-2 py-0.5 rounded uppercase tracking-wider">{v.plate}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Fuel Type</p>
                       <p className="text-sm font-bold">{v.fuelType}</p>
                     </div>
                  </div>

                  <div className="flex gap-2">
                    {index !== 0 && (
                      <button onClick={() => handleSetDefault(v.id)} className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-xl text-sm font-bold hover:bg-secondary/80 transition-colors">
                        Set Default
                      </button>
                    )}
                    <button onClick={() => openForm(v)} className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-xl text-sm font-bold hover:bg-secondary/80 transition-colors">
                      <Settings2 className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive px-4 rounded-xl text-sm font-bold hover:bg-destructive/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">No vehicles added</h3>
                <p className="text-muted-foreground text-sm mt-2 mb-6">Add your vehicles to quickly request service.</p>
                <button onClick={() => openForm()} className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full hover:opacity-90 shadow-md">
                  Add Vehicle
                </button>
              </div>
            )}
          </AnimatePresence>
        )}

      </main>
    </div>
  );
}
