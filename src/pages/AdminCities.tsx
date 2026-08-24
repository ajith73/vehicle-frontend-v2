import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Plus, Radar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../api/apiClient';
import type { CityConfigRecord, ServiceAvailabilityRuleRecord, ZoneConfigRecord } from '../types';

type CityDraftMap = Record<number, {
  cityName: string;
  slug: string;
  stateName: string;
  launchState: string;
  cityTier: string;
  defaultLanguage: string;
  trustedSupplyThreshold: string;
  seoIntro: string;
  operationalNotes: string;
  membershipBenefitsEnabled: boolean;
  rapidResponseEnabled: boolean;
}>;

type RuleDraftMap = Record<number, {
  availabilityState: string;
  customerMessage: string;
  minTrustedPartners: string;
  rapidResponseOnly: boolean;
}>;

export default function AdminCities() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityConfigRecord[]>([]);
  const [zones, setZones] = useState<ZoneConfigRecord[]>([]);
  const [services, setServices] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [savingCityId, setSavingCityId] = useState<number | null>(null);
  const [savingZoneId, setSavingZoneId] = useState<number | null>(null);
  const [savingRuleId, setSavingRuleId] = useState<number | null>(null);
  const [cityDrafts, setCityDrafts] = useState<CityDraftMap>({});
  const [ruleDrafts, setRuleDrafts] = useState<RuleDraftMap>({});
  const [newZone, setNewZone] = useState({
    cityConfigId: '',
    cityName: '',
    zoneName: '',
    launchState: 'PLANNED',
    rapidResponseEnabled: false,
    standbySupplyTarget: '',
    etaExpectationMinutes: '',
    pricingMultiplier: '',
    serviceAvailabilityMode: 'NORMAL',
    operationalNotes: '',
  });
  const [newRule, setNewRule] = useState({
    serviceTypeId: '',
    cityConfigId: '',
    citySlug: '',
    zoneSlug: '',
    availabilityState: 'ENABLED',
    customerMessage: '',
    minTrustedPartners: '',
    rapidResponseOnly: false,
  });
  const [newPricingRule, setNewPricingRule] = useState({
    id: '',
    cityConfigId: '',
    citySlug: '',
    serviceTypeId: '',
    ruleName: '',
    pricingMode: 'MULTIPLIER',
    multiplier: '',
    flatFee: '',
    taxPercent: '',
    memberDiscountPercent: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cityData, zoneData, serviceData] = await Promise.all([
        apiClient<CityConfigRecord[]>('/admin/cities'),
        apiClient<ZoneConfigRecord[]>('/admin/zones'),
        apiClient<Array<{ id: number; name: string }>>('/public/services'),
      ]);
      setCities(cityData);
      setZones(zoneData);
      setServices(serviceData);

      const cityDraftPayload: CityDraftMap = {};
      cityData.forEach((city) => {
        cityDraftPayload[city.id] = {
          cityName: city.cityName || '',
          slug: city.slug || '',
          stateName: city.stateName || '',
          launchState: city.launchState || 'PLANNED',
          cityTier: city.cityTier || '',
          defaultLanguage: city.defaultLanguage || '',
          trustedSupplyThreshold: city.trustedSupplyThreshold != null ? String(city.trustedSupplyThreshold) : '',
          seoIntro: city.seoIntro || '',
          operationalNotes: city.operationalNotes || '',
          membershipBenefitsEnabled: Boolean(city.membershipBenefitsEnabled),
          rapidResponseEnabled: Boolean(city.rapidResponseEnabled),
        };
      });
      setCityDrafts(cityDraftPayload);

      const serviceRulePayload: RuleDraftMap = {};
      cityData.forEach((city) => {
        (city.serviceRules || []).forEach((rule) => {
          serviceRulePayload[rule.id] = {
            availabilityState: rule.availabilityState || 'ENABLED',
            customerMessage: rule.customerMessage || '',
            minTrustedPartners: rule.minTrustedPartners != null ? String(rule.minTrustedPartners) : '',
            rapidResponseOnly: Boolean(rule.rapidResponseOnly),
          };
        });
      });
      setRuleDrafts(serviceRulePayload);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load city control panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const cityOptions = useMemo(() => cities.map((city) => ({ value: city.id, label: city.cityName })), [cities]);

  const updateCity = async (cityId: number) => {
    const draft = cityDrafts[cityId];
    if (!draft) return;
    setSavingCityId(cityId);
    try {
      await apiClient(`/admin/cities/${cityId}/config`, {
        method: 'PUT',
        data: {
          cityName: draft.cityName,
          slug: draft.slug,
          stateName: draft.stateName,
          launchState: draft.launchState,
          cityTier: draft.cityTier,
          defaultLanguage: draft.defaultLanguage,
          trustedSupplyThreshold: draft.trustedSupplyThreshold ? Number(draft.trustedSupplyThreshold) : undefined,
          seoIntro: draft.seoIntro || undefined,
          operationalNotes: draft.operationalNotes || undefined,
          membershipBenefitsEnabled: draft.membershipBenefitsEnabled,
          rapidResponseEnabled: draft.rapidResponseEnabled,
        }
      });
      toast.success('City config updated');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update city config');
    } finally {
      setSavingCityId(null);
    }
  };

  const createZone = async () => {
    if (!newZone.cityName.trim() || !newZone.zoneName.trim()) {
      toast.error('City name and zone name are required');
      return;
    }
    setSavingZoneId(-1);
    try {
      await apiClient('/admin/zones', {
        method: 'POST',
        data: {
          cityConfigId: newZone.cityConfigId ? Number(newZone.cityConfigId) : undefined,
          cityName: newZone.cityName.trim(),
          zoneName: newZone.zoneName.trim(),
          launchState: newZone.launchState,
          rapidResponseEnabled: newZone.rapidResponseEnabled,
          standbySupplyTarget: newZone.standbySupplyTarget ? Number(newZone.standbySupplyTarget) : undefined,
          etaExpectationMinutes: newZone.etaExpectationMinutes ? Number(newZone.etaExpectationMinutes) : undefined,
          pricingMultiplier: newZone.pricingMultiplier ? Number(newZone.pricingMultiplier) : undefined,
          serviceAvailabilityMode: newZone.serviceAvailabilityMode,
          operationalNotes: newZone.operationalNotes || undefined,
        }
      });
      toast.success('Zone created');
      setNewZone({
        cityConfigId: '',
        cityName: '',
        zoneName: '',
        launchState: 'PLANNED',
        rapidResponseEnabled: false,
        standbySupplyTarget: '',
        etaExpectationMinutes: '',
        pricingMultiplier: '',
        serviceAvailabilityMode: 'NORMAL',
        operationalNotes: '',
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create zone');
    } finally {
      setSavingZoneId(null);
    }
  };

  const updateRule = async (serviceId: number, city: CityConfigRecord, existingRule?: ServiceAvailabilityRuleRecord) => {
    const draft = existingRule ? ruleDrafts[existingRule.id] : null;
    if (!draft) return;
    setSavingRuleId(existingRule?.id || serviceId);
    try {
      await apiClient(`/admin/services/${serviceId}/availability-rules`, {
        method: 'PUT',
        data: {
          cityConfigId: city.id,
          citySlug: city.slug,
          zoneSlug: existingRule?.zoneSlug,
          availabilityState: draft.availabilityState,
          customerMessage: draft.customerMessage || undefined,
          minTrustedPartners: draft.minTrustedPartners ? Number(draft.minTrustedPartners) : undefined,
          rapidResponseOnly: draft.rapidResponseOnly,
        }
      });
      toast.success('Service availability rule updated');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update service rule');
    } finally {
      setSavingRuleId(null);
    }
  };

  const createRule = async () => {
    if (!newRule.serviceTypeId || !newRule.cityConfigId) {
      toast.error('Select a city and service first');
      return;
    }
    setSavingRuleId(-2);
    try {
      await apiClient(`/admin/services/${newRule.serviceTypeId}/availability-rules`, {
        method: 'PUT',
        data: {
          cityConfigId: Number(newRule.cityConfigId),
          citySlug: newRule.citySlug || undefined,
          zoneSlug: newRule.zoneSlug || undefined,
          availabilityState: newRule.availabilityState,
          customerMessage: newRule.customerMessage || undefined,
          minTrustedPartners: newRule.minTrustedPartners ? Number(newRule.minTrustedPartners) : undefined,
          rapidResponseOnly: newRule.rapidResponseOnly,
        }
      });
      toast.success('Service rule created');
      setNewRule({
        serviceTypeId: '',
        cityConfigId: '',
        citySlug: '',
        zoneSlug: '',
        availabilityState: 'ENABLED',
        customerMessage: '',
        minTrustedPartners: '',
        rapidResponseOnly: false,
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create service rule');
    } finally {
      setSavingRuleId(null);
    }
  };

  const createPricingRule = async () => {
    if (!newPricingRule.id || !newPricingRule.ruleName.trim()) {
      toast.error('Pricing rule id and name are required');
      return;
    }
    setSavingRuleId(-3);
    try {
      await apiClient(`/admin/pricing/regional-rules/${newPricingRule.id}`, {
        method: 'PUT',
        data: {
          cityConfigId: newPricingRule.cityConfigId ? Number(newPricingRule.cityConfigId) : undefined,
          citySlug: newPricingRule.citySlug || undefined,
          serviceTypeId: newPricingRule.serviceTypeId ? Number(newPricingRule.serviceTypeId) : undefined,
          ruleName: newPricingRule.ruleName.trim(),
          pricingMode: newPricingRule.pricingMode,
          multiplier: newPricingRule.multiplier ? Number(newPricingRule.multiplier) : undefined,
          flatFee: newPricingRule.flatFee ? Number(newPricingRule.flatFee) : undefined,
          taxPercent: newPricingRule.taxPercent ? Number(newPricingRule.taxPercent) : undefined,
          memberDiscountPercent: newPricingRule.memberDiscountPercent ? Number(newPricingRule.memberDiscountPercent) : undefined,
        }
      });
      toast.success('Regional pricing rule saved');
      setNewPricingRule({
        id: '',
        cityConfigId: '',
        citySlug: '',
        serviceTypeId: '',
        ruleName: '',
        pricingMode: 'MULTIPLIER',
        multiplier: '',
        flatFee: '',
        taxPercent: '',
        memberDiscountPercent: '',
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save pricing rule');
    } finally {
      setSavingRuleId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">City Control Panel</h1>
            <p className="text-muted-foreground mt-1 font-medium">Backend-driven multi-city launch, zone, and service availability controls.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            {cities.map((city) => {
              const draft = cityDrafts[city.id];
              if (!draft) return null;
              return (
                <div key={city.id} className="bg-card rounded-2xl shadow-sm border border-border p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        {city.cityName}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">{city.slug} • {city.stateName || 'State not set'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      draft.launchState === 'ACTIVE' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                      draft.launchState === 'LIMITED' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      draft.launchState === 'PAUSED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {draft.launchState}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="City Name" value={draft.cityName} onChange={(value) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, cityName: value } }))} />
                    <Field label="Slug" value={draft.slug} onChange={(value) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, slug: value } }))} />
                    <Field label="State" value={draft.stateName} onChange={(value) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, stateName: value } }))} />
                    <Field label="Tier" value={draft.cityTier} onChange={(value) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, cityTier: value } }))} />
                    <Field label="Language" value={draft.defaultLanguage} onChange={(value) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, defaultLanguage: value } }))} />
                    <Field label="Trusted Supply Threshold" value={draft.trustedSupplyThreshold} onChange={(value) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, trustedSupplyThreshold: value } }))} />
                    <div>
                      <label className="block text-sm font-medium mb-1">Launch State</label>
                      <select
                        value={draft.launchState}
                        onChange={(event) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, launchState: event.target.value } }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="PLANNED">PLANNED</option>
                        <option value="LIMITED">LIMITED</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PAUSED">PAUSED</option>
                      </select>
                    </div>
                    <div className="grid gap-3">
                      <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-sm">
                        <input type="checkbox" checked={draft.membershipBenefitsEnabled} onChange={(event) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, membershipBenefitsEnabled: event.target.checked } }))} />
                        Membership enabled
                      </label>
                      <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-sm">
                        <input type="checkbox" checked={draft.rapidResponseEnabled} onChange={(event) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, rapidResponseEnabled: event.target.checked } }))} />
                        Rapid response enabled
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 mt-4">
                    <TextArea label="SEO Intro" value={draft.seoIntro} onChange={(value) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, seoIntro: value } }))} />
                    <TextArea label="Operational Notes" value={draft.operationalNotes} onChange={(value) => setCityDrafts((current) => ({ ...current, [city.id]: { ...draft, operationalNotes: value } }))} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Zones: {city.zones?.length || 0} • Service rules: {city.serviceRules?.length || 0} • Pricing rules: {city.pricingRules?.length || 0}
                    </p>
                    <button
                      onClick={() => updateCity(city.id)}
                      disabled={savingCityId === city.id}
                      className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      Save city config
                    </button>
                  </div>

                  {(city.serviceRules || []).length > 0 && (
                    <div className="mt-5 space-y-3 border-t border-border pt-4">
                      <p className="text-sm font-bold text-foreground">Service availability rules</p>
                      {(city.serviceRules || []).map((rule) => {
                        const ruleDraft = ruleDrafts[rule.id];
                        if (!ruleDraft) return null;
                        return (
                          <div key={rule.id} className="rounded-xl border border-border bg-background/70 p-4">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="text-sm font-bold text-foreground">{rule.ServiceType?.name || `Service #${rule.serviceTypeId}`}</span>
                              {rule.zoneSlug && <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">{rule.zoneSlug}</span>}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Availability</label>
                                <select
                                  value={ruleDraft.availabilityState}
                                  onChange={(event) => setRuleDrafts((current) => ({ ...current, [rule.id]: { ...ruleDraft, availabilityState: event.target.value } }))}
                                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                >
                                  <option value="ENABLED">ENABLED</option>
                                  <option value="LIMITED">LIMITED</option>
                                  <option value="DISABLED">DISABLED</option>
                                </select>
                              </div>
                              <Field label="Min Trusted Partners" value={ruleDraft.minTrustedPartners} onChange={(value) => setRuleDrafts((current) => ({ ...current, [rule.id]: { ...ruleDraft, minTrustedPartners: value } }))} />
                            </div>
                            <TextArea label="Customer Message" value={ruleDraft.customerMessage} onChange={(value) => setRuleDrafts((current) => ({ ...current, [rule.id]: { ...ruleDraft, customerMessage: value } }))} rows={2} />
                            <label className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2 text-sm">
                              <input type="checkbox" checked={ruleDraft.rapidResponseOnly} onChange={(event) => setRuleDrafts((current) => ({ ...current, [rule.id]: { ...ruleDraft, rapidResponseOnly: event.target.checked } }))} />
                              Rapid response only
                            </label>
                            <button
                              onClick={() => updateRule(rule.serviceTypeId || 0, city, rule)}
                              disabled={savingRuleId === rule.id}
                              className="mt-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-60"
                            >
                              Save service rule
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Radar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Create Zone</h2>
              </div>
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">City Config</label>
                  <select
                    value={newZone.cityConfigId}
                    onChange={(event) => {
                      const selectedCity = cities.find((city) => city.id === Number(event.target.value));
                      setNewZone((current) => ({
                        ...current,
                        cityConfigId: event.target.value,
                        cityName: selectedCity?.cityName || current.cityName
                      }));
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
                  >
                    <option value="">Select city</option>
                    {cityOptions.map((city) => (
                      <option key={city.value} value={city.value}>{city.label}</option>
                    ))}
                  </select>
                </div>
                <Field label="City Name" value={newZone.cityName} onChange={(value) => setNewZone((current) => ({ ...current, cityName: value }))} />
                <Field label="Zone Name" value={newZone.zoneName} onChange={(value) => setNewZone((current) => ({ ...current, zoneName: value }))} />
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Launch State</label>
                    <select value={newZone.launchState} onChange={(event) => setNewZone((current) => ({ ...current, launchState: event.target.value }))} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm">
                      <option value="PLANNED">PLANNED</option>
                      <option value="LIMITED">LIMITED</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PAUSED">PAUSED</option>
                    </select>
                  </div>
                  <Field label="ETA Expectation (min)" value={newZone.etaExpectationMinutes} onChange={(value) => setNewZone((current) => ({ ...current, etaExpectationMinutes: value }))} />
                  <Field label="Standby Supply Target" value={newZone.standbySupplyTarget} onChange={(value) => setNewZone((current) => ({ ...current, standbySupplyTarget: value }))} />
                  <Field label="Pricing Multiplier" value={newZone.pricingMultiplier} onChange={(value) => setNewZone((current) => ({ ...current, pricingMultiplier: value }))} />
                </div>
                <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-sm">
                  <input type="checkbox" checked={newZone.rapidResponseEnabled} onChange={(event) => setNewZone((current) => ({ ...current, rapidResponseEnabled: event.target.checked }))} />
                  Rapid response enabled
                </label>
                <TextArea label="Operational Notes" value={newZone.operationalNotes} onChange={(value) => setNewZone((current) => ({ ...current, operationalNotes: value }))} rows={2} />
                <button onClick={createZone} disabled={savingZoneId === -1} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create zone
                </button>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
              <h2 className="text-lg font-bold text-foreground mb-4">Create Service Availability Rule</h2>
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <select
                    value={newRule.cityConfigId}
                    onChange={(event) => {
                      const selectedCity = cities.find((city) => city.id === Number(event.target.value));
                      setNewRule((current) => ({
                        ...current,
                        cityConfigId: event.target.value,
                        citySlug: selectedCity?.slug || ''
                      }));
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
                  >
                    <option value="">Select city</option>
                    {cityOptions.map((city) => (
                      <option key={city.value} value={city.value}>{city.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Service</label>
                  <select value={newRule.serviceTypeId} onChange={(event) => setNewRule((current) => ({ ...current, serviceTypeId: event.target.value }))} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm">
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zone (Optional)</label>
                  <select value={newRule.zoneSlug} onChange={(event) => setNewRule((current) => ({ ...current, zoneSlug: event.target.value }))} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm">
                    <option value="">City-wide rule</option>
                    {zones
                      .filter((zone) => !newRule.cityConfigId || zone.cityConfigId === Number(newRule.cityConfigId))
                      .map((zone) => (
                        <option key={zone.id} value={zone.slug}>{zone.zoneName}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Availability</label>
                  <select value={newRule.availabilityState} onChange={(event) => setNewRule((current) => ({ ...current, availabilityState: event.target.value }))} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm">
                    <option value="ENABLED">ENABLED</option>
                    <option value="LIMITED">LIMITED</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
                <Field label="Min Trusted Partners" value={newRule.minTrustedPartners} onChange={(value) => setNewRule((current) => ({ ...current, minTrustedPartners: value }))} />
                <TextArea label="Customer Message" value={newRule.customerMessage} onChange={(value) => setNewRule((current) => ({ ...current, customerMessage: value }))} rows={2} />
                <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-sm">
                  <input type="checkbox" checked={newRule.rapidResponseOnly} onChange={(event) => setNewRule((current) => ({ ...current, rapidResponseOnly: event.target.checked }))} />
                  Rapid response only
                </label>
                <button onClick={createRule} disabled={savingRuleId === -2} className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-60">
                  Create service rule
                </button>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
              <h2 className="text-lg font-bold text-foreground mb-4">Create Regional Pricing Rule</h2>
              <div className="grid gap-3">
                <Field label="Rule Id" value={newPricingRule.id} onChange={(value) => setNewPricingRule((current) => ({ ...current, id: value }))} />
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <select
                    value={newPricingRule.cityConfigId}
                    onChange={(event) => {
                      const selectedCity = cities.find((city) => city.id === Number(event.target.value));
                      setNewPricingRule((current) => ({
                        ...current,
                        cityConfigId: event.target.value,
                        citySlug: selectedCity?.slug || ''
                      }));
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
                  >
                    <option value="">Select city</option>
                    {cityOptions.map((city) => (
                      <option key={city.value} value={city.value}>{city.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Service</label>
                  <select value={newPricingRule.serviceTypeId} onChange={(event) => setNewPricingRule((current) => ({ ...current, serviceTypeId: event.target.value }))} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm">
                    <option value="">All services / shared rule</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
                <Field label="Rule Name" value={newPricingRule.ruleName} onChange={(value) => setNewPricingRule((current) => ({ ...current, ruleName: value }))} />
                <div>
                  <label className="block text-sm font-medium mb-1">Pricing Mode</label>
                  <select value={newPricingRule.pricingMode} onChange={(event) => setNewPricingRule((current) => ({ ...current, pricingMode: event.target.value }))} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm">
                    <option value="MULTIPLIER">MULTIPLIER</option>
                    <option value="FLAT_FEE">FLAT_FEE</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Multiplier" value={newPricingRule.multiplier} onChange={(value) => setNewPricingRule((current) => ({ ...current, multiplier: value }))} />
                  <Field label="Flat Fee" value={newPricingRule.flatFee} onChange={(value) => setNewPricingRule((current) => ({ ...current, flatFee: value }))} />
                  <Field label="Tax %" value={newPricingRule.taxPercent} onChange={(value) => setNewPricingRule((current) => ({ ...current, taxPercent: value }))} />
                  <Field label="Member Discount %" value={newPricingRule.memberDiscountPercent} onChange={(value) => setNewPricingRule((current) => ({ ...current, memberDiscountPercent: value }))} />
                </div>
                <button onClick={createPricingRule} disabled={savingRuleId === -3} className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-60">
                  Save pricing rule
                </button>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
              <h2 className="text-lg font-bold text-foreground mb-4">Configured Zones</h2>
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div key={zone.id} className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">{zone.zoneName}</p>
                        <p className="text-xs text-muted-foreground">{zone.cityName} • {zone.slug}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-secondary text-secondary-foreground">{zone.launchState}</span>
                    </div>
                  </div>
                ))}
                {zones.length === 0 && (
                  <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-4 text-center">
                    No zones configured yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}
