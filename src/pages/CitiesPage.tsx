import { Link } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import { SEO } from '../components/SEO';
import { citySeoConfigs } from '../content/seoLocations';

export default function CitiesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
      <SEO
        title="Cities | RoadResQ"
        description="Explore the Tamil Nadu city pages supported by RoadResQ for roadside assistance, towing, and nearby mechanic discovery."
        url="https://roadresq.in/cities"
      />

      <section className="rounded-[2rem] border border-border/50 bg-card p-8 shadow-sm sm:p-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <MapPin className="h-3.5 w-3.5" /> City Coverage
          </div>
          <h1 className="mt-4 text-3xl font-black text-foreground sm:text-5xl">RoadResQ Cities</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Browse city-specific landing pages for roadside help, towing, puncture repair, and local mechanic discovery across Tamil Nadu.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-border/50 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">City Landing Pages</h2>
            <p className="mt-2 text-sm text-muted-foreground">These routes are now directly available instead of only being embedded inside the home page.</p>
          </div>
          <Link to="/list" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            Search Mechanics <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {citySeoConfigs.map((city) => (
            <Link
              key={city.slug}
              to={`/cities/${city.slug}`}
              className="group rounded-2xl border border-border/40 bg-background/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-wider">{city.region}</span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-foreground group-hover:text-primary transition-colors">{city.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{city.highlights[0]}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {city.nearbyAreas.slice(0, 3).map((area) => (
                  <span key={area} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {area}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
