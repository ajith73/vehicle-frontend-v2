import { Link } from 'react-router-dom';
import { ChevronRight, Search, Wrench } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useDataContext } from '../contexts/DataContext';
import { citySeoConfigs, serviceSeoConfigs } from '../content/seoLocations';
import { getServiceIcon } from '../utils/iconUtils';

export default function ServicesPage() {
  const { services, isLoadingData } = useDataContext();
  const featuredServices = services.length > 0 ? services.slice(0, 12) : serviceSeoConfigs.map((service) => ({ id: service.slug, name: service.name }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
      <SEO
        title="Services | RoadResQ"
        description="Explore roadside assistance, towing, puncture repair, battery help, and mechanic discovery services available through RoadResQ."
        url="https://roadresq.in/services"
      />

      <section className="rounded-[2rem] border border-border/50 bg-card p-8 shadow-sm sm:p-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Wrench className="h-3.5 w-3.5" /> Service Directory
          </div>
          <h1 className="mt-4 text-3xl font-black text-foreground sm:text-5xl">Explore RoadResQ Services</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Browse the categories customers use when they need urgent roadside help, towing, puncture repair, battery assistance, or nearby vehicle mechanics.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-border/50 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">Popular Service Paths</h2>
            <p className="mt-2 text-sm text-muted-foreground">Use these shortcuts to jump into city-aware service landing flows.</p>
          </div>
          <Link to="/map" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            Get Help Now <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredServices.map((service: any) => {
            const Icon = getServiceIcon(service.name);
            const serviceSlug = String(service.name || '').toLowerCase().replace(/\s+/g, '-');
            const sampleCity = citySeoConfigs[0];

            return (
              <Link
                key={service.id || service.name}
                to={`/services/${serviceSlug}/in/${sampleCity.slug}`}
                className="group rounded-2xl border border-border/40 bg-background/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground group-hover:text-primary transition-colors">{service.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open a city-level landing page and localized mechanic discovery path for this service.
                </p>
              </Link>
            );
          })}
        </div>

        {isLoadingData && (
          <p className="mt-4 text-sm text-muted-foreground">Loading live service catalog...</p>
        )}
      </section>

      <section className="mt-8 rounded-[2rem] border border-border/50 bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-black text-foreground">SEO Service Templates</h2>
        <p className="mt-2 text-sm text-muted-foreground">These are the reusable service SEO structures currently mapped in the app.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {serviceSeoConfigs.map((service) => (
            <div key={service.slug} className="rounded-2xl border border-border/40 bg-background/50 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Search className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-wider">{service.shortLabel}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-foreground">{service.name}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {service.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
