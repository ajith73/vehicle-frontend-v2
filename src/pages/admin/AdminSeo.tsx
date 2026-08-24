import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe2, Loader2, Save, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { CityConfigRecord } from '../../types';

type PublicService = {
  id: number;
  name: string;
};

export default function AdminSeo() {
  const [cities, setCities] = useState<CityConfigRecord[]>([]);
  const [services, setServices] = useState<PublicService[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [draftIntro, setDraftIntro] = useState<Record<number, string>>({});

  const loadData = async () => {
    try {
      const [cityData, serviceData] = await Promise.all([
        apiClient<CityConfigRecord[]>('/admin/cities'),
        apiClient<PublicService[]>('/public/services')
      ]);
      setCities(cityData || []);
      setServices(serviceData || []);
    } catch (error) {
      toast.error('Failed to load SEO data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(() => {
    const cityRows = cities.map((city) => ({
      key: `city-${city.id}`,
      type: 'City Page',
      id: city.id,
      title: `Roadside Assistance in ${city.cityName}`,
      slug: `/city/${city.slug}`,
      published: city.updatedAt || '',
      seoStatus: city.seoIntro ? 'Configured' : 'Needs Intro',
      draftValue: draftIntro[city.id] ?? city.seoIntro ?? ''
    }));

    const serviceRows = cities.flatMap((city) =>
      services.map((service) => ({
        key: `service-${city.id}-${service.id}`,
        type: 'Service Landing',
        id: city.id,
        title: `${service.name} in ${city.cityName}`,
        slug: `/services/${city.slug}/${service.name.toLowerCase().replace(/\s+/g, '-')}`,
        published: city.updatedAt || '',
        seoStatus: city.seoIntro ? 'Inherited intro' : 'Needs city intro',
        draftValue: draftIntro[city.id] ?? city.seoIntro ?? ''
      }))
    );

    return [...cityRows, ...serviceRows].filter((row) => {
      const text = `${row.title} ${row.slug} ${row.type}`.toLowerCase();
      return !query || text.includes(query.toLowerCase());
    });
  }, [cities, services, query, draftIntro]);

  const saveCityIntro = async (city: CityConfigRecord) => {
    try {
      await apiClient(`/admin/cities/${city.id}/config`, {
        method: 'PUT',
        data: {
          cityName: city.cityName,
          slug: city.slug,
          stateName: city.stateName || '',
          countryName: city.countryName || '',
          launchState: city.launchState,
          cityTier: city.cityTier || '',
          defaultLanguage: city.defaultLanguage || 'en',
          membershipBenefitsEnabled: city.membershipBenefitsEnabled,
          trustedSupplyThreshold: city.trustedSupplyThreshold || 0,
          rapidResponseEnabled: city.rapidResponseEnabled,
          seoIntro: draftIntro[city.id] ?? city.seoIntro ?? '',
          operationalNotes: city.operationalNotes || '',
          rules: city.rules || {}
        }
      });
      toast.success('City SEO intro updated');
      await loadData();
    } catch (error) {
      toast.error('Failed to update city SEO intro');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] gap-6">
      <div>
        <h1 className="text-2xl font-black text-foreground mb-1">SEO & CMS Management</h1>
        <p className="text-muted-foreground">Dynamic city and service landing inventory sourced from live cities and service catalog records.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 bg-secondary/30">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by page title or slug..." className="bg-transparent border-none outline-none text-sm w-full font-medium" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.slice(0, 24).map((row) => {
              const city = cities.find((item) => item.id === row.id);
              if (!city) return null;
              return (
                <motion.div key={row.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_220px] gap-4 items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <Globe2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-bold text-sm">{row.title}</div>
                        <div className="text-xs font-mono text-muted-foreground">{row.slug}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">{row.type} • {row.seoStatus}</div>
                  </div>
                  <textarea
                    value={row.draftValue}
                    onChange={(event) => setDraftIntro((current) => ({ ...current, [city.id]: event.target.value }))}
                    rows={3}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
                    placeholder={`Write the SEO intro for ${city.cityName}`}
                  />
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground">Launch: {city.launchState}</div>
                    <div className="text-xs text-muted-foreground">Updated: {city.updatedAt ? new Date(city.updatedAt).toLocaleDateString() : 'Not tracked'}</div>
                    <button onClick={() => saveCityIntro(city)} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90">
                      <Save className="w-4 h-4" /> Save Intro
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
