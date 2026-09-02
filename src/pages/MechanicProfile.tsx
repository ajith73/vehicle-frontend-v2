import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { apiClient } from '../api/apiClient';
import type { Mechanic } from '../types';
import { CheckCircle2, Clock3, Globe, Mail, MapPin, Navigation, Phone, ShieldCheck, Star, Wrench } from 'lucide-react';
import { MechanicReviews } from '../components/shared/MechanicReviews';
import { LazyImage } from '../components/shared/LazyImage';
import { formatPhoneDisplay } from '../utils/phone';

type ContactNumber = {
  number?: string;
  isWhatsapp?: boolean;
  isTelephone?: boolean;
};

export default function MechanicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const [aggregateRating, setAggregateRating] = useState<{ ratingValue: number; reviewCount: number } | null>(null);

  useEffect(() => {
    const fetchMechanic = async () => {
      try {
        const data = await apiClient<Mechanic>(`/public/mechanics/${id}`);
        setMechanic(data);
        
        // Also fetch reviews to get aggregate rating for Schema
        try {
          const reviewsData = await apiClient<any[]>(`/public/mechanics/${id}/reviews`);
          if (reviewsData && reviewsData.length > 0) {
            let total = 0;
            reviewsData.forEach(r => {
              total += (r.ratingTimeliness + r.ratingFairness + r.ratingRecommendation) / 3;
            });
            setAggregateRating({
              ratingValue: Number((total / reviewsData.length).toFixed(1)),
              reviewCount: reviewsData.length
            });
          }
        } catch (rErr) {
          console.error('Error fetching reviews for schema', rErr);
        }
      } catch (error) {
        console.error('Error fetching mechanic', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchMechanic();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h2 className="text-2xl font-bold mb-4">Mechanic Not Found</h2>
        <p className="text-muted-foreground mb-6">The mechanic profile you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/')} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium">
          Return Home
        </button>
      </div>
    );
  }

  const businessName = mechanic.businessName || mechanic.name || 'Auto Repair Service';
  const locationText = mechanic.city || mechanic.district || mechanic.area || 'Tamil Nadu';
  const phoneEntries = Array.isArray(mechanic.phone)
    ? mechanic.phone as ContactNumber[]
    : mechanic.phone
      ? [{ number: String(mechanic.phone) }]
      : [];
  const emailEntries = Array.isArray(mechanic.emails)
    ? mechanic.emails.filter(Boolean).map(String)
    : mechanic.email
      ? [String(mechanic.email)]
      : [];
  const serviceEntries = Array.isArray(mechanic.services) && mechanic.services.length > 0
    ? mechanic.services.map((service: any) => typeof service === 'string' ? service : service?.name).filter(Boolean)
    : Array.isArray(mechanic.serviceTypes)
      ? mechanic.serviceTypes.map((service: any) => typeof service === 'string' ? service : service?.name).filter(Boolean)
      : [];
  const vehicleEntries = Array.isArray(mechanic.vehicleTypes)
    ? mechanic.vehicleTypes.map((vehicle: any) => typeof vehicle === 'string' ? vehicle : vehicle?.name).filter(Boolean)
    : [];
  const operatingHoursLabel = mechanic.is24Hours || mechanic.is24x7
    ? '24 Hours Open'
    : mechanic.operatingHours || (mechanic.startTime && mechanic.endTime ? `${mechanic.startTime} - ${mechanic.endTime}` : 'Not shared');
  const title = `${businessName} - Auto Repair & Towing in ${locationText}`;
  
  // Format services for description
  const servicesList = serviceEntries.length
    ? serviceEntries.slice(0, 3).join(', ')
    : 'mechanics, towing, roadside assistance';
    
  const description = `Get expert ${servicesList} from ${businessName} in ${locationText}, ${mechanic.state || 'Tamil Nadu'}. Available for emergency vehicle support.`;
  const canonicalUrl = `https://roadresq.in/mechanic/${mechanic.id}`;
  const rawImageUrl = mechanic.image || mechanic.imageUrl || '';
  const imageUrl = rawImageUrl
    ? (rawImageUrl.startsWith('http') ? rawImageUrl : `https://roadresq.in${rawImageUrl.startsWith('/') ? rawImageUrl : `/${rawImageUrl}`}`)
    : "https://roadresq.in/social-share.png";

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "name": businessName,
    "image": imageUrl,
    "@id": canonicalUrl,
    "url": canonicalUrl,
    "telephone": Array.isArray(mechanic.phone) && mechanic.phone.length > 0 ? mechanic.phone[0] : (mechanic.phone || ""),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": mechanic.address || mechanic.area || "",
      "addressLocality": mechanic.city || "",
      "addressRegion": mechanic.state || "Tamil Nadu",
      "addressCountry": "IN"
    },
    ...(mechanic.latitude && mechanic.longitude ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": mechanic.latitude,
        "longitude": mechanic.longitude
      }
    } : {})
  };

  if (aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount
    };
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <SEO 
        title={title}
        description={description}
        url={canonicalUrl}
        image={imageUrl}
        schema={schema}
      />
      
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-muted-foreground hover:text-primary transition-colors font-medium">
          &larr; Back
        </button>
        
        <div className="bg-card rounded-[24px] shadow-xl border border-border overflow-hidden">
          <div className="h-64 sm:h-80 bg-secondary/50 relative">
            {imageUrl && imageUrl !== "https://roadresq.in/social-share.png" ? (
               <LazyImage src={imageUrl} alt={businessName} />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-muted">
                 <Wrench className="w-20 h-20 text-muted-foreground/30" />
               </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md mb-2">{businessName}</h1>
              <p className="text-white/90 flex items-center gap-2 text-lg font-medium drop-shadow-md">
                <MapPin className="w-5 h-5 text-primary" />
                {mechanic.landmark ? `${mechanic.landmark}, ` : ''}{mechanic.area}{mechanic.city ? `, ${mechanic.city}` : ''}
              </p>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Verification</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-bold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      {mechanic.verificationLevel ? `Verified level ${mechanic.verificationLevel}` : 'Pending verification'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Availability</p>
                    <p className="mt-2 text-sm font-bold text-foreground">
                      {mechanic.availabilityState || (mechanic.isOnline ? 'ONLINE' : 'OFFLINE') || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    Contact Information
                  </h3>
                  {phoneEntries.length > 0 || emailEntries.length > 0 || mechanic.websiteUrl ? (
                    <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                      <div className="space-y-3">
                        {phoneEntries.length > 0 ? phoneEntries.map((entry, index) => (
                          <div key={`${entry.number || 'phone'}-${index}`} className="rounded-xl border border-border bg-background/70 p-3">
                            <p className="font-medium text-base">
                              {formatPhoneDisplay(entry.number || '')}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {entry.isTelephone ? 'Landline contact' : 'Mobile contact'}
                              {entry.isWhatsapp ? ' • WhatsApp available' : ''}
                            </p>
                          </div>
                        )) : null}
                        {mechanic.alternatePhone ? (
                          <p className="text-sm text-muted-foreground">Alternate: {mechanic.alternatePhone}</p>
                        ) : null}
                        {emailEntries.length > 0 ? (
                          <div className="space-y-2">
                            {emailEntries.map((email) => (
                              <p key={email} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 text-primary" />
                                <span className="break-all">{email}</span>
                              </p>
                            ))}
                          </div>
                        ) : null}
                        {mechanic.websiteUrl ? (
                          <a
                            href={mechanic.websiteUrl.startsWith('http') ? mechanic.websiteUrl : `https://${mechanic.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            Visit website
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Phone number not available.</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    Location
                  </h3>
                  <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                    <p className="text-foreground">{mechanic.address || `${mechanic.area}, ${mechanic.city}`}</p>
                    <a 
                      href={mechanic.mapLink || `https://maps.google.com/?q=${mechanic.latitude},${mechanic.longitude}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-block mt-3 text-primary font-semibold hover:underline"
                    >
                      Get Directions on Google Maps &rarr;
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                 <div>
                   <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                     <Wrench className="w-5 h-5 text-primary" />
                     Services Offered
                   </h3>
                   <div className="flex flex-wrap gap-2">
                     {serviceEntries.map((service, index) => (
                       <span key={index} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-semibold">
                         {service}
                       </span>
                     ))}
                     {serviceEntries.length === 0 && (
                       <span className="text-muted-foreground italic">Specific services not listed. Please contact to inquire.</span>
                     )}
                   </div>
                 </div>

                 <div className="rounded-2xl border border-border bg-secondary/30 p-5">
                   <h3 className="flex items-center gap-2 text-xl font-bold">
                     <Clock3 className="h-5 w-5 text-primary" />
                     Operating Details
                   </h3>
                   <div className="mt-4 grid gap-4 sm:grid-cols-2">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Hours</p>
                       <p className="mt-2 text-sm font-semibold text-foreground">{operatingHoursLabel}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Working days</p>
                       <p className="mt-2 text-sm font-semibold text-foreground">
                         {Array.isArray(mechanic.operatingDays) && mechanic.operatingDays.length > 0 ? mechanic.operatingDays.join(', ') : 'Not shared'}
                       </p>
                     </div>
                   </div>
                 </div>

                 <div className="rounded-2xl border border-border bg-secondary/30 p-5">
                   <h3 className="flex items-center gap-2 text-xl font-bold">
                     <Star className="h-5 w-5 text-primary" />
                     Coverage & Vehicle Fit
                   </h3>
                   <div className="mt-4 space-y-4">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Supported vehicles</p>
                       <div className="mt-2 flex flex-wrap gap-2">
                         {vehicleEntries.length > 0 ? vehicleEntries.map((vehicle) => (
                           <span key={vehicle} className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground">
                             {vehicle}
                           </span>
                         )) : <span className="text-sm text-muted-foreground">Vehicle types not listed.</span>}
                       </div>
                     </div>
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Service radius</p>
                       <p className="mt-2 text-sm font-semibold text-foreground">
                         {mechanic.serviceRadius ? `${mechanic.serviceRadius} km around service area` : 'Service radius not shared'}
                       </p>
                     </div>
                   </div>
                 </div>

                 <div className="rounded-2xl border border-border bg-secondary/30 p-5">
                   <h3 className="text-xl font-bold">Highlights</h3>
                   <div className="mt-4 flex flex-wrap gap-2">
                     {mechanic.isTrustedPartner ? <span className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">Trusted Partner</span> : null}
                     {mechanic.evSupport ? <span className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-600">EV Support</span> : null}
                     {mechanic.homeService ? <span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-600">Home Service</span> : null}
                     {mechanic.roadsideAssistance ? <span className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-600">Roadside Assistance</span> : null}
                     {mechanic.holidayWorking ? <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">Holiday Working</span> : null}
                     {mechanic.priorityDispatchEligible ? <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600">Priority Dispatch</span> : null}
                     {!mechanic.isTrustedPartner && !mechanic.evSupport && !mechanic.homeService && !mechanic.roadsideAssistance && !mechanic.holidayWorking && !mechanic.priorityDispatchEligible ? (
                       <span className="text-sm text-muted-foreground">Additional highlights will appear here once configured.</span>
                     ) : null}
                   </div>
                 </div>
              </div>
            </div>

            {mechanic.description ? (
              <div className="mt-8 rounded-2xl border border-border bg-secondary/20 p-6">
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  About This Partner
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{mechanic.description}</p>
              </div>
            ) : null}

            <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row gap-4 justify-center">
               <button 
                 onClick={() => navigate(`/map?routeTo=${mechanic.id}`)} 
                 className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
               >
                 View on Interactive Map
               </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <MechanicReviews mechanicId={mechanic.id!} />
        </div>
      </div>
    </div>
  );
}
