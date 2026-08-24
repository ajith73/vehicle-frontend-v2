import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/apiClient';
import { Trash2, Plus, Settings, Edit2, X, Check, Save } from 'lucide-react';
import Select from 'react-select';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { SubscriptionPlan } from '../types';

export default function AdminSettings() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specificServices, setSpecificServices] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'types' | 'specific' | 'membership'>('types');

  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [featuredSpecificServices, setFeaturedSpecificServices] = useState<any[]>([]);
  const [savingFeatured, setSavingFeatured] = useState(false);

  const [newVehicle, setNewVehicle] = useState('');
  const [newService, setNewService] = useState('');
  const [newSpecificService, setNewSpecificService] = useState('');

  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [editingVehicleName, setEditingVehicleName] = useState('');
  
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editingServiceName, setEditingServiceName] = useState('');

  const [editingSpecificServiceId, setEditingSpecificServiceId] = useState<number | null>(null);
  const [editingSpecificServiceName, setEditingSpecificServiceName] = useState('');
  
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'danger'|'warning'|'info'|'success', onConfirm: () => void} | null>(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    tier: '',
    description: '',
    priceAmount: '0',
    billingCycle: 'MONTHLY',
    platformFeeDiscountPercent: '0',
    prioritySupport: false,
    priorityDispatch: false,
    trustedOnlyAccess: false,
    isActive: true,
  });

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vData, sData, ssData] = await Promise.all([
        apiClient<any>(`/public/vehicles`), 
        apiClient<any>(`/public/services`),
        apiClient<any>(`/public/specific-services`),
      ]);
      const planData = await apiClient<SubscriptionPlan[]>('/admin/subscription-plans');
      setVehicles(vData);
      setServices(sData);
      setSpecificServices(ssData);
      setSubscriptionPlans(planData);
      
      // Initialize featured selections
      setFeaturedVehicles(
        vData.filter((v: any) => v.isFeatured)
             .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
             .map((v: any) => ({ value: v.id, label: v.name }))
      );
      setFeaturedServices(
        sData.filter((s: any) => s.isFeatured)
             .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
             .map((s: any) => ({ value: s.id, label: s.name }))
      );
      setFeaturedSpecificServices(
        ssData.filter((s: any) => s.isFeatured)
             .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
             .map((s: any) => ({ value: s.id, label: s.name }))
      );
    } catch (err) {
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanForm({
      name: '',
      tier: '',
      description: '',
      priceAmount: '0',
      billingCycle: 'MONTHLY',
      platformFeeDiscountPercent: '0',
      prioritySupport: false,
      priorityDispatch: false,
      trustedOnlyAccess: false,
      isActive: true,
    });
  };

  const fillPlanForm = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      tier: plan.tier,
      description: plan.description || '',
      priceAmount: String(plan.priceAmount ?? 0),
      billingCycle: plan.billingCycle || 'MONTHLY',
      platformFeeDiscountPercent: String(plan.platformFeeDiscountPercent ?? 0),
      prioritySupport: Boolean(plan.prioritySupport),
      priorityDispatch: Boolean(plan.priorityDispatch),
      trustedOnlyAccess: Boolean(plan.trustedOnlyAccess),
      isActive: Boolean(plan.isActive),
    });
  };

  const handlePlanFieldChange = (field: keyof typeof planForm, value: string | boolean) => {
    setPlanForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim() || !planForm.tier.trim()) {
      toast.error('Plan name and tier are required');
      return;
    }

    const payload = {
      name: planForm.name.trim(),
      tier: planForm.tier.trim(),
      description: planForm.description.trim() || undefined,
      priceAmount: Number(planForm.priceAmount || 0),
      billingCycle: planForm.billingCycle.trim() || 'MONTHLY',
      platformFeeDiscountPercent: Number(planForm.platformFeeDiscountPercent || 0),
      prioritySupport: planForm.prioritySupport,
      priorityDispatch: planForm.priorityDispatch,
      trustedOnlyAccess: planForm.trustedOnlyAccess,
      isActive: planForm.isActive,
    };

    setPlanSaving(true);
    const loadingToast = toast.loading(editingPlanId ? 'Updating subscription plan...' : 'Creating subscription plan...');
    try {
      if (editingPlanId) {
        await apiClient(`/admin/subscription-plans/${editingPlanId}`, {
          method: 'PUT',
          data: payload
        });
      } else {
        await apiClient('/admin/subscription-plans', {
          method: 'POST',
          data: payload
        });
      }

      toast.success(editingPlanId ? 'Subscription plan updated' : 'Subscription plan created', { id: loadingToast });
      resetPlanForm();
      fetchData();
      setActiveTab('membership');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save subscription plan'), { id: loadingToast });
    } finally {
      setPlanSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.trim()) return;
    const loadingToast = toast.loading('Adding vehicle...');
    try {
      await apiClient('/admin/vehicles', {
        method: 'POST',
        data: { name: newVehicle }
      });
      toast.success('Vehicle added', { id: loadingToast });
      setNewVehicle('');
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add vehicle'), { id: loadingToast });
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Vehicle Type?',
      message: 'Are you sure you want to delete this vehicle type?',
      type: 'danger',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting vehicle...');
        try {
          await apiClient(`/admin/vehicles/${id}`, {
            method: 'DELETE'
          });
          toast.success('Vehicle deleted', { id: loadingToast });
          fetchData();
        } catch (err) {
          toast.error(getErrorMessage(err, 'Failed to delete vehicle'), { id: loadingToast });
        }
      }
    });
  };

  const handleUpdateVehicle = async (id: number) => {
    if (!editingVehicleName.trim()) return;
    const loadingToast = toast.loading('Updating vehicle...');
    try {
      await apiClient(`/admin/vehicles/${id}`, {
        method: 'PUT',
        data: { name: editingVehicleName }
      });
      toast.success('Vehicle updated', { id: loadingToast });
      setEditingVehicleId(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update vehicle'), { id: loadingToast });
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.trim()) return;
    const loadingToast = toast.loading('Adding service...');
    try {
      await apiClient('/admin/services', {
        method: 'POST',
        data: { name: newService }
      });
      toast.success('Service added', { id: loadingToast });
      setNewService('');
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add service'), { id: loadingToast });
    }
  };

  const handleDeleteService = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Service Type?',
      message: 'Are you sure you want to delete this service type?',
      type: 'danger',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting service...');
        try {
          await apiClient(`/admin/services/${id}`, {
            method: 'DELETE'
          });
          toast.success('Service deleted', { id: loadingToast });
          fetchData();
        } catch (err) {
          toast.error(getErrorMessage(err, 'Failed to delete service'), { id: loadingToast });
        }
      }
    });
  };

  const handleUpdateService = async (id: number) => {
    if (!editingServiceName.trim()) return;
    const loadingToast = toast.loading('Updating service...');
    try {
      await apiClient(`/admin/services/${id}`, {
        method: 'PUT',
        data: { name: editingServiceName }
      });
      toast.success('Service updated', { id: loadingToast });
      setEditingServiceId(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update service'), { id: loadingToast });
    }
  };

  const handleAddSpecificService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecificService.trim()) return;
    const loadingToast = toast.loading('Adding specific service...');
    try {
      await apiClient('/admin/specific-services', {
        method: 'POST',
        data: { name: newSpecificService }
      });
      toast.success('Specific service added', { id: loadingToast });
      setNewSpecificService('');
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add specific service'), { id: loadingToast });
    }
  };

  const handleDeleteSpecificService = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Specific Service?',
      message: 'Are you sure you want to delete this specific service?',
      type: 'danger',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting specific service...');
        try {
          await apiClient(`/admin/specific-services/${id}`, {
            method: 'DELETE'
          });
          toast.success('Specific service deleted', { id: loadingToast });
          fetchData();
        } catch (err) {
          toast.error(getErrorMessage(err, 'Failed to delete specific service'), { id: loadingToast });
        }
      }
    });
  };

  const handleUpdateSpecificService = async (id: number) => {
    if (!editingSpecificServiceName.trim()) return;
    const loadingToast = toast.loading('Updating specific service...');
    try {
      await apiClient(`/admin/specific-services/${id}`, {
        method: 'PUT',
        data: { name: editingSpecificServiceName }
      });
      toast.success('Specific service updated', { id: loadingToast });
      setEditingSpecificServiceId(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update specific service'), { id: loadingToast });
    }
  };

  const handleSaveFeatured = async () => {
    const loadingToast = toast.loading('Saving featured configuration...');
    try {
      setSavingFeatured(true);
      const vehicleIds = featuredVehicles.map(v => v.value);
      const serviceIds = featuredServices.map(s => s.value);
      const specificServiceIds = featuredSpecificServices.map(s => s.value);
      
      await Promise.all([
        apiClient('/admin/vehicles/featured', {
          method: 'PUT',
          data: { ids: vehicleIds }
        }),
        apiClient('/admin/services/featured', {
          method: 'PUT',
          data: { ids: serviceIds }
        }),
        apiClient('/admin/specific-services/featured', {
          method: 'PUT',
          data: { ids: specificServiceIds }
        })
      ]);

      toast.success('Featured configuration saved', { id: loadingToast });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save featured configuration'), { id: loadingToast });
    } finally {
      setSavingFeatured(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          Settings Configuration
        </h1>
      </div>

      <div className="flex border-b border-border mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'types' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('types')}
        >
          Vehicle & Service Types
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'specific' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('specific')}
        >
          Specific Services
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'membership' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('membership')}
        >
          Membership Plans
        </button>
      </div>

      {activeTab === 'types' && (
        <>
          {/* Featured Configuration Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Home Page Configuration</h2>
            <p className="text-sm text-muted-foreground">Select and order the vehicle and service types to highlight on the landing page.</p>
          </div>
          <button
            onClick={handleSaveFeatured}
            disabled={savingFeatured}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {savingFeatured ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Save Featured
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">Featured Vehicle Types</label>
            <Select
              isMulti
              options={vehicles.map(v => ({ value: v.id, label: v.name }))}
              value={featuredVehicles}
              onChange={(selected) => setFeaturedVehicles(selected as any)}
              className="text-foreground"
              classNamePrefix="select"
              placeholder="Select and order vehicles..."
              styles={{
                control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: 'hsl(var(--border))' }),
                menu: (base) => ({ ...base, backgroundColor: 'hsl(var(--card))' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? 'hsl(var(--secondary))' : 'hsl(var(--background))', color: 'hsl(var(--foreground))' }),
                multiValue: (base) => ({ ...base, backgroundColor: 'hsl(var(--primary))', opacity: 0.9 }),
                multiValueLabel: (base) => ({ ...base, color: 'hsl(var(--primary-foreground))' }),
                multiValueRemove: (base) => ({ ...base, color: 'hsl(var(--primary-foreground))', ':hover': { backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' } }),
                input: (base) => ({ ...base, color: 'hsl(var(--foreground))' })
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">Featured Service Types</label>
            <Select
              isMulti
              options={services.map(s => ({ value: s.id, label: s.name }))}
              value={featuredServices}
              onChange={(selected) => setFeaturedServices(selected as any)}
              className="text-foreground"
              classNamePrefix="select"
              placeholder="Select and order services..."
              styles={{
                control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: 'hsl(var(--border))' }),
                menu: (base) => ({ ...base, backgroundColor: 'hsl(var(--card))' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? 'hsl(var(--secondary))' : 'hsl(var(--background))', color: 'hsl(var(--foreground))' }),
                multiValue: (base) => ({ ...base, backgroundColor: 'hsl(var(--primary))', opacity: 0.9 }),
                multiValueLabel: (base) => ({ ...base, color: 'hsl(var(--primary-foreground))' }),
                multiValueRemove: (base) => ({ ...base, color: 'hsl(var(--primary-foreground))', ':hover': { backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' } }),
                input: (base) => ({ ...base, color: 'hsl(var(--foreground))' })
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Vehicle Types</h2>
          
          <form onSubmit={handleAddVehicle} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="E.g. Hovercraft"
              value={newVehicle}
              onChange={(e) => setNewVehicle(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={!newVehicle.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          <div className="bg-background border border-border rounded-lg max-h-[400px] overflow-y-auto">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                {editingVehicleId === v.id ? (
                  <div className="flex flex-1 items-center gap-2 mr-4">
                    <input
                      type="text"
                      value={editingVehicleName}
                      onChange={(e) => setEditingVehicleName(e.target.value)}
                      className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateVehicle(v.id)}
                    />
                    <button onClick={() => handleUpdateVehicle(v.id)} className="text-green-600 hover:bg-green-100 p-1 rounded-md transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingVehicleId(null)} className="text-muted-foreground hover:bg-secondary p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-sm flex-1">{v.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingVehicleId(v.id); setEditingVehicleName(v.name); }}
                        className="text-primary/80 hover:text-primary p-1 rounded-md hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="text-destructive/80 hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {vehicles.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">No vehicles found</div>
            )}
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Service Types</h2>
          
          <form onSubmit={handleAddService} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="E.g. Turbo Replacement"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={!newService.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          <div className="bg-background border border-border rounded-lg max-h-[400px] overflow-y-auto">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                {editingServiceId === s.id ? (
                  <div className="flex flex-1 items-center gap-2 mr-4">
                    <input
                      type="text"
                      value={editingServiceName}
                      onChange={(e) => setEditingServiceName(e.target.value)}
                      className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateService(s.id)}
                    />
                    <button onClick={() => handleUpdateService(s.id)} className="text-green-600 hover:bg-green-100 p-1 rounded-md transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingServiceId(null)} className="text-muted-foreground hover:bg-secondary p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-sm flex-1">{s.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingServiceId(s.id); setEditingServiceName(s.name); }}
                        className="text-primary/80 hover:text-primary p-1 rounded-md hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="text-destructive/80 hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {services.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">No services found</div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {activeTab === 'specific' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
          {/* Specific Services Section */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Specific Services (e.g. Bike Puncture)</h2>
            
            <form onSubmit={handleAddSpecificService} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="E.g. Bike Puncture"
                value={newSpecificService}
                onChange={(e) => setNewSpecificService(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={!newSpecificService.trim()}
                className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="bg-background border border-border rounded-lg max-h-[600px] overflow-y-auto">
              {specificServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  {editingSpecificServiceId === s.id ? (
                    <div className="flex flex-1 items-center gap-2 mr-4">
                      <input
                        type="text"
                        value={editingSpecificServiceName}
                        onChange={(e) => setEditingSpecificServiceName(e.target.value)}
                        className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateSpecificService(s.id)}
                      />
                      <button onClick={() => handleUpdateSpecificService(s.id)} className="text-green-600 hover:bg-green-100 p-1 rounded-md transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingSpecificServiceId(null)} className="text-muted-foreground hover:bg-secondary p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-sm flex-1">{s.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingSpecificServiceId(s.id); setEditingSpecificServiceName(s.name); }}
                          className="text-primary/80 hover:text-primary p-1 rounded-md hover:bg-primary/10 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSpecificService(s.id)}
                          className="text-destructive/80 hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {specificServices.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">No specific services found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'membership' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.3fr] gap-6 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Subscription Plan Setup</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This is the admin UI for the customer membership screen. Create or update plans here, then they appear on `/membership`.
              </p>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => handlePlanFieldChange('name', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="RoadResQ Plus"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tier</label>
                  <input
                    type="text"
                    value={planForm.tier}
                    onChange={(e) => handlePlanFieldChange('tier', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="PLUS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => handlePlanFieldChange('description', e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Priority support and trusted partner preference."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={planForm.priceAmount}
                    onChange={(e) => handlePlanFieldChange('priceAmount', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                  <select
                    value={planForm.billingCycle}
                    onChange={(e) => handlePlanFieldChange('billingCycle', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="YEARLY">YEARLY</option>
                    <option value="ONE_TIME">ONE_TIME</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Platform Fee Discount %</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={planForm.platformFeeDiscountPercent}
                    onChange={(e) => handlePlanFieldChange('platformFeeDiscountPercent', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
                  <input type="checkbox" checked={planForm.prioritySupport} onChange={(e) => handlePlanFieldChange('prioritySupport', e.target.checked)} />
                  Priority support
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
                  <input type="checkbox" checked={planForm.priorityDispatch} onChange={(e) => handlePlanFieldChange('priorityDispatch', e.target.checked)} />
                  Priority dispatch
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
                  <input type="checkbox" checked={planForm.trustedOnlyAccess} onChange={(e) => handlePlanFieldChange('trustedOnlyAccess', e.target.checked)} />
                  Trusted-only access
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
                  <input type="checkbox" checked={planForm.isActive} onChange={(e) => handlePlanFieldChange('isActive', e.target.checked)} />
                  Active plan
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={planSaving}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {editingPlanId ? 'Update Plan' : 'Create Plan'}
                </button>
                {editingPlanId && (
                  <button
                    type="button"
                    onClick={resetPlanForm}
                    className="border border-border px-4 py-2 rounded-lg font-medium hover:bg-secondary transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Configured Plans</h2>
              <p className="text-sm text-muted-foreground mt-1">
                These plans feed the existing membership page used by customers.
              </p>
            </div>

            <div className="space-y-4">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className="border border-border rounded-xl p-4 bg-background/60">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">{plan.tier}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${plan.isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                          {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{plan.description || 'No description added yet.'}</p>
                      <div className="flex flex-wrap gap-2 mt-3 text-xs">
                        <span className="px-2 py-1 rounded border border-border">₹{plan.priceAmount}</span>
                        <span className="px-2 py-1 rounded border border-border">{plan.billingCycle}</span>
                        <span className="px-2 py-1 rounded border border-border">{plan.platformFeeDiscountPercent}% fee discount</span>
                        {plan.prioritySupport && <span className="px-2 py-1 rounded bg-primary/10 text-primary">Priority support</span>}
                        {plan.priorityDispatch && <span className="px-2 py-1 rounded bg-primary/10 text-primary">Priority dispatch</span>}
                        {plan.trustedOnlyAccess && <span className="px-2 py-1 rounded bg-primary/10 text-primary">Trusted access</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => fillPlanForm(plan)}
                      className="inline-flex items-center gap-2 text-primary/80 hover:text-primary p-2 rounded-md hover:bg-primary/10 transition-colors h-fit"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}

              {subscriptionPlans.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  No subscription plans configured yet. Create the first plan here, then customers will see it on the membership page.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog 
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        type={confirmConfig?.type || 'warning'}
        onConfirm={() => {
          if (confirmConfig?.onConfirm) confirmConfig.onConfirm();
        }}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}
