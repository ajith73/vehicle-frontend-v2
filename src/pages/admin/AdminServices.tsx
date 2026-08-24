import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

type NamedEntity = {
  id: number;
  name: string;
  isFeatured?: boolean;
  orderIndex?: number;
};

type CatalogSectionKey = 'vehicles' | 'services' | 'specific-services';

const endpointMap: Record<CatalogSectionKey, string> = {
  vehicles: '/vehicles',
  services: '/services',
  'specific-services': '/specific-services'
};

export default function AdminServices() {
  const [vehicles, setVehicles] = useState<NamedEntity[]>([]);
  const [services, setServices] = useState<NamedEntity[]>([]);
  const [specificServices, setSpecificServices] = useState<NamedEntity[]>([]);
  const [newValues, setNewValues] = useState<Record<CatalogSectionKey, string>>({
    vehicles: '',
    services: '',
    'specific-services': ''
  });
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadCatalog = async () => {
    try {
      const [vehicleData, serviceData, specificServiceData] = await Promise.all([
        apiClient<NamedEntity[]>('/public/vehicles'),
        apiClient<NamedEntity[]>('/public/services'),
        apiClient<NamedEntity[]>('/public/specific-services')
      ]);
      setVehicles(vehicleData || []);
      setServices(serviceData || []);
      setSpecificServices(specificServiceData || []);
    } catch (error) {
      toast.error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const sections = useMemo(() => ([
    { key: 'vehicles' as const, title: 'Vehicle Types', items: vehicles },
    { key: 'services' as const, title: 'Service Types', items: services },
    { key: 'specific-services' as const, title: 'Specific Services', items: specificServices }
  ]), [vehicles, services, specificServices]);

  const createEntity = async (section: CatalogSectionKey) => {
    const value = newValues[section].trim();
    if (!value) return;
    try {
      await apiClient(`/admin${endpointMap[section]}`, {
        method: 'POST',
        data: { name: value }
      });
      toast.success('Catalog item created');
      setNewValues((current) => ({ ...current, [section]: '' }));
      await loadCatalog();
    } catch (error) {
      toast.error('Failed to create item');
    }
  };

  const updateEntity = async (section: CatalogSectionKey, id: number) => {
    const value = (editing[`${section}-${id}`] || '').trim();
    if (!value) return;
    try {
      await apiClient(`/admin${endpointMap[section]}/${id}`, {
        method: 'PUT',
        data: { name: value }
      });
      toast.success('Catalog item updated');
      await loadCatalog();
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const deleteEntity = async (section: CatalogSectionKey, id: number) => {
    try {
      await apiClient(`/admin${endpointMap[section]}/${id}`, { method: 'DELETE' });
      toast.success('Catalog item deleted');
      await loadCatalog();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-2xl font-black text-foreground mb-1">Service Catalog</h1>
        <p className="text-muted-foreground">Manage the reusable core catalog without changing protected field structure.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {sections.map((section) => (
            <motion.div key={section.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/30">
                <h2 className="font-bold flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" /> {section.title}
                </h2>
              </div>
              <div className="p-4 border-b border-border flex gap-2">
                <input
                  value={newValues[section.key]}
                  onChange={(event) => setNewValues((current) => ({ ...current, [section.key]: event.target.value }))}
                  placeholder={`Add ${section.title.toLowerCase().slice(0, -1)}`}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none"
                />
                <button onClick={() => createEntity(section.key)} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-3 max-h-[540px] overflow-auto">
                {section.items.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="border border-border rounded-xl p-3 bg-background/60">
                    <div className="flex items-center gap-2">
                      <input
                        value={editing[`${section.key}-${item.id}`] ?? item.name}
                        onChange={(event) => setEditing((current) => ({ ...current, [`${section.key}-${item.id}`]: event.target.value }))}
                        className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none"
                      />
                      <button onClick={() => updateEntity(section.key, item.id)} className="bg-secondary text-foreground font-bold p-2 rounded-lg hover:bg-secondary/80">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteEntity(section.key, item.id)} className="bg-destructive/10 text-destructive font-bold p-2 rounded-lg hover:bg-destructive/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-2">
                      ID {item.id} {item.isFeatured ? `• featured order ${item.orderIndex ?? 0}` : ''}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
