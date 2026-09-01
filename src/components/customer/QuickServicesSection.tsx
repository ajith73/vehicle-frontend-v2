import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ChevronUp, ChevronDown } from 'lucide-react';
import { useDataContext } from '../../contexts/DataContext';
import { SERVICE_IMAGES, DEFAULT_SERVICE_IMAGE } from '../../utils/serviceImages';

interface QuickServicesSectionProps {
  showAllServices: boolean;
  setShowAllServices: (show: boolean) => void;
  handleProtectedAction: (e: React.MouseEvent, path: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}

export const QuickServicesSection: React.FC<QuickServicesSectionProps> = ({
  showAllServices,
  setShowAllServices,
  handleProtectedAction,
  navigate
}) => {
  const { services, isLoadingData } = useDataContext();
  const hasServices = services.length > 0;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-foreground">Quick Services</h2>
        {!isLoadingData && hasServices && services.some((service) => service.isFeatured) && services.some((service) => !service.isFeatured) ? (
          <button
            onClick={() => setShowAllServices(!showAllServices)}
            className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex"
          >
            {showAllServices ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showAllServices ? 'Show Less' : 'Show All'}
          </button>
        ) : null}
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto pb-2 hide-scrollbar sm:grid sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {isLoadingData ? (
          Array(7).fill(0).map((_, i) => (
            <div key={i} className="h-24 w-28 shrink-0 rounded-2xl border-2 border-border/50 bg-secondary/50 animate-pulse sm:h-36 sm:w-full lg:h-40"></div>
          ))
        ) : !hasServices ? (
          <div className="min-w-full sm:col-span-3 lg:col-span-4 xl:col-span-5">
            <div className="rounded-2xl border border-border bg-card px-4 py-6 text-center shadow-sm sm:px-6">
              <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground sm:max-w-md">
                Services are loading right now. Please refresh in a moment.
              </p>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={(e) => {
                handleProtectedAction(e as any, '/customer/request');
                navigate('/customer/request');
              }}
              className="flex h-32 w-28 snap-start flex-none flex-col items-center justify-center gap-3 rounded-2xl border border-border/40 bg-card/80 text-center backdrop-blur-sm transition-all active:scale-95 hover:scale-[1.02] hover:border-primary/50 hover:bg-card hover:shadow-md group sm:h-36 sm:w-full sm:px-3 lg:h-40"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 p-2 text-primary transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
                <Zap className="h-7 w-7 text-current sm:h-8 sm:w-8" />
              </div>
              <span className="px-2 text-center text-[11px] font-bold leading-tight text-foreground sm:text-sm">All Services</span>
            </button>
            {services
              .filter((service) => showAllServices || service.isFeatured || (!showAllServices && services.every((item) => !item.isFeatured)))
              .map((service) => {
                const imageSrc = SERVICE_IMAGES[service.name] || service.imageUrl || DEFAULT_SERVICE_IMAGE;
                return (
                  <button
                    key={service.name}
                    onClick={(e) => {
                      handleProtectedAction(e as any, '/customer/request');
                      navigate(`/customer/request?service=${service.name}`);
                    }}
                    className="flex h-32 w-28 snap-start flex-none flex-col items-center justify-center gap-3 rounded-2xl border border-border/40 bg-card/80 text-center backdrop-blur-sm transition-all active:scale-95 hover:scale-[1.02] hover:border-primary/50 hover:bg-card hover:shadow-md group sm:h-36 sm:w-full sm:px-3 lg:h-40"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/70 p-2 transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
                      <img src={imageSrc} alt={service.name} className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
                    </div>
                    <span className="px-2 text-center text-[11px] font-bold leading-tight text-foreground line-clamp-2 sm:text-sm">{service.name}</span>
                  </button>
                );
              })}
            {services.some((service) => service.isFeatured) && services.some((service) => !service.isFeatured) && (
              <button
                onClick={() => setShowAllServices(!showAllServices)}
                className="flex h-32 w-28 snap-start flex-none flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/40 bg-transparent text-muted-foreground transition-all hover:border-primary/50 hover:text-primary active:scale-95 sm:h-36 sm:w-full lg:hidden"
              >
                <div className="flex items-center justify-center">
                  {showAllServices ? <ChevronUp className="h-8 w-8" /> : <ChevronDown className="h-8 w-8" />}
                </div>
                <span className="px-1 text-center text-[11px] font-bold leading-tight sm:text-sm">{showAllServices ? 'Show Less' : 'Show More'}</span>
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
};
