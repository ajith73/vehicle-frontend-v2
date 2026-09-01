import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Star, MoreVertical, Loader2, X, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDataContext } from '../../contexts/DataContext';

export default function CustomerSavedLocationsPage() {
  const { customerProfile, isLoadingCustomerProfile, refreshCustomerProfile } = useDataContext();
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    addressText: '',
    type: 'Home' // Home, Office, Other
  });

  const profile = customerProfile;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentLocations = profile?.savedLocations || [];
      let updatedLocations;
      
      if (formData.id) {
        // Edit
        updatedLocations = currentLocations.map((l: any) => l.id === formData.id ? { ...formData } : l);
      } else {
        // Add new
        const newLocation = { ...formData, id: Date.now().toString() };
        updatedLocations = [...currentLocations, newLocation];
      }

      await apiClient('/customer/profile', {
        method: 'PUT',
        data: { savedLocations: updatedLocations }
      });
      
      toast.success('Location saved!');
      setShowForm(false);
      await refreshCustomerProfile();
    } catch (err) {
      toast.error('Failed to save location');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this location?')) return;
    try {
      const currentLocations = profile?.savedLocations || [];
      const updatedLocations = currentLocations.filter((l: any) => l.id !== id);

      await apiClient('/customer/profile', {
        method: 'PUT',
        data: { savedLocations: updatedLocations }
      });
      
      toast.success('Location removed');
      await refreshCustomerProfile();
    } catch (err) {
      toast.error('Failed to remove location');
    }
  };

  const openForm = (location?: any) => {
    if (location) {
      setFormData(location);
    } else {
      setFormData({ id: '', name: '', addressText: '', type: 'Other' });
    }
    setShowForm(true);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Home': return <MapPin className="w-6 h-6 text-blue-500" />;
      case 'Office': return <Star className="w-6 h-6 text-amber-500" />;
      default: return <MapPin className="w-6 h-6 text-primary" />;
    }
  };
  
  const getBgForType = (type: string) => {
    switch (type) {
      case 'Home': return 'bg-blue-500/10';
      case 'Office': return 'bg-amber-500/10';
      default: return 'bg-primary/10';
    }
  };

  useEffect(() => {
    void refreshCustomerProfile();
  }, [refreshCustomerProfile]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-foreground">Saved Locations</h1>
        {!showForm && (
          <button onClick={() => openForm()} className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32 flex flex-col gap-3">
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
                <h2 className="text-xl font-black mb-6">{formData.id ? 'Edit Location' : 'Add Location'}</h2>
                
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-secondary p-3 rounded-xl border border-border focus:border-primary outline-none" placeholder="e.g. Home" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Full Address</label>
                    <textarea required value={formData.addressText} onChange={e => setFormData({...formData, addressText: e.target.value})} className="w-full bg-secondary p-3 rounded-xl border border-border focus:border-primary outline-none min-h-[80px]" placeholder="123 Main St..." />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-secondary p-3 rounded-xl border border-border focus:border-primary outline-none">
                      <option>Home</option>
                      <option>Office</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <button type="submit" className="w-full bg-primary text-primary-foreground font-bold p-4 rounded-xl mt-4 shadow-md hover:opacity-90">
                    Save Location
                  </button>
                </form>
              </motion.div>
            ) : profile?.savedLocations?.length > 0 ? (
              profile.savedLocations.map((loc: any) => (
                <motion.div 
                  key={loc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm group hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getBgForType(loc.type)}`}>
                      {getIconForType(loc.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{loc.name || loc.type}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 pr-4">{loc.addressText}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openForm(loc)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-secondary rounded-full">
                       <MoreVertical className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(loc.id)} className="p-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors bg-secondary rounded-full">
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">No locations added</h3>
                <p className="text-muted-foreground text-sm mt-2 mb-6">Save locations to quickly select them when requesting service.</p>
                <button onClick={() => openForm()} className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full hover:opacity-90 shadow-md">
                  Add Location
                </button>
              </div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
